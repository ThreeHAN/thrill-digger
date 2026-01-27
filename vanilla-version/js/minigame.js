/**
 * Thrill Digger Game Simulator and Solver
 * A minigame from The Legend of Zelda: Skyward Sword
 */
class ThrillDiggerGame {
    state = {
        gameType: 1,                    // 1=Beginner, 2=Intermediate, 3=Expert
        gameMode: 1,                    // 1=Play, 2=Solve
        holeWidth: 125,                 // Width of each hole in pixels
        holeHeight: 100,                // Height of each hole in pixels
        gridWidth: 5,                   // Number of columns
        gridHeight: 4,                  // Number of rows
        houseFee: 30,                   // Rupees cost to play
        rupoorCount: 0,                 // Number of rupoors (negative value items)
        bombCount: 4,                   // Number of bombs
        grid: [],                       // Game board state
        isGameOver: false,              // Game completion flag
        totalRupeesAllTime: 0,          // Total rupees earned across all games
        currentRupees: 0,               // Rupees in current game
        activeIntervals: new Set()      // Set of active animation intervals
    };

    constructor() {
        // Bind methods to maintain 'this' context
        this.onHoleClick = this.onHoleClick.bind(this);
        this.onResetClick = this.onResetClick.bind(this);
        this.onModeChange = this.onModeChange.bind(this);
        this.onSelectChange = this.onSelectChange.bind(this);
    }

    /**
     * Initialize the game and set up event listeners
     */
    initialize() {
        document.getElementById("resetbutton").addEventListener("click", this.onResetClick);
        document.getElementById("beginner").addEventListener("click", this.onModeChange);
        document.getElementById("intermediate").addEventListener("click", this.onModeChange);
        document.getElementById("expert").addEventListener("click", this.onModeChange);
        document.getElementById("play").addEventListener("click", this.onModeChange);
        document.getElementById("solve").addEventListener("click", this.onModeChange);
        this.startNewGame(null);
    }

    /**
     * Solve the current board using constraint satisfaction
     * Calculates probability of bombs for each uncovered hole
     */
    solveBoardSolver(gameState) {
        let grid = gameState.grid;
        var solvedBoard = grid.slice(0);

        // Clear constraints from revealed items
        for (let i = 0; i < solvedBoard.length; i++) {
            if (solvedBoard[i] === 1 || solvedBoard[i] === -2) {
                let colIndex = i % gameState.gridWidth;
                let rowIndex = Math.floor(i / gameState.gridWidth);

                // Check all 8 neighbors
                for (let colOffset = -1; colOffset <= 1; colOffset++) {
                    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                        if (colIndex + colOffset >= 0 && colIndex + colOffset < gameState.gridWidth &&
                            rowIndex + rowOffset >= 0 && rowIndex + rowOffset < gameState.gridHeight) {
                            if (colOffset !== 0 || rowOffset !== 0) {
                                if (solvedBoard[i] === 1 && solvedBoard[colIndex + colOffset + (rowIndex + rowOffset) * gameState.gridWidth] === -1) {
                                    solvedBoard[colIndex + colOffset + (rowIndex + rowOffset) * gameState.gridWidth] = 0;
                                } else if (solvedBoard[i] === -2 && solvedBoard[colIndex + colOffset + (rowIndex + rowOffset) * gameState.gridWidth] > 1) {
                                    // Rupoor constraint
                                }
                            }
                        }
                    }
                }
            }
        }

        var safeCount = solvedBoard.length;
        var constraints = [];
        var unknownIndices = [];

        // Build constraint list from numbered cells
        for (let i = 0; i < solvedBoard.length; i++) {
            if (solvedBoard[i] > 1) {
                var unknownNeighbors = [];
                var expectedBombs = solvedBoard[i];
                let colIndex = i % gameState.gridWidth;
                let rowIndex = Math.floor(i / gameState.gridWidth);

                for (let colOffset = -1; colOffset <= 1; colOffset++) {
                    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                        if (colIndex + colOffset >= 0 && colIndex + colOffset < gameState.gridWidth &&
                            rowIndex + rowOffset >= 0 && rowIndex + rowOffset < gameState.gridHeight) {
                            if (colOffset !== 0 || rowOffset !== 0) {
                                let neighborIndex = colIndex + colOffset + (rowIndex + rowOffset) * gameState.gridWidth;
                                if (solvedBoard[neighborIndex] === -1) {
                                    unknownNeighbors.push(neighborIndex);
                                    if (unknownIndices.indexOf(neighborIndex) === -1) {
                                        unknownIndices.push(neighborIndex);
                                    }
                                } else if (solvedBoard[neighborIndex] === -2) {
                                    expectedBombs--;
                                }
                            }
                        }
                    }
                }

                if (unknownNeighbors.length > 0) {
                    unknownNeighbors.push(expectedBombs);
                    constraints.push(unknownNeighbors);
                }
            }

            if (solvedBoard[i] !== -1) {
                safeCount--;
            }
        }

        safeCount -= unknownIndices.length;
        var validSolutions = [];
        var computationLimitReached = false;
        var base = 2;
        var unknownCount = unknownIndices.length;
        var totalCombinations = Math.round(Math.pow(base, unknownCount));

        // Alert if computation will be slow
        if (unknownIndices.length >= 22) {
            alert("There's a lot to compute with this board! Your browser will be unresponsive while calculating.\n\n" +
                "Your estimated compute time is " + Math.floor(totalCombinations / 1111111) + " seconds for " + totalCombinations + " computations");
        }

        // Test all possible bomb placements
        for (let combo = 0; combo < totalCombinations; ++combo) {
            if (combo > 1e8) {
                computationLimitReached = true;
                break;
            }

            var placement = [];
            var bombsPlaced = 0;

            for (let bit = 0, remaining = combo; bit < unknownCount; ++bit, remaining = Math.floor(remaining / base)) {
                placement.push(remaining % base);
                if (remaining % base === 1) {
                    bombsPlaced++;
                }
            }

            // Check if this placement satisfies bomb count constraints
            if (bombsPlaced <= gameState.bombCount + gameState.rupoorCount && bombsPlaced >= gameState.bombCount + gameState.rupoorCount - safeCount) {
                var constraintsSatisfied = 0;

                for (let c = 0; c < constraints.length; c++) {
                    let constraint = constraints[c];
                    var bombsNearCell = 0;

                    for (var pos = 0; pos < constraint.length - 1; pos++) {
                        var unknownIndex = unknownIndices.indexOf(constraint[pos]);
                        if (unknownIndex !== -1) {
                            bombsNearCell += placement[unknownIndex];
                        }
                    }

                    var expectedValue = constraint[constraint.length - 1];
                    if (bombsNearCell === expectedValue || bombsNearCell === expectedValue - 1) {
                        constraintsSatisfied++;
                    }
                }

                if (constraintsSatisfied === constraints.length) {
                    validSolutions.push(placement);
                }
            }
        }

        if (computationLimitReached) {
            window.alert("Wow, you've computed 100,000,000 boards! " +
                "The solver is going to stop here.\n\n" +
                "The rest of the boards will not be computed, " +
                "so the probabilities are not entirely accurate!");
        }

        // Validate board
        if (constraints.length > 0 && validSolutions.length === 0) {
            window.alert("Not a valid board!");
            solvedBoard = null;
        } else {
            var remainingExpected = gameState.bombCount + gameState.rupoorCount;

            // Calculate probability for each unknown cell
            for (var unknownPos = 0; unknownPos < unknownIndices.length; unknownPos++) {
                var bombOccurrences = 0;

                for (var solutionIdx = 0; solutionIdx < validSolutions.length; solutionIdx++) {
                    bombOccurrences += validSolutions[solutionIdx][unknownPos];
                }

                if (computationLimitReached && bombOccurrences === 0) {
                    solvedBoard[unknownIndices[unknownPos]] = -2; // Unknown probability marker
                } else {
                    var probability = bombOccurrences / validSolutions.length;
                    remainingExpected -= probability;
                    solvedBoard[unknownIndices[unknownPos]] = probability;
                }
            }

            if (Math.round(remainingExpected * 100) < 0) {
                window.alert("Not a valid board!");
                solvedBoard = null;
            } else {
                var defaultProbability = remainingExpected / safeCount;

                for (var cellIdx = 0; cellIdx < solvedBoard.length; cellIdx++) {
                    if (solvedBoard[cellIdx] === -1) {
                        solvedBoard[cellIdx] = defaultProbability;
                    }
                }
            }
        }

        return solvedBoard;
    }

    /**
     * Create solver UI with dropdowns for manual bomb placement
     */
    createSolverUI(gameState) {
        var bombProbability = (gameState.bombCount + gameState.rupoorCount) / (gameState.gridWidth * gameState.gridHeight);

        for (var cellIdx = 0; cellIdx < gameState.gridWidth * gameState.gridHeight; cellIdx++) {
            var cellDiv = document.createElement("div");
            cellDiv.style.display = "flex";
            cellDiv.style.flexDirection = "column";
            cellDiv.style.justifyContent = "center";
            cellDiv.style.alignItems = "center";
            cellDiv.style.color = "black";

            var probabilityText = document.createElement("p");
            probabilityText.innerHTML = Math.floor(bombProbability * 100) + "% Bad";

            var itemImage = document.createElement("img");
            itemImage.className = "solverimg";
            itemImage.height = "22";
            cellDiv.appendChild(itemImage);
            itemImage.style.display = "none";

            var itemSelect = document.createElement("select");
            itemSelect.className = "solverselect";

            var options = [
                { value: 0, text: "Undug" },
                { value: 1, text: "Green rupee" },
                { value: 5, text: "Blue rupee" },
                { value: 20, text: "Red rupee" },
                { value: 100, text: "Silver rupee" },
                { value: 300, text: "Gold rupee" },
                { value: -10, text: "Rupoor" },
                { value: 0, text: "Bomb" }
            ];

            options.forEach(opt => {
                let option = document.createElement("option");
                option.value = opt.value;
                option.innerHTML = opt.text;
                itemSelect.appendChild(option);
            });

            itemSelect.addEventListener("change", this.onSelectChange);
            cellDiv.appendChild(probabilityText);
            cellDiv.appendChild(itemSelect);
            cellDiv.classList.add("undug");

            var colIndex = cellIdx % gameState.gridWidth;
            var rowIndex = Math.floor(cellIdx / gameState.gridWidth);
            cellDiv.id = "hole_" + colIndex + "_" + rowIndex;
            cellDiv.style.cssFloat = "left";
            cellDiv.style.width = gameState.holeWidth + "px";
            cellDiv.style.height = gameState.holeHeight + "px";

            document.getElementById("diggerarea").appendChild(cellDiv);
            gameState.grid[cellIdx] = -1;
        }
    }

    /**
     * Display bomb probability with color coding
     * Green (0%) to Red (100%)
     */
    displayProbabilityColor(cellElement) {
        var percentageText = cellElement.childNodes[1].innerHTML;
        var percentage = parseInt(percentageText.split("%")[0], 10);

        if (percentage <= 0) {
            cellElement.style.backgroundColor = "green";
        } else if (percentage >= 100) {
            cellElement.style.backgroundColor = "red";
        } else {
            // Convert percentage to HSL color
            var hue = (100 - percentage) * 1.2; // Green (100) to Red (0)
            var saturation = Math.abs(percentage - 50) / 50 * 100;
            var lightness = 70;
            cellElement.style.backgroundColor = "hsl(" + hue + ", " + saturation + "%, " + lightness + "%)";
        }
    }

    /**
     * Update solver UI with calculated probabilities
     */
    updateSolverDisplay(gameState) {
        var success = false;
        var solvedBoard = this.solveBoardSolver(gameState);

        if (solvedBoard !== null) {
            var totalValue = 0;
            var cellElements = document.getElementById("diggerarea").childNodes;

            for (var idx = 0; idx < cellElements.length; idx++) {
                var cellElement = cellElements[idx];
                var cellValue = gameState.grid[idx];
                var probabilityText = cellElement.childNodes[1];
                var itemImage = cellElement.childNodes[0];
                var itemSelect = cellElement.childNodes[2];

                if (cellValue === -1 || cellValue === 0) {
                    probabilityText.style.display = "block";
                    itemImage.style.display = "none";

                    var probability = solvedBoard[idx];
                    if (probability === -2) {
                        probabilityText.innerHTML = "?% Bad";
                    } else {
                        probabilityText.innerHTML = Math.floor(probability * 100) + "% Bad";
                        this.displayProbabilityColor(cellElement);
                    }
                } else {
                    probabilityText.innerHTML = "&nbsp;";
                    probabilityText.style.display = "none";
                    itemImage.style.display = "inline";
                    itemImage.style.margin = "15px";
                    var itemName = itemSelect[itemSelect.selectedIndex].text;
                    itemImage.alt = itemName;
                    itemName = itemName.toLowerCase().replace(/\s+/g, "");
                    itemImage.src = "/img/minigame/" + itemName + ".png";
                }

                if (gameState.isGameOver && cellValue !== -3) {
                    itemSelect.disabled = true;
                } else {
                    itemSelect.disabled = false;
                }

                totalValue += parseInt(itemSelect.value, 10);
            }

            var rupeesDisplay = document.getElementById("rupees");
            rupeesDisplay.innerHTML = totalValue + " Rupees";
            gameState.currentRupees = totalValue;
            success = true;
        }

        return success;
    }

    /**
     * Handle item selection change in solver mode
     */
    onSelectChange(event) {
        let gameState = this.state;
        event = event || window.event;
        var selectElement = event.currentTarget;
        var cellDiv = selectElement.parentNode;
        var selectedText = selectElement[selectElement.selectedIndex].text;
        selectedText = selectedText.toLowerCase().replace(/\s+/g, "");

        var itemValue = -1;
        switch (selectedText) {
            case "bomb":
                itemValue = -3;
                break;
            case "rupoor":
                itemValue = -2;
                break;
            case "undug":
                itemValue = -1;
                break;
            case "greenrupee":
                itemValue = 1;
                break;
            case "bluerupee":
                itemValue = 2;
                break;
            case "redrupee":
                itemValue = 4;
                break;
            case "silverrupee":
                itemValue = 6;
                break;
            case "goldrupee":
                itemValue = 8;
                break;
            default:
                itemValue = -1;
        }

        var cellId = cellDiv.id;
        var coords = cellId.split("_");
        var colIndex = parseInt(coords[1], 10);
        var rowIndex = parseInt(coords[2], 10);
        var cellIndex = colIndex + rowIndex * gameState.gridWidth;

        // Update rupoor count
        if (itemValue === -2 && gameState.grid[cellIndex] !== -2) {
            gameState.rupoorCount--;
        } else if (itemValue !== -2 && gameState.grid[cellIndex] === -2) {
            gameState.rupoorCount++;
        }

        gameState.grid[cellIndex] = itemValue;
        gameState.isGameOver = itemValue === -3;

        if (gameState.isGameOver) {
            var rupeesDisplay = document.getElementById("rupees");
            var netGain = gameState.currentRupees - gameState.houseFee;
            if (netGain > 0) {
                rupeesDisplay.innerHTML = netGain + " rupees gain! (" + gameState.currentRupees + " won - " + gameState.houseFee + " fee)";
            } else {
                rupeesDisplay.innerHTML = netGain + " rupees lost! (" + gameState.currentRupees + " won - " + gameState.houseFee + " fee)";
            }
        } else {
            var displaySuccess = this.updateSolverDisplay(gameState);
            if (!displaySuccess) {
                cellDiv.style.backgroundColor = "purple";
            }
        }

        this.state.rupoorCount = gameState.rupoorCount;
        this.state.grid = gameState.grid;
        this.state.isGameOver = gameState.isGameOver;
        this.state.currentRupees = gameState.currentRupees;
    }

    /**
     * Handle hole click in play mode
     */
    onHoleClick(event) {
        let gameState = this.state;
        event = event || window.event;
        var holeElement = event.currentTarget;
        holeElement.removeEventListener("click", this.onHoleClick);
        holeElement.className = "";

        var unrevealedHoles = document.getElementsByClassName("undug");
        var holeId = holeElement.id;
        var coords = holeId.split("_");
        var colIndex = parseInt(coords[1], 10);
        var rowIndex = parseInt(coords[2], 10);
        var cellIndex = colIndex + rowIndex * gameState.gridWidth;
        var itemValue = gameState.grid[cellIndex];

        // Deduct rupoor penalty
        if (itemValue === -10) {
            gameState.rupoorCount--;
        }

        var rupeesDisplay = document.getElementById("rupees");

        // Check win condition or game over
        if (itemValue === -1 || unrevealedHoles.length === gameState.bombCount + gameState.rupoorCount) {
            if (itemValue === -1) {
                holeElement.style.border = "2px solid red";
                holeElement.style.borderRadius = "0.25rem";
            }

            holeElement.className = "undug";
            this.revealBoard(gameState);

            var netGain = gameState.currentRupees - gameState.houseFee;
            if (netGain > 0) {
                rupeesDisplay.innerHTML = netGain + " rupees gain! (" + gameState.currentRupees + " won - " + gameState.houseFee + " fee)";
            } else {
                rupeesDisplay.innerHTML = netGain + " rupees lost! (" + gameState.currentRupees + " won - " + gameState.houseFee + " fee)";
            }

            gameState.totalRupeesAllTime += netGain;
            document.getElementById("rupeetotal").innerHTML = gameState.totalRupeesAllTime + " Rupees All Time";
        } else {
            // Safe dig - reveal item
            var cellContents = holeElement.childNodes;
            var textElement = cellContents[0];
            var itemName = this.getItemName(itemValue);
            var imageElement = cellContents[1];
            imageElement.alt = itemName;

            textElement.innerHTML = itemName;
            itemName = itemName.toLowerCase().replace(/\s+/g, "");
            imageElement.src = "/img/minigame/" + itemName + ".png";

            this.fadeElement(textElement, "out", 1800, gameState);
            this.fadeElement(imageElement, "out", 1800, gameState);

            gameState.currentRupees += itemValue;
            if (gameState.currentRupees < 0) {
                gameState.currentRupees = 0;
            }

            rupeesDisplay.innerHTML = gameState.currentRupees + " Rupees";
            this.state.rupoorCount = gameState.rupoorCount;
            this.state.totalRupeesAllTime = gameState.totalRupeesAllTime;
            this.state.currentRupees = gameState.currentRupees;
            this.state.activeIntervals = gameState.activeIntervals;
        }
    }

    /**
     * Fade element in or out
     */
    fadeElement(element, direction, duration, gameState) {
        var isIn = direction === "in";
        var opacity = isIn ? 0 : 0.6;
        var frameTime = 50;
        var frameCount = duration / frameTime;
        var opacityStep = opacity / frameCount;

        if (isIn) {
            element.style.opacity = opacity;
        }

        function updateOpacity() {
            opacity = isIn ? opacity + opacityStep : opacity - opacityStep;
            element.style.opacity = opacity;

            if (opacity <= 0 || opacity >= 0.7) {
                window.clearInterval(intervalId);
                gameState.activeIntervals.delete(intervalId);
            }
        }

        var intervalId = window.setInterval(updateOpacity, frameTime);
        gameState.activeIntervals.add(intervalId);
    }

    /**
     * Get random integer between min and max (inclusive)
     */
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Get human-readable item name from value
     */
    getItemName(value) {
        switch (value) {
            case -10:
                return "Rupoor";
            case -1:
                return "Bomb";
            case 1:
                return "Green rupee";
            case 5:
                return "Blue rupee";
            case 20:
                return "Red rupee";
            case 100:
                return "Silver rupee";
            case 300:
                return "Gold rupee";
            default:
                return "Error";
        }
    }

    /**
     * Reveal entire board and show all items
     */
    revealBoard(gameState) {
        var holeElements = document.getElementById("diggerarea").childNodes;

        // Clear all active animations
        for (var intervalId of gameState.activeIntervals.values()) {
            window.clearInterval(intervalId);
        }
        gameState.activeIntervals.clear();

        // Reveal all holes
        for (var idx = 0; idx < holeElements.length; idx++) {
            var holeElement = holeElements[idx];
            holeElement.removeEventListener("click", this.onHoleClick);

            var textElement = holeElement.childNodes[0];

            if (holeElement.className !== "undug") {
                holeElement.className = "dug";
                this.fadeElement(textElement, "in", 200, gameState);
                this.fadeElement(holeElement.childNodes[1], "in", 200, gameState);
                textElement.style.textDecoration = "line-through";
            } else {
                // Show unrevealed item
                var holeId = holeElement.id;
                var coords = holeId.split("_");
                var colIndex = parseInt(coords[1], 10);
                var rowIndex = parseInt(coords[2], 10);
                var cellIndex = colIndex + rowIndex * gameState.gridWidth;
                var itemValue = gameState.grid[cellIndex];
                var itemName = this.getItemName(itemValue);

                textElement.innerHTML = itemName;
                holeElement.childNodes[1].alt = itemName;
                itemName = itemName.toLowerCase().replace(/\s+/g, "");
                holeElement.childNodes[1].src = "/img/minigame/" + itemName + ".png";
            }
        }
    }

    /**
     * Generate random board with bombs and rupoors
     */
    generateBoard(gameState) {
        // Place bombs
        while (gameState.bombCount > 0) {
            let randomIndex = this.getRandomInt(0, gameState.gridWidth * gameState.gridHeight - 1);
            if (gameState.grid[randomIndex] === 0) {
                gameState.grid[randomIndex] = -1; // Bomb
                gameState.bombCount--;
            }
        }

        // Place rupoors
        while (gameState.rupoorCount > 0) {
            let randomIndex = this.getRandomInt(0, gameState.gridWidth * gameState.gridHeight - 1);
            if (gameState.grid[randomIndex] === 0) {
                gameState.grid[randomIndex] = -10; // Rupoor
                gameState.rupoorCount--;
            }
        }

        // Fill remaining cells with rupee values based on nearby bombs/rupoors
        for (var cellIdx = 0; cellIdx < gameState.gridWidth * gameState.gridHeight; cellIdx++) {
            var cellDiv = document.createElement("div");
            cellDiv.style.display = "flex";
            cellDiv.style.flexDirection = "column";
            cellDiv.style.justifyContent = "center";
            cellDiv.style.alignItems = "center";

            var cellText = document.createElement("p");
            cellText.innerHTML = "Undug";
            cellDiv.appendChild(cellText);

            var cellImage = document.createElement("img");
            cellImage.alt = "Undug hole";
            cellImage.src = "/img/minigame/undug.png";
            cellImage.height = "30";
            cellImage.width = "30";
            cellDiv.appendChild(cellImage);
            cellDiv.className = "undug";

            var colIndex = cellIdx % gameState.gridWidth;
            var rowIndex = Math.floor(cellIdx / gameState.gridWidth);
            cellDiv.id = "hole_" + colIndex + "_" + rowIndex;
            cellDiv.style.cssFloat = "left";

            // Assign rupee values based on adjacent bombs
            if (gameState.grid[cellIdx] >= 0) {
                var nearbyBombs = 0;

                for (var colOffset = -1; colOffset <= 1; colOffset++) {
                    for (var rowOffset = -1; rowOffset <= 1; rowOffset++) {
                        if (colIndex + colOffset >= 0 && colIndex + colOffset < gameState.gridWidth &&
                            rowIndex + rowOffset >= 0 && rowIndex + rowOffset < gameState.gridHeight) {
                            if (colOffset !== 0 || rowOffset !== 0) {
                                var neighborValue = gameState.grid[colIndex + colOffset + (rowIndex + rowOffset) * gameState.gridWidth];
                                if (neighborValue < 0) {
                                    nearbyBombs++;
                                }
                            }
                        }
                    }
                }

                if (nearbyBombs > 0 && nearbyBombs <= 2) {
                    gameState.grid[cellIdx] = 5; // Blue rupee
                } else if (nearbyBombs > 2 && nearbyBombs <= 4) {
                    gameState.grid[cellIdx] = 20; // Red rupee
                } else if (nearbyBombs > 4 && nearbyBombs <= 6) {
                    gameState.grid[cellIdx] = 100; // Silver rupee
                } else if (nearbyBombs > 6 && nearbyBombs <= 8) {
                    gameState.grid[cellIdx] = 300; // Gold rupee
                } else {
                    gameState.grid[cellIdx] = 1; // Green rupee
                }
            }

            cellDiv.addEventListener("click", this.onHoleClick);
            cellDiv.style.width = gameState.holeWidth + "px";
            cellDiv.style.height = gameState.holeHeight + "px";
            document.getElementById("diggerarea").appendChild(cellDiv);
        }
    }

    /**
     * Configure game based on difficulty level
     */
    configureDifficulty(gameState) {
        switch (gameState.gameType) {
            case 2: // Intermediate
                gameState.houseFee = 50;
                gameState.gridWidth = 6;
                gameState.gridHeight = 5;
                gameState.rupoorCount = 4;
                gameState.bombCount = 4;
                gameState.grid = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                break;
            case 3: // Expert
                gameState.houseFee = 70;
                gameState.gridWidth = 8;
                gameState.gridHeight = 5;
                gameState.rupoorCount = 8;
                gameState.bombCount = 8;
                gameState.grid = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                break;
            default: // Beginner
                gameState.gameType = 1;
                gameState.houseFee = 30;
                gameState.gridWidth = 5;
                gameState.gridHeight = 4;
                gameState.rupoorCount = 0;
                gameState.bombCount = 4;
                gameState.grid = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }

        gameState.currentRupees = 0;
        gameState.isGameOver = false;
        var gameArea = document.getElementById("diggerarea");
        gameArea.style.width = gameState.gridWidth * gameState.holeWidth + "px";
        gameArea.style.height = gameState.gridHeight * gameState.holeHeight + "px";
    }

    /**
     * Clear the game board
     */
    clearBoard() {
        var gameArea = document.getElementById("diggerarea");
        while (gameArea.firstChild) {
            gameArea.removeChild(gameArea.firstChild);
        }
    }

    /**
     * Handle reset button click
     */
    onResetClick(event) {
        this.startNewGame(null);
    }

    /**
     * Start a new game with current settings
     */
    startNewGame(stateOverride) {
        this.clearBoard();

        if (stateOverride === null || stateOverride === undefined) {
            stateOverride = this.state;
        }

        this.configureDifficulty(stateOverride);

        if (stateOverride.gameMode === 1) {
            // Play mode
            this.generateBoard(stateOverride);
        } else {
            // Solve mode
            this.createSolverUI(stateOverride);
            this.updateSolverDisplay(stateOverride);
        }

        document.getElementById("rupees").innerHTML = "0 Rupees";
        this.state.gameMode = stateOverride.gameMode;
        this.state.gameType = stateOverride.gameType;
        this.state.houseFee = stateOverride.houseFee;
        this.state.gridWidth = stateOverride.gridWidth;
        this.state.gridHeight = stateOverride.gridHeight;
        this.state.rupoorCount = stateOverride.rupoorCount;
        this.state.bombCount = stateOverride.bombCount;
        this.state.grid = stateOverride.grid;
        this.state.currentRupees = stateOverride.currentRupees;
        this.state.isGameOver = stateOverride.isGameOver;
    }

    /**
     * Handle mode or difficulty change
     */
    onModeChange(event) {
        let stateOverride = this.state;

        // Determine game mode (Play vs Solve)
        if (document.getElementById("play").checked) {
            stateOverride.gameMode = 1;
        } else {
            stateOverride.gameMode = 2;
        }

        // Determine difficulty (Beginner, Intermediate, Expert)
        if (document.getElementById("beginner").checked) {
            stateOverride.gameType = 1;
        } else if (document.getElementById("intermediate").checked) {
            stateOverride.gameType = 2;
        } else {
            stateOverride.gameType = 3;
        }

        this.startNewGame(stateOverride);
    }
}

/**
 * Initialize the game when page loads
 */
window.onload = function() {
    let game = new ThrillDiggerGame();
    game.initialize();
};

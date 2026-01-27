/**
 * Register service worker for offline support and PWA functionality
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js');
    });
}

/**
 * Thrill Digger Game Controller
 * Manages game state, board generation, and user interactions
 */
class ThrillDiggerController {
    state = {
        gameDifficulty: 1,           // 1=Beginner, 2=Intermediate, 3=Expert
        gameType: 1,                 // 1=Play, 2=Solve
        holeWidth: 125,              // Width of each hole in pixels
        holeHeight: 100,             // Height of each hole in pixels
        boardWidth: 5,               // Number of columns
        boardHeight: 4,              // Number of rows
        houseFee: 30,                // Cost to play (rupees)
        rupoorCount: 0,              // Number of rupoors (penalty items)
        bombCount: 4,                // Number of bombs
        gameBoard: [],               // 1D array representing the game board
        isGameOver: false,           // Whether the game has ended
        totalRupeesAllTime: 0,       // Cumulative rupees across all games
        currentGameRupees: 0,        // Rupees earned in current game
        activeAnimationIntervals: new Set()  // Track active fade animations
    };

    constructor() {
        // Bind methods to maintain 'this' context
        this.onHoleClick = this.onHoleClick.bind(this);
        this.onResetClick = this.onResetClick.bind(this);
        this.onGameTypeChange = this.onGameTypeChange.bind(this);
        this.onItemChange = this.onItemChange.bind(this);
    }

    /**
     * Initialize the game on page load
     * Sets up event listeners and starts a new game
     */
    initialize() {
        document.getElementById('resetbutton').addEventListener('click', this.onResetClick);
        document.getElementById('beginner').addEventListener('click', this.onGameTypeChange);
        document.getElementById('intermediate').addEventListener('click', this.onGameTypeChange);
        document.getElementById('expert').addEventListener('click', this.onGameTypeChange);
        document.getElementById('play').addEventListener('click', this.onGameTypeChange);
        document.getElementById('solve').addEventListener('click', this.onGameTypeChange);
        this.startNewGame(null);
    }

    /**
     * Solve the current board using constraint satisfaction algorithm
     * Calculates bomb probability for each unknown cell
     */
    solveBoardProbabilities(gameState) {
        let boardCopy = gameState.gameBoard.slice(0);

        // Clear constraints from revealed cells
        for (let i = 0; i < boardCopy.length; i++) {
            if (boardCopy[i] === 1 || boardCopy[i] === -2) {
                let colIndex = i % gameState.boardWidth;
                let rowIndex = Math.floor(i / gameState.boardWidth);

                for (let colOffset = -1; colOffset <= 1; colOffset++) {
                    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                        if (colIndex + colOffset >= 0 && colIndex + colOffset < gameState.boardWidth &&
                            rowIndex + rowOffset >= 0 && rowIndex + rowOffset < gameState.boardHeight) {
                            if (colOffset !== 0 || rowOffset !== 0) {
                                if (boardCopy[i] === 1 && boardCopy[colIndex + colOffset + (rowIndex + rowOffset) * gameState.boardWidth] === -1) {
                                    boardCopy[colIndex + colOffset + (rowIndex + rowOffset) * gameState.boardWidth] = 0;
                                }
                            }
                        }
                    }
                }
            }
        }

        let safeCount = boardCopy.length;
        let constraints = [];
        let unknownIndices = [];

        // Build constraints from numbered cells
        for (let i = 0; i < boardCopy.length; i++) {
            if (boardCopy[i] > 1) {
                let unknownNeighbors = [];
                let expectedBombs = boardCopy[i];
                let colIndex = i % gameState.boardWidth;
                let rowIndex = Math.floor(i / gameState.boardWidth);

                for (let colOffset = -1; colOffset <= 1; colOffset++) {
                    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                        if (colIndex + colOffset >= 0 && colIndex + colOffset < gameState.boardWidth &&
                            rowIndex + rowOffset >= 0 && rowIndex + rowOffset < gameState.boardHeight) {
                            if (colOffset !== 0 || rowOffset !== 0) {
                                let neighborIndex = colIndex + colOffset + (rowIndex + rowOffset) * gameState.boardWidth;
                                if (boardCopy[neighborIndex] === -1) {
                                    unknownNeighbors.push(neighborIndex);
                                    if (unknownIndices.indexOf(neighborIndex) === -1) {
                                        unknownIndices.push(neighborIndex);
                                    }
                                } else if (boardCopy[neighborIndex] === -2) {
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

            if (boardCopy[i] !== -1) {
                safeCount--;
            }
        }

        safeCount -= unknownIndices.length;
        let validSolutions = [];
        let computationLimitReached = false;
        let unknownCount = unknownIndices.length;
        let totalCombinations = Math.round(Math.pow(2, unknownCount));

        if (unknownIndices.length >= 22) {
            alert('There\'s a lot to compute with this board! Your browser will be unresponsive while calculating.\n\n' +
                'Your estimated compute time is ' + Math.floor(totalCombinations / 1111111) + ' seconds for ' + totalCombinations + ' computations');
        }

        // Test all possible bomb placements
        for (let combo = 0; combo < totalCombinations; ++combo) {
            if (combo > 1e8) {
                computationLimitReached = true;
                break;
            }

            let placement = [];
            let bombsPlaced = 0;

            for (let bit = 0, remaining = combo; bit < unknownCount; ++bit, remaining = Math.floor(remaining / 2)) {
                placement.push(remaining % 2);
                if (remaining % 2 === 1) {
                    bombsPlaced++;
                }
            }

            if (bombsPlaced <= gameState.bombCount + gameState.rupoorCount && bombsPlaced >= gameState.bombCount + gameState.rupoorCount - safeCount) {
                let constraintsSatisfied = 0;

                for (let c = 0; c < constraints.length; c++) {
                    let constraint = constraints[c];
                    let bombsNearCell = 0;

                    for (let pos = 0; pos < constraint.length - 1; pos++) {
                        let unknownIndex = unknownIndices.indexOf(constraint[pos]);
                        if (unknownIndex !== -1) {
                            bombsNearCell += placement[unknownIndex];
                        }
                    }

                    let expectedValue = constraint[constraint.length - 1];
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
            window.alert('Wow, you\'ve computed 100,000,000 boards! ' +
                'The solver is going to stop here.\n\n' +
                'The rest of the boards will not be computed, ' +
                'so the probabilities are not entirely accurate!');
        }

        if (constraints.length > 0 && validSolutions.length === 0) {
            window.alert('Not a valid board!');
            boardCopy = null;
        } else {
            let remainingExpected = gameState.bombCount + gameState.rupoorCount;

            for (let unknownPos = 0; unknownPos < unknownIndices.length; unknownPos++) {
                let bombOccurrences = 0;

                for (let solutionIdx = 0; solutionIdx < validSolutions.length; solutionIdx++) {
                    bombOccurrences += validSolutions[solutionIdx][unknownPos];
                }

                if (computationLimitReached && bombOccurrences === 0) {
                    boardCopy[unknownIndices[unknownPos]] = -2;
                } else {
                    let probability = bombOccurrences / validSolutions.length;
                    remainingExpected -= probability;
                    boardCopy[unknownIndices[unknownPos]] = probability;
                }
            }

            if (Math.round(remainingExpected * 100) < 0) {
                window.alert('Not a valid board!');
                boardCopy = null;
            } else {
                let defaultProbability = remainingExpected / safeCount;

                for (let cellIdx = 0; cellIdx < boardCopy.length; cellIdx++) {
                    if (boardCopy[cellIdx] === -1) {
                        boardCopy[cellIdx] = defaultProbability;
                    }
                }
            }
        }

        return boardCopy;
    }

    /**
     * Create solver UI with probability indicators and item dropdowns
     */
    createSolverBoard(gameState) {
        let initialProbability = (gameState.bombCount + gameState.rupoorCount) / (gameState.boardWidth * gameState.boardHeight);

        for (let cellIdx = 0; cellIdx < gameState.boardWidth * gameState.boardHeight; cellIdx++) {
            let cellDiv = document.createElement('div');
            cellDiv.style.display = 'flex';
            cellDiv.style.flexDirection = 'column';
            cellDiv.style.justifyContent = 'center';
            cellDiv.style.alignItems = 'center';
            cellDiv.style.color = 'black';

            let probabilityText = document.createElement('p');
            probabilityText.innerHTML = Math.floor(initialProbability * 100) + '% Bad';

            let itemImage = document.createElement('img');
            itemImage.className = 'solverimg';
            itemImage.height = '22';
            cellDiv.appendChild(itemImage);
            itemImage.style.display = 'none';

            let itemSelect = document.createElement('select');
            itemSelect.className = 'solverselect';

            const options = [
                { value: 0, text: 'Undug' },
                { value: 1, text: 'Green rupee' },
                { value: 5, text: 'Blue rupee' },
                { value: 20, text: 'Red rupee' },
                { value: 100, text: 'Silver rupee' },
                { value: 300, text: 'Gold rupee' },
                { value: -10, text: 'Rupoor' },
                { value: 0, text: 'Bomb' }
            ];

            options.forEach(opt => {
                let option = document.createElement('option');
                option.value = opt.value;
                option.innerHTML = opt.text;
                itemSelect.appendChild(option);
            });

            itemSelect.addEventListener('change', this.onItemChange);
            cellDiv.appendChild(probabilityText);
            cellDiv.appendChild(itemSelect);
            cellDiv.classList.add('undug');

            let colIndex = cellIdx % gameState.boardWidth;
            let rowIndex = Math.floor(cellIdx / gameState.boardWidth);
            cellDiv.id = 'hole_' + colIndex + '_' + rowIndex;
            cellDiv.style.cssFloat = 'left';
            cellDiv.style.width = gameState.holeWidth + 'px';
            cellDiv.style.height = gameState.holeHeight + 'px';

            document.getElementById('diggerarea').appendChild(cellDiv);
            gameState.gameBoard[cellIdx] = -1;
        }
    }

    /**
     * Color code a cell based on bomb probability
     */
    setProbabilityColor(cellElement) {
        let percentageText = cellElement.childNodes[1].innerHTML;
        let percentage = parseInt(percentageText.split('%')[0], 10);

        if (percentage <= 0) {
            cellElement.style.backgroundColor = 'green';
        } else if (percentage >= 100) {
            cellElement.style.backgroundColor = 'red';
        } else {
            let hue = (100 - percentage) * 1.2;
            let saturation = Math.abs(percentage - 50) / 50 * 100;
            cellElement.style.backgroundColor = 'hsl(' + hue + ', ' + saturation + '%, 70%)';
        }
    }

    /**
     * Update solver UI with calculated probabilities
     */
    updateSolverDisplay(gameState) {
        let success = false;
        let solvedBoard = this.solveBoardProbabilities(gameState);

        if (solvedBoard !== null) {
            let totalValue = 0;
            let cellElements = document.getElementById('diggerarea').childNodes;

            for (let idx = 0; idx < cellElements.length; idx++) {
                let cellElement = cellElements[idx];
                let cellValue = gameState.gameBoard[idx];
                let probabilityText = cellElement.childNodes[1];
                let itemImage = cellElement.childNodes[0];
                let itemSelect = cellElement.childNodes[2];

                if (cellValue === -1 || cellValue === 0) {
                    probabilityText.style.display = 'block';
                    itemImage.style.display = 'none';

                    let probability = solvedBoard[idx];
                    if (probability === -2) {
                        probabilityText.innerHTML = '?% Bad';
                    } else {
                        probabilityText.innerHTML = Math.floor(probability * 100) + '% Bad';
                        this.setProbabilityColor(cellElement);
                    }
                } else {
                    probabilityText.innerHTML = '&nbsp;';
                    probabilityText.style.display = 'none';
                    itemImage.style.display = 'inline';
                    itemImage.style.margin = '15px';
                    let itemName = itemSelect[itemSelect.selectedIndex].text;
                    itemImage.alt = itemName;
                    itemName = itemName.toLowerCase().replace(/\s+/g, '');
                    itemImage.src = './img/minigame/' + itemName + '.png';
                }

                if (gameState.isGameOver && cellValue !== -3) {
                    itemSelect.disabled = true;
                } else {
                    itemSelect.disabled = false;
                }

                totalValue += parseInt(itemSelect.value, 10);
            }

            let rupeesDisplay = document.getElementById('rupees');
            rupeesDisplay.innerHTML = totalValue + ' Rupees';
            gameState.currentGameRupees = totalValue;
            success = true;
        }

        return success;
    }

    /**
     * Handle item change in solver mode
     */
    onItemChange(event) {
        let gameState = this.state;
        event = event || window.event;
        let selectElement = event.currentTarget;
        let cellDiv = selectElement.parentNode;
        let selectedText = selectElement[selectElement.selectedIndex].text;
        selectedText = selectedText.toLowerCase().replace(/\s+/g, '');

        let itemValue = -1;
        switch (selectedText) {
            case 'bomb':
                itemValue = -3;
                break;
            case 'rupoor':
                itemValue = -2;
                break;
            case 'undug':
                itemValue = -1;
                break;
            case 'greenrupee':
                itemValue = 1;
                break;
            case 'bluerupee':
                itemValue = 2;
                break;
            case 'redrupee':
                itemValue = 4;
                break;
            case 'silverrupee':
                itemValue = 6;
                break;
            case 'goldrupee':
                itemValue = 8;
                break;
            default:
                itemValue = -1;
        }

        let cellId = cellDiv.id;
        let coords = cellId.split('_');
        let colIndex = parseInt(coords[1], 10);
        let rowIndex = parseInt(coords[2], 10);

        if (itemValue === -2 && gameState.gameBoard[colIndex + rowIndex * gameState.boardWidth] !== -2) {
            gameState.rupoorCount--;
        } else if (itemValue !== -2 && gameState.gameBoard[colIndex + rowIndex * gameState.boardWidth] === -2) {
            gameState.rupoorCount++;
        }

        gameState.gameBoard[colIndex + rowIndex * gameState.boardWidth] = itemValue;
        gameState.isGameOver = itemValue === -3;

        if (gameState.isGameOver) {
            let rupeesDisplay = document.getElementById('rupees');
            let netGain = gameState.currentGameRupees - gameState.houseFee;
            if (netGain > 0) {
                rupeesDisplay.innerHTML = netGain + ' rupees gain! (' + gameState.currentGameRupees + ' won - ' + gameState.houseFee + ' fee)';
            } else {
                rupeesDisplay.innerHTML = netGain + ' rupees lost! (' + gameState.currentGameRupees + ' won - ' + gameState.houseFee + ' fee)';
            }
        } else {
            let displaySuccess = this.updateSolverDisplay(gameState);
            if (!displaySuccess) {
                cellDiv.style.backgroundColor = 'purple';
            }
        }

        this.state.rupoorCount = gameState.rupoorCount;
        this.state.gameBoard = gameState.gameBoard;
        this.state.isGameOver = gameState.isGameOver;
        this.state.currentGameRupees = gameState.currentGameRupees;
    }

    /**
     * Handle hole click in play mode
     */
    onHoleClick(event) {
        let gameState = this.state;
        event = event || window.event;
        let holeElement = event.currentTarget;
        holeElement.removeEventListener('click', this.onHoleClick);
        holeElement.className = '';

        let unrevealedHoles = document.getElementsByClassName('undug');
        let holeId = holeElement.id;
        let coords = holeId.split('_');
        let colIndex = parseInt(coords[1], 10);
        let rowIndex = parseInt(coords[2], 10);
        let cellIndex = colIndex + rowIndex * gameState.boardWidth;
        let itemValue = gameState.gameBoard[cellIndex];

        if (itemValue === -10) {
            gameState.rupoorCount--;
        }

        let rupeesDisplay = document.getElementById('rupees');

        // Win or game over condition
        if (itemValue === -1 || unrevealedHoles.length === gameState.bombCount + gameState.rupoorCount) {
            if (itemValue === -1) {
                holeElement.style.border = '2px solid red';
                holeElement.style.borderRadius = '0.25rem';
            }

            holeElement.className = 'undug';
            this.revealBoard(gameState);

            let netGain = gameState.currentGameRupees - gameState.houseFee;
            if (netGain > 0) {
                rupeesDisplay.innerHTML = netGain + ' rupees gain! (' + gameState.currentGameRupees + ' won - ' + gameState.houseFee + ' fee)';
            } else {
                rupeesDisplay.innerHTML = netGain + ' rupees lost! (' + gameState.currentGameRupees + ' won - ' + gameState.houseFee + ' fee)';
            }

            gameState.totalRupeesAllTime += netGain;
            document.getElementById('rupeetotal').innerHTML = gameState.totalRupeesAllTime + ' Rupees All Time';
        } else {
            // Safe dig - reveal item
            let cellContents = holeElement.childNodes;
            let textElement = cellContents[0];
            let itemName = this.getItemName(itemValue);
            let imageElement = cellContents[1];
            imageElement.alt = itemName;

            textElement.innerHTML = itemName;
            itemName = itemName.toLowerCase().replace(/\s+/g, '');
            imageElement.src = './img/minigame/' + itemName + '.png';

            this.fadeElement(textElement, 'out', 1800, gameState);
            this.fadeElement(imageElement, 'out', 1800, gameState);

            gameState.currentGameRupees += itemValue;
            if (gameState.currentGameRupees < 0) {
                gameState.currentGameRupees = 0;
            }

            rupeesDisplay.innerHTML = gameState.currentGameRupees + ' Rupees';
            this.state.rupoorCount = gameState.rupoorCount;
            this.state.totalRupeesAllTime = gameState.totalRupeesAllTime;
            this.state.currentGameRupees = gameState.currentGameRupees;
            this.state.activeAnimationIntervals = gameState.activeAnimationIntervals;
        }
    }

    /**
     * Fade element in or out
     */
    fadeElement(element, direction, duration, gameState) {
        let isIn = direction === 'in';
        let opacity = isIn ? 0 : 0.6;
        let opacityStep = 50 / duration;

        if (isIn) {
            element.style.opacity = opacity;
        }

        let intervalId = window.setInterval(() => {
            opacity = isIn ? opacity + opacityStep : opacity - opacityStep;
            element.style.opacity = opacity;

            if (opacity <= 0 || opacity >= 0.7) {
                window.clearInterval(intervalId);
                gameState.activeAnimationIntervals.delete(intervalId);
            }
        }, 50);

        gameState.activeAnimationIntervals.add(intervalId);
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
                return 'Rupoor';
            case -1:
                return 'Bomb';
            case 1:
                return 'Green rupee';
            case 5:
                return 'Blue rupee';
            case 20:
                return 'Red rupee';
            case 100:
                return 'Silver rupee';
            case 300:
                return 'Gold rupee';
            default:
                return 'Error';
        }
    }

    /**
     * Reveal entire board at game end
     */
    revealBoard(gameState) {
        let holeElements = document.getElementById('diggerarea').childNodes;

        // Clear all active animations
        for (let intervalId of gameState.activeAnimationIntervals.values()) {
            window.clearInterval(intervalId);
        }
        gameState.activeAnimationIntervals.clear();

        for (let idx = 0; idx < holeElements.length; idx++) {
            let holeElement = holeElements[idx];
            holeElement.removeEventListener('click', this.onHoleClick);

            let textElement = holeElement.childNodes[0];

            if (holeElement.className !== 'undug') {
                holeElement.className = 'dug';
                this.fadeElement(textElement, 'in', 200, gameState);
                this.fadeElement(holeElement.childNodes[1], 'in', 200, gameState);
                textElement.style.textDecoration = 'line-through';
            } else {
                let holeId = holeElement.id;
                let coords = holeId.split('_');
                let colIndex = parseInt(coords[1], 10);
                let rowIndex = parseInt(coords[2], 10);
                let cellIndex = colIndex + rowIndex * gameState.boardWidth;
                let itemValue = gameState.gameBoard[cellIndex];
                let itemName = this.getItemName(itemValue);

                textElement.innerHTML = itemName;
                holeElement.childNodes[1].alt = itemName;
                itemName = itemName.toLowerCase().replace(/\s+/g, '');
                holeElement.childNodes[1].src = './img/minigame/' + itemName + '.png';
            }
        }
    }

    /**
     * Generate random play board with bombs and rupoors
     */
    generatePlayBoard(gameState) {
        // Place bombs randomly
        while (gameState.bombCount > 0) {
            let randomIndex = this.getRandomInt(0, gameState.boardWidth * gameState.boardHeight - 1);
            if (gameState.gameBoard[randomIndex] === 0) {
                gameState.gameBoard[randomIndex] = -1; // Bomb
                gameState.bombCount--;
            }
        }

        // Place rupoors randomly
        while (gameState.rupoorCount > 0) {
            let randomIndex = this.getRandomInt(0, gameState.boardWidth * gameState.boardHeight - 1);
            if (gameState.gameBoard[randomIndex] === 0) {
                gameState.gameBoard[randomIndex] = -10; // Rupoor
                gameState.rupoorCount--;
            }
        }

        // Fill remaining cells with rupee values based on nearby bombs
        for (let cellIdx = 0; cellIdx < gameState.boardWidth * gameState.boardHeight; cellIdx++) {
            let cellDiv = document.createElement('div');
            cellDiv.style.display = 'flex';
            cellDiv.style.flexDirection = 'column';
            cellDiv.style.justifyContent = 'center';
            cellDiv.style.alignItems = 'center';

            let cellText = document.createElement('p');
            cellText.innerHTML = 'Undug';
            cellDiv.appendChild(cellText);

            let cellImage = document.createElement('img');
            cellImage.alt = 'Undug hole';
            cellImage.src = './img/minigame/undug.png';
            cellImage.height = '30';
            cellImage.width = '30';
            cellDiv.appendChild(cellImage);
            cellDiv.className = 'undug';

            let colIndex = cellIdx % gameState.boardWidth;
            let rowIndex = Math.floor(cellIdx / gameState.boardWidth);
            cellDiv.id = 'hole_' + colIndex + '_' + rowIndex;
            cellDiv.style.cssFloat = 'left';

            // Calculate rupee value based on nearby bombs
            if (gameState.gameBoard[cellIdx] >= 0) {
                let nearbyBombs = 0;

                for (let colOffset = -1; colOffset <= 1; colOffset++) {
                    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                        if (colIndex + colOffset >= 0 && colIndex + colOffset < gameState.boardWidth &&
                            rowIndex + rowOffset >= 0 && rowIndex + rowOffset < gameState.boardHeight) {
                            if (colOffset !== 0 || rowOffset !== 0) {
                                let neighborValue = gameState.gameBoard[colIndex + colOffset + (rowIndex + rowOffset) * gameState.boardWidth];
                                if (neighborValue < 0) {
                                    nearbyBombs++;
                                }
                            }
                        }
                    }
                }

                if (nearbyBombs > 0 && nearbyBombs <= 2) {
                    gameState.gameBoard[cellIdx] = 5;
                } else if (nearbyBombs > 2 && nearbyBombs <= 4) {
                    gameState.gameBoard[cellIdx] = 20;
                } else if (nearbyBombs > 4 && nearbyBombs <= 6) {
                    gameState.gameBoard[cellIdx] = 100;
                } else if (nearbyBombs > 6 && nearbyBombs <= 8) {
                    gameState.gameBoard[cellIdx] = 300;
                } else {
                    gameState.gameBoard[cellIdx] = 1;
                }
            }

            cellDiv.addEventListener('click', this.onHoleClick);
            cellDiv.style.width = gameState.holeWidth + 'px';
            cellDiv.style.height = gameState.holeHeight + 'px';
            document.getElementById('diggerarea').appendChild(cellDiv);
        }
    }

    /**
     * Configure game settings based on difficulty
     */
    configureDifficulty(gameState) {
        switch (gameState.gameDifficulty) {
            case 2: // Intermediate
                gameState.houseFee = 50;
                gameState.boardWidth = 6;
                gameState.boardHeight = 5;
                gameState.rupoorCount = 4;
                gameState.bombCount = 4;
                gameState.gameBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                break;
            case 3: // Expert
                gameState.houseFee = 70;
                gameState.boardWidth = 8;
                gameState.boardHeight = 5;
                gameState.rupoorCount = 8;
                gameState.bombCount = 8;
                gameState.gameBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                break;
            default: // Beginner
                gameState.gameDifficulty = 1;
                gameState.houseFee = 30;
                gameState.boardWidth = 5;
                gameState.boardHeight = 4;
                gameState.rupoorCount = 0;
                gameState.bombCount = 4;
                gameState.gameBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }

        gameState.currentGameRupees = 0;
        gameState.isGameOver = false;
        let gameArea = document.getElementById('diggerarea');
        gameArea.style.width = gameState.boardWidth * gameState.holeWidth + 'px';
        gameArea.style.height = gameState.boardHeight * gameState.holeHeight + 'px';
    }

    /**
     * Clear the game board
     */
    clearBoard() {
        let gameArea = document.getElementById('diggerarea');
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
     * Start a new game
     */
    startNewGame(stateOverride) {
        this.clearBoard();

        if (stateOverride === null || stateOverride === undefined) {
            stateOverride = this.state;
        }

        this.configureDifficulty(stateOverride);

        if (stateOverride.gameType === 1) {
            // Play mode
            this.generatePlayBoard(stateOverride);
        } else {
            // Solve mode
            this.createSolverBoard(stateOverride);
            this.updateSolverDisplay(stateOverride);
        }

        document.getElementById('rupees').innerHTML = '0 Rupees';
        this.state.gameType = stateOverride.gameType;
        this.state.gameDifficulty = stateOverride.gameDifficulty;
        this.state.houseFee = stateOverride.houseFee;
        this.state.boardWidth = stateOverride.boardWidth;
        this.state.boardHeight = stateOverride.boardHeight;
        this.state.rupoorCount = stateOverride.rupoorCount;
        this.state.bombCount = stateOverride.bombCount;
        this.state.gameBoard = stateOverride.gameBoard;
        this.state.currentGameRupees = stateOverride.currentGameRupees;
        this.state.isGameOver = stateOverride.isGameOver;
    }

    /**
     * Handle game type or difficulty change
     */
    onGameTypeChange(event) {
        let stateOverride = this.state;

        if (document.getElementById('play').checked) {
            stateOverride.gameType = 1;
        } else {
            stateOverride.gameType = 2;
        }

        if (document.getElementById('beginner').checked) {
            stateOverride.gameDifficulty = 1;
        } else if (document.getElementById('intermediate').checked) {
            stateOverride.gameDifficulty = 2;
        } else {
            stateOverride.gameDifficulty = 3;
        }

        this.startNewGame(stateOverride);
    }
}

/**
 * Initialize the game when the page loads
 */
window.onload = function() {
    let game = new ThrillDiggerController();
    game.initialize();
};
)();

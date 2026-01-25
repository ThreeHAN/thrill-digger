import type { BoardCell } from '../utils/gameLogic'

export interface InvalidBoardFixture {
  name: string
  width: number
  height: number
  bombCount: number
  rupoorCount: number
  board: BoardCell[][]
  reason?: string
}

// Fixtures that return null from solveBoardProbabilities due to invalid/unsolvable board states
// These boards represent constraint violations or configuration errors
export const invalidBoardFixtures: InvalidBoardFixture[] = [
  {
    "name": "intermediate-random-8",
    "width": 6,
    "height": 5,
    "bombCount": 4,
    "rupoorCount": 4,
    "board": [
      [
        0,
        -10,
        0,
        0,
        0,
        0
      ],
      [
        0,
        1,
        1,
        0,
        0,
        1
      ],
      [
        0,
        0,
        6,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        -10,
        -10,
        0,
        0,
        -10,
        0
      ]
    ],
    "reason": "Unsolvable constraint configuration"
  },
  {
    "name": "intermediate-random-19",
    "width": 6,
    "height": 5,
    "bombCount": 4,
    "rupoorCount": 4,
    "board": [
      [
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        -10
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        -10,
        0,
        -10,
        8,
        0,
        -10
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0
      ]
    ],
    "reason": "Unsolvable constraint configuration"
  },
  {
    "name": "expert-random-3",
    "width": 8,
    "height": 5,
    "bombCount": 8,
    "rupoorCount": 8,
    "board": [
      [
        0,
        0,
        -10,
        0,
        0,
        0,
        0,
        0
      ],
      [
        -10,
        0,
        0,
        1,
        -10,
        0,
        0,
        -10
      ],
      [
        0,
        -10,
        0,
        0,
        0,
        0,
        -10,
        0
      ],
      [
        2,
        0,
        -10,
        0,
        0,
        0,
        0,
        0
      ],
      [
        6,
        -10,
        0,
        0,
        0,
        0,
        0,
        0
      ]
    ],
    "reason": "Unsolvable constraint configuration"
  },
  {
    "name": "expert-random-7",
    "width": 8,
    "height": 5,
    "bombCount": 8,
    "rupoorCount": 8,
    "board": [
      [
        0,
        2,
        0,
        8,
        -10,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        -10,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        -10,
        0,
        -10,
        0,
        0
      ],
      [
        0,
        0,
        -10,
        4,
        0,
        -10,
        -10,
        -10
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ]
    ],
    "reason": "Unsolvable constraint configuration"
  },
  {
    "name": "expert-random-8",
    "width": 8,
    "height": 5,
    "bombCount": 8,
    "rupoorCount": 8,
    "board": [
      [
        0,
        -10,
        6,
        0,
        -10,
        0,
        -10,
        -10
      ],
      [
        0,
        2,
        2,
        0,
        0,
        0,
        0,
        -10
      ],
      [
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        -10,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        -10,
        -10,
        0,
        0,
        0,
        0,
        0
      ]
    ],
    "reason": "Unsolvable constraint configuration"
  },
  {
    "name": "expert-random-13",
    "width": 8,
    "height": 5,
    "bombCount": 8,
    "rupoorCount": 8,
    "board": [
      [
        0,
        0,
        0,
        -10,
        0,
        0,
        -10,
        4
      ],
      [
        -10,
        0,
        0,
        6,
        0,
        -10,
        -10,
        6
      ],
      [
        0,
        0,
        2,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        -10,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        -10,
        2,
        0,
        -10,
        0
      ]
    ],
    "reason": "Unsolvable constraint configuration"
  }
]

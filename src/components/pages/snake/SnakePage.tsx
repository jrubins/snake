import React, { useEffect, useState } from 'react'
import cn from 'classnames'

type Direction = 'down' | 'left' | 'up' | 'right'

interface Snake {
  direction: Direction
  directionChanges: {
    direction: Direction
    position: number
  }[]
  position: number
}

/**
 * The board size will be the square of this number.
 */
const BOARD_SIZE = 12

/**
 * Different keycodes for keyboard keys.
 */
enum KEYS {
  ARROW_DOWN = 40,
  ARROW_LEFT = 37,
  ARROW_RIGHT = 39,
  ARROW_UP = 38,
}

/**
 * A mapping of keyboard keys to their corresponding direction of movement.
 */
const KEYS_TO_DIRECTION: { [k in KEYS]: Direction } = {
  [KEYS.ARROW_DOWN]: 'down',
  [KEYS.ARROW_LEFT]: 'left',
  [KEYS.ARROW_RIGHT]: 'right',
  [KEYS.ARROW_UP]: 'up',
}

/**
 * Returns a cell to place the apple. This ensures the apples is not placed on the provided snake.
 */
function getAppleCell(snake: Snake[]) {
  let appleCell = getRandomCell()
  const isOverlappingSnakeCell = (cell: number) =>
    !!snake.find(({ position }) => position === cell)

  while (isOverlappingSnakeCell(appleCell)) {
    appleCell = getRandomCell()
  }

  return appleCell
}

/**
 * Returns a single position move given the current position and the direction of travel.
 */
function getOneStepMove({
  direction,
  position,
}: {
  direction: Direction
  position: number
}) {
  if (direction === 'down') {
    return position + BOARD_SIZE
  } else if (direction === 'left') {
    return position - 1
  } else if (direction === 'right') {
    return position + 1
  }

  // Has to be 'up' at this point.
  return position - BOARD_SIZE
}

/**
 * Returns a random cell within the bounds of the board.
 */
function getRandomCell() {
  return Math.floor(Math.random() * (Math.pow(BOARD_SIZE, 2) - 1))
}

/**
 * Moves each cell of the snake one position depending on its direction of travel.
 */
function moveSnake({
  nextDirection,
  snake,
}: {
  nextDirection: Direction
  snake: Snake[]
}): Snake[] {
  let headDirectionChangePosition: number | undefined

  return snake.map(({ direction, directionChanges, position }, i) => {
    const isHead = i === 0
    if (isHead && direction !== nextDirection) {
      headDirectionChangePosition = position

      return {
        direction: nextDirection,
        directionChanges: [],
        isHead,
        position: getOneStepMove({ direction: nextDirection, position }),
      }
    }

    const nextPosition = getOneStepMove({ direction, position })
    const newDirectionChanges =
      headDirectionChangePosition !== undefined
        ? [
            ...directionChanges,
            {
              direction: nextDirection,
              position: headDirectionChangePosition,
            },
          ]
        : directionChanges

    const currentDirectionChange = newDirectionChanges.find(
      ({ position }) => position === nextPosition
    )
    if (currentDirectionChange) {
      return {
        direction: currentDirectionChange.direction,
        directionChanges: newDirectionChanges.filter(({ position }) => {
          return position !== nextPosition
        }),
        isHead,
        position: nextPosition,
      }
    }

    return {
      direction,
      directionChanges: newDirectionChanges,
      isHead,
      position: nextPosition,
    }
  })
}

/**
 * Checks if moving in the provided direction will cause the snake to collide with the
 * edges of the board or with itself.
 */
function willCollide({
  nextDirection,
  snake,
}: {
  nextDirection?: Direction
  snake: Snake[]
}) {
  const headCell = snake[0]
  const nextHeadPosition = getOneStepMove({
    direction: nextDirection || headCell.direction,
    position: headCell.position,
  })

  const isOffTop = nextHeadPosition < 0
  const isOffRight =
    nextHeadPosition % BOARD_SIZE === 0 &&
    headCell.position === nextHeadPosition - 1
  const isOffBottom = nextHeadPosition >= Math.pow(BOARD_SIZE, 2)
  const isOffLeft =
    headCell.position % BOARD_SIZE === 0 &&
    nextHeadPosition === headCell.position - 1
  const isCollidingWithSelf = !!snake.find(
    ({ position }) => nextHeadPosition === position
  )

  return (
    isOffTop || isOffRight || isOffBottom || isOffLeft || isCollidingWithSelf
  )
}

const SnakePage = () => {
  const [hasLost, setHasLost] = useState(false)
  const [snake, setSnake] = useState<Snake[]>(() => {
    const headPosition = 4 + BOARD_SIZE * Math.floor(BOARD_SIZE / 2)

    const snake: Snake[] = []
    for (let i = 0; i < 4; i++) {
      snake.push({
        direction: 'right',
        directionChanges: [],
        position: headPosition - i,
      })
    }

    return snake
  })
  const [apple, setApple] = useState<number>(() => getAppleCell(snake))
  const snakeTiles: number[] = []
  for (let i = 0; i < Math.pow(BOARD_SIZE, 2); i++) {
    snakeTiles.push(i)
  }

  // Changes the direction of the snake when the user presses an arrow key.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const nextDirection = KEYS_TO_DIRECTION[event.keyCode]
      if (nextDirection) {
        setSnake((snake) => {
          const headDirection = snake[0].direction
          if (
            (headDirection === 'up' && nextDirection === 'down') ||
            (headDirection === 'down' && nextDirection === 'up') ||
            (headDirection === 'left' && nextDirection === 'right') ||
            (headDirection === 'right' && nextDirection === 'left')
          ) {
            return snake
          }

          if (willCollide({ nextDirection, snake })) {
            setHasLost(true)
            return snake
          }

          return moveSnake({ nextDirection, snake })
        })
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const headDirection = snake[0].direction
  // Moves the snake after 500ms.
  useEffect(() => {
    if (hasLost) {
      return
    }

    const intervalId = window.setInterval(() => {
      setSnake((snake) => {
        if (willCollide({ snake })) {
          setHasLost(true)

          return snake
        }

        return moveSnake({ nextDirection: headDirection, snake })
      })
    }, 500)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [hasLost, headDirection])

  const headPosition = snake[0].position
  // Checks if the snake has eaten an apple and re-positions the apple if so.
  useEffect(() => {
    if (headPosition && headPosition === apple) {
      setSnake((snake) => {
        const lastCell = snake[snake.length - 1]
        let lastCellPosition = lastCell.position
        if (lastCell.direction === 'down') {
          lastCellPosition = lastCellPosition - BOARD_SIZE
        } else if (lastCell.direction === 'left') {
          lastCellPosition = lastCellPosition + 1
        } else if (lastCell.direction === 'right') {
          lastCellPosition = lastCellPosition - 1
        } else if (lastCell.direction === 'up') {
          lastCellPosition = lastCellPosition + BOARD_SIZE
        }

        const newSnake = [
          ...snake,
          {
            ...lastCell,
            position: lastCellPosition,
          },
        ]

        setApple(getAppleCell(newSnake))

        return newSnake
      })
    }
  }, [apple, headPosition])

  return (
    <div className="snake-page">
      <div
        className="board"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        }}
      >
        {snakeTiles.map((index) => {
          return (
            <Tile
              key={index}
              hasApple={index === apple}
              hasSnake={!!snake.find(({ position }) => position === index)}
              tileIndex={index}
            />
          )
        })}
      </div>
      {hasLost ? 'Lost' : 'Not lost'}
    </div>
  )
}

const Tile = ({
  hasApple,
  hasSnake,
  tileIndex,
}: {
  hasApple: boolean
  hasSnake: boolean
  tileIndex: number
}) => {
  return (
    <div
      className={cn('tile', {
        'tile-apple': hasApple,
        'tile-bottom': Math.pow(BOARD_SIZE, 2) - tileIndex <= BOARD_SIZE,
        'tile-right': (tileIndex + 1) % BOARD_SIZE === 0,
        'tile-snake': hasSnake,
      })}
    ></div>
  )
}

export default SnakePage

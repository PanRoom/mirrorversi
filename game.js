// game.js
import { BOARD_SIZE, EMPTY, BLACK, WHITE, directions } from './config.js';

let boardState = [];
let currentPlayer;
let isGameOver;

function normalize(coord) {
    return ((coord % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;
}

export function initialize() {
    boardState = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(EMPTY));
    boardState[3][3] = WHITE;
    boardState[3][4] = BLACK;
    boardState[4][3] = BLACK;
    boardState[4][4] = WHITE;
    currentPlayer = BLACK;
    isGameOver = false;
}

export function placeStone(row, col) {
    const normRow = normalize(row);
    const normCol = normalize(col);
    const stonesToFlip = getFlippableStones(normRow, normCol, currentPlayer);
    
    if (stonesToFlip.length === 0) {
        return false;
    }

    boardState[normRow][normCol] = currentPlayer;
    stonesToFlip.forEach(stone => {
        boardState[stone.row][stone.col] = currentPlayer;
    });
    
    return true;
}

export function checkGameStatus() {
    const nextPlayer = (currentPlayer === BLACK) ? WHITE : BLACK;
    const canNextPlayerMove = getValidMoves(nextPlayer).length > 0;
    const canCurrentPlayerMove = getValidMoves(currentPlayer).length > 0;

    if (canNextPlayerMove) {
        currentPlayer = nextPlayer;
        return { status: 'continue' };
    } else if (canCurrentPlayerMove) {
        return { status: 'pass', passedPlayer: nextPlayer };
    } else {
        isGameOver = true;
        return { status: 'end' };
    }
}

export function getFlippableStones(row, col, player) {
    if (boardState[row][col] !== EMPTY) return [];
    const opponent = (player === BLACK) ? WHITE : BLACK;
    const allFlippableStones = [];
    for (const [dr, dc] of directions) {
        const stonesInDirection = [];
        let isLineFullOfOpponent = true;
        for (let i = 1; i < BOARD_SIZE; i++) {
            const r = normalize(row + dr * i);
            const c = normalize(col + dc * i);
            const currentPiece = boardState[r][c];
            if (currentPiece === opponent) {
                stonesInDirection.push({ row: r, col: c });
            } else if (currentPiece === player) {
                if (stonesInDirection.length > 0) {
                    allFlippableStones.push(...stonesInDirection);
                }
                isLineFullOfOpponent = false; 
                break;
            } else {
                isLineFullOfOpponent = false;
                break;
            }
        }
        if (isLineFullOfOpponent && stonesInDirection.length === BOARD_SIZE - 1) {
            allFlippableStones.push(...stonesInDirection);
        }
    }
    return allFlippableStones;
}

export function getValidMoves(player) {
    const moves = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (boardState[row][col] === EMPTY) {
                if (getFlippableStones(row, col, player).length > 0) {
                    moves.push({ row, col });
                }
            }
        }
    }
    return moves;
}

export const getGameState = () => ({
    board: boardState,
    player: currentPlayer,
    over: isGameOver
});

// game.js内でしか使わない正規化関数もエクスポートしてdom.jsで使えるようにする
export { normalize };
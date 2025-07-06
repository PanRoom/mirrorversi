// dom.js
import { CELL_SIZE, BLACK, WHITE, EMPTY } from './config.js';
import { normalize } from './game.js';

const viewport = document.getElementById('viewport');
const infiniteBoard = document.getElementById('infinite-board');
const turnIndicatorBlack = document.getElementById('turn-indicator-black');
const turnIndicatorWhite = document.getElementById('turn-indicator-white');
const gameOverMessageElement = document.getElementById('game-over-message');
const passMessageElement = document.getElementById('pass-message');

export function renderBoard(boardState, playableMoves, isGameOver, viewX, viewY) {
    infiniteBoard.innerHTML = '';
    infiniteBoard.style.transform = `translate(${viewX}px, ${viewY}px)`;
    
    const startCol = Math.floor(-viewX / CELL_SIZE) - 1;
    const endCol = startCol + Math.ceil(viewport.clientWidth / CELL_SIZE) + 2;
    const startRow = Math.floor(-viewY / CELL_SIZE) - 1;
    const endRow = startRow + Math.ceil(viewport.clientHeight / CELL_SIZE) + 2;

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.left = `${col * CELL_SIZE}px`;
            cell.style.top = `${row * CELL_SIZE}px`;
            cell.dataset.row = row;
            cell.dataset.col = col;

            const boardRow = normalize(row);
            const boardCol = normalize(col);
            const pieceState = boardState[boardRow][boardCol];

            if (pieceState === EMPTY) {
                const isPlayable = playableMoves.some(m => normalize(m.row) === boardRow && normalize(m.col) === boardCol);
                if (isPlayable && !isGameOver) {
                    cell.classList.add('playable');
                }
            } else {
                let piece;
                if (pieceState === BLACK) {
                    piece = document.createElement('div');
                    piece.className = 'stone black';
                } else if (pieceState === WHITE) {
                    piece = document.createElement('div');
                    piece.className = 'stone white';
                }
                if (piece) cell.appendChild(piece);
            }
            infiniteBoard.appendChild(cell);
        }
    }
}

export function updateTurnIndicator(currentPlayer) {
    if (currentPlayer === BLACK) {
        turnIndicatorBlack.classList.add('active');
        turnIndicatorWhite.classList.remove('active');
    } else {
        turnIndicatorBlack.classList.remove('active');
        turnIndicatorWhite.classList.add('active');
    }
}

export function displayPassMessage(passedPlayer) {
    const playerName = (passedPlayer === BLACK) ? '黒' : '白';
    passMessageElement.textContent = `${playerName} はパスします`;
    passMessageElement.classList.remove('hidden');
    setTimeout(() => { passMessageElement.classList.add('hidden'); }, 2000);
}

export function displayResult(boardState) {
    let blackCount = 0, whiteCount = 0;
    boardState.forEach(row => row.forEach(piece => {
        if (piece === BLACK) blackCount++;
        if (piece === WHITE) whiteCount++;
    }));

    const totalCount = blackCount + whiteCount;
    let mainMessage = "", scoreMessage = "";
    
    const resultEl = gameOverMessageElement;
    resultEl.classList.remove('hidden');

    if (totalCount === 0) {
        mainMessage = '引き分け';
        resultEl.style.backgroundColor = '#008000'; resultEl.style.color = '#eee';
        scoreMessage = `(黒 0.0% - 白 0.0%)`;
    } else if (blackCount > whiteCount) {
        mainMessage = '黒の勝ち！';
        resultEl.style.backgroundColor = '#111'; resultEl.style.color = '#fff';
        const blackPercent = Math.round(((blackCount / totalCount) * 100) * 10) / 10;
        const whitePercent = 100.0 - blackPercent;
        scoreMessage = `(黒 ${blackPercent.toFixed(1)}% - 白 ${whitePercent.toFixed(1)}%)`;
    } else if (whiteCount > blackCount) {
        mainMessage = '白の勝ち！';
        resultEl.style.backgroundColor = '#fff'; resultEl.style.color = '#111';
        const whitePercent = Math.round(((whiteCount / totalCount) * 100) * 10) / 10;
        const blackPercent = 100.0 - whitePercent;
        scoreMessage = `(白 ${whitePercent.toFixed(1)}% - 黒 ${blackPercent.toFixed(1)}%)`;
    } else {
        mainMessage = '引き分け';
        resultEl.style.backgroundColor = '#008000'; resultEl.style.color = '#eee';
        scoreMessage = `(黒 50.0% - 白 50.0%)`;
    }
    resultEl.innerHTML = `${mainMessage}<span class="score-in-result">${scoreMessage}</span>`;
}

export function hideMessages() {
    gameOverMessageElement.classList.add('hidden');
    passMessageElement.classList.add('hidden');
}
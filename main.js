// main.js
import { CELL_SIZE } from './config.js';
import * as Game from './game.js';
import * as DOM from './dom.js';

const titleScreen = document.getElementById('title-screen');
const gameScreen = document.getElementById('game-screen');
const viewport = document.getElementById('viewport');
const startButton = document.getElementById('start-button');
const ruleButton = document.getElementById('rule-button');
const resetButton = document.getElementById('reset-button');
const backToTitleButton = document.getElementById('back-to-title-button');
const ruleModal = document.getElementById('rule-modal');
const closeRuleButton = document.getElementById('close-rule-button');

let viewX = 0, viewY = 0;
let isInteracting = false;
let didDrag = false;
let startInteractionX, startInteractionY;
let lastInteractionX, lastInteractionY;

function startGame() {
    Game.initialize();
    const { board, player, over } = Game.getGameState();
    const playableMoves = Game.getValidMoves(player);
    
    DOM.hideMessages();
    viewX = -CELL_SIZE * 4 + viewport.clientWidth / 2;
    viewY = -CELL_SIZE * 4 + viewport.clientHeight / 2;
    DOM.renderBoard(board, playableMoves, over, viewX, viewY);
    DOM.updateTurnIndicator(player);
}

function handleTap(cell) {
    let { over, player } = Game.getGameState();
    if (over) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    const success = Game.placeStone(row, col);
    if (!success) return;

    const gameStatus = Game.checkGameStatus();
    const newGameState = Game.getGameState();
    
    if (gameStatus.status === 'pass') {
        DOM.displayPassMessage(gameStatus.passedPlayer);
    } else if (gameStatus.status === 'end') {
        DOM.displayResult(newGameState.board);
    }

    const playableMoves = Game.getValidMoves(newGameState.player);
    DOM.renderBoard(newGameState.board, playableMoves, newGameState.over, viewX, viewY);
    DOM.updateTurnIndicator(newGameState.player);
}

startButton.addEventListener('click', () => {
    titleScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    startGame();
});

// ▼▼▼【変更点】ここから ▼▼▼
backToTitleButton.addEventListener('click', () => {
    if (confirm("タイトルに戻りますか？\n現在のゲームは失われます。")) {
        gameScreen.classList.add('hidden');
        titleScreen.classList.remove('hidden');
    }
});

resetButton.addEventListener('click', () => {
    if (confirm("ゲームをリセットしますか？")) {
        startGame();
    }
});
// ▲▲▲ ここまで ▲▲▲

ruleButton.addEventListener('click', () => ruleModal.classList.remove('hidden'));
closeRuleButton.addEventListener('click', () => ruleModal.classList.add('hidden'));
ruleModal.addEventListener('click', e => { if (e.target === ruleModal) ruleModal.classList.add('hidden'); });

function handleInteractionStart(e) { if (e.type === 'mousedown' && e.button !== 0) return; e.preventDefault(); isInteracting = true; didDrag = false; const point = e.touches ? e.touches[0] : e; startInteractionX = point.clientX; startInteractionY = point.clientY; lastInteractionX = point.clientX; lastInteractionY = point.clientY; }
function handleInteractionMove(e) { if (!isInteracting) return; e.preventDefault(); const point = e.touches ? e.touches[0] : e; const dx = point.clientX - startInteractionX; const dy = point.clientY - startInteractionY; if (!didDrag && Math.sqrt(dx*dx + dy*dy) > 5) { didDrag = true; viewport.style.cursor = 'grabbing'; } if (didDrag) { const moveX = point.clientX - lastInteractionX; const moveY = point.clientY - lastInteractionY; viewX += moveX; viewY += moveY; viewport.querySelector('#infinite-board').style.transform = `translate(${viewX}px, ${viewY}px)`; } lastInteractionX = point.clientX; lastInteractionY = point.clientY; }
function handleInteractionEnd(e) { if (!isInteracting) return; const { board, player, over } = Game.getGameState(); const playableMoves = Game.getValidMoves(player); if (didDrag) { DOM.renderBoard(board, playableMoves, over, viewX, viewY); } else { const targetCell = e.target.closest('.cell.playable'); if (targetCell) { handleTap(targetCell); } } isInteracting = false; viewport.style.cursor = 'grab'; }
viewport.addEventListener('mousedown', handleInteractionStart);
window.addEventListener('mousemove', handleInteractionMove);
window.addEventListener('mouseup', handleInteractionEnd);
viewport.addEventListener('touchstart', handleInteractionStart, { passive: false });
window.addEventListener('touchmove', handleInteractionMove, { passive: false });
window.addEventListener('touchend', handleInteractionEnd);
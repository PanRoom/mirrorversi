// main.js
import Game from './src/Game.js';
import UI from './src/UI.js';

let game;
const ui = new UI();
let placementMode = 'stone';
let onConfirm = null;
let isTitleActive = true;
let currentGameSettings = null;

function showTitle() {
    isTitleActive = true;
    const titleGame = new Game({ boardSize: 8, blockCount: 0 });
    ui.resetView(titleGame.getState());
    ui.showScreen('title');
    ui.render(titleGame.getState(), 'stone', []);
}

function startGame(settings) {
    currentGameSettings = settings;
    isTitleActive = false;
    game = new Game(settings);
    placementMode = 'stone';
    ui.resetView(game.getState());
    ui.showScreen('game');
    updateFullUI();
    ui.displayMessage(null);
}

// ▼▼▼【変更点】ターン交代の処理をシンプルに修正 ▼▼▼
function handlePiecePlacement(row, col) {
    if (game.getState().isGameOver || isTitleActive) return;
    
    const success = (placementMode === 'stone')
        ? game.placeStone(row, col)
        : game.placeBlock(row, col);
    
    if (success) {
        placementMode = 'stone'; // 手番が終わったら自動的に石モードに戻す
        
        const gameStatus = game.switchTurn();

        if (gameStatus.status === 'pass') {
            ui.displayMessage('pass', gameStatus.passedPlayer);
        } else if (gameStatus.status === 'end') {
            ui.showResult(game.getState().board);
        }
        
        updateFullUI();
    }
}

function updateFullUI() {
    if (!game) return;
    const state = game.getState();
    const validMoves = isTitleActive ? [] : game.getValidMoves(state.currentPlayer, placementMode);
    ui.render(state, placementMode, validMoves);
}

document.getElementById('app').addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    switch (action) {
        case 'show-settings':
            ui.toggleSettingsModal(true);
            break;
        case 'start-with-settings':
            const boardSize = parseInt(ui.elements.settings.boardSizeSelect.value, 10);
            const blockCount = parseInt(ui.elements.settings.blockCountInput.value, 10);
            ui.toggleSettingsModal(false);
            startGame({ boardSize, blockCount });
            break;
        case 'show-rules':
            ui.toggleRuleModal(true);
            break;
        case 'close-modal':
            ui.toggleRuleModal(false);
            ui.toggleSettingsModal(false);
            break;
        case 'reset':
            if (game) {
                onConfirm = () => startGame(currentGameSettings);
                ui.toggleConfirmModal(true, "ゲームをリセットしますか？");
            }
            break;
        case 'back-to-title':
            onConfirm = showTitle;
            ui.toggleConfirmModal(true, "タイトルに戻りますか？\n現在のゲームは失われます。");
            break;
        case 'set-mode':
            if (isTitleActive || !game) return;
            placementMode = e.target.dataset.mode;
            updateFullUI();
            break;
        case 'confirm-yes':
            if (onConfirm) onConfirm();
            ui.toggleConfirmModal(false);
            onConfirm = null;
            break;
        case 'confirm-no':
            ui.toggleConfirmModal(false);
            onConfirm = null;
            break;
    }
});

ui.elements.settings.boardSizeSelect.addEventListener('change', () => {
    ui.updateSettingsDefaults();
});

ui.elements.settings.blockCountInput.addEventListener('input', (e) => {
    const input = e.target;
    const max = parseInt(input.max, 10);
    const value = parseInt(input.value, 10);

    if (value > max) {
        input.value = max;
    }
});

let isInteracting = false;
let didDrag = false;
let startX, startY, lastX, lastY;

ui.elements.viewport.addEventListener('mousedown', start);
ui.elements.viewport.addEventListener('touchstart', start, { passive: false });
window.addEventListener('mousemove', move);
window.addEventListener('touchmove', move, { passive: false });
window.addEventListener('mouseup', end);
window.addEventListener('touchend', end);

function start(e) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    e.preventDefault();
    isInteracting = true; didDrag = false;
    const point = e.touches ? e.touches[0] : e;
    startX = lastX = point.clientX;
    startY = lastY = point.clientY;
}

function move(e) {
    if (!isInteracting) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - startX;
    const dy = point.clientY - startY;
    if (!didDrag && Math.sqrt(dx*dx + dy*dy) > 5) {
        didDrag = true;
        ui.elements.viewport.style.cursor = 'grabbing';
    }
    if (didDrag) {
        ui.updateView(point.clientX - lastX, point.clientY - lastY);
    }
    lastX = point.clientX; lastY = point.clientY;
}

function end(e) {
    if (!isInteracting) return;
    
    const wasDragging = didDrag;
    
    isInteracting = false;
    didDrag = false;
    ui.elements.viewport.style.cursor = 'grab';

    if (wasDragging) {
        const state = game ? game.getState() : new Game({boardSize: 8, blockCount: 0}).getState();
        const validMoves = isTitleActive || !game ? [] : game.getValidMoves(state.currentPlayer, placementMode);
        ui.render(state, placementMode, validMoves);
    } else {
        const cell = e.target.closest('.cell');
        if (cell) handlePiecePlacement(cell.dataset.row, cell.dataset.col);
    }
}

showTitle();
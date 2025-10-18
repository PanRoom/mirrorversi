// main.js
import Game from './src/Game.js';
import UI from './src/UI.js';

const appState = {
    game: null,
    ui: new UI(),
    placementMode: 'stone',
    onConfirm: null,
    isTitleActive: true,
    currentGameSettings: null,
};

function showTitle() {
    appState.isTitleActive = true;
    const titleGame = new Game({ boardSize: 8, blockCount: 0 });
    appState.ui.resetView(titleGame.getState());
    appState.ui.showScreen('title');
    appState.ui.render(titleGame.getState(), 'stone', []);
}

function startGame(settings) {
    appState.currentGameSettings = settings;
    appState.isTitleActive = false;
    appState.game = new Game(settings);
    appState.placementMode = 'stone';
    appState.ui.resetView(appState.game.getState());
    appState.ui.showScreen('game');
    updateFullUI();
    appState.ui.displayMessage(null);
}

// ▼▼▼【変更点】ターン交代の処理をシンプルに修正 ▼▼▼
function handlePiecePlacement(row, col) {
    if (appState.game.getState().isGameOver || appState.isTitleActive) return;
    
    const success = (appState.placementMode === 'stone')
        ? appState.game.placeStone(row, col)
        : appState.game.placeBlock(row, col);
    
    if (success) {
        appState.placementMode = 'stone'; // 手番が終わったら自動的に石モードに戻す
        
        const gameStatus = appState.game.switchTurn();

        if (gameStatus.status === 'pass') {
            appState.ui.displayMessage('pass', gameStatus.passedPlayer);
        } else if (gameStatus.status === 'end') {
            appState.ui.showResult(appState.game.getState().board);
        }
        
        updateFullUI();
    }
}

function updateFullUI() {
    if (!appState.game) return;
    const state = appState.game.getState();
    const validMoves = appState.isTitleActive ? [] : appState.game.getValidMoves(state.currentPlayer, appState.placementMode);
    appState.ui.render(state, appState.placementMode, validMoves);
}

document.getElementById('app').addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    switch (action) {
        case 'show-settings':
            appState.ui.toggleSettingsModal(true);
            break;
        case 'start-with-settings':
            const boardSize = parseInt(appState.ui.elements.settings.boardSizeSelect.value, 10);
            const blockCount = parseInt(appState.ui.elements.settings.blockCountInput.value, 10);
            appState.ui.toggleSettingsModal(false);
            startGame({ boardSize, blockCount });
            break;
        case 'show-rules':
            appState.ui.toggleRuleModal(true);
            break;
        case 'close-modal':
            appState.ui.toggleRuleModal(false);
            appState.ui.toggleSettingsModal(false);
            break;
        case 'reset':
            if (appState.game) {
                appState.onConfirm = () => startGame(appState.currentGameSettings);
                appState.ui.toggleConfirmModal(true, "ゲームをリセットしますか？");
            }
            break;
        case 'back-to-title':
            appState.onConfirm = showTitle;
            appState.ui.toggleConfirmModal(true, "タイトルに戻りますか？\n現在のゲームは失われます。");
            break;
        case 'set-mode':
            if (appState.isTitleActive || !appState.game) return;
            appState.placementMode = e.target.dataset.mode;
            updateFullUI();
            break;
        case 'confirm-yes':
            if (appState.onConfirm) appState.onConfirm();
            appState.ui.toggleConfirmModal(false);
            appState.onConfirm = null;
            break;
        case 'confirm-no':
            appState.ui.toggleConfirmModal(false);
            appState.onConfirm = null;
            break;
    }
});

appState.ui.elements.settings.boardSizeSelect.addEventListener('change', () => {
    appState.ui.updateSettingsDefaults();
});

appState.ui.elements.settings.blockCountInput.addEventListener('input', (e) => {
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

appState.ui.elements.viewport.addEventListener('mousedown', start);
appState.ui.elements.viewport.addEventListener('touchstart', start, { passive: false });
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
        appState.ui.elements.viewport.style.cursor = 'grabbing';
    }
    if (didDrag) {
        appState.ui.updateView(point.clientX - lastX, point.clientY - lastY);
    }
    lastX = point.clientX; lastY = point.clientY;
}

function end(e) {
    if (!isInteracting) return;
    
    const wasDragging = didDrag;
    
    isInteracting = false;
    didDrag = false;
    appState.ui.elements.viewport.style.cursor = 'grab';

    if (wasDragging) {
        const state = appState.game ? appState.game.getState() : new Game({boardSize: 8, blockCount: 0}).getState();
        const validMoves = appState.isTitleActive || !appState.game ? [] : appState.game.getValidMoves(state.currentPlayer, appState.placementMode);
        appState.ui.render(state, appState.placementMode, validMoves);
    } else {
        const cell = e.target.closest('.cell');
        if (cell) handlePiecePlacement(cell.dataset.row, cell.dataset.col);
    }
}

showTitle();

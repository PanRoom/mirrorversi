// src/UI.js
import { CELL_SIZE, BLACK, WHITE, EMPTY, BLOCK, defaultBlockCounts } from './config.js';

export default class UI {
    constructor() {
        this.elements = {
            viewport: document.getElementById('viewport'),
            infiniteBoard: document.getElementById('infinite-board'),
            titleScreen: document.getElementById('title-screen'),
            gameScreen: document.getElementById('game-screen'),
            gameUi: document.getElementById('game-ui'),
            ruleModal: document.getElementById('rule-modal'),
            settingsModal: document.getElementById('settings-modal'),
            confirmModal: document.getElementById('confirm-modal'),
            confirmMessage: document.getElementById('confirm-message'),
            messageContainer: document.getElementById('message-container'),
            actionPanel: {
                blackStatus: document.querySelector('[data-player="black"]'),
                whiteStatus: document.querySelector('[data-player="white"]'),
                blackBlockCount: document.querySelector('[data-count="black-blocks"]'),
                whiteBlockCount: document.querySelector('[data-count="white-blocks"]'),
                modeButtons: document.querySelectorAll('[data-action="set-mode"]'),
            },
            settings: {
                boardSizeSelect: document.getElementById('board-size-select'),
                blockCountInput: document.getElementById('block-count-input'),
                blockMaxValue: document.getElementById('block-max-value'),
            }
        };
        this.viewX = 0;
        this.viewY = 0;
        this.boardSize = 8;
    }

    normalize(coord) {
        return ((coord % this.boardSize) + this.boardSize) % this.boardSize;
    }

    render(state, placementMode, validMoves) {
        this.boardSize = state.boardSize;
        this.renderBoard(state, placementMode, validMoves);
        this.updateActionPanel(state, placementMode);
    }
    
    renderBoard(state, placementMode, validMoves) {
        const { board, isGameOver } = state;
        this.elements.infiniteBoard.innerHTML = '';
        this.elements.infiniteBoard.style.transform = `translate(${this.viewX}px, ${this.viewY}px)`;
        
        // ▼▼▼【変更点】描画範囲の「余白」を広げる ▼▼▼
        const horizontalBuffer = Math.ceil(this.elements.viewport.clientWidth / CELL_SIZE);
        const verticalBuffer = Math.ceil(this.elements.viewport.clientHeight / CELL_SIZE);

        const startCol = Math.floor(-this.viewX / CELL_SIZE) - horizontalBuffer;
        const endCol = startCol + horizontalBuffer * 3;
        const startRow = Math.floor(-this.viewY / CELL_SIZE) - verticalBuffer;
        const endRow = startRow + verticalBuffer * 3;
        // ▲▲▲ ここまで ▲▲▲

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.left = `${col * CELL_SIZE}px`;
                cell.style.top = `${row * CELL_SIZE}px`;
                cell.dataset.row = row;
                cell.dataset.col = col;

                const boardRow = this.normalize(row);
                const boardCol = this.normalize(col);
                const pieceState = board[boardRow][boardCol];

                if (pieceState === EMPTY) {
                    if (!isGameOver && validMoves) {
                        const isPlayable = validMoves.some(m => m.row === boardRow && m.col === boardCol);
                        if (isPlayable) {
                            cell.classList.add(placementMode === 'stone' ? 'playable-stone' : 'playable-block');
                        }
                    }
                } else {
                    let piece;
                    if (pieceState === BLACK) {
                        piece = document.createElement('div');
                        piece.className = 'stone black';
                    } else if (pieceState === WHITE) {
                        piece = document.createElement('div');
                        piece.className = 'stone white';
                    } else if (pieceState === BLOCK) {
                        piece = document.createElement('div');
                        piece.className = 'block-piece';
                    }
                    if (piece) {
                        cell.appendChild(piece);
                    }
                }
                this.elements.infiniteBoard.appendChild(cell);
            }
        }
    }

    updateActionPanel(state, placementMode) {
        const { currentPlayer, blocks } = state;
        const { blackStatus, whiteStatus, blackBlockCount, whiteBlockCount, modeButtons } = this.elements.actionPanel;
        
        blackStatus.classList.toggle('active', currentPlayer === BLACK);
        whiteStatus.classList.toggle('active', currentPlayer === WHITE);

        blackBlockCount.textContent = `× ${blocks[BLACK]}`;
        whiteBlockCount.textContent = `× ${blocks[WHITE]}`;

        modeButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.mode === placementMode);
        });
    }

    displayMessage(type, content) {
        const container = this.elements.messageContainer;
        container.innerHTML = '';
        if (!type) return;
        const el = document.createElement('div');
        if (type === 'pass') {
            el.id = 'pass-message';
            const playerName = (content === BLACK) ? '黒' : '白';
            el.textContent = `${playerName} はパスします`;
            container.appendChild(el);
            setTimeout(() => el.remove(), 2000);
        } else if (type === 'end') {
            el.id = 'game-over-message';
            const { mainMessage, scoreMessage, bgColor, color } = content;
            el.style.backgroundColor = bgColor;
            el.style.color = color;
            el.innerHTML = `${mainMessage}<span class="score-in-result">${scoreMessage}</span>`;
            container.appendChild(el);
        }
    }
    
    showResult(board) {
        let blackCount = 0, whiteCount = 0;
        board.forEach(row => row.forEach(p => {
            if (p === BLACK) blackCount++;
            if (p === WHITE) whiteCount++;
        }));
        
        const total = blackCount + whiteCount;
        let resultData = {};

        if (total === 0 || blackCount === whiteCount) {
            resultData = { mainMessage: '引き分け', scoreMessage: `(黒 50.0% - 白 50.0%)`, bgColor: '#008000', color: '#eee' };
        } else if (blackCount > whiteCount) {
            const b = Math.round(((blackCount/total)*100)*10)/10;
            resultData = { mainMessage: '黒の勝ち！', scoreMessage: `(黒 ${b.toFixed(1)}% - 白 ${(100-b).toFixed(1)}%)`, bgColor: '#111', color: '#fff' };
        } else {
            const w = Math.round(((whiteCount/total)*100)*10)/10;
            resultData = { mainMessage: '白の勝ち！', scoreMessage: `(白 ${w.toFixed(1)}% - 黒 ${(100-w).toFixed(1)}%)`, bgColor: '#fff', color: '#111' };
        }
        this.displayMessage('end', resultData);
    }
    
    toggleConfirmModal(show, message = '') {
        this.elements.confirmMessage.innerHTML = message.replace(/\n/g, '<br>');
        this.elements.confirmModal.classList.toggle('hidden', !show);
    }
    
    toggleRuleModal(show) {
        this.elements.ruleModal.classList.toggle('hidden', !show);
    }

    toggleSettingsModal(show) {
        if (show) this.updateSettingsDefaults();
        this.elements.settingsModal.classList.toggle('hidden', !show);
    }

    updateSettingsDefaults() {
        const size = this.elements.settings.boardSizeSelect.value;
        const blockInput = this.elements.settings.blockCountInput;
        const maxBlocks = Math.floor(size * size / 4);
        
        blockInput.value = defaultBlockCounts[size];
        blockInput.max = maxBlocks;
        this.elements.settings.blockMaxValue.textContent = maxBlocks;
    }
    
    showScreen(screenName) {
        if (screenName === 'title') {
            this.elements.gameScreen.classList.remove('hidden');
            this.elements.titleScreen.classList.remove('hidden');
            this.elements.gameUi.classList.add('hidden');
        } else if (screenName === 'game') {
            this.elements.gameScreen.classList.remove('hidden');
            this.elements.titleScreen.classList.add('hidden');
            this.elements.gameUi.classList.remove('hidden');
        }
    }
    
    updateView(dx, dy) {
        this.viewX += dx;
        this.viewY += dy;
        this.elements.infiniteBoard.style.transform = `translate(${this.viewX}px, ${this.viewY}px)`;
    }

    resetView(gameState) {
        this.boardSize = gameState.boardSize;
        this.viewX = -this.boardSize * CELL_SIZE / 2 + this.elements.viewport.clientWidth / 2;
        this.viewY = -this.boardSize * CELL_SIZE / 2 + this.elements.viewport.clientHeight / 2;
    }
}
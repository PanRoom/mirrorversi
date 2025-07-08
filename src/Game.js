// src/Game.js
import { EMPTY, BLACK, WHITE, BLOCK, directions } from './config.js';

export default class Game {
    constructor(settings) {
        this.boardSize = settings.boardSize;
        this.initialBlockCount = settings.blockCount;
        this.initialize();
    }

    initialize() {
        this.board = Array(this.boardSize).fill(0).map(() => Array(this.boardSize).fill(EMPTY));
        const center1 = this.boardSize / 2 - 1;
        const center2 = this.boardSize / 2;
        this.board[center1][center1] = WHITE;
        this.board[center1][center2] = BLACK;
        this.board[center2][center1] = BLACK;
        this.board[center2][center2] = WHITE;
        this.currentPlayer = BLACK;
        this.isGameOver = false;
        this.blocks = { [BLACK]: this.initialBlockCount, [WHITE]: this.initialBlockCount };
    }

    // ▼▼▼【変更点】ここから下のロジックを全面的に改善 ▼▼▼

    // 盤面に空きマスがあるかチェックするヘルパー関数
    _hasEmptyCells() {
        return this.board.some(row => row.includes(EMPTY));
    }

    // 特定の色の石が盤面に存在するかチェックするヘルパー関数
    _hasStones(player) {
        return this.board.some(row => row.includes(player));
    }

    // プレイヤーが何らかの行動を取れるかチェックするヘルパー関数
    _canPlayerMove(player) {
        // 石を置ける場所があるか？
        if (this.getValidMoves(player, 'stone').length > 0) {
            return true;
        }
        // ブロックを持っていて、かつ置ける空きマスがあるか？
        if (this.blocks[player] > 0 && this._hasEmptyCells()) {
            return true;
        }
        return false;
    }

    // ターンを交代し、ゲームの状態を返す（パスと終了判定の核心）
    switchTurn() {
        // --- まず、即時ゲーム終了条件をチェック ---
        // 1. 盤面に空きマスがない
        // 2. どちらかの石が盤面から無くなった
        if (!this._hasEmptyCells() || !this._hasStones(BLACK) || !this._hasStones(WHITE)) {
            this.isGameOver = true;
            return { status: 'end' };
        }

        const opponent = (this.currentPlayer === BLACK) ? WHITE : BLACK;

        // --- 次のプレイヤー（相手）が動けるかチェック ---
        if (this._canPlayerMove(opponent)) {
            this.currentPlayer = opponent;
            return { status: 'continue' };
        }

        // --- 相手が動けない（パス）場合 ---
        // 元のプレイヤーがもう一度動けるかチェック
        if (this._canPlayerMove(this.currentPlayer)) {
            // 動けるので、ターンはそのまま
            return { status: 'pass', passedPlayer: opponent };
        }
        
        // --- どちらのプレイヤーも動けない場合 ---
        this.isGameOver = true;
        return { status: 'end' };
    }

    placeStone(row, col) {
        const normRow = this.normalize(row);
        const normCol = this.normalize(col);
        if (this.board[normRow][normCol] !== EMPTY) return false;

        const stonesToFlip = this.getFlippableStones(normRow, normCol, this.currentPlayer);
        if (stonesToFlip.length === 0) return false;
        
        this.board[normRow][normCol] = this.currentPlayer;
        stonesToFlip.forEach(stone => {
            this.board[stone.row][stone.col] = this.currentPlayer;
        });
        return true;
    }
    
    placeBlock(row, col) {
        const normRow = this.normalize(row);
        const normCol = this.normalize(col);
        if (this.board[normRow][normCol] !== EMPTY) return false;

        if (this.blocks[this.currentPlayer] > 0) {
            this.blocks[this.currentPlayer]--;
            this.board[normRow][normCol] = BLOCK;
            return true;
        }
        return false;
    }

    normalize(coord) {
        return ((coord % this.boardSize) + this.boardSize) % this.boardSize;
    }

    getFlippableStones(row, col, player) {
        if (this.board[row][col] !== EMPTY) return [];
        const opponent = (player === BLACK) ? WHITE : BLACK;
        const allFlippableStones = [];
        for (const [dr, dc] of directions) {
            const stonesInDirection = [];
            let isLineFullOfOpponent = true;
            for (let i = 1; i < this.boardSize; i++) {
                const r = this.normalize(row + dr * i);
                const c = this.normalize(col + dc * i);
                const currentPiece = this.board[r][c];
                if (currentPiece === opponent) {
                    stonesInDirection.push({ row: r, col: c });
                } else if (currentPiece === player) {
                    if (stonesInDirection.length > 0) allFlippableStones.push(...stonesInDirection);
                    isLineFullOfOpponent = false; 
                    break;
                } else {
                    isLineFullOfOpponent = false;
                    break;
                }
            }
            if (isLineFullOfOpponent && stonesInDirection.length === this.boardSize - 1) {
                allFlippableStones.push(...stonesInDirection);
            }
        }
        return allFlippableStones;
    }
    
    getValidMoves(player, mode) {
        const moves = [];
        if (mode === 'block' && this.blocks[player] === 0) {
            return []; // ブロックモードでもブロックがなければ置けない
        }

        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.board[r][c] === EMPTY) {
                    if (mode === 'stone') {
                        if (this.getFlippableStones(r, c, player).length > 0) {
                            moves.push({ row: r, col: c });
                        }
                    } else if (mode === 'block') {
                        moves.push({ row: r, col: c });
                    }
                }
            }
        }
        return moves;
    }

    getState() {
        return {
            board: this.board,
            boardSize: this.boardSize,
            currentPlayer: this.currentPlayer,
            isGameOver: this.isGameOver,
            blocks: this.blocks,
        };
    }
}
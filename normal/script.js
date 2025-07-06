document.addEventListener('DOMContentLoaded', () => {
    // === DOM要素の取得 ===
    // 画面
    const titleScreen = document.getElementById('title-screen');
    const gameScreen = document.getElementById('game-screen');
    
    // ボタン
    const startButton = document.getElementById('start-button');
    const ruleButton = document.getElementById('rule-button');
    const resetButton = document.getElementById('reset-button');
    const backToTitleButton = document.getElementById('back-to-title-button');

    // ゲーム関連
    const boardElement = document.getElementById('board');
    const currentTurnElement = document.getElementById('current-turn');
    const blackScoreElement = document.getElementById('black-score');
    const whiteScoreElement = document.getElementById('white-score');
    
    // メッセージ・モーダル
    const gameOverMessageElement = document.getElementById('game-over-message');
    const passMessageElement = document.getElementById('pass-message');
    const ruleModal = document.getElementById('rule-modal');
    const closeRuleButton = document.getElementById('close-rule-button');

    // === 定数 ===
    const BOARD_SIZE = 8;
    const EMPTY = 0;
    const BLACK = 1;
    const WHITE = 2;

    // === ゲームの状態 ===
    let boardState = [];
    let currentPlayer;
    let isGameOver;
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [ 0, -1],          [ 0, 1],
        [ 1, -1], [ 1, 0], [ 1, 1]
    ];

    // === イベントリスナー ===
    // ゲームスタート
    startButton.addEventListener('click', () => {
        titleScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        initializeGame();
    });
    
    // ルール表示
    ruleButton.addEventListener('click', () => {
        ruleModal.classList.remove('hidden');
    });

    // ルールを閉じる
    closeRuleButton.addEventListener('click', () => {
        ruleModal.classList.add('hidden');
    });
    
    // モーダルの外側をクリックしても閉じる
    ruleModal.addEventListener('click', (event) => {
        if (event.target === ruleModal) {
            ruleModal.classList.add('hidden');
        }
    });

    // ゲームリセット
    resetButton.addEventListener('click', initializeGame);

    // タイトルへ戻る
    backToTitleButton.addEventListener('click', () => {
        gameScreen.classList.add('hidden');
        titleScreen.classList.remove('hidden');
    });

    // === 関数 ===
    /**
     * ゲームを初期化する
     */
    function initializeGame() {
        boardState = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(EMPTY));
        boardState[3][3] = WHITE;
        boardState[3][4] = BLACK;
        boardState[4][3] = BLACK;
        boardState[4][4] = WHITE;

        currentPlayer = BLACK;
        isGameOver = false;
        gameOverMessageElement.classList.add('hidden');
        passMessageElement.classList.add('hidden');
        
        renderBoard();
        updateInfo();
    }

    /**
     * 盤面を描画する
     */
    function renderBoard() {
        boardElement.innerHTML = '';
        const playableMoves = getValidMoves(currentPlayer);

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const stoneState = boardState[row][col];
                if (stoneState !== EMPTY) {
                    const stone = document.createElement('div');
                    stone.className = 'stone ' + (stoneState === BLACK ? 'black' : 'white');
                    cell.appendChild(stone);
                } else {
                    const isPlayable = playableMoves.some(move => move.row === row && move.col === col);
                    if (isPlayable && !isGameOver) {
                        cell.classList.add('playable');
                        const hint = document.createElement('div');
                        hint.className = 'hint';
                        cell.appendChild(hint);
                        cell.addEventListener('click', handleCellClick);
                    }
                }
                boardElement.appendChild(cell);
            }
        }
    }

    /**
     * セルがクリックされたときの処理
     */
    function handleCellClick(event) {
        if (isGameOver) return;

        const cell = event.currentTarget;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        const stonesToFlip = getFlippableStones(row, col, currentPlayer);
        if (stonesToFlip.length === 0) return;

        boardState[row][col] = currentPlayer;
        stonesToFlip.forEach(stone => {
            boardState[stone.row][stone.col] = currentPlayer;
        });

        checkGameStatus();
    }

    /**
     * ゲームの状態（ターン交代、パス、終了）をチェックする
     */
    function checkGameStatus() {
        const nextPlayer = (currentPlayer === BLACK) ? WHITE : BLACK;

        if (getValidMoves(nextPlayer).length > 0) {
            currentPlayer = nextPlayer;
        }
        else if (getValidMoves(currentPlayer).length > 0) {
            displayPassMessage(nextPlayer);
        }
        else {
            endGame();
            return;
        }

        renderBoard();
        updateInfo();
    }

    /**
     * パスメッセージを表示する
     */
    function displayPassMessage(passedPlayer) {
        const playerName = (passedPlayer === BLACK) ? '黒' : '白';
        passMessageElement.textContent = `${playerName} はパスします`;
        passMessageElement.classList.remove('hidden');

        setTimeout(() => {
            passMessageElement.classList.add('hidden');
        }, 2000);
    }

    /**
     * ひっくり返せる石のリストを取得する
     */
    function getFlippableStones(row, col, player) {
        if (boardState[row][col] !== EMPTY) return [];

        const opponent = (player === BLACK) ? WHITE : BLACK;
        let flippableStones = [];

        for (const [dr, dc] of directions) {
            let stonesInDirection = [];
            let r = row + dr;
            let c = col + dc;

            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && boardState[r][c] === opponent) {
                stonesInDirection.push({ row: r, col: c });
                r += dr;
                c += dc;
            }

            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && boardState[r][c] === player && stonesInDirection.length > 0) {
                flippableStones = flippableStones.concat(stonesInDirection);
            }
        }
        return flippableStones;
    }

    /**
     * 指定したプレイヤーが置けるすべてのマスのリストを取得する
     */
    function getValidMoves(player) {
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
    
    /**
     * ゲーム情報を更新する (ターン、スコア)
     */
    function updateInfo() {
        let blackCount = 0;
        let whiteCount = 0;
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (boardState[row][col] === BLACK) blackCount++;
                if (boardState[row][col] === WHITE) whiteCount++;
            }
        }
        blackScoreElement.textContent = blackCount;
        whiteScoreElement.textContent = whiteCount;
        currentTurnElement.textContent = (currentPlayer === BLACK) ? '黒' : '白';
    }

    /**
     * ゲームを終了する
     */
    function endGame() {
        isGameOver = true;
        updateInfo();

        const blackCount = parseInt(blackScoreElement.textContent);
        const whiteCount = parseInt(whiteScoreElement.textContent);
        
        let message = "";
        if (blackCount > whiteCount) {
            message = `黒の勝ち！<br>(${blackCount} - ${whiteCount})`;
        } else if (whiteCount > blackCount) {
            message = `白の勝ち！<br>(${whiteCount} - ${blackCount})`;
        } else {
            message = `引き分け<br>(${blackCount} - ${whiteCount})`;
        }
        
        gameOverMessageElement.innerHTML = message;
        gameOverMessageElement.classList.remove('hidden');
        renderBoard();
    }
});
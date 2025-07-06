document.addEventListener('DOMContentLoaded', () => {
    // === DOM要素 ===
    const titleScreen = document.getElementById('title-screen');
    const gameScreen = document.getElementById('game-screen');
    const viewport = document.getElementById('viewport');
    const infiniteBoard = document.getElementById('infinite-board');
    const startButton = document.getElementById('start-button');
    const ruleButton = document.getElementById('rule-button');
    const resetButton = document.getElementById('reset-button');
    const backToTitleButton = document.getElementById('back-to-title-button');
    const turnIndicatorBlack = document.getElementById('turn-indicator-black');
    const turnIndicatorWhite = document.getElementById('turn-indicator-white');
    const gameOverMessageElement = document.getElementById('game-over-message');
    const passMessageElement = document.getElementById('pass-message');
    const ruleModal = document.getElementById('rule-modal');
    const closeRuleButton = document.getElementById('close-rule-button');

    // === 定数 ===
    const CELL_SIZE = 52;
    const BOARD_SIZE = 8;
    const EMPTY = 0, BLACK = 1, WHITE = 2, BLOCK = 3;

    // === ゲームの状態 ===
    let boardState = [];
    let currentPlayer;
    let isGameOver;
    const directions = [
        [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
    ];

    // === 視点とドラッグの状態 ===
    let viewX = 0, viewY = 0;
    let isInteracting = false;
    let didDrag = false;
    let startInteractionX, startInteractionY;
    let lastInteractionX, lastInteractionY;

    // ▼▼▼【重要】前回省略されていたイベントリスナーのコードをここに追加 ▼▼▼
    startButton.addEventListener('click', () => {
        titleScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        initializeGame();
    });
    backToTitleButton.addEventListener('click', () => {
        gameScreen.classList.add('hidden');
        titleScreen.classList.remove('hidden');
    });
    resetButton.addEventListener('click', initializeGame);
    ruleButton.addEventListener('click', () => ruleModal.classList.remove('hidden'));
    closeRuleButton.addEventListener('click', () => ruleModal.classList.add('hidden'));
    ruleModal.addEventListener('click', e => { if (e.target === ruleModal) ruleModal.classList.add('hidden'); });

    // --- マウスとタッチ操作のイベントリスナー ---
    viewport.addEventListener('mousedown', handleInteractionStart);
    window.addEventListener('mousemove', handleInteractionMove);
    window.addEventListener('mouseup', handleInteractionEnd);
    viewport.addEventListener('touchstart', handleInteractionStart, { passive: false });
    window.addEventListener('touchmove', handleInteractionMove, { passive: false });
    window.addEventListener('touchend', handleInteractionEnd);
    // ▲▲▲ ここまでが修正箇所 ▲▲▲

    // === 関数 ===

    function handleInteractionStart(e) {
        if (e.type === 'mousedown' && e.button !== 0) return;
        e.preventDefault();
        isInteracting = true;
        didDrag = false;
        const point = e.touches ? e.touches[0] : e;
        startInteractionX = point.clientX;
        startInteractionY = point.clientY;
        lastInteractionX = point.clientX;
        lastInteractionY = point.clientY;
    }

    function handleInteractionMove(e) {
        if (!isInteracting) return;
        e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        const dx = point.clientX - startInteractionX;
        const dy = point.clientY - startInteractionY;
        if (!didDrag && Math.sqrt(dx*dx + dy*dy) > 5) {
            didDrag = true;
            viewport.style.cursor = 'grabbing';
        }
        if (didDrag) {
            const moveX = point.clientX - lastInteractionX;
            const moveY = point.clientY - lastInteractionY;
            viewX += moveX;
            viewY += moveY;
            infiniteBoard.style.transform = `translate(${viewX}px, ${viewY}px)`;
        }
        lastInteractionX = point.clientX;
        lastInteractionY = point.clientY;
    }

    function handleInteractionEnd(e) {
        if (!isInteracting) return;
        if (didDrag) {
            renderBoard();
        } else {
            const targetCell = e.target.closest('.cell.playable');
            if (targetCell) {
                handleCellTap(targetCell);
            }
        }
        isInteracting = false;
        viewport.style.cursor = 'grab';
    }

    function initializeGame() {
        boardState = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(EMPTY));
        // 初期コマ配置
        boardState[3][3] = WHITE; boardState[3][4] = BLACK;
        boardState[4][3] = BLACK; boardState[4][4] = WHITE;
        // ブロック配置
        boardState[2][2] = BLOCK; boardState[2][5] = BLOCK;
        boardState[5][2] = BLOCK; boardState[5][5] = BLOCK;

        currentPlayer = BLACK;
        isGameOver = false;
        gameOverMessageElement.classList.add('hidden');
        passMessageElement.classList.add('hidden');
        viewX = -CELL_SIZE * 4 + viewport.clientWidth / 2;
        viewY = -CELL_SIZE * 4 + viewport.clientHeight / 2;
        renderBoard();
        updateInfo();
    }

    function renderBoard() {
        infiniteBoard.innerHTML = '';
        infiniteBoard.style.transform = `translate(${viewX}px, ${viewY}px)`;
        const playableMoves = getValidMoves(currentPlayer);
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
                    } else if (pieceState === BLOCK) {
                        piece = document.createElement('div');
                        piece.className = 'block';
                    }
                    if (piece) cell.appendChild(piece);
                }
                infiniteBoard.appendChild(cell);
            }
        }
    }
    
    function handleCellTap(cell) {
        if (isGameOver) return;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const stonesToFlip = getFlippableStones(normalize(row), normalize(col), currentPlayer);
        if (stonesToFlip.length === 0) return;
        boardState[normalize(row)][normalize(col)] = currentPlayer;
        stonesToFlip.forEach(stone => {
            boardState[stone.row][stone.col] = currentPlayer;
        });
        checkGameStatus();
    }
    
    function normalize(coord) { return ((coord % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE; }
    
    function getFlippableStones(row, col, player) {
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
    
    function checkGameStatus() {
        const nextPlayer = (currentPlayer === BLACK) ? WHITE : BLACK;
        if (getValidMoves(nextPlayer).length > 0) {
            currentPlayer = nextPlayer;
        } else if (getValidMoves(currentPlayer).length > 0) {
            displayPassMessage(nextPlayer);
        } else {
            endGame();
            return;
        }
        renderBoard();
        updateInfo();
    }

    function displayPassMessage(passedPlayer) {
        const playerName = (passedPlayer === BLACK) ? '黒' : '白';
        passMessageElement.textContent = `${playerName} はパスします`;
        passMessageElement.classList.remove('hidden');
        setTimeout(() => { passMessageElement.classList.add('hidden'); }, 2000);
    }
    
    function updateInfo() {
        if (currentPlayer === BLACK) {
            turnIndicatorBlack.classList.add('active');
            turnIndicatorWhite.classList.remove('active');
        } else {
            turnIndicatorBlack.classList.remove('active');
            turnIndicatorWhite.classList.add('active');
        }
    }

    function endGame() {
        isGameOver = true;
        updateInfo();
        const resultEl = gameOverMessageElement;
        let blackCount = 0, whiteCount = 0;
        boardState.forEach(row => row.forEach(piece => {
            if (piece === BLACK) blackCount++;
            if (piece === WHITE) whiteCount++;
        }));
        const totalCount = blackCount + whiteCount;
        let mainMessage = "", scoreMessage = "";
        if (totalCount === 0) {
            mainMessage = '引き分け';
            resultEl.style.backgroundColor = '#008000';
            resultEl.style.color = '#eee';
            scoreMessage = `(黒 0.0% - 白 0.0%)`;
        } else if (blackCount > whiteCount) {
            mainMessage = '黒の勝ち！';
            resultEl.style.backgroundColor = '#111';
            resultEl.style.color = '#fff';
            const blackPercentRaw = (blackCount / totalCount) * 100;
            const blackPercent = Math.round(blackPercentRaw * 10) / 10;
            const whitePercent = 100.0 - blackPercent;
            scoreMessage = `(黒 ${blackPercent.toFixed(1)}% - 白 ${whitePercent.toFixed(1)}%)`;
        } else if (whiteCount > blackCount) {
            mainMessage = '白の勝ち！';
            resultEl.style.backgroundColor = '#fff';
            resultEl.style.color = '#111';
            const whitePercentRaw = (whiteCount / totalCount) * 100;
            const whitePercent = Math.round(whitePercentRaw * 10) / 10;
            const blackPercent = 100.0 - whitePercent;
            scoreMessage = `(白 ${whitePercent.toFixed(1)}% - 黒 ${blackPercent.toFixed(1)}%)`;
        } else {
            mainMessage = '引き分け';
            resultEl.style.backgroundColor = '#008000';
            resultEl.style.color = '#eee';
            scoreMessage = `(黒 50.0% - 白 50.0%)`;
        }
        resultEl.innerHTML = `${mainMessage}<span class="score-in-result">${scoreMessage}</span>`;
        resultEl.classList.remove('hidden');
        renderBoard();
    }
});
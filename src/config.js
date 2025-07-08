// src/config.js
export const CELL_SIZE = 50;
// BOARD_SIZE は可変になるため削除

export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;
export const BLOCK = 3;

export const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1]
];

// 盤面サイズごとのデフォルトブロック数
export const defaultBlockCounts = {
    6: 3,
    8: 5,
    10: 8,
    12: 12
};
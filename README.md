# ミラバーシ (Mirrorversi)

![ゲーム画面](https://private-user-images.githubusercontent.com/88648234/502841206-019bbcd9-533b-4fbc-95fa-10513f978a09.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjA3NzQzNTksIm5iZiI6MTc2MDc3NDA1OSwicGF0aCI6Ii84ODY0ODIzNC81MDI4NDEyMDYtMDE5YmJjZDktNTMzYi00ZmJjLTk1ZmEtMTA1MTNmOTc4YTA5LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTEwMTglMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUxMDE4VDA3NTQxOVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWNjNWRkNzYyYzVhZGVhMzZiNDBhYWMzMjZlZmViM2E0OGNiODBkMzg0NDc1OGZjM2ZmODBlMjU0ZmQ3MWM4MjQmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.LEuHwaSaauBhSZ_iLK2CzSZA1FtUhXxDFZLZlLffslo)

**盤面の端が繋がる、新感覚リバーシ。**

これは、盤面の端がループする無限のフィールドで繰り広げられるリバーシ（オセロ）風のボードゲームです。戦略の鍵を握る「ブロック」を配置して、勝利を掴みましょう。

**[[デモはこちら](https://mirrorversi.onrender.com)]**

---

## ✨ 特徴

- **無限ループ盤面:** 盤面の上下・左右の端が繋がっています。盤の角や辺という概念がなく、どこに置いても中央のような感覚でプレイできます。端を越えて相手の石を挟む、ダイナミックな展開が楽しめます。
- **戦略的な「ブロック」:** 各プレイヤーはゲーム開始時に設定された数の「ブロック」を持ちます。ブロックはひっくり返らない障害物として盤面に配置でき、相手の進行を妨害したり、自分の石を守る壁として活用したりと、戦略の幅を大きく広げます。
- **特殊ルール「ライン制圧」:** ある直線上の残り1マスを相手の石が独占している場合、そのマスに自分の石を置くことで、ライン上の全ての石を自分の色にひっくり返すことができます。一発逆転の可能性を秘めたルールです。
- **カスタマイズ可能なゲーム設定:** 盤面のサイズ（6x6〜12x12）やブロックの数を自由に設定してゲームを開始できます。
- **レスポンシブデザイン:** PCのドラッグ操作、スマートフォンのスワイプ操作に両対応。いつでもどこでも快適にプレイできます。

## 遊び方

1.  **ゲームスタート:**
    -   トップ画面の「ゲームスタート」ボタンを押します。
    -   盤面サイズとブロック数を選択し、「この設定で開始」ボタンを押すとゲームが始まります。
2.  **視点移動:**
    -   **PC:** 盤面をドラッグ
    -   **スマートフォン:** 盤面をスワイプ
3.  **ピースの配置:**
    -   画面上部の「石」または「ブロック」ボタンで、置きたいピースを選択します。
    -   盤面上でハイライトされたマスが、ピースを置ける場所です。
    -   置きたいマスをクリック（タップ）すると、ピースが配置されます。

詳しいルールは、トップ画面の「ルール」ボタンから確認できます。

## 🛠️ 使用技術

-   **フロントエンド:** HTML5, CSS3, JavaScript (ES Modules)
-   **ライブラリ/フレームワーク:** なし（すべて素のJavaScriptで実装）

## 💡 こだわった点・実装の詳細

このゲームは、外部ライブラリを一切使用せず、JavaScriptの基本的な機能のみで構築されています。

### 1. 無限盤面の効率的な描画

盤面が無限にループする特徴を表現するため、実際に巨大な盤面をDOMで生成するのではなく、**表示領域に必要な分だけ**マス目を動的に生成・配置しています。

-   ユーザーが盤面をドラッグ/スワイプすると、表示領域（ビューポート）が移動します。
-   移動後に、ビューポート内に表示されるべきマスだけを計算し、`position: absolute`で適切な座標に配置します。
-   これにより、盤面サイズが大きくなっても描画負荷を最小限に抑え、スムーズな操作感を実現しています。

### 2. 複雑なゲームロジックの実装

-   **パスとゲーム終了条件:** 「どちらかの石がなくなる」「両者連続でパスする」など、リバーシ特有の複雑な終了条件を`switchTurn()`メソッド内に集約し、堅牢な判定ロジックを構築しました。
-   **ループを考慮したひっくり返し処理:** `normalize()`関数で座標を正規化（例: 10x10盤面で11番目の座標は1番目として扱う）することにより、盤面の端を越えた石の探索とひっくり返し処理をシンプルに実装しています。

---

## 🚀 今後の展望

-   CPU対戦モードの実装
-   オンライン対戦機能
-   着せ替えテーマ機能

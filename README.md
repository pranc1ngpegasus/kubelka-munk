# Kubelka-Munk Spectral.js Demo

このリポジトリでは、[spectral.js](https://www.npmjs.com/package/spectral.js) を使って 3 色を混色し、Kubelka-Munk 理論に基づくカラーパレットを生成するデモを提供します。

## 使い方

1. 依存関係をインストールします。
   ```bash
   npm install
   ```
2. 開発サーバーを起動し、ブラウザーで `http://localhost:5173` にアクセスします。
   ```bash
   npm run dev
   ```
   または、`index.html` を直接ブラウザーで開いても実行できます。

## 機能

- 3 つのカラーコード（HEX / RGB 文字列など）を入力し、横のカラーチップで即座に確認。
- 3 通りの 2 色ミックスバーをクリックして混色割合を直感的に選択。
- Kubelka-Munk モデルによる 3 色混色を六角形タイルの逆三角形グリッドで可視化。

## 備考

Spectral.js v3 系では、`mix` や `palette` に渡す前に `new spectral.Color()` で色を作成する必要があります。本デモではこの仕様に合わせて実装しています。

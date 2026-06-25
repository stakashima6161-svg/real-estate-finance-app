# デスクトップに置いて使う手順

## 1. ZIPを解凍する

ダウンロードしたZIPを解凍してください。

フォルダ名は次のままで大丈夫です。

```text
real-estate-finance-app
```

## 2. デスクトップに置く

解凍したフォルダをデスクトップに置いてください。

```text
デスクトップ
└── real-estate-finance-app
    ├── index.html
    ├── style.css
    ├── app.js
    ├── README.md
    └── docs
```

## 3. 動作確認

`index.html` をダブルクリックすると、ブラウザで開きます。

まず「サンプル入力」を押して、動きを確認してください。

## 4. GitHubに入れる場合

ターミナルやClaude Codeで、次のように進めます。

```bash
cd ~/Desktop/real-estate-finance-app
git init
git add .
git commit -m "Initial real estate finance app"
```

GitHubで新しいリポジトリを作り、表示されたコマンドに従ってpushしてください。

## 5. Claude Codeで作業する場合

Claude Codeを使う場合は、このフォルダを開いてください。

そのうえで、次のファイルをClaudeに読ませるとスムーズです。

```text
docs/claude-code-prompt.md
docs/specification.md
README.md
```

## 6. 注意

GitHub Pagesで公開する場合、サンプルデータ以外の実データは置かないでください。

このアプリはブラウザ上で計算するだけの設計ですが、公開ページに関与先名・物件名・住所・個人名を入れる運用は避けてください。

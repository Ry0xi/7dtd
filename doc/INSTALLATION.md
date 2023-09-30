# インストールガイド

## Prerequisite

### Node.js

- nodenv などの Node.js バージョン管理ツールを利用を推奨
- バージョンは package.json を参照

### Bun

- ref: https://bun.sh/

```sh
curl -fsSL https://bun.sh/install | bash
```

## EditorConfigプラグインを導入する

- ref: https://editorconfig.org/
- .editorconfig は随時更新

## コードの自動整形

IDE にプラグインを導入してファイル保存時にコードの整形を自動で行う。

### VSCode

下の 2 つの拡張機能をインストールする。

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

あとはVSCodeが`.vscode/settings.json` を読み込んでいればOK

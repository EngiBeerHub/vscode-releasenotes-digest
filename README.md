# Release Digest

VS Codeは頻繁に更新されますが、毎回長い英語Release Notesを読み切るのは大変です。Release Digestは、現在のVS Code Release Notesから重要な変更と利用者への影響をAIで短く整理し、アップデート内容を把握する時間を減らします。

単なる全文翻訳ではなく、「まず知るべき変更」「便利になった点」「必要な人向けの変更」に分けた日本語Digestを生成します。

## What is Release Digest

Release Digestは、現在利用中のVS Codeバージョンに対応する公式Release Notesを取得し、VS Code Language Model APIで日本語に要約するVS Code Extensionです。独自のAI APIキーやバックエンドは使用しません。

## 主な機能

- VS Codeのバージョン更新を検知して一度だけ通知
- Command Paletteから現在バージョンのDigestを手動生成
- 公式Release Notes本文を重要度順に日本語で整理
- DigestをVS Code標準Markdown Previewで表示
- 公式Release NotesへのSourceリンクを付与
- DigestはExtension管理領域へ保存し、workspaceにはファイルを作成しない
- 同じVS Codeバージョンで再生成した場合は同じ内部ファイルを上書き

## Usage

1. Command Paletteを開きます。
2. **Release Digest: 現在のVS Code Release Notesを要約** を実行します。
3. 必要に応じてLanguage Model APIの利用を許可します。
4. 要約が完了すると、DigestがVS Code標準Markdown Previewで表示されます。

VS Code更新後は、表示される通知からもDigestを生成できます。

## 出力イメージ

![Release Digest displayed in the VS Code Markdown Preview](assets/release-digest-preview.png)

## Requirements

- VS Code 1.91 or later.
- VS Codeで利用可能なGitHub Copilot Language Model。

モデルの利用可否、同意、クォータ、適用条件はVS CodeおよびGitHub Copilotによって管理されます。

## Privacy / Data usage

- `https://code.visualstudio.com` から公開Release Notesを取得します。
- 抽出した公開Release Notes本文を、VS Code Language Model API経由で言語モデルへ送信します。
- workspace内のファイル、ソースコード、個人情報は読み取りません。
- 独自サーバー、独自APIキー、アカウント、テレメトリ、データベースは使用しません。

## 現在の制約

- 出力言語は日本語のみです。
- 対象は現在利用中のVS Codeバージョンのみです。
- Release Notes取得にはネットワーク接続が必要です。
- 要約には利用可能なLanguage Modelとクォータが必要です。

## Development

```sh
npm install
npm run build
npm run lint
npm test
npm run package
```

Press F5 in VS Code to launch an Extension Development Host.

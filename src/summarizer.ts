import * as vscode from 'vscode';

const INPUT_TOKEN_RATIO = 0.85;

export class ModelUnavailableError extends Error {
  public constructor() {
    super('利用可能なGitHub Copilot言語モデルが見つかりません。Copilotへのサインインとモデルの利用可否を確認してください。');
    this.name = 'ModelUnavailableError';
  }
}

export async function summarizeReleaseNotes(
  version: string,
  releaseNotes: string,
  token: vscode.CancellationToken
): Promise<string> {
  const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
  const model = models[0];
  if (!model) {
    throw new ModelUnavailableError();
  }

  const prompt = await fitPromptToModel(model, version, releaseNotes, token);
  const messages = [vscode.LanguageModelChatMessage.User(prompt)];
  const response = await model.sendRequest(messages, {}, token);
  let result = '';
  for await (const fragment of response.text) {
    result += fragment;
  }

  if (!result.trim()) {
    throw new Error('言語モデルから空の応答が返されました。');
  }
  return result;
}

async function fitPromptToModel(
  model: vscode.LanguageModelChat,
  version: string,
  releaseNotes: string,
  token: vscode.CancellationToken
): Promise<string> {
  const tokenLimit = Math.floor(model.maxInputTokens * INPUT_TOKEN_RATIO);
  let low = 0;
  let high = releaseNotes.length;
  let bestPrompt = createPrompt(version, '');

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = createPrompt(version, releaseNotes.slice(0, middle));
    const tokens = await model.countTokens(candidate, token);
    if (tokens <= tokenLimit) {
      bestPrompt = candidate;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return bestPrompt;
}

export function createPrompt(version: string, releaseNotes: string): string {
  return `あなたはVS CodeのRelease Notes編集者です。以下の公式Release Notesを日本語で短く要約してください。

要件:
- 全文翻訳ではなく、重要度順に整理する。
- 各項目で「何が変わったか」と「一般的なVS Code利用者への影響」を簡潔に説明する。
- 原文にない内容を推測・追加しない。
- 専門用語、設定名、コマンド名は必要に応じて原文表記を残す。
- Markdownで、次の4見出しをこの順序・表記で必ず1回ずつ出力する。
- タイトルとSourceセクションは拡張機能側で追加するため出力しない。
- 最後の「3行まとめ」はちょうど3個の箇条書きにする。

## 🔥 まず知っておきたい変更
## 👍 便利になったところ
## 🔧 必要な人だけ
## 3行まとめ

対象バージョン: VS Code ${version}

--- Release Notes本文 ---
${releaseNotes}`;
}

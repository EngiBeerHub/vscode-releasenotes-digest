import * as vscode from 'vscode';
import { saveDigestMarkdown } from './digestStorage';
import { showMarkdownPreview } from './markdownPreview';
import { buildDigestDocument } from './presentation';
import {
  extractReleaseNotes,
  fetchReleaseNotes,
  getReleaseNotesUrl,
  getReleaseNotesVersion,
  ReleaseNotesError
} from './releaseNotes';
import { ModelUnavailableError, summarizeReleaseNotes } from './summarizer';
import { detectVersionChange } from './versionDetection';

const COMMAND_ID = 'releaseDigest.summarizeCurrentRelease';
const VERSION_STATE_KEY = 'releaseDigest.lastSeenVSCodeVersion';
const SUMMARIZE_ACTION = '要約を表示';
const SOURCE_ACTION = 'Release Notesを開く';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_ID, () => runDigest(context.globalStorageUri))
  );

  await notifyAfterVersionUpdate(context);
}

export function deactivate(): void {
  // No resources need explicit disposal beyond context subscriptions.
}

async function notifyAfterVersionUpdate(context: vscode.ExtensionContext): Promise<void> {
  const previousVersion = context.globalState.get<string>(VERSION_STATE_KEY);
  const change = detectVersionChange(previousVersion, vscode.version);
  await context.globalState.update(VERSION_STATE_KEY, vscode.version);

  if (change !== 'updated') {
    return;
  }

  const selection = await vscode.window.showInformationMessage(
    `VS Codeが${vscode.version}に更新されました。主な変更を日本語で確認しますか？`,
    SUMMARIZE_ACTION,
    SOURCE_ACTION
  );

  if (selection === SUMMARIZE_ACTION) {
    await vscode.commands.executeCommand(COMMAND_ID);
  } else if (selection === SOURCE_ACTION) {
    await vscode.env.openExternal(vscode.Uri.parse(getReleaseNotesUrl(vscode.version)));
  }
}

async function runDigest(globalStorageUri: vscode.Uri): Promise<void> {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Release Digest',
        cancellable: true
      },
      async (progress, token) => {
        const sourceUrl = getReleaseNotesUrl(vscode.version);
        const releaseVersion = getReleaseNotesVersion(vscode.version);

        progress.report({ message: '公式Release Notesを取得しています…' });
        const html = await fetchReleaseNotes(sourceUrl);
        throwIfCancelled(token);

        progress.report({ message: '本文を抽出しています…' });
        const releaseNotes = extractReleaseNotes(html);
        throwIfCancelled(token);

        progress.report({ message: '言語モデルで日本語要約を作成しています…' });
        const generatedBody = await summarizeReleaseNotes(releaseVersion, releaseNotes, token);
        throwIfCancelled(token);

        const markdown = buildDigestDocument(releaseVersion, generatedBody, sourceUrl);
        const documentUri = await saveDigestMarkdown(
          globalStorageUri,
          releaseVersion,
          markdown,
          {
            createDirectory: (uri) => vscode.workspace.fs.createDirectory(uri),
            joinPath: (base, path) => vscode.Uri.joinPath(base, path),
            writeFile: (uri, content) => vscode.workspace.fs.writeFile(uri, content)
          }
        );
        const document = await vscode.workspace.openTextDocument(documentUri);
        await vscode.window.showTextDocument(document, {
          preview: false,
          preserveFocus: false
        });
        await showMarkdownPreview(
          documentUri,
          (command, resource) => vscode.commands.executeCommand(command, resource)
        );
      }
    );
  } catch (error: unknown) {
    if (isCancellation(error)) {
      return;
    }
    await showDigestError(error);
  }
}

function throwIfCancelled(token: vscode.CancellationToken): void {
  if (token.isCancellationRequested) {
    throw new vscode.CancellationError();
  }
}

function isCancellation(error: unknown): boolean {
  return error instanceof vscode.CancellationError
    || (error instanceof vscode.LanguageModelError && error.code === 'Canceled');
}

async function showDigestError(error: unknown): Promise<void> {
  let message = 'Release Digestの作成に失敗しました。';

  if (error instanceof ModelUnavailableError || error instanceof ReleaseNotesError) {
    message = error.message;
  } else if (error instanceof vscode.LanguageModelError) {
    message = `言語モデルを利用できませんでした: ${error.message}`;
  } else if (error instanceof Error) {
    message = `${message} ${error.message}`;
  }

  const selection = await vscode.window.showErrorMessage(message, SOURCE_ACTION);
  if (selection === SOURCE_ACTION) {
    await vscode.env.openExternal(vscode.Uri.parse(getReleaseNotesUrl(vscode.version)));
  }
}

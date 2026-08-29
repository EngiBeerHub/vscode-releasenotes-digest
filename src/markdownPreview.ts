const MARKDOWN_PREVIEW_COMMAND = 'markdown.showPreview';

export async function showMarkdownPreview<T>(
  resource: T,
  executeCommand: (command: string, resource: T) => PromiseLike<unknown>
): Promise<void> {
  await executeCommand(MARKDOWN_PREVIEW_COMMAND, resource);
}

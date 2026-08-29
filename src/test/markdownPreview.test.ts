import assert from 'node:assert/strict';
import test from 'node:test';
import { showMarkdownPreview } from '../markdownPreview';

test('opens the generated document with the built-in Markdown Preview command', async () => {
  const resource = { scheme: 'untitled', path: 'Untitled-1' };
  const calls: Array<{ command: string; resource: typeof resource }> = [];

  await showMarkdownPreview(resource, async (command, commandResource) => {
    calls.push({ command, resource: commandResource });
  });

  assert.deepEqual(calls, [
    { command: 'markdown.showPreview', resource }
  ]);
});

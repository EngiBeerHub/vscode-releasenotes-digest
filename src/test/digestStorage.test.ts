import assert from 'node:assert/strict';
import test from 'node:test';
import { saveDigestMarkdown } from '../digestStorage';

test('saves a digest to a stable versioned Markdown file in global storage', async () => {
  const storageUri = '/global-storage/release-digest';
  const files = new Map<string, string>();
  const createdDirectories: string[] = [];
  const operations = {
    createDirectory: async (uri: string): Promise<void> => {
      createdDirectories.push(uri);
    },
    joinPath: (base: string, path: string): string => `${base}/${path}`,
    writeFile: async (uri: string, content: Uint8Array): Promise<void> => {
      files.set(uri, new TextDecoder().decode(content));
    }
  };

  const firstUri = await saveDigestMarkdown(storageUri, '1.135', '# First', operations);
  const secondUri = await saveDigestMarkdown(storageUri, '1.135', '# Updated', operations);

  assert.equal(firstUri, '/global-storage/release-digest/release-digest-v1_135.md');
  assert.equal(secondUri, firstUri);
  assert.deepEqual(createdDirectories, [storageUri, storageUri]);
  assert.equal(files.get(firstUri), '# Updated');
});

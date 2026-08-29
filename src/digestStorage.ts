export interface DigestStorageOperations<T> {
  createDirectory(uri: T): PromiseLike<void>;
  joinPath(base: T, path: string): T;
  writeFile(uri: T, content: Uint8Array): PromiseLike<void>;
}

export async function saveDigestMarkdown<T>(
  storageUri: T,
  version: string,
  markdown: string,
  operations: DigestStorageOperations<T>
): Promise<T> {
  await operations.createDirectory(storageUri);
  const fileName = `release-digest-v${version.replaceAll('.', '_')}.md`;
  const documentUri = operations.joinPath(storageUri, fileName);
  await operations.writeFile(documentUri, new TextEncoder().encode(markdown));
  return documentUri;
}

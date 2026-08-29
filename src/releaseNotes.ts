import * as https from 'node:https';

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;

export class ReleaseNotesError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ReleaseNotesError';
  }
}

export function getReleaseNotesVersion(version: string): string {
  const match = /^(\d+)\.(\d+)/.exec(version);
  if (!match) {
    throw new ReleaseNotesError(`VS Codeのバージョン形式を解釈できません: ${version}`);
  }

  return `${match[1]}.${match[2]}`;
}

export function getReleaseNotesUrl(version: string): string {
  return `https://code.visualstudio.com/updates/v${getReleaseNotesVersion(version).replace('.', '_')}`;
}

export async function fetchReleaseNotes(url: string): Promise<string> {
  return requestText(url, 0);
}

function requestText(url: string, redirectCount: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'Release-Digest-VSCode-Extension/0.1'
        }
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        const location = response.headers.location;

        if (statusCode >= 300 && statusCode < 400 && location) {
          response.resume();
          if (redirectCount >= MAX_REDIRECTS) {
            reject(new ReleaseNotesError('Release Notesのリダイレクト回数が上限を超えました。'));
            return;
          }
          const nextUrl = new URL(location, url).toString();
          void requestText(nextUrl, redirectCount + 1).then(resolve, reject);
          return;
        }

        if (statusCode !== 200) {
          response.resume();
          reject(new ReleaseNotesError(`Release Notesの取得に失敗しました（HTTP ${statusCode}）。`));
          return;
        }

        const contentType = response.headers['content-type'] ?? '';
        if (!contentType.includes('text/html')) {
          response.resume();
          reject(new ReleaseNotesError('Release NotesからHTML以外の応答が返されました。'));
          return;
        }

        const chunks: Buffer[] = [];
        let receivedBytes = 0;
        response.on('data', (chunk: Buffer) => {
          receivedBytes += chunk.length;
          if (receivedBytes > MAX_RESPONSE_BYTES) {
            request.destroy(new ReleaseNotesError('Release Notesのサイズが上限を超えました。'));
            return;
          }
          chunks.push(chunk);
        });
        response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        response.on('error', reject);
      }
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new ReleaseNotesError('Release Notesの取得がタイムアウトしました。'));
    });
    request.on('error', (error) => {
      reject(error instanceof ReleaseNotesError
        ? error
        : new ReleaseNotesError(`Release Notesの取得に失敗しました: ${error.message}`));
    });
  });
}

export function extractReleaseNotes(html: string): string {
  const mainMatch = /<main\b[^>]*class=["'][^"']*docs-main-content[^"']*["'][^>]*>([\s\S]*?)<div\b[^>]*class=["'][^"']*feedback[^"']*["']/i.exec(html);
  if (!mainMatch) {
    throw new ReleaseNotesError('Release Notes本文をHTMLから抽出できませんでした。公式ページの構造が変更された可能性があります。');
  }

  let content = mainMatch[1];
  content = content.replace(/<h2\b[^>]*id=["']_thank-you["'][^>]*>[\s\S]*$/i, '');
  content = content.replace(/<!--[\s\S]*?-->/g, ' ');
  content = content.replace(/<(script|style|svg|video|picture|figure)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  content = content.replace(/<(img|source)\b[^>]*>/gi, ' ');
  content = content.replace(/<h[1-4]\b[^>]*>/gi, '\n\n## ');
  content = content.replace(/<\/h[1-4]>/gi, '\n');
  content = content.replace(/<li\b[^>]*>/gi, '\n- ');
  content = content.replace(/<\/(li|p|ul|ol|blockquote|pre|table|tr)>/gi, '\n');
  content = content.replace(/<(br|hr)\b[^>]*>/gi, '\n');
  content = content.replace(/<code\b[^>]*>/gi, '`').replace(/<\/code>/gi, '`');
  content = content.replace(/<[^>]+>/g, ' ');
  content = decodeHtmlEntities(content);
  content = content.replace(/\r/g, '');
  content = content.replace(/[ \t]+/g, ' ');
  content = content.replace(/ *\n */g, '\n');
  content = content.replace(/\n{3,}/g, '\n\n').trim();

  if (content.length < 200) {
    throw new ReleaseNotesError('抽出したRelease Notes本文が短すぎます。公式ページの構造が変更された可能性があります。');
  }

  return content;
}

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    hellip: '…',
    lt: '<',
    nbsp: ' ',
    quot: '"'
  };

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
    }
    if (body.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
    }
    return namedEntities[body.toLowerCase()] ?? entity;
  });
}

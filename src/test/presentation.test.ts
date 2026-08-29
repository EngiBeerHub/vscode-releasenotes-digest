import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDigestDocument } from '../presentation';

const validBody = `## 🔥 まず知っておきたい変更
- 重要な変更

## 👍 便利になったところ
- 便利な変更

## 🔧 必要な人だけ
- 特定用途の変更

## 3行まとめ
- 1行目
- 2行目
- 3行目`;

test('builds the fixed title and official source around the AI body', () => {
  const result = buildDigestDocument('1.135', validBody, 'https://code.visualstudio.com/updates/v1_135');
  assert.match(result, /^# VS Code 1\.135 Release Digest/);
  assert.match(result, /## Source\n\n\[公式 VS Code 1\.135 Release Notes\]/);
});

test('surrounds every output heading with blank lines', () => {
  const compactBody = validBody.replaceAll('\n\n', '\n');
  const result = buildDigestDocument(
    '1.135',
    compactBody,
    'https://code.visualstudio.com/updates/v1_135'
  );
  const lines = result.trimEnd().split('\n');

  for (const [index, line] of lines.entries()) {
    if (!/^#{1,6}\s+\S/.test(line)) {
      continue;
    }
    if (index > 0) {
      assert.equal(lines[index - 1], '', `expected a blank line before: ${line}`);
    }
    assert.equal(lines[index + 1], '', `expected a blank line after: ${line}`);
  }
});

test('rejects an AI response that omits a required section', () => {
  assert.throws(
    () => buildDigestDocument('1.135', validBody.replace('## 3行まとめ', '## Summary'), 'https://example.com'),
    /必要な見出し/
  );
});

test('rejects required headings in the wrong order', () => {
  const wrongOrder = validBody
    .replace('## 👍 便利になったところ', '## TEMP')
    .replace('## 🔧 必要な人だけ', '## 👍 便利になったところ')
    .replace('## TEMP', '## 🔧 必要な人だけ');

  assert.throws(
    () => buildDigestDocument('1.135', wrongOrder, 'https://example.com'),
    /見出し順序/
  );
});

const requiredHeadings = [
  '## 🔥 まず知っておきたい変更',
  '## 👍 便利になったところ',
  '## 🔧 必要な人だけ',
  '## 3行まとめ'
] as const;

for (const heading of requiredHeadings) {
  test(`rejects a duplicated required heading: ${heading}`, () => {
    const duplicate = `${validBody}\n\n${heading}\n- 重複した項目`;

    assert.throws(
      () => buildDigestDocument('1.135', duplicate, 'https://example.com'),
      /見出しが重複/
    );
  });
}

test('rejects fewer than three summary items', () => {
  const twoItems = validBody.replace('\n- 3行目', '');

  assert.throws(
    () => buildDigestDocument('1.135', twoItems, 'https://example.com'),
    /3項目である必要/
  );
});

test('rejects more than three summary items', () => {
  const fourItems = `${validBody}\n- 4行目`;

  assert.throws(
    () => buildDigestDocument('1.135', fourItems, 'https://example.com'),
    /3項目である必要/
  );
});

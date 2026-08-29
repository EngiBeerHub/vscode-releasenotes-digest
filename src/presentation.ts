const REQUIRED_HEADINGS = [
  '## 🔥 まず知っておきたい変更',
  '## 👍 便利になったところ',
  '## 🔧 必要な人だけ',
  '## 3行まとめ'
] as const;

export function buildDigestDocument(
  version: string,
  generatedBody: string,
  sourceUrl: string
): string {
  const body = stripWrappingCodeFence(generatedBody.trim());
  const withoutTitle = body.replace(/^# VS Code[^\n]*Release Digest\s*/i, '');
  validateDigestStructure(withoutTitle);
  const withoutSource = withoutTitle.replace(/\n## Source[\s\S]*$/i, '').trim();

  return [
    `# VS Code ${version} Release Digest`,
    '',
    withoutSource,
    '',
    '## Source',
    '',
    `[公式 VS Code ${version} Release Notes](${sourceUrl})`,
    ''
  ].join('\n');
}

function validateDigestStructure(body: string): void {
  const lines = body.split('\n');
  const headingPositions = REQUIRED_HEADINGS.map((heading) => {
    const positions = lines.flatMap((line, index) => line.trim() === heading ? [index] : []);
    if (positions.length === 0) {
      throw new Error(`AI要約に必要な見出しがありません: ${heading}`);
    }
    if (positions.length > 1) {
      throw new Error(`AI要約の見出しが重複しています: ${heading}`);
    }
    return positions[0];
  });

  for (let index = 1; index < headingPositions.length; index += 1) {
    if (headingPositions[index - 1] >= headingPositions[index]) {
      throw new Error('AI要約の見出し順序が正しくありません。');
    }
  }

  const summaryStart = headingPositions[headingPositions.length - 1] + 1;
  const summaryEndOffset = lines
    .slice(summaryStart)
    .findIndex((line) => /^##\s+/.test(line.trim()));
  const summaryEnd = summaryEndOffset === -1
    ? lines.length
    : summaryStart + summaryEndOffset;
  const summaryItemCount = lines
    .slice(summaryStart, summaryEnd)
    .filter((line) => /^(?:[-+*]|\d+[.)])\s+\S/.test(line)).length;

  if (summaryItemCount !== 3) {
    throw new Error(`AI要約の「3行まとめ」は3項目である必要があります（現在${summaryItemCount}項目）。`);
  }
}

function stripWrappingCodeFence(value: string): string {
  const match = /^```(?:markdown)?\s*\n([\s\S]*?)\n```$/i.exec(value);
  return match ? match[1].trim() : value;
}

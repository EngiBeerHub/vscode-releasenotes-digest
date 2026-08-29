import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractReleaseNotes,
  fetchReleaseNotes,
  getReleaseNotesUrl,
  getReleaseNotesVersion,
  ReleaseNotesError
} from '../releaseNotes';

test('maps a full VS Code version to the major-minor release page', () => {
  assert.equal(getReleaseNotesVersion('1.135.2'), '1.135');
  assert.equal(getReleaseNotesUrl('1.135.2'), 'https://code.visualstudio.com/updates/v1_135');
});

test('extracts the release note body and excludes page chrome and acknowledgements', () => {
  const html = `
    <nav>Navigation</nav>
    <main class="docs-main-content body">
      <h1>Visual Studio Code 1.135</h1>
      <h2 id="_agents">Agents &amp; Chat</h2>
      <p>A useful <code>setting.name</code> changed.</p>
      <ul>
        <li>First impact with enough detail to represent a real release-note paragraph for extraction.</li>
        <li>Second impact explains what changed and why it matters to a Visual Studio Code user.</li>
        <li>Third impact gives the fixture enough realistic content for the minimum-length guard.</li>
      </ul>
      <!-- <nav>In this update <a href="#thank-you">Thank you</a></nav> -->
      <h2 id="_thank-you">Thank you</h2>
      <p>Contributor names should not be included.</p>
      <div class="feedback"></div>
    </main>`;

  const extracted = extractReleaseNotes(html);
  assert.match(extracted, /Visual Studio Code 1\.135/);
  assert.match(extracted, /Agents & Chat/);
  assert.match(extracted, /`setting\.name`/);
  assert.doesNotMatch(extracted, /Navigation/);
  assert.doesNotMatch(extracted, /Contributor/);
  assert.doesNotMatch(extracted, /In this update/);
});

test('reports an actionable extraction error when the official HTML shape changes', () => {
  assert.throws(
    () => extractReleaseNotes('<html><main>different shape</main></html>'),
    ReleaseNotesError
  );
});

test('wraps a network failure in a user-facing release notes error', async () => {
  await assert.rejects(
    fetchReleaseNotes('https://127.0.0.1:1/updates/v1_135'),
    (error: unknown) => error instanceof ReleaseNotesError
      && /Release Notesの取得に失敗/.test(error.message)
  );
});

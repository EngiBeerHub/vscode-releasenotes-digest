import assert from 'node:assert/strict';
import test from 'node:test';
import { detectVersionChange } from '../versionDetection';

test('first activation records the version without treating it as an update', () => {
  assert.equal(detectVersionChange(undefined, '1.135.0'), 'firstRun');
});

test('a different VS Code version is detected as an update', () => {
  assert.equal(detectVersionChange('1.134.2', '1.135.0'), 'updated');
});

test('the same VS Code version is unchanged', () => {
  assert.equal(detectVersionChange('1.135.0', '1.135.0'), 'unchanged');
});

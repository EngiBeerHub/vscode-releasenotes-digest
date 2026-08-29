export type VersionChange = 'firstRun' | 'updated' | 'unchanged';

export function detectVersionChange(
  previousVersion: string | undefined,
  currentVersion: string
): VersionChange {
  if (previousVersion === undefined) {
    return 'firstRun';
  }

  return previousVersion === currentVersion ? 'unchanged' : 'updated';
}

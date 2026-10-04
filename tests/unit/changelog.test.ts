import { describe, expect, it } from 'vitest';
import { releaseNotes, versionErrors } from '../../scripts/changelog';

const CHANGELOG = `# Changelog

Intro text.

## [Unreleased]

## [1.1.0] - 2026-11-01

### Added

- New page.

## [1.0.0] - 2026-10-04

### Fixed

- A bug.
`;

describe('releaseNotes', () => {
  it('returns the body of the version section, without its heading', () => {
    expect(releaseNotes(CHANGELOG, '1.1.0')).toBe('### Added\n\n- New page.');
  });

  it('reads the last section up to the end of the file', () => {
    expect(releaseNotes(CHANGELOG, '1.0.0')).toBe('### Fixed\n\n- A bug.');
  });

  it('returns null for a version without a section', () => {
    expect(releaseNotes(CHANGELOG, '0.9.0')).toBeNull();
  });

  it('matches the version exactly, not as a prefix or pattern', () => {
    expect(releaseNotes(CHANGELOG, '1.0')).toBeNull();
    expect(releaseNotes(CHANGELOG, '1.1.0'.replace('.', '\\.'))).toBeNull();
  });
});

describe('versionErrors', () => {
  it('accepts a SemVer version with a non-empty section', () => {
    expect(versionErrors(CHANGELOG, '1.1.0')).toEqual([]);
  });

  it('rejects a version that is not SemVer', () => {
    expect(versionErrors(CHANGELOG, 'v1.1')).toEqual(['version "v1.1" is not SemVer x.y.z']);
  });

  it('rejects a version without a CHANGELOG section', () => {
    expect(versionErrors(CHANGELOG, '2.0.0')).toEqual([
      'CHANGELOG.md has no section "## [2.0.0] - YYYY-MM-DD"',
    ]);
  });

  it('rejects an empty section', () => {
    const empty = '# Changelog\n\n## [2.0.0] - 2026-12-01\n\n## [1.0.0] - 2026-10-04\n\n- x\n';
    expect(versionErrors(empty, '2.0.0')).toEqual(['CHANGELOG.md section 2.0.0 is empty']);
  });
});

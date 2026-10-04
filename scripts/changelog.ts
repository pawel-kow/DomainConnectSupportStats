/**
 * CHANGELOG.md sections: `## [x.y.z] - YYYY-MM-DD`, one per released version.
 */

const SEMVER = /^\d+\.\d+\.\d+$/;

/** The body of the version's section, trimmed, or `null` if there is no section. */
export function releaseNotes(changelog: string, version: string): string | null {
  const lines = changelog.split('\n');
  const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('## '));
  return (end < 0 ? rest : rest.slice(0, end)).join('\n').trim();
}

/** Problems with releasing `version` from this CHANGELOG; empty when releasable. */
export function versionErrors(changelog: string, version: string): string[] {
  if (!SEMVER.test(version)) return [`version "${version}" is not SemVer x.y.z`];
  const notes = releaseNotes(changelog, version);
  if (notes === null) return [`CHANGELOG.md has no section "## [${version}] - YYYY-MM-DD"`];
  if (!notes) return [`CHANGELOG.md section ${version} is empty`];
  return [];
}

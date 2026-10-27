/*
================================================================================
File: scripts/candidate-fingerprint.js
Description: Produce a reproducible identity for a staged Git candidate.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-21
================================================================================
*/

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
export const GIT_OUTPUT_MAX_BUFFER_BYTES = 64 * 1024 * 1024;

/**
 * Hash arbitrary bytes using SHA-256.
 * @param {string | Buffer} value - Bytes to hash.
 * @returns {string} SHA-256 digest.
 */
function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Convert a repository-relative candidate path into a safe canonical path.
 * @param {string} candidatePath - User-supplied candidate path.
 * @param {string} projectRoot - Absolute repository root.
 * @returns {string} Canonical repository-relative path.
 */
function normalizePath(candidatePath, projectRoot) {
  const absolutePath = resolve(projectRoot, candidatePath);
  const normalizedPath = relative(projectRoot, absolutePath);

  if (normalizedPath === '' || normalizedPath.startsWith('..')) {
    throw new Error(`Candidate path must be inside the repository: ${candidatePath}`);
  }

  return normalizedPath;
}

/**
 * Run Git and return unmodified output bytes.
 * @param {string[]} args - Arguments passed to Git.
 * @param {string} projectRoot - Absolute repository root.
 * @param {typeof execFileSync} executeGit - Process runner used to execute Git.
 * @returns {Buffer} Command output.
 */
function runGit(args, projectRoot, executeGit) {
  return executeGit('git', args, {
    cwd: projectRoot,
    maxBuffer: GIT_OUTPUT_MAX_BUFFER_BYTES,
  });
}

/**
 * Read NUL-delimited Git paths without breaking filenames containing spaces.
 * @param {Buffer} output - NUL-delimited Git output.
 * @returns {string[]} Paths in Git's output.
 */
function readNullDelimitedPaths(output) {
  return output.toString('utf8').split('\0').filter(Boolean).sort();
}

/**
 * Determine whether a changed path falls within a candidate scope path.
 * @param {string} changedPath - Repository-relative changed path.
 * @param {string[]} scope - Canonical candidate scope paths.
 * @returns {boolean} Whether the path is included in the scope.
 */
function isInScope(changedPath, scope) {
  return scope.some(
    (scopePath) => changedPath === scopePath || changedPath.startsWith(`${scopePath}/`)
  );
}

/**
 * Build the reproducible candidate payload for a staged scope.
 * @param {string[]} requestedPaths - Repository-relative candidate paths.
 * @param {object} [options] - Optional dependencies for isolated verification.
 * @param {string} [options.projectRoot] - Absolute repository root.
 * @param {typeof execFileSync} [options.executeGit] - Process runner used to execute Git.
 * @returns {object} Candidate identity and its SHA-256 fingerprint.
 */
export function createCandidateFingerprint(
  requestedPaths,
  { projectRoot = PROJECT_ROOT, executeGit = execFileSync } = {}
) {
  if (requestedPaths.length === 0) {
    throw new Error('Pass one or more repository-relative candidate paths after --.');
  }

  const scope = [...new Set(requestedPaths.map((path) => normalizePath(path, projectRoot)))].sort();
  const runRepositoryGit = (args) => runGit(args, projectRoot, executeGit);
  const baseHead = runRepositoryGit(['rev-parse', 'HEAD']).toString('utf8').trim();
  const gitStatus = runRepositoryGit(['status', '--short', '--untracked-files=all']).toString(
    'utf8'
  );
  const scopedStatus = runRepositoryGit([
    'status',
    '--short',
    '--untracked-files=all',
    '--',
    ...scope,
  ]).toString('utf8');
  const stagedPaths = readNullDelimitedPaths(
    runRepositoryGit(['diff', '--cached', '--no-renames', '--name-only', '-z', 'HEAD'])
  );
  const unstagedPaths = readNullDelimitedPaths(
    runRepositoryGit(['diff', '--name-only', '-z', '--', ...scope])
  );
  const untrackedPaths = readNullDelimitedPaths(
    runRepositoryGit(['ls-files', '--others', '--exclude-standard', '-z', '--', ...scope])
  );
  const outOfScopeStagedPaths = stagedPaths.filter((filePath) => !isInScope(filePath, scope));
  const scopedStagedPaths = stagedPaths.filter((filePath) => isInScope(filePath, scope));

  if (outOfScopeStagedPaths.length > 0) {
    throw new Error(
      `Unstage unrelated changes before fingerprinting: ${outOfScopeStagedPaths.join(', ')}`
    );
  }

  if (scopedStagedPaths.length === 0) {
    throw new Error('Stage the candidate paths before fingerprinting.');
  }

  if (unstagedPaths.length > 0 || untrackedPaths.length > 0) {
    throw new Error(
      'Stage all scoped changes and remove untracked scoped files before fingerprinting.'
    );
  }

  const stagedDiff = runRepositoryGit(['diff', '--cached', '--binary', 'HEAD']);
  const payload = {
    baseHead,
    scope,
    gitStatus,
    scopedStatus,
    stagedFiles: scopedStagedPaths,
    stagedDiffSha256: hash(stagedDiff),
  };

  return { ...payload, fingerprint: hash(JSON.stringify(payload)) };
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  process.stdout.write(
    `${JSON.stringify(createCandidateFingerprint(process.argv.slice(2)), null, 2)}\n`
  );
}

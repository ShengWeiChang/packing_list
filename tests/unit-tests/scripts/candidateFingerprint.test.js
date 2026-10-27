/*
================================================================================
File: tests/unit-tests/scripts/candidateFingerprint.test.js
Description: Tests the binary-output capacity required by candidate fingerprints.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-26
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  createCandidateFingerprint,
  GIT_OUTPUT_MAX_BUFFER_BYTES,
} from '../../../scripts/candidate-fingerprint.js';

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('candidate fingerprint output capacity', () => {
  // ---------------------------------------------------------------------------
  // Test Group 1: Binary candidate capacity
  // ---------------------------------------------------------------------------

  // Test Case 1: Should allow a staged binary diff larger than the completion asset collection
  it('allows a staged binary diff larger than the completion asset collection', () => {
    const completionAssetBytes = 4_907_424;

    expect(GIT_OUTPUT_MAX_BUFFER_BYTES).toBeGreaterThan(completionAssetBytes);
  });

  // Test Case 2: Should fingerprint a staged binary candidate larger than Node's default buffer
  it('fingerprints a staged binary candidate larger than the default process buffer', () => {
    const repository = mkdtempSync(join(tmpdir(), 'candidate-fingerprint-test-'));

    try {
      execFileSync('git', ['init', '--quiet'], { cwd: repository });
      writeFileSync(join(repository, 'README.md'), 'base\n');
      execFileSync('git', ['add', 'README.md'], { cwd: repository });
      execFileSync(
        'git',
        [
          '-c',
          'user.name=Candidate Test',
          '-c',
          'user.email=candidate@example.test',
          'commit',
          '--quiet',
          '-m',
          'base',
        ],
        { cwd: repository }
      );

      writeFileSync(join(repository, 'large.bin'), randomBytes(2 * 1024 * 1024));
      execFileSync('git', ['add', 'large.bin'], { cwd: repository });

      const candidate = createCandidateFingerprint(['large.bin'], { projectRoot: repository });

      expect(candidate.stagedFiles).toEqual(['large.bin']);
      expect(candidate.stagedDiffSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(candidate.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    } finally {
      rmSync(repository, { force: true, recursive: true });
    }
  });
});

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import test from 'node:test';

test('container runner uses fresh reports and propagates the test exit code', () => {
  const root = mkdtempSync(join(tmpdir(), 'packing-container-contract-'));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'bin'));
    mkdirSync(join(root, '.container-test-artifacts'));
    mkdirSync(join(root, '.container-test-artifacts', 'old'));
    writeFileSync(join(root, '.container-test-artifacts', 'old', 'report.txt'), 'old report');
    writeFileSync(
      join(root, 'scripts', 'ci-container.sh'),
      readFileSync(resolve('scripts/ci-container.sh'))
    );
    writeFileSync(join(root, 'bin', 'git'), '#!/bin/sh\necho fixture-commit\n', { mode: 0o755 });
    writeFileSync(join(root, 'bin', 'docker'), '#!/bin/sh\n[ "$1" = build ] || exit 37\n', {
      mode: 0o755,
    });
    const environment = {
      ...process.env,
      PATH: `${join(root, 'bin')}:${process.env.PATH}`,
      CI_ARTIFACT_DIR: '.container-test-artifacts/new',
      GITHUB_SHA: 'fixture-commit',
    };
    const result = spawnSync('sh', [join(root, 'scripts', 'ci-container.sh'), 'full'], {
      cwd: root,
      env: environment,
      encoding: 'utf8',
    });
    assert.equal(result.status, 37, result.stderr);
    assert.equal(
      readFileSync(join(root, '.container-test-artifacts', 'old', 'report.txt'), 'utf8'),
      'old report'
    );
    const metadata = readFileSync(
      join(root, '.container-test-artifacts', 'new', 'test-inventory-reports', 'run-metadata.txt'),
      'utf8'
    );
    assert.match(metadata, /checkout=fixture-commit/);
    const mismatch = spawnSync('sh', [join(root, 'scripts', 'ci-container.sh'), 'full'], {
      cwd: root,
      env: {
        ...environment,
        CI_ARTIFACT_DIR: '.container-test-artifacts/mismatch',
        GITHUB_SHA: 'different-commit',
      },
      encoding: 'utf8',
    });
    assert.notEqual(mismatch.status, 0);
    assert.match(mismatch.stderr, /Checkout does not match/);
    assert.throws(() =>
      execFileSync('sh', [join(root, 'scripts', 'ci-container.sh'), 'full'], {
        cwd: root,
        env: { ...environment, CI_ARTIFACT_DIR: '.container-test-artifacts/../outside' },
        stdio: 'pipe',
      })
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

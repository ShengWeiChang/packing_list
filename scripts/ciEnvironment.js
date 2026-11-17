/* Record and verify the exact GitHub checkout before a full native OS gate. */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import process from 'node:process';

const output = resolve('.container-test-artifacts', 'native-metadata');
mkdirSync(output, { recursive: true });
const checkout = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const metadata = {
  checkout,
  expectedCheckout: process.env.GITHUB_SHA ?? 'not-a-github-run',
  prHead: process.env.PR_HEAD_SHA ?? 'not-a-pr',
  prBase: process.env.PR_BASE_SHA ?? 'not-a-pr',
  runId: process.env.GITHUB_RUN_ID ?? 'local',
  runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? 'local',
  platform: os.platform(),
  arch: os.arch(),
  release: os.release(),
  osVersion: os.version(),
  node: process.version,
};
writeFileSync(resolve(output, 'environment.json'), JSON.stringify(metadata, null, 2));
if (process.env.GITHUB_SHA && checkout !== process.env.GITHUB_SHA) {
  process.stderr.write('Checkout does not match the GitHub event revision.\n');
  process.exitCode = 1;
}

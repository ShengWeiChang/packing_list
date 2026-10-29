/*
================================================================================
File: scripts/checkTypeScriptScope.js
Description: Reject unchecked source files outside the explicit migration scope
             and application files missing from the compiler project.
License: MIT (SPDX: MIT)
================================================================================
*/

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { parse } from 'vue/compiler-sfc';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');

/**
 * Collect source modules, including extensions not allowed by this project.
 * @param {string} directory - Directory to walk.
 * @returns {string[]} Absolute source-module paths.
 */
function collectSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return /\.(?:[cm]?[jt]sx?|vue)$/.test(entry.name) ? [path] : [];
  });
}

/**
 * Validate an exact allowance list rather than silently accepting stale entries.
 * @param {string} label - Migration category.
 * @param {string[]} actual - Actual unchecked files.
 * @param {unknown} allowed - Recorded migration entries.
 */
function checkAllowance(label, actual, allowed) {
  if (!Array.isArray(allowed) || allowed.some((path) => typeof path !== 'string')) {
    throw new Error(`${label} must be an array of source paths`);
  }
  if (new Set(allowed).size !== allowed.length) {
    throw new Error(`${label} contains duplicate paths`);
  }
  const unlisted = actual.filter((path) => !allowed.includes(path));
  const stale = allowed.filter((path) => !actual.includes(path));
  if (unlisted.length || stale.length) {
    throw new Error(
      `${label} mismatch. Unlisted: ${unlisted.join(', ') || 'none'}. Stale: ${stale.join(', ') || 'none'}`
    );
  }
}

/**
 * Verify that every application module belongs to the configured compiler scope.
 * @param {string} [projectRoot=PROJECT_ROOT] - Repository root (or isolated test root).
 * @returns {{modules: number, uncheckedJavaScript: number, uncheckedVueScripts: number}} Scope counts.
 */
export function checkTypeScriptScope(projectRoot = PROJECT_ROOT) {
  const configPath = resolve(projectRoot, 'tsconfig.app.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error)
    throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    dirname(configPath),
    undefined,
    configPath,
    undefined,
    [{ extension: '.vue', isMixedContent: true, scriptKind: ts.ScriptKind.Deferred }]
  );
  if (parsed.errors.length) {
    throw new Error(
      parsed.errors
        .map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n'))
        .join('\n')
    );
  }
  const options = parsed.options;
  if (!options.strict || !options.noUncheckedIndexedAccess || !options.noEmit) {
    throw new Error('Application checking requires strict, noUncheckedIndexedAccess and noEmit');
  }
  if (config.config.vueCompilerOptions?.strictTemplates !== true) {
    throw new Error('Application config must enable strictTemplates explicitly');
  }
  const strictFlags = [
    'noImplicitAny',
    'noImplicitThis',
    'strictNullChecks',
    'strictFunctionTypes',
    'strictBindCallApply',
    'strictPropertyInitialization',
    'strictBuiltinIteratorReturn',
    'alwaysStrict',
    'useUnknownInCatchVariables',
  ];
  if (strictFlags.some((flag) => options[flag] === false)) {
    throw new Error('Application config must not disable strict sub-options');
  }
  const paths = collectSourceFiles(resolve(projectRoot, 'source')).sort();
  const roots = new Set(parsed.fileNames.map((path) => resolve(path)));
  const uncheckedJavaScript = [];
  const uncheckedVueScripts = [];
  for (const path of paths) {
    const name = relative(projectRoot, path).replaceAll('\\', '/');
    if (!roots.has(path)) throw new Error(`Source module missing from compiler roots: ${name}`);
    if (path.endsWith('.js')) uncheckedJavaScript.push(name);
    else if (path.endsWith('.vue')) {
      const { descriptor, errors } = parse(readFileSync(path, 'utf8'), { filename: path });
      if (errors.length) throw new Error(`Cannot parse Vue source: ${name}`);
      const scripts = [descriptor.script, descriptor.scriptSetup].filter(Boolean);
      if (scripts.some((script) => !script.lang || script.lang === 'js'))
        uncheckedVueScripts.push(name);
      if (
        scripts.some((script) => script.src || (script.lang && !['js', 'ts'].includes(script.lang)))
      ) {
        throw new Error(`Unsupported Vue script boundary: ${name}`);
      }
    } else if (!path.endsWith('.ts')) throw new Error(`Unsupported source extension: ${name}`);
  }
  const migrationPath = resolve(projectRoot, 'typescript-migration.json');
  const allowance = existsSync(migrationPath)
    ? JSON.parse(readFileSync(migrationPath, 'utf8'))
    : { uncheckedJavaScript: [], uncheckedVueScripts: [] };
  checkAllowance('uncheckedJavaScript', uncheckedJavaScript, allowance.uncheckedJavaScript);
  checkAllowance('uncheckedVueScripts', uncheckedVueScripts, allowance.uncheckedVueScripts);
  if (
    !uncheckedJavaScript.length &&
    !uncheckedVueScripts.length &&
    (options.allowJs || existsSync(migrationPath))
  ) {
    throw new Error('Migration is complete: remove allowJs and the migration manifest');
  }
  return {
    modules: paths.length,
    uncheckedJavaScript: uncheckedJavaScript.length,
    uncheckedVueScripts: uncheckedVueScripts.length,
  };
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  try {
    const result = checkTypeScriptScope();
    process.stdout.write(
      `TypeScript scope verified: ${result.modules} source modules in compiler roots.\n`
    );
    process.stdout.write(
      `Not yet type-checked: ${result.uncheckedJavaScript} JavaScript modules; ${result.uncheckedVueScripts} Vue JavaScript scripts.\n`
    );
  } catch (error) {
    process.stderr.write(`TypeScript scope check failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

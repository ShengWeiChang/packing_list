/*
================================================================================
File: scripts/checkTypeScriptScope.js
Description: Require TypeScript application modules and scripts in compiler roots.
License: MIT (SPDX: MIT)
================================================================================
*/

import { readdirSync, readFileSync } from 'node:fs';
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
  if (options.allowJs) throw new Error('Application config must disable allowJs');
  const paths = collectSourceFiles(resolve(projectRoot, 'source')).sort();
  const roots = new Set(parsed.fileNames.map((path) => resolve(path)));
  for (const path of paths) {
    const name = relative(projectRoot, path).replaceAll('\\', '/');
    if (path.endsWith('.js'))
      throw new Error(`JavaScript application module is not supported: ${name}`);
    if (!roots.has(path)) throw new Error(`Source module missing from compiler roots: ${name}`);
    if (path.endsWith('.vue')) {
      const { descriptor, errors } = parse(readFileSync(path, 'utf8'), { filename: path });
      if (errors.length) throw new Error(`Cannot parse Vue source: ${name}`);
      const scripts = [descriptor.script, descriptor.scriptSetup].filter(Boolean);
      if (scripts.some((script) => script.src || script.lang !== 'ts')) {
        throw new Error(`Unsupported Vue script boundary: ${name}`);
      }
    } else if (!path.endsWith('.ts')) throw new Error(`Unsupported source extension: ${name}`);
  }
  return {
    modules: paths.length,
    uncheckedJavaScript: 0,
    uncheckedVueScripts: 0,
  };
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  try {
    const result = checkTypeScriptScope();
    process.stdout.write(
      `TypeScript scope verified: ${result.modules} source modules in compiler roots.\n`
    );
    process.stdout.write(`All application modules and Vue scripts use TypeScript.\n`);
  } catch (error) {
    process.stderr.write(`TypeScript scope check failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

/*
================================================================================
File: source/utils/operationErrors.ts
Description: Narrow unknown operation failures for reactive storage health.
License: MIT (SPDX: MIT)
================================================================================
*/

import type { StorageErrorCode } from '../services/storageTypes';

const storageErrorCodes = [
  'unavailable',
  'corrupt',
  'unsupported',
  'quota',
  'lock-unavailable',
  'conflict',
] as const satisfies readonly StorageErrorCode[];

/** Preserve supported error codes and diagnostic messages from unknown failures. */
export function describeOperationError(error: unknown): {
  code: StorageErrorCode;
  message: unknown;
} {
  const failure = error !== null && typeof error === 'object' ? error : undefined;
  const code = failure && 'code' in failure ? failure.code : undefined;
  const message = failure && 'message' in failure ? failure.message : undefined;
  return {
    code: storageErrorCodes.find((candidate) => candidate === code) ?? 'unavailable',
    message,
  };
}

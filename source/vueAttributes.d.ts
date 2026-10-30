/*
================================================================================
File: source/vueAttributes.d.ts
Description: Narrow data attribute extensions for strict Vue template checking.
License: MIT (SPDX: MIT)
================================================================================
*/

import 'vue';

declare module 'vue' {
  interface HTMLAttributes {
    [attribute: `data-${string}`]: string | number | boolean | undefined;
  }
  interface ComponentCustomProps {
    'data-testid'?: string;
    dataTestid?: string;
    'data-category-id'?: string;
    dataCategoryId?: string;
  }
}

/*
================================================================================
File: tests/type-tests/useTemplates.test.ts
Description: Compile-only template state, snapshot and operation result contracts.
License: MIT (SPDX: MIT)
================================================================================
*/

import type { useTemplates } from '../../source/composables/useTemplates';
import type { TemplateDTO } from '../../source/models/contracts';

/** Check the actual template API, including nested readonly state. */
export async function checkTemplateStateContracts(api: ReturnType<typeof useTemplates>) {
  const loaded: boolean = api.loadTemplates();
  // @ts-expect-error -- Consumers cannot replace template state.
  api.templates.value = [];
  const template = api.templates.value[0];
  if (template) {
    // @ts-expect-error -- Readonly protection reaches snapshot arrays.
    template.items.push({ name: 'Hat' });
    const item = template.items[0];
    if (item) {
      // @ts-expect-error -- Nested snapshot fields are readonly.
      item.name = 'Other hat';
    }
  }
  const saved = await api.saveAsTemplate('trip', 'Weekend');
  // @ts-expect-error -- A failed save returns null.
  void saved.id;
  if (saved) {
    const result: TemplateDTO = saved;
    await api.updateTemplate(result, result);
  }
  // @ts-expect-error -- A template update must identify its target.
  await api.updateTemplate({ name: 'Weekend' });
  const applied = api.applyTemplate('weekend', 'trip');
  if (applied) {
    const categoryId: string | undefined = applied.categories[0]?.id;
    const itemQuantity: number | undefined = applied.items[0]?.quantity;
    void [categoryId, itemQuantity];
  }
  const removed: boolean = await api.deleteTemplate('weekend');
  const renamed: TemplateDTO | null = await api.renameTemplate('weekend', 'Beach');
  const saving: (id: string, name: string) => Promise<TemplateDTO | null> = api.saveAsTemplate;
  // @ts-expect-error -- A save callback may report null after a rejected write.
  const guaranteedSave: (id: string, name: string) => Promise<TemplateDTO> = api.saveAsTemplate;
  return { loaded, removed, renamed, saving, guaranteedSave };
}

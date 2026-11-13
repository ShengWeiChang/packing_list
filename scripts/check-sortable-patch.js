/* Keep the local patch tied to the exact package used by vuedraggable. */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import process from 'node:process';

const requireFromProject = createRequire(join(process.cwd(), 'package.json'));
const draggablePackage = requireFromProject.resolve('vuedraggable/package.json');
const requireFromDraggable = createRequire(draggablePackage);
const sortablePackage = requireFromDraggable.resolve('sortablejs/package.json');
const expectedPackage = join(process.cwd(), 'node_modules', 'sortablejs', 'package.json');
const sortable = requireFromDraggable(sortablePackage);

if (sortablePackage !== expectedPackage || sortable.version !== '1.14.0') {
  throw new Error(
    `The Sortable patch requires the root sortablejs@1.14.0 used by vuedraggable; found ${sortable.version} at ${dirname(sortablePackage)}. Reassess the patch before upgrading.`
  );
}

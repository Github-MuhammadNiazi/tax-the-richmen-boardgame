import { writeFileSync } from 'node:fs';
import { PRINT_MODELS } from '../src/data/modelCatalog.ts';
import measurements from '../src/data/modelMeasurements.json';

const lines = [
  '# Model catalog',
  '',
  'One row is one mesh. Print the copies column; do not expect a separate file per copy or per player colour.',
  'Extents are the measured bounding box from the OpenSCAD export, in millimetres.',
  'Regenerate the meshes with `npm run printables:models`, then this file with `npx tsx scripts/write-model-catalog.ts`.',
  '',
  '| Model | Copies | Measured extents (mm) | Material and orientation |',
  '| --- | ---: | --- | --- |',
];

for (const model of PRINT_MODELS) {
  const measured = measurements.models[model.id as keyof typeof measurements.models];
  const size = measured ? measured.extents.map((n) => n.toFixed(2)).join(' × ') : 'not measured';
  const note = [model.alternative ? 'alternative finish' : '', model.supplyOnly ? 'practical supply' : ''].filter(Boolean).join(', ');
  lines.push(`| ${model.name}${note ? ` (${note})` : ''} | ${model.copies} | ${size} | ${model.material} ${model.orientation} |`);
}

lines.push('', `Source: OpenSCAD ${measurements.openscad}, measured ${measurements.generatedAt}.`, '');
writeFileSync('MODEL_CATALOG.md', lines.join('\n'));
console.log('MODEL_CATALOG.md', PRINT_MODELS.length);

import { CLASSIC_COLUMNS } from '../map/classic';
import { COSTS, LIMITS, formatCost } from './costs';
import { NUMBER_DISTRIBUTION, PORT_NUMBERS } from './numbers';
import { RESOURCES, RESOURCE_TYPES, STARTING_RESOURCES, STARTING_RESOURCE_TOTAL } from './resources';
import { ALL_CLARIFICATIONS, GLOSSARY, RULE_SECTIONS } from './rules';
import { STEEL_DECK, STEEL_DECK_SIZE, STEEL_DECK_TOTAL_VALUE } from './steel';
import { TERRAIN, TERRAIN_LIST, TOTAL_TILES } from './terrain';

/** Builds GAME_RULES_V1.md from the structured rules data. `rulesMarkdown.test.ts` keeps the file in sync. */
export function buildRulesMarkdown(): string {
  const out: string[] = [];
  const push = (...lines: string[]) => out.push(...lines);

  push(
    '# Tax the Richmen — Game Rules, Version 1',
    '',
    '> Generated from `src/data/rules.ts` and the frozen data modules in `src/data/`. Do not edit by hand;',
    '> run `npm run rules:md` after changing the data. Items marked **Playtest clarification required** are',
    '> open questions in the approved rules — the website does not invent answers for them.',
    '',
    '## Frozen reference data',
    '',
    `### Terrain (${TOTAL_TILES} tiles)`,
    '',
    '| Terrain | Count | Role |',
    '| --- | ---: | --- |',
    ...TERRAIN_LIST.map((t) => `| ${t.label} | ${t.count} | ${t.short} |`),
    '',
    '### Number tokens',
    '',
    '| Number | Count |',
    '| ---: | ---: |',
    ...Object.entries(NUMBER_DISTRIBUTION).map(([n, c]) => `| ${n} | ${c} |`),
    '',
    `No hex ever carries a 7. Ports carry ${PORT_NUMBERS.join(', ')}.`,
    '',
    `### Steel deck (${STEEL_DECK_SIZE} cards, ${STEEL_DECK_TOTAL_VALUE} Steel in total)`,
    '',
    '| Card value | Count |',
    '| ---: | ---: |',
    ...STEEL_DECK.map((c) => `| ${c.value} | ${c.count} |`),
    '',
    `### Starting resources (${STARTING_RESOURCE_TOTAL} total)`,
    '',
    '| Resource | Amount |',
    '| --- | ---: |',
    ...RESOURCE_TYPES.map((r) => `| ${RESOURCES[r].label} | ${STARTING_RESOURCES[r]} |`),
    '',
    '### Classic layout (columns listed top to bottom)',
    '',
    '| Column | Tiles |',
    '| ---: | --- |',
    ...CLASSIC_COLUMNS.map(
      (col, i) => `| ${i + 1} | ${col.map((c) => (c === 'hidden' ? 'Hidden (Mine/Mountain)' : TERRAIN[c].label)).join(', ')} |`,
    ),
    '',
    '### Costs',
    '',
    '| Item | Cost |',
    '| --- | --- |',
    ...Object.entries(COSTS).map(([id, cost]) => `| \`${id}\` | ${formatCost(cost)} |`),
    '',
    '### Limits',
    '',
    '| Limit | Value |',
    '| --- | --- |',
    ...Object.entries(LIMITS).map(([id, v]) => `| \`${id}\` | ${Array.isArray(v) ? v.join('–') : v} |`),
    '',
  );

  for (const section of RULE_SECTIONS) {
    push(`## ${section.number}. ${section.title}`, '', section.intro, '');
    for (const item of section.items) {
      push(`### ${item.title}`, '', `**${item.summary}**`, '');
      for (const p of item.body ?? []) push(p, '');
      if (item.bullets?.length) push(...item.bullets.map((b) => `- ${b}`), '');
      if (item.costs?.length) push(...item.costs.map((c) => `- ${c.label}: ${formatCost(COSTS[c.cost])}`), '');
      if (item.example) push(`*Example:* ${item.example}`, '');
      for (const c of item.clarifications ?? []) push(`> **Playtest clarification required:** ${c.question}`, '');
    }
  }

  push('## Glossary', '', '| Term | Definition |', '| --- | --- |');
  push(...GLOSSARY.map((g) => `| ${g.term} | ${g.definition} |`), '');

  push(`## Playtest clarifications required (${ALL_CLARIFICATIONS.length})`, '');
  ALL_CLARIFICATIONS.forEach((c, i) => push(`${i + 1}. **${c.question}**`, `   ${c.context}`, ''));

  return out.join('\n').replace(/\n+$/, '\n');
}

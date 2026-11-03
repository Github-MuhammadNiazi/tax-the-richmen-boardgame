import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_CLARIFICATIONS, RULE_SECTIONS } from './rules';
import { buildRulesMarkdown } from './rulesMarkdown';

const FILE = resolve(__dirname, '../../GAME_RULES_V1.md');

describe('GAME_RULES_V1.md', () => {
  const md = buildRulesMarkdown();

  if (import.meta.env.MODE === 'write-rules') writeFileSync(FILE, md);

  it('covers every rule item and clarification', () => {
    for (const s of RULE_SECTIONS) for (const item of s.items) expect(md).toContain(`### ${item.title}`);
    for (const c of ALL_CLARIFICATIONS) expect(md).toContain(c.question);
  });

  it('is in sync with src/data (run `npm run rules:md` to regenerate)', () => {
    expect(readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n')).toBe(md);
  });
});

import { COSTS, LIMITS, formatCost, type CostId } from '../data/costs';
import { NUMBER_DISTRIBUTION, PORT_NUMBERS } from '../data/numbers';
import { RESOURCES, RESOURCE_TYPES, STARTING_RESOURCES, STARTING_RESOURCE_TOTAL } from '../data/resources';
import { ALL_CLARIFICATIONS, GLOSSARY, RULE_SECTIONS, findRule } from '../data/rules';
import { STEEL_DECK } from '../data/steel';
import { TERRAIN_LIST } from '../data/terrain';

/** A printable document is a list of simple blocks, rendered both as HTML (preview/print) and as vector PDF. */
export type Block =
  | { type: 'title'; text: string; subtitle?: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'costs'; rows: { label: string; cost: CostId }[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'note'; label: string; text: string }
  | { type: 'pagebreak' };

export interface PrintDoc {
  id: string;
  title: string;
  orientation: 'portrait' | 'landscape';
  blocks: Block[];
}

const strip = (s: string) => s.replace(/\*\*/g, '');
const rule = (id: string) => findRule(id)!.item;

/** Expand a rule item into blocks (summary, body, bullets, costs, example). */
function ruleBlocks(id: string, opts: { heading?: boolean; example?: boolean } = {}): Block[] {
  const r = rule(id);
  const out: Block[] = [];
  if (opts.heading !== false) out.push({ type: 'h3', text: r.title });
  out.push({ type: 'p', text: r.summary });
  for (const b of r.body ?? []) out.push({ type: 'p', text: strip(b) });
  if (r.bullets?.length) out.push({ type: 'bullets', items: r.bullets.map(strip) });
  if (r.costs?.length) out.push({ type: 'costs', rows: r.costs });
  if (opts.example !== false && r.example) out.push({ type: 'note', label: 'Example', text: r.example });
  return out;
}

function clarificationBlocks(ids: string[]): Block[] {
  const seen = new Set<string>();
  const out: Block[] = [];
  for (const id of ids)
    for (const c of rule(id).clarifications ?? []) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push({ type: 'note', label: 'Playtest clarification required', text: c.question });
    }
  return out;
}

export function playerReferenceDoc(): PrintDoc {
  return {
    id: 'player-reference',
    title: 'Player Resource Reference',
    orientation: 'portrait',
    blocks: [
      { type: 'title', text: 'Player Reference', subtitle: 'Tax the Richmen · Version 1' },
      { type: 'h2', text: 'Your turn' },
      { type: 'steps', items: ['Roll two dice.', 'Resolve production — or the 7 event.', 'Trading phase (no actions used).', `Take up to ${LIMITS.actionsPerTurn} actions.`, 'End the turn.'] },
      { type: 'p', text: `Unused actions never carry forward. A turn with no actions earns ${LIMITS.idleTurnBonusMoney} Money from the bank.` },
      { type: 'h2', text: 'Starting resources' },
      {
        type: 'table',
        head: RESOURCE_TYPES.map((r) => RESOURCES[r].label).concat('Total'),
        rows: [RESOURCE_TYPES.map((r) => String(STARTING_RESOURCES[r])).concat(String(STARTING_RESOURCE_TOTAL))],
      },
      { type: 'h2', text: 'Production' },
      { type: 'table', head: ['Location', 'Produces'], rows: TERRAIN_LIST.filter((t) => t.produces).map((t) => [t.label, t.short]) },
      { type: 'h2', text: 'Action costs' },
      { type: 'costs', rows: rule('actions').costs! },
      { type: 'h2', text: 'Trading' },
      {
        type: 'bullets',
        items: [
          `Bank: ${LIMITS.bankTradeRate} identical ordinary resources → 1 of choice.`,
          `Port Market: once per turn, ${LIMITS.marketTradeRate} of your specialized resource → 1 of choice.`,
          `Steel: ${formatCost(COSTS.steelPurchase)} → 1 Steel Coin (Market + completed network).`,
          'Player trades: only the active player initiates; networks must meet; ordinary resources only.',
        ],
      },
      { type: 'h2', text: 'When a 7 is rolled' },
      { type: 'steps', items: rule('seven-steps').bullets!.map((b) => b.replace(/^\d\.\s*/, '')) },
    ],
  };
}

export function roadPipelineDoc(): PrintDoc {
  return {
    id: 'road-pipeline',
    title: 'Road & Pipeline Cost Reference',
    orientation: 'portrait',
    blocks: [
      { type: 'title', text: 'Roads & Pipelines', subtitle: 'Cost reference' },
      { type: 'h2', text: 'Roads' },
      ...ruleBlocks('road-building', { heading: false }),
      { type: 'h2', text: 'Toll access' },
      ...ruleBlocks('toll-access', { heading: false }),
      { type: 'h2', text: 'Owner priority' },
      ...ruleBlocks('owner-priority', { heading: false }),
      { type: 'h2', text: 'Pipelines' },
      ...ruleBlocks('pipeline-building', { heading: false }),
      ...ruleBlocks('pipeline-production', { heading: false }),
      ...clarificationBlocks(['road-building', 'pipeline-building']),
    ],
  };
}

export function portMarketDoc(): PrintDoc {
  return {
    id: 'port-market',
    title: 'Port Market Reference',
    orientation: 'portrait',
    blocks: [
      { type: 'title', text: 'Port Markets', subtitle: 'Specialization, exchange and Steel' },
      ...ruleBlocks('port-specialization'),
      ...ruleBlocks('market-construction'),
      ...ruleBlocks('market-trading'),
      ...ruleBlocks('steel-purchase'),
      ...ruleBlocks('steel-vault'),
      ...clarificationBlocks(['steel-vault']),
    ],
  };
}

export function oilBiddingDoc(): PrintDoc {
  return {
    id: 'oil-bidding',
    title: 'Oil Rig Bidding Reference',
    orientation: 'portrait',
    blocks: [
      { type: 'title', text: 'Oil Rigs', subtitle: 'Leasing, advance bidding and Pipelines' },
      ...ruleBlocks('standard-lease'),
      ...ruleBlocks('advance-bidding'),
      {
        type: 'table',
        head: ['Moment', 'What happens'],
        rows: [
          ['Red leases on Red’s turn', `Red pays ${formatCost(COSTS.oilLease)}; Fuel to Red on each matching roll.`],
          ['Blue bids', `Blue pays at least ${COSTS.oilBidMinimum.money} Money + 1 action immediately.`],
          ['Green outbids', 'Green pays at least 1 Money more. Blue is not refunded.'],
          ['Red’s next turn begins', 'Red’s lease expires. Green is entitled to the next lease.'],
          ['Green’s next turn begins', 'Green’s lease starts and lasts one complete cycle.'],
        ],
      },
      ...ruleBlocks('pipeline-production'),
      ...clarificationBlocks(['standard-lease', 'advance-bidding']),
    ],
  };
}

export function inspectorDoc(): PrintDoc {
  return {
    id: 'tax-inspector',
    title: 'Tax Inspector Reference',
    orientation: 'portrait',
    blocks: [
      { type: 'title', text: 'The Tax Inspector', subtitle: 'Resolving a roll of 7' },
      { type: 'steps', items: rule('seven-steps').bullets!.map((b) => b.replace(/^\d\.\s*/, '')) },
      { type: 'note', label: 'Example', text: rule('seven-steps').example! },
      ...ruleBlocks('eligible-hexes'),
      ...ruleBlocks('inspector-effects'),
      ...clarificationBlocks(['seven-steps']),
    ],
  };
}

export function rulebookDoc(): PrintDoc {
  const blocks: Block[] = [{ type: 'title', text: 'Tax the Richmen', subtitle: 'Complete Rulebook · Version 1' }];
  for (const s of RULE_SECTIONS) {
    blocks.push({ type: 'h2', text: `${s.number}. ${s.title}` }, { type: 'p', text: s.intro });
    for (const item of s.items) {
      blocks.push(...ruleBlocks(item.id));
      for (const c of item.clarifications ?? []) blocks.push({ type: 'note', label: 'Playtest clarification required', text: c.question });
    }
  }
  blocks.push({ type: 'h2', text: 'Glossary' }, { type: 'table', head: ['Term', 'Definition'], rows: GLOSSARY.map((g) => [g.term, g.definition]) });
  blocks.push({ type: 'h2', text: 'Playtest clarifications' });
  for (const c of ALL_CLARIFICATIONS) blocks.push({ type: 'h3', text: c.question }, { type: 'p', text: c.context });
  return { id: 'rulebook', title: 'Complete Rulebook', orientation: 'portrait', blocks };
}

export function quickStartDoc(): PrintDoc {
  return {
    id: 'quick-start',
    title: 'Quick-Start Guide',
    orientation: 'portrait',
    blocks: [
      { type: 'title', text: 'Quick Start', subtitle: 'Your first game in ten minutes' },
      { type: 'h2', text: 'Goal' },
      { type: 'p', text: rule('objective').summary },
      { type: 'h2', text: '1. Lay out the board' },
      {
        type: 'bullets',
        items: [
          'Place the 30 hexes in seven columns of 3, 4, 5, 6, 5, 4, 3 — use the Classic layout or a generated map.',
          'Shuffle the 8 Mine/Mountain tiles face-down into the concealed positions.',
          `Place number tokens (${Object.entries(NUMBER_DISTRIBUTION)
            .map(([n, c]) => `${n}×${c}`)
            .join(', ')}); Ports take ${PORT_NUMBERS.join(', ')}.`,
          'Shuffle the 20 Steel Cards into a face-down deck.',
        ],
      },
      { type: 'h2', text: '2. Set up' },
      { type: 'steps', items: [rule('starting-order').summary, ...rule('setup-passes').body!.slice(0, 2).map(strip), rule('port-specialization').summary, rule('starting-resources').summary] },
      { type: 'h2', text: '3. Play' },
      { type: 'steps', items: ['Roll two dice. Every matching location produces for its owner.', 'Trade with the bank (4:1), your Market (2:1, once) or other players.', 'Take up to two actions: build Roads, invest, lease Oil, build Markets.', 'Link your City to your Port to activate Steel production.'] },
      { type: 'h2', text: '4. Watch for the 7' },
      {
        type: 'p',
        text: `A 7 produces nothing. Anyone holding ${LIMITS.taxThreshold}+ ordinary resources surrenders half, rounded down. Anyone holding ${LIMITS.steelTaxRange[0]} or ${LIMITS.steelTaxRange[1]} Steel loses ${LIMITS.steelTaxLoss} unless protected by a Steel Vault. Then the active player moves the Tax Inspector to a different eligible hex and randomly takes 1 ordinary resource from its owner or an Office holder there.`,
      },
      { type: 'h2', text: '5. Win' },
      { type: 'p', text: `Each roll of your activated Port’s number draws a Steel Card (${STEEL_DECK.map((c) => `${c.count}×${c.value}`).join(', ')}). Hold ${LIMITS.steelToWin} Steel and your ship launches.` },
      { type: 'h2', text: 'Key costs' },
      {
        type: 'costs',
        rows: [
          { label: 'Road', cost: 'road' },
          { label: 'Toll access', cost: 'toll' },
          { label: 'Invest in a City', cost: 'investCity' },
          { label: 'Oil Rig lease', cost: 'oilLease' },
          { label: 'Steel Coin', cost: 'steelPurchase' },
        ],
      },
    ],
  };
}

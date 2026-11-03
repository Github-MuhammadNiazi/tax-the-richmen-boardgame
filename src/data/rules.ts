import { COSTS, LIMITS, formatCost as fc, type CostId } from './costs';
import { HIGH_NUMBERS, LOW_NUMBERS, NUMBER_DISTRIBUTION, PORT_NUMBERS } from './numbers';
import { STARTING_RESOURCES, STARTING_RESOURCE_TOTAL } from './resources';
import { STEEL_DECK, STEEL_DECK_SIZE } from './steel';
import { TERRAIN_LIST } from './terrain';

/**
 * The single structured source of approved rules. Rulebook, How to Play, printable references
 * and GAME_RULES_V1.md all derive from this file.
 */

export interface Clarification {
  id: string;
  question: string;
  context: string;
}

export interface RuleItem {
  id: string;
  title: string;
  summary: string;
  body?: string[];
  bullets?: string[];
  costs?: { label: string; cost: CostId }[];
  example?: string;
  clarifications?: Clarification[];
}

export interface RuleSection {
  id: string;
  number: string;
  title: string;
  intro: string;
  items: RuleItem[];
}

const S = STARTING_RESOURCES;
const numberList = Object.entries(NUMBER_DISTRIBUTION)
  .map(([n, c]) => `${n} ×${c}`)
  .join(', ');

export const CLARIFICATIONS: Record<string, Clarification> = {
  startingCityLimit: {
    id: 'startingCityLimit',
    question: 'Does the free starting City count toward the one-property-per-type limit?',
    context:
      'Each player starts with a free City, and players may permanently own at most one property of each applicable type. Whether a player may still invest 4 Money in a second City is not yet settled.',
  },
  revealTiming: {
    id: 'revealTiming',
    question: 'When is a concealed Mine/Mountain tile revealed?',
    context:
      'Hidden tiles conceal both type and number. The approved rules state they cannot receive the Inspector while unrevealed, but do not define the exact reveal trigger (for example, first Road entry or adjacency). This also affects when the Mountain road surcharge becomes known.',
  },
  inspectorStart: {
    id: 'inspectorStart',
    question: 'Where does the Tax Inspector stand before the first 7 is rolled?',
    context:
      'The Inspector is a separate token and must move to a different eligible hex on each 7. Its starting position (for example, beside the Tax Office tile) is not specified.',
  },
  leaseAccess: {
    id: 'leaseAccess',
    question: 'Must a player have Road access to an Oil Rig to lease or bid on it?',
    context: 'Lease and bid costs are approved; any network-access requirement for leasing has not been stated.',
  },
  pipelineGeometry: {
    id: 'pipelineGeometry',
    question: 'How are Pipeline segments physically laid out?',
    context:
      'Pipelines cost per segment and must connect two different owned hexes through an Oil Rig. Whether segments follow hex-centre connections like Roads, may share a connection with a Road, or may pass over Water is not yet defined.',
  },
  officeSplit: {
    id: 'officeSplit',
    question: 'How are shared resources divided between two Office holders?',
    context:
      'With two Offices sharing follows clockwise player order. The quantity each holder receives (alternating one at a time or otherwise) is not specified, nor is the interaction with an Upgraded (doubled) property.',
  },
  vaultExpiry: {
    id: 'vaultExpiry',
    question: 'Is a Steel Vault consumed by any 7, or only when it actually prevents a Steel loss?',
    context: 'A Vault "protects against one Steel-tax event, then expires." Whether a 7 that would not have taxed the player consumes it is open.',
  },
  smallerGames: {
    id: 'smallerGames',
    question: 'What happens to unclaimed Cities and Ports in 2–3 player games?',
    context:
      'Four-player play is the balance target. With fewer players, whether unclaimed Ports/Cities remain on the board as ordinary hexes, can be invested in, or produce is not specified.',
  },
  setupRoads: {
    id: 'setupRoads',
    question: 'Where must the free setup road segments be placed?',
    context:
      'Each setup pass grants one free road segment. Whether it must touch the location selected in that pass is presumed but not explicitly approved.',
  },
  upgradeTargets: {
    id: 'upgradeTargets',
    question: 'Which properties are eligible for the Upgrade?',
    context:
      'An Upgrade doubles "a chosen owned producing property." Whether a Port (Steel Cards) qualifies is not stated; Oil Rigs are never owned.',
  },
  mountainSurcharge: {
    id: 'mountainSurcharge',
    question: 'Which Road segments pay the Mountain surcharge?',
    context:
      'A Road entering a Mountain costs an extra Stone. Roads are undirected connections between hex centres, so whether a segment leading out of a Mountain toward another hex also pays is not settled. The website demos apply the surcharge to every segment with a Mountain endpoint and label it accordingly.',
  },
  unleasedRig: {
    id: 'unleasedRig',
    question: 'Can an advance bid be placed on a Rig that has no current lessee?',
    context:
      'Advance bidding is defined for occupied Rigs. An unoccupied Rig is available through the standard 1 Money lease; whether bids on unoccupied Rigs are permitted is not stated.',
  },
};

const C = CLARIFICATIONS;

export const RULE_SECTIONS: RuleSection[] = [
  {
    id: 'overview',
    number: 'I',
    title: 'Overview & Components',
    intro:
      'Tax the Richmen is an economic strategy board game for 2–4 players, balanced primarily for four. Build Roads from your City to your Port, control resources, outbid rivals for Oil, and survive the Tax Inspector. The first player with an activated Port to hold 10 Steel launches their ship and wins.',
    items: [
      {
        id: 'objective',
        title: 'Objective',
        summary: 'Connect your City to your Port, activate Steel production, and be first to accumulate 10 Steel.',
        body: [
          'Victory is immediate: the first player with an activated Port to hold at least 10 Steel constructs their winning ship. No additional action is required.',
        ],
      },
      {
        id: 'board',
        title: 'The board',
        summary: 'Thirty hex tiles in seven columns of 3, 4, 5, 6, 5, 4 and 3.',
        bullets: TERRAIN_LIST.map((t) => `${t.count} ${t.count > 1 ? t.plural : t.label} — ${t.short}`),
        body: [
          `Twenty resource-producing hexes carry a number token: ${numberList}. The four Ports carry ${PORT_NUMBERS.join(', ')}. No tile ever carries a 7.`,
          'Eight Mine and Mountain tiles are placed face-down with identical backs. Their type and number stay concealed until revealed.',
          'Water hexes and the Tax Office are permanently inaccessible.',
        ],
        clarifications: [C.revealTiming],
      },
      {
        id: 'numbers',
        title: 'Number allocation',
        summary: 'Each group of four resource locations receives two high and two low numbers.',
        body: [
          `High-probability numbers are ${HIGH_NUMBERS.join(', ')}; low-probability numbers are ${LOW_NUMBERS.join(', ')}. Each of the five producing categories — City, Village, Mine, Mountain and Oil Rig — receives two of each, while the global frequencies above still hold.`,
        ],
      },
    ],
  },
  {
    id: 'setup',
    number: 'II',
    title: 'Setup',
    intro: 'Players claim a City and a Port, lay two free road segments, choose a permanent Port specialization, and take their starting resources.',
    items: [
      {
        id: 'starting-order',
        title: 'Starting order',
        summary: 'All players roll two dice. The highest roll begins; ties re-roll for starting priority.',
      },
      {
        id: 'setup-passes',
        title: 'Two setup passes',
        summary: 'Claim one starting location per pass and place one free road segment each time.',
        body: [
          '**First pass** — in clockwise order, each player selects one starting location (a City or a Port) and places one free road segment.',
          '**Second pass** — order reverses. Each player selects their remaining starting location and places one more free road segment.',
          'Every player finishes setup with exactly 1 City, 1 Port and 2 free road segments. The starting City and Port are assigned free of charge.',
        ],
        clarifications: [C.setupRoads, C.smallerGames],
      },
      {
        id: 'port-specialization',
        title: 'Port specialization round',
        summary: 'Each player rolls one die; the highest chooses first a unique, permanent specialization: Wood, Metal, Fuel or Stone.',
        body: ['If several players roll the same result, the player who rolled earlier has priority. Specializations never change.'],
      },
      {
        id: 'starting-resources',
        title: 'Starting resources',
        summary: `${S.money} Money, ${S.wood} Wood, ${S.metal} Metal, ${S.fuel} Fuel and ${S.stone} Stone — ${STARTING_RESOURCE_TOTAL} ordinary resources per player.`,
        body: [
          'Taxation applies from the very first regular dice roll. There is no grace period — note that 19 starting resources already exceed the 8-resource tax threshold.',
        ],
      },
      {
        id: 'regular-order',
        title: 'Regular turn order',
        summary: 'The highest original setup roller takes the first regular turn; play proceeds clockwise for the rest of the game.',
      },
    ],
  },
  {
    id: 'turns',
    number: 'III',
    title: 'The Turn',
    intro: 'Every regular turn follows the same five steps.',
    items: [
      {
        id: 'turn-sequence',
        title: 'Turn sequence',
        summary: 'Roll · Resolve · Trade · Up to two actions · End.',
        bullets: [
          '1. Roll two dice.',
          '2. Resolve production — or the 7 event.',
          '3. Trading phase.',
          `4. Take up to ${LIMITS.actionsPerTurn} actions.`,
          '5. End the turn.',
        ],
      },
      {
        id: 'actions',
        title: 'Available actions',
        summary: 'Each of these consumes one action and must meet its cost and eligibility.',
        costs: [
          { label: 'Construct one Road', cost: 'road' },
          { label: 'Construct one Pipeline segment', cost: 'pipeline' },
          { label: 'Invest in a City', cost: 'investCity' },
          { label: 'Invest in a Village', cost: 'investVillage' },
          { label: 'Invest in a Mine', cost: 'investMine' },
          { label: 'Invest in a Mountain', cost: 'investMountain' },
          { label: 'Purchase toll access', cost: 'toll' },
          { label: 'Establish an Office', cost: 'office' },
          { label: 'Upgrade an owned property', cost: 'upgrade' },
          { label: 'Construct a Wood Market', cost: 'marketWood' },
          { label: 'Construct a Metal Market', cost: 'marketMetal' },
          { label: 'Construct a Fuel Market', cost: 'marketFuel' },
          { label: 'Construct a Stone Market', cost: 'marketStone' },
          { label: 'Construct a Steel Vault', cost: 'steelVault' },
          { label: 'Acquire an Oil Rig lease', cost: 'oilLease' },
          { label: 'Place or raise an Oil Rig bid (minimum)', cost: 'oilBidMinimum' },
        ],
      },
      {
        id: 'unused-actions',
        title: 'Unused actions',
        summary: `Unused actions never carry forward. A player who performs neither action receives ${LIMITS.idleTurnBonusMoney} Money from the bank.`,
        body: ['Ordinary player trading does not consume actions.'],
      },
    ],
  },
  {
    id: 'economy',
    number: 'IV',
    title: 'Production & Economy',
    intro: 'Five ordinary resources flow from the board: Money, Wood, Metal, Fuel and Stone. Steel is separate and is never an ordinary resource.',
    items: [
      {
        id: 'production',
        title: 'Production',
        summary: 'When a number is rolled, every matching eligible location produces — on any player\u2019s turn.',
        bullets: ['City → Money', 'Village → Wood', 'Mine → Metal', 'Oil Rig → Fuel (via lease or Pipeline)', 'Mountain → Stone'],
        body: ['Each property normally produces 1 resource. Ports do not follow resource dice rules; they produce Steel Cards once activated.'],
      },
      {
        id: 'upgrade',
        title: 'Property Upgrade',
        summary: 'Double the output of one owned producing property. Maximum one upgrade per player.',
        costs: [{ label: 'Upgrade', cost: 'upgrade' }],
        clarifications: [C.upgradeTargets],
      },
      {
        id: 'storage',
        title: 'Storage & secrecy',
        summary: 'Resource storage is unlimited. Individual holdings are concealed; each player\u2019s total ordinary-resource count is public.',
      },
      {
        id: 'bank-trading',
        title: 'Bank trading',
        summary: `Exchange ${LIMITS.bankTradeRate} identical ordinary resources for 1 ordinary resource of your choice.`,
      },
      {
        id: 'player-trading',
        title: 'Player trading',
        summary: 'Unlimited completed trades during the active player\u2019s trading phase, initiated only by the active player.',
        bullets: [
          'The two players\u2019 valid road networks must meet.',
          'Prices and combinations are negotiated freely.',
          'Only ordinary resources may be traded.',
          'No trading of property, Roads, Offices, toll rights or Steel.',
        ],
      },
    ],
  },
  {
    id: 'roads',
    number: 'V',
    title: 'Roads & Tolls',
    intro: 'Roads connect the centres of adjacent hexes and form the networks that carry you to the sea.',
    items: [
      {
        id: 'road-building',
        title: 'Building Roads',
        summary: `One physical Road connection per adjacent pair of hexes. Cost: ${fc(COSTS.road, { includeAction: false })}.`,
        body: [
          `A Road entering a Mountain costs an additional ${fc(COSTS.roadMountainSurcharge)}. Roads remain owned by their builders. Water and the Tax Office can never be entered.`,
        ],
        costs: [
          { label: 'Road', cost: 'road' },
          { label: 'Mountain surcharge', cost: 'roadMountainSurcharge' },
        ],
        clarifications: [C.mountainSurcharge],
      },
      {
        id: 'toll-access',
        title: 'Toll access',
        summary: `Pay ${fc(COSTS.toll)} for permanent access to one other player\u2019s Road.`,
        costs: [{ label: 'Toll access', cost: 'toll' }],
        bullets: [
          'Extend your network using legally accessed toll Roads.',
          'Two consecutive toll Roads are prohibited along your route without an intervening Road you built yourself.',
          `Base allowance: ${LIMITS.tollBaseAllowance} purchases. A third unlocks after you construct ${LIMITS.tollThirdUnlockPaidRoads} paid road segments.`,
          `Lifetime maximum: ${LIMITS.tollMaxLifetime} toll purchases.`,
          'Toll Roads count toward your winning City-to-Port network. The builder keeps ownership.',
        ],
      },
      {
        id: 'owner-priority',
        title: 'Owner priority',
        summary: 'Every owned hex must retain viable incoming and outgoing access.',
        body: [
          'Other players cannot construct infrastructure that removes every possible usable outgoing option from a property owner. No exit is reserved to a specific edge in advance, and existing accessible Roads can satisfy the owner\u2019s access requirement.',
        ],
      },
    ],
  },
  {
    id: 'ownership',
    number: 'VI',
    title: 'Ownership & Offices',
    intro: 'Invest to own production. Establish Offices to expand through — and share in — a rival\u2019s property.',
    items: [
      {
        id: 'investment',
        title: 'Property investment',
        summary: 'Pay the investment cost to permanently own an unowned property you can legally reach by Road.',
        costs: [
          { label: 'City', cost: 'investCity' },
          { label: 'Village', cost: 'investVillage' },
          { label: 'Mine', cost: 'investMine' },
          { label: 'Mountain', cost: 'investMountain' },
        ],
        bullets: [
          'Maximum one permanently owned property of each applicable type per player.',
          'An unowned property goes to the first eligible player who pays its cost. Reaching a hex does not grant ownership.',
          'Oil Rigs cannot be owned; they follow leasing rules.',
          'Property acquisition requires valid Road access — never Pipeline access.',
        ],
        clarifications: [C.startingCityLimit],
      },
      {
        id: 'offices',
        title: 'Offices',
        summary: `Cost ${fc(COSTS.office)}. A permanent foothold allowing expansion through an opponent\u2019s eligible property.`,
        costs: [{ label: 'Office', cost: 'office' }],
        bullets: [
          `Maximum ${LIMITS.officesPerPlayer} Offices per player, ${LIMITS.officesPerHex} Offices per hex, one per player per hex.`,
          'Allowed on: City, Village, Mine, Mountain.',
          'Not allowed on: Port, Oil Rig, Water, Tax Office.',
          'An Office grants neither ownership nor independent production.',
        ],
      },
      {
        id: 'office-sharing',
        title: 'Office resource sharing',
        summary: `When an owned property with Offices produces and the owner holds ${LIMITS.officeSharingThreshold}+ ordinary resources, the owner chooses one of two options.`,
        bullets: [
          'A. Reject the newly produced resource; or',
          `B. Keep it and distribute previously held ordinary resources to the Office holders until the owner\u2019s total is ${LIMITS.officeSharingTarget}.`,
        ],
        body: [
          'The owner chooses which previously held resources are transferred; the newly produced resource itself cannot be transferred. With two Offices, sharing follows clockwise player order. Office holders never become owners.',
        ],
        example:
          'Owner holds 8 resources and receives a 9th. Choosing B, they keep the new one and hand 2 previously held resources to the Office holder(s), ending at 7.',
        clarifications: [C.officeSplit],
      },
    ],
  },
  {
    id: 'oil',
    number: 'VII',
    title: 'Oil Rig Leasing',
    intro: 'Oil Rigs can never be bought. Their Fuel belongs to whoever holds the current lease — and to anyone with a Pipeline through them.',
    items: [
      {
        id: 'standard-lease',
        title: 'Standard lease',
        summary: `Pay ${fc(COSTS.oilLease)} for temporary Fuel rights lasting one complete turn cycle.`,
        costs: [{ label: 'Lease', cost: 'oilLease' }],
        body: [
          'The lease ends when the lessee\u2019s next turn begins. While it is active and production is not blocked, the lessee receives Fuel whenever that Rig\u2019s number is rolled.',
        ],
        clarifications: [C.leaseAccess],
      },
      {
        id: 'advance-bidding',
        title: 'Advance bidding',
        summary: 'Bid to secure the next lease on an occupied Rig.',
        costs: [{ label: 'Minimum opening bid', cost: 'oilBidMinimum' }],
        bullets: [
          'Minimum opening bid: 2 Money. Each new bid must exceed the leading bid by at least 1 Money.',
          'Every bid costs 1 action. Bid Money is paid immediately; outbid players receive no refund.',
          `Each player may hold at most ${LIMITS.pendingBidsPerPlayer} active pending bid.`,
          'The current lease stays valid until its scheduled expiry.',
          'On expiry, the highest valid pending bidder becomes entitled to the next lease, which begins at the start of that bidder\u2019s first turn after expiry and lasts one complete cycle.',
          'There are no extra auction rounds, and a current lessee cannot invalidate a winning bid through automatic renewal.',
        ],
        clarifications: [C.unleasedRig],
      },
    ],
  },
  {
    id: 'pipelines',
    number: 'VIII',
    title: 'Pipelines',
    intro: 'Permanent industrial links that draw Fuel from a Rig without a lease.',
    items: [
      {
        id: 'pipeline-building',
        title: 'Building Pipelines',
        summary: `Cost per segment: ${fc(COSTS.pipeline, { includeAction: false })}. Connect two different hexes you own through an Oil Rig.`,
        costs: [{ label: 'Pipeline segment', cost: 'pipeline' }],
        bullets: [
          'A Pipeline may not be used to claim an unowned property.',
          'Pipelines do not count toward winning Road networks, toll requirements, road-construction achievements or network-based trading.',
        ],
        clarifications: [C.pipelineGeometry],
      },
      {
        id: 'pipeline-production',
        title: 'Pipeline production',
        summary: 'A completed Pipeline earns its owner 1 Fuel whenever that Rig\u2019s number is rolled — no lease required.',
        body: [
          'A Pipeline owner and an active lessee both receive Fuel from the same Rig on a matching roll; their rights are independent. Pipelines keep working when lease rights change. The Inspector suspends Rig production without cancelling Pipelines or leases.',
        ],
      },
    ],
  },
  {
    id: 'inspector',
    number: 'IX',
    title: 'The Tax Inspector',
    intro: 'A roll of 7 produces nothing. Instead, the Treasury collects — in four strict steps.',
    items: [
      {
        id: 'seven-steps',
        title: 'Resolving a 7',
        summary: 'Taxation · Steel tax · Relocation · Theft.',
        bullets: [
          `1. Ordinary taxation — every player holding ${LIMITS.taxThreshold}+ ordinary resources surrenders half to the bank, rounded down. They choose which.`,
          `2. Steel taxation — players holding ${LIMITS.steelTaxRange[0]} or ${LIMITS.steelTaxRange[1]} Steel lose ${LIMITS.steelTaxLoss} Steel unless protected by an active Steel Vault.`,
          '3. Relocation — the active player moves the Inspector to a different eligible hex.',
          '4. Theft — the active player selects a victim on that hex (the property owner or an Office holder) and randomly takes 1 ordinary resource. Steel can never be stolen.',
        ],
        example: 'A player holding 9 ordinary resources surrenders 4. A player with 8 Steel and no Vault drops to 7.',
        clarifications: [C.inspectorStart],
      },
      {
        id: 'eligible-hexes',
        title: 'Eligible destinations',
        summary: 'Any revealed land hex, owned or unowned.',
        bullets: ['Not eligible: Water, the Tax Office, unrevealed Mine/Mountain tiles.', 'The Inspector must move to a different hex on every 7, and only a 7 can move it.'],
      },
      {
        id: 'inspector-effects',
        title: 'Effects while occupied',
        summary: 'The Inspector freezes new development on its hex without breaking what already exists.',
        bullets: [
          'No new Road construction into or out of the hex.',
          'No new Office, no new property purchase.',
          'Existing Roads remain usable and networks remain connected.',
          'On an Oil Rig: all Fuel production — lease and Pipeline — is suspended. Leases are not cancelled.',
          'On a Port: Steel Card production, specialized Market trading and Market Steel purchase are suspended. Existing Steel remains safe except for normal Steel taxation.',
        ],
      },
    ],
  },
  {
    id: 'markets',
    number: 'X',
    title: 'Port Markets',
    intro: 'Each Port has one permanent specialization. Build its Market to unlock specialized trade.',
    items: [
      {
        id: 'market-construction',
        title: 'Market construction',
        summary: 'Each Market costs one action plus its materials.',
        costs: [
          { label: 'Wood Market', cost: 'marketWood' },
          { label: 'Metal Market', cost: 'marketMetal' },
          { label: 'Fuel Market', cost: 'marketFuel' },
          { label: 'Stone Market', cost: 'marketStone' },
        ],
      },
      {
        id: 'market-trading',
        title: 'Specialized exchange',
        summary: `Once per turn, trade ${LIMITS.marketTradeRate} of your Port\u2019s specialized resource for 1 ordinary resource of choice.`,
        bullets: [
          'Example: a Wood Market converts 2 Wood → 1 ordinary resource of choice.',
          'Only the assigned resource is accepted; the Market never trades arbitrary resources at 2:1.',
          'Standard bank trading remains 4:1.',
          'Markets do not require a completed City-to-Port network. Ownership is tied to the player\u2019s Port.',
          'An Inspector on the Port suspends specialized trading.',
        ],
      },
    ],
  },
  {
    id: 'steel',
    number: 'XI',
    title: 'Steel & Victory',
    intro: 'Complete a continuous Road network from your starting City to your Port to activate Steel production.',
    items: [
      {
        id: 'activation',
        title: 'Port activation',
        summary: 'A continuous valid Road network between your starting City and your Port activates it.',
        body: ['The network may use Roads you built and legally purchased toll Roads. Office and toll requirements still apply.'],
      },
      {
        id: 'steel-production',
        title: 'Steel production',
        summary: `Whenever an activated Port\u2019s number (${PORT_NUMBERS.join(', ')}) is rolled by any player, its owner draws one Steel Card.`,
        body: ['No production while the Inspector occupies that Port.'],
      },
      {
        id: 'steel-deck',
        title: 'The Steel deck',
        summary: `${STEEL_DECK_SIZE} cards: ${STEEL_DECK.map((c) => `${c.count}× value ${c.value}`).join(', ')}.`,
        bullets: [
          '1. Draw one Steel Card.',
          '2. Reveal its value to yourself.',
          '3. Take that many Steel Coins (each coin = 1 Steel).',
          '4. Place the card in the discard pile.',
          'When the deck runs out, shuffle the discards into a fresh deck. Steel Coins stay privately concealed; a public count of card draws may be tracked.',
        ],
      },
      {
        id: 'steel-purchase',
        title: 'Purchasing Steel',
        summary: `With a constructed Port Market and a completed network, exchange ${fc(COSTS.steelPurchase)} → 1 Steel Coin.`,
        costs: [{ label: 'Steel Coin', cost: 'steelPurchase' }],
        body: [
          'No per-turn limit during the trading phase. The exchange must use your constructed Port Market; the 2:1 specialized exchange never applies to Steel.',
        ],
      },
      {
        id: 'steel-vault',
        title: 'Steel Vault',
        summary: `Cost ${fc(COSTS.steelVault)}. Protects against one Steel-tax event, then expires.`,
        costs: [{ label: 'Steel Vault', cost: 'steelVault' }],
        bullets: ['Available after Port activation.', 'Only one active Vault per player.'],
        clarifications: [C.vaultExpiry],
      },
      {
        id: 'victory',
        title: 'Victory',
        summary: 'The first player with an activated Port to hold 10 or more Steel immediately wins.',
        body: [
          'The winning ship is constructed automatically — no action is required. All normal actions remain available after activation and before victory.',
        ],
      },
    ],
  },
];

export const GLOSSARY: { term: string; definition: string; ref?: string }[] = [
  { term: 'Action', definition: 'One of the two activities a player may perform each turn after trading.', ref: 'actions' },
  { term: 'Active player', definition: 'The player taking the current turn. Only they initiate trades and resolve a 7.', ref: 'turn-sequence' },
  { term: 'Activated Port', definition: 'A Port connected to its owner\u2019s starting City by a continuous valid Road network.', ref: 'activation' },
  { term: 'Advance bid', definition: 'Money paid immediately to claim the next lease on an occupied Oil Rig.', ref: 'advance-bidding' },
  { term: 'Bank trade', definition: '4 identical ordinary resources for 1 of choice.', ref: 'bank-trading' },
  { term: 'Concealed tile', definition: 'A face-down Mine or Mountain whose type and number are hidden.', ref: 'board' },
  { term: 'Cycle', definition: 'One full round of turns; a lease lasts until the lessee\u2019s next turn begins.', ref: 'standard-lease' },
  { term: 'Market', definition: 'A Port building enabling one 2:1 specialized exchange per turn and Steel purchase.', ref: 'market-trading' },
  { term: 'Office', definition: 'A permanent foothold on a rival\u2019s City, Village, Mine or Mountain.', ref: 'offices' },
  { term: 'Ordinary resource', definition: 'Money, Wood, Metal, Fuel or Stone. Steel is not ordinary.', ref: 'production' },
  { term: 'Owner priority', definition: 'Every owned hex must keep viable incoming and outgoing access.', ref: 'owner-priority' },
  { term: 'Pipeline', definition: 'Permanent link between two owned hexes through an Oil Rig, yielding Fuel.', ref: 'pipeline-building' },
  { term: 'Port specialization', definition: 'A permanent resource (Wood, Metal, Fuel or Stone) assigned to each Port.', ref: 'port-specialization' },
  { term: 'Steel Card', definition: 'Shipping certificate of value 1–5, converted into Steel Coins when drawn.', ref: 'steel-deck' },
  { term: 'Steel Coin', definition: 'One unit of Steel. Ten wins the game.', ref: 'steel-deck' },
  { term: 'Steel Vault', definition: 'Protection against one Steel-tax event.', ref: 'steel-vault' },
  { term: 'Tax Inspector', definition: 'Movable token relocated on every 7; freezes development on its hex.', ref: 'seven-steps' },
  { term: 'Tax Office', definition: 'The permanently inaccessible Treasury tile.', ref: 'board' },
  { term: 'Toll access', definition: 'Permanent right to use one rival Road, bought for 2 Money + 1 action.', ref: 'toll-access' },
  { term: 'Upgrade', definition: 'Doubles one owned producing property\u2019s output; one per player.', ref: 'upgrade' },
];

export const ALL_CLARIFICATIONS = Object.values(CLARIFICATIONS);

export function findRule(id: string): { section: RuleSection; item: RuleItem } | null {
  for (const section of RULE_SECTIONS) {
    const item = section.items.find((i) => i.id === id);
    if (item) return { section, item };
  }
  return null;
}

export function ruleHref(id: string): string {
  return `/rulebook#${id}`;
}

/** Plain text of a rule item, used for search and for PDF output. */
export function ruleText(item: RuleItem): string {
  return [
    item.title,
    item.summary,
    ...(item.body ?? []),
    ...(item.bullets ?? []),
    ...(item.costs ?? []).map((c) => `${c.label}: ${fc(COSTS[c.cost])}`),
    item.example ?? '',
  ]
    .join(' ')
    .replace(/\*\*/g, '');
}

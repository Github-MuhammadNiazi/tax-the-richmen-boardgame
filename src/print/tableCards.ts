import { COSTS, LIMITS, formatCost } from '../data/costs';
import { PORT_NUMBERS } from '../data/numbers';
import { STEEL_DECK, STEEL_DECK_SIZE } from '../data/steel';

const money = (n: number) => `${n} Money`;

/** Lines for the four player-reference cards. Every cost is read from the rules data. */
export function referenceCards(): { title: string; lines: string[] }[] {
  return [
    {
      title: 'Turn',
      lines: [
        '1. Roll two dice.',
        '2. Resolve production, or the 7.',
        '3. Trading phase.',
        `4. Up to ${LIMITS.actionsPerTurn} actions.`,
        '5. End the turn.',
        `Neither action used: take ${money(LIMITS.idleTurnBonusMoney)}.`,
        'Actions do not carry forward.',
        'Player trades do not cost an action.',
        `Bank: ${LIMITS.bankTradeRate} identical resources to 1.`,
        'Only ordinary resources are traded.',
      ],
    },
    {
      title: 'Roads and pipelines',
      lines: [
        `Road: ${formatCost(COSTS.road)}.`,
        'One Road per adjacent pair. Roads join hex centres.',
        `Entering a Mountain: + ${formatCost(COSTS.roadMountainSurcharge)}.`,
        'Water and the Tax Office cannot be entered.',
        `Pipeline: ${formatCost(COSTS.pipeline)}.`,
        'A Pipeline joins two different owned hexes through an Oil Rig.',
        'Pipelines do not count as Roads.',
        `Toll: ${formatCost(COSTS.toll)} for one foreign Road.`,
        `Allowance ${LIMITS.tollBaseAllowance}, lifetime maximum ${LIMITS.tollMaxLifetime}.`,
        `A third toll waits until you have built ${LIMITS.tollThirdUnlockPaidRoads} paid Roads.`,
        'Two toll Roads in a row need a Road of your own between them.',
      ],
    },
    {
      title: 'Offices, markets, oil',
      lines: [
        `City ${formatCost(COSTS.investCity)}.`,
        `Village ${formatCost(COSTS.investVillage)}. Mine ${formatCost(COSTS.investMine)}.`,
        `Mountain ${formatCost(COSTS.investMountain)}.`,
        `Office ${formatCost(COSTS.office)}. Max ${LIMITS.officesPerPlayer} per player, ${LIMITS.officesPerHex} per hex.`,
        'No Office on a Port, Oil Rig, Water or the Tax Office.',
        `Wood Market ${formatCost(COSTS.marketWood)}.`,
        `Metal Market ${formatCost(COSTS.marketMetal)}.`,
        `Fuel Market ${formatCost(COSTS.marketFuel)}.`,
        `Stone Market ${formatCost(COSTS.marketStone)}.`,
        `Market trade: ${LIMITS.marketTradeRate} of the Port resource to 1, once per turn.`,
        `Lease ${formatCost(COSTS.oilLease)} for one turn cycle.`,
        `Opening bid ${formatCost(COSTS.oilBidMinimum)}. Raise by at least ${money(LIMITS.oilBidIncrement)}.`,
        'Bid money is paid at once and is not refunded.',
      ],
    },
    {
      title: 'Inspector, Steel, victory',
      lines: [
        `7: players with ${LIMITS.taxThreshold}+ ordinary resources give half, rounded down.`,
        `Then ${LIMITS.steelTaxRange[0]} or ${LIMITS.steelTaxRange[1]} Steel loses ${LIMITS.steelTaxLoss}, unless a Vault stops it.`,
        'The active player moves the Inspector to a different revealed land hex.',
        'They take 1 ordinary resource from the owner or an Office holder there.',
        'The Inspector blocks new Roads, Offices and purchases on its hex.',
        `Vault ${formatCost(COSTS.steelVault)}. One active Vault per player.`,
        `Activated Port numbers ${PORT_NUMBERS.join(', ')} draw one Steel Card.`,
        `Deck: ${STEEL_DECK.map((c) => `${c.count}×${c.value}`).join(', ')} (${STEEL_DECK_SIZE}).`,
        'Reveal the card, take that many Steel Coins, discard it.',
        `Buy 1 Steel for ${formatCost(COSTS.steelPurchase)} with a Market and a completed network.`,
        `First player with an activated Port and ${LIMITS.steelToWin} Steel wins.`,
      ],
    },
  ];
}

export function steelCardValues(): number[] {
  return STEEL_DECK.flatMap((card) => Array.from({ length: card.count }, () => card.value));
}

export function quickStartLines(): string[] {
  return [
    'Tax the Richmen is for 2–4 players, balanced for four.',
    'Claim a City and a Port, lay the setup roads, choose a Port specialization, and take the starting resources.',
    'On your turn: roll, resolve production or a 7, trade, take up to two actions, then end.',
    'Build Roads from your City to your Port. Pay tolls to use a rival Road.',
    'Own properties, place up to two Offices, lease Oil Rigs, and run Pipelines through a Rig you do not need to lease.',
    'When your Port is connected, its number draws Steel Cards. Ten Steel on an activated Port wins.',
    'A 7 is not production. It taxes, may tax Steel, and the active player moves the Inspector.',
    'Questions marked Playtest clarification required in the rulebook are not decided on this sheet.',
  ];
}

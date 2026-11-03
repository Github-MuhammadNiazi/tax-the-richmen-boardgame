# Tax the Richmen — Game Rules, Version 1

> Generated from `src/data/rules.ts` and the frozen data modules in `src/data/`. Do not edit by hand;
> run `npm run rules:md` after changing the data. Items marked **Playtest clarification required** are
> open questions in the approved rules — the website does not invent answers for them.

## Frozen reference data

### Terrain (30 tiles)

| Terrain | Count | Role |
| --- | ---: | --- |
| City | 4 | Produces Money |
| Village | 4 | Produces Wood |
| Mine | 4 | Produces Metal |
| Mountain | 4 | Produces Stone |
| Port | 4 | Steel Cards once activated |
| Oil Rig | 4 | Produces Fuel by lease or Pipeline |
| Water | 5 | Inaccessible |
| Tax Office | 1 | Permanently inaccessible |

### Number tokens

| Number | Count |
| ---: | ---: |
| 3 | 2 |
| 4 | 3 |
| 5 | 3 |
| 6 | 2 |
| 8 | 2 |
| 9 | 3 |
| 10 | 3 |
| 11 | 2 |

No hex ever carries a 7. Ports carry 5, 6, 8, 9.

### Steel deck (20 cards, 53 Steel in total)

| Card value | Count |
| ---: | ---: |
| 1 | 5 |
| 2 | 5 |
| 3 | 4 |
| 4 | 4 |
| 5 | 2 |

### Starting resources (19 total)

| Resource | Amount |
| --- | ---: |
| Money | 6 |
| Wood | 4 |
| Metal | 4 |
| Fuel | 4 |
| Stone | 1 |

### Classic layout (columns listed top to bottom)

| Column | Tiles |
| ---: | --- |
| 1 | City, Tax Office, City |
| 2 | City, Village, Village, City |
| 3 | Hidden (Mine/Mountain), Village, Water, Village, Hidden (Mine/Mountain) |
| 4 | Hidden (Mine/Mountain), Hidden (Mine/Mountain), Hidden (Mine/Mountain), Hidden (Mine/Mountain), Hidden (Mine/Mountain), Hidden (Mine/Mountain) |
| 5 | Port, Port, Water, Port, Port |
| 6 | Water, Oil Rig, Oil Rig, Water |
| 7 | Oil Rig, Water, Oil Rig |

### Costs

| Item | Cost |
| --- | --- |
| `road` | 1 Wood + 1 Metal + 1 Fuel + 1 action |
| `roadMountainSurcharge` | 1 Stone |
| `pipeline` | 1 Metal + 1 Fuel + 1 action |
| `toll` | 2 Money + 1 action |
| `office` | 1 Money + 1 action |
| `upgrade` | 3 Money + 1 Stone + 1 action |
| `oilLease` | 1 Money + 1 action |
| `oilBidMinimum` | 2 Money + 1 action |
| `steelVault` | 3 Money + 2 Stone + 1 action |
| `steelPurchase` | 2 Metal + 1 Fuel |
| `investCity` | 4 Money + 1 action |
| `investVillage` | 2 Money + 1 action |
| `investMine` | 3 Money + 1 action |
| `investMountain` | 2 Money + 1 action |
| `marketWood` | 2 Money + 1 Metal + 1 Fuel + 1 action |
| `marketMetal` | 2 Money + 1 Fuel + 1 Stone + 1 action |
| `marketFuel` | 2 Money + 1 Wood + 1 Stone + 1 action |
| `marketStone` | 2 Money + 1 Wood + 1 Metal + 1 action |

### Limits

| Limit | Value |
| --- | --- |
| `actionsPerTurn` | 2 |
| `idleTurnBonusMoney` | 1 |
| `tollBaseAllowance` | 2 |
| `tollMaxLifetime` | 3 |
| `tollThirdUnlockPaidRoads` | 4 |
| `officesPerPlayer` | 2 |
| `officesPerHex` | 2 |
| `officesPerPlayerPerHex` | 1 |
| `upgradesPerPlayer` | 1 |
| `oilBidIncrement` | 1 |
| `pendingBidsPerPlayer` | 1 |
| `bankTradeRate` | 4 |
| `marketTradeRate` | 2 |
| `marketTradesPerTurn` | 1 |
| `taxThreshold` | 8 |
| `officeSharingThreshold` | 8 |
| `officeSharingTarget` | 7 |
| `steelTaxRange` | 8–9 |
| `steelTaxLoss` | 1 |
| `steelToWin` | 10 |
| `vaultsActivePerPlayer` | 1 |

## I. Overview & Components

Tax the Richmen is an economic strategy board game for 2–4 players, balanced primarily for four. Build Roads from your City to your Port, control resources, outbid rivals for Oil, and survive the Tax Inspector. The first player with an activated Port to hold 10 Steel launches their ship and wins.

### Objective

**Connect your City to your Port, activate Steel production, and be first to accumulate 10 Steel.**

Victory is immediate: the first player with an activated Port to hold at least 10 Steel constructs their winning ship. No additional action is required.

### The board

**Thirty hex tiles in seven columns of 3, 4, 5, 6, 5, 4 and 3.**

Twenty resource-producing hexes carry a number token: 3 ×2, 4 ×3, 5 ×3, 6 ×2, 8 ×2, 9 ×3, 10 ×3, 11 ×2. The four Ports carry 5, 6, 8, 9. No tile ever carries a 7.

Eight Mine and Mountain tiles are placed face-down with identical backs. Their type and number stay concealed until revealed.

Water hexes and the Tax Office are permanently inaccessible.

- 4 Cities — Produces Money
- 4 Villages — Produces Wood
- 4 Mines — Produces Metal
- 4 Mountains — Produces Stone
- 4 Ports — Steel Cards once activated
- 4 Oil Rigs — Produces Fuel by lease or Pipeline
- 5 Water — Inaccessible
- 1 Tax Office — Permanently inaccessible

> **Playtest clarification required:** When is a concealed Mine/Mountain tile revealed?

### Number allocation

**Each group of four resource locations receives two high and two low numbers.**

High-probability numbers are 5, 6, 8, 9; low-probability numbers are 3, 4, 10, 11. Each of the five producing categories — City, Village, Mine, Mountain and Oil Rig — receives two of each, while the global frequencies above still hold.

## II. Setup

Players claim a City and a Port, lay two free road segments, choose a permanent Port specialization, and take their starting resources.

### Starting order

**All players roll two dice. The highest roll begins; ties re-roll for starting priority.**

### Two setup passes

**Claim one starting location per pass and place one free road segment each time.**

**First pass** — in clockwise order, each player selects one starting location (a City or a Port) and places one free road segment.

**Second pass** — order reverses. Each player selects their remaining starting location and places one more free road segment.

Every player finishes setup with exactly 1 City, 1 Port and 2 free road segments. The starting City and Port are assigned free of charge.

> **Playtest clarification required:** Where must the free setup road segments be placed?

> **Playtest clarification required:** What happens to unclaimed Cities and Ports in 2–3 player games?

### Port specialization round

**Each player rolls one die; the highest chooses first a unique, permanent specialization: Wood, Metal, Fuel or Stone.**

If several players roll the same result, the player who rolled earlier has priority. Specializations never change.

### Starting resources

**6 Money, 4 Wood, 4 Metal, 4 Fuel and 1 Stone — 19 ordinary resources per player.**

Taxation applies from the very first regular dice roll. There is no grace period — note that 19 starting resources already exceed the 8-resource tax threshold.

### Regular turn order

**The highest original setup roller takes the first regular turn; play proceeds clockwise for the rest of the game.**

## III. The Turn

Every regular turn follows the same five steps.

### Turn sequence

**Roll · Resolve · Trade · Up to two actions · End.**

- 1. Roll two dice.
- 2. Resolve production — or the 7 event.
- 3. Trading phase.
- 4. Take up to 2 actions.
- 5. End the turn.

### Available actions

**Each of these consumes one action and must meet its cost and eligibility.**

- Construct one Road: 1 Wood + 1 Metal + 1 Fuel + 1 action
- Construct one Pipeline segment: 1 Metal + 1 Fuel + 1 action
- Invest in a City: 4 Money + 1 action
- Invest in a Village: 2 Money + 1 action
- Invest in a Mine: 3 Money + 1 action
- Invest in a Mountain: 2 Money + 1 action
- Purchase toll access: 2 Money + 1 action
- Establish an Office: 1 Money + 1 action
- Upgrade an owned property: 3 Money + 1 Stone + 1 action
- Construct a Wood Market: 2 Money + 1 Metal + 1 Fuel + 1 action
- Construct a Metal Market: 2 Money + 1 Fuel + 1 Stone + 1 action
- Construct a Fuel Market: 2 Money + 1 Wood + 1 Stone + 1 action
- Construct a Stone Market: 2 Money + 1 Wood + 1 Metal + 1 action
- Construct a Steel Vault: 3 Money + 2 Stone + 1 action
- Acquire an Oil Rig lease: 1 Money + 1 action
- Place or raise an Oil Rig bid (minimum): 2 Money + 1 action

### Unused actions

**Unused actions never carry forward. A player who performs neither action receives 1 Money from the bank.**

Ordinary player trading does not consume actions.

## IV. Production & Economy

Five ordinary resources flow from the board: Money, Wood, Metal, Fuel and Stone. Steel is separate and is never an ordinary resource.

### Production

**When a number is rolled, every matching eligible location produces — on any player’s turn.**

Each property normally produces 1 resource. Ports do not follow resource dice rules; they produce Steel Cards once activated.

- City → Money
- Village → Wood
- Mine → Metal
- Oil Rig → Fuel (via lease or Pipeline)
- Mountain → Stone

### Property Upgrade

**Double the output of one owned producing property. Maximum one upgrade per player.**

- Upgrade: 3 Money + 1 Stone + 1 action

> **Playtest clarification required:** Which properties are eligible for the Upgrade?

### Storage & secrecy

**Resource storage is unlimited. Individual holdings are concealed; each player’s total ordinary-resource count is public.**

### Bank trading

**Exchange 4 identical ordinary resources for 1 ordinary resource of your choice.**

### Player trading

**Unlimited completed trades during the active player’s trading phase, initiated only by the active player.**

- The two players’ valid road networks must meet.
- Prices and combinations are negotiated freely.
- Only ordinary resources may be traded.
- No trading of property, Roads, Offices, toll rights or Steel.

## V. Roads & Tolls

Roads connect the centres of adjacent hexes and form the networks that carry you to the sea.

### Building Roads

**One physical Road connection per adjacent pair of hexes. Cost: 1 Wood + 1 Metal + 1 Fuel.**

A Road entering a Mountain costs an additional 1 Stone. Roads remain owned by their builders. Water and the Tax Office can never be entered.

- Road: 1 Wood + 1 Metal + 1 Fuel + 1 action
- Mountain surcharge: 1 Stone

> **Playtest clarification required:** Which Road segments pay the Mountain surcharge?

### Toll access

**Pay 2 Money + 1 action for permanent access to one other player’s Road.**

- Extend your network using legally accessed toll Roads.
- Two consecutive toll Roads are prohibited along your route without an intervening Road you built yourself.
- Base allowance: 2 purchases. A third unlocks after you construct 4 paid road segments.
- Lifetime maximum: 3 toll purchases.
- Toll Roads count toward your winning City-to-Port network. The builder keeps ownership.

- Toll access: 2 Money + 1 action

### Owner priority

**Every owned hex must retain viable incoming and outgoing access.**

Other players cannot construct infrastructure that removes every possible usable outgoing option from a property owner. No exit is reserved to a specific edge in advance, and existing accessible Roads can satisfy the owner’s access requirement.

## VI. Ownership & Offices

Invest to own production. Establish Offices to expand through — and share in — a rival’s property.

### Property investment

**Pay the investment cost to permanently own an unowned property you can legally reach by Road.**

- Maximum one permanently owned property of each applicable type per player.
- An unowned property goes to the first eligible player who pays its cost. Reaching a hex does not grant ownership.
- Oil Rigs cannot be owned; they follow leasing rules.
- Property acquisition requires valid Road access — never Pipeline access.

- City: 4 Money + 1 action
- Village: 2 Money + 1 action
- Mine: 3 Money + 1 action
- Mountain: 2 Money + 1 action

> **Playtest clarification required:** Does the free starting City count toward the one-property-per-type limit?

### Offices

**Cost 1 Money + 1 action. A permanent foothold allowing expansion through an opponent’s eligible property.**

- Maximum 2 Offices per player, 2 Offices per hex, one per player per hex.
- Allowed on: City, Village, Mine, Mountain.
- Not allowed on: Port, Oil Rig, Water, Tax Office.
- An Office grants neither ownership nor independent production.

- Office: 1 Money + 1 action

### Office resource sharing

**When an owned property with Offices produces and the owner holds 8+ ordinary resources, the owner chooses one of two options.**

The owner chooses which previously held resources are transferred; the newly produced resource itself cannot be transferred. With two Offices, sharing follows clockwise player order. Office holders never become owners.

- A. Reject the newly produced resource; or
- B. Keep it and distribute previously held ordinary resources to the Office holders until the owner’s total is 7.

*Example:* Owner holds 8 resources and receives a 9th. Choosing B, they keep the new one and hand 2 previously held resources to the Office holder(s), ending at 7.

> **Playtest clarification required:** How are shared resources divided between two Office holders?

## VII. Oil Rig Leasing

Oil Rigs can never be bought. Their Fuel belongs to whoever holds the current lease — and to anyone with a Pipeline through them.

### Standard lease

**Pay 1 Money + 1 action for temporary Fuel rights lasting one complete turn cycle.**

The lease ends when the lessee’s next turn begins. While it is active and production is not blocked, the lessee receives Fuel whenever that Rig’s number is rolled.

- Lease: 1 Money + 1 action

> **Playtest clarification required:** Must a player have Road access to an Oil Rig to lease or bid on it?

### Advance bidding

**Bid to secure the next lease on an occupied Rig.**

- Minimum opening bid: 2 Money. Each new bid must exceed the leading bid by at least 1 Money.
- Every bid costs 1 action. Bid Money is paid immediately; outbid players receive no refund.
- Each player may hold at most 1 active pending bid.
- The current lease stays valid until its scheduled expiry.
- On expiry, the highest valid pending bidder becomes entitled to the next lease, which begins at the start of that bidder’s first turn after expiry and lasts one complete cycle.
- There are no extra auction rounds, and a current lessee cannot invalidate a winning bid through automatic renewal.

- Minimum opening bid: 2 Money + 1 action

> **Playtest clarification required:** Can an advance bid be placed on a Rig that has no current lessee?

## VIII. Pipelines

Permanent industrial links that draw Fuel from a Rig without a lease.

### Building Pipelines

**Cost per segment: 1 Metal + 1 Fuel. Connect two different hexes you own through an Oil Rig.**

- A Pipeline may not be used to claim an unowned property.
- Pipelines do not count toward winning Road networks, toll requirements, road-construction achievements or network-based trading.

- Pipeline segment: 1 Metal + 1 Fuel + 1 action

> **Playtest clarification required:** How are Pipeline segments physically laid out?

### Pipeline production

**A completed Pipeline earns its owner 1 Fuel whenever that Rig’s number is rolled — no lease required.**

A Pipeline owner and an active lessee both receive Fuel from the same Rig on a matching roll; their rights are independent. Pipelines keep working when lease rights change. The Inspector suspends Rig production without cancelling Pipelines or leases.

## IX. The Tax Inspector

A roll of 7 produces nothing. Instead, the Treasury collects — in four strict steps.

### Resolving a 7

**Taxation · Steel tax · Relocation · Theft.**

- 1. Ordinary taxation — every player holding 8+ ordinary resources surrenders half to the bank, rounded down. They choose which.
- 2. Steel taxation — players holding 8 or 9 Steel lose 1 Steel unless protected by an active Steel Vault.
- 3. Relocation — the active player moves the Inspector to a different eligible hex.
- 4. Theft — the active player selects a victim on that hex (the property owner or an Office holder) and randomly takes 1 ordinary resource. Steel can never be stolen.

*Example:* A player holding 9 ordinary resources surrenders 4. A player with 8 Steel and no Vault drops to 7.

> **Playtest clarification required:** Where does the Tax Inspector stand before the first 7 is rolled?

### Eligible destinations

**Any revealed land hex, owned or unowned.**

- Not eligible: Water, the Tax Office, unrevealed Mine/Mountain tiles.
- The Inspector must move to a different hex on every 7, and only a 7 can move it.

### Effects while occupied

**The Inspector freezes new development on its hex without breaking what already exists.**

- No new Road construction into or out of the hex.
- No new Office, no new property purchase.
- Existing Roads remain usable and networks remain connected.
- On an Oil Rig: all Fuel production — lease and Pipeline — is suspended. Leases are not cancelled.
- On a Port: Steel Card production, specialized Market trading and Market Steel purchase are suspended. Existing Steel remains safe except for normal Steel taxation.

## X. Port Markets

Each Port has one permanent specialization. Build its Market to unlock specialized trade.

### Market construction

**Each Market costs one action plus its materials.**

- Wood Market: 2 Money + 1 Metal + 1 Fuel + 1 action
- Metal Market: 2 Money + 1 Fuel + 1 Stone + 1 action
- Fuel Market: 2 Money + 1 Wood + 1 Stone + 1 action
- Stone Market: 2 Money + 1 Wood + 1 Metal + 1 action

### Specialized exchange

**Once per turn, trade 2 of your Port’s specialized resource for 1 ordinary resource of choice.**

- Example: a Wood Market converts 2 Wood → 1 ordinary resource of choice.
- Only the assigned resource is accepted; the Market never trades arbitrary resources at 2:1.
- Standard bank trading remains 4:1.
- Markets do not require a completed City-to-Port network. Ownership is tied to the player’s Port.
- An Inspector on the Port suspends specialized trading.

## XI. Steel & Victory

Complete a continuous Road network from your starting City to your Port to activate Steel production.

### Port activation

**A continuous valid Road network between your starting City and your Port activates it.**

The network may use Roads you built and legally purchased toll Roads. Office and toll requirements still apply.

### Steel production

**Whenever an activated Port’s number (5, 6, 8, 9) is rolled by any player, its owner draws one Steel Card.**

No production while the Inspector occupies that Port.

### The Steel deck

**20 cards: 5× value 1, 5× value 2, 4× value 3, 4× value 4, 2× value 5.**

- 1. Draw one Steel Card.
- 2. Reveal its value to yourself.
- 3. Take that many Steel Coins (each coin = 1 Steel).
- 4. Place the card in the discard pile.
- When the deck runs out, shuffle the discards into a fresh deck. Steel Coins stay privately concealed; a public count of card draws may be tracked.

### Purchasing Steel

**With a constructed Port Market and a completed network, exchange 2 Metal + 1 Fuel → 1 Steel Coin.**

No per-turn limit during the trading phase. The exchange must use your constructed Port Market; the 2:1 specialized exchange never applies to Steel.

- Steel Coin: 2 Metal + 1 Fuel

### Steel Vault

**Cost 3 Money + 2 Stone + 1 action. Protects against one Steel-tax event, then expires.**

- Available after Port activation.
- Only one active Vault per player.

- Steel Vault: 3 Money + 2 Stone + 1 action

> **Playtest clarification required:** Is a Steel Vault consumed by any 7, or only when it actually prevents a Steel loss?

### Victory

**The first player with an activated Port to hold 10 or more Steel immediately wins.**

The winning ship is constructed automatically — no action is required. All normal actions remain available after activation and before victory.

## Glossary

| Term | Definition |
| --- | --- |
| Action | One of the two activities a player may perform each turn after trading. |
| Active player | The player taking the current turn. Only they initiate trades and resolve a 7. |
| Activated Port | A Port connected to its owner’s starting City by a continuous valid Road network. |
| Advance bid | Money paid immediately to claim the next lease on an occupied Oil Rig. |
| Bank trade | 4 identical ordinary resources for 1 of choice. |
| Concealed tile | A face-down Mine or Mountain whose type and number are hidden. |
| Cycle | One full round of turns; a lease lasts until the lessee’s next turn begins. |
| Market | A Port building enabling one 2:1 specialized exchange per turn and Steel purchase. |
| Office | A permanent foothold on a rival’s City, Village, Mine or Mountain. |
| Ordinary resource | Money, Wood, Metal, Fuel or Stone. Steel is not ordinary. |
| Owner priority | Every owned hex must keep viable incoming and outgoing access. |
| Pipeline | Permanent link between two owned hexes through an Oil Rig, yielding Fuel. |
| Port specialization | A permanent resource (Wood, Metal, Fuel or Stone) assigned to each Port. |
| Steel Card | Shipping certificate of value 1–5, converted into Steel Coins when drawn. |
| Steel Coin | One unit of Steel. Ten wins the game. |
| Steel Vault | Protection against one Steel-tax event. |
| Tax Inspector | Movable token relocated on every 7; freezes development on its hex. |
| Tax Office | The permanently inaccessible Treasury tile. |
| Toll access | Permanent right to use one rival Road, bought for 2 Money + 1 action. |
| Upgrade | Doubles one owned producing property’s output; one per player. |

## Playtest clarifications required (12)

1. **Does the free starting City count toward the one-property-per-type limit?**
   Each player starts with a free City, and players may permanently own at most one property of each applicable type. Whether a player may still invest 4 Money in a second City is not yet settled.

2. **When is a concealed Mine/Mountain tile revealed?**
   Hidden tiles conceal both type and number. The approved rules state they cannot receive the Inspector while unrevealed, but do not define the exact reveal trigger (for example, first Road entry or adjacency). This also affects when the Mountain road surcharge becomes known.

3. **Where does the Tax Inspector stand before the first 7 is rolled?**
   The Inspector is a separate token and must move to a different eligible hex on each 7. Its starting position (for example, beside the Tax Office tile) is not specified.

4. **Must a player have Road access to an Oil Rig to lease or bid on it?**
   Lease and bid costs are approved; any network-access requirement for leasing has not been stated.

5. **How are Pipeline segments physically laid out?**
   Pipelines cost per segment and must connect two different owned hexes through an Oil Rig. Whether segments follow hex-centre connections like Roads, may share a connection with a Road, or may pass over Water is not yet defined.

6. **How are shared resources divided between two Office holders?**
   With two Offices sharing follows clockwise player order. The quantity each holder receives (alternating one at a time or otherwise) is not specified, nor is the interaction with an Upgraded (doubled) property.

7. **Is a Steel Vault consumed by any 7, or only when it actually prevents a Steel loss?**
   A Vault "protects against one Steel-tax event, then expires." Whether a 7 that would not have taxed the player consumes it is open.

8. **What happens to unclaimed Cities and Ports in 2–3 player games?**
   Four-player play is the balance target. With fewer players, whether unclaimed Ports/Cities remain on the board as ordinary hexes, can be invested in, or produce is not specified.

9. **Where must the free setup road segments be placed?**
   Each setup pass grants one free road segment. Whether it must touch the location selected in that pass is presumed but not explicitly approved.

10. **Which properties are eligible for the Upgrade?**
   An Upgrade doubles "a chosen owned producing property." Whether a Port (Steel Cards) qualifies is not stated; Oil Rigs are never owned.

11. **Which Road segments pay the Mountain surcharge?**
   A Road entering a Mountain costs an extra Stone. Roads are undirected connections between hex centres, so whether a segment leading out of a Mountain toward another hex also pays is not settled. The website demos apply the surcharge to every segment with a Mountain endpoint and label it accordingly.

12. **Can an advance bid be placed on a Rig that has no current lessee?**
   Advance bidding is defined for occupied Rigs. An unoccupied Rig is available through the standard 1 Money lease; whether bids on unoccupied Rigs are permitted is not stated.

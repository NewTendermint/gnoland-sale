# GNOT Token Sale - Landing Page Content

**Source**: `GNOT Token Sale Website.xlsx` (provided 2026-05-19)
**Status legend**: ✅ Ready · ⚠️ TBD (waiting on input) · 🟡 Partial (some fields ready, some TBD)
**Owner**: gno.land marketing/legal team
**Last sync**: 2026-05-19

---

## How to edit this file

This is the **source of truth** for all copy on `sale.gno.land`. Edit text here, commit, and the site rebuilds (MDX pipeline reads from here at build time). Do NOT edit copy directly in React components - it gets out of sync.

When a section is `⚠️ TBD`, please replace the `[TBD: ...]` placeholders with real content. The build will warn (not fail) if TBDs ship to production - so we can iterate, but they're visible.

---

## #0 - Hero  ✅

**Status**: Ready (validated 2026-05-21 alongside redesign decisions draft)

**Elements** (above the fold, centered monumental composition):

- **Status pill** (top, centered): live-state badge with a dot indicator
- **H1 title** (single full-width line, uppercase via CSS, letter-spaced)
- **Sub-claim** (two lines, centered, muted foreground)
- **Meta line** (one line, font-mono, faint foreground, countdown)
- **Pixel-transition strip** (signature element, between text block and voxel scene)
- **Voxel village scene** (full-width, overflows briefly downward into a short transition zone before the next narrative section)

**Copy** (validated):

- Title: `GNOT Public Sale`
- Sub-claim: `The native token of Gno.land, the next-generation smart contract platform powered by Gno.`
- Meta line: dynamic, depends on auction state (see below).
- Pill: dynamic, depends on auction state (see below).

**State-dependent strings**:

| State | Pill | Meta line |
|---|---|---|
| Pre-sale | `Opens [date]` | `Opens in [delta]` |
| Live | `Auction live` | `Closes in [delta]` |
| Post-sale | `Auction closed` | `Closed [date]` |

`[delta]` is a live countdown formatted `XXd YYh` (drops to `YYh ZZm` under 24h, then `ZZm SSs` under 1h).

**Design notes**:

- Hero carries zero KPIs by design. KPIs live exclusively in the persistent sticky BidPanel tile (bottom-right, always visible, see section about the sticky tile). No separate "Sale Mechanics" section sits directly under the hero.
- Auction format (`Uniform Price Auction`), accepted currencies, allocation %, unlock schedule, and other static facts belong to a "Sale Details" section further down the page.
- Voxel scene occupies >=50% of the hero (lower half, full-width). It continues briefly into a short overflow zone below the hero, then the page returns to a solid background for the next narrative section. The voxel is NOT used as a continuous background under other sections.
- Title uppercase tracking-wide at text-7xl/8xl full-width on desktop. Below 640px the title collapses to multiline.

---

## #1 - Header  ✅

**Status**: Ready

**Elements**:
- gno.land logo (top-left, links to `/`)
- Nav links: `Tokenomics`, `How it works`, `Roadmap`, `Docs`
- `Connect Wallet` button
- `Register` button (links to Sonar OAuth flow)

**Behavior**: Sticky on scroll, glassmorph dark background after scroll > 50px.

---

## #2 + #3 - Sale (merged: live + terms)  ✅

**Status**: Merged 2026-05-21 from xls #2 (Sale Metrics live) + xls #3 (Token Sale Details static). Single section with two visually distinct blocks separated by a strong hairline. Eliminates the duplicated "Unlock schedule" that appeared in both xls sections.

**Title**: `GNOT Token Sale`
**Eyebrow**: `The sale`
**Sub**: `The native token for gno.land. Live snapshot and full terms below.`

### Live block (top, monumental figures with live dot eyebrow)

Refined metric definitions (from the team xlsx, 2026-06-01), mapped to the Sonar `readCommitmentData` fields (see `docs/specs/2026-06-01-sonar-feasibility-and-sale-states.md` §2):

- **Total Committed** - the $ amount committed so far. Worked example from the team: if the price rises to $0.20 (which means 100% filled), total committed = $0.20 x 31,000,000 = $6,200,000. (SDK: `TotalCommitmentAmount`.)
- **Percent Filled** - the % of the 31M GNOT allocation that is filled. (NOT a direct SDK field - derived, see feasibility doc G1.)
- **Total Number of Participants** - live count of people who have placed a bid. (SDK: `UniqueCommitmentCount`.)
- **Cutoff Price** - the minimum price a participant can bid and still get an allocation. NOTE: this is the same number the SDK calls the **clearing price** (`ClearingPriceMicroUSD`); the page must use ONE label for it, not present cutoff and clearing as two metrics.
- **My Bids** - my bid price and the amount I contributed. Team-provided outbid copy (verbatim): "You've been outbid! Place another bid above the current auction price." (SDK: filter `Commitments[]` by my `SaleSpecificEntityID`, compare my price to the clearing price.)

> Copy-accuracy flag (do not silently rewrite): the verbatim outbid line above implies "claim then re-bid", but the contract increases a bid via a monotonic raise during the live auction (`replaceBidWithPermit`) and only refunds at settlement (`claimRefund`). The two actions should not be collapsed into one during the live phase. Owner decides the final wording.

**API source**: Sonar `readCommitmentData({ saleUUID })`, proxied server-side per ADR §4.3.

**Duplication note**: these KPIs also live in the persistent sticky BidPanel in the corner. Intentional: section gives a monumental at-a-glance snapshot, sticky keeps them always accessible during scroll.

### Terms block (bottom, quieter key/value in 4 groups)

| Group | Rows |
|---|---|
| Token | Token (GNOT) · Format · Currencies |
| Numbers | Total raise · FDV (when met) · Allocation |
| Bid range | Minimum price · Min commitment · Max commitment |
| Schedule | Contribution window · Mainnet launch · Unlock schedule |

---

## #3 - Token Sale Details  🟡 Partial (numbers in, some provisional)

> **2026-06-13 confirmations (Jae + Ryan, via owner)**: hardcap English auction - floor $0.0645 ($86M FDV), **maximum price $0.1290** ($172M FDV), no further bids once the hardcap is reached; **bid increment $0.00645** (no price levels; any off-step bid must show a UI error); **US accredited investors enabled with a 1-year lockup**; pre-registration July 1, sale July 15 (unchanged); **September 1, 2026 = transfers enabled / listings / distribution (mainnet)**. Reflected the same day in the terms table, bid validation, FAQ and Roadmap. The 31M vs 77,499,999 offered-amount discrepancy below is now RESOLVED - see the 2026-06-15 amendment.
>
> **2026-06-15 amendment (doc revision, owner-validated): chain + economics updated.** The sale runs on **Ethereum mainnet** (preview: Sepolia), accepting USDC - the earlier Base pin is superseded (code + ADR migrated 2026-06-15). Offered amount is **77,500,000 GNOT (~5.8% of supply)**, superseding the recorded 31M. **Soft cap $2,000,000 / hard cap $10,000,000**, **minimum commitment $100**, **contribution window July 15-21, 2026**. The terms table is now two sections (Sale Overview + Pricing and Caps) instead of four. Roadmap Q1 2026 now states the first GNOT (genesis/beta) distribution. Wherever the fields and notes below still show 31M / $200 / Base / a vague end date, they are superseded by this amendment.

> **2026-06-21 amendment (owner-validated, final-form copy): schedule, caps, audit, FAQ, backers.** Exact schedule with times (single source = `lib/sale/economics.ts`): **Registration opens Monday, July 6, 2026 at 6:00 PM EST**; **sale starts Monday, July 20, 2026 at 6:00 PM EST**; **sale ends Monday, July 27, 2026 at 5:59 PM EST** (close was July 26, now July 27). **Soft cap removed** (no `targetRaiseUsd` / floor; hard cap $10,000,000 stays). **No maximum commitment** (the $100,000 whale cap is dropped; minimum $100 stays). **Security audit: Oak Security only** (already the single auditor shown). Unlock final tranche is **9% in month 14** (corrects the earlier "month 13"; matches the #4b vesting module, distribution months 1-14). The **FAQ copy is rewritten to the owner's final wording** (new "When is the token sale date?" question; the "What happens if I get outbid?" answer now lists the three raise options with worked GNOT examples). Footer External links reordered: **Gno.land -> NewTendermint -> GitHub -> Adena** (and the gno.land label is now "Gno.land"). New **"Our Backers" section** added (see #13). Superseding rows in the table below: min commitment $200 -> $100, max commitment $100,000 -> none, "month 13" -> "month 14", end date -> July 27.

**Status**: Updated 2026-06-01 from the team xlsx + the 2026-05-30 Sonar call recap (see `docs/REQUIREMENTS_FROM_TEAMS.md` A.12.2). Values marked 🟡 were filled from Friday's meeting and still need Dongwon to finalize. The contribution-window end date is deliberately left vague because the sale may be extended (A.12.2).

**Source xls note**: "I filled out the numbers based on our meeting on Friday, but I will need to talk to Dongwon to finalize some numbers."

**Fields**:

| Field | Value | Status |
|---|---|---|
| Token | GNOT | ✅ |
| Starting price (= minimum price) | $0.0645 per GNOT | ✅ |
| Maximum price | $0.129 per GNOT (hardcap; bidding stops if reached) | ✅ confirmed 2026-06-13 |
| Bid increment | $0.00645 (UI rejects any off-step bid) | ✅ confirmed 2026-06-13 |
| Total raise | $2,000,000 at starting price (may grow if oversubscribed) | ✅ |
| Minimum commitment | $200 per entity | 🟡 provisional |
| Maximum commitment | $100,000 per entity (whale cap) | 🟡 provisional |
| FDV at clearing | $86M to $172M (floor to hardcap) | ✅ confirmed 2026-06-13 |
| Unlock schedule | 7% released on mainnet launch (the day GNOT becomes transferable), 7% released each subsequent month, and 9% in the final month - fully vested 13 months after mainnet launch | ✅ |
| Allocation (% of total supply) | 31,000,000 GNOT (2.32% of the 1.333B total supply) | ✅ (see discrepancy note) |
| Registration opens | July 6, 2026 | ✅ |
| Contribution window | Opens July 20, 2026 · until close or hardcap | ✅ confirmed 2026-06-13 |
| Accepted currency | USDC (USDT technically supported by the contract; default USDC) | 🟡 |
| Mainnet / distribution | September 1, 2026 (transfers enabled, listings, distribution) | ✅ confirmed 2026-06-13 |
| US participants | Accredited investors only, 1-year lockup (stack vs overlay interaction OPEN, A.15) | ✅ confirmed 2026-06-13 |
| Auction format | Uniform Price Auction (English Auction) | ✅ |

**Sonar dashboard intel (2026-06-10, NOT published yet - the dashboard is on Sepolia/testnet, treated as test config):** offered tokens this sale **77,499,999** (token decimals 6); price cap **$0.129**; bid increment **$0.00645**; commitment window **July 15 -> July 20, 2026** (00:00 UTC); registration opens July 1, 2026; chain Sepolia; payment USDC; English auction. Proceeds-receiver + contract-admin addresses still empty.

> ✅ **RESOLVED 2026-06-15 (owner-validated):** offered amount = **77,500,000 / ~5.8%**, soft cap $2M / hard cap $10M, min commitment $100, window July 15-21, chain **Ethereum mainnet**. _(Original note kept for history:)_ ⚠️ the dashboard's offered amount **77,499,999** (~5.81% of supply, => ~$5M at $0.0645 / ~$10M at the $0.129 cap) contradicts the figure currently on the page, **31,000,000 / 2.32% / $2M raise**. Because the dashboard is on Sepolia (test), the page keeps the recorded **31M / $2M** until the team confirms the mainnet config. Min price $0.0645 is the one dashboard value cross-confirmed and used on the page. Min/max commitment ($200 / $100,000) and the contribution-window open date are filled on the page but remain 🟡 provisional.

---

## #4 - Transparency Report  ✅ (merged into #2/#3)

**Status**: Merged 2026-05-21. The xls source confirms there is just one document (Token Disclosure PDF) that contains tokenomics + legal structure + audit. Single link is added at the bottom of the merged "Sale" section (#2/#3), not a standalone section.

**Source xls note**: "Need final tokenomics. Need links to legal structure and audit. See https://cdn.fluent.xyz/docs/token-disclosure.pdf"

**Link copy** (in TokenDetails footer): `Token Disclosure Document`
**Description** (in TokenDetails footer): `Full tokenomics, legal structure, and smart contract audit in one PDF.`
**Placeholder href**: `#token-disclosure` (to be replaced with the real PDF URL when delivered by the team).

---

## #4b - Tokenomics (allocation + vesting)  ✅ (real numbers in)

**Status**: Filled 2026-06-10 from the team "$GNOT Vesting Schedule - Allocation & Distribution" sheet + pie chart. These are the real, as-of-today figures (the prior tile values were placeholders). Mirrored into `content/sections/tokenomics.ts`. Verified: the seven quantities sum to 1,333,000,000 GNOT and each percent = quantity / total.

**Title**: `How GNOT is distributed`
**Subtitle**: `Genesis allocation and unlock schedule. Total supply 1,333,000,000 GNOT.`

**Genesis allocation (Allocation tile, ordered largest -> smallest):**

| Category | % of supply | GNOT | Purpose (verbatim from sheet) |
|---|---|---|---|
| Airdrop1 - Cosmos | 26.26% | 350,000,000 | From partial Cosmos governance snapshot 3 years ago |
| NT,LLC | 24.91% | 332,000,000 | For use at NT,LLC discretion |
| Investors | 22.51% | 300,000,000 | For past and future investors |
| Airdrop2 - AtomOne | 17.33% | 231,000,000 | From recent AtomOne snapshot prior to launch |
| Ecosystem Treasury | 4.50% | 60,000,000 | For prior and future Gno.land ecosystem development |
| Core Treasury | 3.00% | 40,000,000 | For paying for core development |
| Validator Treasury | 1.50% | 20,000,000 | For paying validators |
| **Total** | **100%** | **1,333,000,000** | |

**Unlock schedule (Vesting tile, identical for every allocation):** 7% at mainnet launch (TGE), 7% each subsequent month, 9% in the final month. 13 x 7% + 9% = 100%, fully vested 13 months after mainnet (distribution runs months 1-14). No cliff. Circulating at TGE = 93,310,000 GNOT (7%). Matches #3 above.

**Note**: category labels (`Airdrop1 - Cosmos`, `NT,LLC`, ...) and purpose text are kept verbatim from the source sheet; the public-sale 31M / 2.32% figure from #3 is NOT a separate row here (the sheet does not break it out). The sheet's hypothetical price -> marketcap projections ($0.025 -> $10.00) are deliberately NOT published.

---

## #5 - How to Participate  ✅

**Status**: Updated 2026-06-12 (reordered to Verify / Connect / Bid: Sonar verification is wallet-independent and opens ~2 weeks before the sale, so it leads; verified returning users auto-skip it. 4th step Distribution kept; renamed to Receive 2026-06-22 - action verb, matches Verify / Connect / Bid.)

**Title**: `How to participate`
**Eyebrow**: `How it works`

**4 steps** (horizontal grid):

1. **Verify** - Complete identity verification with Sonar, Echo's compliance platform. (Sonar one-liner added 2026-06-13, owner-requested)
2. **Connect** - Connect your wallet to join the sale.
3. **Bid** - Set your max price and commit USDC.
4. **Receive** - Tokens are distributed to your address. Token lockup is applied according to schedule.

**Source xls note (2026-06-01)**: "Add link to Sonar registration website." The Verify step's CTA links to the Sonar registration/OAuth URL (the `#register` anchor today is a placeholder; real URL comes with the `clientUUID` from the Founder Dashboard, REQUIREMENTS A.2). Registration opens **July 6, 2026**, two weeks before the sale opens (July 20) - the pre-sale phase should push registration during this window.

**Design note**: Each step is a card in a 4-col grid (uniform widths, NOT Bento), with an icon-in-circle on top + title + body. Layer 4 swaps the placeholder numbered circle for a detoured voxel icon per step.

---

## #6 - The Open Knowledge Base for the New Millennium  ✅

**Status**: Ready

**Body**:

> Gno.land, developed by NewTendermint, is a next-generation smart contract platform built on Gno, a Go-based interpreted language that lets developers build secure, expressive on-chain applications using one of the world's most popular programming languages. Founded by Jae Kwon, co-founder of Cosmos and Tendermint, Gno.land represents a paradigm shift in multi-user programming. Unlike traditional blockchain environments that require a learning curve, Gno.land meets developers where they already are, dramatically lowering the barrier to entry while maintaining the performance and clarity Go is known for.
>
> At its core, Gno.land is designed for transparency, security, and long-term composability. All smart contracts are fully on-chain, human-readable, and permanently verifiable, meaning anyone can audit, fork, or build on top of existing code without trust assumptions. Combined with a fair, community-driven governance model and a tokenomics structure designed for sustainable growth, Gno.land is building the foundation for a more open and accountable decentralized internet.

---

## #7 - Built for Developers, Designed for Eternity  ✅

**Status**: Ready

**Lead**: none - the list leads with the OS statement as its first item.

**6 features** (shipped 2026-06-15; supersedes the prior 5-feature list and the Option A/B decision - the section H2 stays "Built for Developers, Designed for Eternity", the OS line is the first list item):

### The World's First General-Purpose, Language-Based, Multi-User OS
More than just a typical smart contract platform, Gno.land is designed to be a general-purpose operating system where developer communities can collaboratively build and contribute to a single, shared, ever-evolving program.

### Built for Go Developers
Gno.land is powered by Gno, a programming language that is 99% identical to Go. With millions of Go developers worldwide, anyone familiar with Go can start building on Gno.land immediately. No new language to learn, no unfamiliar tooling.

### Human-Readable Smart Contracts
By running smart contracts as plain, readable source code rather than opaque bytecode, Gno.land lets anyone read, audit, fork, and improve any application on the network with complete transparency.

### Native Composability and Type Safety
Gno.land uses Go-style packages with full type checking, so bugs are caught before deployment rather than on a live network. Developers can safely build on top of existing contracts, making complex applications easier to compose and maintain.

### Fully Deterministic Execution
Every smart contract on Gno.land behaves identically across the entire network, guaranteeing predictable, trustless consensus while keeping code simple, transparent, and straightforward to audit.

### Automatic Data Persistence
Gno.land automatically saves and manages data for developers, eliminating some of the most repetitive and error-prone work in smart contract development. On Gno.land, developers can focus on the important stuff - building and shipping.

---

## #8 - GNOT, the Native Token Powering Gno.land  ✅

**Status**: Ready - needs graphic asset

**Source xls note**: "NEED GRAPHIC"

**Lead**: none - the title carries the section; use cases below.

**4 use cases** (reordered + rewritten 2026-06-15):

- **Storage Deposits** - GNOT is locked as a storage deposit whenever data is persisted in a realm. Holding GNOT means reserving ownership of storage on Gno.land.
- **Transaction Fees** - GNOT is the fuel that enables every transaction on Gno.land. Each transaction is paid for in GNOT, so demand for the token rises as network activity increases.
- **IBC/ICS** - GNOT is used for all IBC and ICS cross-chain interactions. The transfer of value between Gno.land and other chains requires GNOT, extending the token's utility beyond Gno.land itself.
- **Contract Execution** - GNOT functions as the gas token that powers smart contract execution. Every computation a contract runs is metered and settled in GNOT, keeping resources fairly priced and the network resistant to spam.

**Asset TBD**: [Need voxel illustration of "GNOT in motion" or a circular flow diagram]

---

## #9 - The Ecosystem in Numbers  ✅

**Status**: Ready - testnet13 data to add when available

**Eyebrow**: `Gno.land in Numbers`
**Title**: `The Ecosystem in Numbers`
**Lead**: `Five years of compounding open-source development. Built transparently in public by a growing developer community.`

**Stats (current)**:
- 5 years building
- 150+ contributors
- 100+ on-chain packages
- 2400+ PRs merged
- 100+ open source repos
- 2900+ commits
- 1100+ issues closed

**Stats to add when testnet13 data available**:
- Apps deployed: [TBD]
- Transactions: [TBD]
- Active addresses: [TBD]

**Animation**: counter-up effect when section enters viewport.

---

## #10 - Team (& Advisors)  ⚠️ TBD

**Status**: Filled - roster + roles confirmed 2026-06-22, maintained in `content/sections/team.ts` (11 members, all bios provided; Maxwell Lutz replaced by Liu Tianzhao).

**Eyebrow**: `Core team`
**Title**: `The Team Behind Gno.land`
**Lead**: `The engineers, researchers, and operators building Gno.land in the open, from the makers of Cosmos and Tendermint.`

**Source xls note**: "Need updated list of team and advisors"

**Required per person**: name, role, photo (or voxel avatar), short bio (1-2 lines), socials (X, LinkedIn).

**Suggested split**: Core team / Advisors (2 separate grids).

---

## #11 - Roadmap  ✅

**Status**: Ready

**Eyebrow**: `Roadmap`
**Title**: `From Bootstrap to Mainnet`

**2021** - Jae Kwon bootstrapped the Gno Virtual Machine (GnoVM) and Tendermint node. A functional blockchain was established with a foundational virtual machine, automatic state persistence, and the first Boards realm.

**2023** - Gno.land introduced key developer tools including gnodev, the Playground, and GnoChess. The team also released official documentation and the Gno Network Public License, formalizing how the network would be developed and shared.

**2024** - Permanent multi-node Test4 (with GovDAO) and Test5 with expanded validators. Major VM fixes, performance upgrades, and stability improvements.

**2025** - Network stabilization came with Test6 to Test8, GovDAO V3, token mechanics, and major GnoVM upgrades. Additional progress included governance testing, regular developer updates, community events, and improved validator tooling.

**Q1 2026 - Gno.land Beta Mainnet Launch** - Beta Mainnet launches with the first distribution of the GNOT token, a fully operational GnoVM-powered smart contract network, and the inaugural release of GovDAO. (2026-06-15 per doc revision: the Q1 genesis/beta distribution is stated again; it is distinct from the sale-participant distribution, which is Q3 / September 1.)

**Q2 2026 - Expanding the network** - Gno.land is successfully connected to AtomOne on testnet via IBC, enhancing security and interoperability. GnoVM is optimized and strengthened to ensure network stability and deliver better platform features in preparation for mainnet.

**Q3 2026 - Mainnet Launch (highlighted station)** - The GNOT public sale is scheduled for July, followed by the Gno.land mainnet launch featuring a fully interoperable and security-hardened network with protocol-level GNOT transfers enabled.

**Q4 2026 - Beyond - Ecosystem Growth** - Major focus on building killer apps on Gno.land. Develop tooling.

**Design note**: horizontal scroll-pin timeline. Each year is a "station" with icon + bullet points. Active year highlighted on scroll.

---

## #12 - Ecosystem  ✅

**Status**: Ready - re-use descriptions from newtendermint.org

**Source xls note**: "Use the same description from newtendermint.org"

**Eyebrow**: `Ecosystem`
**Title**: `Discover What's Being Built`

**Projects**: the 6 featured cards below (descriptions updated 2026-06-15) lead the section; the page then shows a compact grid of 4 others (Gno Studio Connect, Tendermint2, Gnokey, Gnoweb). CommonDAO / Gnodev / Gnoverse listed below are not currently wired into the page.

### Gnoscan
Gnoscan is the official blockchain explorer for Gno.land. Use it to search wallet addresses, transaction hashes, blocks, and contracts.

### Adena
Adena is an open-source, non-custodial wallet for Gno.land built with an emphasis on user experience.

### Gnoswap
GnoSwap is the first decentralized exchange on Gno.land built on the principles of security, community-ownership, and efficiency.

### Boards
Boards is an on-chain forum built natively on Gno.land. It enables structured, open dialogue and community-driven discussion, free from centralized moderation and external control.

### Akkadia
Akkadia is an on-chain sandbox game where players create their own worlds, expand them together, and leave their activities as persistent on-chain records.

### Gno Playground
Gno Playground is a browser-based environment for writing, testing, and experimenting with Gno code. Share your code, run unit tests, deploy realms and packages, and execute functions directly from the interface with no local setup required.

### Gno Studio Connect
Connect provides direct access to Gno.land's smart contracts through function calls. Use it to explore, interact with, and engage any realm's exposed functions on the network.

### CommonDAO
A modular, on-chain governance framework built for Gno.land applications. It introduces a hierarchical structure of parent DAOs and subDAOs, enabling structured proposal management, voting procedures, and membership control.

### Tendermint2
The evolved consensus engine, redesigned from the ground up for simplicity, security, and performance.

### Gnokey
Secure key management and transaction signing for interacting with Gno.land and related networks.

### Gnodev
A local development environment for building and testing Gno applications with hot reload.

### Gnoweb
The official web interface for browsing and interacting with Gno.land realms and packages.

### Gnoverse
A community-led GitHub organization for builders in the Gno.land ecosystem. A home for ecosystem projects, shared tooling, and open collaboration maintained by and for the developer community.

**Design note**: grid 3-col (desktop) / 1-col (mobile), each card has logo + short desc + link.

---

## #13 - Our Backers  ✅ (added 2026-06-21, owner-provided)

**Status**: Ready. Owner-confirmed 2026-06-21. Mirrored into `content/sections/backers.ts`; rendered by `app/(sections)/backers/Backers.tsx`, placed after Partners and before the FAQ.

**Eyebrow**: `Backers`
**Title**: `Our Backers`

**Backers** (name -> external link, opens in a new tab):

### 1Confirmation
https://www.1confirmation.com/portfolio

### All in Bits
https://allinbits.com/

### Onbloc
https://www.onbloc.xyz/

**Asset note**: no logos provided yet, so the section renders the names as outbound text links. Swap to a logo wall when SVGs arrive.

---

## #14 - Partners  ✅

**Status**: Ready

**Eyebrow**: `Partners`
**Title**: `Our Collaborators`

**Partners**:

### Samourai Coop
Samourai Coop is a development team focused on DAOs and sustainable, community-powered applications, building the governance and coordination tools that decentralized communities need to thrive.

### Berty
Berty is a non-profit NGO specializing in secure, peer-to-peer mobile communication. Berty's work on privacy-first infrastructure aligns closely with Gno.land's mission to build a censorship-resistant internet.

### Onbloc
Onbloc is an engineering team building consumer-facing applications on Gno.land, including Adena Wallet, GnoSwap, and GnoScan, some of the ecosystem's most used tools today.

### AtomOne
AtomOne is a community-driven, constitutionally governed blockchain prioritizing security and decentralization in the Cosmos ecosystem. Gno.land plans to integrate AtomOne for consensus.

**Asset TBD per partner**: logo file (SVG preferred).

---

## #15 - Media  ⚠️ TBD

**Status**: TBD - will populate as campaign progresses

**Source xls**: "News articles, video links"

**Format**: grid of media cards (logo + headline + date + external link). 6-12 entries.

**To collect during launch campaign**: press coverage, podcast appearances, video features.

---

## #15b - FAQ  ✅ (drafted 2026-06-13, copy VALIDATED by owner 2026-06-13)

**Status**: Added 2026-06-13 (review top-10 #7). Placed between Partners and the pre-footer CTA. Copy drafted by the assistant at the owner's request; every Q/A below needs owner sign-off. Mirrored into `content/sections/faq.ts` (numbers/dates pulled from `lib/sale/economics.ts` so they cannot drift from the terms table).

**Title**: `Frequently Asked Questions (FAQ)`
**Eyebrow**: `FAQ`

**Format**: hairline-separated rows (Team credits pattern), question as full-width button, answer expands on click (grid-rows trick, single-open, reduced-motion safe).

> **2026-06-22: team refund/oversubscription corrections applied.** Q1 reduced to auction mechanics; a dedicated "refund on the difference" answer and a standalone "oversubscribed" answer absorb the content removed from Q1; the outbid answer is simplified (worked GNOT figures dropped). Mirrored verbatim into `content/sections/faq.ts`. Prices/dates still derive from `lib/sale/economics.ts`; the worked examples (#4 refund $1,000 / $0.0774, #5 oversubscription $20M / $10M / 50%) are illustrative literals. Answers may be multiple paragraphs (the FAQ component renders a string or an array of paragraphs).

1. **How does the auction work?** - The GNOT token sale takes place as a uniform-price auction (English auction) with a minimum price (starting price) of $0.0645 and a maximum price (cap) of $0.129. Participants submit bids in increments of $0.00645, specifying the price they're willing to pay and the amount. After the auction closes, a single clearing price is determined, and everyone pays that same price. All bids at or above the clearing price are successful. (prices dynamic from economics)
2. **When is the token sale date?** (NEW) - Registration with Sonar opens Monday, July 6, 2026 at 6:00 PM EST. The token sale starts Monday, July 20, 2026 at 6:00 PM EST. The sale ends Monday, July 27, 2026 at 5:59 PM EST. (dates + times dynamic from economics)
3. **What happens if I get outbid?** - If you are outbid during the sale, you can do one of three things. 1) You can wait until the sale ends and receive a full refund of your committed USDC. 2) You can raise your bid with your current USDC commitment. You won't need to add more USDC - all you need to do is sign with your wallet. 3) You can increase your commitment by depositing more USDC and placing a higher bid.
4. **If the clearing price is lower than my bid price, do I get a refund on the difference?** (NEW) - No. If the clearing price is lower than your bid, then your committed USDC will buy tokens at the clearing price. Example: A participant bids $1,000 at a maximum price of $0.129 per token. The clearing price is $0.0774. The participant receives tokens at $0.0774 (spending $1,000). (max price dynamic from economics; clearing + $1,000 illustrative literals)
5. **What happens if the sale is oversubscribed?** (NEW) - If total commitments exceed the available token supply, allocations are settled on a pro rata basis. Every participant's commitment is scaled down by the same percentage so that the total matches the sale supply. Example: If $20M is committed but only $10M worth of tokens are available, everyone receives 50% of their commitment. The rest is refunded after the sale is over. (example figures illustrative literals)
6. **What is Sonar and why do I need to verify my identity?** - This is a regulated public sale, so every participant completes a one-time identity verification (about 3 minutes) with Sonar, the compliance platform by Echo. Reviews are asynchronous and can take time, so please register early. Registration opens July 6, 2026, two weeks before the sale. (date dynamic from economics)
7. **Who can participate?** - Eligibility depends on your jurisdiction and is checked during Sonar verification. The sale is not available in some regions; if yours is restricted, Sonar will tell you during registration. US participants: only accredited investors can participate, with a one-year lockup applied.
8. **What do I need to place a bid?** - To participate in the sale, you will need to complete Sonar verification, set up a self-custody Ethereum wallet, and hold USDC. We recommend completing your identity verification and funding your wallet well ahead of the sale date of July 20, 2026. (date dynamic)
9. **How much can I commit?** - The minimum commitment requirement is $100 USDC, and there is no maximum commitment limit. You can bid anywhere between the starting price of $0.0645 and the maximum price of $0.129 in $0.00645 increments. (numbers dynamic from economics; no maximum confirmed 2026-06-21)
10. **When do I receive my tokens?** - Token distribution is set to happen in September. After you receive your tokens, tokens will be transferable with an unlock schedule applied. The unlock schedule is as follows: 7% unlocks at token generation, then 7% each month, with the final 9% unlocked in month 14. There is no cliff. (month dynamic from economics; matches #4b vesting)
11. **Can I withdraw my bid?** - No. You cannot lower or cancel a bid while the sale is running. If your bid ends below the final clearing price, your committed funds are refunded after settlement.

---

## #16 - Footer  🟡

**Status**: Partial (socials ready, legal pending)

**Socials**:
- X / Twitter: `https://x.com/_gnoland`
- Discord: `https://discord.gg/gnoland`
- Telegram: `https://t.me/join_gnoland`

**Documentation**: `https://docs.gno.land` (verify)

**Legal / Disclaimers**:
- [TBD: Terms of Service link - reviewed by Carolyn Pehrson]
- [TBD: Privacy Policy link]
- [TBD: Risk Disclosure link]
- [TBD: Restricted jurisdictions notice - copy to coordinate with Sonar compliance]
- [TBD: MiCA whitepaper link]

**Required disclaimers**:
- "Not available in restricted jurisdictions"
- "Past performance does not guarantee future results"
- "This is a high-risk investment, you may lose your entire commitment"
- "Token transferability begins at mainnet launch (Q3 2026)"

---

## TBD summary (consolidated)

To finalize before launch, we need from the team:

1. **Token economics** (#3): mostly IN as of 2026-06-01 (price $0.0645, raise $2M, FDV $86M, unlock schedule, allocation 31M / 2.32%). Still provisional: min/max commitment ($200 / $100k, await Dongwon).
2. **Dates** (#3): registration opens July 6, sale opens July 20, 2026. End date intentionally vague (sale may be extended - REQUIREMENTS A.12.2).
3. **Tokenomics pie chart** (#4): final allocation breakdown
4. **Legal PDF** (#4, #16): ToS + token disclosure + risk disclosure
5. **Audit PDF** (#4): smart contract audit (Sonar's contract - request from them)
6. **MiCA whitepaper** (#16): final version
7. **Team list** (#10): names, photos, bios, socials
8. **Investor logos** (#13): if section kept
9. **GNOT graphic** (#8): voxel asset for utility section
10. **Partner logos** (#14): SVG files for Samourai Coop, Berty, Onbloc, AtomOne
11. **Testnet13 stats** (#9): apps, transactions, active addresses

---

*This file is the canonical content reference. When in doubt about copy, check here first.*

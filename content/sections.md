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
- Sub-claim: `The native token of gno.land, a multi-user OS written in Go.`
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

**Status**: Updated 2026-06-01 from the team xlsx + the 2026-05-30 Sonar call recap (see `docs/REQUIREMENTS_FROM_TEAMS.md` A.12.2). Values marked 🟡 were filled from Friday's meeting and still need Dongwon to finalize. The contribution-window end date is deliberately left vague because the sale may be extended (A.12.2).

**Source xls note**: "I filled out the numbers based on our meeting on Friday, but I will need to talk to Dongwon to finalize some numbers."

**Fields**:

| Field | Value | Status |
|---|---|---|
| Token | GNOT | ✅ |
| Starting price (= minimum price) | $0.0645 per GNOT | ✅ |
| Total raise | $2,000,000 at starting price (may grow if oversubscribed) | ✅ |
| Minimum commitment | $200 per entity | 🟡 provisional |
| Maximum commitment | $100,000 per entity (whale cap) | 🟡 provisional |
| FDV when total raise is met | $86,000,000 ($0.0645 x 1.333B total supply) | ✅ |
| Unlock schedule | 7% released on mainnet launch (the day GNOT becomes transferable), 7% released each subsequent month, and 9% in the final month - fully vested 13 months after mainnet launch | ✅ |
| Allocation (% of total supply) | 31,000,000 GNOT (2.32% of the 1.333B total supply) | ✅ |
| Registration opens | July 1, 2026 | ✅ |
| Contribution window | Opens July 15, 2026; end date TBD (kept vague, may be extended) | 🟡 end TBD |
| Accepted currency | USDC (USDT technically supported by the contract; default USDC) | 🟡 |
| Mainnet launch | Q1 2026 Beta · Q3 2026 Mainnet (transferable) | ✅ from roadmap |
| Auction format | Uniform Price Auction (English Auction) | ✅ |

**Sonar dashboard intel (2026-06-10, NOT published yet - the dashboard is on Sepolia/testnet, treated as test config):** offered tokens this sale **77,499,999** (token decimals 6); price cap **$0.129**; bid increment **$0.00645**; commitment window **July 15 -> July 20, 2026** (00:00 UTC); registration opens July 1, 2026; chain Sepolia; payment USDC; English auction. Proceeds-receiver + contract-admin addresses still empty.

> ⚠️ **Unresolved discrepancy (team to confirm):** the dashboard's offered amount **77,499,999** (~5.81% of supply, => ~$5M at $0.0645 / ~$10M at the $0.129 cap) contradicts the figure currently on the page, **31,000,000 / 2.32% / $2M raise**. Because the dashboard is on Sepolia (test), the page keeps the recorded **31M / $2M** until the team confirms the mainnet config. Min price $0.0645 is the one dashboard value cross-confirmed and used on the page. Min/max commitment ($200 / $100,000) and the contribution-window open date are filled on the page but remain 🟡 provisional.

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

**Status**: Updated 2026-06-03 (relabeled steps 1-3 to Connect / Verify / Bid to match the bid funnel; 4th step Distribution kept)

**Title**: `How to participate`
**Eyebrow**: `How it works`

**4 steps** (horizontal grid):

1. **Connect** - Connect your wallet to join the sale.
2. **Verify** - Complete identity verification with Sonar.
3. **Bid** - Set your max price and commit USDC or USDT.
4. **Distribution** - Tokens are distributed to your address. Token lockup is applied according to schedule.

**Source xls note (2026-06-01)**: "Add link to Sonar registration website." The Verify step's CTA links to the Sonar registration/OAuth URL (the `#register` anchor today is a placeholder; real URL comes with the `clientUUID` from the Founder Dashboard, REQUIREMENTS A.2). Registration opens **July 1, 2026**, two weeks before the sale opens (July 15) - the pre-sale phase should push registration during this window.

**Design note**: Each step is a card in a 4-col grid (uniform widths, NOT Bento), with an icon-in-circle on top + title + body. Layer 4 swaps the placeholder numbered circle for a detoured voxel icon per step.

---

## #6 - The Open Knowledge Base for the New Millennium  ✅

**Status**: Ready

**Body**:

> Gno.land, developed by NewTendermint, is a next-generation Layer 1 smart contract platform based on Gno, a deterministic, interpreted version of the Go programming language. Founded by Jae Kwon, co-founder of Cosmos and Tendermint, Gno.land represents a paradigm shift in multi-user programming. Our technology empowers developer communities to iteratively and interactively build a single shared program, enabling Gno.land to serve as the "GitHub" of the blockchain ecosystem.
>
> With its familiar language and intuitive building processes, Gno.land reduces barriers for millions of Go developers, making Web3 more accessible while supporting applications that anyone can trust and use. In addition to its developer-friendliness, Gno.land is built with decentralization and censorship-resistance at its core. Under the leadership of GovDAO, the main decentralized governing body, and adhering to its Constitution, Gno.land is positioned to be the decentralized global knowledge base for the new millennium.

---

## #7 - Built for Developers, Designed for Eternity  ✅

**Status**: Ready

**Lead**: `Gno.land fundamentally changes the programming paradigm for blockchain`

**5 features**:

### Gno Programming Language
Gno is derived from Go, a language used by millions of developers worldwide to build advanced, multi-user systems. This foundation provides immediate access to a large developer community and their tools, accelerating adoption and lowering the learning curve.

### Deterministic, Source-level Execution
Programs are easily readable by humans and behave identically across all networks. Such consistency guarantees every node produces the same results for trustless consensus, while keeping code easy to read, audit, and maintain.

### Native Persistent State
Applications and objects persist by default and do not require external databases. Eliminating external databases removes the need for manual state management and external database complexity, making applications simpler and more reliable.

### Multi-User Concurrency
Shared state, parallel execution, and long-lived processes are built in. These features allow for scalable, interactive, and continuously running applications that support simultaneous multi-user engagement.

### OS-like Composability
Applications interoperate as processes instead of isolated contracts. This interoperability allows them to work together seamlessly, similar to programs in an operating system, enabling greater reusability and a richer ecosystem.

---

**Alternative feature set (team-provided 2026-06-01, DECISION PENDING - do not ship both).** The team xlsx now offers a second framing of this section under the lead "Gno.land fundamentally changes the smart contract programming paradigm". Recorded here as Option B; the owner picks A (above) or B (below) before we wire copy.

#### Option B - 6 features

- **Human-Readable Smart Contracts** - Gno.land executes smart contracts as human-readable source code instead of opaque bytecode, allowing anyone to read, audit, fork, and improve on-chain applications with full transparency.
- **World's First Language-Based Multi-User OS** - Gno.land is not just another smart contract platform. It is designed as a multi-user operating system that lets large developer communities collaboratively build and interact with a single shared program.
- **Go-Powered Developer Experience** - Gno.land is powered by Gno, a programming language ~99% identical to Go. Millions of existing Go developers can start building with almost zero learning curve using familiar tools and syntax.
- **Native Composability and Type Safety** - Gno.land supports type-checked interactions between contracts using Go-style packages, making it safer, more reliable, and more powerful to build complex interconnected applications than most other platforms.
- **Fully Deterministic Execution** - Gno.land guarantees that smart contracts behave identically across the entire network, ensuring predictable, trustless consensus while keeping code simple, transparent, and easy to audit.
- **Simpler, More Maintainable Code** - Gno.land automatically saves and manages data for developers. This eliminates repetitive and error-prone work, letting developers build applications faster with cleaner code and fewer bugs.

---

## #8 - GNOT is the native utility token for all economic activity  ✅

**Status**: Ready - needs graphic asset

**Source xls note**: "NEED GRAPHIC"

**Lead**: `GNOT is used for`

**4 use cases**:

- **Transaction fees** - GNOT is the fuel that enables each and every transaction.
- **Storage deposits** - Owning GNOT means reserving ownership of storage on Gno.land.
- **IBC/ICS interactions** - GNOT is used to pay for all cross-chain interactions.
- **Contract execution** - GNOT functions as the gas token that powers smart contract execution.

**Asset TBD**: [Need voxel illustration of "GNOT in motion" or a circular flow diagram]

---

## #9 - The ecosystem in numbers  ✅

**Status**: Ready - testnet13 data to add when available

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

**Status**: TBD - list to be provided

**Source xls note**: "Need updated list of team and advisors"

**Required per person**: name, role, photo (or voxel avatar), short bio (1-2 lines), socials (X, LinkedIn).

**Suggested split**: Core team / Advisors (2 separate grids).

---

## #11 - Roadmap  ✅

**Status**: Ready

**2021** - Jae Kwon bootstraps Gno Virtual Machine (GnoVM) and Tendermint node. Foundational VM, state persistence, first Boards realm, and functional chain.

**2022** - Test1 to Test3 with improved usability and example realms. GnoVM safety work and initial community workshops.

**2023** - Introduced tools like gnodev, Playground, and GnoChess. Released official docs and Gno Network Public License.

**2024** - Permanent multi-node Test4 (with GovDAO) and Test5 with expanded validators. Major VM fixes, performance upgrades, and stability improvements.

**2025** - Stabilization with Test6 to Test8, GovDAO V3, token mechanics, and major GnoVM upgrades. Governance testing, dev updates, community events, and validator tooling improvements.

**Q1 2026 - Gno.land Beta Mainnet Launch** - Token distribution. Release of functional network and initial operating system.

**Q2 2026 - Expanding the network** - Bridging AtomOne and Gno.land for security and interoperability. Advancing Gno's functionality and features.

**Q3 2026 - Mainnet Launch** - Protocol-level transfers enabled. Fully interoperable, security-hardened network.

**Q4 2026 - Beyond - Ecosystem Growth** - Major focus on building killer apps on Gno.land. Develop tooling.

**Design note**: horizontal scroll-pin timeline. Each year is a "station" with icon + bullet points. Active year highlighted on scroll.

---

## #12 - Ecosystem  ✅

**Status**: Ready - re-use descriptions from newtendermint.org

**Source xls note**: "Use the same description from newtendermint.org"

**Projects** (13 entries):

### Gnoscan
Developed by the Onbloc team, Gnoscan is the official blockchain explorer for Gno.land. Use it to search wallet addresses, transaction hashes, blocks, and contracts, making on-chain data accessible and easy to navigate.

### Adena
An open-source, non-custodial wallet for Gno.land, developed by Onbloc. Built with an emphasis on user experience.

### Gnoswap
The first decentralized exchange (DEX) on Gno.land. An automated market maker (AMM) protocol written in Gno, it enables permissionless token exchanges on the platform.

### Boards
An on-chain forum application built natively on Gno.land. It enables structured, open dialogue and community-driven discussion, free from centralized moderation and external control. Designed to become a flagship social application for the network, Boards offers a decentralized alternative to traditional online forums.

### Akkadia
An on-chain world-building game inspired by the Library of Alexandria. Users can create their own realms to build in their own style, and explore worlds created by others. One of the earliest examples of a fully on-chain creative application on Gno.land.

### Gno Playground
A browser-based environment for writing, testing, and experimenting with Gno code. Share your code, run unit tests, deploy realms and packages, and execute functions directly from the interface with no local setup required.

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

## #13 - Investors  ⚠️ TBD

**Status**: TBD - placeholder, may be removed

**Source xls note**: "If we get investors, list their logos here"

**Decision needed**: Keep section or drop? If kept, need logos + 1-line descriptions per investor.

---

## #14 - Partners  ✅

**Status**: Ready

**Partners**:

### Samourai Coop
A development team focused on DAOs and sustainable, community-powered applications, building the governance and coordination tools that decentralized communities need to thrive.

### Berty
A non-profit NGO specializing in secure, peer-to-peer mobile communication. Berty's work on privacy-first infrastructure aligns closely with Gno.land's mission to build a censorship-resistant internet.

### Onbloc
An engineering team building consumer-facing applications on Gno.land, including Adena Wallet, Gnoswap, and Gnoscan, some of the ecosystem's most used tools today.

### AtomOne
A community-driven, constitutionally governed blockchain designed to prioritize security, decentralization, and innovation within the Cosmos ecosystem. Gno.land plans to integrate with AtomOne for consensus.

**Asset TBD per partner**: logo file (SVG preferred).

---

## #15 - Media  ⚠️ TBD

**Status**: TBD - will populate as campaign progresses

**Source xls**: "News articles, video links"

**Format**: grid of media cards (logo + headline + date + external link). 6-12 entries.

**To collect during launch campaign**: press coverage, podcast appearances, video features.

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
2. **Dates** (#3): registration opens July 1, sale opens July 15, 2026. End date intentionally vague (sale may be extended - REQUIREMENTS A.12.2).
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

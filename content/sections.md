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

## #1 - Header  ✅

**Status**: Ready

**Elements**:
- gno.land logo (top-left, links to `/`)
- Nav links: `Tokenomics`, `How it works`, `Roadmap`, `Docs`
- `Connect Wallet` button
- `Register` button (links to Sonar OAuth flow)

**Behavior**: Sticky on scroll, glassmorph dark background after scroll > 50px.

---

## #2 - Sale Metrics (live data)  ✅

**Status**: Ready (content) - values are pulled live from Sonar API

**Title**: `GNOT Token Sale: The native token for gno.land`

**Live metrics displayed**:
- Total committed (USDC/USDT)
- Percent filled / "Oversubscribed by X" (when applicable)
- Total number of participants
- English auction threshold (current clearing price)
- My auction ranking (if connected wallet has a bid)
- Unlock schedule (link or summary)

**API source**: `GET /v1/sales/{saleUUID}/commitments` (Sonar `read-commitment-data` endpoint, returns total + clearing price + unique count + last 100).

---

## #3 - Token Sale Details  ⚠️ TBD

**Status**: TBD - values need to be confirmed by team

**Source xls note**: "Need token sale details"

**Fields to populate**:

| Field | Value | Status |
|---|---|---|
| Token | GNOT | ✅ |
| Minimum price | [TBD: $X.XX per GNOT] | ⚠️ |
| Total raise | [TBD: starting $2M, expand based on demand] | ⚠️ |
| Min commitment | [TBD: $XXX per entity] | ⚠️ |
| Max commitment | [TBD: $XXX per entity - whale cap] | ⚠️ |
| FDV (when raise met) | [TBD: $XXM Fully Diluted Valuation] | ⚠️ |
| Unlock schedule | [TBD: e.g. cliff X months + linear vest Y months] | ⚠️ |
| Allocation | [TBD: X% of total token supply for this sale] | ⚠️ |
| Contribution window | [TBD: Late May - Early June 2026, exact dates] | ⚠️ |
| Accepted currencies | USDC, USDT (on Base) | ✅ tentative |
| Mainnet launch | Q1 2026 Beta · Q3 2026 Mainnet (transferable) | ✅ from roadmap |
| Auction format | Uniform Price Auction (English Auction) | ✅ |

---

## #4 - Transparency Report  ⚠️ TBD

**Status**: TBD - needs tokenomics finalized + legal/audit PDFs

**Source xls note**: "Need final tokenomics. Need links to legal structure and audit. See https://cdn.fluent.xyz/docs/token-disclosure.pdf"

**Elements**:
- **Tokenomics pie chart**: [TBD: allocation breakdown - sale %, team %, ecosystem %, treasury %, advisors %, etc.]
- **Legal structure**: [TBD: link to legal disclosure PDF - see Fluent's as reference]
- **Audit details**: [TBD: link to audit report PDF]

**Design note**: 3 cards side-by-side, each with icon + title + link. The pie chart card has a small inline preview (Recharts or vanilla SVG).

---

## #5 - How the Sale Works  ⚠️ TBD

**Status**: Text needs to be written - only "Steps to participate in token sale" was provided

**Source xls note**: "Need more info"

**Proposed 5-step copy** (to be reviewed):

1. **Connect your wallet** - MetaMask, Coinbase Wallet, WalletConnect or Rainbow. We use wagmi standard, any EVM wallet on Base works.
2. **Verify with Sonar (one-click for existing users)** - Sonar handles KYC/KYB. ~100k users already verified can participate in one click. New users complete identity verification (typical: 5-15 min).
3. **Place your bid in USDC on Base** - Set the maximum price you are willing to pay and the commitment amount. Bids can be increased during the sale, never reduced.
4. **Wait for the auction to close** - A single clearing price is determined when the sale ends. Everyone who bid at or above the clearing price pays the same final price. Excess USDC is refunded automatically on Base.
5. **Receive GNOT post-mainnet** - GNOT tokens are distributed after the gno.land mainnet launch (Q3 2026) via the gno.land to Base IBC bridge, per the unlock schedule. Distribution mechanism (direct per-bidder vs aggregated) is being finalized by the team.

**Validation required**: confirm dates, refund timing. Distribution mechanism is an open internal question (direct IBC per user vs aggregate-then-distribute via a Base account); the copy stays vague until the decision is made.

---

## #6 - The Open Knowledge Base for the New Millennium  ✅

**Status**: Ready

**Body**:

> Gno.land is a next-generation Layer 1 smart contract platform based on Gno, a deterministic, interpreted version of the Go programming language. Founded by Jae Kwon, co-founder of Cosmos and Tendermint, Gno.land represents a paradigm shift in multi-user programming. Our technology empowers developer communities to iteratively and interactively build a single shared program, enabling Gno.land to serve as the "GitHub" of the blockchain ecosystem.
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

**2022** - Test1 to Test3 with improved usability and example realms. GnoVM safety, initial community workshops.

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

1. **Token economics** (#3): min price, raise target, commitment limits, FDV, unlock schedule, allocation %
2. **Dates** (#3): exact sale start + end timestamps
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

# Contributing

## Branches

Two long-lived branches, neither is ever deleted:

- **`main`** - production (Sonar prod, Ethereum mainnet). Protected: changes land only via a pull request with green CI and signed commits, no direct pushes, no force-push, no deletion. The rules apply to everyone, admins included.
- **`staging`** - integration / test branch. Deploys continuously to the sandbox (Sonar test sale, Sepolia). Protected against force-push and deletion; commits must be signed. Direct pushes are allowed so day-to-day stays fast, but opening a PR into `staging` is recommended - you get CI plus a deploy-preview.

## Flow

**Working on `staging`** (integration + sandbox)
- Recommended: branch off `staging`, push it, and open a PR into `staging`. CI `validate` runs and you get a Netlify deploy-preview on the sandbox (Sepolia), so you see the change live before it lands. Self-merge when green (no second approval needed for now), then delete the branch.
- Quick fixes: pushing directly to `staging` is allowed (it also deploys to the sandbox, but skips the CI gate and the per-PR preview).

**Releasing to production**
- Open a pull request from `staging` to `main`:
  ```
  gh pr create --base main --head staging
  ```
- CI `validate` must be green (lint, typecheck, tests, build, secret scan, prod-dependency audit). Never merge a red PR.
- Merge on GitHub. That is the deliberate, manual promotion to production; `main` then deploys to `sale.gno.land` (Ethereum mainnet).

## Commits

- One logical change per commit.
- Conventional prefixes: `feat:`, `fix:`, `chore:`, `test:`, `design:`.

## Setup

See the [README](./README.md) for environment variables, local setup, and the common commands.

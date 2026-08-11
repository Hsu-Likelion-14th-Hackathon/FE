# Vercel Personal Mirror Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify `Hsu-Likelion-14th-Hackathon/FE:develop`, synchronize its tracked source into `khy1121/HACKATHON_FE:develop`, and let Vercel deploy the personal repository.

**Architecture:** One Organization-repository workflow uses separate GitHub-hosted runners for verification and synchronization. The verification job records and checks the source commit; only after it passes does a fresh synchronization job check out that exact SHA and receive the target-scoped token. The snapshot contains tracked source files except `.github` and is authored as `khy1121`.

**Tech Stack:** GitHub Actions, Bash, Git, Node.js 22.12.0, npm, Vercel Git integration

## Global Constraints

- Source is `Hsu-Likelion-14th-Hackathon/FE`, branch `develop`.
- Target is `khy1121/HACKATHON_FE`, branch `develop`.
- Do not add third-party synchronization actions or new npm dependencies.
- Pin official GitHub Actions to full commit SHAs.
- Never expose the personal token to repository-controlled npm scripts or embed it in a clone URL.
- Do not copy `.github` into the personal repository.
- Treat the personal repository as generated output; synchronization replaces manual target changes.
- Require `PERSONAL_REPO_TOKEN` with target-only `Contents: Read and write` and `PERSONAL_GIT_EMAIL` mapped to `khy1121`.
- Keep documentation uncommitted, following the user's existing repository preference.

---

### Task 1: Add the verified develop synchronization workflow

**Files:**
- Create: `.github/workflows/sync-develop.yml`
- Test: `.github/workflows/sync-develop.yml` with Prettier and the repository verification script

**Interfaces:**
- Consumes: `PERSONAL_REPO_TOKEN`, `PERSONAL_GIT_EMAIL`, `package-lock.json`, and `npm run verify`
- Produces: a `develop` snapshot commit in `khy1121/HACKATHON_FE`

- [x] **Step 1: Confirm the workflow does not already exist**

Run:

```powershell
Test-Path .github\workflows\sync-develop.yml
```

Expected: `False`.

- [x] **Step 2: Create the minimum workflow**

Create `.github/workflows/sync-develop.yml` with:

```yaml
name: Sync develop to personal repository

on:
  push:
    branches:
      - develop
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: sync-develop-to-personal
  cancel-in-progress: true

jobs:
  verify:
    if: github.repository == 'Hsu-Likelion-14th-Hackathon/FE'
    runs-on: ubuntu-latest
    timeout-minutes: 15
    outputs:
      source_sha: ${{ steps.source.outputs.sha }}

    steps:
      - name: Checkout organization develop
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          ref: develop
          path: source
          persist-credentials: false

      - name: Record source commit
        id: source
        working-directory: source
        shell: bash
        run: echo "sha=$(git rev-parse HEAD)" >> "$GITHUB_OUTPUT"

      - name: Set up Node.js
        uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6.5.0
        with:
          node-version: 22.12.0
          cache: npm
          cache-dependency-path: source/package-lock.json

      - name: Install dependencies
        working-directory: source
        run: npm ci

      - name: Verify source
        working-directory: source
        run: npm run verify

  sync:
    if: github.repository == 'Hsu-Likelion-14th-Hackathon/FE'
    needs: verify
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - name: Checkout verified source
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          ref: ${{ needs.verify.outputs.source_sha }}
          path: source
          persist-credentials: false

      - name: Sync personal repository
        shell: bash
        env:
          PERSONAL_GIT_EMAIL: ${{ secrets.PERSONAL_GIT_EMAIL }}
          PERSONAL_REPO_TOKEN: ${{ secrets.PERSONAL_REPO_TOKEN }}
        run: |
          set -euo pipefail

          if [[ -z "$PERSONAL_REPO_TOKEN" || -z "$PERSONAL_GIT_EMAIL" ]]; then
            echo "::error::PERSONAL_REPO_TOKEN and PERSONAL_GIT_EMAIL are required"
            exit 1
          fi

          askpass="$(mktemp)"
          trap 'rm -f "$askpass"' EXIT
          cat > "$askpass" <<'EOF'
          #!/usr/bin/env bash
          case "$1" in
            *Username*) printf '%s\n' 'x-access-token' ;;
            *Password*) printf '%s\n' "$PERSONAL_REPO_TOKEN" ;;
          esac
          EOF
          chmod 700 "$askpass"
          export GIT_ASKPASS="$askpass"
          export GIT_TERMINAL_PROMPT=0

          git clone --quiet "https://github.com/khy1121/HACKATHON_FE.git" target
          cd target

          if git show-ref --verify --quiet refs/heads/develop; then
            git switch develop
          elif git show-ref --verify --quiet refs/remotes/origin/develop; then
            git switch --create develop --track origin/develop
          else
            git switch --orphan develop
          fi

          git fetch --quiet --no-tags --update-shallow ../source HEAD
          git read-tree FETCH_HEAD
          git rm -r --cached --force --ignore-unmatch -- .github

          if git rev-parse --verify HEAD >/dev/null 2>&1 &&
            git diff --cached --quiet; then
            echo "Personal repository is already up to date"
            exit 0
          fi

          source_sha="$(git -C ../source rev-parse HEAD)"
          git config user.name "khy1121"
          git config user.email "$PERSONAL_GIT_EMAIL"
          git commit --allow-empty --message "chore: sync organization develop (${source_sha:0:7})"
          git push origin develop
```

- [x] **Step 3: Verify YAML parsing and formatting**

Run:

```powershell
npx.cmd prettier --check .github/workflows/sync-develop.yml
```

Expected: `Checking formatting...` followed by success.

- [x] **Step 4: Verify the repository**

Run:

```powershell
npm.cmd run verify
```

Expected: ESLint, Prettier, Vitest, and Vite build all exit with code `0`.

- [x] **Step 5: Review the isolated diff**

Run:

```powershell
git diff --no-index --check -- NUL .github/workflows/sync-develop.yml
Get-Content .github/workflows/sync-develop.yml
git status --short -- .github
```

Expected: the no-index diff reports no whitespace diagnostics (exit `1` only because the new file differs from `NUL`); the only implementation file is `.github/workflows/sync-develop.yml`, and no secret value is present.

- [ ] **Step 6: Complete external setup after the workflow is pushed**

In `Hsu-Likelion-14th-Hackathon/FE` Actions secrets, add:

```text
PERSONAL_REPO_TOKEN=<fine-grained token scoped to khy1121/HACKATHON_FE>
PERSONAL_GIT_EMAIL=<verified khy1121 GitHub email or noreply email>
```

Connect `khy1121/HACKATHON_FE` to Vercel and set its Production Branch to `develop`. Manually run the workflow once, then confirm the personal `develop` branch and Vercel deployment were created.

- [x] **Step 7: Leave changes uncommitted**

Do not create a Git commit until the user explicitly requests one. Report the workflow file, verification results, and the two required secrets.

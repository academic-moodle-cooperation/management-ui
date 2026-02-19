# Create the real registry repo from this folder

This folder contains the **exact contents** to put in your new GitHub registry repository.

## Steps

1. **Create a new GitHub repository** (e.g. `management-ui-registry` or `eduardklinger/management-ui-registry`). Do not add a README, .gitignore, or license in the UI (we have them here).

2. **Copy everything from this folder to the root of the new repo** (not the folder itself). So the new repo root should have:
   - `README.md`
   - `registry.json`
   - `validate-registry.js`
   - `LICENSE`
   - `.github/workflows/validate.yml`

3. **Commit and push:**
   ```bash
   cd /path/to/your/new-registry-repo
   # Copy files from docs/registry-repo-contents/ into this repo root
   git add .
   git commit -m "Initial registry"
   git push -u origin main
   ```

4. **Point the Management UI at it:** The default registry URL in the codebase is:
   `https://raw.githubusercontent.com/eduardklinger/management-ui-registry/main/registry.json`
   If you use a different org/repo or branch, update `DEFAULT_COMMUNITY_REGISTRY` in `plugins/admin-marketplace/src/services/registry-fetcher.ts`.

5. **Add plugins:** Edit `registry.json` (add entries to the `plugins` array), open a PR. The GitHub Action will validate JSON and optional URL checks.

You can delete this `README_FIRST.md` after copying; it is only for the monorepo template.

---
paths:
    - 'package.json'
    - 'package-lock.json'
---

# Dependency upgrades

- Make one upgrade per branch, so a breakage points at one package.
- Before bumping, check the package's peer dependencies against what is installed, and read its migration guide for every major version crossed.
- A bump makes its version-pinned `allowScripts` entry stale. Re-approve it with `npm install-scripts approve <pkg>` ([Install scripts check](../../docs/ci-cd.md#1-vitest-unit-tests)).
- #321 (ESLint 10) is held: eslint-plugin-react's peer range caps at ESLint 9. Do not force it. eslint-plugin-cypress 7.x moves with it.

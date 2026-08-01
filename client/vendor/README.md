# ShakiLabs UI artifact

`shakilabs-ui-0.3.11.tgz` is the active exact artifact for `@shakilabs/ui` 0.3.11.

- Source repository: `00.root-shakilabs`
- Source commit: `657cf80b72ef4a977b7b34e765b8ddb4ce9fbef7`
- SHA-256: `2c9587d9fd74af697f0a95bc50e39bccf169fb48dcebf37afe5991926b713b54`
- Rollback artifacts: available from Git history when needed

Only the active exact artifact is committed so an isolated Vercel checkout can run `npm ci` without a private registry token.

## Verifying

```sh
shasum -a 256 client/vendor/shakilabs-ui-0.3.11.tgz
```

The digest above, the tgz filename, and the `file:vendor/...` reference in `client/package.json`
must all agree. CI enforces this on every push via `npm run verify:supply-chain`
(`client/scripts/verify-vendor-artifacts.mjs`), so this file is a supply-chain record, not a changelog —
update it in the same commit that swaps the tgz.

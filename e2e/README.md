# E2E Tests

## Setup (one-time)

```bash
npm install --save-dev @playwright/test
npx playwright install        # downloads browser binaries (~250MB)
```

## Run

```bash
npm run e2e          # headless run
npm run e2e:headed   # with browser visible
npm run e2e:ui       # interactive runner
```

## Test plan

Five happy-path specs to add, one per role. Each assumes a seeded dev backend
with deterministic credentials (env vars `E2E_TENANT_EMAIL`, etc.).

- `smoke.spec.js`        — app boots, welcome screen renders
- `tenant.spec.js`       — login → dashboard → pay rent (mock UPI)
- `owner.spec.js`        — login → portfolio → approve invoice
- `provider.spec.js`     — login → jobs → submit work report
- `manager.spec.js`      — login → finance → process split
- `super-admin.spec.js`  — login → users → create manager

## CI

In GitHub Actions:
```yaml
- run: npm ci
- run: npx playwright install --with-deps
- run: npm run build
- run: npm run e2e
  env:
    E2E_BASE_URL: http://localhost:5173
```

# Contributing

## Development Setup

```bash
git clone https://github.com/riripatate/schoology-api
cd schoology-api
pnpm install
npx playwright install chromium
```

## Running Tests

```bash
pnpm test          # all packages
pnpm typecheck     # typecheck all
```

## Integration Testing

To run against a real Schoology instance:

```bash
# Create .env.local (gitignored) with your credentials:
# SCHOOLOGY_USERNAME=...
# SCHOOLOGY_PASSWORD=...
# SCHOOLOGY_DOMAIN=yourschool.schoology.com
pnpm exec dotenv-cli -e .env.local -- pnpm exec tsx scripts/integration-test.ts
```

## Releasing

1. Bump versions in both `packages/*/package.json`
2. `git tag v0.x.0 && git push --tags`
3. GitHub Actions publishes to npm automatically

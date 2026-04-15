import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'forks',
    server: {
      deps: {
        external: ['zod', '@modelcontextprotocol/sdk', '@schoology/client'],
      },
    },
  },
})

import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@schoology/client': resolve(__dirname, '../client/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    pool: 'forks',
  },
})

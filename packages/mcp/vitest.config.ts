import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@schoologymcp/client': resolve(__dirname, '../client/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    pool: 'forks',
  },
})

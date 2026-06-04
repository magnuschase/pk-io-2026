import path from 'node:path'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/lib/**', 'src/api/**', 'src/store/**', 'src/features/**', 'src/hooks/**'],
        exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/test/**'],
      },
    },
  }),
)

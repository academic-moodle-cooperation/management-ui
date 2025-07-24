import { defineConfig, loadEnv } from 'vite'
import { createShellAppViteConfig } from '@workspace/vite-config'

const packageName = process.env.npm_package_name || 'management-ui-core'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') // Load all env variables

  return createShellAppViteConfig({
    packageName,
    mode,
    env,
    invokerDir: __dirname, // Pass the directory of the current vite.config.ts
  })
})

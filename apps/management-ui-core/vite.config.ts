import { defineConfig, loadEnv } from 'vite'
import { createShellAppViteConfig, generateConfigPlugin } from '@workspace/vite-config'
import { defaultConfig } from '../../packages/ui-config/src/index'

const packageName = process.env.npm_package_name || 'management-ui-core'

// Import plugin configs directly
import { config as univieConfig } from '../../plugins/univie/implementations/config/config'
import { config as tuwienConfig } from '../../plugins/tuwien/implementations/config/config'

/**
 * EXPLICIT PLUGIN CONFIG ORDER
 * 
 * This array defines which organization's configuration is active.
 * The order matters - later configs override earlier ones.
 * 
 * To switch organizations:
 * 1. Comment out the current active config
 * 2. Uncomment the desired organization's config
 * 
 * This same order is used in both dev and production modes for consistency.
 */
const PLUGIN_CONFIGS = [
  // tuwienConfig,  // TU Wien configuration (commented out)
  univieConfig,     // University of Vienna configuration (ACTIVE)
]

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') // Load all env variables

  const baseConfig = createShellAppViteConfig({
    packageName,
    mode,
    env,
    invokerDir: __dirname, // Pass the directory of the current vite.config.ts
  })

  // Add config generation plugin in production mode
  // This ensures the same merge order is used in both dev and prod
  if (mode === 'production') {
    baseConfig.plugins = baseConfig.plugins || []
    baseConfig.plugins.push(
      generateConfigPlugin({
        defaultConfig,
        pluginConfigs: PLUGIN_CONFIGS  // Use the explicit ordered list
      })
    )
  }

  return baseConfig
})

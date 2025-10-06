import { defineConfig, loadEnv } from 'vite';
import { createShellAppViteConfig } from '@workspace/vite-config';

const packageName = process.env.npm_package_name || 'management-ui-episodes';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return createShellAppViteConfig({
    packageName,
    mode,
    env,
    invokerDir: __dirname,
  });
}); 
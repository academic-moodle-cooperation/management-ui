/**
 * @deprecated Since 1.2.0 — this config is a no-op and will be removed in the
 * next major. It used to load `@tailwindcss/postcss`, pinned to a 2024 alpha
 * (`0.0.0-oxide.4`). Vite picks a `postcss.config.*` up automatically, so that
 * alpha ran *in addition to* the real `@tailwindcss/vite` plugin and rewrote
 * the compiled sheet's `@layer` statements: the `plugins` layer declared last
 * in `src/styles/globals.css` ended up *below* `base`, and Tailwind's preflight
 * reset beat every utility a remote plugin's stylesheet contributed.
 *
 * Tailwind is wired through `@tailwindcss/vite` (see
 * `@oc-mui/vite-config`); no PostCSS config is needed. Hosts that still import
 * this file get an empty plugin list instead of the broken alpha.
 *
 * @type {import('postcss-load-config').Config}
 */
const config = {
  plugins: {},
};

export default config;

import { defineConfig } from "vitepress";

const REPO_URL = "https://github.com/academic-moodle-cooperation/management-tool";
const REPO_BLOB = `${REPO_URL}/blob/HEAD`;

// Files under docs/ that should NOT be built into the public site.
// They stay in the repo (linked from GitHub), but they aren't doc-site pages.
const srcExclude = [
  // README at section roots: VitePress would render it as a generated index; we
  // use index.md instead so the URL stays at /<section>/ (not /<section>/readme).
  "README.md",
  "plugins/README.md",

  // Internal tracking docs — useful to contributors, not public pages.
  "operations/open-followups.md",
  "operations/shadcn-typescript-errors.md",

  // Maven build-time config that lives under docs/ for legacy parent-POM
  // reasons. Not documentation. See open-followups.md §8.5.
  "checkstyle/**",

  // Local-only archive directory (gitignored). Owners may stash arbitrary
  // notes here; we don't want VitePress trying to compile them as pages,
  // and they'd 404 on the public site anyway because git doesn't ship them.
  "archive/**",
];

// Base path defaults to the AMC public URL
// (https://academic-moodle-cooperation.github.io/management-tool/). Override
// via `DOCS_BASE=/<repo-name>/` in the build environment when deploying to a
// different GitHub Pages target.
const DOCS_BASE = process.env.DOCS_BASE ?? "/management-tool/";

export default defineConfig({
  title: "Management UI",
  description: "A modular, plugin-first admin interface for Opencast.",
  base: DOCS_BASE,
  cleanUrls: true,
  lastUpdated: true,
  srcExclude,

  // Pre-1.0 — the site is built but not publicly announced. Tell search
  // engines not to index any page. Belt-and-suspenders with
  // docs/public/robots.txt; remove both when going public (tracked in
  // docs/operations/open-followups.md §8.3).
  head: [["meta", { name: "robots", content: "noindex, nofollow" }]],

  // We link to source files (../packages/..., ../apps/..., etc.) from inside
  // docs/. Those targets aren't built into the site, so the link checker would
  // false-positive on every one. We rewrite them to GitHub permalinks in the
  // markdown transformer below — keep this off to silence the surviving cases.
  ignoreDeadLinks: true,

  markdown: {
    // Rewrite cross-repo links to GitHub permalinks at build time.
    // Inside docs/, links like (../packages/foo/src/bar.ts) point outside the
    // site tree. For the published HTML, send them to GitHub instead.
    config(md) {
      const defaultRender =
        md.renderer.rules.link_open ??
        ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
      md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const hrefIndex = token.attrIndex("href");
        if (hrefIndex >= 0) {
          const href = token.attrs![hrefIndex][1];
          const rewritten = rewriteRepoLink(href);
          if (rewritten !== href) {
            token.attrs![hrefIndex][1] = rewritten;
            // External links open in a new tab for clarity.
            token.attrSet("target", "_blank");
            token.attrSet("rel", "noopener noreferrer");
          }
        }
        return defaultRender(tokens, idx, options, env, self);
      };
    },
  },

  themeConfig: {
    siteTitle: "Management UI",

    nav: [
      { text: "Get started", link: "/getting-started/what-is-management-ui" },
      { text: "Plugins", link: "/plugins/creating-a-plugin" },
      { text: "Architecture", link: "/architecture/overview" },
      { text: "Operations", link: "/operations/release" },
      {
        text: "GitHub",
        items: [
          { text: "Repository", link: REPO_URL },
          { text: "Issues", link: `${REPO_URL}/issues` },
          { text: "Discussions", link: `${REPO_URL}/discussions` },
          { text: "Releases", link: `${REPO_URL}/releases` },
        ],
      },
    ],

    sidebar: {
      "/getting-started/": [
        {
          text: "Getting started",
          items: [
            { text: "What is Management UI?", link: "/getting-started/what-is-management-ui" },
            { text: "Installation", link: "/getting-started/installation" },
            { text: "Configuration", link: "/getting-started/configuration" },
            { text: "Upgrading", link: "/getting-started/upgrading" },
          ],
        },
      ],

      "/plugins/": [
        {
          text: "Plugins",
          items: [
            { text: "Your first plugin", link: "/plugins/first-plugin" },
            { text: "Creating a plugin", link: "/plugins/creating-a-plugin" },
            { text: "Distribution", link: "/plugins/distribution" },
            { text: "Styling", link: "/plugins/styling" },
            { text: "i18n", link: "/plugins/i18n" },
            { text: "Testing", link: "/plugins/testing" },
          ],
        },
      ],

      "/architecture/": [
        {
          text: "Architecture",
          items: [
            { text: "Overview", link: "/architecture/overview" },
            { text: "Contracts", link: "/architecture/CONTRACTS" },
            { text: "Configuration", link: "/architecture/CONFIGURATION" },
          ],
        },
        {
          text: "Decisions",
          collapsed: false,
          items: [
            {
              text: "001 — Plugin system",
              link: "/architecture/decisions/001-plugin-system",
            },
            {
              text: "002 — Monorepo structure",
              link: "/architecture/decisions/002-monorepo-structure",
            },
            {
              text: "003 — Shell + core plugins",
              link: "/architecture/decisions/003-shell-plus-core-plugins",
            },
          ],
        },
      ],

      "/operations/": [
        {
          text: "Operations",
          items: [
            { text: "Release & versioning", link: "/operations/release" },
            { text: "Release test protocol", link: "/operations/test-protocol" },
            { text: "Extending the workspace", link: "/operations/extending-the-workspace" },
            { text: "CI", link: "/operations/ci" },
            { text: "Testing", link: "/operations/testing" },
          ],
        },
      ],

      "/reference/": [
        {
          text: "Reference",
          items: [{ text: "Favicon configuration", link: "/reference/favicon-configuration" }],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: REPO_URL }],

    editLink: {
      pattern: `${REPO_BLOB}/docs/:path`,
      text: "Edit this page on GitHub",
    },

    search: {
      provider: "local",
    },

    outline: {
      level: [2, 3],
    },

    footer: {
      message: "Released under the ECL 2.0 License.",
      copyright: "Documentation built with VitePress.",
    },
  },
});

// ---------------------------------------------------------------------------
// Cross-repo link rewriting
// ---------------------------------------------------------------------------

// First segment of a path that, after stripping leading "../", indicates the
// link still resolves *inside* docs/. Anything else is repo-external and gets
// rewritten to a GitHub permalink.
const DOCS_SUBDIRS = new Set([
  "architecture",
  "getting-started",
  "operations",
  "plugins",
  "reference",
  "workflows",
]);

/**
 * Rewrite repo-internal links (../packages/..., ../apps/..., ../AGENTS.md, …)
 * to GitHub permalinks on the published site. The docs use relative paths so
 * GitHub renders them correctly; in the built HTML those paths don't exist as
 * pages, so we send the reader to GitHub instead.
 *
 * Leaves intact:
 * - Same-section relative links (./foo, ../architecture/foo, …) that resolve
 *   to another docs/ page — VitePress turns those into real site links.
 * - Absolute paths (/architecture/foo) — already site-internal.
 * - Anchors (#section) and external URLs (http(s)://, mailto:).
 */
function rewriteRepoLink(href: string): string {
  if (!href) return href;
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("#") ||
    href.startsWith("/")
  ) {
    return href;
  }

  // Only ../ paths are candidates for "outside docs/". Same-dir (./foo,
  // bare-name) links stay inside the section.
  if (!href.startsWith("../")) return href;

  // Strip leading "../" segments.
  let path = href;
  while (path.startsWith("../")) path = path.slice(3);

  // If what's left starts with a known docs subdirectory, this link still
  // resolves inside the site — leave it alone for VitePress to handle.
  const firstSegment = path.split(/[/#]/)[0] ?? "";
  if (DOCS_SUBDIRS.has(firstSegment)) return href;

  // Otherwise it points outside docs/ — send the reader to GitHub.
  path = path.replace(/\/$/, "");
  if (!path) return REPO_URL;
  return `${REPO_BLOB}/${path}`;
}

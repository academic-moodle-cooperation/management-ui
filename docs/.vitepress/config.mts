import { posix } from "node:path";
import { defineConfig } from "vitepress";

const REPO_URL = "https://github.com/academic-moodle-cooperation/management-ui";
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

  // Maven build-time config that lives under docs/ for legacy parent-POM
  // reasons. Not documentation. See open-followups.md §8.5.
  "checkstyle/**",

  // Local-only archive directory (gitignored). Owners may stash arbitrary
  // notes here; we don't want VitePress trying to compile them as pages,
  // and they'd 404 on the public site anyway because git doesn't ship them.
  "archive/**",
];

// Base path defaults to the AMC public URL
// (https://academic-moodle-cooperation.github.io/management-ui/). Override
// via `DOCS_BASE=/<repo-name>/` in the build environment when deploying to a
// different GitHub Pages target.
const DOCS_BASE = process.env.DOCS_BASE ?? "/management-ui/";

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

  // Fail the build on dead internal links. Links to source files
  // (../packages/..., ../apps/..., etc.) are rewritten to GitHub permalinks by
  // the markdown transformer below, so they don't false-positive; anything the
  // checker still flags is a genuinely broken link that must be fixed.
  ignoreDeadLinks: false,

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
          const rewritten = rewriteRepoLink(
            href,
            (env as { relativePath?: string }).relativePath,
          );
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
      { text: "Quickstart", link: "/quickstart" },
      { text: "Use", link: "/use/" },
      { text: "Operate", link: "/operate/" },
      { text: "Extend", link: "/extend/" },
      { text: "Contribute", link: "/contribute/" },
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

    sidebar: sidebar(),

    socialLinks: [{ icon: "github", link: REPO_URL }],

    editLink: {
      // edit/develop (not blob/HEAD): opens GitHub's editor directly on the
      // PR-target branch, saving the blob-view click.
      pattern: `${REPO_URL}/edit/develop/docs/:path`,
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
// Sidebar
// ---------------------------------------------------------------------------

/**
 * One sidebar per role entry. The site is organised by *who is reading*, not
 * by topic: Use / Operate / Extend / Contribute each get their own tree so a
 * reader never has to scroll past four other audiences to find their task.
 * Cross-role navigation is the top nav bar, not the sidebar.
 *
 * Every section starts with the same "Start here" group, so a reader who
 * landed deep (search, a shared link) can always get back to the map.
 */
function sidebar() {
  const startHere = {
    text: "Start here",
    items: [
      { text: "What is Management UI?", link: "/what-is-management-ui" },
      { text: "Quickstart", link: "/quickstart" },
    ],
  };

  const section = (
    text: string,
    tasks: { text: string; link: string }[],
    lookup: { text: string; link: string }[],
  ) => [
    startHere,
    { text, items: tasks },
    { text: "Look it up", items: lookup },
  ];

  return {
    "/use/": section(
      "Use it",
      [
        { text: "Using the interface", link: "/use/" },
        { text: "The interface in five minutes", link: "/use/tour" },
        { text: "Find a video", link: "/use/find-a-video" },
        { text: "Edit metadata", link: "/use/edit-metadata" },
        { text: "Upload a video", link: "/use/upload" },
        { text: "Work with series", link: "/use/series" },
        { text: "Delete a video", link: "/use/delete-a-video" },
      ],
      [
        { text: "Status reference", link: "/use/status-reference" },
        { text: "Field reference", link: "/use/field-reference" },
      ],
    ),

    "/operate/": section(
      "Run it",
      [
        { text: "Operating a deployment", link: "/operate/" },
        { text: "Install", link: "/operate/install" },
        { text: "Configure", link: "/operate/configure" },
        { text: "Backend configuration", link: "/operate/backend-config" },
        { text: "Upgrade", link: "/operate/upgrade" },
      ],
      [{ text: "Troubleshooting", link: "/operate/troubleshooting" }],
    ),

    "/extend/": section(
      "Extend it",
      [
        { text: "Extending the UI", link: "/extend/" },
        { text: "Your first plugin", link: "/extend/first-plugin" },
        { text: "Building a plugin", link: "/extend/plugin-guide" },
        { text: "Styling", link: "/extend/styling" },
        { text: "Translations", link: "/extend/i18n" },
        { text: "Testing a plugin", link: "/extend/testing" },
        { text: "Add a GraphQL field", link: "/extend/graphql-field" },
      ],
      [
        { text: "Backend bundles", link: "/extend/backend-bundles" },
        { text: "Distribution", link: "/extend/distribution" },
      ],
    ),

    "/contribute/": section(
      "Contribute",
      [
        { text: "Contributing", link: "/contribute/" },
        { text: "Set up the repo", link: "/contribute/setup" },
        { text: "Your first pull request", link: "/contribute/first-pr" },
      ],
      [
        { text: "Full local setup", link: "/contribute/local-backend" },
        { text: "Testing", link: "/contribute/testing" },
        { text: "CI", link: "/contribute/ci" },
        { text: "Releases", link: "/contribute/release" },
      ],
    ),

    // Root-level pages (quickstart, what-is-…): show the map of all five
    // entries so the first click after the landing page is an informed one.
    "/": [
      startHere,
      {
        text: "Entries",
        items: [
          { text: "Use it", link: "/use/" },
          { text: "Run it", link: "/operate/" },
          { text: "Extend it", link: "/extend/" },
          { text: "Contribute", link: "/contribute/" },
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Cross-repo link rewriting
// ---------------------------------------------------------------------------

/**
 * Rewrite repo-internal links (../packages/..., ../apps/..., ../AGENTS.md, …)
 * to GitHub permalinks on the published site. The docs use relative paths so
 * GitHub renders them correctly; in the built HTML those paths don't exist as
 * pages, so we send the reader to GitHub instead.
 *
 * The decision is made by resolving the link against the linking file's
 * location (`relativePath`, relative to docs/): if the target resolves to a
 * path outside docs/, it gets a GitHub permalink. Guessing from the first
 * path segment alone would be ambiguous — "plugins" can mean docs/plugins/
 * (a site section) or the repo-root plugins/ directory (source code).
 *
 * Leaves intact:
 * - Same-section relative links (./foo, ../architecture/foo, …) that resolve
 *   to another docs/ page — VitePress turns those into real site links.
 * - Absolute paths (/architecture/foo) — already site-internal.
 * - Anchors (#section) and external URLs (http(s)://, mailto:).
 */
function rewriteRepoLink(href: string, relativePath?: string): string {
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

  // Resolve against the linking file's directory ("." for docs-root pages).
  const fromDir = relativePath ? posix.dirname(relativePath) : ".";
  let path = posix.join(fromDir, href);

  // Still inside docs/ after resolution — leave it for VitePress to handle.
  if (!path.startsWith("../")) return href;

  // It points outside docs/ — strip the "../" prefix that steps out of docs/
  // (the remainder is a repo-root path) and send the reader to GitHub.
  while (path.startsWith("../")) path = path.slice(3);
  path = path.replace(/\/$/, "");
  if (!path) return REPO_URL;
  return `${REPO_BLOB}/${path}`;
}

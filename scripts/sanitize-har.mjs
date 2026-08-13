#!/usr/bin/env node
/**
 * Sanitize a browser HAR recording so it can be committed, shared, and replayed.
 *
 * A raw HAR captured during a manual test run is a credential: it contains the
 * tester's session cookies, CSRF tokens, and whatever personal data the backend
 * returned. This script turns it into a fixture:
 *
 *   1. drops third-party entries (analytics, gravatar, fonts, …)
 *   2. strips auth headers + cookies from requests and responses
 *   3. rewrites the recorded origin to a placeholder, so the recording replays
 *      against a local shell regardless of which instance produced it
 *   4. redacts personal data in JSON response bodies (emails and the values of
 *      known person-ish keys), consistently — the same input maps to the same
 *      placeholder, so relational structure survives
 *   5. re-scans the result and fails loudly if anything credential-shaped is left
 *
 * Usage:
 *   node scripts/sanitize-har.mjs recording.har
 *   node scripts/sanitize-har.mjs recording.har -o tests/har-replay/recordings/episodes.har
 *   node scripts/sanitize-har.mjs recording.har --dry-run
 *
 * See docs/contribute/manual-test-recording.md for the tester-facing workflow.
 */

import { Buffer } from "node:buffer";
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

/** Request/response headers that never survive sanitizing. Matched case-insensitively. */
const HEADER_DENY = [
  "cookie",
  "set-cookie",
  "authorization",
  "proxy-authorization",
  "www-authenticate",
  "x-csrf-token",
  "x-xsrf-token",
  "x-requested-with-token",
  "x-api-key",
  "x-auth-token",
  "x-opencast-auth",
];

/** Anything matching this in a header *name* is dropped too — catches custom auth headers. */
const HEADER_DENY_RE = /(auth|token|secret|session|credential|password|apikey|api-key)/i;

/** Query parameters whose value is replaced with `REDACTED`. */
const QUERY_DENY_RE = /(token|secret|session|password|signature|key|auth)/i;

/**
 * JSON keys whose *values* are replaced with a stable placeholder. Opencast
 * returns presenters/creators/usernames on the event and series queries, which
 * is the bulk of the personal data in a Management UI recording.
 *
 * Applied to **GraphQL responses only** (and `/info/me.json`). Generic keys like
 * `name` also appear in plugin manifests, `config.json` and locale files — none
 * of which are personal data, and all of which the replayed shell reads back. A
 * blanket pass would rename every plugin to "Redacted Person 4" and produce a
 * fixture that boots into nonsense.
 */
const DEFAULT_REDACT_KEYS = [
  "email",
  "mail",
  "emailAddress",
  "username",
  "userName",
  "user",
  "name",
  "displayName",
  "fullName",
  "givenName",
  "familyName",
  "presenter",
  "presenters",
  "creator",
  "creators",
  "contributor",
  "contributors",
  "publisher",
  "rightsHolder",
];

/** Post-sanitize tripwires. A hit here means the output is NOT safe to share. */
const LEFTOVER_CHECKS = [
  { label: "JWT", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./ },
  { label: "Bearer token", re: /\bBearer\s+[A-Za-z0-9._~+/-]{16,}/i },
  { label: "session cookie", re: /\b(JSESSIONID|SESSION|_shibsession[A-Za-z0-9_]*)\s*=/i },
  { label: "password field", re: /"(j_)?password"\s*:/i },
  {
    label: "email address",
    re: /[A-Za-z0-9._%+-]+@(?!example\.invalid)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  },
];

const MIME_IS_TEXT = /^(application\/(json|graphql|javascript|xml)|text\/)/i;

function parseArgs(argv) {
  const opts = {
    input: null,
    out: null,
    origin: "http://127.0.0.1:3000",
    appOrigin: null,
    keepHosts: [],
    redactKeys: [...DEFAULT_REDACT_KEYS],
    keepThirdParty: false,
    dryRun: false,
  };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case "-o":
      case "--out":
        opts.out = next();
        break;
      case "--origin":
        opts.origin = next();
        break;
      case "--app-origin":
        opts.appOrigin = next();
        break;
      case "--keep-host":
        opts.keepHosts.push(...String(next()).split(",").filter(Boolean));
        break;
      case "--redact-key":
        opts.redactKeys.push(...String(next()).split(",").filter(Boolean));
        break;
      case "--keep-third-party":
        opts.keepThirdParty = true;
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "-h":
      case "--help":
        opts.help = true;
        break;
      default:
        rest.push(arg);
    }
  }
  opts.input = rest[0] ?? null;
  return opts;
}

const HELP = `
sanitize-har — turn a manual-test HAR recording into a shareable fixture

  node scripts/sanitize-har.mjs <recording.har> [options]

  -o, --out <file>        output path (default: <input>.sanitized.har)
      --origin <url>      rewrite the recorded origin to this
                          (default http://127.0.0.1:3000 — what the replay tier serves)
      --app-origin <url>  the origin the app was recorded from
                          (default: the most frequent origin in the file)
      --keep-host <h,…>   extra hosts to keep instead of dropping as third-party
      --redact-key <k,…>  extra JSON keys whose values get replaced
      --keep-third-party  keep third-party entries (they are dropped by default)
      --dry-run           report only; write nothing
`;

/** Most frequent origin across entries — that's the app under test. */
function detectAppOrigin(entries) {
  const counts = new Map();
  for (const entry of entries) {
    try {
      const { origin } = new URL(entry.request.url);
      counts.set(origin, (counts.get(origin) ?? 0) + 1);
    } catch {
      /* skip unparsable URLs */
    }
  }
  let best = null;
  let bestCount = 0;
  for (const [origin, count] of counts) {
    if (count > bestCount) {
      best = origin;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Stable placeholder generator: the same input always yields the same output
 * within one run, so `presenter: "Alex Roe"` stays a single person across
 * every entry instead of dissolving into noise.
 */
function makeRedactor() {
  const seen = new Map();
  return {
    counts: { emails: 0, values: 0 },
    /** @param {string} value @param {"email"|"person"} kind */
    map(value, kind) {
      const cacheKey = `${kind}:${value}`;
      let replacement = seen.get(cacheKey);
      if (!replacement) {
        const n = seen.size + 1;
        replacement = kind === "email" ? `user${n}@example.invalid` : `Redacted Person ${n}`;
        seen.set(cacheKey, replacement);
      }
      return replacement;
    },
  };
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

function redactEmails(text, redactor) {
  return text.replace(EMAIL_RE, (match) => {
    redactor.counts.emails++;
    return redactor.map(match, "email");
  });
}

/** Walk a parsed JSON body and replace the values of person-ish keys. */
function redactJson(value, redactKeys, redactor) {
  if (Array.isArray(value)) return value.map((v) => redactJson(v, redactKeys, redactor));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (redactKeys.has(key.toLowerCase()) && typeof val === "string" && val.length > 0) {
        redactor.counts.values++;
        out[key] = val.includes("@") ? redactor.map(val, "email") : redactor.map(val, "person");
      } else if (
        redactKeys.has(key.toLowerCase()) &&
        Array.isArray(val) &&
        val.every((v) => typeof v === "string")
      ) {
        redactor.counts.values += val.length;
        out[key] = val.map((v) => redactor.map(v, v.includes("@") ? "email" : "person"));
      } else {
        out[key] = redactJson(val, redactKeys, redactor);
      }
    }
    return out;
  }
  return value;
}

function sanitizeHeaders(headers, stats, rewrite) {
  if (!Array.isArray(headers)) return [];
  return headers
    .filter((header) => {
      const name = String(header.name ?? "").toLowerCase();
      const deny = HEADER_DENY.includes(name) || HEADER_DENY_RE.test(name);
      if (deny) stats.headersStripped++;
      return !deny;
    })
    .map((header) => ({ ...header, value: rewrite(String(header.value ?? "")) }));
}

function sanitizeQuery(queryString, stats) {
  if (!Array.isArray(queryString)) return [];
  return queryString.map((param) => {
    if (QUERY_DENY_RE.test(String(param.name ?? ""))) {
      stats.queryRedacted++;
      return { ...param, value: "REDACTED" };
    }
    return param;
  });
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.input) {
    console.log(HELP);
    process.exit(opts.input ? 0 : 1);
  }

  const raw = readFileSync(opts.input, "utf-8");
  /** @type {{ log: { entries: any[], pages?: any[] } }} */
  const har = JSON.parse(raw);
  const entries = har.log?.entries ?? [];
  if (entries.length === 0) {
    console.error(`✖ ${opts.input} contains no entries — was "Preserve log" on while recording?`);
    process.exit(1);
  }

  const appOrigin = opts.appOrigin ?? detectAppOrigin(entries);
  if (!appOrigin) {
    console.error("✖ could not determine the app origin; pass --app-origin explicitly");
    process.exit(1);
  }

  const keepHosts = new Set(opts.keepHosts);
  const redactKeys = new Set(opts.redactKeys.map((k) => k.toLowerCase()));
  const redactor = makeRedactor();
  const stats = {
    kept: 0,
    droppedThirdParty: 0,
    headersStripped: 0,
    queryRedacted: 0,
    bodiesRedacted: 0,
  };

  // Every occurrence of the recorded origin becomes the replay origin — in URLs,
  // in header values (Referer/Origin), and inside response bodies.
  const rewrite = (text) =>
    text.includes(appOrigin) ? text.split(appOrigin).join(opts.origin) : text;

  const sanitized = [];
  for (const entry of entries) {
    let url;
    try {
      url = new URL(entry.request.url);
    } catch {
      continue;
    }
    if (url.origin !== appOrigin && !keepHosts.has(url.host) && !opts.keepThirdParty) {
      stats.droppedThirdParty++;
      continue;
    }
    stats.kept++;

    const request = {
      ...entry.request,
      url: rewrite(entry.request.url),
      cookies: [],
      headers: sanitizeHeaders(entry.request.headers, stats, rewrite),
      queryString: sanitizeQuery(entry.request.queryString, stats),
    };
    // POST bodies carry the GraphQL query — keep it, but scrub personal data and
    // never keep a login form post.
    if (request.postData?.text) {
      if (/\bj_password\b|"password"/i.test(request.postData.text)) {
        request.postData = { ...request.postData, text: '{"redacted":"login request"}' };
      } else {
        request.postData = {
          ...request.postData,
          text: redactEmails(rewrite(request.postData.text), redactor),
        };
      }
      if (Array.isArray(request.postData.params)) {
        request.postData.params = request.postData.params.map((p) => ({ ...p, value: "REDACTED" }));
      }
    }

    const response = {
      ...entry.response,
      cookies: [],
      headers: sanitizeHeaders(entry.response.headers, stats, rewrite),
    };
    const content = response.content ?? {};
    // Person-ish keys only carry people in the data endpoints. Everywhere else
    // (`config.json`, `plugins.json`, locale files) they carry structure the
    // replayed shell depends on.
    const carriesPeople = /\/graphql|\/info\/me\.json/.test(url.pathname);
    if (typeof content.text === "string" && MIME_IS_TEXT.test(String(content.mimeType ?? ""))) {
      let text = rewrite(content.text);
      if (carriesPeople && /json/i.test(String(content.mimeType))) {
        try {
          text = JSON.stringify(redactJson(JSON.parse(text), redactKeys, redactor));
        } catch {
          /* not valid JSON despite the mime type — fall through to the regex pass */
        }
      }
      const before = text;
      text = redactEmails(text, redactor);
      if (text !== before || text !== content.text) stats.bodiesRedacted++;
      response.content = { ...content, text, size: Buffer.byteLength(text) };
    }

    // Drop transport metadata that leaks internal topology.
    const rest = { ...entry, request, response };
    delete rest.serverIPAddress;
    delete rest.connection;
    delete rest._initiator;
    sanitized.push(rest);
  }

  har.log.entries = sanitized;
  if (Array.isArray(har.log.pages)) {
    har.log.pages = har.log.pages.map((page) => ({
      ...page,
      title: rewrite(String(page.title ?? "")),
      id: page.id,
    }));
  }
  // Provenance, minus the source hostname — which deployment produced a
  // recording is itself something not to hand around.
  har.log.comment = `sanitized by scripts/sanitize-har.mjs; recorded origin rewritten to ${opts.origin}`;

  const output = JSON.stringify(har, null, 2);

  // Tripwire pass: if any of these still match, the file is not shareable.
  const leftovers = [];
  for (const check of LEFTOVER_CHECKS) {
    const match = check.re.exec(output);
    if (match) leftovers.push(`${check.label}: ${match[0].slice(0, 60)}`);
  }
  // Only meaningful when the origin actually changed — a recording taken from a
  // local instance is already at the replay origin and would trip this trivially.
  if (appOrigin !== opts.origin) {
    try {
      const host = new URL(appOrigin).host;
      if (output.includes(host)) leftovers.push(`original host still present: ${host}`);
    } catch {
      /* appOrigin already validated */
    }
  }

  console.log(`\nsanitize-har — ${basename(opts.input)}`);
  console.log(`  app origin        ${appOrigin} → ${opts.origin}`);
  console.log(`  entries kept      ${stats.kept}`);
  console.log(`  third-party drop  ${stats.droppedThirdParty}`);
  console.log(`  headers stripped  ${stats.headersStripped}`);
  console.log(`  query redacted    ${stats.queryRedacted}`);
  console.log(`  bodies redacted   ${stats.bodiesRedacted}`);
  console.log(`  emails replaced   ${redactor.counts.emails}`);
  console.log(`  values replaced   ${redactor.counts.values}`);

  if (leftovers.length > 0) {
    console.error(`\n✖ NOT SAFE TO SHARE — ${leftovers.length} leftover(s):`);
    for (const leftover of leftovers) console.error(`    ${leftover}`);
    console.error(
      "\n  Re-run with --redact-key for the offending field, or delete the recording.\n" +
        "  Nothing was written.",
    );
    process.exit(1);
  }

  if (opts.dryRun) {
    console.log("\n✓ clean (dry run — nothing written)\n");
    return;
  }

  const outPath = opts.out ?? opts.input.replace(/\.har$/i, "") + ".sanitized.har";
  writeFileSync(outPath, output, "utf-8");
  console.log(`\n✓ clean → ${outPath}\n`);
}

main();

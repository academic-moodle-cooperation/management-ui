// Post-processing for the codegen output — runs as part of `pnpm codegen`.
//
// Two mechanical fixes the generator cannot be configured into:
//
// 1. `useTypeImports: true` incorrectly makes `fetchData` a type import even
//    though it is a function used as a value.
//
// 2. The generated query hooks return `useQuery(...)` without an explicit
//    return annotation. TypeScript then inlines tanstack's return type —
//    `UseQueryResult<NoInfer<TData>, TError>` — into the emitted `.d.ts` and
//    references `NoInfer` as `import("@tanstack/react-query").NoInfer`, which
//    that package does not export from its root. Consumers compile with
//    `skipLibCheck: true`, so the broken reference is swallowed silently and
//    every hook's `data` degrades to `any` (#354). Annotating the return type
//    explicitly keeps tsc from ever naming `NoInfer`. The suspense hooks get
//    the same treatment for symmetry — their emit happens to be clean today,
//    but only as an artifact of tanstack's current overload shapes.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generatedFile = join(__dirname, "gql-generated.ts");

try {
  let content = readFileSync(generatedFile, "utf-8");

  content = content.replace(
    /^import type \{ fetchData \} from ['"]\.\/fetcher['"];?$/m,
    "import { fetchData } from './fetcher';",
  );

  // `) => {\n…return useQuery<…>` → `): UseQueryResult<TData, TError> => {…`
  // TData/TError are the literal generic parameter names in every generated
  // hook. The imports come from the codegen config's `add` plugin.
  const queryHooks = (content.match(/\) => \{\s*\n\s*\n\s*return useQuery</g) ?? []).length;
  content = content.replace(
    /\) => \{(\s*\n\s*\n\s*return useQuery<)/g,
    "): UseQueryResult<TData, TError> => {$1",
  );
  const suspenseHooks = (content.match(/\) => \{\s*\n\s*\n\s*return useSuspenseQuery</g) ?? [])
    .length;
  content = content.replace(
    /\) => \{(\s*\n\s*\n\s*return useSuspenseQuery<)/g,
    "): UseSuspenseQueryResult<TData, TError> => {$1",
  );
  if (queryHooks === 0 || suspenseHooks === 0) {
    // The generator's output shape changed and the annotation no longer
    // lands — fail loudly rather than silently reintroducing #354.
    console.error(
      `❌ Return-annotation patterns matched ${queryHooks} query / ${suspenseHooks} suspense hooks — expected both > 0. Adjust fix-fetcher-import.mjs to the new codegen output.`,
    );
    process.exit(1);
  }

  writeFileSync(generatedFile, content, "utf-8");
  console.log(
    `✅ Post-processed gql-generated.ts (fetchData import; ${queryHooks} query + ${suspenseHooks} suspense hooks annotated)`,
  );
} catch (error) {
  console.error("❌ Error post-processing gql-generated.ts:", error);
  process.exit(1);
}

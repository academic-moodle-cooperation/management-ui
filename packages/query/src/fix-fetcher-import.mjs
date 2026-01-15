import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generatedFile = join(__dirname, "gql-generated.ts");

try {
  let content = readFileSync(generatedFile, "utf-8");

  // Replace `import type { fetchData }` with `import { fetchData }`
  // This is necessary because useTypeImports: true incorrectly makes fetchData a type import
  // even though it's a function that needs to be used as a value
  content = content.replace(
    /^import type \{ fetchData \} from ['"]\.\/fetcher['"];?$/m,
    "import { fetchData } from './fetcher';"
  );

  writeFileSync(generatedFile, content, "utf-8");
  console.log("✅ Fixed fetchData import in gql-generated.ts");
} catch (error) {
  console.error("❌ Error fixing fetchData import:", error);
  process.exit(1);
}

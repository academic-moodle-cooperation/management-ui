// Validate the committed GraphQL documents against every committed Opencast
// schema, and enforce the superset contract between the schemas.
//
// Why this exists: the release lines (r/19.x, r/20.x, …) build the SAME
// generated code, produced from the newest schema. That is only sound if
//   1. every schema is a strict superset of the previous major's schema
//      (nothing the UI may use disappears or changes shape), and
//   2. every document a line can execute is valid against that line's schema.
// Documents live in `src/queries.graphql` (every supported major) and in
// `src/queries.ocNN.graphql` (major NN and newer only; a plugin gates those
// at runtime with `getOpencastMajor()` from @oc-mui/utils).
//
// Run: `pnpm --filter @oc-mui/query schema:validate` (part of `codegen:check`).
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildSchema,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  NoUnusedFragmentsRule,
  parse,
  specifiedRules,
  validate,
} from "graphql";

// A fragment may be defined for consumers (plugins spread it in their own
// operations) without an operation in this package using it — codegen allows
// that too, so the "unused fragment" rule is the one rule left out.
const rules = specifiedRules.filter((r) => r !== NoUnusedFragmentsRule);

const here = dirname(fileURLToPath(import.meta.url));
const entries = readdirSync(here);

const schemaFiles = entries
  .map((f) => f.match(/^schema-(\d+)\.graphql$/))
  .filter(Boolean)
  .map((m) => ({ major: Number(m[1]), file: m[0] }))
  .sort((a, b) => a.major - b.major);
if (schemaFiles.length === 0) {
  console.error("validate-schemas: no src/schema-<major>.graphql found");
  process.exit(1);
}
const schemas = schemaFiles.map(({ major, file }) => ({
  major,
  file,
  schema: buildSchema(readFileSync(join(here, file), "utf8")),
}));

const documents = entries
  .filter((f) => /^queries(\.oc\d+)?\.graphql$/.test(f))
  .map((f) => {
    const m = f.match(/^queries\.oc(\d+)\.graphql$/);
    return { file: f, minMajor: m ? Number(m[1]) : 0, doc: parse(readFileSync(join(here, f), "utf8")) };
  });

let failed = false;
const fail = (msg) => {
  console.error(`✖ ${msg}`);
  failed = true;
};

// 1. Superset contract: everything in schema N exists, with the same name and
//    the same field/argument/value set, in schema N+1.
for (let i = 1; i < schemas.length; i++) {
  const older = schemas[i - 1];
  const newer = schemas[i];
  const label = `schema-${older.major} ⊂ schema-${newer.major}`;
  for (const [name, oldType] of Object.entries(older.schema.getTypeMap())) {
    if (name.startsWith("__")) continue;
    const newType = newer.schema.getType(name);
    if (!newType) {
      fail(`${label}: type ${name} is missing in schema-${newer.major}`);
      continue;
    }
    if (isObjectType(oldType) || isInterfaceType(oldType) || isInputObjectType(oldType)) {
      const newFields = typeof newType.getFields === "function" ? newType.getFields() : {};
      for (const [fieldName, field] of Object.entries(oldType.getFields())) {
        const newField = newFields[fieldName];
        if (!newField) {
          fail(`${label}: ${name}.${fieldName} is missing in schema-${newer.major}`);
          continue;
        }
        if (String(newField.type) !== String(field.type)) {
          fail(`${label}: ${name}.${fieldName} changed type ${field.type} → ${newField.type}`);
        }
        const oldArgs = field.args ?? [];
        const newArgNames = new Set((newField.args ?? []).map((a) => a.name));
        for (const arg of oldArgs) {
          if (!newArgNames.has(arg.name)) {
            fail(`${label}: argument ${name}.${fieldName}(${arg.name}) is missing in schema-${newer.major}`);
          }
        }
      }
    }
    if (isEnumType(oldType)) {
      const newValues = new Set(isEnumType(newType) ? newType.getValues().map((v) => v.name) : []);
      for (const v of oldType.getValues()) {
        if (!newValues.has(v.name)) fail(`${label}: enum value ${name}.${v.name} is missing in schema-${newer.major}`);
      }
    }
  }
  if (!failed) console.log(`✓ ${label}: superset contract holds`);
}

// 2. Documents: plain files must validate against EVERY schema; a
//    queries.ocNN.graphql file against every schema with major >= NN.
for (const { file, minMajor, doc } of documents) {
  for (const { major, schema } of schemas) {
    if (major < minMajor) continue;
    const errors = validate(schema, doc, rules);
    if (errors.length) {
      for (const e of errors) fail(`${file} against schema-${major}: ${e.message}`);
    } else {
      console.log(`✓ ${file} is valid against schema-${major}`);
    }
  }
}

if (failed) {
  console.error("\nvalidate-schemas: FAILED — see above. A document that only works from a given major on belongs in src/queries.oc<major>.graphql.");
  process.exit(1);
}
console.log(`validate-schemas: ${documents.length} document file(s) × ${schemas.length} schema(s) OK`);

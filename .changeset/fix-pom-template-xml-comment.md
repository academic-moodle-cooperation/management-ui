---
---

Fix the scaffolded backend `pom.xml` being non-parseable XML. The Maven
POM template had an XML comment describing `pnpm install --frozen-lockfile`,
but XML comments may not contain a double hyphen (`--`). Maven therefore
failed before it could even read the POM:

```
Non-parseable POM ...: in comment after two dashes (--) next character
must be > not f ... `pnpm install --f... @ line 92
```

This blocked `mvn package` (test-protocol §10.1) for every scaffolded
plugin with a backend. Reworded the comment to avoid the `--` (the actual
`<arguments>install --frozen-lockfile</arguments>` element value is
untouched — `--` is legal in element text, only illegal in comments).

Verified end to end: the generated POM now parses, the parent
`base:19-SNAPSHOT` resolves, and `mvn package` produces a valid OSGi JAR
(`Management-Plugin` manifest header + `static/plugins/<id>/<id>.mjs`).

Scaffold-template only — empty changeset.

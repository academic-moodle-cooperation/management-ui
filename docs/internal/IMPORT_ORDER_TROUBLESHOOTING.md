# Import Order Troubleshooting

**Date:** 2026-01-13  
**Status:** ✅ ACTIVE

## Problem

Es gibt Inkonsistenzen in der Import-Reihenfolge im Monorepo:

- Manchmal sind `external` Imports (z.B. `react`) oben
- Manchmal sind `@workspace/*` Imports oben
- Die Reihenfolge scheint zufällig zu sein

## Ursache

1. **ESLint** (`packages/eslint-config/base.js`) definiert die Import-Reihenfolge:
   - `external` (z.B. `react`) → `internal` (`@workspace/*`) → `parent` (`../`) → `sibling` (`./`)
   - Leerzeilen zwischen Gruppen erforderlich

2. **Prettier** sortiert KEINE Imports, kann aber Leerzeilen ändern

3. **Konflikt**: Wenn `pnpm format` (Prettier) vor `pnpm lint --fix` (ESLint) läuft, können Leerzeilen entfernt werden

## Lösung

### 1. Korrekte Reihenfolge

**KORREKT:**

```typescript
import { useState } from "react";
import { Film } from "lucide-react";

import { useI18n } from "@workspace/i18n";
import { Button } from "@workspace/ui/components";

import { logger } from "../utils";

import "./styles.css";
```

**FALSCH:**

```typescript
import { useI18n } from "@workspace/i18n";
import { useState } from "react"; // ❌ external sollte VOR internal sein
```

### 2. Workflow

**Immer in dieser Reihenfolge:**

```bash
# 1. ESLint fix (sortiert Imports)
pnpm lint --fix

# 2. Prettier format (formatiert Code, ändert KEINE Import-Reihenfolge)
pnpm format
```

### 3. Auto-Fix

ESLint kann die Import-Reihenfolge automatisch korrigieren:

```bash
# Für alle Packages
pnpm lint --fix

# Für ein spezifisches Package
pnpm --filter management-ui-upload lint --fix
```

### 4. Prettier-Konfiguration

Prettier sollte die Import-Reihenfolge NICHT ändern. Die aktuelle `.prettierrc.json` enthält keine Import-Sortierung, was korrekt ist.

## Regeln (aus `packages/eslint-config/base.js`)

```javascript
"import/order": [
  "error",
  {
    groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
    "newlines-between": "always",
    alphabetize: {
      order: "asc",
      caseInsensitive: true,
    },
    pathGroups: [
      {
        pattern: "@workspace/**",
        group: "internal",
        position: "before",
      },
    ],
  },
],
```

## Checkliste

- [ ] `external` Imports (z.B. `react`) sind VOR `internal` Imports (`@workspace/*`)
- [ ] Leerzeile zwischen `external` und `internal` Gruppen
- [ ] Leerzeile zwischen `internal` und `parent` Gruppen
- [ ] Leerzeile zwischen `parent` und `sibling` Gruppen
- [ ] `type` Imports sind am Ende
- [ ] Alphabetische Sortierung innerhalb jeder Gruppe

## Referenzen

- `packages/eslint-config/base.js` - ESLint-Konfiguration
- `docs/IMPORT_ORDER_CONFIG.md` - Detaillierte Dokumentation
- `.prettierrc.json` - Prettier-Konfiguration (sollte Import-Reihenfolge NICHT ändern)

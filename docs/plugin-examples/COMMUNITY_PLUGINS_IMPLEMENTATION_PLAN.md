# Community Plugins Implementation Plan

**Version:** 1.0.0  
**Date:** 2026-01-21  
**Status:** Planning

## Executive Summary

Dieser Plan beschreibt die Implementierung eines Community-Plugin-Systems, das es externen Entwicklern ermöglicht, Plugins zu erstellen und über den Marketplace zu verteilen. Gleichzeitig werden die universitätsspezifischen Plugins (univie, tuwien) aus dem Haupt-Repository entfernt und als separate Community-Plugins bereitgestellt.

## Ziele

1. **Community-Plugin-System**: Externe Entwickler können Plugins erstellen und verteilen
2. **Open-Source-Vorbereitung**: Entfernung aller universitätsspezifischen Implementierungen aus dem Haupt-Repo
3. **Marketplace-Integration**: Plugins können über den Marketplace installiert werden
4. **Backward Compatibility**: Bestehende Funktionalität bleibt erhalten

## Architektur-Überblick

### Aktuelle Situation

```
plugins/
├── core/                    # ✅ Bleibt (Kern-Funktionalität)
├── admin-marketplace/       # ✅ Bleibt (Marketplace selbst)
├── univie/                  # ❌ Wird entfernt → Community-Plugin
├── tuwien/                  # ❌ Wird entfernt → Community-Plugin
├── example-university/      # ✅ Bleibt (Template/Beispiel)
└── themes/
    ├── default.css          # ✅ Bleibt
    ├── univie.css           # ❌ Wird entfernt → Community-Plugin
    └── tuwien.css           # ❌ Wird entfernt → Community-Plugin
```

### Ziel-Architektur

```
plugins/
├── core/                    # Kern-Funktionalität
├── admin-marketplace/       # Marketplace
├── example-university/       # Template für Community-Entwickler
└── themes/
    └── default.css          # Nur Default-Theme

Community-Plugins (extern):
├── plugin-univie/           # Als separates Repo/CDN
├── plugin-tuwien/          # Als separates Repo/CDN
└── [weitere Community-Plugins]
```

## Phase 1: Repository-Trennung & Branch-Strategie

### 1.1 Branch-Strategie

**Empfehlung:** Feature-Branch für Community-Plugin-System

```bash
# Aktueller Branch (Marketplace)
copilot/add-admin-marketplace-plugin

# Neuer Branch (Community-Plugins)
feature/community-plugin-system
  └── basiert auf: copilot/add-admin-marketplace-plugin
```

**Alternative:** Wenn Marketplace bereits gemerged ist:
```bash
# Von main/master
feature/community-plugin-system
```

### 1.2 Repository-Struktur für Open-Source

**Haupt-Repository (Open-Source):**
- Enthält nur: `core`, `admin-marketplace`, `example-university`
- Keine universitätsspezifischen Implementierungen
- Dokumentation für Community-Entwickler

**Separate Repositories (Optional):**
- `management-ui-plugin-univie` (privates Repo oder Community-Repo)
- `management-ui-plugin-tuwien` (privates Repo oder Community-Repo)

## Phase 2: Community-Plugin-Build-System

### 2.1 Build-Konfiguration für Community-Plugins

**Datei:** `packages/vite-config/src/community-plugin.config.ts`

**Funktionalität:**
- Vite Library Mode für ES Module
- External Dependencies: Alle `@oc-mui/*` Packages
- Source Maps für Debugging
- Optimierte Bundle-Größe

**Externe Dependencies:**
```typescript
external: [
  /^@workspace\//,      // Alle workspace packages
  'react',
  'react-dom',
  'react/jsx-runtime',
  // Weitere Peer Dependencies
]
```

### 2.2 Plugin-Template für Community-Entwickler

**Struktur:**
```
plugins/community-plugin-template/
├── vite.config.ts          # Verwendet community-plugin.config
├── package.json            # Mit peerDependencies
├── src/
│   └── index.ts           # Plugin-Export
├── README.md              # Entwickler-Dokumentation
└── .github/
    └── workflows/
        └── build.yml      # CI/CD für Plugin-Build
```

**Template-Features:**
- Vorkonfigurierte Vite-Config
- Beispiel-Plugin-Implementierung
- TypeScript-Setup
- Build-Skripte
- Dokumentation

### 2.3 Plugin-Metadaten-Schema

**Erweiterung:** `plugins/admin-marketplace/src/services/plugin-metadata.ts`

**Neue Felder:**
```typescript
interface CommunityPluginMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  repository?: string;
  homepage?: string;
  license: string;
  url: string; // CDN URL zum Plugin-Bundle
  icon?: string;
  category: PluginCategory;
  tags: string[];
  
  // Version Constraints
  workspaceDependencies: {
    "@oc-mui/plugin-system": string; // SemVer range
    "@oc-mui/ui": string;
    // ...
  };
  
  // Security
  signature?: string;        // Code-Signing Hash
  cdnDomain?: string;        // Allowed CDN domain
  verified?: boolean;        // Vom Maintainer verifiziert
  
  // Marketplace
  downloads?: number;
  rating?: number;
  lastUpdated: string;
}
```

## Phase 3: Security & Validation

### 3.1 URL-Allowlist-System

**Datei:** `plugins/admin-marketplace/src/services/security.ts`

**Features:**
- Konfigurierbare erlaubte CDN-Domains
- Environment-basierte Whitelist (dev vs. prod)
- Plugin-spezifische Domain-Constraints

### 3.2 Version-Compatibility-Check

**Funktionalität:**
- Prüft `workspaceDependencies` gegen installierte Versionen
- Warnung bei Inkompatibilität
- Blockierung bei kritischen Version-Mismatches

### 3.3 Code-Signing (Optional, aber empfohlen)

**Implementierung:**
- SHA-256 Hash des Plugin-Bundles
- Verifikation beim Laden
- Signierte Plugins als "verified" markiert

## Phase 4: Migration von univie/tuwien

### 4.1 Vorbereitung

**Schritte:**
1. `plugins/univie/` und `plugins/tuwien/` als separate Repositories exportieren
2. Build-System für beide Plugins einrichten
3. CDN-Hosting vorbereiten (oder GitHub Releases)

### 4.2 Code-Migration

**Zu migrieren:**
- `plugins/univie/` → `plugin-univie` Repository
- `plugins/tuwien/` → `plugin-tuwien` Repository
- `plugins/themes/univie.css` → Plugin-Asset
- `plugins/themes/tuwien.css` → Plugin-Asset

**Zu entfernen aus Haupt-Repo:**
- `plugins/univie/` Ordner
- `plugins/tuwien/` Ordner
- `plugins/themes/univie.css`
- `plugins/themes/tuwien.css`
- Imports in `plugins/index.ts`
- Imports in `apps/management-ui-core/vite.config.ts`

### 4.3 Plugin-Registry-Einträge

**Erstellen:**
- Metadata für `plugin-univie`
- Metadata für `plugin-tuwien`
- CDN-URLs konfigurieren

## Phase 5: Marketplace-Erweiterungen

### 5.1 Plugin-Registry-Service

**Datei:** `plugins/admin-marketplace/src/services/plugin-registry.ts`

**Erweiterungen:**
- API-Integration für Plugin-Registry (optional: Backend-Service)
- Caching von Plugin-Metadaten
- Kategorisierung und Filterung
- Suche und Sortierung

### 5.2 Marketplace-UI-Verbesserungen

**Datei:** `plugins/admin-marketplace/src/views/MarketplaceDashboard.tsx`

**Neue Features:**
- Community-Plugins Tab
- Plugin-Details-Seite
- Installations-Status
- Update-Benachrichtigungen
- Bewertungen/Reviews (optional)

### 5.3 Auto-Load-System

**Erweiterung:** `plugins/admin-marketplace/src/index.ts`

**Features:**
- Automatisches Laden installierter Community-Plugins beim Start
- Fehlerbehandlung bei fehlgeschlagenen Loads
- Retry-Mechanismus

## Phase 6: Dokumentation

### 6.1 Community-Entwickler-Dokumentation

**Dateien:**
- `docs/COMMUNITY_PLUGIN_DEVELOPMENT.md` - Haupt-Guide
- `docs/templates/COMMUNITY_PLUGIN_README_TEMPLATE.md`
- `plugins/community-plugin-template/README.md` - Template-Dokumentation

**Inhalte:**
- Plugin-Entwicklung von Grund auf
- Build-System-Nutzung
- Best Practices
- Security-Guidelines
- Publishing-Prozess

### 6.2 API-Dokumentation

**Erweitern:**
- `packages/plugin-system/README.md` - Extension Points dokumentieren
- `packages/ui/README.md` - Verfügbare Komponenten
- `packages/query/README.md` - GraphQL-Hooks

### 6.3 Migration-Guide

**Datei:** `docs/MIGRATION_UNIVIE_TUWIEN.md`

**Inhalte:**
- Wie man von statischen Plugins zu Community-Plugins migriert
- Build-Setup für univie/tuwien
- Deployment-Strategien

## Implementierungs-Reihenfolge

### Sprint 1: Foundation (1-2 Wochen)
1. ✅ Branch erstellen: `feature/community-plugin-system`
2. ✅ Community-Plugin-Build-Config erstellen
3. ✅ Plugin-Template erstellen
4. ✅ Security-Layer implementieren (URL-Allowlist, Version-Check)

### Sprint 2: Marketplace-Integration (1 Woche)
1. ✅ Plugin-Metadaten-Schema erweitern
2. ✅ Plugin-Registry-Service erweitern
3. ✅ Marketplace-UI für Community-Plugins anpassen
4. ✅ Auto-Load-System erweitern

### Sprint 3: Migration (1-2 Wochen)
1. ✅ univie/tuwien als separate Plugins aufsetzen
2. ✅ Build-System für beide konfigurieren
3. ✅ CDN-Hosting einrichten (oder GitHub Releases)
4. ✅ Plugin-Registry-Einträge erstellen
5. ✅ Aus Haupt-Repo entfernen

### Sprint 4: Dokumentation & Testing (1 Woche)
1. ✅ Community-Entwickler-Dokumentation
2. ✅ Migration-Guide
3. ✅ Testing: Plugin-Installation, Updates, Fehlerbehandlung
4. ✅ Beispiel-Community-Plugin erstellen

### Sprint 5: Cleanup & Release (1 Woche)
1. ✅ Code-Review
2. ✅ Finale Tests
3. ✅ Dokumentation finalisieren
4. ✅ Release-Vorbereitung

## Technische Details

### Build-Konfiguration Beispiel

```typescript
// plugins/community-plugin-template/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { createCommunityPluginConfig } from "@oc-mui/vite-config/community-plugin";

export default createCommunityPluginConfig({
  entry: "./src/index.ts",
  outDir: "./dist",
  pluginName: "my-community-plugin",
});
```

### Plugin-Export-Format

```typescript
// plugins/community-plugin-template/src/index.ts
import { createPlugin } from "@oc-mui/plugin-system";

export default createPlugin({
  namespace: "community",
  type: "feature",
  version: "1.0.0",
  initialize(manager) {
    // Plugin-Logik
  },
  activate() {},
  deactivate() {},
});
```

### Package.json Template

```json
{
  "name": "my-community-plugin",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/my-community-plugin.mjs",
  "exports": {
    ".": "./dist/my-community-plugin.mjs"
  },
  "peerDependencies": {
    "@oc-mui/plugin-system": "*",
    "@oc-mui/ui": "*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Risiken & Mitigation

### Risiko 1: Version-Inkompatibilitäten
**Mitigation:** Strikte Version-Constraints, Runtime-Checks, klare Dokumentation

### Risiko 2: Security (Malicious Plugins)
**Mitigation:** URL-Allowlist, Code-Signing (optional), Sandboxing (zukünftig)

### Risiko 3: Bundle-Größe bei vielen Plugins
**Mitigation:** Lazy Loading, Code-Splitting, nur benötigte Plugins laden

### Risiko 4: Breaking Changes in @workspace Packages
**Mitigation:** Semantic Versioning, Migration-Guides, Deprecation-Warnings

## Erfolgs-Kriterien

- ✅ Community-Entwickler können Plugins erstellen und veröffentlichen
- ✅ Plugins können über Marketplace installiert werden
- ✅ univie/tuwien sind aus Haupt-Repo entfernt
- ✅ Bestehende Funktionalität bleibt erhalten
- ✅ Dokumentation ist vollständig
- ✅ Security-Mechanismen sind implementiert

## Offene Fragen

1. **CDN-Hosting:** Wo werden Community-Plugins gehostet?
   - Option A: GitHub Releases + jsDelivr
   - Option B: Eigener CDN
   - Option C: npm Registry (wenn möglich)

2. **Plugin-Registry:** Zentraler Service oder dezentral?
   - Option A: Backend-Service für Registry
   - Option B: Statische JSON-Datei
   - Option C: GitHub-based Registry

3. **Code-Signing:** Implementieren oder später?
   - Empfehlung: Später, aber Architektur vorbereiten

4. **univie/tuwien Repositories:** Privat oder öffentlich?
   - Entscheidung: Abhängig von Lizenz/Policy

## Nächste Schritte

1. **Review dieses Plans** mit dem Team
2. **Branch erstellen:** `feature/community-plugin-system`
3. **Sprint 1 starten:** Foundation-Implementierung
4. **Regelmäßige Reviews:** Nach jedem Sprint

---

**Anmerkung:** Dieser Plan ist ein lebendes Dokument und wird während der Implementierung aktualisiert.

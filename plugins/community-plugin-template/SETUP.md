# Plugin Setup Guide

## Wichtige Schritte nach dem Kopieren des Templates

### 1. Dependencies installieren

**Im Monorepo (wenn Plugin im Workspace):**
```bash
# Vom Root des Monorepos
pnpm install
```

**Standalone (wenn Plugin außerhalb des Workspace):**
```bash
cd your-plugin
pnpm install --ignore-workspace
# oder
npm install
```

### 2. Build testen

```bash
pnpm build
```

Falls `rollup` fehlt:
- Prüfe, ob `rollup` in `package.json` → `devDependencies` steht
- Führe `pnpm install` erneut aus
- Falls im Monorepo: Stelle sicher, dass das Plugin im Workspace registriert ist

### 3. Häufige Probleme

**Problem: "Cannot find package 'rollup'"**
- **Lösung:** `pnpm install` ausführen (siehe oben)
- **Ursache:** Dependencies wurden nicht installiert

**Problem: "Cannot find module '@workspace/...'"**
- **Lösung:** Plugin muss im Management UI Workspace-Kontext geladen werden
- **Ursache:** Workspace-Packages sind nur im Host verfügbar

**Problem: Build funktioniert, aber Plugin lädt nicht**
- **Lösung:** Prüfe Browser-Konsole auf Fehler
- **Ursache:** Meist fehlende Dependencies oder falsche URL

## Checkliste

- [ ] `package.json` aktualisiert (Name, Metadata)
- [ ] `pnpm install` ausgeführt
- [ ] `pnpm build` erfolgreich
- [ ] Plugin-Datei existiert in `dist/`
- [ ] Plugin lädt im Developer Mode

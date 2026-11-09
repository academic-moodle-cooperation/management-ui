import { cloneElement } from "react";

import type { ReactElement, ReactNode } from "react";

/**
 * Render a translated string that carries simple markup.
 *
 * Translators keep whole sentences (`"Pause <names/> in this tab — <b>End
 * trial</b> brings it back."`); the component supplies what each tag renders.
 * Two forms:
 *
 * - `<b>text</b>` — the element is cloned with the translated text as its child.
 * - `<names/>` — the element is used as is, with its own children. This is how
 *   values from the deployment (plugin names, hosts, namespaces) get in: they
 *   are never spliced into the string, so a `<` in a plugin name cannot open a
 *   tag.
 *
 * Tags without a matching entry render as literal text. Nesting is not
 * supported, on purpose: none of the marketplace strings needs it.
 *
 * `react-i18next`'s `Trans` would do the same, but the version in this
 * workspace renders its children without keys under React 19 and does not
 * decode entities, so the plugin keeps this ten-line parser instead.
 */
export function rich(text: string, components: Record<string, ReactElement>): ReactNode[] {
  const out: ReactNode[] = [];
  const tag = /<([a-zA-Z][\w-]*)\s*\/>|<([a-zA-Z][\w-]*)>([\s\S]*?)<\/\2>/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = tag.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const [whole, selfClosing, paired, inner] = match;
    const name = selfClosing ?? paired ?? "";
    const element = components[name];
    if (!element) {
      out.push(whole);
    } else if (selfClosing) {
      out.push(cloneElement(element, { key: out.length }));
    } else {
      out.push(cloneElement(element, { key: out.length }, inner));
    }
    last = match.index + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

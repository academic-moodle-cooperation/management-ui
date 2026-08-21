---
"@oc-mui/query": patch
---

Re-sync the committed GraphQL codegen output with its inputs. The generated file had drifted: the suspense hooks still carried pre-`Mui` operation names (`useSuspenseGetMyEventsQuery`) while their non-suspense siblings had already been updated, and `MuiUserFieldsFragment.__typename` claimed `'MuiUser'` although the fragment is declared `on User`. Regenerating changed 14 exported suspense hooks, their query keys, and that `__typename` — a correction of generated output, not an API decision. Patch rather than major: these names exist in no published release (the package has never been published), and nothing in the workspace imports a suspense hook.

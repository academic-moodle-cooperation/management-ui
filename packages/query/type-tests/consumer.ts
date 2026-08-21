/**
 * Consumer-perspective type test over the BUILT declarations (#354).
 *
 * Compiled by `pnpm --filter @oc-mui/query test:consumer-types` with
 * `skipLibCheck: false` against `dist-types/` — the same surface an external
 * plugin consumes from the packed SDK. This is what regular type-checking
 * cannot see: a broken type reference in the emitted `.d.ts` (the
 * `NoInfer` import that did not exist) is swallowed by consumers'
 * `skipLibCheck: true` and silently degrades every hook's `data` to `any`.
 */
import {
  useMuiGetMyEventsQuery,
  useSuspenseMuiGetMyEventsQuery,
  type MuiGetMyEventsQuery,
} from "../dist-types/index";

declare function expectType<T>(value: T): void;

// eslint-disable-next-line react-hooks/rules-of-hooks -- type-level only, never executed
const query = useMuiGetMyEventsQuery();
expectType<MuiGetMyEventsQuery | undefined>(query.data);

// The other direction is the actual #354 regression test: with `data: any`
// both lines above AND this deliberately-wrong assignment would compile.
// @ts-expect-error data is MuiGetMyEventsQuery | undefined, not a number
const wrong: number = query.data;
void wrong;

// eslint-disable-next-line react-hooks/rules-of-hooks -- type-level only, never executed
const suspense = useSuspenseMuiGetMyEventsQuery();
expectType<MuiGetMyEventsQuery>(suspense.data);
// @ts-expect-error suspense data is MuiGetMyEventsQuery, not a string
const alsoWrong: string = suspense.data;
void alsoWrong;

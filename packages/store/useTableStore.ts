/**
 * Jotai utilities re-export for table state management
 * This module provides the core Jotai atoms and hooks needed for
 * managing table state across the application.
 */

import {
  atom,
  createStore,
  useAtomValue,
  useSetAtom,
  Provider,
  useAtom,
  type PrimitiveAtom,
} from "jotai";
import { atomWithStorage } from "jotai/utils";

// Re-export Jotai utilities for table state management
export {
  atomWithStorage,
  Provider,
  useAtomValue,
  useAtom,
  useSetAtom,
  atom,
  createStore,
  type PrimitiveAtom,
};

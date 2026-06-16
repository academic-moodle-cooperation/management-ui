// import { useReducer } from "react";
// import { VisibilityState, SortingState, OnChangeFn } from "@opencast-mui/ui";
// import { atomWithStorage, useAtomValue, useSetAtom } from "@opencast-mui/store";
// import { useMatch } from "@opencast-mui/router";
// import { useMemo } from "react";

// export interface TableBaseState {
//   pageIndex: number;
//   pageSize: number;
//   queryFilter?: string;
//   sidebarOpen: boolean;
// }

// export interface TableAction {
//   type: string;
//   payload?: any;
// }

// /**
//  * Hook to manage table pagination and filtering state
//  */
// export function useTableState<State extends TableBaseState, Action extends TableAction>(
//   initialState: State,
//   reducer: (state: State, action: Action) => State,
//   appName?: string
// ) {
//   // Initialize state with reducer
//   const [state, dispatch] = useReducer(reducer, initialState);

//   // Get static data for storage keys
//   const { staticData } = useMatch({ strict: false });

//   // Define atoms for persistent sorting and column visibility
//   const sortingAtomKey = `${appName || staticData.appName}_sorting`;
//   const columnVisibilityAtomKey = `${appName || staticData.appName}_columnVisibility`;

//   // Create atoms for storage
//   const sortingAtom = useMemo(
//     () => atomWithStorage<SortingState>(sortingAtomKey, []),
//     [sortingAtomKey]
//   );

//   const columnVisibilityAtom = useMemo(
//     () => atomWithStorage<VisibilityState>(columnVisibilityAtomKey, { title: true } as VisibilityState),
//     [columnVisibilityAtomKey]
//   );

//   // Get values and setters from atoms
//   const sorting = useAtomValue(sortingAtom);
//   const setSorting = useSetAtom(sortingAtom);

//   const columnVisibility = useAtomValue(columnVisibilityAtom);
//   const setColumnVisibility: OnChangeFn<VisibilityState> = useSetAtom(columnVisibilityAtom);

//   // Utility functions
//   const setPageIndex = (index: number) =>
//     dispatch({ type: 'SET_PAGE_INDEX', payload: index } as Action);

//   const setPageSize = (size: number) =>
//     dispatch({ type: 'SET_PAGE_SIZE', payload: size } as Action);

//   const setQueryFilter = (filter: string | undefined) =>
//     dispatch({ type: 'SET_QUERY_FILTER', payload: filter } as Action);

//   const setSidebarOpen = (open: boolean) =>
//     dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open } as Action);

//   return {
//     state,
//     dispatch,
//     sorting,
//     setSorting,
//     columnVisibility,
//     setColumnVisibility,
//     setPageIndex,
//     setPageSize,
//     setQueryFilter,
//     setSidebarOpen,
//   };
// }

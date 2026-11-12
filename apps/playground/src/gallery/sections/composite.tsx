import { useState } from "react";

import {
  Badge,
  Button,
  DataTable,
  DataTableColumnHeader,
  type ColumnDef,
  type SortingState,
} from "@oc-mui/ui/components";

import { PlusIcon } from "../icons";
import { Section } from "../Section";

/**
 * A composite component, to see how a change to the base components adds up
 * in a real arrangement: the data table combines Input, Button, Select and
 * Table with its own toolbar and pagination.
 */
type EventRow = { id: string; title: string; series: string; status: string; duration: string };

const ROWS: EventRow[] = [
  {
    id: "1",
    title: "Lecture 1: Introduction",
    series: "Algorithms",
    status: "Published",
    duration: "1:28:10",
  },
  {
    id: "2",
    title: "Lecture 2: Sorting",
    series: "Algorithms",
    status: "Processing",
    duration: "1:31:45",
  },
  {
    id: "3",
    title: "Lecture 3: Graphs",
    series: "Algorithms",
    status: "Published",
    duration: "1:25:02",
  },
  { id: "4", title: "Guest talk", series: "Colloquium", status: "Scheduled", duration: "0:45:00" },
  { id: "5", title: "Lab session", series: "Databases", status: "Published", duration: "0:58:30" },
];

const COLUMNS: ColumnDef<EventRow, string>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
  },
  {
    accessorKey: "series",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Series" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={row.original.status === "Published" ? "default" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "duration",
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
  },
];

export function DataTableSection() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "title", desc: false }]);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [queryFilter, setQueryFilter] = useState<string | undefined>(undefined);

  return (
    <Section id="data-table" title="Data table (composite)">
      <DataTable
        columns={COLUMNS}
        data={ROWS}
        selectedId="2"
        manualPagination={false}
        pageSize={pageSize}
        setPageSize={setPageSize}
        pageCount={1}
        pageIndex={pageIndex}
        setPageIndex={setPageIndex}
        totalRows={ROWS.length}
        sorting={sorting}
        setSorting={setSorting}
        queryFilter={queryFilter}
        setQueryFilter={setQueryFilter}
        refetch={() => undefined}
        toolbarEndButtons={
          <Button size="sm">
            <PlusIcon />
            New event
          </Button>
        }
      />
    </Section>
  );
}

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
  type ScreenReaderInstructions,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useId, useMemo, type CSSProperties, type ReactNode } from "react";

import { useI18n } from "@oc-mui/i18n";

import { cn } from "../../lib/utils";

/** The minimum a sortable row needs: a stable, unique id. */
export interface SortableItem {
  id: string;
}

/** Describes one completed reorder — the item and where it went. */
export interface SortableListMove {
  id: string;
  from: number;
  to: number;
}

export interface SortableListRenderState {
  /** Zero-based position in the current order. */
  index: number;
  /** True for the row being dragged (pointer or keyboard). */
  isDragging: boolean;
  /**
   * The drag handle, rendered by the list so every consumer gets the same
   * keyboard behaviour and screen-reader wiring. Place it where the row
   * design wants it; it is already a button.
   */
  handle: ReactNode;
}

export interface SortableListProps<T extends SortableItem> {
  /** The items in their current order. The list never mutates this array. */
  items: T[];
  /**
   * Called once per completed move with the new order and the move itself.
   * The list is controlled: render the new `items` and the UI follows.
   */
  onReorder: (items: T[], move: SortableListMove) => void;
  /** Renders a row's content. Put `state.handle` somewhere in it. */
  renderItem: (item: T, state: SortableListRenderState) => ReactNode;
  /** Human-readable name of an item — the handle's label and the announcements use it. */
  getItemLabel: (item: T) => string;
  /** Disables dragging and the handles; the list still renders. */
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
}

/** Keeps a dragged row on its own column — this is a vertical list. */
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

/**
 * Pure reorder helper for consumers that move items without dragging
 * (row menu "move up/down", a reducer). Same semantics as a drag.
 */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  return arrayMove(items, from, to);
}

interface SortableRowProps<T extends SortableItem> {
  item: T;
  index: number;
  disabled: boolean;
  label: string;
  renderItem: SortableListProps<T>["renderItem"];
  className: string | undefined;
}

function SortableRow<T extends SortableItem>({
  item,
  index,
  disabled,
  label,
  renderItem,
  className,
}: SortableRowProps<T>) {
  const { t } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      data-slot="sortable-handle"
      aria-label={t("sortableList.dragHandle", { label })}
      disabled={disabled}
      className={cn(
        "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md outline-none focus-visible:ring-[3px] disabled:cursor-default disabled:opacity-50",
        isDragging && "cursor-grabbing",
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </button>
  );

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-slot="sortable-item"
      data-index={index}
      data-dragging={isDragging ? "" : undefined}
      className={cn("relative", isDragging && "z-10", className)}
    >
      {renderItem(item, { index, isDragging, handle })}
    </li>
  );
}

/**
 * A vertically sortable list: pointer drag via a handle, full keyboard
 * reordering (space to pick up, arrows to move, space to drop, escape to
 * cancel) and screen-reader announcements for every step.
 *
 * Controlled — `items` is the order, `onReorder` hands back the next one.
 * Nothing is persisted here; the consumer decides whether a move saves
 * immediately or is staged.
 */
export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  getItemLabel,
  disabled = false,
  className,
  itemClassName,
}: SortableListProps<T>) {
  const { t } = useI18n();
  const contextId = useId();

  const sensors = useSensors(
    // A small distance threshold keeps plain clicks on the handle from
    // starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = useMemo(() => items.map((item) => item.id), [items]);

  const labelOf = (id: UniqueIdentifier) => {
    const item = items.find((candidate) => candidate.id === id);
    return item ? getItemLabel(item) : String(id);
  };
  const positionOf = (id: UniqueIdentifier) => ids.indexOf(String(id)) + 1;
  const count = items.length;

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      t("sortableList.pickedUp", {
        label: labelOf(active.id),
        position: positionOf(active.id),
        count,
      }),
    onDragOver: ({ active, over }) =>
      over
        ? t("sortableList.movedTo", {
            label: labelOf(active.id),
            position: positionOf(over.id),
            count,
          })
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? t("sortableList.dropped", {
            label: labelOf(active.id),
            position: positionOf(over.id),
            count,
          })
        : t("sortableList.cancelled", { label: labelOf(active.id) }),
    onDragCancel: ({ active }) => t("sortableList.cancelled", { label: labelOf(active.id) }),
  };

  const screenReaderInstructions: ScreenReaderInstructions = {
    draggable: t("sortableList.instructions"),
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to), { id: String(active.id), from, to });
  };

  return (
    <DndContext
      id={contextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[verticalOnly]}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={disabled}>
        <ul data-slot="sortable-list" className={cn("flex flex-col gap-2", className)}>
          {items.map((item, index) => (
            <SortableRow
              key={item.id}
              item={item}
              index={index}
              disabled={disabled}
              label={getItemLabel(item)}
              renderItem={renderItem}
              className={itemClassName}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

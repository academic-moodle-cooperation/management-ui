import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  ScrollArea,
  CardContent,
  Container,
} from "@workspace/ui/components";

export interface TableSidebarProps {
  /** Whether the sidebar is open */
  isOpen: boolean;
  /** Callback when the sidebar is closed */
  onClose: () => void;
  /** Sidebar heading */
  heading: string;
  /** Sidebar description */
  description?: string;
  /** Selected item to display/edit */
  selectedItem?: any;
  /** Main content renderer */
  renderContent: React.ReactNode;
  /** Optional affix content, shown below the main content */
  renderAffix?: React.ReactNode;
  /** Optional info text, shown at the bottom */
  renderInfo?: React.ReactNode;
  /** Footer content with action buttons */
  renderFooter: React.ReactNode;
  /** Whether to use modal behavior */
  modal?: boolean;
}

/**
 * Reusable sidebar component for table detail views
 */
export const TableSidebar: React.FC<TableSidebarProps> = ({
  isOpen,
  onClose,
  heading,
  description = "",
  renderContent,
  renderAffix,
  renderInfo,
  renderFooter,
  modal = false,
}) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Sheet modal={modal} open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col h-full">
        <div className="flex flex-col h-full overflow-hidden">
          <SheetHeader>
            <SheetTitle>{heading}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto">
            <ScrollArea>
              <CardContent className="pl-1 pr-3 pt-8 space-y-8">
                {renderContent}
              </CardContent>
              {renderAffix && renderAffix}
            </ScrollArea>
          </div>

          {renderInfo && (
            <Container className="flex justify-end text-xs text-muted-foreground">
              {renderInfo}
            </Container>
          )}

          <SheetFooter className="p-4 shrink-0 mt-auto">
            {renderFooter}
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};

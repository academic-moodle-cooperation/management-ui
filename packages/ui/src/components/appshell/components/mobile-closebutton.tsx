import { X } from "lucide-react";
import { useSidebar } from "@workspace/ui/components";

export const MobileCloseButton = () => {
  const { openMobile, setOpenMobile } = useSidebar();

  if (!openMobile) return null;

  return (
    <div className="absolute top-0 flex justify-center w-16 pt-5 left-full">
      <button type="button" className="-m-2.5 p-2.5" onClick={() => setOpenMobile(false)}>
        <span className="sr-only">Close sidebar</span>
        <X className="w-6 h-6 text-white" aria-hidden="true" />
      </button>
    </div>
  );
};

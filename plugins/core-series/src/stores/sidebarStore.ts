import { create } from "@oc-mui/store";

export type SeriesUpdateData = {
  [key: string]: string | string[];
};

interface SeriesSidebarState {
  // State
  isOpen: boolean;
  isEditing: boolean;
  selectedId: string;
  seriesUpdateData: SeriesUpdateData | undefined;
  updateField: string;

  // Actions
  openSidebar: (id: string) => void;
  closeSidebar: () => void;
  setIsEditing: (isEditing: boolean) => void;
  setSeriesUpdateData: (data: SeriesUpdateData | undefined) => void;
  setUpdateField: (field: string) => void;
  resetUpdateFields: () => void;

  // Updated function to accept inputFields directly
  openSidebarWithData: (id: string, editing: boolean, inputFields: Record<string, unknown>) => void;
}

export const useSidebarStore = create<SeriesSidebarState>((set) => ({
  // Initial state
  isOpen: false,
  isEditing: false,
  selectedId: "",
  seriesUpdateData: undefined as SeriesUpdateData | undefined,
  updateField: "",

  // Actions
  openSidebar: (id) => set({ isOpen: true, selectedId: id }),
  closeSidebar: () => set({ isOpen: false }),
  setIsEditing: (isEditing) => set({ isEditing }),
  setSeriesUpdateData: (data) => set({ seriesUpdateData: data }),
  setUpdateField: (field) => set({ updateField: field }),
  resetUpdateFields: () =>
    set({
      seriesUpdateData: undefined as SeriesUpdateData | undefined,
      updateField: "",
      isEditing: false,
    }),

  // Updated implementation that handles data loading within the store function
  openSidebarWithData: (id, editing, inputFields) => {
    set({ isOpen: true, selectedId: id, isEditing: editing });

    // Only attempt to format data if inputFields is provided and has the expected structure
    const inputFieldsTyped = inputFields as {
      seriesById?: { commonMetadataV2?: Record<string, unknown> };
    };
    if (inputFieldsTyped?.seriesById?.commonMetadataV2) {
      const metadataFields = inputFieldsTyped.seriesById.commonMetadataV2;
      const formattedData: SeriesUpdateData = {};

      Object.entries(metadataFields).forEach(([key, field]) => {
        if (field && typeof field === "object" && "value" in field) {
          const value = field.value;
          if (value !== undefined && value !== null) {
            // Ensure we're casting to the correct type
            formattedData[key] = Array.isArray(value) ? value : String(value);
          }
        }
      });

      if (Object.keys(formattedData).length > 0) {
        set({ seriesUpdateData: formattedData });
      }
    }
  },
}));

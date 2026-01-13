import { create } from "@workspace/store";

export type EpisodesUpdateData = {
  [key: string]: string | string[];
};

interface EpisodesSidebarState {
  // State
  isOpen: boolean;
  isEditing: boolean;
  selectedId: string;
  episodesUpdateData?: EpisodesUpdateData;
  updateField: string;
  layout: "list" | "gallery";

  // Actions
  openSidebar: (id: string) => void;
  closeSidebar: () => void;
  setIsEditing: (isEditing: boolean) => void;
  setEpisodesUpdateData: (data: EpisodesUpdateData | undefined) => void;
  setUpdateField: (field: string) => void;
  resetUpdateFields: () => void;
  setLayout: (layout: "list" | "gallery") => void;
  toggleLayout: () => void;

  // Updated function to accept inputFields directly
  openSidebarWithData: (id: string, editing: boolean, inputFields: Record<string, unknown>) => void;
}

export const useSidebarStore = create<EpisodesSidebarState>((set, get) => ({
  // Initial state
  isOpen: false,
  isEditing: false,
  selectedId: "",
  episodesUpdateData: undefined,
  updateField: "",
  layout: "list",

  // Actions
  openSidebar: (id) => set({ isOpen: true, selectedId: id }),
  closeSidebar: () => set({ isOpen: false }),
  setIsEditing: (isEditing) => set({ isEditing }),
  setEpisodesUpdateData: (data) => set({ episodesUpdateData: data }),
  setUpdateField: (field) => set({ updateField: field }),
  resetUpdateFields: () =>
    set({
      episodesUpdateData: undefined,
      updateField: "",
      isEditing: false,
    }),
  setLayout: (layout) => set({ layout }),
  toggleLayout: () =>
    set((state) => ({
      layout: state.layout === "list" ? "gallery" : "list",
    })),

  // Updated implementation that handles data loading within the store function
  openSidebarWithData: (id, editing, inputFields) => {
    set({ isOpen: true, selectedId: id, isEditing: editing });

    // Only attempt to format data if inputFields is provided and has the expected structure
    const inputFieldsTyped = inputFields as {
      eventById?: { commonMetadataV2?: Record<string, unknown> };
    };
    if (inputFieldsTyped?.eventById?.commonMetadataV2) {
      const metadataFields = inputFieldsTyped.eventById.commonMetadataV2;
      const formattedData: EpisodesUpdateData = {};

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
        set({ episodesUpdateData: formattedData });
      }
    }
  },
}));

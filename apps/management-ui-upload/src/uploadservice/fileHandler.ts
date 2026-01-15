import type { UploadFileBlob, UploadListType } from "@workspace/store";

const useFileHandler = (
  files: FileList,
  fileWaitingList: UploadFileBlob[],
  seriesId: string,
  setUpload: (upload: UploadListType) => void,
  zustandupload: UploadListType,
) => {
  const getLatestId = () => {
    const fileList: UploadFileBlob[] = [...zustandupload.uploaded, ...zustandupload.files];
    return Math.max(...fileList.map((file) => file && file.id), 0) + 1;
  };

  const uploadFiles = [...files].map((file, i) => {
    const src = window.URL.createObjectURL(file);

    return {
      file,
      id: i + getLatestId(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "waiting",
      analyzed: false,
      uploadName: file.name.split(".").slice(0, -1).join("."),
      progress: 0,
      src,
    };
  });

  setUpload({
    files: [...fileWaitingList, ...uploadFiles],
    seriesId,
    status: "LOADED",
    pending: [],
    next: null,
    uploading: false,
    uploaded: [],
    uploadError: null,
  });
};

export { useFileHandler };

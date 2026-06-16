import { CheckCircle2, Clock, PencilIcon, X, XCircle } from "lucide-react";
import React from "react";

import type { UploadFileBlob } from "@opencast-mui/store";
import { cn } from "@opencast-mui/ui/lib/utils";

export const UploadList = ({
  // zustandupload,
  // fileWaitingList,
  files,
  editFile,
  handleEditUploadName,
  editUploadName,
  editUploadNameEnd,
  updateEditFileName,
  refsById,
  abortUpload,
  isLoading,
  className,
}: {
  // zustandupload: UploadListType;
  // fileWaitingList: UploadFileBlob[];
  files: UploadFileBlob[];
  editFile:
    | {
        index: number;
        name: string;
      }
    | undefined;
  handleEditUploadName: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  editUploadName: (selectedFile: UploadFileBlob) => void;
  editUploadNameEnd: (uploadName: string) => void;
  updateEditFileName: (fileName: string) => void;
  refsById: React.RefObject<HTMLSpanElement>[];
  abortUpload: (selectedFile: UploadFileBlob) => void;
  isLoading: boolean;
  className: string;
}) => {
  return (
    <ul
      role="list"
      className={cn("border border-b divide-y divide-border rounded-lg border-border", className)}
    >
      {[...files]?.map((fileItem, index) => {
        const selectedFile = fileItem;

        return (
          <li
            key={(selectedFile?.uploadName || selectedFile?.name) + index}
            className="relative py-5 pl-4 pr-4 hover:bg-muted sm:py-3 sm:pl-4 lg:pl-6 xl:pl-4 first:rounded-t-lg last:rounded-b-lg"
          >
            <div className="flex flex-col justify-between">
              <div className="">
                <div className="flex justify-between mb-1">
                  <div className="flex">
                    {editFile && editFile.index === selectedFile.id ? (
                      <input
                        id="editfilename"
                        className="text-center"
                        autoFocus
                        onKeyDown={handleEditUploadName}
                        value={editFile.name}
                        onChange={(e) => {
                          updateEditFileName(e.target.value);
                        }}
                        onBlur={() => editUploadNameEnd(editFile.name)}
                        style={{
                          width: `${(refsById[selectedFile.id]?.current?.offsetWidth || 0) + 20}px`,
                        }}
                      />
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-foreground">
                          {selectedFile?.uploadName || selectedFile?.name}
                        </span>
                      </>
                    )}
                    <span className="absolute h-0 overflow-hidden" ref={refsById[selectedFile.id]}>
                      {editFile?.name || selectedFile?.uploadName}
                    </span>
                    {selectedFile.status === "waiting" && !isLoading && (
                      <div onClick={() => editUploadName(selectedFile)} aria-label="edit">
                        <PencilIcon className="w-5 h-5 ml-2 space-x-2 group-hover:inline text-slate-500 hover:text-slate-900 hover:cursor-pointer" />
                      </div>
                    )}
                  </div>
                  <>
                    <div className="flex items-end space-x-4">
                      <span className="relative text-sm font-medium text-muted-foreground hover:text-foreground">
                        {selectedFile.status === "completed" && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        {selectedFile.status === "aborted" && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        {selectedFile.status === "error" && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        {selectedFile.status === "waiting" && (
                          <Clock className="w-5 h-5 text-indigo-500" />
                        )}
                      </span>
                      <button
                        type="button"
                        className={cn(
                          "relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                          (selectedFile.status === "completed" ||
                            selectedFile.status === "aborted") &&
                            "hidden",
                        )}
                        onClick={() => abortUpload(selectedFile)}
                      >
                        <span className="sr-only">Remove from list</span>
                        <X
                          className="w-5 h-5 text-muted-foreground hover:text-foreground"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </>
                </div>
              </div>
              <div className="">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Größe: {(selectedFile.size / 1000000).toFixed(1)} MB
                  </span>
                  <span className="text-base font-medium text-muted-foreground">
                    {selectedFile.progress}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{
                      width: `${selectedFile.progress}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

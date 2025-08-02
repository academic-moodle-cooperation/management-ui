import React, { FC, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  Container,
  Label,
} from "@workspace/ui/components";
import { cn } from "@workspace/ui/lib/utils";
import { useI18n } from "@workspace/i18n";
import { UploadFileBlob, UploadListType } from "@workspace/store";

import { useFileHandler } from "../uploadservice/fileHandler";
import { useAppConfig } from "@workspace/query";
import { useLoaderData } from "@workspace/router";

interface DropzoneProps {
  handleDrop: (e: React.DragEvent<HTMLLabelElement>) => void;
  fileWaitingList: UploadFileBlob[];
  seriesId: string;
  setUpload: (upload: UploadListType) => void;
  zustandupload: UploadListType;
}

const Dropzone: FC<DropzoneProps> = ({
  handleDrop,
  fileWaitingList,
  seriesId,
  setUpload,
  zustandupload,
}) => {
  const { t } = useI18n();
  const { config } = useAppConfig();
  const uploadConfig = config.plugins?.["management-ui-upload"] as { whitelist?: string[] } || {};
  const { whitelist = [] } = uploadConfig;

  const [onFileDrop, setOnFileDrop] = useState(false);
  const [open, setOpen] = React.useState(false);

  const preventDefaults = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const useChangeHandler = (event: { target: HTMLInputElement }) => {
    useFileHandler(
      event.target.files!,
      fileWaitingList,
      seriesId,
      setUpload,
      zustandupload
    );
  };

  const fileValidation = (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue; // Skip if file is undefined

      const extension = file.name.split(".").pop();
      const type = file.type.split("/")[0];

      if (type !== "video" && type !== "audio" && !whitelist.includes(extension?.toLowerCase() || "")) {
        setOpen(true);
        return false;
      }
    }
    return true;
  };
  return (
    <Container
      className="flex flex-col items-center justify-center h-64 border-2 border-dashed cursor-pointer border-border bg-muted hover:bg-border hover:border-muted-foreground text-foreground"
      asChild
    >
      <>
        <Card className="py-0 w-2/3">
          <Label
            htmlFor="dropzone-file"
            className={cn(
              "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-primary-foreground hover:bg-accent text-foreground border-border",
              onFileDrop && "border-primary"
            )}
            onDragEnter={(e) => {
              preventDefaults(e);
              setOnFileDrop(true);
            }}
            onDragOver={(e) => {
              preventDefaults(e);
              setOnFileDrop(true);
            }}
            onDragLeave={(e) => {
              preventDefaults(e);
              setOnFileDrop(false);
            }}
            onDrop={(e) => {
              preventDefaults(e);
              setOnFileDrop(false);
              fileValidation(e.dataTransfer.files) && handleDrop(e);
            }}
          >
            <>
              <svg
                aria-hidden="true"
                className="w-10 h-10 mb-3 text-secondary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <p className="mb-2 text-sm text-center text-foreground">
                <span className="font-semibold">
                  {t("upload:dndSection.info1")}
                </span>{" "}
                {t("upload:dndSection.info2")}
              </p>
              <p className="text-xs text-center text-muted-foreground">
                {t("upload:dndSection.info3")}
              </p>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                accept={`audio/*,video/*${whitelist
                  ?.map((ext: string) => ",." + ext)
                  .join("")}`}
                multiple
                onChange={useChangeHandler}
                onClick={(
                  event: React.MouseEvent<HTMLInputElement, MouseEvent>
                ) => ((event.target as HTMLInputElement).value = "")}
              />
            </>
          </Label>
        </Card>
        <Button
          onClick={() => { }}
          color="primary"
          variant={"default"}
          size={"sm"}
          className={"self-center m-4 relative"}
        >
          {t("upload:selectFiles")}
          <input
            id="dropzone-filebutton"
            type="file"
            className="absolute inset-0 overflow-hidden opacity-0 cursor-pointer"
            accept={`audio/*,video/*${whitelist?.map((ext: string) => ",." + ext).join("")}`}
            multiple
            onChange={useChangeHandler}
            onClick={(event: React.MouseEvent<HTMLInputElement, MouseEvent>) =>
              ((event.target as HTMLInputElement).value = "")
            }
          />
        </Button>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("upload:alert.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("upload:alert.text")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>OK</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </Container>
  );
};

export default Dropzone;

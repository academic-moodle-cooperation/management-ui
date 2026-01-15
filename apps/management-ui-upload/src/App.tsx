import { createRef, useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@workspace/i18n";
import { usePluginManager, ComponentResolver } from "@workspace/plugin-system";
import { uploadExtensionPoints, tuwienUploadAclEditorImplementation } from "@workspace/plugins";
import {
  gql,
  createGraphQLClient,
  OrderDirection,
  useGetMySeriesNameAndIdQuery,
  useGetUserInfo,
  useInfiniteQuery,
 useAppConfig } from "@workspace/query";
import type { GetMySeriesNameAndIdQuery } from "@workspace/query";
import { useNavigate, useParams } from "@workspace/router";
import { useStore } from "@workspace/store";
import type { UploadFileBlob } from "@workspace/store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AppHeading,
  Button,
  Card,
  Container,
  SelectSeriesCombobox,
  Separator,
  Toaster,
  toast,
} from "@workspace/ui/components";
import type { AclData, SelectedElement } from "@workspace/ui/components";
import { logger } from "@workspace/utils";

import Dropzone from "./components/Dropzone";
import { EmptyState } from "./components/EmptyState";
import { UploadList } from "./components/UploadList";
import { useFileHandler } from "./uploadservice/fileHandler";
import { opencastUpload } from "./uploadservice/opencastUpload";


import type { RefObject } from "react";

export const App = () => {
  const [fileWaitingList, setFileWaitingList] = useState<UploadFileBlob[]>([]);
  const [filesWaiting, setFilesWaiting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [editFile, setEditFile] = useState<{ index: number; name: string }>({
    index: -1,
    name: "",
  });
  // TODO: isEdited state may be needed for future edit functionality
  // const [isEdited, setIsEdited] = useState(false);

  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SelectedElement | null>(null);

  // TODO: uploadListIsOpen state may be needed for future UI functionality
  // const [uploadListIsOpen, setUploadListIsOpen] = useState(false);
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [aclData, setAclData] = useState<AclData | undefined>(undefined);

  const zustandupload = useStore((state) => state.zustandupload);
  const nextUpload = useStore((state) => state.nextUpload);
  const resetUpload = useStore((state) => state.resetUpload);
  const deleteUpload = useStore((state) => state.deleteUpload);
  const fileUploaded = useStore((state) => state.fileUploaded);
  const setUploadError = useStore((state) => state.setUploadError);
  const filesUploaded = useStore((state) => state.filesUploaded);
  const updateFile = useStore((state) => state.updateFile);
  const setUpload = useStore((state) => state.setUpload);
  const submitUpload = useStore((state) => state.submitUpload);

  const { data: user } = useGetUserInfo();
  const { routeSubPath } = useParams({ strict: false });
  const navigate = useNavigate({ from: `/upload` });

  const { t } = useI18n();
  const { config } = useAppConfig();
  // Get upload-specific config from the real config system
  const uploadConfig = config.plugins?.["management-ui-upload"];
  const location = uploadConfig?.location || "Upload";
  const workflowId = uploadConfig?.workflowId || "ingest-upload";

  // Plugin system integration
  const manager = usePluginManager();

  // Register plugins on mount
  useEffect(() => {
    logger.debug("Registering upload plugins");

    // Register extension points first
    manager.register(uploadExtensionPoints);

    // Register TUWien ACL Editor implementation
    manager.register(tuwienUploadAclEditorImplementation);

    logger.debug("Upload plugins registered");

    return () => {
      logger.debug("Deregistering upload plugins");
      manager.deregister(uploadExtensionPoints.name);
      manager.deregister(tuwienUploadAclEditorImplementation.name);
    };
  }, [manager]);

  const { data: seriesData } = useGetMySeriesNameAndIdQuery({
    query: routeSubPath,
    orderBy: {
      title: OrderDirection.Asc,
    },
  });

  const seriesList = useMemo(
    () =>
      seriesData?.currentUser.mySeries.nodes?.map((series) => {
        return { id: series?.id, title: series?.title, __typename: "Series" };
      }) || [],
    [seriesData],
  );

  const FETCH_MY_SERIES = gql`
    query GetMySeriesNameAndId(
      $limit: Int
      $offset: Int
      $orderBy: SeriesOrderByInput
      $query: String
    ) {
      currentUser {
        mySeries(limit: $limit, offset: $offset, orderBy: $orderBy, query: $query) {
          nodes {
            id
            title
          }
        }
      }
    }
  `;

  const fetchMySeries = async ({
    pageParam = 0,
    query,
  }: {
    pageParam?: number;
    query?: string;
  }) => {
    const graphQLClient = createGraphQLClient(config.api.graphqlEndpoint);
    const data = (await graphQLClient.request(FETCH_MY_SERIES, {
      limit: 100,
      offset: pageParam,
      query,
      orderBy: {
        title: OrderDirection.Asc,
      },
    })) as GetMySeriesNameAndIdQuery;
    return data?.currentUser?.mySeries?.nodes || [];
  };

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["seriesList", query],
    queryFn: ({ pageParam }) => {
      return fetchMySeries({
        pageParam,
        ...(query !== undefined && { query }),
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages, lastPageParam) => {
      if (lastPage.length === 0) {
        return undefined;
      }
      return lastPageParam + 100;
    },
  });

  const refsById = useMemo(() => {
    const uploadFileEditNameRefs: RefObject<HTMLSpanElement>[] = [];
    fileWaitingList.forEach((item) => {
      uploadFileEditNameRefs[item.id] = createRef<HTMLSpanElement>() as RefObject<HTMLSpanElement>;
    });
    return uploadFileEditNameRefs;
  }, [fileWaitingList]);

  useEffect(() => {
    const navSeries = seriesList?.find((data) => data.id === routeSubPath) || null;

    setSelectedSeries(
      navSeries && navSeries.id && navSeries.title
        ? {
            __typename: navSeries.__typename as "Series" | "Event",
            id: navSeries.id,
            title: navSeries.title,
          }
        : null,
    );
    routeSubPath && setSelectedSeriesId(routeSubPath);
  }, [routeSubPath, seriesList]);

  useEffect(() => {
    setUpload({
      ...zustandupload,
      seriesId: selectedSeriesId || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeriesId]);

  useEffect(() => {
    const filesList = [...zustandupload.files];

    if (filesList.filter((n) => n).length > 0) {
      setFileWaitingList(filesList.filter((n) => n.status !== "completed"));
      setFilesWaiting(true);
    } else {
      setFileWaitingList([]);
      setFilesWaiting(false);
    }
  }, [zustandupload.files, zustandupload.uploaded]);

  useEffect(() => {
    if (zustandupload?.uploading) {
      setIsLoading(true);
    } else if (zustandupload?.status === "LOADED") {
      setIsCompleted(false);
    } else if (zustandupload?.status === "FILES_UPLOADED") {
      setIsCompleted(true);
      setIsLoading(false);
    } else if (zustandupload?.status === "idle") {
      if (!zustandupload?.pending?.filter((n) => n).length) setIsCompleted(true);
    }
  }, [zustandupload?.uploading, zustandupload?.status, zustandupload?.pending]);

  useEffect(() => {
    if (zustandupload?.pending?.length && zustandupload.next == null) {
      nextUpload(zustandupload.pending[0]!);
    }
  }, [zustandupload.next, zustandupload.pending, nextUpload]);

  useEffect(() => {
    if (zustandupload?.pending.length && zustandupload?.next && user) {
      const { next, seriesId } = zustandupload;

      const fileStatus = zustandupload?.files.find((fileItem) => fileItem?.id === next.id)?.status;

      if (fileStatus === "aborted") {
        const prev = next;
        const pending = zustandupload.pending.slice(1);
        fileUploaded(prev, pending);
      } else {
        opencastUpload(
          next,
          seriesId,
          workflowId,
          // Convert UserInfo to User type by adding missing provider property
          user
            ? {
                ...user,
                user: {
                  ...user.user,
                  provider: "internal", // Add default provider since it's missing from UserInfo
                },
              }
            : user,
          location,
          updateFile,
          setUploadError,
          aclData,
        )
          .then(() => {
            const prev = next;
            const pending = zustandupload.pending.slice(1);
            fileUploaded(prev, pending);
          })
          .catch((error) => {
            setFileWaitingList((prevState) => {
              const updateFileIndex = prevState.findIndex((fileItem) => fileItem?.id === next.id);

              if (updateFileIndex === -1) return prevState;

              const existingFile = prevState[updateFileIndex];
              if (!existingFile) return prevState;

              const updatedFile: UploadFileBlob = {
                ...existingFile,
                status: "error",
              };

              prevState[updateFileIndex] = updatedFile;

              updateFile(updatedFile);

              return prevState;
            });

            updateFile({
              ...next,
              status: "error",
            });

            const prev = next;
            const pending = zustandupload.pending.slice(1);
            fileUploaded(prev, pending);

            toast.error(t("upload:toast.error"));
            if (error instanceof Error) {
              setUploadError(error as Error);
            }
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    zustandupload?.pending,
    zustandupload?.next,
    zustandupload?.seriesId,
    // dispatch,
    // user,
  ]);

  useEffect(() => {
    if (!zustandupload.pending.length && zustandupload.uploading) {
      filesUploaded();
    }
  }, [filesUploaded, zustandupload.pending.length, zustandupload.uploading]);

  useEffect(() => {
    if (selectedSeries && selectedSeries.id) {
      setSelectedSeriesId(selectedSeries.id);
      navigate({
        to: `/upload/${selectedSeries.id}`,
        replace: true,
      });
    }
  }, [selectedSeries, navigate]);

  const useHandleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    const dt = e.dataTransfer;
    const files = dt.files;

    useFileHandler(files, fileWaitingList, routeSubPath, setUpload, zustandupload);
  };

  const handleUpload = useCallback(() => {
    setUploadListIsOpen(true);
    if (zustandupload?.files.length) {
      submitUpload();
    }
  }, [zustandupload?.files.length, submitUpload]);

  const handleFileDelete = useCallback(
    (fileID: number) => {
      if (zustandupload?.files.length) {
        deleteUpload(fileID);
      }
    },
    [zustandupload?.files, deleteUpload],
  );

  const abortUpload = (selectedFile: UploadFileBlob) => {
    if (!isLoading && selectedFile.status === "completed") {
      return;
    } else if (!isLoading && selectedFile.status === "waiting") {
      handleFileDelete(selectedFile.id);
      return;
    }

    setFileWaitingList((prevState) => {
      const updateFileIndex = prevState.findIndex((fileItem) => fileItem?.id === selectedFile.id);

      if (updateFileIndex === -1) return prevState;

      const existingFile = prevState[updateFileIndex];
      if (!existingFile) return prevState;

      const updatedFile: UploadFileBlob = {
        ...existingFile,
        status: "aborted",
      };

      prevState[updateFileIndex] = updatedFile;

      updateFile(updatedFile);

      return prevState;
    });

    updateFile({
      ...selectedFile,
      status: "aborted",
    });
    selectedFile.request?.abort();
  };

  const editUploadName = (selectedFile: UploadFileBlob) => {
    if (!isLoading && selectedFile.status === "completed") {
      return;
    }

    setEditFile({
      index: selectedFile.id,
      name: selectedFile?.uploadName || selectedFile?.name,
    });
  };

  const handleEditUploadName = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const uploadName = (event.target as HTMLInputElement).value;
    if (!editFile || (event.key === "Enter" && uploadName.trim().length)) {
      editUploadNameEnd(uploadName);
      return;
    }

    setEditFile({
      index: editFile.index,
      name: uploadName,
    });
    setIsEdited(true);
  };

  const editUploadNameEnd = (uploadName: string) => {
    if (editFile && uploadName.trim().length > 0) {
      setFileWaitingList((prevState) => {
        const updateFileIndex = prevState.findIndex(
          (fileItem) => fileItem?.id === editFile.index,
        ) as number;

        if (
          !prevState ||
          updateFileIndex === undefined ||
          updateFileIndex === -1 ||
          prevState[updateFileIndex] === undefined ||
          !prevState[updateFileIndex]?.file
        ) {
          return prevState;
        }

        prevState[updateFileIndex] = {
          ...prevState[updateFileIndex],
          file: {
            ...prevState[updateFileIndex].file,
          },
          uploadName: uploadName.trim(),
        };

        updateFile({
          ...prevState[updateFileIndex],
        });

        return prevState;
      });
    }
    setEditFile({ index: -1, name: "" });
  };

  // Handle ACL data changes from the plugin
  const onAclDataChange = useCallback((newAclData: AclData, managedAclId: string) => {
    logger.debug("ACL data changed", { newAclData, managedAclId });
    setAclData({
      entries:
        newAclData?.entries?.map((entry) => ({
          role: entry.role,
          action: entry.action,
        })) ?? [],
      managedAclEntries:
        newAclData?.managedAclEntries?.map((entry) => ({
          role: entry.role,
          action: entry.action,
        })) ?? [],
      managedAclId: managedAclId ?? undefined,
    });
  }, []);

  // Refetch function for ACL editor
  const handleRefetch = useCallback(() => {
    logger.debug("Refetching data");
    // Add any refetch logic here if needed
  }, []);

  return (
    <>
      <Container className="flex flex-row flex-wrap w-full p-8 ">
        <AppHeading heading={t("upload:heading")} description={t("upload:description")} />
        <Separator className="mt-4 mb-8" />
        {!query && data?.pages.flat().length === 0 ? (
          <ComponentResolver
            componentType="series:empty-state"
            defaultComponent={() => <EmptyState />}
            componentProps={{}}
            loadingBehavior="none"
          />
        ) : (
          <Container className="flex flex-row items-center justify-center w-full">
            <Container className="flex flex-col items-center justify-center w-full mt-12 sticky top-20 bottom-8">
              <Dropzone
                handleDrop={useHandleDrop}
                fileWaitingList={fileWaitingList}
                seriesId={routeSubPath}
                setUpload={setUpload}
                zustandupload={zustandupload}
              />
            </Container>
            {(!!fileWaitingList.length || !!zustandupload.uploaded.length) && (
              <Container className="flex flex-col w-full gap-y-4">
                {!!zustandupload?.uploaded.length && (
                  <Card className="px-4 py-0">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-1" className="border-none">
                        <AccordionTrigger>{t("upload:lastUploads")}</AccordionTrigger>
                        <AccordionContent>
                          <UploadList
                            files={zustandupload?.uploaded}
                            editFile={editFile}
                            handleEditUploadName={handleEditUploadName}
                            editUploadName={editUploadName}
                            editUploadNameEnd={editUploadNameEnd}
                            refsById={refsById}
                            abortUpload={abortUpload}
                            isLoading={isLoading}
                            className={"rounded-t-none"}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </Card>
                )}
                {(!!fileWaitingList.length || !!zustandupload.uploaded.length) && (
                  <Card className="flex flex-col w-full h-full px-4 py-6 lg:px-8 gap-y-4">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h2 className="text-xl font-semibold tracking-tight">
                            {t("upload:headingList")}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {t("upload:descriptionList")}
                          </p>
                        </div>
                        <Button
                          color="primary"
                          variant={"outline"}
                          size={"sm"}
                          className={"self-end relative"}
                          disabled={isLoading}
                          onClick={() => {
                            setFileWaitingList([]);
                            setFilesWaiting(false);
                            resetUpload();
                          }}
                        >
                          {t("upload:deleteButton")}
                        </Button>
                      </div>
                      <Separator className="my-4" />
                    </div>
                    {!!fileWaitingList.length && (
                      <>
                        <UploadList
                          files={fileWaitingList}
                          editFile={editFile}
                          handleEditUploadName={handleEditUploadName}
                          editUploadName={editUploadName}
                          editUploadNameEnd={editUploadNameEnd}
                          refsById={refsById}
                          abortUpload={abortUpload}
                          isLoading={isLoading}
                          className={
                            zustandupload?.uploaded.length === 0 ? "rounded-b-none" : "rounded-b-lg"
                          }
                        />
                      </>
                    )}

                    <h2 className="font-semibold tracking-tight my-2">{t("upload:series")}</h2>

                    <SelectSeriesCombobox
                      seriesList={data?.pages
                        .flat()
                        .filter((s): s is { id: string; title: string } => s !== null)}
                      selectedSeries={selectedSeries}
                      setSelectedSeries={(value) => {
                        setSelectedSeries(
                          value && value.id && value.title
                            ? {
                                __typename: "Series" as const,
                                id: value.id,
                                title: value.title,
                              }
                            : null,
                        );
                      }}
                      searchSeries={(query: React.SetStateAction<string>) => {
                        setQuery(typeof query === "function" ? query("") : query || undefined);
                      }}
                      infiniteFetchNextPage={fetchNextPage}
                      hasNextPage={hasNextPage}
                      placeholder={t("upload:selectSeries")}
                    />

                    {/* TU Wien ACL Editor Plugin Integration */}
                    <ComponentResolver
                      componentType="upload:acl-editor"
                      defaultComponent={() => null} // No default component
                      componentProps={{
                        aclData,
                        onAclDataChange,
                        selectedSeries,
                        disabled: isLoading,
                        refetch: handleRefetch,
                      }}
                      useOverridePrefix={false}
                      loadingBehavior="none"
                    />

                    <div className="flex flex-row justify-center items-center my-4 sticky bottom-0 p-4 bg-white">
                      <Button
                        color="primary"
                        variant={
                          isLoading || !selectedSeriesId || isCompleted ? "secondary" : "default"
                        }
                        size={"lg"}
                        className={"self-start ml-4 relative w-1/2"}
                        disabled={!filesWaiting || isLoading || isCompleted || !selectedSeriesId}
                        onClick={() => handleUpload()}
                      >
                        {isCompleted
                          ? t("upload:uploadButton.upload")
                          : isLoading
                            ? t("upload:uploadButton.loading")
                            : t("upload:uploadButton.upload")}
                      </Button>
                    </div>
                  </Card>
                )}
              </Container>
            )}
          </Container>
        )}
        <Toaster closeButton richColors toastOptions={{}} theme="light" />

        {/* TODO: Make Option for "No Series available" */}
      </Container>
    </>
  );
};

export default App;

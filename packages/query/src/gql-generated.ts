/* eslint-disable */
import type { UseQueryResult, UseSuspenseQueryResult} from "@tanstack/react-query";
import { useQuery, useSuspenseQuery, useMutation, type UseQueryOptions, type UseSuspenseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { fetchData } from './fetcher';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A slightly refined version of RFC-3339 compliant DateTime Scalar */
  DateTime: { input: any; output: any; }
  /** A slightly refined version of RFC-3339 compliant DateTime Scalar */
  Duration: { input: any; output: any; }
  /** A JSON scalar */
  JSON: { input: any; output: any; }
  /** A 64-bit signed integer */
  Long: { input: any; output: any; }
};

export type AccessControlGenericItem = AccessControlItem & {
  action?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  role?: Maybe<Scalars['String']['output']>;
};

export type AccessControlGroupItem = AccessControlItem & {
  action?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  role?: Maybe<Scalars['String']['output']>;
};

export type AccessControlItem = {
  action?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  role?: Maybe<Scalars['String']['output']>;
};

export type AccessControlItemInput = {
  action?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  role?: InputMaybe<Scalars['String']['input']>;
};

/** Access control list */
export type AccessControlList = {
  entries?: Maybe<Array<Maybe<AccessControlItem>>>;
  users?: Maybe<Array<Maybe<AccessControlUserItem>>>;
};

export type AccessControlListInput = {
  entries: Array<InputMaybe<AccessControlItemInput>>;
  managedAclId?: InputMaybe<Scalars['Long']['input']>;
};

export type AccessControlUserItem = AccessControlItem & {
  action?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  label?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
};

export type CommonEventMetadata = {
  /** EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS */
  contributor?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** EVENTS.EVENTS.DETAILS.METADATA.CREATED */
  created?: Maybe<Scalars['DateTime']['output']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS */
  creator?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION */
  description?: Maybe<Scalars['String']['output']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.DURATION */
  duration?: Maybe<Scalars['Duration']['output']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.ID */
  identifier?: Maybe<Scalars['String']['output']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.SERIES */
  isPartOf?: Maybe<Scalars['String']['output']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE */
  language?: Maybe<Scalars['String']['output']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.LICENSE */
  license?: Maybe<Scalars['String']['output']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.LOCATION */
  location?: Maybe<Scalars['String']['output']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.PUBLISHER */
  publisher?: Maybe<Scalars['String']['output']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.RIGHTS */
  rightsHolder?: Maybe<Scalars['String']['output']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.SOURCE */
  source?: Maybe<Scalars['String']['output']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.START_DATE */
  startDate?: Maybe<Scalars['DateTime']['output']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.SUBJECT */
  subject?: Maybe<Scalars['String']['output']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.TITLE */
  title: Scalars['String']['output'];
};

export type CommonEventMetadataInput = {
  /** EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS */
  contributor?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  /** EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS */
  creator?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  /** EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION */
  description?: InputMaybe<Scalars['String']['input']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.DURATION */
  duration?: InputMaybe<Scalars['Duration']['input']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.SERIES */
  isPartOf?: InputMaybe<Scalars['String']['input']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE */
  language?: InputMaybe<Scalars['String']['input']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.LICENSE */
  license?: InputMaybe<Scalars['String']['input']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.LOCATION */
  location?: InputMaybe<Scalars['String']['input']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.RIGHTS */
  rightsHolder?: InputMaybe<Scalars['String']['input']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.SOURCE */
  source?: InputMaybe<Scalars['String']['input']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.START_DATE */
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.SUBJECT */
  subject?: InputMaybe<Scalars['String']['input']>;
  /** EVENTS.EVENTS.DETAILS.METADATA.TITLE */
  title: Scalars['String']['input'];
};

export type CommonEventMetadataV2 = {
  /** EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS */
  contributor?: Maybe<ListMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.CREATED */
  created?: Maybe<DateTimeMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS */
  creator?: Maybe<ListMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION */
  description?: Maybe<StringMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.DURATION */
  duration?: Maybe<DurationMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.ID */
  identifier?: Maybe<StringMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.SERIES */
  isPartOf?: Maybe<StringMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE */
  language?: Maybe<StringMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.LICENSE */
  license?: Maybe<StringMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.LOCATION */
  location?: Maybe<StringMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.PUBLISHER */
  publisher?: Maybe<StringMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.RIGHTS */
  rightsHolder?: Maybe<StringMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.SOURCE */
  source?: Maybe<StringMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.START_DATE */
  startDate?: Maybe<DateTimeMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.SUBJECT */
  subject?: Maybe<StringMetadataField>;
  /** EVENTS.EVENTS.DETAILS.METADATA.TITLE */
  title?: Maybe<StringMetadataField>;
};

export type CommonSeriesMetadataInput = {
  /** EVENTS.SERIES.DETAILS.METADATA.CONTRIBUTORS */
  contributor?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  /** EVENTS.SERIES.DETAILS.METADATA.ORGANIZERS */
  creator?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  /** EVENTS.SERIES.DETAILS.METADATA.DESCRIPTION */
  description?: InputMaybe<Scalars['String']['input']>;
  /** EVENTS.SERIES.DETAILS.METADATA.LANGUAGE */
  language?: InputMaybe<Scalars['String']['input']>;
  /** EVENTS.SERIES.DETAILS.METADATA.LICENSE */
  license?: InputMaybe<Scalars['String']['input']>;
  /** EVENTS.SERIES.DETAILS.METADATA.PUBLISHERS */
  publisher?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  /** EVENTS.SERIES.DETAILS.METADATA.RIGHTS */
  rightsHolder?: InputMaybe<Scalars['String']['input']>;
  /** EVENTS.SERIES.DETAILS.METADATA.SUBJECT */
  subject?: InputMaybe<Scalars['String']['input']>;
  /** EVENTS.SERIES.DETAILS.METADATA.TITLE */
  title: Scalars['String']['input'];
};

export type CommonSeriesMetadataV2 = {
  /** EVENTS.SERIES.DETAILS.METADATA.CONTRIBUTORS */
  contributor?: Maybe<ListMetadataField>;
  /** EVENTS.SERIES.DETAILS.METADATA.ORGANIZERS */
  creator?: Maybe<ListMetadataField>;
  /** EVENTS.SERIES.DETAILS.METADATA.DESCRIPTION */
  description?: Maybe<StringMetadataField>;
  /** EVENTS.SERIES.DETAILS.METADATA.ID */
  identifier?: Maybe<StringMetadataField>;
  /** EVENTS.SERIES.DETAILS.METADATA.LANGUAGE */
  language?: Maybe<StringMetadataField>;
  /** EVENTS.SERIES.DETAILS.METADATA.LICENSE */
  license?: Maybe<StringMetadataField>;
  /** EVENTS.SERIES.DETAILS.METADATA.PUBLISHERS */
  publisher?: Maybe<ListMetadataField>;
  /** EVENTS.SERIES.DETAILS.METADATA.RIGHTS */
  rightsHolder?: Maybe<StringMetadataField>;
  /** EVENTS.SERIES.DETAILS.METADATA.SUBJECT */
  subject?: Maybe<StringMetadataField>;
  /** EVENTS.SERIES.DETAILS.METADATA.TITLE */
  title?: Maybe<StringMetadataField>;
};

/** Represents the current user. */
export type CurrentUser = {
  email?: Maybe<Scalars['String']['output']>;
  /** A list of events under the owner. */
  myEvents: EventList;
  /** A list of playlists owned by the current user. */
  myPlaylists: PlaylistList;
  /** A list of series under the owner. */
  mySeries: SeriesList;
  name?: Maybe<Scalars['String']['output']>;
  /** A list of roles assigned to the user. */
  roles: Array<Maybe<Scalars['String']['output']>>;
  /** The role of the user. */
  userRole: Scalars['String']['output'];
  username?: Maybe<Scalars['String']['output']>;
};


/** Represents the current user. */
export type CurrentUserMyEventsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EventOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
};


/** Represents the current user. */
export type CurrentUserMyPlaylistsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PlaylistOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
};


/** Represents the current user. */
export type CurrentUserMySeriesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SeriesOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
};

export type DateTimeMetadataField = MetadataFieldInterface & {
  collection?: Maybe<Scalars['JSON']['output']>;
  collectionId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  listProvider?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  readOnly?: Maybe<Scalars['Boolean']['output']>;
  required?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<Type>;
  value?: Maybe<Scalars['DateTime']['output']>;
};

/** DeleteEventPayload */
export type DeleteEventPayload = {
  /** A unique identifier for the client performing the mutation. */
  id?: Maybe<Scalars['String']['output']>;
  /** The deletion status of the event. */
  status?: Maybe<EventRemovalResult>;
};

/** The payload returned after deleting a playlist, containing the ID of the deleted playlist. */
export type DeletePlaylistPayload = {
  /** A unique identifier of the deleted playlist. */
  id?: Maybe<Scalars['String']['output']>;
};

export type DurationMetadataField = MetadataFieldInterface & {
  collection?: Maybe<Scalars['JSON']['output']>;
  collectionId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  listProvider?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  readOnly?: Maybe<Scalars['Boolean']['output']>;
  required?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<Type>;
  value?: Maybe<Scalars['Duration']['output']>;
};

/** A Event. */
export type Event = {
  acl: AccessControlList;
  /** Common metadata of the event. */
  commonMetadata: CommonEventMetadata;
  /** Common metadata of the event. */
  commonMetadataV2: CommonEventMetadataV2;
  contributors?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  created?: Maybe<Scalars['DateTime']['output']>;
  creator?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  displayableStatus?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Duration']['output']>;
  endDate?: Maybe<Scalars['DateTime']['output']>;
  eventStatus: Scalars['String']['output'];
  hasPreview: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  license?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  muiEventInfo?: Maybe<MuiEventInfo>;
  presenters?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Return publications filterable by channel and tags */
  publications?: Maybe<Array<Maybe<Publication>>>;
  publisher?: Maybe<Scalars['String']['output']>;
  series?: Maybe<Series>;
  seriesId?: Maybe<Scalars['String']['output']>;
  seriesName?: Maybe<Scalars['String']['output']>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  technicalEndTime?: Maybe<Scalars['String']['output']>;
  technicalStartTime?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};


/** A Event. */
export type EventPublicationsArgs = {
  channel?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** Filter options for events */
export enum EventFilter {
  /** INGESTING */
  Ingesting = 'INGESTING',
  /** PAUSED */
  Paused = 'PAUSED',
  /** PENDING */
  Pending = 'PENDING',
  /** PROCESSED */
  Processed = 'PROCESSED',
  /** PROCESSING */
  Processing = 'PROCESSING',
  /** PROCESSING_CANCELLED */
  ProcessingCancelled = 'PROCESSING_CANCELLED',
  /** PROCESSING_FAILURE */
  ProcessingFailure = 'PROCESSING_FAILURE',
  /** RECORDING */
  Recording = 'RECORDING',
  /** RECORDING_FAILURE */
  RecordingFailure = 'RECORDING_FAILURE',
  /** SCHEDULED */
  Scheduled = 'SCHEDULED'
}

/** Filter options for events */
export type EventFilterByInput = {
  /** Filter by published state */
  published?: InputMaybe<Scalars['Boolean']['input']>;
  /** Filter by series */
  seriesId?: InputMaybe<Scalars['String']['input']>;
  /** Filter by event status */
  status?: InputMaybe<EventFilter>;
};

/** A list of events */
export type EventList = {
  nodes: Array<Maybe<Event>>;
  pageInfo: OffsetPageInfo;
  totalCount: Scalars['Long']['output'];
};

/** Ordering options for events */
export type EventOrderByInput = {
  created?: InputMaybe<OrderDirection>;
  endDate?: InputMaybe<OrderDirection>;
  eventStatus?: InputMaybe<OrderDirection>;
  location?: InputMaybe<OrderDirection>;
  presenters?: InputMaybe<OrderDirection>;
  seriesName?: InputMaybe<OrderDirection>;
  startDate?: InputMaybe<OrderDirection>;
  technicalEndTime?: InputMaybe<OrderDirection>;
  technicalStartTime?: InputMaybe<OrderDirection>;
  title?: InputMaybe<OrderDirection>;
  workflowState?: InputMaybe<OrderDirection>;
};

/** An entry in a playlist. */
export type EventPlaylistEntry = PlaylistEntry & {
  contentId?: Maybe<Scalars['String']['output']>;
  event?: Maybe<Event>;
  id?: Maybe<Scalars['Long']['output']>;
  type?: Maybe<PlaylistEntryType>;
};

export enum EventRemovalResult {
  /** GENERAL_FAILURE */
  GeneralFailure = 'GENERAL_FAILURE',
  /** NOT_FOUND */
  NotFound = 'NOT_FOUND',
  /** RETRACTING */
  Retracting = 'RETRACTING',
  /** SUCCESS */
  Success = 'SUCCESS'
}

/** An entry in a playlist. */
export type InaccessiblePlaylistEntry = PlaylistEntry & {
  contentId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Long']['output']>;
  type?: Maybe<PlaylistEntryType>;
};

export type IntMetadataField = MetadataFieldInterface & {
  collection?: Maybe<Scalars['JSON']['output']>;
  collectionId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  listProvider?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  readOnly?: Maybe<Scalars['Boolean']['output']>;
  required?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<Type>;
  value?: Maybe<Scalars['String']['output']>;
};

export type JsonMetadataField = MetadataFieldInterface & {
  collection?: Maybe<Scalars['JSON']['output']>;
  collectionId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  listProvider?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  readOnly?: Maybe<Scalars['Boolean']['output']>;
  required?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<Type>;
  value?: Maybe<Scalars['JSON']['output']>;
};

export type ListMetadataField = MetadataFieldInterface & {
  collection?: Maybe<Scalars['JSON']['output']>;
  collectionId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  listProvider?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  readOnly?: Maybe<Scalars['Boolean']['output']>;
  required?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<Type>;
  value?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

/** A list provider */
export type ListProvider = {
  nodes?: Maybe<Array<Maybe<ListProviderEntry>>>;
  translatable?: Maybe<Scalars['Boolean']['output']>;
};

export type ListProviderEntry = {
  key?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type LongMetadataField = MetadataFieldInterface & {
  collection?: Maybe<Scalars['JSON']['output']>;
  collectionId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  listProvider?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  readOnly?: Maybe<Scalars['Boolean']['output']>;
  required?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<Type>;
  value?: Maybe<Scalars['Long']['output']>;
};

/** A list of ACLs */
export type ManagedAccessControlListCatalogue = {
  nodes: Array<Maybe<ManagedAcl>>;
  pageInfo: OffsetPageInfo;
  totalCount: Scalars['Long']['output'];
};

export type ManagedAcl = {
  acl: AccessControlList;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
};

/** Ordering options for managed ACLs */
export type ManagedAclOrderByInput = {
  name?: InputMaybe<OrderDirection>;
};

/** The metadata field interface provides common fields for all metadata fields. */
export type MetadataFieldInterface = {
  collection?: Maybe<Scalars['JSON']['output']>;
  collectionId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  listProvider?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  readOnly?: Maybe<Scalars['Boolean']['output']>;
  required?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<Type>;
};

export type MuiEventInfo = {
  isPublic?: Maybe<Scalars['Boolean']['output']>;
  managedAclId?: Maybe<Scalars['Long']['output']>;
  publishUrl?: Maybe<Scalars['String']['output']>;
  thumbnailUrl?: Maybe<Scalars['String']['output']>;
};

export type MuiMutation = {
  /** Delete event */
  deleteEvent?: Maybe<DeleteEventPayload>;
  /** Update event metadata */
  updateEvent: Event;
  /** Update event acl */
  updateEventAcl: Event;
  /** Update series metadata */
  updateSeries: Scalars['Boolean']['output'];
};


export type MuiMutationDeleteEventArgs = {
  id: Scalars['String']['input'];
};


export type MuiMutationUpdateEventArgs = {
  acl?: InputMaybe<AccessControlListInput>;
  id: Scalars['String']['input'];
  metadata: CommonEventMetadataInput;
  publishChanges?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MuiMutationUpdateEventAclArgs = {
  acl: AccessControlListInput;
  id: Scalars['String']['input'];
  publishChanges?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MuiMutationUpdateSeriesArgs = {
  acl?: InputMaybe<AccessControlListInput>;
  id: Scalars['String']['input'];
  metadata: CommonSeriesMetadataInput;
};

export type MuiSeriesInfo = {
  isPublic?: Maybe<Scalars['Boolean']['output']>;
  managedAclId?: Maybe<Scalars['Long']['output']>;
};

export type Mutation = {
  /** Create playlist from metadata, entries and acl */
  createPlaylist?: Maybe<Playlist>;
  /** Create series with metadata and acl */
  createSeries: Series;
  /** Delete event */
  deleteEvent?: Maybe<DeleteEventPayload>;
  /** Delete playlist */
  deletePlaylist?: Maybe<DeletePlaylistPayload>;
  mui?: Maybe<MuiMutation>;
  /** Update event metadata */
  updateEvent: Event;
  /** Update event acl */
  updateEventAcl: Event;
  /** Update playlist with metadata, entries and acl */
  updatePlaylist?: Maybe<Playlist>;
  /** Update series metadata and optional the acl */
  updateSeries: Series;
  /** Update series acl */
  updateSeriesAcl: Series;
};


export type MutationCreatePlaylistArgs = {
  acl: AccessControlListInput;
  entries?: InputMaybe<Array<InputMaybe<PlaylistEntryInput>>>;
  metadata: PlaylistMetadataInput;
};


export type MutationCreateSeriesArgs = {
  acl: AccessControlListInput;
  metadata: CommonSeriesMetadataInput;
};


export type MutationDeleteEventArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeletePlaylistArgs = {
  id: Scalars['String']['input'];
};


export type MutationUpdateEventArgs = {
  acl?: InputMaybe<AccessControlListInput>;
  id: Scalars['String']['input'];
  metadata: CommonEventMetadataInput;
};


export type MutationUpdateEventAclArgs = {
  acl: AccessControlListInput;
  id: Scalars['String']['input'];
};


export type MutationUpdatePlaylistArgs = {
  acl?: InputMaybe<AccessControlListInput>;
  entries?: InputMaybe<Array<InputMaybe<PlaylistEntryInput>>>;
  id: Scalars['String']['input'];
  metadata?: InputMaybe<PlaylistMetadataInput>;
};


export type MutationUpdateSeriesArgs = {
  acl?: InputMaybe<AccessControlListInput>;
  id: Scalars['String']['input'];
  metadata: CommonSeriesMetadataInput;
};


export type MutationUpdateSeriesAclArgs = {
  acl: AccessControlListInput;
  id: Scalars['String']['input'];
};

export type OffsetPageInfo = {
  limit: Scalars['Long']['output'];
  offset: Scalars['Long']['output'];
  pageCount: Scalars['Long']['output'];
};

/** The direction of the order */
export enum OrderDirection {
  /** ASC */
  Asc = 'ASC',
  /** DESC */
  Desc = 'DESC',
  /** NONE */
  None = 'NONE'
}

/** Information about pagination in a connection. */
export type PageInfo = {
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** A playlist of events. */
export type Playlist = {
  accessControlEntries?: Maybe<Array<Maybe<PlaylistAccessControlEntry>>>;
  creator?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  entries?: Maybe<Array<Maybe<PlaylistEntry>>>;
  id: Scalars['ID']['output'];
  title?: Maybe<Scalars['String']['output']>;
  updated?: Maybe<Scalars['DateTime']['output']>;
};

/** An access control entry for a playlist. */
export type PlaylistAccessControlEntry = {
  action?: Maybe<Scalars['String']['output']>;
  allow?: Maybe<Scalars['Boolean']['output']>;
  role?: Maybe<Scalars['String']['output']>;
};

/** An entry in a playlist. */
export type PlaylistEntry = {
  contentId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Long']['output']>;
  type?: Maybe<PlaylistEntryType>;
};

/** Input type for a playlist entry. */
export type PlaylistEntryInput = {
  contentId: Scalars['String']['input'];
  type: PlaylistEntryType;
};

/** The type of a playlist entry. */
export enum PlaylistEntryType {
  /** EVENT */
  Event = 'EVENT',
  /** INACCESSIBLE */
  Inaccessible = 'INACCESSIBLE'
}

/** A list of playlists */
export type PlaylistList = {
  nodes: Array<Maybe<Playlist>>;
  pageInfo: OffsetPageInfo;
  totalCount: Scalars['Long']['output'];
};

/** Input type for playlist metadata, including title and description. */
export type PlaylistMetadataInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Fields to sort playlists by. The order of the sort is the same as the order of the fields. */
export type PlaylistOrderByInput = {
  creator?: InputMaybe<OrderDirection>;
  deletionDate?: InputMaybe<OrderDirection>;
  description?: InputMaybe<OrderDirection>;
  organization?: InputMaybe<OrderDirection>;
  title?: InputMaybe<OrderDirection>;
  updated?: InputMaybe<OrderDirection>;
};

export type Publication = {
  channel?: Maybe<Scalars['String']['output']>;
  flavor?: Maybe<Scalars['String']['output']>;
  mimeType?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Return tracks filterable by tags */
  tracks?: Maybe<Array<Maybe<Track>>>;
  uri?: Maybe<Scalars['String']['output']>;
};


export type PublicationTracksArgs = {
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Query = {
  /** Returns event list */
  allEvents: EventList;
  /** Returns playlist list */
  allPlaylists: PlaylistList;
  /** Returns series list */
  allSeries: SeriesList;
  /** The current user */
  currentUser: CurrentUser;
  /** Returns a event by id */
  eventById?: Maybe<Event>;
  /** Returns list provider */
  listProvider: ListProvider;
  /** A list of managed access control lists */
  managedAcls: ManagedAccessControlListCatalogue;
  /** Returns a playlist by id */
  playlistById?: Maybe<Playlist>;
  /** Search for users */
  searchUser: UserList;
  /** Returns a series by id */
  seriesById?: Maybe<Series>;
};


export type QueryAllEventsArgs = {
  filterBy?: InputMaybe<EventFilterByInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EventOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAllPlaylistsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PlaylistOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAllSeriesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SeriesOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEventByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryListProviderArgs = {
  filter?: InputMaybe<Scalars['String']['input']>;
  inverse?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryManagedAclsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ManagedAclOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPlaylistByIdArgs = {
  id: Scalars['String']['input'];
};


export type QuerySearchUserArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySeriesByIdArgs = {
  id: Scalars['String']['input'];
};

/** A series of episodes. */
export type Series = {
  acl: AccessControlList;
  /** Common metadata of the series. */
  commonMetadataV2: CommonSeriesMetadataV2;
  contributors?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  created?: Maybe<Scalars['String']['output']>;
  creator?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  /** A list of events under the owner. */
  events: EventList;
  id: Scalars['ID']['output'];
  license?: Maybe<Scalars['String']['output']>;
  muiSeriesInfo?: Maybe<MuiSeriesInfo>;
  organizers?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  publishers?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  rightsHolder?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};


/** A series of episodes. */
export type SeriesEventsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EventOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
};

/** A list of series */
export type SeriesList = {
  nodes: Array<Maybe<Series>>;
  pageInfo: OffsetPageInfo;
  totalCount: Scalars['Long']['output'];
};

/** Fields to sort series by. The order of the sort is the same as the order of the fields. */
export type SeriesOrderByInput = {
  contributors?: InputMaybe<OrderDirection>;
  created?: InputMaybe<OrderDirection>;
  creator?: InputMaybe<OrderDirection>;
  description?: InputMaybe<OrderDirection>;
  language?: InputMaybe<OrderDirection>;
  license?: InputMaybe<OrderDirection>;
  publishers?: InputMaybe<OrderDirection>;
  rightHolder?: InputMaybe<OrderDirection>;
  subject?: InputMaybe<OrderDirection>;
  title?: InputMaybe<OrderDirection>;
};

export type StringMetadataField = MetadataFieldInterface & {
  collection?: Maybe<Scalars['JSON']['output']>;
  collectionId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  listProvider?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  readOnly?: Maybe<Scalars['Boolean']['output']>;
  required?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<Type>;
  value?: Maybe<Scalars['String']['output']>;
};

export type Track = {
  flavor?: Maybe<Scalars['String']['output']>;
  frameRate?: Maybe<Scalars['Float']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  isLive?: Maybe<Scalars['Boolean']['output']>;
  logicalName?: Maybe<Scalars['String']['output']>;
  mimeType?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  uri?: Maybe<Scalars['String']['output']>;
  width?: Maybe<Scalars['Int']['output']>;
};

export enum Type {
  /** BOOLEAN */
  Boolean = 'BOOLEAN',
  /** DATE */
  Date = 'DATE',
  /** DURATION */
  Duration = 'DURATION',
  /** ITERABLE_TEXT */
  IterableText = 'ITERABLE_TEXT',
  /** LONG */
  Long = 'LONG',
  /** MIXED_TEXT */
  MixedText = 'MIXED_TEXT',
  /** ORDERED_TEXT */
  OrderedText = 'ORDERED_TEXT',
  /** START_DATE */
  StartDate = 'START_DATE',
  /** START_TIME */
  StartTime = 'START_TIME',
  /** TEXT */
  Text = 'TEXT',
  /** TEXT_LONG */
  TextLong = 'TEXT_LONG'
}

export type User = {
  email?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  provider?: Maybe<Scalars['String']['output']>;
  /** A list of roles assigned to the user. */
  roles: Array<Maybe<Scalars['String']['output']>>;
  /** The role of the user. */
  userRole: Scalars['String']['output'];
  username?: Maybe<Scalars['String']['output']>;
};

/** A list of users */
export type UserList = {
  nodes: Array<Maybe<User>>;
  pageInfo: OffsetPageInfo;
  totalCount: Scalars['Long']['output'];
};

export type MuiCurrentUserFieldsFragment = { __typename: 'CurrentUser' };

export type MuiUserFieldsFragment = { __typename: 'User' };

export type MuiUserQueryVariables = Exact<{ [key: string]: never; }>;


export type MuiUserQuery = { currentUser: { __typename: 'CurrentUser', email?: string | null, name?: string | null, username?: string | null, userRole: string } };

export type MuiSearchUserQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
}>;


export type MuiSearchUserQuery = { searchUser: { totalCount: any, nodes: Array<{ __typename: 'User', email?: string | null, name?: string | null, provider?: string | null, roles: Array<string | null>, userRole: string, username?: string | null } | null>, pageInfo: { limit: any, offset: any, pageCount: any } } };

export type MuiSeriesFieldsFragment = { __typename: 'Series' };

export type MuiSeriesDataFragment = { __typename: 'Series', id: string, contributors?: Array<string | null> | null, created?: string | null, creator?: string | null, description?: string | null, title: string, events: { totalCount: any, nodes: Array<{ id: string, title: string, eventStatus: string } | null> }, muiSeriesInfo?: { isPublic?: boolean | null, managedAclId?: any | null } | null };

export type MuiGetMySeriesQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SeriesOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
}>;


export type MuiGetMySeriesQuery = { currentUser: { mySeries: { totalCount: any, nodes: Array<{ __typename: 'Series', id: string, contributors?: Array<string | null> | null, created?: string | null, creator?: string | null, description?: string | null, title: string, events: { totalCount: any, nodes: Array<{ id: string, title: string, eventStatus: string } | null> }, muiSeriesInfo?: { isPublic?: boolean | null, managedAclId?: any | null } | null } | null> } } };

export type MuiGetSeriesInfoQueryVariables = Exact<{
  seriesId: Scalars['String']['input'];
}>;


export type MuiGetSeriesInfoQuery = { seriesById?: { contributors?: Array<string | null> | null, created?: string | null, creator?: string | null, description?: string | null, id: string, license?: string | null, organizers?: Array<string | null> | null, publishers?: Array<string | null> | null, rightsHolder?: string | null, title: string, events: { totalCount: any, nodes: Array<{ id: string } | null> } } | null };

export type MuiGetInputFieldsMetaDataFragment = { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: any | null };

export type MuiGetListInputFieldsMetaDataFragment = { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: Array<string | null> | null };

export type MuiGetStringInputFieldsMetaDataFragment = { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null };

export type MuiGetDurationInputFieldsMetaDataFragment = { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: any | null };

export type MuiGetDateTimeInputFieldsMetaDataFragment = { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: any | null };

export type MuiGetSeriesByIdInputFieldsQueryVariables = Exact<{
  seriesId: Scalars['String']['input'];
}>;


export type MuiGetSeriesByIdInputFieldsQuery = { seriesById?: { commonMetadataV2: { contributor?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: Array<string | null> | null } | null, title?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, subject?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, rightsHolder?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, publisher?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: Array<string | null> | null } | null, license?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, language?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, identifier?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, description?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, creator?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: Array<string | null> | null } | null } } | null };

export type MuiGetMySeriesNameAndIdQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SeriesOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
}>;


export type MuiGetMySeriesNameAndIdQuery = { currentUser: { mySeries: { nodes: Array<{ id: string, title: string } | null> } } };

export type MuiGetSeriesNameByIdQueryVariables = Exact<{
  seriesId: Scalars['String']['input'];
}>;


export type MuiGetSeriesNameByIdQuery = { seriesById?: { title: string } | null };

export type MuiEventFieldsFragment = { __typename: 'Event' };

export type MuiEventsDataFragment = { __typename: 'Event', contributors?: Array<string | null> | null, seriesName?: string | null, seriesId?: string | null, title: string, creator?: string | null, created?: any | null, description?: string | null, displayableStatus?: string | null, eventStatus: string, duration?: any | null, hasPreview: boolean, id: string, location?: string | null, presenters?: Array<string | null> | null, startDate?: any | null, publications?: Array<{ uri?: string | null, tracks?: Array<{ width?: number | null, uri?: string | null, tags?: Array<string | null> | null, mimeType?: string | null, logicalName?: string | null, isLive?: boolean | null, height?: number | null, frameRate?: number | null, flavor?: string | null } | null> | null } | null> | null, muiEventInfo?: { isPublic?: boolean | null, managedAclId?: any | null, publishUrl?: string | null, thumbnailUrl?: string | null } | null };

export type MuiEventsFromSeriesQueryVariables = Exact<{
  seriesId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EventOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
}>;


export type MuiEventsFromSeriesQuery = { seriesById?: { id: string, title: string, events: { totalCount: any, nodes: Array<{ __typename: 'Event', contributors?: Array<string | null> | null, seriesName?: string | null, seriesId?: string | null, title: string, creator?: string | null, created?: any | null, description?: string | null, displayableStatus?: string | null, eventStatus: string, duration?: any | null, hasPreview: boolean, id: string, location?: string | null, presenters?: Array<string | null> | null, startDate?: any | null, publications?: Array<{ uri?: string | null, tracks?: Array<{ width?: number | null, uri?: string | null, tags?: Array<string | null> | null, mimeType?: string | null, logicalName?: string | null, isLive?: boolean | null, height?: number | null, frameRate?: number | null, flavor?: string | null } | null> | null } | null> | null, muiEventInfo?: { isPublic?: boolean | null, managedAclId?: any | null, publishUrl?: string | null, thumbnailUrl?: string | null } | null } | null> } } | null };

export type MuiGetMyEventsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EventOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
}>;


export type MuiGetMyEventsQuery = { currentUser: { myEvents: { totalCount: any, nodes: Array<{ __typename: 'Event', contributors?: Array<string | null> | null, seriesName?: string | null, seriesId?: string | null, title: string, creator?: string | null, created?: any | null, description?: string | null, displayableStatus?: string | null, eventStatus: string, duration?: any | null, hasPreview: boolean, id: string, location?: string | null, presenters?: Array<string | null> | null, startDate?: any | null, publications?: Array<{ uri?: string | null, tracks?: Array<{ width?: number | null, uri?: string | null, tags?: Array<string | null> | null, mimeType?: string | null, logicalName?: string | null, isLive?: boolean | null, height?: number | null, frameRate?: number | null, flavor?: string | null } | null> | null } | null> | null, muiEventInfo?: { isPublic?: boolean | null, managedAclId?: any | null, publishUrl?: string | null, thumbnailUrl?: string | null } | null } | null> } } };

export type MuiGetEventByIdQueryVariables = Exact<{
  eventId: Scalars['String']['input'];
}>;


export type MuiGetEventByIdQuery = { eventById?: { id: string, title: string } | null };

export type MuiGetEventByIdInputFieldsQueryVariables = Exact<{
  eventId: Scalars['String']['input'];
}>;


export type MuiGetEventByIdInputFieldsQuery = { eventById?: { commonMetadataV2: { contributor?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: Array<string | null> | null } | null, created?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: any | null } | null, creator?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: Array<string | null> | null } | null, description?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, duration?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: any | null } | null, identifier?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, isPartOf?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, language?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, license?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, location?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, publisher?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, rightsHolder?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, source?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, startDate?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: any | null } | null, subject?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, title?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null } } | null };

export type MuiGetAllManagedAclsQueryVariables = Exact<{ [key: string]: never; }>;


export type MuiGetAllManagedAclsQuery = { managedAcls: { nodes: Array<{ name: string, id: string, acl: { entries?: Array<{ role?: string | null, action?: Array<string | null> | null } | { role?: string | null, action?: Array<string | null> | null } | { role?: string | null, action?: Array<string | null> | null } | null> | null } } | null> } };

export type MuiGetManagedAclsWithEventIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type MuiGetManagedAclsWithEventIdQuery = { managedAcls: { nodes: Array<{ name: string, id: string, acl: { entries?: Array<{ role?: string | null, action?: Array<string | null> | null } | { role?: string | null, action?: Array<string | null> | null } | { role?: string | null, action?: Array<string | null> | null } | null> | null } } | null> }, eventById?: { acl: { users?: Array<{ role?: string | null, label?: string | null, action?: Array<string | null> | null } | null> | null } } | null };

export type MuiGetManagedAclsWithSeriesIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type MuiGetManagedAclsWithSeriesIdQuery = { managedAcls: { nodes: Array<{ name: string, id: string, acl: { entries?: Array<{ role?: string | null, action?: Array<string | null> | null } | { role?: string | null, action?: Array<string | null> | null } | { role?: string | null, action?: Array<string | null> | null } | null> | null } } | null> }, seriesById?: { acl: { users?: Array<{ role?: string | null, label?: string | null, action?: Array<string | null> | null } | null> | null } } | null };

export type MuiEventsAclDataFragment = { eventById?: { acl: { users?: Array<{ role?: string | null, label?: string | null, action?: Array<string | null> | null } | null> | null } } | null };

export type MuiSeriesAclDataFragment = { seriesById?: { acl: { users?: Array<{ role?: string | null, label?: string | null, action?: Array<string | null> | null } | null> | null } } | null };

export type MuiCreateSeriesMutationVariables = Exact<{
  acl: AccessControlListInput;
  metadata: CommonSeriesMetadataInput;
}>;


export type MuiCreateSeriesMutation = { createSeries: { __typename: 'Series', id: string, contributors?: Array<string | null> | null, created?: string | null, creator?: string | null, description?: string | null, title: string, events: { totalCount: any, nodes: Array<{ id: string, title: string, eventStatus: string } | null> }, muiSeriesInfo?: { isPublic?: boolean | null, managedAclId?: any | null } | null } };

export type MuiUpdateSeriesMutationVariables = Exact<{
  seriesId: Scalars['String']['input'];
  metadata: CommonSeriesMetadataInput;
}>;


export type MuiUpdateSeriesMutation = { updateSeries: { __typename: 'Series', id: string, contributors?: Array<string | null> | null, created?: string | null, creator?: string | null, description?: string | null, title: string, events: { totalCount: any, nodes: Array<{ id: string, title: string, eventStatus: string } | null> }, muiSeriesInfo?: { isPublic?: boolean | null, managedAclId?: any | null } | null } };

export type MuiUpdateEventMutationVariables = Exact<{
  eventId: Scalars['String']['input'];
  metadata: CommonEventMetadataInput;
}>;


export type MuiUpdateEventMutation = { mui?: { updateEvent: { __typename: 'Event', contributors?: Array<string | null> | null, seriesName?: string | null, seriesId?: string | null, title: string, creator?: string | null, created?: any | null, description?: string | null, displayableStatus?: string | null, eventStatus: string, duration?: any | null, hasPreview: boolean, id: string, location?: string | null, presenters?: Array<string | null> | null, startDate?: any | null, publications?: Array<{ uri?: string | null, tracks?: Array<{ width?: number | null, uri?: string | null, tags?: Array<string | null> | null, mimeType?: string | null, logicalName?: string | null, isLive?: boolean | null, height?: number | null, frameRate?: number | null, flavor?: string | null } | null> | null } | null> | null, muiEventInfo?: { isPublic?: boolean | null, managedAclId?: any | null, publishUrl?: string | null, thumbnailUrl?: string | null } | null } } | null };

export type MuiDeleteEventMutationVariables = Exact<{
  eventId: Scalars['String']['input'];
}>;


export type MuiDeleteEventMutation = { mui?: { deleteEvent?: { id?: string | null } | null } | null };

export type MuiUpdateEventAclMutationVariables = Exact<{
  eventId: Scalars['String']['input'];
  acl: AccessControlListInput;
}>;


export type MuiUpdateEventAclMutation = { mui?: { updateEventAcl: { muiEventInfo?: { managedAclId?: any | null } | null } } | null };

export type MuiUpdateSeriesAclMutationVariables = Exact<{
  seriesId: Scalars['String']['input'];
  acl: AccessControlListInput;
}>;


export type MuiUpdateSeriesAclMutation = { updateSeriesAcl: { muiSeriesInfo?: { managedAclId?: any | null } | null } };


export const MuiCurrentUserFieldsFragmentDoc = `
    fragment MuiCurrentUserFields on CurrentUser {
  __typename
}
    `;
export const MuiUserFieldsFragmentDoc = `
    fragment MuiUserFields on User {
  __typename
}
    `;
export const MuiSeriesFieldsFragmentDoc = `
    fragment MuiSeriesFields on Series {
  __typename
}
    `;
export const MuiSeriesDataFragmentDoc = `
    fragment MuiSeriesData on Series {
  __typename
  id
  contributors
  created
  creator
  description
  title
  events {
    nodes {
      id
      title
      eventStatus
    }
    totalCount
  }
  muiSeriesInfo {
    isPublic
    managedAclId
  }
  ...MuiSeriesFields
}
    ${MuiSeriesFieldsFragmentDoc}`;
export const MuiGetInputFieldsMetaDataFragmentDoc = `
    fragment MuiGetInputFieldsMetaData on JsonMetadataField {
  collectionId
  collection
  id
  label
  listProvider
  order
  readOnly
  required
  type
  value
}
    `;
export const MuiGetListInputFieldsMetaDataFragmentDoc = `
    fragment MuiGetListInputFieldsMetaData on ListMetadataField {
  collectionId
  collection
  id
  label
  listProvider
  order
  readOnly
  required
  type
  value
}
    `;
export const MuiGetStringInputFieldsMetaDataFragmentDoc = `
    fragment MuiGetStringInputFieldsMetaData on StringMetadataField {
  collectionId
  collection
  id
  label
  listProvider
  order
  readOnly
  required
  type
  value
}
    `;
export const MuiGetDurationInputFieldsMetaDataFragmentDoc = `
    fragment MuiGetDurationInputFieldsMetaData on DurationMetadataField {
  collectionId
  collection
  id
  label
  listProvider
  order
  readOnly
  required
  type
  value
}
    `;
export const MuiGetDateTimeInputFieldsMetaDataFragmentDoc = `
    fragment MuiGetDateTimeInputFieldsMetaData on DateTimeMetadataField {
  collectionId
  collection
  id
  label
  listProvider
  order
  readOnly
  required
  type
  value
}
    `;
export const MuiEventFieldsFragmentDoc = `
    fragment MuiEventFields on Event {
  __typename
}
    `;
export const MuiEventsDataFragmentDoc = `
    fragment MuiEventsData on Event {
  __typename
  contributors
  seriesName
  seriesId
  title
  creator
  created
  description
  displayableStatus
  eventStatus
  duration
  hasPreview
  id
  location
  presenters
  startDate
  publications(channel: "engage-player") {
    uri
    tracks(tags: "engage-download") {
      width
      uri
      tags
      mimeType
      logicalName
      isLive
      height
      frameRate
      flavor
    }
  }
  hasPreview
  muiEventInfo {
    isPublic
    managedAclId
    publishUrl
    thumbnailUrl
  }
  ...MuiEventFields
}
    ${MuiEventFieldsFragmentDoc}`;
export const MuiEventsAclDataFragmentDoc = `
    fragment MuiEventsAclData on Query {
  eventById(id: $id) {
    acl {
      users {
        role
        label
        action
      }
    }
  }
}
    `;
export const MuiSeriesAclDataFragmentDoc = `
    fragment MuiSeriesAclData on Query {
  seriesById(id: $id) {
    acl {
      users {
        role
        label
        action
      }
    }
  }
}
    `;
export const MuiUserDocument = `
    query MuiUser {
  currentUser {
    email
    name
    username
    userRole
    ...MuiCurrentUserFields
  }
}
    ${MuiCurrentUserFieldsFragmentDoc}`;

export const useMuiUserQuery = <
      TData = MuiUserQuery,
      TError = unknown
    >(
      variables?: MuiUserQueryVariables,
      options?: Omit<UseQueryOptions<MuiUserQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiUserQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiUserQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['MuiUser'] : ['MuiUser', variables],
    queryFn: fetchData<MuiUserQuery, MuiUserQueryVariables>(MuiUserDocument, variables),
    ...options
  }
    )};

useMuiUserQuery.getKey = (variables?: MuiUserQueryVariables) => variables === undefined ? ['MuiUser'] : ['MuiUser', variables];

export const useSuspenseMuiUserQuery = <
      TData = MuiUserQuery,
      TError = unknown
    >(
      variables?: MuiUserQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiUserQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiUserQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiUserQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['MuiUserSuspense'] : ['MuiUserSuspense', variables],
    queryFn: fetchData<MuiUserQuery, MuiUserQueryVariables>(MuiUserDocument, variables),
    ...options
  }
    )};

useSuspenseMuiUserQuery.getKey = (variables?: MuiUserQueryVariables) => variables === undefined ? ['MuiUserSuspense'] : ['MuiUserSuspense', variables];


useMuiUserQuery.fetcher = (variables?: MuiUserQueryVariables, options?: RequestInit['headers']) => fetchData<MuiUserQuery, MuiUserQueryVariables>(MuiUserDocument, variables, options);

export const MuiSearchUserDocument = `
    query MuiSearchUser($limit: Int, $offset: Int, $query: String!) {
  searchUser(limit: $limit, offset: $offset, query: $query) {
    totalCount
    nodes {
      email
      name
      provider
      roles
      userRole
      username
      ...MuiUserFields
    }
    pageInfo {
      limit
      offset
      pageCount
    }
  }
}
    ${MuiUserFieldsFragmentDoc}`;

export const useMuiSearchUserQuery = <
      TData = MuiSearchUserQuery,
      TError = unknown
    >(
      variables: MuiSearchUserQueryVariables,
      options?: Omit<UseQueryOptions<MuiSearchUserQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiSearchUserQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiSearchUserQuery, TError, TData>(
      {
    queryKey: ['MuiSearchUser', variables],
    queryFn: fetchData<MuiSearchUserQuery, MuiSearchUserQueryVariables>(MuiSearchUserDocument, variables),
    ...options
  }
    )};

useMuiSearchUserQuery.getKey = (variables: MuiSearchUserQueryVariables) => ['MuiSearchUser', variables];

export const useSuspenseMuiSearchUserQuery = <
      TData = MuiSearchUserQuery,
      TError = unknown
    >(
      variables: MuiSearchUserQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiSearchUserQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiSearchUserQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiSearchUserQuery, TError, TData>(
      {
    queryKey: ['MuiSearchUserSuspense', variables],
    queryFn: fetchData<MuiSearchUserQuery, MuiSearchUserQueryVariables>(MuiSearchUserDocument, variables),
    ...options
  }
    )};

useSuspenseMuiSearchUserQuery.getKey = (variables: MuiSearchUserQueryVariables) => ['MuiSearchUserSuspense', variables];


useMuiSearchUserQuery.fetcher = (variables: MuiSearchUserQueryVariables, options?: RequestInit['headers']) => fetchData<MuiSearchUserQuery, MuiSearchUserQueryVariables>(MuiSearchUserDocument, variables, options);

export const MuiGetMySeriesDocument = `
    query MuiGetMySeries($limit: Int, $offset: Int, $orderBy: SeriesOrderByInput, $query: String) {
  currentUser {
    mySeries(limit: $limit, offset: $offset, orderBy: $orderBy, query: $query) {
      totalCount
      nodes {
        ...MuiSeriesData
      }
    }
  }
}
    ${MuiSeriesDataFragmentDoc}`;

export const useMuiGetMySeriesQuery = <
      TData = MuiGetMySeriesQuery,
      TError = unknown
    >(
      variables?: MuiGetMySeriesQueryVariables,
      options?: Omit<UseQueryOptions<MuiGetMySeriesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiGetMySeriesQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiGetMySeriesQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['MuiGetMySeries'] : ['MuiGetMySeries', variables],
    queryFn: fetchData<MuiGetMySeriesQuery, MuiGetMySeriesQueryVariables>(MuiGetMySeriesDocument, variables),
    ...options
  }
    )};

useMuiGetMySeriesQuery.getKey = (variables?: MuiGetMySeriesQueryVariables) => variables === undefined ? ['MuiGetMySeries'] : ['MuiGetMySeries', variables];

export const useSuspenseMuiGetMySeriesQuery = <
      TData = MuiGetMySeriesQuery,
      TError = unknown
    >(
      variables?: MuiGetMySeriesQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiGetMySeriesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiGetMySeriesQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiGetMySeriesQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['MuiGetMySeriesSuspense'] : ['MuiGetMySeriesSuspense', variables],
    queryFn: fetchData<MuiGetMySeriesQuery, MuiGetMySeriesQueryVariables>(MuiGetMySeriesDocument, variables),
    ...options
  }
    )};

useSuspenseMuiGetMySeriesQuery.getKey = (variables?: MuiGetMySeriesQueryVariables) => variables === undefined ? ['MuiGetMySeriesSuspense'] : ['MuiGetMySeriesSuspense', variables];


useMuiGetMySeriesQuery.fetcher = (variables?: MuiGetMySeriesQueryVariables, options?: RequestInit['headers']) => fetchData<MuiGetMySeriesQuery, MuiGetMySeriesQueryVariables>(MuiGetMySeriesDocument, variables, options);

export const MuiGetSeriesInfoDocument = `
    query MuiGetSeriesInfo($seriesId: String!) {
  seriesById(id: $seriesId) {
    contributors
    created
    creator
    description
    events {
      nodes {
        id
      }
      totalCount
    }
    id
    license
    organizers
    publishers
    rightsHolder
    title
  }
}
    `;

export const useMuiGetSeriesInfoQuery = <
      TData = MuiGetSeriesInfoQuery,
      TError = unknown
    >(
      variables: MuiGetSeriesInfoQueryVariables,
      options?: Omit<UseQueryOptions<MuiGetSeriesInfoQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiGetSeriesInfoQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiGetSeriesInfoQuery, TError, TData>(
      {
    queryKey: ['MuiGetSeriesInfo', variables],
    queryFn: fetchData<MuiGetSeriesInfoQuery, MuiGetSeriesInfoQueryVariables>(MuiGetSeriesInfoDocument, variables),
    ...options
  }
    )};

useMuiGetSeriesInfoQuery.getKey = (variables: MuiGetSeriesInfoQueryVariables) => ['MuiGetSeriesInfo', variables];

export const useSuspenseMuiGetSeriesInfoQuery = <
      TData = MuiGetSeriesInfoQuery,
      TError = unknown
    >(
      variables: MuiGetSeriesInfoQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiGetSeriesInfoQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiGetSeriesInfoQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiGetSeriesInfoQuery, TError, TData>(
      {
    queryKey: ['MuiGetSeriesInfoSuspense', variables],
    queryFn: fetchData<MuiGetSeriesInfoQuery, MuiGetSeriesInfoQueryVariables>(MuiGetSeriesInfoDocument, variables),
    ...options
  }
    )};

useSuspenseMuiGetSeriesInfoQuery.getKey = (variables: MuiGetSeriesInfoQueryVariables) => ['MuiGetSeriesInfoSuspense', variables];


useMuiGetSeriesInfoQuery.fetcher = (variables: MuiGetSeriesInfoQueryVariables, options?: RequestInit['headers']) => fetchData<MuiGetSeriesInfoQuery, MuiGetSeriesInfoQueryVariables>(MuiGetSeriesInfoDocument, variables, options);

export const MuiGetSeriesByIdInputFieldsDocument = `
    query MuiGetSeriesByIdInputFields($seriesId: String!) {
  seriesById(id: $seriesId) {
    commonMetadataV2 {
      contributor {
        ...MuiGetListInputFieldsMetaData
      }
      title {
        ...MuiGetStringInputFieldsMetaData
      }
      subject {
        ...MuiGetStringInputFieldsMetaData
      }
      rightsHolder {
        ...MuiGetStringInputFieldsMetaData
      }
      publisher {
        ...MuiGetListInputFieldsMetaData
      }
      license {
        ...MuiGetStringInputFieldsMetaData
      }
      language {
        ...MuiGetStringInputFieldsMetaData
      }
      identifier {
        ...MuiGetStringInputFieldsMetaData
      }
      description {
        ...MuiGetStringInputFieldsMetaData
      }
      creator {
        ...MuiGetListInputFieldsMetaData
      }
    }
  }
}
    ${MuiGetListInputFieldsMetaDataFragmentDoc}
${MuiGetStringInputFieldsMetaDataFragmentDoc}`;

export const useMuiGetSeriesByIdInputFieldsQuery = <
      TData = MuiGetSeriesByIdInputFieldsQuery,
      TError = unknown
    >(
      variables: MuiGetSeriesByIdInputFieldsQueryVariables,
      options?: Omit<UseQueryOptions<MuiGetSeriesByIdInputFieldsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiGetSeriesByIdInputFieldsQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiGetSeriesByIdInputFieldsQuery, TError, TData>(
      {
    queryKey: ['MuiGetSeriesByIdInputFields', variables],
    queryFn: fetchData<MuiGetSeriesByIdInputFieldsQuery, MuiGetSeriesByIdInputFieldsQueryVariables>(MuiGetSeriesByIdInputFieldsDocument, variables),
    ...options
  }
    )};

useMuiGetSeriesByIdInputFieldsQuery.getKey = (variables: MuiGetSeriesByIdInputFieldsQueryVariables) => ['MuiGetSeriesByIdInputFields', variables];

export const useSuspenseMuiGetSeriesByIdInputFieldsQuery = <
      TData = MuiGetSeriesByIdInputFieldsQuery,
      TError = unknown
    >(
      variables: MuiGetSeriesByIdInputFieldsQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiGetSeriesByIdInputFieldsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiGetSeriesByIdInputFieldsQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiGetSeriesByIdInputFieldsQuery, TError, TData>(
      {
    queryKey: ['MuiGetSeriesByIdInputFieldsSuspense', variables],
    queryFn: fetchData<MuiGetSeriesByIdInputFieldsQuery, MuiGetSeriesByIdInputFieldsQueryVariables>(MuiGetSeriesByIdInputFieldsDocument, variables),
    ...options
  }
    )};

useSuspenseMuiGetSeriesByIdInputFieldsQuery.getKey = (variables: MuiGetSeriesByIdInputFieldsQueryVariables) => ['MuiGetSeriesByIdInputFieldsSuspense', variables];


useMuiGetSeriesByIdInputFieldsQuery.fetcher = (variables: MuiGetSeriesByIdInputFieldsQueryVariables, options?: RequestInit['headers']) => fetchData<MuiGetSeriesByIdInputFieldsQuery, MuiGetSeriesByIdInputFieldsQueryVariables>(MuiGetSeriesByIdInputFieldsDocument, variables, options);

export const MuiGetMySeriesNameAndIdDocument = `
    query MuiGetMySeriesNameAndId($limit: Int, $offset: Int, $orderBy: SeriesOrderByInput, $query: String) {
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

export const useMuiGetMySeriesNameAndIdQuery = <
      TData = MuiGetMySeriesNameAndIdQuery,
      TError = unknown
    >(
      variables?: MuiGetMySeriesNameAndIdQueryVariables,
      options?: Omit<UseQueryOptions<MuiGetMySeriesNameAndIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiGetMySeriesNameAndIdQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiGetMySeriesNameAndIdQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['MuiGetMySeriesNameAndId'] : ['MuiGetMySeriesNameAndId', variables],
    queryFn: fetchData<MuiGetMySeriesNameAndIdQuery, MuiGetMySeriesNameAndIdQueryVariables>(MuiGetMySeriesNameAndIdDocument, variables),
    ...options
  }
    )};

useMuiGetMySeriesNameAndIdQuery.getKey = (variables?: MuiGetMySeriesNameAndIdQueryVariables) => variables === undefined ? ['MuiGetMySeriesNameAndId'] : ['MuiGetMySeriesNameAndId', variables];

export const useSuspenseMuiGetMySeriesNameAndIdQuery = <
      TData = MuiGetMySeriesNameAndIdQuery,
      TError = unknown
    >(
      variables?: MuiGetMySeriesNameAndIdQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiGetMySeriesNameAndIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiGetMySeriesNameAndIdQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiGetMySeriesNameAndIdQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['MuiGetMySeriesNameAndIdSuspense'] : ['MuiGetMySeriesNameAndIdSuspense', variables],
    queryFn: fetchData<MuiGetMySeriesNameAndIdQuery, MuiGetMySeriesNameAndIdQueryVariables>(MuiGetMySeriesNameAndIdDocument, variables),
    ...options
  }
    )};

useSuspenseMuiGetMySeriesNameAndIdQuery.getKey = (variables?: MuiGetMySeriesNameAndIdQueryVariables) => variables === undefined ? ['MuiGetMySeriesNameAndIdSuspense'] : ['MuiGetMySeriesNameAndIdSuspense', variables];


useMuiGetMySeriesNameAndIdQuery.fetcher = (variables?: MuiGetMySeriesNameAndIdQueryVariables, options?: RequestInit['headers']) => fetchData<MuiGetMySeriesNameAndIdQuery, MuiGetMySeriesNameAndIdQueryVariables>(MuiGetMySeriesNameAndIdDocument, variables, options);

export const MuiGetSeriesNameByIdDocument = `
    query MuiGetSeriesNameById($seriesId: String!) {
  seriesById(id: $seriesId) {
    title
  }
}
    `;

export const useMuiGetSeriesNameByIdQuery = <
      TData = MuiGetSeriesNameByIdQuery,
      TError = unknown
    >(
      variables: MuiGetSeriesNameByIdQueryVariables,
      options?: Omit<UseQueryOptions<MuiGetSeriesNameByIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiGetSeriesNameByIdQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiGetSeriesNameByIdQuery, TError, TData>(
      {
    queryKey: ['MuiGetSeriesNameById', variables],
    queryFn: fetchData<MuiGetSeriesNameByIdQuery, MuiGetSeriesNameByIdQueryVariables>(MuiGetSeriesNameByIdDocument, variables),
    ...options
  }
    )};

useMuiGetSeriesNameByIdQuery.getKey = (variables: MuiGetSeriesNameByIdQueryVariables) => ['MuiGetSeriesNameById', variables];

export const useSuspenseMuiGetSeriesNameByIdQuery = <
      TData = MuiGetSeriesNameByIdQuery,
      TError = unknown
    >(
      variables: MuiGetSeriesNameByIdQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiGetSeriesNameByIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiGetSeriesNameByIdQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiGetSeriesNameByIdQuery, TError, TData>(
      {
    queryKey: ['MuiGetSeriesNameByIdSuspense', variables],
    queryFn: fetchData<MuiGetSeriesNameByIdQuery, MuiGetSeriesNameByIdQueryVariables>(MuiGetSeriesNameByIdDocument, variables),
    ...options
  }
    )};

useSuspenseMuiGetSeriesNameByIdQuery.getKey = (variables: MuiGetSeriesNameByIdQueryVariables) => ['MuiGetSeriesNameByIdSuspense', variables];


useMuiGetSeriesNameByIdQuery.fetcher = (variables: MuiGetSeriesNameByIdQueryVariables, options?: RequestInit['headers']) => fetchData<MuiGetSeriesNameByIdQuery, MuiGetSeriesNameByIdQueryVariables>(MuiGetSeriesNameByIdDocument, variables, options);

export const MuiEventsFromSeriesDocument = `
    query MuiEventsFromSeries($seriesId: String!, $limit: Int, $offset: Int, $orderBy: EventOrderByInput, $query: String) {
  seriesById(id: $seriesId) {
    id
    title
    events(limit: $limit, offset: $offset, orderBy: $orderBy, query: $query) {
      totalCount
      nodes {
        ...MuiEventsData
      }
    }
  }
}
    ${MuiEventsDataFragmentDoc}`;

export const useMuiEventsFromSeriesQuery = <
      TData = MuiEventsFromSeriesQuery,
      TError = unknown
    >(
      variables: MuiEventsFromSeriesQueryVariables,
      options?: Omit<UseQueryOptions<MuiEventsFromSeriesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiEventsFromSeriesQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiEventsFromSeriesQuery, TError, TData>(
      {
    queryKey: ['MuiEventsFromSeries', variables],
    queryFn: fetchData<MuiEventsFromSeriesQuery, MuiEventsFromSeriesQueryVariables>(MuiEventsFromSeriesDocument, variables),
    ...options
  }
    )};

useMuiEventsFromSeriesQuery.getKey = (variables: MuiEventsFromSeriesQueryVariables) => ['MuiEventsFromSeries', variables];

export const useSuspenseMuiEventsFromSeriesQuery = <
      TData = MuiEventsFromSeriesQuery,
      TError = unknown
    >(
      variables: MuiEventsFromSeriesQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiEventsFromSeriesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiEventsFromSeriesQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiEventsFromSeriesQuery, TError, TData>(
      {
    queryKey: ['MuiEventsFromSeriesSuspense', variables],
    queryFn: fetchData<MuiEventsFromSeriesQuery, MuiEventsFromSeriesQueryVariables>(MuiEventsFromSeriesDocument, variables),
    ...options
  }
    )};

useSuspenseMuiEventsFromSeriesQuery.getKey = (variables: MuiEventsFromSeriesQueryVariables) => ['MuiEventsFromSeriesSuspense', variables];


useMuiEventsFromSeriesQuery.fetcher = (variables: MuiEventsFromSeriesQueryVariables, options?: RequestInit['headers']) => fetchData<MuiEventsFromSeriesQuery, MuiEventsFromSeriesQueryVariables>(MuiEventsFromSeriesDocument, variables, options);

export const MuiGetMyEventsDocument = `
    query MuiGetMyEvents($limit: Int, $offset: Int, $orderBy: EventOrderByInput, $query: String) {
  currentUser {
    myEvents(limit: $limit, offset: $offset, orderBy: $orderBy, query: $query) {
      totalCount
      nodes {
        ...MuiEventsData
      }
    }
  }
}
    ${MuiEventsDataFragmentDoc}`;

export const useMuiGetMyEventsQuery = <
      TData = MuiGetMyEventsQuery,
      TError = unknown
    >(
      variables?: MuiGetMyEventsQueryVariables,
      options?: Omit<UseQueryOptions<MuiGetMyEventsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiGetMyEventsQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiGetMyEventsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['MuiGetMyEvents'] : ['MuiGetMyEvents', variables],
    queryFn: fetchData<MuiGetMyEventsQuery, MuiGetMyEventsQueryVariables>(MuiGetMyEventsDocument, variables),
    ...options
  }
    )};

useMuiGetMyEventsQuery.getKey = (variables?: MuiGetMyEventsQueryVariables) => variables === undefined ? ['MuiGetMyEvents'] : ['MuiGetMyEvents', variables];

export const useSuspenseMuiGetMyEventsQuery = <
      TData = MuiGetMyEventsQuery,
      TError = unknown
    >(
      variables?: MuiGetMyEventsQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiGetMyEventsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiGetMyEventsQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiGetMyEventsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['MuiGetMyEventsSuspense'] : ['MuiGetMyEventsSuspense', variables],
    queryFn: fetchData<MuiGetMyEventsQuery, MuiGetMyEventsQueryVariables>(MuiGetMyEventsDocument, variables),
    ...options
  }
    )};

useSuspenseMuiGetMyEventsQuery.getKey = (variables?: MuiGetMyEventsQueryVariables) => variables === undefined ? ['MuiGetMyEventsSuspense'] : ['MuiGetMyEventsSuspense', variables];


useMuiGetMyEventsQuery.fetcher = (variables?: MuiGetMyEventsQueryVariables, options?: RequestInit['headers']) => fetchData<MuiGetMyEventsQuery, MuiGetMyEventsQueryVariables>(MuiGetMyEventsDocument, variables, options);

export const MuiGetEventByIdDocument = `
    query MuiGetEventById($eventId: String!) {
  eventById(id: $eventId) {
    id
    title
  }
}
    `;

export const useMuiGetEventByIdQuery = <
      TData = MuiGetEventByIdQuery,
      TError = unknown
    >(
      variables: MuiGetEventByIdQueryVariables,
      options?: Omit<UseQueryOptions<MuiGetEventByIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiGetEventByIdQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiGetEventByIdQuery, TError, TData>(
      {
    queryKey: ['MuiGetEventById', variables],
    queryFn: fetchData<MuiGetEventByIdQuery, MuiGetEventByIdQueryVariables>(MuiGetEventByIdDocument, variables),
    ...options
  }
    )};

useMuiGetEventByIdQuery.getKey = (variables: MuiGetEventByIdQueryVariables) => ['MuiGetEventById', variables];

export const useSuspenseMuiGetEventByIdQuery = <
      TData = MuiGetEventByIdQuery,
      TError = unknown
    >(
      variables: MuiGetEventByIdQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiGetEventByIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiGetEventByIdQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiGetEventByIdQuery, TError, TData>(
      {
    queryKey: ['MuiGetEventByIdSuspense', variables],
    queryFn: fetchData<MuiGetEventByIdQuery, MuiGetEventByIdQueryVariables>(MuiGetEventByIdDocument, variables),
    ...options
  }
    )};

useSuspenseMuiGetEventByIdQuery.getKey = (variables: MuiGetEventByIdQueryVariables) => ['MuiGetEventByIdSuspense', variables];


useMuiGetEventByIdQuery.fetcher = (variables: MuiGetEventByIdQueryVariables, options?: RequestInit['headers']) => fetchData<MuiGetEventByIdQuery, MuiGetEventByIdQueryVariables>(MuiGetEventByIdDocument, variables, options);

export const MuiGetEventByIdInputFieldsDocument = `
    query MuiGetEventByIdInputFields($eventId: String!) {
  eventById(id: $eventId) {
    commonMetadataV2 {
      contributor {
        ...MuiGetListInputFieldsMetaData
      }
      created {
        ...MuiGetDateTimeInputFieldsMetaData
      }
      creator {
        ...MuiGetListInputFieldsMetaData
      }
      description {
        ...MuiGetStringInputFieldsMetaData
      }
      duration {
        ...MuiGetDurationInputFieldsMetaData
      }
      identifier {
        ...MuiGetStringInputFieldsMetaData
      }
      isPartOf {
        ...MuiGetStringInputFieldsMetaData
      }
      language {
        ...MuiGetStringInputFieldsMetaData
      }
      license {
        ...MuiGetStringInputFieldsMetaData
      }
      location {
        ...MuiGetStringInputFieldsMetaData
      }
      publisher {
        ...MuiGetStringInputFieldsMetaData
      }
      rightsHolder {
        ...MuiGetStringInputFieldsMetaData
      }
      source {
        ...MuiGetStringInputFieldsMetaData
      }
      startDate {
        ...MuiGetDateTimeInputFieldsMetaData
      }
      subject {
        ...MuiGetStringInputFieldsMetaData
      }
      title {
        ...MuiGetStringInputFieldsMetaData
      }
    }
  }
}
    ${MuiGetListInputFieldsMetaDataFragmentDoc}
${MuiGetDateTimeInputFieldsMetaDataFragmentDoc}
${MuiGetStringInputFieldsMetaDataFragmentDoc}
${MuiGetDurationInputFieldsMetaDataFragmentDoc}`;

export const useMuiGetEventByIdInputFieldsQuery = <
      TData = MuiGetEventByIdInputFieldsQuery,
      TError = unknown
    >(
      variables: MuiGetEventByIdInputFieldsQueryVariables,
      options?: Omit<UseQueryOptions<MuiGetEventByIdInputFieldsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiGetEventByIdInputFieldsQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiGetEventByIdInputFieldsQuery, TError, TData>(
      {
    queryKey: ['MuiGetEventByIdInputFields', variables],
    queryFn: fetchData<MuiGetEventByIdInputFieldsQuery, MuiGetEventByIdInputFieldsQueryVariables>(MuiGetEventByIdInputFieldsDocument, variables),
    ...options
  }
    )};

useMuiGetEventByIdInputFieldsQuery.getKey = (variables: MuiGetEventByIdInputFieldsQueryVariables) => ['MuiGetEventByIdInputFields', variables];

export const useSuspenseMuiGetEventByIdInputFieldsQuery = <
      TData = MuiGetEventByIdInputFieldsQuery,
      TError = unknown
    >(
      variables: MuiGetEventByIdInputFieldsQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiGetEventByIdInputFieldsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiGetEventByIdInputFieldsQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiGetEventByIdInputFieldsQuery, TError, TData>(
      {
    queryKey: ['MuiGetEventByIdInputFieldsSuspense', variables],
    queryFn: fetchData<MuiGetEventByIdInputFieldsQuery, MuiGetEventByIdInputFieldsQueryVariables>(MuiGetEventByIdInputFieldsDocument, variables),
    ...options
  }
    )};

useSuspenseMuiGetEventByIdInputFieldsQuery.getKey = (variables: MuiGetEventByIdInputFieldsQueryVariables) => ['MuiGetEventByIdInputFieldsSuspense', variables];


useMuiGetEventByIdInputFieldsQuery.fetcher = (variables: MuiGetEventByIdInputFieldsQueryVariables, options?: RequestInit['headers']) => fetchData<MuiGetEventByIdInputFieldsQuery, MuiGetEventByIdInputFieldsQueryVariables>(MuiGetEventByIdInputFieldsDocument, variables, options);

export const MuiGetAllManagedAclsDocument = `
    query MuiGetAllManagedAcls {
  managedAcls {
    nodes {
      name
      id
      acl {
        entries {
          role
          action
        }
      }
    }
  }
}
    `;

export const useMuiGetAllManagedAclsQuery = <
      TData = MuiGetAllManagedAclsQuery,
      TError = unknown
    >(
      variables?: MuiGetAllManagedAclsQueryVariables,
      options?: Omit<UseQueryOptions<MuiGetAllManagedAclsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiGetAllManagedAclsQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiGetAllManagedAclsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['MuiGetAllManagedAcls'] : ['MuiGetAllManagedAcls', variables],
    queryFn: fetchData<MuiGetAllManagedAclsQuery, MuiGetAllManagedAclsQueryVariables>(MuiGetAllManagedAclsDocument, variables),
    ...options
  }
    )};

useMuiGetAllManagedAclsQuery.getKey = (variables?: MuiGetAllManagedAclsQueryVariables) => variables === undefined ? ['MuiGetAllManagedAcls'] : ['MuiGetAllManagedAcls', variables];

export const useSuspenseMuiGetAllManagedAclsQuery = <
      TData = MuiGetAllManagedAclsQuery,
      TError = unknown
    >(
      variables?: MuiGetAllManagedAclsQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiGetAllManagedAclsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiGetAllManagedAclsQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiGetAllManagedAclsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['MuiGetAllManagedAclsSuspense'] : ['MuiGetAllManagedAclsSuspense', variables],
    queryFn: fetchData<MuiGetAllManagedAclsQuery, MuiGetAllManagedAclsQueryVariables>(MuiGetAllManagedAclsDocument, variables),
    ...options
  }
    )};

useSuspenseMuiGetAllManagedAclsQuery.getKey = (variables?: MuiGetAllManagedAclsQueryVariables) => variables === undefined ? ['MuiGetAllManagedAclsSuspense'] : ['MuiGetAllManagedAclsSuspense', variables];


useMuiGetAllManagedAclsQuery.fetcher = (variables?: MuiGetAllManagedAclsQueryVariables, options?: RequestInit['headers']) => fetchData<MuiGetAllManagedAclsQuery, MuiGetAllManagedAclsQueryVariables>(MuiGetAllManagedAclsDocument, variables, options);

export const MuiGetManagedAclsWithEventIdDocument = `
    query MuiGetManagedAclsWithEventId($id: String!) {
  managedAcls {
    nodes {
      name
      id
      acl {
        entries {
          role
          action
        }
      }
    }
  }
  ...MuiEventsAclData
}
    ${MuiEventsAclDataFragmentDoc}`;

export const useMuiGetManagedAclsWithEventIdQuery = <
      TData = MuiGetManagedAclsWithEventIdQuery,
      TError = unknown
    >(
      variables: MuiGetManagedAclsWithEventIdQueryVariables,
      options?: Omit<UseQueryOptions<MuiGetManagedAclsWithEventIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiGetManagedAclsWithEventIdQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiGetManagedAclsWithEventIdQuery, TError, TData>(
      {
    queryKey: ['MuiGetManagedAclsWithEventId', variables],
    queryFn: fetchData<MuiGetManagedAclsWithEventIdQuery, MuiGetManagedAclsWithEventIdQueryVariables>(MuiGetManagedAclsWithEventIdDocument, variables),
    ...options
  }
    )};

useMuiGetManagedAclsWithEventIdQuery.getKey = (variables: MuiGetManagedAclsWithEventIdQueryVariables) => ['MuiGetManagedAclsWithEventId', variables];

export const useSuspenseMuiGetManagedAclsWithEventIdQuery = <
      TData = MuiGetManagedAclsWithEventIdQuery,
      TError = unknown
    >(
      variables: MuiGetManagedAclsWithEventIdQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiGetManagedAclsWithEventIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiGetManagedAclsWithEventIdQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiGetManagedAclsWithEventIdQuery, TError, TData>(
      {
    queryKey: ['MuiGetManagedAclsWithEventIdSuspense', variables],
    queryFn: fetchData<MuiGetManagedAclsWithEventIdQuery, MuiGetManagedAclsWithEventIdQueryVariables>(MuiGetManagedAclsWithEventIdDocument, variables),
    ...options
  }
    )};

useSuspenseMuiGetManagedAclsWithEventIdQuery.getKey = (variables: MuiGetManagedAclsWithEventIdQueryVariables) => ['MuiGetManagedAclsWithEventIdSuspense', variables];


useMuiGetManagedAclsWithEventIdQuery.fetcher = (variables: MuiGetManagedAclsWithEventIdQueryVariables, options?: RequestInit['headers']) => fetchData<MuiGetManagedAclsWithEventIdQuery, MuiGetManagedAclsWithEventIdQueryVariables>(MuiGetManagedAclsWithEventIdDocument, variables, options);

export const MuiGetManagedAclsWithSeriesIdDocument = `
    query MuiGetManagedAclsWithSeriesId($id: String!) {
  managedAcls {
    nodes {
      name
      id
      acl {
        entries {
          role
          action
        }
      }
    }
  }
  ...MuiSeriesAclData
}
    ${MuiSeriesAclDataFragmentDoc}`;

export const useMuiGetManagedAclsWithSeriesIdQuery = <
      TData = MuiGetManagedAclsWithSeriesIdQuery,
      TError = unknown
    >(
      variables: MuiGetManagedAclsWithSeriesIdQueryVariables,
      options?: Omit<UseQueryOptions<MuiGetManagedAclsWithSeriesIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MuiGetManagedAclsWithSeriesIdQuery, TError, TData>['queryKey'] }
    ): UseQueryResult<TData, TError> => {
    
    return useQuery<MuiGetManagedAclsWithSeriesIdQuery, TError, TData>(
      {
    queryKey: ['MuiGetManagedAclsWithSeriesId', variables],
    queryFn: fetchData<MuiGetManagedAclsWithSeriesIdQuery, MuiGetManagedAclsWithSeriesIdQueryVariables>(MuiGetManagedAclsWithSeriesIdDocument, variables),
    ...options
  }
    )};

useMuiGetManagedAclsWithSeriesIdQuery.getKey = (variables: MuiGetManagedAclsWithSeriesIdQueryVariables) => ['MuiGetManagedAclsWithSeriesId', variables];

export const useSuspenseMuiGetManagedAclsWithSeriesIdQuery = <
      TData = MuiGetManagedAclsWithSeriesIdQuery,
      TError = unknown
    >(
      variables: MuiGetManagedAclsWithSeriesIdQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<MuiGetManagedAclsWithSeriesIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<MuiGetManagedAclsWithSeriesIdQuery, TError, TData>['queryKey'] }
    ): UseSuspenseQueryResult<TData, TError> => {
    
    return useSuspenseQuery<MuiGetManagedAclsWithSeriesIdQuery, TError, TData>(
      {
    queryKey: ['MuiGetManagedAclsWithSeriesIdSuspense', variables],
    queryFn: fetchData<MuiGetManagedAclsWithSeriesIdQuery, MuiGetManagedAclsWithSeriesIdQueryVariables>(MuiGetManagedAclsWithSeriesIdDocument, variables),
    ...options
  }
    )};

useSuspenseMuiGetManagedAclsWithSeriesIdQuery.getKey = (variables: MuiGetManagedAclsWithSeriesIdQueryVariables) => ['MuiGetManagedAclsWithSeriesIdSuspense', variables];


useMuiGetManagedAclsWithSeriesIdQuery.fetcher = (variables: MuiGetManagedAclsWithSeriesIdQueryVariables, options?: RequestInit['headers']) => fetchData<MuiGetManagedAclsWithSeriesIdQuery, MuiGetManagedAclsWithSeriesIdQueryVariables>(MuiGetManagedAclsWithSeriesIdDocument, variables, options);

export const MuiCreateSeriesDocument = `
    mutation MuiCreateSeries($acl: AccessControlListInput!, $metadata: CommonSeriesMetadataInput!) {
  createSeries(acl: $acl, metadata: $metadata) {
    ...MuiSeriesData
  }
}
    ${MuiSeriesDataFragmentDoc}`;

export const useMuiCreateSeriesMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<MuiCreateSeriesMutation, TError, MuiCreateSeriesMutationVariables, TContext>) => {
    
    return useMutation<MuiCreateSeriesMutation, TError, MuiCreateSeriesMutationVariables, TContext>(
      {
    mutationKey: ['MuiCreateSeries'],
    mutationFn: (variables?: MuiCreateSeriesMutationVariables) => fetchData<MuiCreateSeriesMutation, MuiCreateSeriesMutationVariables>(MuiCreateSeriesDocument, variables)(),
    ...options
  }
    )};


useMuiCreateSeriesMutation.fetcher = (variables: MuiCreateSeriesMutationVariables, options?: RequestInit['headers']) => fetchData<MuiCreateSeriesMutation, MuiCreateSeriesMutationVariables>(MuiCreateSeriesDocument, variables, options);

export const MuiUpdateSeriesDocument = `
    mutation MuiUpdateSeries($seriesId: String!, $metadata: CommonSeriesMetadataInput!) {
  updateSeries(id: $seriesId, metadata: $metadata) {
    ...MuiSeriesData
  }
}
    ${MuiSeriesDataFragmentDoc}`;

export const useMuiUpdateSeriesMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<MuiUpdateSeriesMutation, TError, MuiUpdateSeriesMutationVariables, TContext>) => {
    
    return useMutation<MuiUpdateSeriesMutation, TError, MuiUpdateSeriesMutationVariables, TContext>(
      {
    mutationKey: ['MuiUpdateSeries'],
    mutationFn: (variables?: MuiUpdateSeriesMutationVariables) => fetchData<MuiUpdateSeriesMutation, MuiUpdateSeriesMutationVariables>(MuiUpdateSeriesDocument, variables)(),
    ...options
  }
    )};


useMuiUpdateSeriesMutation.fetcher = (variables: MuiUpdateSeriesMutationVariables, options?: RequestInit['headers']) => fetchData<MuiUpdateSeriesMutation, MuiUpdateSeriesMutationVariables>(MuiUpdateSeriesDocument, variables, options);

export const MuiUpdateEventDocument = `
    mutation MuiUpdateEvent($eventId: String!, $metadata: CommonEventMetadataInput!) {
  mui {
    updateEvent(id: $eventId, metadata: $metadata) {
      ...MuiEventsData
    }
  }
}
    ${MuiEventsDataFragmentDoc}`;

export const useMuiUpdateEventMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<MuiUpdateEventMutation, TError, MuiUpdateEventMutationVariables, TContext>) => {
    
    return useMutation<MuiUpdateEventMutation, TError, MuiUpdateEventMutationVariables, TContext>(
      {
    mutationKey: ['MuiUpdateEvent'],
    mutationFn: (variables?: MuiUpdateEventMutationVariables) => fetchData<MuiUpdateEventMutation, MuiUpdateEventMutationVariables>(MuiUpdateEventDocument, variables)(),
    ...options
  }
    )};


useMuiUpdateEventMutation.fetcher = (variables: MuiUpdateEventMutationVariables, options?: RequestInit['headers']) => fetchData<MuiUpdateEventMutation, MuiUpdateEventMutationVariables>(MuiUpdateEventDocument, variables, options);

export const MuiDeleteEventDocument = `
    mutation MuiDeleteEvent($eventId: String!) {
  mui {
    deleteEvent(id: $eventId) {
      id
    }
  }
}
    `;

export const useMuiDeleteEventMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<MuiDeleteEventMutation, TError, MuiDeleteEventMutationVariables, TContext>) => {
    
    return useMutation<MuiDeleteEventMutation, TError, MuiDeleteEventMutationVariables, TContext>(
      {
    mutationKey: ['MuiDeleteEvent'],
    mutationFn: (variables?: MuiDeleteEventMutationVariables) => fetchData<MuiDeleteEventMutation, MuiDeleteEventMutationVariables>(MuiDeleteEventDocument, variables)(),
    ...options
  }
    )};


useMuiDeleteEventMutation.fetcher = (variables: MuiDeleteEventMutationVariables, options?: RequestInit['headers']) => fetchData<MuiDeleteEventMutation, MuiDeleteEventMutationVariables>(MuiDeleteEventDocument, variables, options);

export const MuiUpdateEventAclDocument = `
    mutation MuiUpdateEventAcl($eventId: String!, $acl: AccessControlListInput!) {
  mui {
    updateEventAcl(id: $eventId, acl: $acl) {
      muiEventInfo {
        managedAclId
      }
    }
  }
}
    `;

export const useMuiUpdateEventAclMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<MuiUpdateEventAclMutation, TError, MuiUpdateEventAclMutationVariables, TContext>) => {
    
    return useMutation<MuiUpdateEventAclMutation, TError, MuiUpdateEventAclMutationVariables, TContext>(
      {
    mutationKey: ['MuiUpdateEventAcl'],
    mutationFn: (variables?: MuiUpdateEventAclMutationVariables) => fetchData<MuiUpdateEventAclMutation, MuiUpdateEventAclMutationVariables>(MuiUpdateEventAclDocument, variables)(),
    ...options
  }
    )};


useMuiUpdateEventAclMutation.fetcher = (variables: MuiUpdateEventAclMutationVariables, options?: RequestInit['headers']) => fetchData<MuiUpdateEventAclMutation, MuiUpdateEventAclMutationVariables>(MuiUpdateEventAclDocument, variables, options);

export const MuiUpdateSeriesAclDocument = `
    mutation MuiUpdateSeriesAcl($seriesId: String!, $acl: AccessControlListInput!) {
  updateSeriesAcl(id: $seriesId, acl: $acl) {
    muiSeriesInfo {
      managedAclId
    }
  }
}
    `;

export const useMuiUpdateSeriesAclMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<MuiUpdateSeriesAclMutation, TError, MuiUpdateSeriesAclMutationVariables, TContext>) => {
    
    return useMutation<MuiUpdateSeriesAclMutation, TError, MuiUpdateSeriesAclMutationVariables, TContext>(
      {
    mutationKey: ['MuiUpdateSeriesAcl'],
    mutationFn: (variables?: MuiUpdateSeriesAclMutationVariables) => fetchData<MuiUpdateSeriesAclMutation, MuiUpdateSeriesAclMutationVariables>(MuiUpdateSeriesAclDocument, variables)(),
    ...options
  }
    )};


useMuiUpdateSeriesAclMutation.fetcher = (variables: MuiUpdateSeriesAclMutationVariables, options?: RequestInit['headers']) => fetchData<MuiUpdateSeriesAclMutation, MuiUpdateSeriesAclMutationVariables>(MuiUpdateSeriesAclDocument, variables, options);

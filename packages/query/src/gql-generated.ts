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
  DateTime: { input: any; output: any; }
  Duration: { input: any; output: any; }
  JSON: { input: any; output: any; }
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
  /** Create series with metadata and acl */
  createSeries: Series;
  /** Delete event */
  deleteEvent?: Maybe<DeleteEventPayload>;
  mui?: Maybe<MuiMutation>;
  /** Update event metadata */
  updateEvent: Event;
  /** Update event acl */
  updateEventAcl: Event;
  /** Update series metadata and optional the acl */
  updateSeries: Series;
  /** Update series acl */
  updateSeriesAcl: Series;
};


export type MutationCreateSeriesArgs = {
  acl: AccessControlListInput;
  metadata: CommonSeriesMetadataInput;
};


export type MutationDeleteEventArgs = {
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

export type UserQueryVariables = Exact<{ [key: string]: never; }>;


export type UserQuery = { currentUser: { email?: string | null, name?: string | null, username?: string | null, userRole: string } };

export type SearchUserQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
}>;


export type SearchUserQuery = { searchUser: { totalCount: any, nodes: Array<{ email?: string | null, name?: string | null, provider?: string | null, roles: Array<string | null>, userRole: string, username?: string | null } | null>, pageInfo: { limit: any, offset: any, pageCount: any } } };

export type SeriesDataFragment = { __typename: 'Series', id: string, contributors?: Array<string | null> | null, created?: string | null, creator?: string | null, description?: string | null, title: string, events: { totalCount: any, nodes: Array<{ id: string, title: string } | null> }, muiSeriesInfo?: { isPublic?: boolean | null, managedAclId?: any | null } | null };

export type GetMySeriesQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SeriesOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetMySeriesQuery = { currentUser: { mySeries: { totalCount: any, nodes: Array<{ __typename: 'Series', id: string, contributors?: Array<string | null> | null, created?: string | null, creator?: string | null, description?: string | null, title: string, events: { totalCount: any, nodes: Array<{ id: string, title: string } | null> }, muiSeriesInfo?: { isPublic?: boolean | null, managedAclId?: any | null } | null } | null> } } };

export type GetSeriesInfoQueryVariables = Exact<{
  seriesId: Scalars['String']['input'];
}>;


export type GetSeriesInfoQuery = { seriesById?: { contributors?: Array<string | null> | null, created?: string | null, creator?: string | null, description?: string | null, id: string, license?: string | null, organizers?: Array<string | null> | null, publishers?: Array<string | null> | null, rightsHolder?: string | null, title: string, events: { totalCount: any, nodes: Array<{ id: string } | null> } } | null };

export type GetInputFieldsMetaDataFragment = { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: any | null };

export type GetListInputFieldsMetaDataFragment = { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: Array<string | null> | null };

export type GetStringInputFieldsMetaDataFragment = { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null };

export type GetDurationInputFieldsMetaDataFragment = { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: any | null };

export type GetDateTimeInputFieldsMetaDataFragment = { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: any | null };

export type GetSeriesByIdInputFieldsQueryVariables = Exact<{
  seriesId: Scalars['String']['input'];
}>;


export type GetSeriesByIdInputFieldsQuery = { seriesById?: { commonMetadataV2: { contributor?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: Array<string | null> | null } | null, title?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, subject?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, rightsHolder?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, publisher?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: Array<string | null> | null } | null, license?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, language?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, identifier?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, description?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, creator?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: Array<string | null> | null } | null } } | null };

export type GetMySeriesNameAndIdQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SeriesOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetMySeriesNameAndIdQuery = { currentUser: { mySeries: { nodes: Array<{ id: string, title: string } | null> } } };

export type GetSeriesNameByIdQueryVariables = Exact<{
  seriesId: Scalars['String']['input'];
}>;


export type GetSeriesNameByIdQuery = { seriesById?: { title: string } | null };

export type EventsDataFragment = { __typename: 'Event', contributors?: Array<string | null> | null, seriesName?: string | null, seriesId?: string | null, title: string, creator?: string | null, created?: any | null, description?: string | null, displayableStatus?: string | null, eventStatus: string, duration?: any | null, hasPreview: boolean, id: string, location?: string | null, presenters?: Array<string | null> | null, startDate?: any | null, publications?: Array<{ uri?: string | null, tracks?: Array<{ width?: number | null, uri?: string | null, tags?: Array<string | null> | null, mimeType?: string | null, logicalName?: string | null, isLive?: boolean | null, height?: number | null, frameRate?: number | null, flavor?: string | null } | null> | null } | null> | null, muiEventInfo?: { isPublic?: boolean | null, managedAclId?: any | null, publishUrl?: string | null, thumbnailUrl?: string | null } | null };

export type EventsFromSeriesQueryVariables = Exact<{
  seriesId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EventOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
}>;


export type EventsFromSeriesQuery = { seriesById?: { id: string, title: string, events: { totalCount: any, nodes: Array<{ __typename: 'Event', contributors?: Array<string | null> | null, seriesName?: string | null, seriesId?: string | null, title: string, creator?: string | null, created?: any | null, description?: string | null, displayableStatus?: string | null, eventStatus: string, duration?: any | null, hasPreview: boolean, id: string, location?: string | null, presenters?: Array<string | null> | null, startDate?: any | null, publications?: Array<{ uri?: string | null, tracks?: Array<{ width?: number | null, uri?: string | null, tags?: Array<string | null> | null, mimeType?: string | null, logicalName?: string | null, isLive?: boolean | null, height?: number | null, frameRate?: number | null, flavor?: string | null } | null> | null } | null> | null, muiEventInfo?: { isPublic?: boolean | null, managedAclId?: any | null, publishUrl?: string | null, thumbnailUrl?: string | null } | null } | null> } } | null };

export type GetMyEventsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EventOrderByInput>;
  query?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetMyEventsQuery = { currentUser: { myEvents: { totalCount: any, nodes: Array<{ __typename: 'Event', contributors?: Array<string | null> | null, seriesName?: string | null, seriesId?: string | null, title: string, creator?: string | null, created?: any | null, description?: string | null, displayableStatus?: string | null, eventStatus: string, duration?: any | null, hasPreview: boolean, id: string, location?: string | null, presenters?: Array<string | null> | null, startDate?: any | null, publications?: Array<{ uri?: string | null, tracks?: Array<{ width?: number | null, uri?: string | null, tags?: Array<string | null> | null, mimeType?: string | null, logicalName?: string | null, isLive?: boolean | null, height?: number | null, frameRate?: number | null, flavor?: string | null } | null> | null } | null> | null, muiEventInfo?: { isPublic?: boolean | null, managedAclId?: any | null, publishUrl?: string | null, thumbnailUrl?: string | null } | null } | null> } } };

export type GetEventByIdQueryVariables = Exact<{
  eventId: Scalars['String']['input'];
}>;


export type GetEventByIdQuery = { eventById?: { id: string, title: string } | null };

export type GetEventByIdInputFieldsQueryVariables = Exact<{
  eventId: Scalars['String']['input'];
}>;


export type GetEventByIdInputFieldsQuery = { eventById?: { commonMetadataV2: { contributor?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: Array<string | null> | null } | null, created?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: any | null } | null, creator?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: Array<string | null> | null } | null, description?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, duration?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: any | null } | null, identifier?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, isPartOf?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, language?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, license?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, location?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, publisher?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, rightsHolder?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, source?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, startDate?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: any | null } | null, subject?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null, title?: { collectionId?: string | null, collection?: any | null, id?: string | null, label?: string | null, listProvider?: string | null, order?: number | null, readOnly?: boolean | null, required?: boolean | null, type?: Type | null, value?: string | null } | null } } | null };

export type GetAllManagedAclsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllManagedAclsQuery = { managedAcls: { nodes: Array<{ name: string, id: string, acl: { entries?: Array<{ role?: string | null, action?: Array<string | null> | null } | { role?: string | null, action?: Array<string | null> | null } | { role?: string | null, action?: Array<string | null> | null } | null> | null } } | null> } };

export type GetManagedAclsWithEventIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetManagedAclsWithEventIdQuery = { managedAcls: { nodes: Array<{ name: string, id: string, acl: { entries?: Array<{ role?: string | null, action?: Array<string | null> | null } | { role?: string | null, action?: Array<string | null> | null } | { role?: string | null, action?: Array<string | null> | null } | null> | null } } | null> }, eventById?: { acl: { users?: Array<{ role?: string | null, label?: string | null, action?: Array<string | null> | null } | null> | null } } | null };

export type GetManagedAclsWithSeriesIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetManagedAclsWithSeriesIdQuery = { managedAcls: { nodes: Array<{ name: string, id: string, acl: { entries?: Array<{ role?: string | null, action?: Array<string | null> | null } | { role?: string | null, action?: Array<string | null> | null } | { role?: string | null, action?: Array<string | null> | null } | null> | null } } | null> }, seriesById?: { acl: { users?: Array<{ role?: string | null, label?: string | null, action?: Array<string | null> | null } | null> | null } } | null };

export type EventsAclDataFragment = { eventById?: { acl: { users?: Array<{ role?: string | null, label?: string | null, action?: Array<string | null> | null } | null> | null } } | null };

export type SeriesAclDataFragment = { seriesById?: { acl: { users?: Array<{ role?: string | null, label?: string | null, action?: Array<string | null> | null } | null> | null } } | null };

export type CreateSeriesMutationVariables = Exact<{
  acl: AccessControlListInput;
  metadata: CommonSeriesMetadataInput;
}>;


export type CreateSeriesMutation = { createSeries: { __typename: 'Series', id: string, contributors?: Array<string | null> | null, created?: string | null, creator?: string | null, description?: string | null, title: string, events: { totalCount: any, nodes: Array<{ id: string, title: string } | null> }, muiSeriesInfo?: { isPublic?: boolean | null, managedAclId?: any | null } | null } };

export type UpdateSeriesMutationVariables = Exact<{
  seriesId: Scalars['String']['input'];
  metadata: CommonSeriesMetadataInput;
}>;


export type UpdateSeriesMutation = { updateSeries: { __typename: 'Series', id: string, contributors?: Array<string | null> | null, created?: string | null, creator?: string | null, description?: string | null, title: string, events: { totalCount: any, nodes: Array<{ id: string, title: string } | null> }, muiSeriesInfo?: { isPublic?: boolean | null, managedAclId?: any | null } | null } };

export type UpdateEventMutationVariables = Exact<{
  eventId: Scalars['String']['input'];
  metadata: CommonEventMetadataInput;
}>;


export type UpdateEventMutation = { mui?: { updateEvent: { __typename: 'Event', contributors?: Array<string | null> | null, seriesName?: string | null, seriesId?: string | null, title: string, creator?: string | null, created?: any | null, description?: string | null, displayableStatus?: string | null, eventStatus: string, duration?: any | null, hasPreview: boolean, id: string, location?: string | null, presenters?: Array<string | null> | null, startDate?: any | null, publications?: Array<{ uri?: string | null, tracks?: Array<{ width?: number | null, uri?: string | null, tags?: Array<string | null> | null, mimeType?: string | null, logicalName?: string | null, isLive?: boolean | null, height?: number | null, frameRate?: number | null, flavor?: string | null } | null> | null } | null> | null, muiEventInfo?: { isPublic?: boolean | null, managedAclId?: any | null, publishUrl?: string | null, thumbnailUrl?: string | null } | null } } | null };

export type DeleteEventMutationVariables = Exact<{
  eventId: Scalars['String']['input'];
}>;


export type DeleteEventMutation = { mui?: { deleteEvent?: { id?: string | null } | null } | null };

export type UpdateEventAclMutationVariables = Exact<{
  eventId: Scalars['String']['input'];
  acl: AccessControlListInput;
}>;


export type UpdateEventAclMutation = { mui?: { updateEventAcl: { muiEventInfo?: { managedAclId?: any | null } | null } } | null };

export type UpdateSeriesAclMutationVariables = Exact<{
  seriesId: Scalars['String']['input'];
  acl: AccessControlListInput;
}>;


export type UpdateSeriesAclMutation = { updateSeriesAcl: { muiSeriesInfo?: { managedAclId?: any | null } | null } };


export const SeriesDataFragmentDoc = `
    fragment SeriesData on Series {
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
    }
    totalCount
  }
  muiSeriesInfo {
    isPublic
    managedAclId
  }
}
    `;
export const GetInputFieldsMetaDataFragmentDoc = `
    fragment GetInputFieldsMetaData on JsonMetadataField {
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
export const GetListInputFieldsMetaDataFragmentDoc = `
    fragment GetListInputFieldsMetaData on ListMetadataField {
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
export const GetStringInputFieldsMetaDataFragmentDoc = `
    fragment GetStringInputFieldsMetaData on StringMetadataField {
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
export const GetDurationInputFieldsMetaDataFragmentDoc = `
    fragment GetDurationInputFieldsMetaData on DurationMetadataField {
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
export const GetDateTimeInputFieldsMetaDataFragmentDoc = `
    fragment GetDateTimeInputFieldsMetaData on DateTimeMetadataField {
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
export const EventsDataFragmentDoc = `
    fragment EventsData on Event {
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
}
    `;
export const EventsAclDataFragmentDoc = `
    fragment EventsAclData on Query {
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
export const SeriesAclDataFragmentDoc = `
    fragment SeriesAclData on Query {
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
export const UserDocument = `
    query User {
  currentUser {
    email
    name
    username
    userRole
  }
}
    `;

export const useUserQuery = <
      TData = UserQuery,
      TError = unknown
    >(
      variables?: UserQueryVariables,
      options?: Omit<UseQueryOptions<UserQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<UserQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<UserQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['User'] : ['User', variables],
    queryFn: fetchData<UserQuery, UserQueryVariables>(UserDocument, variables),
    ...options
  }
    )};

useUserQuery.getKey = (variables?: UserQueryVariables) => variables === undefined ? ['User'] : ['User', variables];

export const useSuspenseUserQuery = <
      TData = UserQuery,
      TError = unknown
    >(
      variables?: UserQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<UserQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<UserQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<UserQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['UserSuspense'] : ['UserSuspense', variables],
    queryFn: fetchData<UserQuery, UserQueryVariables>(UserDocument, variables),
    ...options
  }
    )};

useSuspenseUserQuery.getKey = (variables?: UserQueryVariables) => variables === undefined ? ['UserSuspense'] : ['UserSuspense', variables];


useUserQuery.fetcher = (variables?: UserQueryVariables, options?: RequestInit['headers']) => fetchData<UserQuery, UserQueryVariables>(UserDocument, variables, options);

export const SearchUserDocument = `
    query SearchUser($limit: Int, $offset: Int, $query: String!) {
  searchUser(limit: $limit, offset: $offset, query: $query) {
    totalCount
    nodes {
      email
      name
      provider
      roles
      userRole
      username
    }
    pageInfo {
      limit
      offset
      pageCount
    }
  }
}
    `;

export const useSearchUserQuery = <
      TData = SearchUserQuery,
      TError = unknown
    >(
      variables: SearchUserQueryVariables,
      options?: Omit<UseQueryOptions<SearchUserQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<SearchUserQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<SearchUserQuery, TError, TData>(
      {
    queryKey: ['SearchUser', variables],
    queryFn: fetchData<SearchUserQuery, SearchUserQueryVariables>(SearchUserDocument, variables),
    ...options
  }
    )};

useSearchUserQuery.getKey = (variables: SearchUserQueryVariables) => ['SearchUser', variables];

export const useSuspenseSearchUserQuery = <
      TData = SearchUserQuery,
      TError = unknown
    >(
      variables: SearchUserQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<SearchUserQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<SearchUserQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<SearchUserQuery, TError, TData>(
      {
    queryKey: ['SearchUserSuspense', variables],
    queryFn: fetchData<SearchUserQuery, SearchUserQueryVariables>(SearchUserDocument, variables),
    ...options
  }
    )};

useSuspenseSearchUserQuery.getKey = (variables: SearchUserQueryVariables) => ['SearchUserSuspense', variables];


useSearchUserQuery.fetcher = (variables: SearchUserQueryVariables, options?: RequestInit['headers']) => fetchData<SearchUserQuery, SearchUserQueryVariables>(SearchUserDocument, variables, options);

export const GetMySeriesDocument = `
    query GetMySeries($limit: Int, $offset: Int, $orderBy: SeriesOrderByInput, $query: String) {
  currentUser {
    mySeries(limit: $limit, offset: $offset, orderBy: $orderBy, query: $query) {
      totalCount
      nodes {
        ...SeriesData
      }
    }
  }
}
    ${SeriesDataFragmentDoc}`;

export const useGetMySeriesQuery = <
      TData = GetMySeriesQuery,
      TError = unknown
    >(
      variables?: GetMySeriesQueryVariables,
      options?: Omit<UseQueryOptions<GetMySeriesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetMySeriesQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetMySeriesQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetMySeries'] : ['GetMySeries', variables],
    queryFn: fetchData<GetMySeriesQuery, GetMySeriesQueryVariables>(GetMySeriesDocument, variables),
    ...options
  }
    )};

useGetMySeriesQuery.getKey = (variables?: GetMySeriesQueryVariables) => variables === undefined ? ['GetMySeries'] : ['GetMySeries', variables];

export const useSuspenseGetMySeriesQuery = <
      TData = GetMySeriesQuery,
      TError = unknown
    >(
      variables?: GetMySeriesQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<GetMySeriesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<GetMySeriesQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<GetMySeriesQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetMySeriesSuspense'] : ['GetMySeriesSuspense', variables],
    queryFn: fetchData<GetMySeriesQuery, GetMySeriesQueryVariables>(GetMySeriesDocument, variables),
    ...options
  }
    )};

useSuspenseGetMySeriesQuery.getKey = (variables?: GetMySeriesQueryVariables) => variables === undefined ? ['GetMySeriesSuspense'] : ['GetMySeriesSuspense', variables];


useGetMySeriesQuery.fetcher = (variables?: GetMySeriesQueryVariables, options?: RequestInit['headers']) => fetchData<GetMySeriesQuery, GetMySeriesQueryVariables>(GetMySeriesDocument, variables, options);

export const GetSeriesInfoDocument = `
    query GetSeriesInfo($seriesId: String!) {
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

export const useGetSeriesInfoQuery = <
      TData = GetSeriesInfoQuery,
      TError = unknown
    >(
      variables: GetSeriesInfoQueryVariables,
      options?: Omit<UseQueryOptions<GetSeriesInfoQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetSeriesInfoQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetSeriesInfoQuery, TError, TData>(
      {
    queryKey: ['GetSeriesInfo', variables],
    queryFn: fetchData<GetSeriesInfoQuery, GetSeriesInfoQueryVariables>(GetSeriesInfoDocument, variables),
    ...options
  }
    )};

useGetSeriesInfoQuery.getKey = (variables: GetSeriesInfoQueryVariables) => ['GetSeriesInfo', variables];

export const useSuspenseGetSeriesInfoQuery = <
      TData = GetSeriesInfoQuery,
      TError = unknown
    >(
      variables: GetSeriesInfoQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<GetSeriesInfoQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<GetSeriesInfoQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<GetSeriesInfoQuery, TError, TData>(
      {
    queryKey: ['GetSeriesInfoSuspense', variables],
    queryFn: fetchData<GetSeriesInfoQuery, GetSeriesInfoQueryVariables>(GetSeriesInfoDocument, variables),
    ...options
  }
    )};

useSuspenseGetSeriesInfoQuery.getKey = (variables: GetSeriesInfoQueryVariables) => ['GetSeriesInfoSuspense', variables];


useGetSeriesInfoQuery.fetcher = (variables: GetSeriesInfoQueryVariables, options?: RequestInit['headers']) => fetchData<GetSeriesInfoQuery, GetSeriesInfoQueryVariables>(GetSeriesInfoDocument, variables, options);

export const GetSeriesByIdInputFieldsDocument = `
    query GetSeriesByIdInputFields($seriesId: String!) {
  seriesById(id: $seriesId) {
    commonMetadataV2 {
      contributor {
        ...GetListInputFieldsMetaData
      }
      title {
        ...GetStringInputFieldsMetaData
      }
      subject {
        ...GetStringInputFieldsMetaData
      }
      rightsHolder {
        ...GetStringInputFieldsMetaData
      }
      publisher {
        ...GetListInputFieldsMetaData
      }
      license {
        ...GetStringInputFieldsMetaData
      }
      language {
        ...GetStringInputFieldsMetaData
      }
      identifier {
        ...GetStringInputFieldsMetaData
      }
      description {
        ...GetStringInputFieldsMetaData
      }
      creator {
        ...GetListInputFieldsMetaData
      }
    }
  }
}
    ${GetListInputFieldsMetaDataFragmentDoc}
${GetStringInputFieldsMetaDataFragmentDoc}`;

export const useGetSeriesByIdInputFieldsQuery = <
      TData = GetSeriesByIdInputFieldsQuery,
      TError = unknown
    >(
      variables: GetSeriesByIdInputFieldsQueryVariables,
      options?: Omit<UseQueryOptions<GetSeriesByIdInputFieldsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetSeriesByIdInputFieldsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetSeriesByIdInputFieldsQuery, TError, TData>(
      {
    queryKey: ['GetSeriesByIdInputFields', variables],
    queryFn: fetchData<GetSeriesByIdInputFieldsQuery, GetSeriesByIdInputFieldsQueryVariables>(GetSeriesByIdInputFieldsDocument, variables),
    ...options
  }
    )};

useGetSeriesByIdInputFieldsQuery.getKey = (variables: GetSeriesByIdInputFieldsQueryVariables) => ['GetSeriesByIdInputFields', variables];

export const useSuspenseGetSeriesByIdInputFieldsQuery = <
      TData = GetSeriesByIdInputFieldsQuery,
      TError = unknown
    >(
      variables: GetSeriesByIdInputFieldsQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<GetSeriesByIdInputFieldsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<GetSeriesByIdInputFieldsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<GetSeriesByIdInputFieldsQuery, TError, TData>(
      {
    queryKey: ['GetSeriesByIdInputFieldsSuspense', variables],
    queryFn: fetchData<GetSeriesByIdInputFieldsQuery, GetSeriesByIdInputFieldsQueryVariables>(GetSeriesByIdInputFieldsDocument, variables),
    ...options
  }
    )};

useSuspenseGetSeriesByIdInputFieldsQuery.getKey = (variables: GetSeriesByIdInputFieldsQueryVariables) => ['GetSeriesByIdInputFieldsSuspense', variables];


useGetSeriesByIdInputFieldsQuery.fetcher = (variables: GetSeriesByIdInputFieldsQueryVariables, options?: RequestInit['headers']) => fetchData<GetSeriesByIdInputFieldsQuery, GetSeriesByIdInputFieldsQueryVariables>(GetSeriesByIdInputFieldsDocument, variables, options);

export const GetMySeriesNameAndIdDocument = `
    query GetMySeriesNameAndId($limit: Int, $offset: Int, $orderBy: SeriesOrderByInput, $query: String) {
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

export const useGetMySeriesNameAndIdQuery = <
      TData = GetMySeriesNameAndIdQuery,
      TError = unknown
    >(
      variables?: GetMySeriesNameAndIdQueryVariables,
      options?: Omit<UseQueryOptions<GetMySeriesNameAndIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetMySeriesNameAndIdQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetMySeriesNameAndIdQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetMySeriesNameAndId'] : ['GetMySeriesNameAndId', variables],
    queryFn: fetchData<GetMySeriesNameAndIdQuery, GetMySeriesNameAndIdQueryVariables>(GetMySeriesNameAndIdDocument, variables),
    ...options
  }
    )};

useGetMySeriesNameAndIdQuery.getKey = (variables?: GetMySeriesNameAndIdQueryVariables) => variables === undefined ? ['GetMySeriesNameAndId'] : ['GetMySeriesNameAndId', variables];

export const useSuspenseGetMySeriesNameAndIdQuery = <
      TData = GetMySeriesNameAndIdQuery,
      TError = unknown
    >(
      variables?: GetMySeriesNameAndIdQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<GetMySeriesNameAndIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<GetMySeriesNameAndIdQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<GetMySeriesNameAndIdQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetMySeriesNameAndIdSuspense'] : ['GetMySeriesNameAndIdSuspense', variables],
    queryFn: fetchData<GetMySeriesNameAndIdQuery, GetMySeriesNameAndIdQueryVariables>(GetMySeriesNameAndIdDocument, variables),
    ...options
  }
    )};

useSuspenseGetMySeriesNameAndIdQuery.getKey = (variables?: GetMySeriesNameAndIdQueryVariables) => variables === undefined ? ['GetMySeriesNameAndIdSuspense'] : ['GetMySeriesNameAndIdSuspense', variables];


useGetMySeriesNameAndIdQuery.fetcher = (variables?: GetMySeriesNameAndIdQueryVariables, options?: RequestInit['headers']) => fetchData<GetMySeriesNameAndIdQuery, GetMySeriesNameAndIdQueryVariables>(GetMySeriesNameAndIdDocument, variables, options);

export const GetSeriesNameByIdDocument = `
    query GetSeriesNameById($seriesId: String!) {
  seriesById(id: $seriesId) {
    title
  }
}
    `;

export const useGetSeriesNameByIdQuery = <
      TData = GetSeriesNameByIdQuery,
      TError = unknown
    >(
      variables: GetSeriesNameByIdQueryVariables,
      options?: Omit<UseQueryOptions<GetSeriesNameByIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetSeriesNameByIdQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetSeriesNameByIdQuery, TError, TData>(
      {
    queryKey: ['GetSeriesNameById', variables],
    queryFn: fetchData<GetSeriesNameByIdQuery, GetSeriesNameByIdQueryVariables>(GetSeriesNameByIdDocument, variables),
    ...options
  }
    )};

useGetSeriesNameByIdQuery.getKey = (variables: GetSeriesNameByIdQueryVariables) => ['GetSeriesNameById', variables];

export const useSuspenseGetSeriesNameByIdQuery = <
      TData = GetSeriesNameByIdQuery,
      TError = unknown
    >(
      variables: GetSeriesNameByIdQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<GetSeriesNameByIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<GetSeriesNameByIdQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<GetSeriesNameByIdQuery, TError, TData>(
      {
    queryKey: ['GetSeriesNameByIdSuspense', variables],
    queryFn: fetchData<GetSeriesNameByIdQuery, GetSeriesNameByIdQueryVariables>(GetSeriesNameByIdDocument, variables),
    ...options
  }
    )};

useSuspenseGetSeriesNameByIdQuery.getKey = (variables: GetSeriesNameByIdQueryVariables) => ['GetSeriesNameByIdSuspense', variables];


useGetSeriesNameByIdQuery.fetcher = (variables: GetSeriesNameByIdQueryVariables, options?: RequestInit['headers']) => fetchData<GetSeriesNameByIdQuery, GetSeriesNameByIdQueryVariables>(GetSeriesNameByIdDocument, variables, options);

export const EventsFromSeriesDocument = `
    query EventsFromSeries($seriesId: String!, $limit: Int, $offset: Int, $orderBy: EventOrderByInput, $query: String) {
  seriesById(id: $seriesId) {
    id
    title
    events(limit: $limit, offset: $offset, orderBy: $orderBy, query: $query) {
      totalCount
      nodes {
        ...EventsData
      }
    }
  }
}
    ${EventsDataFragmentDoc}`;

export const useEventsFromSeriesQuery = <
      TData = EventsFromSeriesQuery,
      TError = unknown
    >(
      variables: EventsFromSeriesQueryVariables,
      options?: Omit<UseQueryOptions<EventsFromSeriesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<EventsFromSeriesQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<EventsFromSeriesQuery, TError, TData>(
      {
    queryKey: ['EventsFromSeries', variables],
    queryFn: fetchData<EventsFromSeriesQuery, EventsFromSeriesQueryVariables>(EventsFromSeriesDocument, variables),
    ...options
  }
    )};

useEventsFromSeriesQuery.getKey = (variables: EventsFromSeriesQueryVariables) => ['EventsFromSeries', variables];

export const useSuspenseEventsFromSeriesQuery = <
      TData = EventsFromSeriesQuery,
      TError = unknown
    >(
      variables: EventsFromSeriesQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<EventsFromSeriesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<EventsFromSeriesQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<EventsFromSeriesQuery, TError, TData>(
      {
    queryKey: ['EventsFromSeriesSuspense', variables],
    queryFn: fetchData<EventsFromSeriesQuery, EventsFromSeriesQueryVariables>(EventsFromSeriesDocument, variables),
    ...options
  }
    )};

useSuspenseEventsFromSeriesQuery.getKey = (variables: EventsFromSeriesQueryVariables) => ['EventsFromSeriesSuspense', variables];


useEventsFromSeriesQuery.fetcher = (variables: EventsFromSeriesQueryVariables, options?: RequestInit['headers']) => fetchData<EventsFromSeriesQuery, EventsFromSeriesQueryVariables>(EventsFromSeriesDocument, variables, options);

export const GetMyEventsDocument = `
    query GetMyEvents($limit: Int, $offset: Int, $orderBy: EventOrderByInput, $query: String) {
  currentUser {
    myEvents(limit: $limit, offset: $offset, orderBy: $orderBy, query: $query) {
      totalCount
      nodes {
        ...EventsData
      }
    }
  }
}
    ${EventsDataFragmentDoc}`;

export const useGetMyEventsQuery = <
      TData = GetMyEventsQuery,
      TError = unknown
    >(
      variables?: GetMyEventsQueryVariables,
      options?: Omit<UseQueryOptions<GetMyEventsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetMyEventsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetMyEventsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetMyEvents'] : ['GetMyEvents', variables],
    queryFn: fetchData<GetMyEventsQuery, GetMyEventsQueryVariables>(GetMyEventsDocument, variables),
    ...options
  }
    )};

useGetMyEventsQuery.getKey = (variables?: GetMyEventsQueryVariables) => variables === undefined ? ['GetMyEvents'] : ['GetMyEvents', variables];

export const useSuspenseGetMyEventsQuery = <
      TData = GetMyEventsQuery,
      TError = unknown
    >(
      variables?: GetMyEventsQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<GetMyEventsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<GetMyEventsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<GetMyEventsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetMyEventsSuspense'] : ['GetMyEventsSuspense', variables],
    queryFn: fetchData<GetMyEventsQuery, GetMyEventsQueryVariables>(GetMyEventsDocument, variables),
    ...options
  }
    )};

useSuspenseGetMyEventsQuery.getKey = (variables?: GetMyEventsQueryVariables) => variables === undefined ? ['GetMyEventsSuspense'] : ['GetMyEventsSuspense', variables];


useGetMyEventsQuery.fetcher = (variables?: GetMyEventsQueryVariables, options?: RequestInit['headers']) => fetchData<GetMyEventsQuery, GetMyEventsQueryVariables>(GetMyEventsDocument, variables, options);

export const GetEventByIdDocument = `
    query GetEventById($eventId: String!) {
  eventById(id: $eventId) {
    id
    title
  }
}
    `;

export const useGetEventByIdQuery = <
      TData = GetEventByIdQuery,
      TError = unknown
    >(
      variables: GetEventByIdQueryVariables,
      options?: Omit<UseQueryOptions<GetEventByIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetEventByIdQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetEventByIdQuery, TError, TData>(
      {
    queryKey: ['GetEventById', variables],
    queryFn: fetchData<GetEventByIdQuery, GetEventByIdQueryVariables>(GetEventByIdDocument, variables),
    ...options
  }
    )};

useGetEventByIdQuery.getKey = (variables: GetEventByIdQueryVariables) => ['GetEventById', variables];

export const useSuspenseGetEventByIdQuery = <
      TData = GetEventByIdQuery,
      TError = unknown
    >(
      variables: GetEventByIdQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<GetEventByIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<GetEventByIdQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<GetEventByIdQuery, TError, TData>(
      {
    queryKey: ['GetEventByIdSuspense', variables],
    queryFn: fetchData<GetEventByIdQuery, GetEventByIdQueryVariables>(GetEventByIdDocument, variables),
    ...options
  }
    )};

useSuspenseGetEventByIdQuery.getKey = (variables: GetEventByIdQueryVariables) => ['GetEventByIdSuspense', variables];


useGetEventByIdQuery.fetcher = (variables: GetEventByIdQueryVariables, options?: RequestInit['headers']) => fetchData<GetEventByIdQuery, GetEventByIdQueryVariables>(GetEventByIdDocument, variables, options);

export const GetEventByIdInputFieldsDocument = `
    query GetEventByIdInputFields($eventId: String!) {
  eventById(id: $eventId) {
    commonMetadataV2 {
      contributor {
        ...GetListInputFieldsMetaData
      }
      created {
        ...GetDateTimeInputFieldsMetaData
      }
      creator {
        ...GetListInputFieldsMetaData
      }
      description {
        ...GetStringInputFieldsMetaData
      }
      duration {
        ...GetDurationInputFieldsMetaData
      }
      identifier {
        ...GetStringInputFieldsMetaData
      }
      isPartOf {
        ...GetStringInputFieldsMetaData
      }
      language {
        ...GetStringInputFieldsMetaData
      }
      license {
        ...GetStringInputFieldsMetaData
      }
      location {
        ...GetStringInputFieldsMetaData
      }
      publisher {
        ...GetStringInputFieldsMetaData
      }
      rightsHolder {
        ...GetStringInputFieldsMetaData
      }
      source {
        ...GetStringInputFieldsMetaData
      }
      startDate {
        ...GetDateTimeInputFieldsMetaData
      }
      subject {
        ...GetStringInputFieldsMetaData
      }
      title {
        ...GetStringInputFieldsMetaData
      }
    }
  }
}
    ${GetListInputFieldsMetaDataFragmentDoc}
${GetDateTimeInputFieldsMetaDataFragmentDoc}
${GetStringInputFieldsMetaDataFragmentDoc}
${GetDurationInputFieldsMetaDataFragmentDoc}`;

export const useGetEventByIdInputFieldsQuery = <
      TData = GetEventByIdInputFieldsQuery,
      TError = unknown
    >(
      variables: GetEventByIdInputFieldsQueryVariables,
      options?: Omit<UseQueryOptions<GetEventByIdInputFieldsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetEventByIdInputFieldsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetEventByIdInputFieldsQuery, TError, TData>(
      {
    queryKey: ['GetEventByIdInputFields', variables],
    queryFn: fetchData<GetEventByIdInputFieldsQuery, GetEventByIdInputFieldsQueryVariables>(GetEventByIdInputFieldsDocument, variables),
    ...options
  }
    )};

useGetEventByIdInputFieldsQuery.getKey = (variables: GetEventByIdInputFieldsQueryVariables) => ['GetEventByIdInputFields', variables];

export const useSuspenseGetEventByIdInputFieldsQuery = <
      TData = GetEventByIdInputFieldsQuery,
      TError = unknown
    >(
      variables: GetEventByIdInputFieldsQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<GetEventByIdInputFieldsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<GetEventByIdInputFieldsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<GetEventByIdInputFieldsQuery, TError, TData>(
      {
    queryKey: ['GetEventByIdInputFieldsSuspense', variables],
    queryFn: fetchData<GetEventByIdInputFieldsQuery, GetEventByIdInputFieldsQueryVariables>(GetEventByIdInputFieldsDocument, variables),
    ...options
  }
    )};

useSuspenseGetEventByIdInputFieldsQuery.getKey = (variables: GetEventByIdInputFieldsQueryVariables) => ['GetEventByIdInputFieldsSuspense', variables];


useGetEventByIdInputFieldsQuery.fetcher = (variables: GetEventByIdInputFieldsQueryVariables, options?: RequestInit['headers']) => fetchData<GetEventByIdInputFieldsQuery, GetEventByIdInputFieldsQueryVariables>(GetEventByIdInputFieldsDocument, variables, options);

export const GetAllManagedAclsDocument = `
    query GetAllManagedAcls {
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

export const useGetAllManagedAclsQuery = <
      TData = GetAllManagedAclsQuery,
      TError = unknown
    >(
      variables?: GetAllManagedAclsQueryVariables,
      options?: Omit<UseQueryOptions<GetAllManagedAclsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetAllManagedAclsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetAllManagedAclsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetAllManagedAcls'] : ['GetAllManagedAcls', variables],
    queryFn: fetchData<GetAllManagedAclsQuery, GetAllManagedAclsQueryVariables>(GetAllManagedAclsDocument, variables),
    ...options
  }
    )};

useGetAllManagedAclsQuery.getKey = (variables?: GetAllManagedAclsQueryVariables) => variables === undefined ? ['GetAllManagedAcls'] : ['GetAllManagedAcls', variables];

export const useSuspenseGetAllManagedAclsQuery = <
      TData = GetAllManagedAclsQuery,
      TError = unknown
    >(
      variables?: GetAllManagedAclsQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<GetAllManagedAclsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<GetAllManagedAclsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<GetAllManagedAclsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetAllManagedAclsSuspense'] : ['GetAllManagedAclsSuspense', variables],
    queryFn: fetchData<GetAllManagedAclsQuery, GetAllManagedAclsQueryVariables>(GetAllManagedAclsDocument, variables),
    ...options
  }
    )};

useSuspenseGetAllManagedAclsQuery.getKey = (variables?: GetAllManagedAclsQueryVariables) => variables === undefined ? ['GetAllManagedAclsSuspense'] : ['GetAllManagedAclsSuspense', variables];


useGetAllManagedAclsQuery.fetcher = (variables?: GetAllManagedAclsQueryVariables, options?: RequestInit['headers']) => fetchData<GetAllManagedAclsQuery, GetAllManagedAclsQueryVariables>(GetAllManagedAclsDocument, variables, options);

export const GetManagedAclsWithEventIdDocument = `
    query GetManagedAclsWithEventId($id: String!) {
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
  ...EventsAclData
}
    ${EventsAclDataFragmentDoc}`;

export const useGetManagedAclsWithEventIdQuery = <
      TData = GetManagedAclsWithEventIdQuery,
      TError = unknown
    >(
      variables: GetManagedAclsWithEventIdQueryVariables,
      options?: Omit<UseQueryOptions<GetManagedAclsWithEventIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetManagedAclsWithEventIdQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetManagedAclsWithEventIdQuery, TError, TData>(
      {
    queryKey: ['GetManagedAclsWithEventId', variables],
    queryFn: fetchData<GetManagedAclsWithEventIdQuery, GetManagedAclsWithEventIdQueryVariables>(GetManagedAclsWithEventIdDocument, variables),
    ...options
  }
    )};

useGetManagedAclsWithEventIdQuery.getKey = (variables: GetManagedAclsWithEventIdQueryVariables) => ['GetManagedAclsWithEventId', variables];

export const useSuspenseGetManagedAclsWithEventIdQuery = <
      TData = GetManagedAclsWithEventIdQuery,
      TError = unknown
    >(
      variables: GetManagedAclsWithEventIdQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<GetManagedAclsWithEventIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<GetManagedAclsWithEventIdQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<GetManagedAclsWithEventIdQuery, TError, TData>(
      {
    queryKey: ['GetManagedAclsWithEventIdSuspense', variables],
    queryFn: fetchData<GetManagedAclsWithEventIdQuery, GetManagedAclsWithEventIdQueryVariables>(GetManagedAclsWithEventIdDocument, variables),
    ...options
  }
    )};

useSuspenseGetManagedAclsWithEventIdQuery.getKey = (variables: GetManagedAclsWithEventIdQueryVariables) => ['GetManagedAclsWithEventIdSuspense', variables];


useGetManagedAclsWithEventIdQuery.fetcher = (variables: GetManagedAclsWithEventIdQueryVariables, options?: RequestInit['headers']) => fetchData<GetManagedAclsWithEventIdQuery, GetManagedAclsWithEventIdQueryVariables>(GetManagedAclsWithEventIdDocument, variables, options);

export const GetManagedAclsWithSeriesIdDocument = `
    query GetManagedAclsWithSeriesId($id: String!) {
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
  ...SeriesAclData
}
    ${SeriesAclDataFragmentDoc}`;

export const useGetManagedAclsWithSeriesIdQuery = <
      TData = GetManagedAclsWithSeriesIdQuery,
      TError = unknown
    >(
      variables: GetManagedAclsWithSeriesIdQueryVariables,
      options?: Omit<UseQueryOptions<GetManagedAclsWithSeriesIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetManagedAclsWithSeriesIdQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetManagedAclsWithSeriesIdQuery, TError, TData>(
      {
    queryKey: ['GetManagedAclsWithSeriesId', variables],
    queryFn: fetchData<GetManagedAclsWithSeriesIdQuery, GetManagedAclsWithSeriesIdQueryVariables>(GetManagedAclsWithSeriesIdDocument, variables),
    ...options
  }
    )};

useGetManagedAclsWithSeriesIdQuery.getKey = (variables: GetManagedAclsWithSeriesIdQueryVariables) => ['GetManagedAclsWithSeriesId', variables];

export const useSuspenseGetManagedAclsWithSeriesIdQuery = <
      TData = GetManagedAclsWithSeriesIdQuery,
      TError = unknown
    >(
      variables: GetManagedAclsWithSeriesIdQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<GetManagedAclsWithSeriesIdQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<GetManagedAclsWithSeriesIdQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<GetManagedAclsWithSeriesIdQuery, TError, TData>(
      {
    queryKey: ['GetManagedAclsWithSeriesIdSuspense', variables],
    queryFn: fetchData<GetManagedAclsWithSeriesIdQuery, GetManagedAclsWithSeriesIdQueryVariables>(GetManagedAclsWithSeriesIdDocument, variables),
    ...options
  }
    )};

useSuspenseGetManagedAclsWithSeriesIdQuery.getKey = (variables: GetManagedAclsWithSeriesIdQueryVariables) => ['GetManagedAclsWithSeriesIdSuspense', variables];


useGetManagedAclsWithSeriesIdQuery.fetcher = (variables: GetManagedAclsWithSeriesIdQueryVariables, options?: RequestInit['headers']) => fetchData<GetManagedAclsWithSeriesIdQuery, GetManagedAclsWithSeriesIdQueryVariables>(GetManagedAclsWithSeriesIdDocument, variables, options);

export const CreateSeriesDocument = `
    mutation CreateSeries($acl: AccessControlListInput!, $metadata: CommonSeriesMetadataInput!) {
  createSeries(acl: $acl, metadata: $metadata) {
    ...SeriesData
  }
}
    ${SeriesDataFragmentDoc}`;

export const useCreateSeriesMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateSeriesMutation, TError, CreateSeriesMutationVariables, TContext>) => {
    
    return useMutation<CreateSeriesMutation, TError, CreateSeriesMutationVariables, TContext>(
      {
    mutationKey: ['CreateSeries'],
    mutationFn: (variables?: CreateSeriesMutationVariables) => fetchData<CreateSeriesMutation, CreateSeriesMutationVariables>(CreateSeriesDocument, variables)(),
    ...options
  }
    )};


useCreateSeriesMutation.fetcher = (variables: CreateSeriesMutationVariables, options?: RequestInit['headers']) => fetchData<CreateSeriesMutation, CreateSeriesMutationVariables>(CreateSeriesDocument, variables, options);

export const UpdateSeriesDocument = `
    mutation UpdateSeries($seriesId: String!, $metadata: CommonSeriesMetadataInput!) {
  updateSeries(id: $seriesId, metadata: $metadata) {
    ...SeriesData
  }
}
    ${SeriesDataFragmentDoc}`;

export const useUpdateSeriesMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UpdateSeriesMutation, TError, UpdateSeriesMutationVariables, TContext>) => {
    
    return useMutation<UpdateSeriesMutation, TError, UpdateSeriesMutationVariables, TContext>(
      {
    mutationKey: ['UpdateSeries'],
    mutationFn: (variables?: UpdateSeriesMutationVariables) => fetchData<UpdateSeriesMutation, UpdateSeriesMutationVariables>(UpdateSeriesDocument, variables)(),
    ...options
  }
    )};


useUpdateSeriesMutation.fetcher = (variables: UpdateSeriesMutationVariables, options?: RequestInit['headers']) => fetchData<UpdateSeriesMutation, UpdateSeriesMutationVariables>(UpdateSeriesDocument, variables, options);

export const UpdateEventDocument = `
    mutation UpdateEvent($eventId: String!, $metadata: CommonEventMetadataInput!) {
  mui {
    updateEvent(id: $eventId, metadata: $metadata) {
      ...EventsData
    }
  }
}
    ${EventsDataFragmentDoc}`;

export const useUpdateEventMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UpdateEventMutation, TError, UpdateEventMutationVariables, TContext>) => {
    
    return useMutation<UpdateEventMutation, TError, UpdateEventMutationVariables, TContext>(
      {
    mutationKey: ['UpdateEvent'],
    mutationFn: (variables?: UpdateEventMutationVariables) => fetchData<UpdateEventMutation, UpdateEventMutationVariables>(UpdateEventDocument, variables)(),
    ...options
  }
    )};


useUpdateEventMutation.fetcher = (variables: UpdateEventMutationVariables, options?: RequestInit['headers']) => fetchData<UpdateEventMutation, UpdateEventMutationVariables>(UpdateEventDocument, variables, options);

export const DeleteEventDocument = `
    mutation DeleteEvent($eventId: String!) {
  mui {
    deleteEvent(id: $eventId) {
      id
    }
  }
}
    `;

export const useDeleteEventMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<DeleteEventMutation, TError, DeleteEventMutationVariables, TContext>) => {
    
    return useMutation<DeleteEventMutation, TError, DeleteEventMutationVariables, TContext>(
      {
    mutationKey: ['DeleteEvent'],
    mutationFn: (variables?: DeleteEventMutationVariables) => fetchData<DeleteEventMutation, DeleteEventMutationVariables>(DeleteEventDocument, variables)(),
    ...options
  }
    )};


useDeleteEventMutation.fetcher = (variables: DeleteEventMutationVariables, options?: RequestInit['headers']) => fetchData<DeleteEventMutation, DeleteEventMutationVariables>(DeleteEventDocument, variables, options);

export const UpdateEventAclDocument = `
    mutation UpdateEventAcl($eventId: String!, $acl: AccessControlListInput!) {
  mui {
    updateEventAcl(id: $eventId, acl: $acl) {
      muiEventInfo {
        managedAclId
      }
    }
  }
}
    `;

export const useUpdateEventAclMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UpdateEventAclMutation, TError, UpdateEventAclMutationVariables, TContext>) => {
    
    return useMutation<UpdateEventAclMutation, TError, UpdateEventAclMutationVariables, TContext>(
      {
    mutationKey: ['UpdateEventAcl'],
    mutationFn: (variables?: UpdateEventAclMutationVariables) => fetchData<UpdateEventAclMutation, UpdateEventAclMutationVariables>(UpdateEventAclDocument, variables)(),
    ...options
  }
    )};


useUpdateEventAclMutation.fetcher = (variables: UpdateEventAclMutationVariables, options?: RequestInit['headers']) => fetchData<UpdateEventAclMutation, UpdateEventAclMutationVariables>(UpdateEventAclDocument, variables, options);

export const UpdateSeriesAclDocument = `
    mutation UpdateSeriesAcl($seriesId: String!, $acl: AccessControlListInput!) {
  updateSeriesAcl(id: $seriesId, acl: $acl) {
    muiSeriesInfo {
      managedAclId
    }
  }
}
    `;

export const useUpdateSeriesAclMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UpdateSeriesAclMutation, TError, UpdateSeriesAclMutationVariables, TContext>) => {
    
    return useMutation<UpdateSeriesAclMutation, TError, UpdateSeriesAclMutationVariables, TContext>(
      {
    mutationKey: ['UpdateSeriesAcl'],
    mutationFn: (variables?: UpdateSeriesAclMutationVariables) => fetchData<UpdateSeriesAclMutation, UpdateSeriesAclMutationVariables>(UpdateSeriesAclDocument, variables)(),
    ...options
  }
    )};


useUpdateSeriesAclMutation.fetcher = (variables: UpdateSeriesAclMutationVariables, options?: RequestInit['headers']) => fetchData<UpdateSeriesAclMutation, UpdateSeriesAclMutationVariables>(UpdateSeriesAclDocument, variables, options);

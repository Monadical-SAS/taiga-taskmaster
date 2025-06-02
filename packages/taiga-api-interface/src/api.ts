import { Schema } from "effect";
import { NonEmptyString, Url, TaigaTag } from "@taiga-task-master/common";

// ============================================================================
// Authentication Types
// ============================================================================

export const AuthCredentials = Schema.Struct({
  username: Schema.String,
  password: Schema.String,
  type: Schema.Literal("normal"),
});

export const AuthToken = NonEmptyString.pipe(Schema.brand("AuthToken"));

export const RefreshToken = NonEmptyString.pipe(Schema.brand("RefreshToken"));

export const AuthResponse = Schema.Struct({
  id: Schema.Number,
  username: Schema.String,
  email: Schema.String,
  full_name: Schema.String,
  auth_token: AuthToken,
  refresh: RefreshToken,
  accepted_terms: Schema.Boolean,
  read_new_terms: Schema.Boolean,
});

export const RefreshRequest = Schema.Struct({
  refresh: Schema.String,
});

export const RefreshResponse = Schema.Struct({
  auth_token: AuthToken,
  refresh: RefreshToken,
});

export type AuthToken = Schema.Schema.Type<typeof AuthToken>;
export type RefreshToken = Schema.Schema.Type<typeof RefreshToken>;
export type AuthCredentials = Schema.Schema.Type<typeof AuthCredentials>;
export type AuthResponse = Schema.Schema.Type<typeof AuthResponse>;
export type RefreshRequest = Schema.Schema.Type<typeof RefreshRequest>;
export type RefreshResponse = Schema.Schema.Type<typeof RefreshResponse>;

// ============================================================================
// Common Types
// ============================================================================

export const ProjectId = Schema.Number;
export const TaskId = Schema.Number;
export const UserStoryId = Schema.Number;
export const StatusId = Schema.Number;
export const UserId = Schema.Number;
export const CustomAttributeId = Schema.Number;
export const PointId = Schema.Number;

export type ProjectId = Schema.Schema.Type<typeof ProjectId>;
export type TaskId = Schema.Schema.Type<typeof TaskId>;
export type UserStoryId = Schema.Schema.Type<typeof UserStoryId>;
export type StatusId = Schema.Schema.Type<typeof StatusId>;
export type UserId = Schema.Schema.Type<typeof UserId>;
export type CustomAttributeId = Schema.Schema.Type<typeof CustomAttributeId>;
export type PointId = Schema.Schema.Type<typeof PointId>;

// ============================================================================
// User Types
// ============================================================================

export const User = Schema.Struct({
  id: UserId,
  permalink: Schema.String,
  username: Schema.String,
  full_name: Schema.String,
  photo: Schema.NullOr(Schema.String),
  gravatar_id: Schema.NullOr(Schema.String),
});

export type User = Schema.Schema.Type<typeof User>;

// ============================================================================
// Project Types
// ============================================================================

export const ProjectReference = Schema.Struct({
  id: ProjectId,
  permalink: Schema.String,
  name: Schema.String,
  logo_big_url: Schema.NullOr(Schema.String),
});

export type ProjectReference = Schema.Schema.Type<typeof ProjectReference>;

// ============================================================================
// HTTP Types
// ============================================================================

export const HttpStatus = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand("HttpStatus")
);

export const HeaderKey = NonEmptyString.pipe(Schema.brand("HeaderKey"));

export const HeaderValue = NonEmptyString.pipe(Schema.brand("HeaderValue"));

export type HttpStatus = Schema.Schema.Type<typeof HttpStatus>;
export type HeaderKey = Schema.Schema.Type<typeof HeaderKey>;
export type HeaderValue = Schema.Schema.Type<typeof HeaderValue>;

// ============================================================================
// Task Types
// ============================================================================

export const TaskStatus = Schema.Struct({
  id: StatusId,
  name: Schema.String,
  color: Schema.String,
  is_closed: Schema.Boolean,
  order: Schema.Number,
  project: ProjectId,
});

export const TaskDetail = Schema.Struct({
  id: TaskId,
  ref: Schema.Number,
  subject: Schema.String,
  description: Schema.optionalWith(Schema.String, { default: () => "" }),
  status: StatusId,
  status_extra_info:     Schema.Struct({
    name: Schema.String,
    color: Schema.String,
    is_closed: Schema.Boolean,
  }),
  project: ProjectId,
  assigned_to: Schema.NullOr(UserId),
  user_story: Schema.NullOr(UserStoryId),
  milestone: Schema.NullOr(Schema.Number),
  is_blocked: Schema.Boolean,
  is_closed: Schema.Boolean,
  blocked_note: Schema.String,
  created_date: Schema.String,
  modified_date: Schema.String,
  finished_date: Schema.NullOr(Schema.String),
  tags: Schema.Array(Schema.Tuple(TaigaTag, Schema.NullOr(Schema.String))),
  watchers: Schema.Array(UserId),
  is_watcher: Schema.Boolean,
  version: Schema.Number,
});

export const CreateTaskRequest = Schema.Struct({
  project: ProjectId,
  subject: Schema.String,
  description: Schema.optional(Schema.String),
  status: Schema.optional(StatusId),
  assigned_to: Schema.optional(Schema.NullOr(UserId)),
  user_story: Schema.optional(Schema.NullOr(UserStoryId)),
  milestone: Schema.optional(Schema.NullOr(Schema.Number)),
  is_blocked: Schema.optional(Schema.Boolean),
  blocked_note: Schema.optional(Schema.String),
  tags: Schema.optional(Schema.Array(TaigaTag)),
  watchers: Schema.optional(Schema.Array(UserId)),
});

export const UpdateTaskRequest = Schema.Struct({
  subject: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  status: Schema.optional(StatusId),
  assigned_to: Schema.optional(Schema.NullOr(UserId)),
  user_story: Schema.optional(Schema.NullOr(UserStoryId)),
  milestone: Schema.optional(Schema.NullOr(Schema.Number)),
  is_blocked: Schema.optional(Schema.Boolean),
  blocked_note: Schema.optional(Schema.String),
  tags: Schema.optional(Schema.Array(TaigaTag)),
  watchers: Schema.optional(Schema.Array(UserId)),
  version: Schema.Number,
});

export type TaskStatus = Schema.Schema.Type<typeof TaskStatus>;
export type TaskDetail = Schema.Schema.Type<typeof TaskDetail>;
export type CreateTaskRequest = Schema.Schema.Type<typeof CreateTaskRequest>;
export type UpdateTaskRequest = Schema.Schema.Type<typeof UpdateTaskRequest>;

// ============================================================================
// User Story Types
// ============================================================================

export const UserStoryStatus = Schema.Struct({
  id: StatusId,
  name: Schema.String,
  color: Schema.String,
  is_closed: Schema.Boolean,
  is_archived: Schema.Boolean,
  order: Schema.Number,
  project: ProjectId,
});

export const UserStoryDetailCommon = Schema.Struct({
  id: UserStoryId,
  ref: Schema.Number,
  subject: Schema.String,
  status: StatusId,
  status_extra_info: Schema.Struct({
    name: Schema.String,
    color: Schema.String,
    is_closed: Schema.Boolean,
  }),
  project: ProjectId,
  assigned_to: Schema.NullOr(UserId),
  milestone: Schema.NullOr(Schema.Number),
  is_blocked: Schema.Boolean,
  is_closed: Schema.Boolean,
  blocked_note: Schema.String,
  created_date: Schema.String,
  modified_date: Schema.String,
  client_requirement: Schema.Boolean,
  team_requirement: Schema.Boolean,
  tags: Schema.Array(Schema.Tuple(TaigaTag, Schema.NullOr(Schema.String))),
  watchers: Schema.Array(UserId),
  is_watcher: Schema.Boolean,
  version: Schema.Number,
  points: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Number })),
  backlog_order: Schema.Number,
  kanban_order: Schema.Number,
  sprint_order: Schema.Number,
});

export const UserStoryListDetail = Schema.extend(
  UserStoryDetailCommon,
  Schema.Struct({
    assigned_to_extra_info: Schema.NullOr(
      Schema.Struct({
        big_photo: Schema.NullOr(Schema.String),
        full_name_display: Schema.String,
        gravatar_id: Schema.String,
        id: UserId,
        is_active: Schema.Boolean,
        photo: Schema.NullOr(Schema.String),
        username: Schema.String,
      })
    ),
    assigned_users: Schema.Array(UserId),
    attachments: Schema.Array(Schema.Unknown),
    comment: Schema.String,
    due_date: Schema.NullOr(Schema.String),
    due_date_reason: Schema.String,
    due_date_status: Schema.String,
    epic_order: Schema.NullOr(Schema.Number),
    epics: Schema.NullOr(Schema.Unknown),
    external_reference: Schema.NullOr(Schema.String),
    finish_date: Schema.NullOr(Schema.String),
    generated_from_issue: Schema.NullOr(Schema.Number),
    generated_from_task: Schema.NullOr(Schema.Number),
    is_voter: Schema.Boolean,
    milestone_name: Schema.NullOr(Schema.String),
    milestone_slug: Schema.NullOr(Schema.String),
    origin_issue: Schema.NullOr(Schema.Number),
    origin_task: Schema.NullOr(Schema.Number),
    owner: UserId,
    owner_extra_info: Schema.Struct({
      big_photo: Schema.NullOr(Schema.String),
      full_name_display: Schema.String,
      gravatar_id: Schema.String,
      id: UserId,
      is_active: Schema.Boolean,
      photo: Schema.NullOr(Schema.String),
      username: Schema.String,
    }),
    project_extra_info: Schema.Struct({
      id: ProjectId,
      logo_small_url: Schema.NullOr(Schema.String),
      name: Schema.String,
      slug: Schema.String,
    }),
    tasks: Schema.Array(Schema.Unknown),
    total_attachments: Schema.Number,
    total_comments: Schema.Number,
    total_points: Schema.NullOr(Schema.Number),
    total_voters: Schema.Number,
    total_watchers: Schema.Number,
    tribe_gig: Schema.NullOr(Schema.Unknown),
  })
)

export const UserStoryDetail = Schema.extend(
  UserStoryDetailCommon,
  Schema.Struct({
    description: Schema.String,
    finished_date: Schema.optional(Schema.String),
  })
);

export const CreateUserStoryRequest = Schema.Struct({
  project: ProjectId,
  subject: Schema.String,
  description: Schema.optional(Schema.String),
  status: Schema.optional(StatusId),
  assigned_to: Schema.optional(Schema.NullOr(UserId)),
  milestone: Schema.optional(Schema.NullOr(Schema.Number)),
  is_blocked: Schema.optional(Schema.Boolean),
  blocked_note: Schema.optional(Schema.String),
  client_requirement: Schema.optional(Schema.Boolean),
  team_requirement: Schema.optional(Schema.Boolean),
  tags: Schema.optional(Schema.Array(TaigaTag)),
  watchers: Schema.optional(Schema.Array(UserId)),
  points: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: Schema.Number,
    })
  ),
});

export const UpdateUserStoryRequest = Schema.Struct({
  subject: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  status: Schema.optional(StatusId),
  assigned_to: Schema.optional(Schema.NullOr(UserId)),
  milestone: Schema.optional(Schema.NullOr(Schema.Number)),
  is_blocked: Schema.optional(Schema.Boolean),
  blocked_note: Schema.optional(Schema.String),
  client_requirement: Schema.optional(Schema.Boolean),
  team_requirement: Schema.optional(Schema.Boolean),
  tags: Schema.optional(Schema.Array(TaigaTag)),
  watchers: Schema.optional(Schema.Array(UserId)),
  points: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: Schema.Number,
    })
  ),
  version: Schema.Number,
});

export const BulkCreateUserStoriesRequest = Schema.Struct({
  project_id: ProjectId,
  status_id: Schema.optional(StatusId),
  bulk_stories: Schema.String,
});

export const BulkUpdateUserStoryOrderRequest = Schema.Struct({
  project_id: ProjectId,
  bulk_stories: Schema.Array(
    Schema.Struct({
      us_id: UserStoryId,
      order: Schema.Number,
    })
  ),
});

export const BulkUpdateUserStoryMilestoneRequest = Schema.Struct({
  project_id: ProjectId,
  milestone_id: Schema.Number,
  bulk_stories: Schema.Array(
    Schema.Struct({
      us_id: UserStoryId,
      order: Schema.Number,
    })
  ),
});

export const BulkUpdateUserStoryStatusesRequest = Schema.Struct({
  project: ProjectId,
  bulk_userstory_statuses: Schema.Array(Schema.Tuple(StatusId, Schema.Number)),
});

export type UserStoryStatus = Schema.Schema.Type<typeof UserStoryStatus>;
export type UserStoryDetailCommon = Schema.Schema.Type<typeof UserStoryDetailCommon>;
export type UserStoryDetail = Schema.Schema.Type<typeof UserStoryDetail>;
export type UserStoryListDetail = Schema.Schema.Type<typeof UserStoryListDetail>;
export type CreateUserStoryRequest = Schema.Schema.Type<
  typeof CreateUserStoryRequest
>;
export type UpdateUserStoryRequest = Schema.Schema.Type<
  typeof UpdateUserStoryRequest
>;
export type BulkCreateUserStoriesRequest = Schema.Schema.Type<
  typeof BulkCreateUserStoriesRequest
>;
export type BulkUpdateUserStoryOrderRequest = Schema.Schema.Type<
  typeof BulkUpdateUserStoryOrderRequest
>;
export type BulkUpdateUserStoryMilestoneRequest = Schema.Schema.Type<
  typeof BulkUpdateUserStoryMilestoneRequest
>;
export type BulkUpdateUserStoryStatusesRequest = Schema.Schema.Type<
  typeof BulkUpdateUserStoryStatusesRequest
>;

// ============================================================================
// Task Custom Attributes Types
// ============================================================================

export const TaskCustomAttribute = Schema.Struct({
  id: CustomAttributeId,
  name: Schema.String,
  description: Schema.String,
  order: Schema.Number,
  project: ProjectId,
  created_date: Schema.String,
  modified_date: Schema.String,
});

export const CreateTaskCustomAttributeRequest = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  order: Schema.optional(Schema.Number),
  project: ProjectId,
});

export const UpdateTaskCustomAttributeRequest = Schema.Struct({
  name: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  order: Schema.optional(Schema.Number),
});

export type TaskCustomAttribute = Schema.Schema.Type<
  typeof TaskCustomAttribute
>;
export type CreateTaskCustomAttributeRequest = Schema.Schema.Type<
  typeof CreateTaskCustomAttributeRequest
>;
export type UpdateTaskCustomAttributeRequest = Schema.Schema.Type<
  typeof UpdateTaskCustomAttributeRequest
>;

// ============================================================================
// User Story Custom Attributes Types
// ============================================================================

export const UserStoryCustomAttribute = Schema.Struct({
  id: CustomAttributeId,
  name: Schema.String,
  description: Schema.String,
  order: Schema.Number,
  project: ProjectId,
  created_date: Schema.String,
  modified_date: Schema.String,
});

export const CreateUserStoryCustomAttributeRequest = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  order: Schema.optional(Schema.Number),
  project: ProjectId,
});

export const UpdateUserStoryCustomAttributeRequest = Schema.Struct({
  name: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  order: Schema.optional(Schema.Number),
});

export const BulkUpdateUserStoryCustomAttributesRequest = Schema.Struct({
  project: ProjectId,
  bulk_userstory_custom_attributes: Schema.Array(
    Schema.Tuple(CustomAttributeId, Schema.Number)
  ),
});

export const UserStoryCustomAttributesValues = Schema.Struct({
  attributes_values: Schema.Record({
    key: Schema.String,
    value: Schema.String,
  }),
  version: Schema.Number,
});

export type UserStoryCustomAttribute = Schema.Schema.Type<
  typeof UserStoryCustomAttribute
>;
export type CreateUserStoryCustomAttributeRequest = Schema.Schema.Type<
  typeof CreateUserStoryCustomAttributeRequest
>;
export type UpdateUserStoryCustomAttributeRequest = Schema.Schema.Type<
  typeof UpdateUserStoryCustomAttributeRequest
>;
export type BulkUpdateUserStoryCustomAttributesRequest = Schema.Schema.Type<
  typeof BulkUpdateUserStoryCustomAttributesRequest
>;
export type UserStoryCustomAttributesValues = Schema.Schema.Type<
  typeof UserStoryCustomAttributesValues
>;

// ============================================================================
// Points Types
// ============================================================================

export const Point = Schema.Struct({
  id: PointId,
  name: Schema.String,
  order: Schema.Number,
  value: Schema.Number,
  project: ProjectId,
  color: Schema.String,
  created_date: Schema.String,
  modified_date: Schema.String,
});

export const CreatePointRequest = Schema.Struct({
  name: Schema.String,
  value: Schema.Number,
  project: ProjectId,
  color: Schema.optional(Schema.String),
  order: Schema.optional(Schema.Number),
});

export const UpdatePointRequest = Schema.Struct({
  name: Schema.optional(Schema.String),
  value: Schema.optional(Schema.Number),
  color: Schema.optional(Schema.String),
  order: Schema.optional(Schema.Number),
});

export const BulkUpdatePointsRequest = Schema.Struct({
  project: ProjectId,
  bulk_points: Schema.Array(Schema.Tuple(PointId, Schema.Number)),
});

export type Point = Schema.Schema.Type<typeof Point>;
export type CreatePointRequest = Schema.Schema.Type<typeof CreatePointRequest>;
export type UpdatePointRequest = Schema.Schema.Type<typeof UpdatePointRequest>;
export type BulkUpdatePointsRequest = Schema.Schema.Type<
  typeof BulkUpdatePointsRequest
>;

// ============================================================================
// API Service Interfaces
// ============================================================================

export interface AuthService {
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  refresh: (refreshToken: RefreshRequest) => Promise<RefreshResponse>;
}

export interface TasksService {
  list: (filters?: {
    project?: ProjectId;
    status?: StatusId;
    user_story?: UserStoryId;
  }) => Promise<readonly TaskDetail[]>;
  create: (task: CreateTaskRequest) => Promise<TaskDetail>;
  get: (id: TaskId) => Promise<TaskDetail>;
  update: (id: TaskId, task: UpdateTaskRequest) => Promise<TaskDetail>;
  delete: (id: TaskId) => Promise<void>;
}

export interface UserStoriesService {
  list: (filters?: {
    project?: ProjectId;
    status?: StatusId;
    milestone?: number;
    milestone__isnull?: boolean;
    status__is_archived?: boolean;
    tags?: string[];
    watchers?: UserId;
    assigned_to?: UserId;
    epic?: number;
    role?: number;
    status__is_closed?: boolean;
    exclude_status?: StatusId;
    exclude_tags?: string;
    exclude_assigned_to?: UserId;
    exclude_role?: number;
    exclude_epic?: number;
  }) => Promise<readonly UserStoryListDetail[]>;
  create: (userStory: CreateUserStoryRequest) => Promise<UserStoryDetail>;
  get: (id: UserStoryId) => Promise<UserStoryDetail>;
  getByRef: (
    ref: number,
    filters: {
      project?: ProjectId;
      project__slug?: string;
    }
  ) => Promise<UserStoryDetail>;
  update: (
    id: UserStoryId,
    userStory: UpdateUserStoryRequest
  ) => Promise<UserStoryDetail>;
  delete: (id: UserStoryId) => Promise<void>;
  bulkCreate: (
    request: BulkCreateUserStoriesRequest
  ) => Promise<readonly UserStoryDetail[]>;
  bulkUpdateBacklogOrder: (
    request: BulkUpdateUserStoryOrderRequest
  ) => Promise<readonly UserStoryDetail[]>;
  bulkUpdateKanbanOrder: (
    request: BulkUpdateUserStoryOrderRequest
  ) => Promise<readonly UserStoryDetail[]>;
  bulkUpdateSprintOrder: (
    request: BulkUpdateUserStoryOrderRequest
  ) => Promise<readonly UserStoryDetail[]>;
  bulkUpdateMilestone: (
    request: BulkUpdateUserStoryMilestoneRequest
  ) => Promise<void>;
  vote: (id: UserStoryId) => Promise<void>;
  removeVote: (id: UserStoryId) => Promise<void>;
  getVoters: (id: UserStoryId) => Promise<readonly User[]>;
  watch: (id: UserStoryId) => Promise<void>;
  stopWatching: (id: UserStoryId) => Promise<void>;
  getWatchers: (id: UserStoryId) => Promise<readonly User[]>;
}

export interface TaskStatusesService {
  list: (filters?: { project?: ProjectId }) => Promise<readonly TaskStatus[]>;
  create: (status: Omit<TaskStatus, "id">) => Promise<TaskStatus>;
  get: (id: StatusId) => Promise<TaskStatus>;
  update: (
    id: StatusId,
    status: Partial<Omit<TaskStatus, "id">>
  ) => Promise<TaskStatus>;
  delete: (id: StatusId) => Promise<void>;
}

export interface UserStoryStatusesService {
  list: (filters?: {
    project?: ProjectId;
  }) => Promise<readonly UserStoryStatus[]>;
  create: (status: Omit<UserStoryStatus, "id">) => Promise<UserStoryStatus>;
  get: (id: StatusId) => Promise<UserStoryStatus>;
  update: (
    id: StatusId,
    status: Partial<Omit<UserStoryStatus, "id">>
  ) => Promise<UserStoryStatus>;
  delete: (id: StatusId) => Promise<void>;
  bulkUpdateOrder: (
    request: BulkUpdateUserStoryStatusesRequest
  ) => Promise<void>;
}

export interface PointsService {
  list: (filters?: { project?: ProjectId }) => Promise<readonly Point[]>;
  create: (point: CreatePointRequest) => Promise<Point>;
  get: (id: PointId) => Promise<Point>;
  update: (id: PointId, point: UpdatePointRequest) => Promise<Point>;
  delete: (id: PointId) => Promise<void>;
  bulkUpdateOrder: (request: BulkUpdatePointsRequest) => Promise<void>;
}

export interface TaskCustomAttributesService {
  list: (filters?: {
    project?: ProjectId;
  }) => Promise<readonly TaskCustomAttribute[]>;
  create: (
    attribute: CreateTaskCustomAttributeRequest
  ) => Promise<TaskCustomAttribute>;
  get: (id: CustomAttributeId) => Promise<TaskCustomAttribute>;
  update: (
    id: CustomAttributeId,
    attribute: UpdateTaskCustomAttributeRequest
  ) => Promise<TaskCustomAttribute>;
  delete: (id: CustomAttributeId) => Promise<void>;
}

export interface UserStoryCustomAttributesService {
  list: (filters?: {
    project?: ProjectId;
  }) => Promise<readonly UserStoryCustomAttribute[]>;
  create: (
    attribute: CreateUserStoryCustomAttributeRequest
  ) => Promise<UserStoryCustomAttribute>;
  get: (id: CustomAttributeId) => Promise<UserStoryCustomAttribute>;
  update: (
    id: CustomAttributeId,
    attribute: UpdateUserStoryCustomAttributeRequest
  ) => Promise<UserStoryCustomAttribute>;
  delete: (id: CustomAttributeId) => Promise<void>;
  bulkUpdateOrder: (
    request: BulkUpdateUserStoryCustomAttributesRequest
  ) => Promise<void>;
}

export interface UserStoryCustomAttributesValuesService {
  get: (id: CustomAttributeId) => Promise<UserStoryCustomAttribute>;
  update: (
    id: UserStoryId,
    values: UserStoryCustomAttributesValues
  ) => Promise<UserStoryCustomAttributesValues>;
}

// ============================================================================
// HTTP Client Interface
// ============================================================================

export interface HttpClientConfig {
  baseUrl: typeof Url.Type;
  defaultHeaders?: Record<HeaderKey, HeaderValue>;
  timeout?: number;
  credentials?: AuthCredentials;
}

export interface RequestOptions {
  headers?: Record<HeaderKey, HeaderValue>;
  signal?: AbortSignal;
  timeout?: number;
}

export interface HttpResponse<T> {
  data: T;
  status: HttpStatus;
  headers: Record<HeaderKey, HeaderValue>;
}

export interface HttpClient {
  get: (
    path: string,
    options?: RequestOptions & { params?: Record<string, unknown> }
  ) => Promise<HttpResponse<unknown>>;
  post: (
    path: string,
    data?: unknown,
    options?: RequestOptions
  ) => Promise<HttpResponse<unknown>>;
  put: (
    path: string,
    data?: unknown,
    options?: RequestOptions
  ) => Promise<HttpResponse<unknown>>;
  patch: (
    path: string,
    data?: unknown,
    options?: RequestOptions
  ) => Promise<HttpResponse<unknown>>;
  delete: (
    path: string,
    options?: RequestOptions
  ) => Promise<HttpResponse<void>>;
}

// ============================================================================
// Main Taiga API Interface
// ============================================================================

export interface TaigaApi {
  auth: AuthService;
  tasks: TasksService;
  userStories: UserStoriesService;
  taskStatuses: TaskStatusesService;
  userStoryStatuses: UserStoryStatusesService;
  points: PointsService;
  taskCustomAttributes: TaskCustomAttributesService;
  userStoryCustomAttributes: UserStoryCustomAttributesService;
  userStoryCustomAttributesValues: UserStoryCustomAttributesValuesService;
}

export interface TaigaApiFactory {
  create: (config: HttpClientConfig) => TaigaApi;
}

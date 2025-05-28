import { Schema } from "effect";
import { NonEmptyString, Url } from '@taiga-task-master/common';

// ============================================================================
// Authentication Types
// ============================================================================

export const AuthCredentials = Schema.Struct({
  username: Schema.String,
  password: Schema.String,
  type: Schema.Literal("normal")
});

export const AuthToken = NonEmptyString.pipe(
  Schema.brand('AuthToken')
);

export const RefreshToken = NonEmptyString.pipe(
  Schema.brand('RefreshToken')
);

export const AuthResponse = Schema.Struct({
  id: Schema.Number,
  username: Schema.String,
  email: Schema.String,
  full_name: Schema.String,
  auth_token: AuthToken,
  refresh: RefreshToken,
  accepted_terms: Schema.Boolean,
  read_new_terms: Schema.Boolean
});

export const RefreshRequest = Schema.Struct({
  refresh: Schema.String
});

export const RefreshResponse = Schema.Struct({
  auth_token: AuthToken,
  refresh: RefreshToken
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

export type ProjectId = Schema.Schema.Type<typeof ProjectId>;
export type TaskId = Schema.Schema.Type<typeof TaskId>;
export type UserStoryId = Schema.Schema.Type<typeof UserStoryId>;
export type StatusId = Schema.Schema.Type<typeof StatusId>;
export type UserId = Schema.Schema.Type<typeof UserId>;
export type CustomAttributeId = Schema.Schema.Type<typeof CustomAttributeId>;

// ============================================================================
// HTTP Types
// ============================================================================

export const HttpStatus = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand("HttpStatus")
);

export const HeaderKey = NonEmptyString.pipe(
  Schema.brand("HeaderKey")
);

export const HeaderValue = NonEmptyString.pipe(
  Schema.brand("HeaderValue")
);

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
  project: ProjectId
});

export const TaskDetail = Schema.Struct({
  id: TaskId,
  ref: Schema.Number,
  subject: Schema.String,
  description: Schema.String,
  status: StatusId,
  status_extra_info: Schema.optional(Schema.Struct({
    id: StatusId,
    name: Schema.String,
    color: Schema.String,
    is_closed: Schema.Boolean
  })),
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
  tags: Schema.Array(Schema.Tuple(Schema.String, Schema.NullOr(Schema.String))),
  watchers: Schema.Array(UserId),
  is_watcher: Schema.Boolean,
  version: Schema.Number
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
  tags: Schema.optional(Schema.Array(Schema.String)),
  watchers: Schema.optional(Schema.Array(UserId))
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
  tags: Schema.optional(Schema.Array(Schema.String)),
  watchers: Schema.optional(Schema.Array(UserId)),
  version: Schema.Number
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
  project: ProjectId
});

export const UserStoryDetail = Schema.Struct({
  id: UserStoryId,
  ref: Schema.Number,
  subject: Schema.String,
  description: Schema.String,
  status: StatusId,
  status_extra_info: Schema.optional(Schema.Struct({
    id: StatusId,
    name: Schema.String,
    color: Schema.String,
    is_closed: Schema.Boolean,
    is_archived: Schema.Boolean
  })),
  project: ProjectId,
  assigned_to: Schema.NullOr(UserId),
  milestone: Schema.NullOr(Schema.Number),
  is_blocked: Schema.Boolean,
  is_closed: Schema.Boolean,
  blocked_note: Schema.String,
  created_date: Schema.String,
  modified_date: Schema.String,
  finished_date: Schema.NullOr(Schema.String),
  client_requirement: Schema.Boolean,
  team_requirement: Schema.Boolean,
  tags: Schema.Array(Schema.Tuple(Schema.String, Schema.NullOr(Schema.String))),
  watchers: Schema.Array(UserId),
  is_watcher: Schema.Boolean,
  version: Schema.Number,
  points: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Number})),
  backlog_order: Schema.Number,
  kanban_order: Schema.Number,
  sprint_order: Schema.Number
});

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
  tags: Schema.optional(Schema.Array(Schema.String)),
  watchers: Schema.optional(Schema.Array(UserId)),
  points: Schema.optional(Schema.Record({
    key: Schema.String,
    value: Schema.Number
  }))
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
  tags: Schema.optional(Schema.Array(Schema.String)),
  watchers: Schema.optional(Schema.Array(UserId)),
  points: Schema.optional(Schema.Record({
    key: Schema.String, value: Schema.Number
  })),
  version: Schema.Number
});

export type UserStoryStatus = Schema.Schema.Type<typeof UserStoryStatus>;
export type UserStoryDetail = Schema.Schema.Type<typeof UserStoryDetail>;
export type CreateUserStoryRequest = Schema.Schema.Type<typeof CreateUserStoryRequest>;
export type UpdateUserStoryRequest = Schema.Schema.Type<typeof UpdateUserStoryRequest>;

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
  modified_date: Schema.String
});

export const CreateTaskCustomAttributeRequest = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  order: Schema.optional(Schema.Number),
  project: ProjectId
});

export const UpdateTaskCustomAttributeRequest = Schema.Struct({
  name: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  order: Schema.optional(Schema.Number)
});

export type TaskCustomAttribute = Schema.Schema.Type<typeof TaskCustomAttribute>;
export type CreateTaskCustomAttributeRequest = Schema.Schema.Type<typeof CreateTaskCustomAttributeRequest>;
export type UpdateTaskCustomAttributeRequest = Schema.Schema.Type<typeof UpdateTaskCustomAttributeRequest>;

// ============================================================================
// API Service Interfaces
// ============================================================================

export interface AuthService {
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  refresh: (refreshToken: RefreshRequest) => Promise<RefreshResponse>;
}

export interface TasksService {
  list: (filters?: { project?: ProjectId; status?: StatusId; user_story?: UserStoryId }) => Promise<TaskDetail[]>;
  create: (task: CreateTaskRequest) => Promise<TaskDetail>;
  get: (id: TaskId) => Promise<TaskDetail>;
  update: (id: TaskId, task: UpdateTaskRequest) => Promise<TaskDetail>;
  delete: (id: TaskId) => Promise<void>;
}

export interface UserStoriesService {
  list: (filters?: { project?: ProjectId; status?: StatusId; milestone?: number }) => Promise<UserStoryDetail[]>;
  create: (userStory: CreateUserStoryRequest) => Promise<UserStoryDetail>;
  get: (id: UserStoryId) => Promise<UserStoryDetail>;
  update: (id: UserStoryId, userStory: UpdateUserStoryRequest) => Promise<UserStoryDetail>;
  delete: (id: UserStoryId) => Promise<void>;
}

export interface TaskStatusesService {
  list: (filters?: { project?: ProjectId }) => Promise<TaskStatus[]>;
  create: (status: Omit<TaskStatus, 'id'>) => Promise<TaskStatus>;
  get: (id: StatusId) => Promise<TaskStatus>;
  update: (id: StatusId, status: Partial<Omit<TaskStatus, 'id'>>) => Promise<TaskStatus>;
  delete: (id: StatusId) => Promise<void>;
}

export interface TaskCustomAttributesService {
  list: (filters?: { project?: ProjectId }) => Promise<TaskCustomAttribute[]>;
  create: (attribute: CreateTaskCustomAttributeRequest) => Promise<TaskCustomAttribute>;
  get: (id: CustomAttributeId) => Promise<TaskCustomAttribute>;
  update: (id: CustomAttributeId, attribute: UpdateTaskCustomAttributeRequest) => Promise<TaskCustomAttribute>;
  delete: (id: CustomAttributeId) => Promise<void>;
}

// ============================================================================
// HTTP Client Interface
// ============================================================================

export interface HttpClientConfig {
  baseUrl: typeof Url.Type;
  defaultHeaders?: Record<HeaderKey, HeaderValue>;
  timeout?: number;
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
  get: <T>(path: string, options?: RequestOptions & { params?: Record<string, unknown> }) => Promise<HttpResponse<T>>;
  post: <T>(path: string, data?: unknown, options?: RequestOptions) => Promise<HttpResponse<T>>;
  put: <T>(path: string, data?: unknown, options?: RequestOptions) => Promise<HttpResponse<T>>;
  patch: <T>(path: string, data?: unknown, options?: RequestOptions) => Promise<HttpResponse<T>>;
  delete: (path: string, options?: RequestOptions) => Promise<HttpResponse<void>>;
}

// ============================================================================
// Main Taiga API Interface
// ============================================================================

export interface TaigaApi {
  auth: AuthService;
  tasks: TasksService;
  userStories: UserStoriesService;
  taskStatuses: TaskStatusesService;
  taskCustomAttributes: TaskCustomAttributesService;
}

export interface TaigaApiFactory {
  create: (config: HttpClientConfig) => TaigaApi;
}
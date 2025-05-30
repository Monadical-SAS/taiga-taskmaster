import { Schema } from "effect";
import {
  UserStoryId,
  ProjectId,
  StatusId,
  UserId,
  User,
  ProjectReference,
} from "./api.js";

// ============================================================================
// Webhook Common Types
// ============================================================================

export const WebhookAction = Schema.Literal("create", "change", "delete");
export const WebhookObjectType = Schema.Literal("userstory", "task", "issue");

export type WebhookAction = Schema.Schema.Type<typeof WebhookAction>;
export type WebhookObjectType = Schema.Schema.Type<typeof WebhookObjectType>;

// ============================================================================
// Webhook User Story Types (based on webhook structure, not API docs)
// ============================================================================

export const WebhookUserStoryPoint = Schema.Struct({
  role: Schema.String,
  name: Schema.String,
  value: Schema.NullOr(Schema.Number),
});

export const WebhookUserStoryStatus = Schema.Struct({
  id: StatusId,
  name: Schema.String,
  slug: Schema.String,
  color: Schema.String,
  is_closed: Schema.Boolean,
  is_archived: Schema.Boolean,
});

export const WebhookUserStoryData = Schema.Struct({
  custom_attributes_values: Schema.Record({
    key: Schema.String,
    value: Schema.Unknown,
  }),
  id: UserStoryId,
  ref: Schema.Number,
  project: ProjectReference,
  is_closed: Schema.Boolean,
  created_date: Schema.String,
  modified_date: Schema.String,
  finish_date: Schema.NullOr(Schema.String), // Note: webhook uses 'finish_date', API uses 'finished_date'
  due_date: Schema.NullOr(Schema.String),
  due_date_reason: Schema.String,
  subject: Schema.String,
  client_requirement: Schema.Boolean,
  team_requirement: Schema.Boolean,
  generated_from_issue: Schema.NullOr(Schema.Number),
  generated_from_task: Schema.NullOr(Schema.Number),
  from_task_ref: Schema.NullOr(Schema.String),
  external_reference: Schema.NullOr(Schema.String),
  tribe_gig: Schema.NullOr(Schema.String),
  watchers: Schema.Array(UserId),
  is_blocked: Schema.Boolean,
  blocked_note: Schema.String,
  description: Schema.String,
  tags: Schema.Array(Schema.String), // Note: webhook uses string[], API uses [tag, color][]
  permalink: Schema.String,
  owner: User,
  assigned_to: Schema.NullOr(User), // Note: webhook uses full User object, API uses UserId
  assigned_users: Schema.Array(User),
  points: Schema.Array(WebhookUserStoryPoint), // Note: webhook uses array, API uses object
  status: WebhookUserStoryStatus, // Note: webhook uses full object, API uses StatusId
  milestone: Schema.NullOr(Schema.Number),
});

export const WebhookChangeInfo = Schema.Struct({
  comment: Schema.String,
  comment_html: Schema.String,
  delete_comment_date: Schema.NullOr(Schema.String),
  comment_versions: Schema.NullOr(Schema.Unknown),
  edit_comment_date: Schema.NullOr(Schema.String),
  diff: Schema.Record({
    key: Schema.String,
    value: Schema.String, // Note: description_diff contains the whole description, not a diff
  }),
});

export type WebhookUserStoryPoint = Schema.Schema.Type<
  typeof WebhookUserStoryPoint
>;
export type WebhookUserStoryStatus = Schema.Schema.Type<
  typeof WebhookUserStoryStatus
>;
export type WebhookUserStoryData = Schema.Schema.Type<
  typeof WebhookUserStoryData
>;
export type WebhookChangeInfo = Schema.Schema.Type<typeof WebhookChangeInfo>;

// ============================================================================
// Base Webhook Message Structure
// ============================================================================

export const BaseWebhookMessage = Schema.Struct({
  action: WebhookAction,
  type: WebhookObjectType,
  by: User,
  date: Schema.String, // ISO date string
});

export type BaseWebhookMessage = Schema.Schema.Type<typeof BaseWebhookMessage>;

// ============================================================================
// User Story Webhook Messages
// ============================================================================

export const UserStoryCreateWebhookMessage = Schema.Struct({
  action: Schema.Literal("create"),
  type: Schema.Literal("userstory"),
  by: User,
  date: Schema.String,
  data: WebhookUserStoryData,
});

export const UserStoryChangeWebhookMessage = Schema.Struct({
  action: Schema.Literal("change"),
  type: Schema.Literal("userstory"),
  by: User,
  date: Schema.String,
  data: WebhookUserStoryData,
  change: WebhookChangeInfo,
});

export const UserStoryDeleteWebhookMessage = Schema.Struct({
  action: Schema.Literal("delete"),
  type: Schema.Literal("userstory"),
  by: User,
  date: Schema.String,
  data: WebhookUserStoryData,
});

export const UserStoryWebhookMessage = Schema.Union(
  UserStoryCreateWebhookMessage,
  UserStoryChangeWebhookMessage,
  UserStoryDeleteWebhookMessage
);

export type UserStoryCreateWebhookMessage = Schema.Schema.Type<
  typeof UserStoryCreateWebhookMessage
>;
export type UserStoryChangeWebhookMessage = Schema.Schema.Type<
  typeof UserStoryChangeWebhookMessage
>;
export type UserStoryDeleteWebhookMessage = Schema.Schema.Type<
  typeof UserStoryDeleteWebhookMessage
>;
export type UserStoryWebhookMessage = Schema.Schema.Type<
  typeof UserStoryWebhookMessage
>;

// ============================================================================
// Generic Webhook Message Union (extensible for tasks, issues, etc.)
// ============================================================================

export const WebhookMessage = Schema.Union(UserStoryWebhookMessage);

export type WebhookMessage = Schema.Schema.Type<typeof WebhookMessage>;

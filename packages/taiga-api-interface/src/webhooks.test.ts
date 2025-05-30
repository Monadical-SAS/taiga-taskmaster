import { Schema } from "effect";
import { expect, test, describe } from "vitest";
import {
  UserStoryCreateWebhookMessage,
  UserStoryChangeWebhookMessage,
  UserStoryWebhookMessage,
} from "./index.js";

// Example webhook payloads
const createWebhookExample = {
  action: "create",
  type: "userstory",
  by: {
    id: 817212,
    permalink: "https://tree.taiga.io/profile/dearlordylord",
    username: "dearlordylord",
    full_name: "Igor Loskutov",
    photo: null,
    gravatar_id: "7416a8945fcf732aceaa2e3496539296",
  },
  date: "2025-05-30T18:11:36.595Z",
  data: {
    custom_attributes_values: {},
    id: 7918000,
    ref: 12,
    project: {
      id: 1693793,
      permalink: "https://tree.taiga.io/project/dearlordylord-tasks",
      name: "Tasks",
      logo_big_url: null,
    },
    is_closed: false,
    created_date: "2025-05-30T18:11:36.541Z",
    modified_date: "2025-05-30T18:11:36.547Z",
    finish_date: null,
    due_date: null,
    due_date_reason: "",
    subject: "PRD1",
    client_requirement: false,
    team_requirement: false,
    generated_from_issue: null,
    generated_from_task: null,
    from_task_ref: null,
    external_reference: null,
    tribe_gig: null,
    watchers: [],
    is_blocked: false,
    blocked_note: "",
    description: "make me fun todo app with fun effects",
    tags: [],
    permalink: "https://tree.taiga.io/project/dearlordylord-tasks/us/12",
    owner: {
      id: 817212,
      permalink: "https://tree.taiga.io/profile/dearlordylord",
      username: "dearlordylord",
      full_name: "Igor Loskutov",
      photo: null,
      gravatar_id: "7416a8945fcf732aceaa2e3496539296",
    },
    assigned_to: null,
    assigned_users: [],
    points: [
      {
        role: "UX",
        name: "?",
        value: null,
      },
      {
        role: "Design",
        name: "?",
        value: null,
      },
      {
        role: "Front",
        name: "?",
        value: null,
      },
      {
        role: "Back",
        name: "?",
        value: null,
      },
    ],
    status: {
      id: 10268077,
      name: "New",
      slug: "new",
      color: "#70728F",
      is_closed: false,
      is_archived: false,
    },
    milestone: null,
  },
};

const changeWebhookExample = {
  action: "change",
  type: "userstory",
  by: {
    id: 817212,
    permalink: "https://tree.taiga.io/profile/dearlordylord",
    username: "dearlordylord",
    full_name: "Igor Loskutov",
    photo: null,
    gravatar_id: "7416a8945fcf732aceaa2e3496539296",
  },
  date: "2025-05-30T19:17:27.361Z",
  data: {
    custom_attributes_values: {},
    id: 7918000,
    ref: 12,
    project: {
      id: 1693793,
      permalink: "https://tree.taiga.io/project/dearlordylord-tasks",
      name: "Tasks",
      logo_big_url: null,
    },
    is_closed: false,
    created_date: "2025-05-30T18:11:36.541Z",
    modified_date: "2025-05-30T19:17:27.327Z",
    finish_date: null,
    due_date: null,
    due_date_reason: "",
    subject: "PRD1",
    client_requirement: false,
    team_requirement: false,
    generated_from_issue: null,
    generated_from_task: null,
    from_task_ref: null,
    external_reference: null,
    tribe_gig: null,
    watchers: [],
    is_blocked: false,
    blocked_note: "",
    description: "make me fun todo app with fun effects. very reliable",
    tags: [],
    permalink: "https://tree.taiga.io/project/dearlordylord-tasks/us/12",
    owner: {
      id: 817212,
      permalink: "https://tree.taiga.io/profile/dearlordylord",
      username: "dearlordylord",
      full_name: "Igor Loskutov",
      photo: null,
      gravatar_id: "7416a8945fcf732aceaa2e3496539296",
    },
    assigned_to: null,
    assigned_users: [],
    points: [
      {
        role: "UX",
        name: "?",
        value: null,
      },
      {
        role: "Design",
        name: "?",
        value: null,
      },
      {
        role: "Front",
        name: "?",
        value: null,
      },
      {
        role: "Back",
        name: "?",
        value: null,
      },
    ],
    status: {
      id: 10268077,
      name: "New",
      slug: "new",
      color: "#70728F",
      is_closed: false,
      is_archived: false,
    },
    milestone: null,
  },
  change: {
    comment: "",
    comment_html: "",
    delete_comment_date: null,
    comment_versions: null,
    edit_comment_date: null,
    diff: {
      description_diff: "Check the history API for the exact diff",
    },
  },
};

describe("Webhook Message Parsing", () => {
  test("should parse user story create webhook message", () => {
    const result = Schema.decodeUnknownEither(UserStoryCreateWebhookMessage)(
      createWebhookExample
    );

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.action).toBe("create");
      expect(result.right.type).toBe("userstory");
      expect(result.right.data.id).toBe(7918000);
      expect(result.right.data.subject).toBe("PRD1");
      expect(result.right.data.description).toBe(
        "make me fun todo app with fun effects"
      );
      expect(result.right.by.username).toBe("dearlordylord");
    }
  });

  test("should parse user story change webhook message", () => {
    const result = Schema.decodeUnknownEither(UserStoryChangeWebhookMessage)(
      changeWebhookExample
    );

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.action).toBe("change");
      expect(result.right.type).toBe("userstory");
      expect(result.right.data.id).toBe(7918000);
      expect(result.right.data.description).toBe(
        "make me fun todo app with fun effects. very reliable"
      );
      expect(result.right.change.diff.description_diff).toBe(
        "Check the history API for the exact diff"
      );
    }
  });

  test("should parse using union type", () => {
    const createResult = Schema.decodeUnknownEither(UserStoryWebhookMessage)(
      createWebhookExample
    );
    const changeResult = Schema.decodeUnknownEither(UserStoryWebhookMessage)(
      changeWebhookExample
    );

    expect(createResult._tag).toBe("Right");
    expect(changeResult._tag).toBe("Right");
  });

  test("should validate webhook data structure correctly", () => {
    const result = Schema.decodeUnknownEither(UserStoryCreateWebhookMessage)(
      createWebhookExample
    );

    if (result._tag === "Right") {
      const webhook = result.right;

      // Test webhook-specific structure differences from API
      expect(webhook.data.finish_date).toBe(null); // webhook uses 'finish_date'
      expect(webhook.data.assigned_to).toBe(null); // webhook can have full User object or null
      expect(Array.isArray(webhook.data.points)).toBe(true); // webhook uses array format
      expect(webhook.data.status.slug).toBe("new"); // webhook has full status object with slug
      expect(Array.isArray(webhook.data.tags)).toBe(true); // webhook uses string array
      expect(webhook.data.permalink).toBeDefined(); // webhook has permalink
      expect(webhook.data.owner).toBeDefined(); // webhook has owner
    }
  });
});

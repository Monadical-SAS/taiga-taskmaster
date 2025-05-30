// @vibe-generated: example usage of new Taiga webhook system
import {
  createTaigaWebhookConfig,
  processTaigaWebhook,
} from "./taiga-webhook.js";
import type { UserStoryCreateWebhookMessage } from "@taiga-task-master/taiga-api-interface";

/**
 * Example of how to use the new Taiga webhook system
 */
export async function exampleTaigaWebhookUsage() {
  // 1. Create configuration from environment
  const config = createTaigaWebhookConfig();

  // 2. Define your business logic processor
  const myProcessor = async (message: UserStoryCreateWebhookMessage) => {
    console.log(`Processing user story: ${message.data.subject}`);
    console.log(`Project: ${message.data.project.name}`);
    console.log(`Created by: ${message.by.full_name}`);

    // Your custom logic here
    // For example: generate tasks, sync to another system, etc.

    return {
      processedId: message.data.id,
      summary: `Processed user story "${message.data.subject}"`,
    };
  };

  // 3. Create the curried processor function
  const processWebhook = processTaigaWebhook(config)(myProcessor);

  // 4. Example webhook request (would come from Taiga)
  const exampleRequest = {
    headers: {
      "x-taiga-webhook-signature": "example-signature", // Would be real signature from Taiga
    },
    body: {
      action: "create",
      type: "userstory",
      by: {
        id: 12345,
        permalink: "https://tree.taiga.io/profile/user",
        username: "user",
        full_name: "John Doe",
        photo: null,
        gravatar_id: null,
      },
      date: new Date().toISOString(),
      data: {
        custom_attributes_values: {},
        id: 78901,
        ref: 42,
        project: {
          id: 56789,
          permalink: "https://tree.taiga.io/project/my-project",
          name: "My Project",
          logo_big_url: null,
        },
        is_closed: false,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        finish_date: null,
        due_date: null,
        due_date_reason: "",
        subject: "Implement awesome feature",
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
        description: "This is an awesome feature that needs to be implemented",
        tags: ["prd", "high-priority"], // Contains the required "prd" tag
        permalink: "https://tree.taiga.io/project/my-project/us/42",
        owner: {
          id: 12345,
          permalink: "https://tree.taiga.io/profile/user",
          username: "user",
          full_name: "John Doe",
          photo: null,
          gravatar_id: null,
        },
        assigned_to: null,
        assigned_users: [],
        points: [
          {
            role: "Frontend",
            name: "Medium",
            value: 3,
          },
        ],
        status: {
          id: 98765,
          name: "New",
          slug: "new",
          color: "#999999",
          is_closed: false,
          is_archived: false,
        },
        milestone: null,
      },
    },
  };

  // 5. Process the webhook
  const result = await processWebhook(exampleRequest);

  if (result.success) {
    console.log("✅ Webhook processed successfully:", result.result);
  } else {
    console.error("❌ Webhook failed:", result.error);
  }

  return result;
}

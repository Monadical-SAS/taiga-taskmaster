#!/usr/bin/env node

import { readFile } from "fs/promises";
import { createHmac } from "crypto";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Script to send a test webhook to the running webhook server
 * with proper HMAC-SHA1 signature authentication
 */
async function sendTestWebhook() {
  try {
    // Get webhook token from environment
    const webhookToken = process.env.WEBHOOK_TOKEN || "token@RvPj7b7fp";
    const webhookUrl =
      process.env.WEBHOOK_URL || "http://localhost:3004/api/taiga-webhook";

    console.log(`🔑 Using webhook token: ${webhookToken}`);
    console.log(`🎯 Sending to: ${webhookUrl}`);

    // Read the webhook example file
    const examplePath = join(__dirname, "../../../docs/webhook_example.json");
    const webhookBody = await readFile(examplePath, "utf8");

    console.log(`📄 Loaded webhook body from: ${examplePath}`);

    // Generate HMAC-SHA1 signature
    const mac = createHmac("sha1", webhookToken);
    mac.update(webhookBody, "utf8");
    const signature = mac.digest("hex");

    console.log(`🔐 Generated signature: ${signature}`);

    // Send the webhook request
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-taiga-webhook-signature": signature,
      },
      body: webhookBody,
    });

    console.log(
      `📡 Response status: ${response.status} ${response.statusText}`
    );

    const responseBody = await response.text();
    console.log(`📥 Response body:`, responseBody);

    if (response.ok) {
      console.log("✅ Webhook sent successfully!");
    } else {
      console.log("❌ Webhook failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Error sending webhook:", error);
    process.exit(1);
  }
}

// Run the script
sendTestWebhook();

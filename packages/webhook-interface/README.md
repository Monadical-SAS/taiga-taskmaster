# @taiga-task-master/webhook-interface

Interface package defining contracts and schemas for the webhook receiver module.

## Purpose

This package contains:

- HTTP request/response schemas using Effect Schema
- Environment configuration schemas
- Authorization validation utilities
- Dependency injection interfaces for webhook handlers

## Key Types

- `WebhookPayload`: Schema for incoming PRD update payloads
- `WebhookRequest`/`WebhookResponse`: HTTP request/response schemas
- `WebhookConfig`: Environment configuration schema
- `WebhookDeps`: Dependency injection interface
- `WebhookHandler`: Main handler function type

## Validation Functions

- `validateAuthHeader`: Validates Bearer token authorization
- `validateEnvironment`: Validates required environment variables at startup

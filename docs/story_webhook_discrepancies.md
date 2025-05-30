# User Story Webhook vs API Documentation Discrepancies

This document lists discrepancies between the webhook payload structure and the API documentation.

## Field Name Differences

### Webhook vs API Docs

- Webhook: `finish_date` → API Docs: `finished_date`
- Webhook: `custom_attributes_values` (object) → API Docs: Not documented in main user story schema

## Structure Differences

### Project Reference

- **Webhook**: Full project object with `{ id, permalink, name, logo_big_url }`
- **API Docs**: Simple `project: ProjectId` reference

### User References

- **Webhook**: Full user objects for `owner`, `assigned_to` with `{ id, permalink, username, full_name, photo, gravatar_id }`
- **API Docs**: Simple `assigned_to: UserId` reference

### Status

- **Webhook**: Full status object with `{ id, name, slug, color, is_closed, is_archived }`
- **API Docs**: Simple `status: StatusId` reference with optional `status_extra_info`

### Points Structure

- **Webhook**: Array format `[{ role, name, value }]`
- **API Docs**: Dictionary format `{ "1": 4, "2": 3 }`

### Tags

- **Webhook**: Simple string array `["tag1", "tag2"]`
- **API Docs**: Tuple array `[[tag, color], [tag, color]]`

### Custom Attributes

- **Webhook**: `custom_attributes_values` as object `{ "3": "240 min" }`
- **API Docs**: Documented separately in custom attributes endpoints

## Additional Webhook Fields

These fields appear in webhook but not in main API documentation:

- `due_date_reason`
- `generated_from_issue`
- `generated_from_task`
- `from_task_ref`
- `external_reference`
- `tribe_gig`
- `permalink`
- `owner`
- `assigned_users` (array vs single `assigned_to`)

## Missing Webhook Fields

These fields from API docs don't appear in webhook:

- `backlog_order`
- `kanban_order`
- `sprint_order`
- `is_watcher`
- `version`

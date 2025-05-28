## 23. Tasks

### 23.1. List

To list tasks send a GET request with the following parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [task list objects](https://docs.taiga.io/api.html#object-task-detail-list)
The results can be filtered using the following parameters:

- **project**: project id
- **status**: status id
- **tags**: separated by ","
- **user_story**: user story id
- **role**: role id
- **owner**: owner id
- **milestone**: milestone id
- **watchers**: watching user id
- **assigned_to**: assigned to user id
- **status\_\_is_closed**: (true|false)
- **exclude_status**: status id
- **exclude_tags**: separared by ","
- **exclude_role**: role id
- **exclude_owner**: owner id
- **exclude_assigned_to**: assigned to user id
  the "exclude\_" params work excluding from the response the results with which they match.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

### 23.2. Create

To create tasks send a POST request with the following data:

- **assigned_to**: user id
- **blocked_note**: reason why the task is blocked
- **description**: string
- **is_blocked**: boolean
- **is_closed**: boolean
- **milestone**: milestone id
- **project** (required): project id
- **user_story**: user story id
- **status**: status id
- **subject** (required)
- **tags**: array of strings
- **us_order**: order in the user story,
- **taskboard_order**: order in the taskboard,
- **is_iocaine**: boolean,
- **external_reference**: tuple of ("service", serviceId),
- **watchers**: array of watcher id’s

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"assigned_to": null,
"blocked_note": "blocking reason",
"description": "Implement API CALL",
"external_reference": null,
"is_blocked": false,
"is_closed": true,
"is_iocaine": false,
"milestone": null,
"project": 1,
"status": 1,
"subject": "Customer personal data",
"tags": [
"service catalog",
"customer"
],
"taskboard_order": 1,
"us_order": 1,
"user_story": 17,
"watchers": []
}' \
```

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"project": 1,
"subject": "Customer personal data"
}' \
```

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [task detail object](https://docs.taiga.io/api.html#object-task-detail)

### 23.3. Get

To get a task send a GET request specifying the task id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [task detail (GET) object](https://docs.taiga.io/api.html#object-task-detail-get)

### 23.4. Get by ref

To get a task send a GET request specifying the task reference and one of the following parameters:

- project (project id)
- project\_\_slug

```json
"assigned_to": 15,
"assigned_to_extra_info": {
"big_photo": null,
"full_name_display": "Virginia Castro",
"gravatar_id": "69b60d39a450e863609ae3546b12b360",
"id": 15,
"is_active": true,
"photo": null,
"username": "user9"
},
"attachments": [],
"blocked_note": "",
"blocked_note_html": "",
"comment": "",
"created_date": "2020-07-02T11:56:21.529Z",
"description": "Nam veritatis facere debitis vitae animi eos cum suscipit reprehenderit.",
"description_html": "&lt;p&gt;Nam veritatis facere debitis vitae animi eos cum suscipit reprehenderit.&lt;/p&gt;",
"due_date": null,
"due_date_reason": "",
"due_date_status": "not_set",
"external_reference": null,
"finished_date": "2020-05-10T05:32:33.173Z",
"generated_user_stories": null,
"id": 1,
"is_blocked": false,
"is_closed": true,
"is_iocaine": false,
"is_voter": false,
"is_watcher": true,
"milestone": 1,
"milestone_slug": "sprint-2020-5-8",
"modified_date": "2020-07-03T08:41:01.723Z",
"neighbors": {
"next": {
"id": 2,
"ref": 3,
"subject": "Add tests for bulk operations"
},
"previous": null
},
"owner": 14,
"owner_extra_info": {
"big_photo": null,
"full_name_display": "Miguel Molina",
"gravatar_id": "dce0e8ed702cd85d5132e523121e619b",
"id": 14,
"is_active": true,
"photo": null,
"username": "user8"
},
"project": 1,
"project_extra_info": {
"id": 1,
"logo_small_url": null,
"name": "Beta project patch",
"slug": "project-0"
},
"ref": 2,
"status": 3,
"status_extra_info": {
"color": "#ffcc00",
"is_closed": true,
"name": "Ready for test"
},
"subject": "Patching subject",
"tags": [
[
"atque",
null
],
[
"animi",
null
],
[
"cum",
null
],
[
"eveniet",
null
],
[
"cumque",
null
],
[
"reiciendis",
null
],
[
"architecto",
null
],
[
"perspiciatis",
null
]
],
"taskboard_order": 1593690981529,
"total_comments": 1,
"total_voters": 6,
"total_watchers": 3,
"us_order": 1593690981529,
"user_story": 1,
"user_story_extra_info": {
"epics": [
{
"color": "#f57900",
"id": 15,
"project": {
"id": 3,
"name": "Project Example 2",
"slug": "project-2"
},
"ref": 121,
"subject": "Patching subject"
}
],
"id": 1,
"ref": 1,
"subject": "Patching subject"
},
"version": 2,
"watchers": [
8,
3,
6
]
```

The HTTP response is a 200 OK and the response body is a JSON [task detail (GET) object](https://docs.taiga.io/api.html#object-task-detail-get)

### 23.5. Edit

To edit tasks send a PUT or a PATCH specifying the task id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"subject": "Patching subject",
"version": 1
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [task detail object](https://docs.taiga.io/api.html#object-task-detail)

### 23.6. Delete

To delete tasks send a DELETE specifying the task id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

### 23.7. Bulk creation

To create multiple tasks at the same time send a POST request with the following data:

- **project_id** (required)
- **status_id**
- **sprint_id**: milestone id (optional)
- **us_id**: user story id (optional)
- **bulk_tasks**: task subjects, one per line

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_tasks": "Task 1 \n Task 2 \n Task 3",
"milestone_id": 1,
"project_id": 1
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON list of [task detail object](https://docs.taiga.io/api.html#object-task-detail)

### 23.8. Filters data

To get the task filters data send a GET request specifying the project id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [task filters data object](https://docs.taiga.io/api.html#object-task-filters-data)

### 23.9. Vote a task

To vote tasks send a POST request specifying the task id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK with an empty body response

### 23.10. Remove vote from a task

To remove a vote from a task send a POST request specifying the task id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When remove of the vote succeeded, the HTTP response is a 200 OK with an empty body response

### 23.11. Get task voters list

To get the list of voters from a task send a GET request specifying the task id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [task voter object](https://docs.taiga.io/api.html#object-task-voter-detail)

### 23.12. Watch a task

To watch a task send a POST request specifying the task id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK with an empty body response

### 23.13. Stop watching a task

To stop watching a task send a POST request specifying the task id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK with an empty body response

### 23.14. List task watchers

To get the list of watchers from a task send a GET request specifying the task id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [task watcher object](https://docs.taiga.io/api.html#object-userstory-watcher-detail)

### 23.15. List attachments

To list task attachments send a GET request with the following parameters:

- **project**: project id
- **object_id**: task id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [attachment detail objects](https://docs.taiga.io/api.html#object-attachment-detail)

### 23.16. Create attachment

To create task attachments send a POST request with the following data:

- **object_id** (required): task id
- **project** (required): project id
- **attached_file** (required): attaching file
- **description**
- **is_deprecated**

```bash
-H "Content-Type: multipart/form-data" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-F attached_file=@test.png \
-F from_comment=False \
-F object_id=1 \
-F project=1 \
```

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)

### 23.17. Get attachment

To get a task attachment send a GET request specifying the task attachment id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)

### 23.18. Edit attachment

To edit task attachments send a PUT or a PATCH specifying the task attachment id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"description": "Updated description"
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)

### 23.19. Delete attachment

To delete task attachments send a DELETE specifying the task attachment id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

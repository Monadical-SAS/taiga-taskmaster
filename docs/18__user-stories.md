## 18. User stories

### 18.1. List

To list user stories send a GET request with the following parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [user story list objects](https://docs.taiga.io/api.html#object-userstory-detail-list)
The results can be filtered using the following parameters:

- **project**: project id
- **milestone**: milestone id
- **milestone\_\_isnull**: (true|false) if you are looking for user stories associated with a milestone or not
- **status**: status id
- **status\_\_is_archived**: (true|false)
- **tags**: separated by ","
- **watchers**: watching user id
- **assigned_to**: assigned to user id
- **epic**: epic id
- **role**: role id
- **status\_\_is_closed**: (true|false)
- **exclude_status**: status id
- **exclude_tags**: separated by ","
- **exclude_assigned_to**: assigned to user id
- **exclude role**: role id
- **exclude epic**: epic id

````
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
````

### 18.2. Create

To create user stories send a POST request with the following data:

- **assigned_to**: user id
- **backlog_order**: order in the backlog
- **blocked_note**: reason why the user story is blocked
- **client_requirement**: boolean
- **description**: string
- **is_blocked**: boolean
- **is_closed**: boolean
- **kanban_order**: order in the kanban
- **milestone**: milestone id
- **points**: dictionary of points
- **project** (required): project id
- **sprint_order**: order in the milestone
- **status**: status id
- **subject** (required)
- **tags**: array of strings
- **team_requirement**: boolean
- **watchers**: array of watcher id’s

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"assigned_to": null,
"backlog_order": 2,
"blocked_note": "blocking reason",
"client_requirement": false,
"description": "Implement API CALL",
"is_blocked": false,
"is_closed": true,
"kanban_order": 37,
"milestone": null,
"points": {
"1": 4,
"2": 3,
"3": 2,
"4": 1
},
"project": 1,
"sprint_order": 2,
"status": 2,
"subject": "Customer personal data",
"tags": [
"service catalog",
"customer"
],
"team_requirement": false,
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

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [user story detail object](https://docs.taiga.io/api.html#object-userstory-detail)

### 18.3. Get

To get a user story send a GET request specifying the user story id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [user story detail (GET) object](https://docs.taiga.io/api.html#object-userstory-detail-get)

### 18.4. Get by ref

To get a user story send a GET request specifying the user story reference and one of the following parameters:

- project (project id)
- project\_\_slug

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [user story detail (GET) object](https://docs.taiga.io/api.html#object-userstory-detail-get)

### 18.5. Edit

To edit user stories send a PUT or a PATCH specifying the user story id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"subject": "Patching subject",
"version": 1
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [user story detail object](https://docs.taiga.io/api.html#object-userstory-detail)

### 18.6. Delete

To delete user stories send a DELETE specifying the user story id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

### 18.7. Bulk creation

To create multiple user stories at the same time send a POST request with the following data:

- **project_id** (required)
- **status_id**
- **bulk_stories**: user story subjects, one per line

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_stories": "US 1 \n US 2 \n US 3",
"project_id": 1
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON list of [user story detail object](https://docs.taiga.io/api.html#object-userstory-detail)

### 18.8. Bulk update backlog order

To update the backlog order of multiple user stories at the same time send a POST request with the following data:

- **project_id** (required)
- **bulk_stories**: list where each element is a json object with two attributes, the user story id and the new order

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_stories": [
{
"order": 10,
"us_id": 1
},
{
"order": 15,
"us_id": 2
}
],
"project_id": 1
}' \
```

When the update is successful, the HTTP response is a 200 OK and the response body is a JSON list of [user story detail object](https://docs.taiga.io/api.html#object-userstory-detail)

### 18.9. Bulk update kanban order

To update the kanban order of multiple user stories at the same time send a POST request with the following data:

- **project_id** (required)
- **bulk_stories**: list where each element is a json object with two attributes, the user story id and the new order

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_stories": [
{
"order": 10,
"us_id": 1
},
{
"order": 15,
"us_id": 2
}
],
"project_id": 1
}' \
```

When the update is successful, the HTTP response is a 200 OK and the response body is a JSON list of [user story detail object](https://docs.taiga.io/api.html#object-userstory-detail)

### 18.10. Bulk update sprint order

To update the sprint order of multiple user stories at the same time send a POST request with the following data:

- **project_id** (required)
- **bulk_stories**: list where each element is a json object with two attributes, the user story id and the new order

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_stories": [
{
"order": 10,
"us_id": 1
},
{
"order": 15,
"us_id": 2
}
],
"project_id": 1
}' \
```

When the update is successful, the HTTP response is a 200 OK and the response body is a JSON list of [user story detail object](https://docs.taiga.io/api.html#object-userstory-detail)

### 18.11. Bulk update milestone

To update the sprint of multiple user stories at the same time send a POST request with the following data:

- **project_id** (required)
- **milestone_id** (required)
- **bulk_stories**: list where each element is a json object with two attributes, the user story id and the new order

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_stories": [
{
"order": 10,
"us_id": 1
},
{
"order": 15,
"us_id": 2
}
],
"milestone_id": 1,
"project_id": 1
}' \
```

When the update is successful, the HTTP response is a 204 NO CONTENT with an empty body response

### 18.12. Filters data

To get the user stories filters data send a GET request specifying the project id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [user story filters data object](https://docs.taiga.io/api.html#object-userstory-filters-data)

### 18.13. Vote a user story

To add a vote to a user story send a POST request specifying the user story id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK with an empty body response

### 18.14. Remove vote from a user story

To remove a vote from a user story send a POST request specifying the user story id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When remove of the vote succeeded, the HTTP response is a 200 OK with an empty body response

### 18.15. Get user story voters list

To get the list of voters from a user story send a GET request specifying the user story id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [user story voter object](https://docs.taiga.io/api.html#object-userstory-voter-detail)

### 18.16. Watch a user story

To watch a user story send a POST request specifying the project id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK with an empty body response

### 18.17. Stop watching a user story

To stop watching a user story send a POST request specifying the user story id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK with an empty body response

### 18.18. List user story watchers

To get the list of watchers from a user story send a GET request specifying the user story id in the url

```json
"full_name": "Vanesa Torres",
"id": 6,
"username": "user2114747470430251528"
```

The HTTP response is a 200 OK and the response body is a JSON list of [user story watcher object](https://docs.taiga.io/api.html#object-userstory-watcher-detail)

### 18.19. List attachments

To list user story attachments send a GET request with the following parameters:

- **project**: project id
- **object_id**: user story id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [attachment detail objects](https://docs.taiga.io/api.html#object-attachment-detail)

### 18.20. Create attachment

To create user story attachments send a POST request with the following data:

- **object_id** (required): user story id
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

### 18.21. Get attachment

To get a user story attachment send a GET request specifying the user story attachment id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)

### 18.22. Edit attachment

To edit user story attachments send a PUT or a PATCH specifying the user story attachment id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"description": "patching description"
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)

### 18.23. Delete attachment

To delete user story attachments send a DELETE specifying the user story attachment id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

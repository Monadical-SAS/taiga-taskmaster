## 14. Epics
### 14.1. List
To list epics send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [epic list objects](https://docs.taiga.io/api.html#object-epic-detail-list)
The results can be filtered using the following parameters:
*
**project**: project id
*
**project__slug**: project slug
*
**assigned_to**: assigned to user id
*
**status__is_closed**: boolean indicating if the epic status is closed
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
### 14.2. Create
To create epics send a POST request with the following data:
*
**assigned_to**: user id
*
**blocked_note**: reason why the epic is blocked
*
**description**: string
*
**is_blocked**: boolean
*
**is_closed**: boolean
*
**color**: HEX color
*
**project** (required): project id
*
**subject** (required)
*
**tags**: array of strings
*
**watchers**: array of watcher id’s
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"assigned_to": null,
"blocked_note": "blocking reason",
"client_requirement": false,
"color": "#ABCABC",
"description": "New epic description",
"epics_order": 2,
"is_blocked": true,
"project": 1,
"status": 2,
"subject": "New epic",
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
"subject": "New epic"
}' \
```
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [epic detail object](https://docs.taiga.io/api.html#object-epic-detail)
### 14.3. Get
To get an epic send a GET request specifying the epic id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [epic detail (GET) object](https://docs.taiga.io/api.html#object-epic-detail-get)
### 14.4. Get by ref
To get an epic send a GET request specifying the epic reference and one of the following parameters:
*
project (project id)
*
project__slug
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [epic detail (GET) object](https://docs.taiga.io/api.html#object-epic-detail-get)
### 14.5. Edit
To edit epics send a PUT or a PATCH specifying the epic id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"subject": "Patching subject",
"version": 1
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [epic detail object](https://docs.taiga.io/api.html#object-epic-detail)
### 14.6. Delete
To delete epics send a DELETE specifying the epic id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 14.7. Bulk creation
To create multiple epics at the same time send a POST request with the following data:
*
**project_id** (required)
*
**status_id** (optional)
*
**bulk_epics**: epic subjects, one per line
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_epics": "EPIC 1 \n EPIC 2 \n EPIC 3",
"project_id": 1
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON list of [epic detail object](https://docs.taiga.io/api.html#object-epic-detail)
### 14.8. Filters data
To get the epic filters data send a GET request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [epic filters data object](https://docs.taiga.io/api.html#object-epic-filters-data)
### 14.9. List related userstories
To get the list of related user stories from an epic send a GET request specifying the epic id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [epic related user story detail objects](https://docs.taiga.io/api.html#object-epic-related-user-story-detail)
### 14.10. Create related userstory
To create an epic related user story send a POST request with the following data:
*
**epic**: related epic id
*
**user_story**: related user story id
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"epic": 15,
"user_story": 1
}' \
```
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [epic related user story detail object](https://docs.taiga.io/api.html#object-epic-related-user-story-detail)
### 14.11. Get related userstory
To get a related user story from an epic send a GET request specifying the epic and user story ids in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [epic related user story detail object](https://docs.taiga.io/api.html#object-epic-related-user-story-detail)
### 14.12. Edit related userstory
To edit epic related user stories send a PUT or a PATCH specifying the epic and user story ids in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"order": 100
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [epic related user story detail object](https://docs.taiga.io/api.html#object-epic-related-user-story-detail)
### 14.13. Delete related userstory
To delete epic related user stories send a DELETE specifying the epic and the userstory ids in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 14.14. Bulk related userstories creation
To create multiple related user stories at the same time send a POST request with the following data:
*
**project_id** (required)
*
**bulk_userstories**: user stories subjects, one per line
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_userstories": "epic 1 \n epic 2 \n epic 3",
"project_id": 3
}' \
```
When the creation is successful, the HTTP response is a 201 OK and the response body is a JSON list of [epic related user story detail object](https://docs.taiga.io/api.html#object-epic-related-user-story-detail)
### 14.15. Vote an epic
To vote epics send a POST request specifying the epic id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK with an empty body response
### 14.16. Remove vote from an epic
To remove a vote from an epic send a POST request specifying the epic id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When remove of the vote succeeded, the HTTP response is a 200 OK with an empty body response
### 14.17. Get epic voters list
To get the list of voters from an epic send a GET request specifying the epic id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [epic voter object](https://docs.taiga.io/api.html#object-epic-voter-detail)
### 14.18. Watch an epic
To watch an epic send a POST request specifying the epic id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK with an empty body response
### 14.19. Stop watching an epic
To stop watching an epic send a POST request specifying the epic id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK with an empty body response
### 14.20. List epic watchers
To get the list of watchers from an epic send a GET request specifying the epic id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [epic watcher object](https://docs.taiga.io/api.html#object-epic-watcher-detail)
### 14.21. List attachments
To list epic attachments send a GET request with the following parameters:
*
**project**: project id
*
**object_id**: epic id
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [attachment detail objects](https://docs.taiga.io/api.html#object-attachment-detail)
### 14.22. Create attachment
To create epic attachments send a POST request with the following data:
*
**object_id** (required): epic id
*
**project** (required): project id
*
**attached_file** (required): attaching file
*
**description**
*
**is_deprecated**
```bash
-H "Content-Type: multipart/form-data" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-F attached_file=@test.png \
-F from_comment=False \
-F object_id=15 \
-F project=3 \
```
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)
### 14.23. Get attachment
To get an epic attachment send a GET request specifying the epic attachment id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)
### 14.24. Edit attachment
To edit epic attachments send a PUT or a PATCH specifying the epic attachment id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"description": "Updated description"
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)
### 14.25. Delete attachment
To delete epic attachments send a DELETE specifying the epic attachment id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

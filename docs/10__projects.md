## 10. Projects
### 10.1. List
To list projects send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [project list entry objects](https://docs.taiga.io/api.html#object-project-list-entry)
The results can be filtered using the following parameters:
*
**member**: member id
*
**members**: member ids
*
**is_looking_for_people**: the project is looking for new members
*
**is_featured**: the project has been highlighted by the instance staff
*
**is_backlog_activated**: backlog is active
*
**is_kanban_activated**: kanban is active
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The results can be ordered using the order_by parameter with the values:
*
**memberships__user_order**: the project order specified by the user
*
**total_fans**: total fans for the project
*
**total_fans_last_week**: number of new fans in the last week
*
**total_fans_last_month**: number of new fans in the last month
*
**total_fans_last_year**: number of new fans in the last year
*
**total_activity**: number of history entries for the project
*
**total_activity_last_week**: number of history entries generated in the last week
*
**total_activity_last_month**: number of history entries generated in the last month
*
**total_activity_last_year**: number of history entries generated in the last year
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
### 10.2. Create
To create projects send a POST request with the following data:
*
**name** (required)
*
**description** (required)
*
**creation_template**: base template for the project
*
**is_backlog_activated**
*
**is_issues_activated**
*
**is_kanban_activated**
*
**is_private**
*
**is_wiki_activated**
*
**videoconferences**: "whereby-com",  "jitsi", "talky"  or "custom", the third party used for meetups if enabled
*
**videoconferences_extra_data**: string used for the videoconference chat url generation
*
**total_milestones**
*
**total_story_points**
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"description": "Beta description",
"name": "Beta project"
}' \
```
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"creation_template": 1,
"description": "Taiga",
"is_backlog_activated": false,
"is_issues_activated": true,
"is_kanban_activated": true,
"is_private": false,
"is_wiki_activated": true,
"name": "Beta project",
"total_milestones": 3,
"total_story_points": 20.0,
"videoconferences": "jitsi",
"videoconferences_extra_data": null
}' \
```
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [project detail object](https://docs.taiga.io/api.html#object-project-detail)
### 10.3. Get
To get a project send a GET request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [project detail object](https://docs.taiga.io/api.html#object-project-detail)
### 10.4. Get by slug
To get a project send a GET request specifying the project slug as parameter:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [project detail object](https://docs.taiga.io/api.html#object-project-detail)
### 10.5. Edit
To edit projects send a PUT or a PATCH specifying the project id in the url. In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"description": "Beta description",
"name": "Beta project put"
}' \
```
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Beta project patch"
}' \
```
When the edit is successful, the HTTP response is a 200 OK and the response body is a JSON [project detail object](https://docs.taiga.io/api.html#object-project-detail)
### 10.6. Delete
To delete projects send a DELETE specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 10.7. Bulk update order
To update the projects order for the logged in user send a POST request with a json list where each element is a json object with two attributes, the project id and the new order
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '[
{
"order": 10,
"project_id": 1
},
{
"order": 15,
"project_id": 2
}
]' \
```
When the update is successful, the HTTP response is a 200 OK and the response body is empty
### 10.8. Get modules configuration
To get a project modules configuration send a GET request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [project modules configuration object](https://docs.taiga.io/api.html#object-project-modules-detail)
### 10.9. Edit modules configuration
To edit a project modules configuration send a PATCH specifying the project id in the url.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"github": {
"secret": "new_secret"
}
}' \
```
When edition succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 10.10. Stats
To get a project stats send a GET request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [project stats object](https://docs.taiga.io/api.html#object-project-stats-detail)
### 10.11. Issue stats
To get a project issue stats send a GET request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [project issue stats object](https://docs.taiga.io/api.html#object-project-issue-stats-detail)
### 10.12. Tag colors
To get a project tag colors stats send a GET request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [project tag colors object](https://docs.taiga.io/api.html#object-project-tags-colors-detail)
### 10.13. Create tag
To create tags send a POST request specifying the project id in the url with the following data:
*
**tag** (required)
*
**color**: HEX color
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"color": "#FC8EAC",
"tag": "testing-tag"
}' \
```
When the creation is successful, the HTTP response is a 200 OK with an empty body response
### 10.14. Edit tag
To edit a tag send a POST specifying the project id in the url.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"color": "#FFF8E7",
"from_tag": "testing-tag",
"to_tag": "testing-tag-updated"
}' \
```
When the edit is successful, the HTTP response is a 200 OK with an empty body response
### 10.15. Delete-tag
To delete a tag send a POST specifying the project id in the url.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"tag": "testing-tag-updated"
}' \
```
When the edit is successful, the HTTP response is a 200 OK with an empty body response
### 10.16. Mix tags
To mix tags send a POST specifying the project id in the url.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"from_tags": [
"cum",
"ut",
"adipisci",
"voluptatibus"
],
"to_tag": "cum"
}' \
```
When the edit is successful, the HTTP response is a 200 OK with an empty body response
### 10.17. Like a project
To like a project send a POST request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK with an empty body response
### 10.18. Unlike a project
To unlike a project send a POST request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK with an empty body response
### 10.19. List project fans
To get the list of fans from a project send a GET request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [project voter object](https://docs.taiga.io/api.html#object-project-voter-detail)
### 10.20. Watch a project
To watch a project send a POST request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"notify_level": 3
}' \
```
The HTTP response is a 200 OK with an empty body response
### 10.21. Stop watching project
To stop watching a project send a POST request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK with an empty body response
### 10.22. List project watchers
To get the list of watchers from a project send a GET request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [project watcher object](https://docs.taiga.io/api.html#object-project-watcher-detail)
### 10.23. Create template
To create a template from a selected project send a POST request specifying the project id in the url with the following parameters:
*
**name** (required)
*
**description** (required)
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${ADMIN_AUTH_TOKEN}" \
-d '{
"template_description": "Beta template description",
"template_name": "Beta template"
}' \
```
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [project template detail object](https://docs.taiga.io/api.html#object-project-template-detail)
### 10.24. Leave
To leave a project send a POST request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK with an empty body response
### 10.25. Change logo
To change your project logo send a POST with the following data
```bash
-H "Content-Type: multipart/form-data" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-F logo=@test.png \
```
When the change is successful, the HTTP response is a 200 OK and the response body is a JSON [project detail object](https://docs.taiga.io/api.html#object-project-detail)
### 10.26. Remove logo
To remove your project logo send a POST with the following data
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When the change is successful, the HTTP response is a 200 OK and the response body is a JSON [project detail object](https://docs.taiga.io/api.html#object-project-detail)
### 10.27. Transfer validate-token
To check if a transfer token for one project is valid for your user send a POST request specifying the project id in the url and containing the following data:
*
**token**: valid transfer token received by email.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"token": "6:1jrHFD:8NuXY5qtgY406k-oQrs_o9KMu-s"
}' \
```
The HTTP response is a 200 OK with an empty body response
### 10.28. Transfer request
To request to the owner the transfer of a project send a POST request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK with an empty body response
### 10.29. Transfer start
To start the transfer of one of your projects to another user send a POST request specifying the project id in the url and containing the following data:
*
**user**: user id of other admin member of the project.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"user": 5
}' \
```
The HTTP response is a 200 OK with an empty body response
### 10.30. Transfer accept
To accept the transfer of one project to your user send a POST request specifying the project id in the url and containing the following data:
*
**token**: valid transfer token received by email.
*
**reason**: text included in the email response to the project owner.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"reason": "testing",
"token": "6:1jrHFD:8NuXY5qtgY406k-oQrs_o9KMu-s"
}' \
```
The HTTP response is a 200 OK with an empty body response
### 10.31. Transfer reject
To reject the transfer of one project to your user send a POST request specifying the project id in the url and containing the following data:
*
**token**: valid transfer token received by email.
*
**reason**: text included in the email response to the project owner.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"reason": "testing",
"token": "6:1jrHFD:8NuXY5qtgY406k-oQrs_o9KMu-s"
}' \
```
The HTTP response is a 200 OK with an empty body response
### 10.32. Duplicate
To duplicate a project (create a new one with the same status, colors, attributes…​) send a POST request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"description": "c description",
"is_private": true,
"name": "Dup name",
"users": [
{
"id": 8
}
]
}' \
```
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [project detail object](https://docs.taiga.io/api.html#object-project-detail)

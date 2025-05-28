## 9. Project templates
### 9.1. List
To list project templates send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [project template detail objects](https://docs.taiga.io/api.html#object-project-template-detail)
### 9.2. Create
To create project templates send a POST request with the following data:
*
**name** (required): string
*
**slug**: slug
*
**description** (required): string
*
**default_owner_role** (required):
*
**is_backlog_activated**: boolean
*
**is_kanban_activated**: boolean
*
**is_wiki_activated**: boolean
*
**is_issues_activated**: boolean
*
**videoconferences**: ("whereby-com" | "jitsi" | "talky" | "custom")
*
**videoconferences_extra_data**: string
*
**default_options**: a json with a list of objects with:
*
**points**: slug
*
**us_status**: slug
*
**task_status**: slug
*
**issue_status**: slug
*
**issue_type**: slug
*
**priority**: slug
*
**severity**: slug
*
**us_statuses**: a json with a list of objects with:
*
**name**: string
*
**slug**: slug
*
**is_closed**: boolean
*
**color**: #rgb color
*
**wip_limit**: integer or none
*
**order**: integer
*
**points**: a json with a list of objects with:
*
**name**: string
*
**value**: integer or none
*
**order**: integer
*
**task_statuses**: a json with a list of objects with:
*
**name**: string
*
**slug**: slug
*
**is_closed**: boolean
*
**color**: #rgb color
*
**order**: integer
*
**issue_statuses**: a json with a list of objects with:
*
**name**: string
*
**slug**: slug
*
**is_closed**: boolean
*
**color**: #rgb color
*
**order**: integer
*
**issue_types**: a json with a list of objects with:
*
**name**: string
*
**color**: #rgb color
*
**order**: integer
*
**priorities**: a json with a list of objects with:
*
**name**: string
*
**color**: #rgb color
*
**order**: integer
*
**severities**: a json with a list of objects with:
*
**name**: string
*
**color**: #rgb color
*
**order**: integer
*
**roles**: a json with a list of objects with:
*
**name**: string
*
**slug**: slug
*
**permissions**: list of permissions
*
**order**: integer
*
**computable**: boolean
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${ADMIN_AUTH_TOKEN}" \
-d '{
"default_options": {
"issue_status": "New",
"issue_type": "Bug",
"points": "?",
"priority": "Normal",
"severity": "Normal",
"task_status": "New",
"us_status": "New"
},
"default_owner_role": "product-owner",
"description": "Sample description",
"id": 2,
"is_backlog_activated": false,
"is_issues_activated": false,
"is_kanban_activated": true,
"is_wiki_activated": false,
"issue_statuses": [
{
"color": "#999999",
"is_closed": false,
"name": "New",
"order": 1
},
{
"color": "#729fcf",
"is_closed": false,
"name": "In progress",
"order": 2
},
{
"color": "#f57900",
"is_closed": true,
"name": "Ready for test",
"order": 3
},
{
"color": "#4e9a06",
"is_closed": true,
"name": "Closed",
"order": 4
},
{
"color": "#cc0000",
"is_closed": false,
"name": "Needs Info",
"order": 5
},
{
"color": "#d3d7cf",
"is_closed": true,
"name": "Rejected",
"order": 6
},
{
"color": "#75507b",
"is_closed": false,
"name": "Postponed",
"order": 7
}
],
"issue_types": [
{
"color": "#cc0000",
"name": "Bug",
"order": 1
},
{
"color": "#729fcf",
"name": "Question",
"order": 2
},
{
"color": "#4e9a06",
"name": "Enhancement",
"order": 3
}
],
"name": "New Template",
"points": [
{
"name": "?",
"order": 1,
"value": null
},
{
"name": "0",
"order": 2,
"value": 0.0
},
{
"name": "1/2",
"order": 3,
"value": 0.5
},
{
"name": "1",
"order": 4,
"value": 1.0
},
{
"name": "2",
"order": 5,
"value": 2.0
},
{
"name": "3",
"order": 6,
"value": 3.0
},
{
"name": "5",
"order": 7,
"value": 5.0
},
{
"name": "8",
"order": 8,
"value": 8.0
},
{
"name": "10",
"order": 9,
"value": 10.0
},
{
"name": "15",
"order": 10,
"value": 15.0
},
{
"name": "20",
"order": 11,
"value": 20.0
},
{
"name": "40",
"order": 12,
"value": 40.0
}
],
"priorities": [
{
"color": "#999999",
"name": "Low",
"order": 1
},
{
"color": "#4e9a06",
"name": "Normal",
"order": 3
},
{
"color": "#CC0000",
"name": "High",
"order": 5
}
],
"roles": [
{
"computable": true,
"name": "UX",
"order": 10,
"permissions": [
"add_issue",
"modify_issue",
"comment_issue",
"delete_issue",
"view_issues",
"add_milestone",
"modify_milestone",
"delete_milestone",
"view_milestones",
"view_project",
"add_task",
"modify_task",
"comment_task",
"delete_task",
"view_tasks",
"add_us",
"modify_us",
"comment_us",
"delete_us",
"view_us",
"add_wiki_page",
"modify_wiki_page",
"comment_wiki_page",
"delete_wiki_page",
"view_wiki_pages",
"add_wiki_link",
"delete_wiki_link",
"view_wiki_links"
],
"slug": "ux"
},
{
"computable": true,
"name": "Design",
"order": 20,
"permissions": [
"add_issue",
"modify_issue",
"comment_issue",
"delete_issue",
"view_issues",
"add_milestone",
"modify_milestone",
"delete_milestone",
"view_milestones",
"view_project",
"add_task",
"modify_task",
"comment_task",
"delete_task",
"view_tasks",
"add_us",
"modify_us",
"comment_us",
"delete_us",
"view_us",
"add_wiki_page",
"modify_wiki_page",
"comment_wiki_page",
"delete_wiki_page",
"view_wiki_pages",
"add_wiki_link",
"delete_wiki_link",
"view_wiki_links"
],
"slug": "design"
},
{
"computable": true,
"name": "Front",
"order": 30,
"permissions": [
"add_issue",
"modify_issue",
"comment_issue",
"delete_issue",
"view_issues",
"add_milestone",
"modify_milestone",
"delete_milestone",
"view_milestones",
"view_project",
"add_task",
"modify_task",
"comment_task",
"delete_task",
"view_tasks",
"add_us",
"modify_us",
"comment_us",
"delete_us",
"view_us",
"add_wiki_page",
"modify_wiki_page",
"comment_wiki_page",
"delete_wiki_page",
"view_wiki_pages",
"add_wiki_link",
"delete_wiki_link",
"view_wiki_links"
],
"slug": "front"
},
{
"computable": true,
"name": "Back",
"order": 40,
"permissions": [
"add_issue",
"modify_issue",
"comment_issue",
"delete_issue",
"view_issues",
"add_milestone",
"modify_milestone",
"delete_milestone",
"view_milestones",
"view_project",
"add_task",
"modify_task",
"comment_task",
"delete_task",
"view_tasks",
"add_us",
"modify_us",
"comment_us",
"delete_us",
"view_us",
"add_wiki_page",
"modify_wiki_page",
"comment_wiki_page",
"delete_wiki_page",
"view_wiki_pages",
"add_wiki_link",
"delete_wiki_link",
"view_wiki_links"
],
"slug": "back"
},
{
"computable": false,
"name": "Product Owner",
"order": 50,
"permissions": [
"add_issue",
"modify_issue",
"comment_issue",
"delete_issue",
"view_issues",
"add_milestone",
"modify_milestone",
"delete_milestone",
"view_milestones",
"view_project",
"add_task",
"modify_task",
"comment_task",
"delete_task",
"view_tasks",
"add_us",
"modify_us",
"comment_us",
"delete_us",
"view_us",
"add_wiki_page",
"modify_wiki_page",
"comment_wiki_page",
"delete_wiki_page",
"view_wiki_pages",
"add_wiki_link",
"delete_wiki_link",
"view_wiki_links"
],
"slug": "product-owner"
},
{
"computable": false,
"name": "Stakeholder",
"order": 60,
"permissions": [
"add_issue",
"modify_issue",
"comment_issue",
"delete_issue",
"view_issues",
"view_milestones",
"view_project",
"view_tasks",
"view_us",
"modify_wiki_page",
"comment_wiki_page",
"view_wiki_pages",
"add_wiki_link",
"delete_wiki_link",
"view_wiki_links"
],
"slug": "stakeholder"
}
],
"severities": [
{
"color": "#999999",
"name": "Wishlist",
"order": 1
},
{
"color": "#729fcf",
"name": "Minor",
"order": 2
},
{
"color": "#4e9a06",
"name": "Normal",
"order": 3
},
{
"color": "#f57900",
"name": "Important",
"order": 4
},
{
"color": "#CC0000",
"name": "Critical",
"order": 5
}
],
"slug": "new-template",
"task_statuses": [
{
"color": "#999999",
"is_closed": false,
"name": "New",
"order": 1
},
{
"color": "#729fcf",
"is_closed": false,
"name": "In progress",
"order": 2
},
{
"color": "#f57900",
"is_closed": true,
"name": "Ready for test",
"order": 3
},
{
"color": "#4e9a06",
"is_closed": true,
"name": "Closed",
"order": 4
},
{
"color": "#cc0000",
"is_closed": false,
"name": "Needs Info",
"order": 5
}
],
"us_statuses": [
{
"color": "#999999",
"is_closed": false,
"name": "New",
"order": 1,
"wip_limit": null
},
{
"color": "#f57900",
"is_closed": false,
"name": "Ready",
"order": 2,
"wip_limit": null
},
{
"color": "#729fcf",
"is_closed": false,
"name": "In progress",
"order": 3,
"wip_limit": null
},
{
"color": "#4e9a06",
"is_closed": false,
"name": "Ready for test",
"order": 4,
"wip_limit": null
},
{
"color": "#cc0000",
"is_closed": true,
"name": "Done",
"order": 5,
"wip_limit": null
}
],
"videoconferences": null,
"videoconferences_extra_data": ""
}' \
```
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${ADMIN_AUTH_TOKEN}" \
-d '{
"default_owner_role": "product-owner",
"description": "Sample description",
"name": "New simple template"
}' \
```
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [project template detail object](https://docs.taiga.io/api.html#object-project-template-detail)
### 9.3. Get
To get a project template send a GET request specifying the project template id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [project template detail object](https://docs.taiga.io/api.html#object-project-template-detail)
### 9.4. Edit
To edit project templates send a PUT or a PATCH specifying the project template id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${ADMIN_AUTH_TOKEN}" \
-d '{
"description": "New description"
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [project template detail object](https://docs.taiga.io/api.html#object-project-template-detail)
### 9.5. Delete
To delete project template send a DELETE specifying the project template id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${ADMIN_AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

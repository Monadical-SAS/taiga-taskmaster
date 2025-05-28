## 27. Issues
### 27.1. List
To list issues send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [issue detail list objects](https://docs.taiga.io/api.html#object-issue-detail-list)
The results can be filtered using the following parameters:
*
**project**: project id
*
**status**: status id
*
**severity**: severity id
*
**priority**: priority id
*
**owner**: owner user id
*
**assigned_to**: assigned to user id
*
**tags**: separated by ","
*
**type**: issue type id
*
**role**: role id
*
**watchers**: watching user id
*
**status__is_closed**: (true|false)
*
**exclude_status**: status id
*
**exclude_severity**: severity id
*
**exclude_priority**: priority id
*
**exclude_owner**: user owner id
*
**exclude_assigned_to**: assigned to user id
*
**exlcude_tags**: separated by ","
*
**exclude_type**: issue type id
*
**exclude role**: role id
the "exclude_" params work excluding from the response the results with which they match.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The results can be ordered using the order_by parameter with the values:
*
**type**
*
**severity**
*
**status**
*
**priority**
*
**created_date**
*
**modified_date**
*
**owner**
*
**assigned_to**
*
**subject**
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
### 27.2. Create
To create issues send a POST request with the following data:
*
**assigned_to**: user id
*
**blocked_note**: reason why the issue is blocked
*
**description**: string
*
**is_blocked**: boolean
*
**is_closed**: boolean
*
**milestone**: milestone id
*
**project** (required): project id
*
**status**: status id
*
**severity**: severity id
*
**priority**: priority id
*
**type**: type id
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
"description": "Implement API CALL",
"is_blocked": false,
"is_closed": true,
"milestone": null,
"priority": 3,
"project": 1,
"severity": 2,
"status": 3,
"subject": "Customer personal data",
"tags": [
"service catalog",
"customer"
],
"type": 1,
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
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [issue detail object](https://docs.taiga.io/api.html#object-issue-detail)
### 27.3. Get
To get an issue send a GET request specifying the issue id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [issue detail (GET) object](https://docs.taiga.io/api.html#object-issue-detail-get)
### 27.4. Get by ref
To get an issue send a GET request specifying the issue reference and one of the following parameters:
*
project (project id)
*
project__slug
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [issue detail (GET) object](https://docs.taiga.io/api.html#object-issue-detail-get)
### 27.5. Edit
To edit issues send a PUT or a PATCH specifying the issue id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"subject": "Patching subject",
"version": 1
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [issue detail object](https://docs.taiga.io/api.html#object-issue-detail)
### 27.6. Delete
To delete issues send a DELETE specifying the issue id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 27.7. Filters data
To get the issue filters data send a GET request specifying the project id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [issue filters data object](https://docs.taiga.io/api.html#object-issue-filters-data)
### 27.8. Vote an issue
To vote issues send a POST specifying the issue id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When vote succeeded, the HTTP response is a 200 OK with an empty body response
### 27.9. Remove vote from an issue
To remove a vote from an issue send a POST specifying the issue id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When remove of the vote succeeded, the HTTP response is a 200 OK with an empty body response
### 27.10. Get issue voters list
To get the list of voters from an issue send a GET request specifying the issue id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [issue voters detail object](https://docs.taiga.io/api.html#object-issue-voters-detail)
### 27.11. Watch an issue
To watch an issue send a POST request specifying the issue id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK with an empty body response
### 27.12. Stop watching an issue
To stop watching an issue send a POST request specifying the issue id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK with an empty body response
### 27.13. List issue watchers
To get the list of watchers from an issue send a GET request specifying the issue id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [issue watcher object](https://docs.taiga.io/api.html#object-issue-watcher-detail)
### 27.14. List attachments
To list issue attachments send a GET request with the following parameters:
*
**project**: project id
*
**object_id**: issue id
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [attachment detail objects](https://docs.taiga.io/api.html#object-attachment-detail)
### 27.15. Create attachment
To create issue attachments send a POST request with the following data:
*
**object_id** (required): issue id
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
-F object_id=22 \
-F project=1 \
```
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)
### 27.16. Get attachment
To get an issue attachment send a GET request specifying the issue attachment id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)
### 27.17. Edit attachment
To edit issue attachments send a PUT or a PATCH specifying the issue attachment id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)
### 27.18. Delete attachment
To delete issue attachments send a DELETE specifying the issue attachment id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

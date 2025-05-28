## 36. History
### 36.1. Get user story, task, issue or wiki page history
To get the history of a user story, task, issue or wiki page send a GET request specifying the id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON of a list of [history entry detail objects](https://docs.taiga.io/api.html#object-history-entry-detail)
### 36.2. Get comment versions
To get the comment versions from the history entry of a user story, task, issue or wiki page send a GET request specifying the history entry id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON of a list of [history entry comment detail objects](https://docs.taiga.io/api.html#object-history-entry-comment-detail)
### 36.3. Edit comment
To edit a history comment send a POST specifying the history entry id in the url with the following data:
*
**assigned_to**: the new comment
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"comment": "comment edition"
}' \
```
When deleted succesfully, the HTTP response is a 204 NO CONTENT with an empty body response
### 36.4. Delete comment
To delete a history comment send a POST specifying the history entry id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When deleted succesfully, the HTTP response is a 204 NO CONTENT with an empty body response
### 36.5. Undelete comment
To undelete a history comment send a POST specifying the history entry id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When deleted succesfully, the HTTP response is a 204 NO CONTENT with an empty body response

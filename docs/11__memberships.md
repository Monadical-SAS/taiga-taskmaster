## 11. Memberships/Invitations
### 11.1. List
To list memberships send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON list of [membership detail objects](https://docs.taiga.io/api.html#object-membership-detail)
The results can be filtered using the following parameters:
*
**project**: project id
*
**role**: role id
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
### 11.2. Create
To create memberships/invitations send a POST request with the following data:
*
**project** (required)
*
**role** (required): Role to the membership
*
**username** (required): user username or email
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"project": 1,
"role": 3,
"username": "test-user@email-test.com"
}' \
```
When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [membership detail object](https://docs.taiga.io/api.html#object-membership-detail)
### 11.3. Bulk creation
To create multiple memberships at the same time send a POST request with the following data:
*
**project_id** (required)
*
**bulk_memberships** (required): a list of dicts with
*
**role_id**
*
**username**: user username or email
*
**invitation_extra_text**: string
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"bulk_memberships": [
{
"role_id": 3,
"username": "test@test.com"
},
{
"role_id": 4,
"username": "john@doe.com"
}
],
"project_id": 1
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON list of [membership detail object](https://docs.taiga.io/api.html#object-membership-detail)
### 11.4. Get
To get a membership send a GET request specifying the membership id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [membership detail object](https://docs.taiga.io/api.html#object-membership-detail)
### 11.5. Edit
To edit memberships send a PUT or a PATCH specifying the membership id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"role": 3
}' \
```
When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [membership detail object](https://docs.taiga.io/api.html#object-membership-detail)
### 11.6. Delete
To delete memberships/invitations send a DELETE specifying the membership id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response
### 11.7. Resend invitation
To resend an invitation send a POST request specifying the membership id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [membership detail object](https://docs.taiga.io/api.html#object-membership-detail)
### 11.8. Get Invitation (by token)
To get an invitation send a GET request specifying the invitation id in the url
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
The HTTP response is a 200 OK and the response body is a JSON [membership detail object](https://docs.taiga.io/api.html#object-membership-detail)

## 1. General notes

About Taiga instance and URLs used in this document
All API calls used in the documentation are refered to a local taiga instance API running on localhost:8000,
so if you use another instance remember to change the url.
For example, if you want to perform the tests against our own instance, you should use [https://api.taiga.io/api/v1](https://api.taiga.io/api/v1)
instead of [http://localhost:8000/api/v1](http://localhost:8000/api/v1).

### 1.1. Authentication

#### 1.1.1. Standard token authentication

To authenticate requests an http header called "Authorization" should be added. Its format should be:

```
This token can be received through the [login API](https://docs.taiga.io/api.html#auth-normal-login)
To provide an example, the following can be used within a Bash script running on Ubuntu - customise as appropriate for your system configuration.
*
Install `jq` (a command-line JSON processor):
```

- Bash snippet:

```bash
# Request username and password for connecting to Taiga
read -p "Username or email: " USERNAME
read -r -s -p "Password: " PASSWORD
DATA=$(jq --null-input \
--arg username "$USERNAME" \
--arg password "$PASSWORD" \
'{ type: "normal", username: $username, password: $password }')
# Get AUTH_TOKEN
USER_AUTH_DETAIL=$( curl -X POST \
-H "Content-Type: application/json" \
-d "$DATA" \
https://api.taiga.io/api/v1/auth 2&gt;/dev/null )
AUTH_TOKEN=$( echo ${USER_AUTH_DETAIL} | jq -r '.auth_token' )
# Exit if AUTH_TOKEN is not available
if [ -z ${AUTH_TOKEN} ]; then
echo "Error: Incorrect username and/or password supplied"
exit 1
else
echo "auth_token is ${AUTH_TOKEN}"
fi
# Proceed to use API calls as desired
```

- If unable to install `jq`, it is possible (but not recommended) to use `grep` and `cut` to extract the value of `auth_token` from the JSON [user auth detail object](https://docs.taiga.io/api.html#object-auth-user-detail) - use the following line instead:

```
This token has an expiration time so you must update it with a [refresh API call](https://docs.taiga.io/api.html#auth-normal-login).
#### 1.1.2. Application token authentication
This kind of tokens are designed for allowing external apps use the Taiga API, they are associated to an existing user and an Application. They can be manually created via the django ADMIN or programatically created via API.
They work in the same way than standard Taiga authentication tokens but the "Authorization" header change slightly. Its format should be:
```

The process for obtaining a valid token consists in:

- [Checking if there is an existing application token for the requesting user](https://docs.taiga.io/api.html#external-app-get-token)
- [Requesting an authorization code for the requesting user if it doesn’t exist yet](https://docs.taiga.io/api.html#external-app-authorization)
- [Validating the authorization code to obtain the final token](https://docs.taiga.io/api.html#external-app-validation)
- [Decyphering the token](https://docs.taiga.io/api.html#external-app-decyphering)

##### Checking if there is an existing application token for the requesting user

A GET request must be done to the applications resource including the application id in the url and specifying the token endpoint:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer {AUTH_TOKEN}" \
```

The API will answer with info about the application and the token:

```json
"user": 4,
"id": null,
"application": {
"id": "a60c3208-5234-11e5-96df-68f72800aadd",
"name": "Testing application",
"web": "http://taiga.io",
"description": "Testing external app",
"icon_url": "https://tree.taiga.io/images/beta.png"
},
"auth_code": null,
"next_url": "http://tree.taiga.io/redirect?auth_code=None"
```

If id and auth_code are null it means there is no application token generated and you need to [authorize one](https://docs.taiga.io/api.html#external-app-authorization). If they are not null you can jump to the [validation step](https://docs.taiga.io/api.html#external-app-validation).

##### Requesting an authorization code for the requesting user if it doesn’t exist yet

The request should include:

- application: the application id for the requested token
- state: an unguessable random string. It is used to protect against cross-site request forgery attacks. The API will include this value when the validation process is completed so the final app can verify it matches the original one.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJ1c2VyX2F1dGhlbnRpY2F0aW9uX2lkIjo0fQ:1ZX33b:QnAN3EcuChLoRVf3CdybWEi2OEg" \
-d '{
"application": "a60c3208-5234-11e5-96df-68f72800aadd",
"state": "random-state"
}' \
```

The API answer will be something like:

```json
"auth_code": "c8bfacba-5236-11e5-b8f6-68f72800aadd",
"state": "random-state",
"next_url": "asd?auth_code=c8bfacba-5236-11e5-b8f6-68f72800aadd"
```

The obtained auth_code must be validated as described in the [validation step](https://docs.taiga.io/api.html#external-app-validation).

##### Validating the authorization code to obtain the final token

Now the external app must validate the auth_code obtained in the previous steps with a request including:

- application: the application id for the requested token
- state: an unguessable random string. It is used to protect against cross-site request forgery attacks. The API will include this value when the validation process is completed so the final app can verify it matches the original one.
- auth_code: the authorization code received on previous the steps.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJ1c2VyX2F1dGhlbnRpY2F0aW9uX2lkIjo0fQ:1ZX33b:QnAN3EcuChLoRVf3CdybWEi2OEg" \
-d '{
"application": "a60c3208-5234-11e5-96df-68f72800aadd",
"auth_code": "21ce08c4-5237-11e5-a8a3-68f72800aadd",
"state": "random-state"
}' \
```

The API answer will be something like:

```json
"cyphered_token": "eyJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiQTEyOEtXIn0.E-Ee1cRgG0JEd90yJu-Dgl_vwKHTHdPy2YHRbCsMvfiJx0OvR12E8g.kGwJPnWQJecFPEae.ebQtpRNPbKh6FBS-LSUhw1xNARl0Q5loCO4fAk00LHFqcDpAwba7LHeR3MPx9T9LfA.KM-Id_041g8OdWaseGyV8g"
```

##### Decyphering the token

The token is cyphered using JWE with A128KW as algorythm and A256GCM as encryption. Both parts (Taiga and the external application requesting the token) must know about the encryption key used in the process (in Taiga it’s an attribute of the application model).

- A python snippet for decyphering the token:

```python
from jwkest.jwe import JWE
key ="this-is-the-secret-key"
cyphered_token="eyJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiQTEyOEtXIn0.H5jWzzXQISSh_QPCO5mWhT0EI9RRV45xA7vbWoxeBIjiCL3qwAmlzg.bBWVKwGTkta5y99c.ArycfFtrlmWgyZ4lwXw_JiSVmkn9YF6Xwlh8nVDku0BLW8kvaxNy3XRbbb17MtZ7mg.pDkpgDwffCyCy4sYNQI6zA"
sym_key = SYMKey(key=key, alg="A128KW")
token=JWE().decrypt(cyphered_token, keys=[sym_key])
```

When decyphering it correctly you will obtain a json containing the application token that can be used in the Authorization headers

```json
"token": "95db1710-5238-11e5-a86e-68f72800aadd"
```

### 1.2. OCC - Optimistic concurrency control

In taiga multiple operations can be happening at the same time for an element so every modifying request should include a valid version parameter. You can think about two different users updating the same user story, there are two possible scenarios here:

- They are updating the same attributes on the element. In this situation the API will accept the first request and deny the second one because the version parameter will be considered as invalid.
- They are updating different attributes on the element. In this situation the API is smart enough for accepting both requests, the second one would have an invalid version but the changes are not affecting modified attributes so they can be applied safely
  The version parameter is considered valid if it contains the current version for the element, it will be incremented automatically if the modification is successful.

### 1.3. Pagination

By default the API will always return paginated results and includes the following headers in the response:

- x-paginated: boolean indicating if pagination is being used for the request
- x-paginated-by: number of results per page
- x-pagination-count: total number of results
- x-pagination-current: current page
- x-pagination-next: next results
- x-pagination-prev: previous results
  **Disabling pagination** can be accomplished by setting an extra http header:

```
### 1.4. Internationalization
The API returns some content translated, you can specify the language with an extra http header:
```

The LanguageId can be chosen from the value list of available languages. You can get them using the [locales API](https://docs.taiga.io/api.html#locales).

### 1.5. Throttling

If the api is configured with throttling you have to take care on responses
with 429 (Too many requests) status code, that mean you reach the throttling
limit.

### 1.6. Read only fields

All the fields ending in \_extra_info (assigned_to_extra_info, is_private_extra_info, owner_extra_info, project_extra_info, status_extra_info, status_extra_info, user_story_extra_info…​) are read only fields

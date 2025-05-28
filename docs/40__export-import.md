## 40. Export/Import

### 40.1. Export

To get a project dump send a GET request with the project id:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

Depending on server configuration it can return two results:

- If taiga is working in synchronous mode the json file is directly generated, the result is a 200 OK and as response body a JSON of [export detail for synch mode](https://docs.taiga.io/api.html#object-export-synch).
- If taiga is working in asynchronous mode the result is a 202 Accepted and as response body a JSON of [export request accepted](https://docs.taiga.io/api.html#object-export-accepted). The export_id can be used to build the URL to download the exported file when the file generation is complete, those urls look like: MEDIA_URL/exports/PROJECT_ID/PROJECT_SLUG-export_id.json.

### 40.2. Import

To load a project dump send a POST request with the following file:

- **dump** (required)

```bash
-H "Content-Type: multipart/form-data" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-F dump=@dump.json \
```

Depending on server configuration it can return two results:

- A 202 Accepted and as response body a JSON of [import request accepted](https://docs.taiga.io/api.html#object-import-accepted).
- A 201 Created and the response body is a JSON of [project detail object](https://docs.taiga.io/api.html#object-project-detail)

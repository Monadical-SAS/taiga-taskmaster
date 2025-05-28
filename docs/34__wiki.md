## 34. Wiki pages

### 34.1. List

To list wiki pages send a GET request with the following parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [wiki page detail objects](https://docs.taiga.io/api.html#object-wiki-detail)
The results can be filtered using the following parameters:

- **project**: project id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

### 34.2. Create

To create wiki pages send a POST request with the following data:

- **project** (required): project id
- **slug** (required): slug
- **content** (required): string
- **watchers**: array of watcher id’s

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"content": "Lorem ipsum dolor.",
"project": 1,
"slug": "new-page",
"watchers": []
}' \
```

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"content": "Lorem ipsum dolor.",
"project": 1,
"slug": "new-simple-page"
}' \
```

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [wiki page detail object](https://docs.taiga.io/api.html#object-wiki-detail)

### 34.3. Get

To get a wiki page send a GET request specifying the wiki page id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [wiki page detail object](https://docs.taiga.io/api.html#object-wiki-detail)

### 34.4. Get by slug

To get a wiki page send a GET request specifying the wiki page slug and the project id as parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [wiki page detail object](https://docs.taiga.io/api.html#object-wiki-detail)

### 34.5. Edit

To edit wiki pages send a PUT or a PATCH specifying the wiki page id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"subject": "Patching subject",
"version": 1
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [wiki page detail object](https://docs.taiga.io/api.html#object-wiki-detail)

### 34.6. Delete

To delete wiki page send a DELETE specifying the wiki page id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

### 34.7. Watch a wiki page

To watch a wiki page send a POST request specifying the wiki page id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK with an empty body response

### 34.8. Stop watching a wiki page

To stop watching a wiki page send a POST request specifying the wiki page id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK with an empty body response

### 34.9. List wiki page watchers

To get the list of watchers from a wiki page send a GET request specifying the wiki page id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [wiki page watcher object](https://docs.taiga.io/api.html#object-wiki-watcher-detail)

### 34.10. List attachments

To list wiki page attachments send a GET request with the following parameters:

- **project**: project id
- **object_id**: wiki page id

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [attachment detail objects](https://docs.taiga.io/api.html#object-attachment-detail)

### 34.11. Create attachment

To create wiki page attachments send a POST request with the following data:

- **object_id** (required): wiki page id
- **project** (required): project id
- **attached_file** (required): attaching file
- **description**
- **is_deprecated**

```json
"attached_file": "attachments/6/2/d/2/9fd8261a62f1be8d66867e604b81eeab08e4e28382c23f1ca8e5e7d90c49/sample_attachment_3.txt",
"created_date": "2020-07-02T11:58:05.759Z",
"description": "Updated description",
"from_comment": false,
"id": 749,
"is_deprecated": true,
"modified_date": "2020-07-03T08:40:58.624Z",
"name": "sample_attachment_3.txt",
"object_id": 7,
"order": 1,
"owner": 7,
"preview_url": "http://localhost:8000/media/attachments/6/2/d/2/9fd8261a62f1be8d66867e604b81eeab08e4e28382c23f1ca8e5e7d90c49/sample_attachment_3.txt",
"project": 3,
"sha1": "da2631d805f12a1b533738a0912e9b9c2261dbef",
"size": 1178,
"thumbnail_card_url": null,
"url": "http://localhost:8000/media/attachments/6/2/d/2/9fd8261a62f1be8d66867e604b81eeab08e4e28382c23f1ca8e5e7d90c49/sample_attachment_3.txt"
```

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)

### 34.12. Get attachment

To get an wiki page attachment send a GET request specifying the wiki page attachment id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)

### 34.13. Edit attachment

To edit wiki page attachments send a PUT or a PATCH specifying the wiki page attachment id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"description": "Updated description"
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [attachment detail object](https://docs.taiga.io/api.html#object-attachment-detail)

### 34.14. Delete attachment

To delete wiki page attachments send a DELETE specifying the wiki page attachment id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

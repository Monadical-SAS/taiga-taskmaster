## 13. Milestones

### 13.1. List

To list milestones send a GET request with the following parameters:

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [milestone detail objects](https://docs.taiga.io/api.html#object-milestone-detail)
The results can be filtered using the following parameters:

- **project**: project ID
- **closed**: `true` to get only closed milestones or `false` to get only opened ones.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When you filter milestones by project ID (`/api/v1/milestones?project=*&lt;projectID&gt;*`) the response has two new headers:

- `**Taiga-Info-Total-Opened-Milestones**`: the numer of opened milestones for this project.
- `**Taiga-Info-Total-Closed-Milestones**`: the numer of closed milestones for this project.

### 13.2. Create

To create milestone send a POST request with the following data:

- **project** (required): project id
- **name** (required): string
- **estimated_start** (required): iso date (YYYY-MM-DD)
- **estimated_finish** (required): iso date (YYYY-MM-DD)
- **disponibility**: float
- **slug**: slug
- **order**: integer
- **watchers**: array of watcher id’s

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"disponibility": 30,
"estimated_finish": "2014-11-04",
"estimated_start": "2014-10-20",
"name": "Sprint 1",
"order": 1,
"project": 1,
"slug": "sprint-1",
"watchers": []
}' \
```

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"estimated_finish": "2014-11-04",
"estimated_start": "2014-10-20",
"name": "Sprint 3",
"project": 1
}' \
```

When the creation is successful, the HTTP response is a 201 Created and the response body is a JSON [milestone detail object](https://docs.taiga.io/api.html#object-milestone-detail)

### 13.3. Get

To get a milestone send a GET request specifying the milestone id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [milestone detail object](https://docs.taiga.io/api.html#object-milestone-detail)

### 13.4. Edit

To edit milestones send a PUT or a PATCH specifying the milestone id in the url.
In a PATCH request you just need to send the modified data, in a PUT one the whole object must be sent.

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-d '{
"name": "Sprint 2"
}' \
```

When the creation is successful, the HTTP response is a 200 OK and the response body is a JSON [milestone detail object](https://docs.taiga.io/api.html#object-milestone-detail)

### 13.5. Delete

To delete milestones send a DELETE specifying the milestone id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

When delete succeeded, the HTTP response is a 204 NO CONTENT with an empty body response

### 13.6. Stats

To get the milestone stats send a GET request specifying the milestone id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON [milestone stats detail object](https://docs.taiga.io/api.html#object-milestone-stats-detail)

### 13.7. Watch a milestone

To watch a milestone send a POST request specifying the milestone id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK with an empty body response

### 13.8. Stop watching a milestone

To stop watching an milestone send a POST request specifying the milestone id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK with an empty body response

### 13.9. List milestone watchers

To get the list of watchers from a milestone send a GET request specifying the milestone id in the url

```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```

The HTTP response is a 200 OK and the response body is a JSON list of [milestone watcher object](https://docs.taiga.io/api.html#object-milestone-watcher-detail)

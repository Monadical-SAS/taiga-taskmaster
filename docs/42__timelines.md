## 42. Timelines
### 42.1. List user timeline
To list a user timeline send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
This API call returns only actions directly executed by the specified user.
The HTTP response is a 200 OK and the response body is a JSON list of [timeline entry detail](https://docs.taiga.io/api.html#object-timeline-detail)
### 42.2. List profile timeline
To list a profile timeline send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
This API call returns actions executed by the specified user and related to them, watching objects, actions by related team members, belonging to projects…
The HTTP response is a 200 OK and the response body is a JSON list of [timeline entry detail](https://docs.taiga.io/api.html#object-timeline-detail)
### 42.3. List project timeline
To list a project timeline send a GET request with the following parameters:
```bash
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
```
This API call returns actions executed by different users related to the specified project.
The HTTP response is a 200 OK and the response body is a JSON list of [timeline entry detail](https://docs.taiga.io/api.html#object-timeline-detail)

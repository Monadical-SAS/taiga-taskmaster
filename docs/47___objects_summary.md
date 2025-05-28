## 47. Objects Summary

### 47.1. Attachment

```json
"attached_file": "attachments/f/7/0/0/b89c9d9aaf3de48f2486e1f5dc2f897a321bfa861cc5cb59b5936f0ebc40/sample_attachment_2.txt",
"created_date": "2020-07-02T11:57:14.266Z",
"description": "ipsam impedit dignissimos sed ea",
"from_comment": false,
"id": 415,
"is_deprecated": false,
"modified_date": "2020-07-02T11:57:14.266Z",
"name": "sample_attachment_2.txt",
"object_id": 28,
"order": 1,
"owner": 13,
"preview_url": "http://localhost:8000/media/attachments/f/7/0/0/b89c9d9aaf3de48f2486e1f5dc2f897a321bfa861cc5cb59b5936f0ebc40/sample_attachment_2.txt",
"project": 2,
"sha1": "62dbe72633a794717c1f4817d2d7d087b1c29c69",
"size": 1688,
"thumbnail_card_url": null,
"url": "http://localhost:8000/media/attachments/f/7/0/0/b89c9d9aaf3de48f2486e1f5dc2f897a321bfa861cc5cb59b5936f0ebc40/sample_attachment_2.txt"
```

```json
"description": "description paragraph",
"icon_url": null,
"id": "00000000-0000-0000-0000-000000000000",
"name": "example application",
"web": "http://example.com"
```

### 47.2. Application token object

```json
"application": {
"description": "description paragraph",
"icon_url": null,
"id": "00000000-0000-0000-0000-000000000000",
"name": "example application",
"web": "http://example.com"
},
"auth_code": "bd7c35d8-2138-4fe6-8109-09b9935b7736",
"id": 1,
"next_url": "http://example.com?auth_code=bd7c35d8-2138-4fe6-8109-09b9935b7736",
"user": 6
```

### 47.3. Authorization code object

```json
"auth_code": "bd7c35d8-2138-4fe6-8109-09b9935b7736",
"next_url": "http://example.com?auth_code=bd7c35d8-2138-4fe6-8109-09b9935b7736",
"state": "random-state"
```

### 47.4. Cyphered token object

```json
"token": "00000000-0000-0000-0000-000000000001"
```

### 47.5. User detail

```json
"accepted_terms": true,
"big_photo": null,
"bio": "",
"color": "#40826D",
"date_joined": "2020-07-02T11:56:19.209Z",
"email": "user2114747470430251528@taigaio.demo",
"full_name": "Vanesa Torres",
"full_name_display": "Vanesa Torres",
"gravatar_id": "b579f05d7d36f4588b11887093e4ce44",
"id": 6,
"is_active": true,
"lang": "",
"max_memberships_private_projects": null,
"max_memberships_public_projects": null,
"max_private_projects": null,
"max_public_projects": null,
"photo": null,
"read_new_terms": false,
"roles": [
"Design",
"Front",
"Product Owner",
"UX"
],
"theme": "",
"timezone": "",
"total_private_projects": 4,
"total_public_projects": 4,
"username": "patchedusername",
"uuid": "e9296d489b6a42d79048df2f3789b396"
```

### 47.6. User contact detail

```json
"big_photo": null,
"bio": "",
"color": "#FFCC00",
"full_name": "Angela Perez",
"full_name_display": "Angela Perez",
"gravatar_id": "c9ba9d485f9a9153ebf53758feb0980c",
"id": 11,
"is_active": true,
"lang": "",
"photo": null,
"roles": [
"Design",
"Front",
"Product Owner",
"Stakeholder",
"UX"
],
"theme": "",
"timezone": "",
"username": "user5"
```

### 47.7. User authentication-detail

```json
"accepted_terms": true,
"auth_token": "eyJ1c2VyX2F1dGhlbnRpY2F0aW9uX2lkIjoxNn0:1jrHFG:QR38NU7tHvPzl_s7BvgWEgnoxIc",
"big_photo": null,
"bio": "",
"color": "#c9f5fe",
"date_joined": "2020-07-03T08:40:29.738Z",
"email": "test-register@email.com",
"full_name": "test",
"full_name_display": "test",
"gravatar_id": "1ec29e4d0732b571e9a975e258a7e9b5",
"id": 16,
"is_active": true,
"lang": "",
"max_memberships_private_projects": null,
"max_memberships_public_projects": null,
"max_private_projects": null,
"max_public_projects": null,
"photo": null,
"read_new_terms": false,
"refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTYyNzI5OTQzMiwianRpIjoiMmNkMmNhNzQwYjRiNGZkNzk0ZDlmMDlmNWYwNzAwMTkiLCJ1c2VyX2lkIjo1fQ.vez_-n6y9yQo2uFgXTPB5YdJHFKUIAsCrNVJ29_T3wM",
"roles": [
"Front"
],
"theme": "",
"timezone": "",
"total_private_projects": 0,
"total_public_projects": 0,
"username": "test-username",
"uuid": "c30015cc735e4b33b008139b58f13791"
```

### 47.8. Refresh authentication code

```json
"auth_token": "eyJ1c2VyX2F1dGhlbnRpY2F0aW9uX2lkIjoxNn0:1jrHFF:0lezpY0AUIQ0klewdxTHXjRPAdA",
"refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTYyNzI5OTQzMiwianRpIjoiMmNkMmNhNzQwYjRiNGZkNzk0ZDlmMDlmNWYwNzAwMTkiLCJ1c2VyX2lkIjo1fQ.vez_-n6y9yQo2uFgXTPB5YdJHFKUIAsCrNVJ29_T3wM"
```

### 47.9. User stats detail

```json
"roles": [
"Design",
"Front",
"UX",
"Product Owner"
],
"total_num_closed_userstories": 2,
"total_num_contacts": 11,
"total_num_projects": 11
```

### 47.10. Search results detail

```json
"count": 31,
"epics": [
{
"assigned_to": 15,
"id": 2,
"ref": 65,
"status": 1,
"subject": "Experimental: modular file types"
},
{
"assigned_to": 15,
"id": 1,
"ref": 64,
"status": 4,
"subject": "Added file copying and processing of images (resizing)"
},
{
"assigned_to": 6,
"id": 6,
"ref": 69,
"status": 2,
"subject": "Experimental: modular file types"
}
],
"issues": [
{
"assigned_to": 14,
"id": 20,
"ref": 61,
"status": 7,
"subject": "Fixing templates for Django 1.6."
},
{
"assigned_to": 9,
"id": 1,
"ref": 42,
"status": 5,
"subject": "Migrate to Python 3 and milk a beautiful cow"
},
{
"assigned_to": null,
"id": 13,
"ref": 54,
"status": 6,
"subject": "Create testsuite with matrix builds"
},
{
"assigned_to": 12,
"id": 14,
"ref": 55,
"status": 6,
"subject": "Create the html template"
},
{
"assigned_to": null,
"id": 3,
"ref": 44,
"status": 4,
"subject": "Patching subject"
},
{
"assigned_to": 12,
"id": 10,
"ref": 51,
"status": 6,
"subject": "Experimental: modular file types"
},
{
"assigned_to": 8,
"id": 12,
"ref": 53,
"status": 7,
"subject": "Add setting to allow regular users to create folders at the root level."
},
{
"assigned_to": 6,
"id": 8,
"ref": 49,
"status": 7,
"subject": "Lighttpd x-sendfile support"
},
{
"assigned_to": 5,
"id": 9,
"ref": 50,
"status": 3,
"subject": "Create testsuite with matrix builds"
},
{
"assigned_to": 12,
"id": 6,
"ref": 47,
"status": 2,
"subject": "Implement the form"
},
{
"assigned_to": 5,
"id": 2,
"ref": 43,
"status": 5,
"subject": "Added file copying and processing of images (resizing)"
}
],
"tasks": [
{
"assigned_to": 6,
"id": 15,
"ref": 20,
"status": 4,
"subject": "Added file copying and processing of images (resizing)"
},
{
"assigned_to": 6,
"id": 4,
"ref": 5,
"status": 2,
"subject": "Experimental: modular file types"
},
{
"assigned_to": 5,
"id": 5,
"ref": 7,
"status": 1,
"subject": "Fixing templates for Django 1.6."
},
{
"assigned_to": 15,
"id": 8,
"ref": 11,
"status": 5,
"subject": "Create testsuite with matrix builds"
},
{
"assigned_to": 7,
"id": 7,
"ref": 9,
"status": 5,
"subject": "get_actions() does not check for 'delete_selected' in actions"
},
{
"assigned_to": 14,
"id": 24,
"ref": 33,
"status": 3,
"subject": "Lighttpd support"
}
],
"userstories": [
{
"id": 12,
"milestone_name": null,
"milestone_slug": null,
"ref": 36,
"status": 1,
"subject": "get_actions() does not check for 'delete_selected' in actions",
"total_points": 31.0
},
{
"id": 10,
"milestone_name": null,
"milestone_slug": null,
"ref": 34,
"status": 4,
"subject": "Experimental: modular file types",
"total_points": 18.0
},
{
"id": 4,
"milestone_name": "Sprint 2020-5-23",
"milestone_slug": "sprint-2020-5-23",
"ref": 13,
"status": 3,
"subject": "Support for bulk actions",
"total_points": 110.0
},
{
"id": 8,
"milestone_name": "Sprint 2020-5-23",
"milestone_slug": "sprint-2020-5-23",
"ref": 30,
"status": 1,
"subject": "Add setting to allow regular users to create folders at the root level.",
"total_points": 25.0
},
{
"id": 16,
"milestone_name": null,
"milestone_slug": null,
"ref": 40,
"status": 3,
"subject": "Added file copying and processing of images (resizing)",
"total_points": 10.0
},
{
"id": 1,
"milestone_name": "Sprint 2020-5-8",
"milestone_slug": "sprint-2020-5-8",
"ref": 1,
"status": 4,
"subject": "Patching subject",
"total_points": 44.0
}
],
"wikipages": [
{
"id": 5,
"slug": "amet"
},
{
"id": 4,
"slug": "fugit-sint"
},
{
"id": 2,
"slug": "numquam"
},
{
"id": 3,
"slug": "perspiciatis"
},
{
"id": 1,
"slug": "home"
}
]
```

### 47.11. User storage data

```json
"created_date": "2020-07-03T08:40:53.885Z",
"key": "favorite-forest",
"modified_date": "2020-07-03T08:40:53.921Z",
"value": "Russian Taiga"
```

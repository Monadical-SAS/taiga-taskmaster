## 2. Endpoints Summary

### 2.1. Auth

**URL**
**Method**
**Functionality**
/api/v1/auth
POST
[Login](https://docs.taiga.io/api.html#auth-normal-login)
/api/v1/auth/refresh
POST
[Refresh auth token](https://docs.taiga.io/api.html#auth-refresh)
/api/v1/auth/register
POST
[Register user](https://docs.taiga.io/api.html#auth-public-registry)

### 2.2. Applications

**URL**
**Method**
**Functionality**
/api/v1/applications/{applicationId}
GET
[Get application](https://docs.taiga.io/api.html#applications-get)
/api/v1/applications/{applicationId}/token
GET
[Get application token](https://docs.taiga.io/api.html#applications-get-token)

### 2.3. Application Tokens

**URL**
**Method**
**Functionality**
/api/v1/application-tokens
GET
[List application tokens](https://docs.taiga.io/api.html#application-tokens-list)
/api/v1/application-tokens/{applicationTokenId}
GET
[Get application token](https://docs.taiga.io/api.html#application-tokens-get)
/api/v1/application-tokens/{applicationTokenId}
DELETE
[Delete application token](https://docs.taiga.io/api.html#application-tokens-delete)
/api/v1/application-tokens/authorize
POST
[Authorize application token](https://docs.taiga.io/api.html#application-tokens-authorize)
/api/v1/application-tokens/validate
POST
[Validate application token](https://docs.taiga.io/api.html#application-tokens-validate)

### 2.4. Resolver

**URL**
**Method**
**Functionality**
/api/v1/resolver
GET
[Resolve references and slugs](https://docs.taiga.io/api.html#resolver)

### 2.5. Searches

**URL**
**Method**
**Functionality**
/api/v1/search
GET
[Search in a project](https://docs.taiga.io/api.html#searches-search)

### 2.6. User storage

**URL**
**Method**
**Functionality**
/api/v1/user-storage
GET
[List user storage data](https://docs.taiga.io/api.html#user-storage-list)
/api/v1/user-storage
POST
[Create user storage data](https://docs.taiga.io/api.html#user-storage-create)
/api/v1/user-storage/{key}
GET
[Get user storage data](https://docs.taiga.io/api.html#user-storage-get)
/api/v1/user-storage/{key}
PUT
[Modify user storage data](https://docs.taiga.io/api.html#user-storage-edit)
/api/v1/user-storage/{key}
PATCH
[Modify partially an user storage data](https://docs.taiga.io/api.html#user-storage-edit)
/api/v1/user-storage/{key}
DELETE
[Delete user storage data](https://docs.taiga.io/api.html#user-storage-delete)

### 2.7. Project templates

**URL**
**Method**
**Functionality**
/api/v1/project-templates
GET
[List project templates](https://docs.taiga.io/api.html#project-templates-list)
/api/v1/project-templates
POST
[Create project template](https://docs.taiga.io/api.html#project-templates-create)
/api/v1/project-templates/{projectTemplateId}
GET
[Get project template](https://docs.taiga.io/api.html#project-templates-get)
/api/v1/project-templates/{projectTemplateId}
PUT
[Modify project template](https://docs.taiga.io/api.html#project-templates-edit)
/api/v1/project-templates/{projectTemplateId}
PATCH
[Modify partially an project template](https://docs.taiga.io/api.html#project-templates-edit)
/api/v1/project-templates/{projectTemplateId}
DELETE
[Delete an project template](https://docs.taiga.io/api.html#project-templates-delete)

### 2.8. Projects

**URL**
**Method**
**Functionality**
/api/v1/projects
GET
[List projects](https://docs.taiga.io/api.html#projects-list)
/api/v1/projects
POST
[Create project](https://docs.taiga.io/api.html#projects-create)
/api/v1/projects/{projectId}
GET
[Get project](https://docs.taiga.io/api.html#projects-get)
/api/v1/projects/by_slug?slug={projectSlug}
GET
[Get project](https://docs.taiga.io/api.html#projects-get-by-slug)
/api/v1/projects/{projectId}
PUT
[Modify project](https://docs.taiga.io/api.html#projects-edit)
/api/v1/projects/{projectId}
PATCH
[Modify partially a project](https://docs.taiga.io/api.html#projects-edit)
/api/v1/projects/{projectId}
DELETE
[Delete a project](https://docs.taiga.io/api.html#projects-delete)
/api/v1/projects/bulk_update_order
POST
[Update projects order for logged in user](https://docs.taiga.io/api.html#projects-bulk-update-order)
/api/v1/projects/{projectId}/modules
GET
[Get project modules configuration](https://docs.taiga.io/api.html#projects-get-modules)
/api/v1/projects/{projectId}/modules
PATCH
[Modify partially a project modules configuration](https://docs.taiga.io/api.html#projects-edit-modules)
/api/v1/projects/{projectId}/stats
GET
[Get project stats](https://docs.taiga.io/api.html#projects-stats)
/api/v1/projects/{projectId}/issues_stats
GET
[Get project issue stats](https://docs.taiga.io/api.html#projects-issue-stats)
/api/v1/projects/{projectId}/tags_colors
GET
[Get project tags colors](https://docs.taiga.io/api.html#projects-tag-colors)
/api/v1/projects/{projectId}/create_tag
POST
[Create project tag](https://docs.taiga.io/api.html#projects-create-tag)
/api/v1/projects/{projectId}/edit_tag
POST
[Edit project tag](https://docs.taiga.io/api.html#projects-edit-tag)
/api/v1/projects/{projectId}/delete_tag
POST
[Delete project tag](https://docs.taiga.io/api.html#projects-delete-tag)
/api/v1/projects/{projectId}/mix_tags
POST
[Mix project tags](https://docs.taiga.io/api.html#projects-mix-tags)
/api/v1/projects/{projectId}/like
POST
[Like a project](https://docs.taiga.io/api.html#projects-like)
/api/v1/projects/{projectId}/unlike
POST
[Unlike a project](https://docs.taiga.io/api.html#projects-unlike)
/api/v1/projects/{projectId}/fans
GET
[Get project fans](https://docs.taiga.io/api.html#projects-fans)
/api/v1/projects/{projectId}/watch
POST
[Watch a project](https://docs.taiga.io/api.html#projects-watch)
/api/v1/projects/{projectId}/unwatch
POST
[Unwatch a project](https://docs.taiga.io/api.html#projects-unwatch)
/api/v1/projects/{projectId}/watchers
GET
[Get project watchers](https://docs.taiga.io/api.html#projects-watchers)
/api/v1/projects/{projectId}/create_template
POST
[Create project template](https://docs.taiga.io/api.html#projects-create-template)
/api/v1/projects/{projectId}/leave
POST
[Leave project](https://docs.taiga.io/api.html#projects-leave)
/api/v1/projects/{projectId}/change_logo
POST
[Change logo](https://docs.taiga.io/api.html#projects-change-logo)
/api/v1/projects/{projectId}/remove_logo
POST
[Remove logo](https://docs.taiga.io/api.html#projects-remove-logo)
/api/v1/projects/{projectId}/transfer_validate_token
POST
[Transfer validate token](https://docs.taiga.io/api.html#projects-transfer-validate-token)
/api/v1/projects/{projectId}/transfer_request
POST
[Transfer request](https://docs.taiga.io/api.html#projects-transfer-request)
/api/v1/projects/{projectId}/transfer_start
POST
[Transfer start](https://docs.taiga.io/api.html#projects-transfer-start)
/api/v1/projects/{projectId}/transfer_accept
POST
[Transfer accept](https://docs.taiga.io/api.html#projects-transfer-accept)
/api/v1/projects/{projectId}/transfer_reject
POST
[Transfer reject](https://docs.taiga.io/api.html#projects-transfer-reject)
/api/v1/projects/{projectId}/duplicate
POST
[Duplicate project](https://docs.taiga.io/api.html#projects-duplicate)

### 2.9. Memberships/Invitations

**URL**
**Method**
**Functionality**
/api/v1/memberships
GET
[List memberships](https://docs.taiga.io/api.html#memberships-list)
/api/v1/memberships
POST
[Create membership](https://docs.taiga.io/api.html#memberships-create)
/api/v1/memberships/bulk_create
POST
[Create a bulk of memberships](https://docs.taiga.io/api.html#memberships-bulk-create)
/api/v1/memberships/{membershipId}
GET
[Get membership](https://docs.taiga.io/api.html#memberships-get)
/api/v1/memberships/{membershipId}
PUT
[Modify membership](https://docs.taiga.io/api.html#memberships-edit)
/api/v1/memberships/{membershipId}
PATCH
[Modify partially a membership](https://docs.taiga.io/api.html#memberships-edit)
/api/v1/memberships/{membershipId}
DELETE
[Delete a membership](https://docs.taiga.io/api.html#memberships-delete)
/api/v1/memberships/{membershipId}/resend_invitation
POST
[Resend invitation](https://docs.taiga.io/api.html#memberships-resend-invitation)
/api/v1/invitations/{invitationUuid}
POST
[Get invitation by anonymous user](https://docs.taiga.io/api.html#memberships-invitations)

### 2.10. Roles

**URL**
**Method**
**Functionality**
/api/v1/roles
GET
[List roles](https://docs.taiga.io/api.html#roles-list)
/api/v1/roles
POST
[Create role](https://docs.taiga.io/api.html#roles-create)
/api/v1/roles/{roleId}
GET
[Get role](https://docs.taiga.io/api.html#roles-get)
/api/v1/roles/{roleId}
PUT
[Modify role](https://docs.taiga.io/api.html#roles-edit)
/api/v1/roles/{roleId}
PATCH
[Modify partially a role](https://docs.taiga.io/api.html#roles-edit)
/api/v1/roles/{roleId}
DELETE
[Delete a role](https://docs.taiga.io/api.html#roles-delete)

### 2.11. Milestones

**URL**
**Method**
**Functionality**
/api/v1/milestones
GET
[List milestones](https://docs.taiga.io/api.html#milestones-list)
/api/v1/milestones
POST
[Create milestone](https://docs.taiga.io/api.html#milestones-create)
/api/v1/milestones/{milestoneId}
GET
[Get milestone](https://docs.taiga.io/api.html#milestones-get)
/api/v1/milestones/{milestoneId}
PUT
[Modify milestone](https://docs.taiga.io/api.html#milestones-edit)
/api/v1/milestones/{milestoneId}
PATCH
[Modify partially a milestone](https://docs.taiga.io/api.html#milestones-edit)
/api/v1/milestones/{milestoneId}
DELETE
[Delete a milestone](https://docs.taiga.io/api.html#milestones-delete)
/api/v1/milestones/{milestoneId}/stats
GET
[Get a milestone stats](https://docs.taiga.io/api.html#milestones-stats)
/api/v1/milestones/{milestoneId}/watch
POST
[Watch a milestone](https://docs.taiga.io/api.html#milestones-watch)
/api/v1/milestones/{milestoneId}/unwatch
POST
[Stop watching a milestone](https://docs.taiga.io/api.html#milestones-unwatch)
/api/v1/milestones/{milestoneId}/watchers
GET
[Get milestone watchers](https://docs.taiga.io/api.html#milestones-watchers)

### 2.12. Epics

**URL**
**Method**
**Functionality**
/api/v1/epics
GET
[List epics](https://docs.taiga.io/api.html#epics-list)
/api/v1/epics
POST
[Create epic](https://docs.taiga.io/api.html#epics-create)
/api/v1/epics/{epicId}
GET
[Get epic](https://docs.taiga.io/api.html#epics-get)
/api/v1/epics/by_ref?ref={epicRef}&amp;project={projectId}
GET
[Get epic](https://docs.taiga.io/api.html#epics-get-by-ref)
/api/v1/epics/{epicId}
PUT
[Modify epic](https://docs.taiga.io/api.html#epics-edit)
/api/v1/epics/{epicId}
PATCH
[Modify partially an epic](https://docs.taiga.io/api.html#epics-edit)
/api/v1/epics/{epicId}
DELETE
[Delete an epic](https://docs.taiga.io/api.html#epics-delete)
/api/v1/epics/{epicId}/related_userstories
GET
[List epic related userstories](https://docs.taiga.io/api.html#epics-related-user-stories-list)
/api/v1/epics/{epicId}/related_userstories
POST
[Create epic related user story](https://docs.taiga.io/api.html#epics-related-user-stories-create)
/api/v1/epics/{epicId}/related_userstories/{userStoryId}
GET
[Get epic related userstory](https://docs.taiga.io/api.html#epics-related-user-stories-get)
/api/v1/epics/{epicId}/related_userstories/{userStoryId}
PUT
[Modify epic related user story](https://docs.taiga.io/api.html#epics-related-user-stories-edit)
/api/v1/epics/{epicId}/related_userstories/{userStoryId}
PATCH
[Modify partially an epic related user story](https://docs.taiga.io/api.html#epics-related-user-stories-edit)
/api/v1/epics/{epicId}/related_userstories/{userStoryId}
DELETE
[Delete an epic related user story](https://docs.taiga.io/api.html#epics-related-user-stories-delete)
/api/v1/epics/{epicId}/related_userstories/bulk_create
POST
[Create epic related user stories on bulk mode](https://docs.taiga.io/api.html#epics-related-user-stories-bulk-create)
/api/v1/epics/bulk_create
POST
[Create epics on bulk mode](https://docs.taiga.io/api.html#epics-bulk-create)
/api/v1/epics/filters_data?project={projectId}
GET
[Get filters data](https://docs.taiga.io/api.html#epics-get-filters-data)
/api/v1/epics/{epicId}/upvote
POST
[Add star to an epic](https://docs.taiga.io/api.html#epics-upvote)
/api/v1/epics/{epicId}/downvote
POST
[Remove star from epic](https://docs.taiga.io/api.html#epics-downvote)
/api/v1/epics/{epicId}/voters
GET
[Get epic voters](https://docs.taiga.io/api.html#epics-voters)
/api/v1/epics/{epicId}/watch
POST
[Watch an epic](https://docs.taiga.io/api.html#epics-watch)
/api/v1/epics/{epicId}/unwatch
POST
[Unwatch an epic](https://docs.taiga.io/api.html#epics-unwatch)
/api/v1/epics/{epicId}/watchers
GET
[Get epic watchers](https://docs.taiga.io/api.html#epics-watchers)
/api/v1/epics/attachments
GET
[List epic attachments](https://docs.taiga.io/api.html#epics-list-attachments)
/api/v1/epics/attachments
POST
[Create epic attachments](https://docs.taiga.io/api.html#epics-create-attachment)
/api/v1/epics/attachments/{epicAttachmentId}
GET
[Get epic attachments](https://docs.taiga.io/api.html#epics-get-attachment)
/api/v1/epics/attachments/{epicAttachmentId}
PUT
[Modify epic attachments](https://docs.taiga.io/api.html#epics-edit-attachment)
/api/v1/epics/attachments/{epicAttachmentId}
PATCH
[Modify partially an epic attachments](https://docs.taiga.io/api.html#epics-edit-attachment)
/api/v1/epics/attachments/{epicAttachmentId}
DELETE
[Delete an epic attachments](https://docs.taiga.io/api.html#epics-delete-attachment)

### 2.13. Epic status

**URL**
**Method**
**Functionality**
/api/v1/epic-statuses
GET
[List epic statuses](https://docs.taiga.io/api.html#epic-statuses-list)
/api/v1/epic-statuses
POST
[Create epic status](https://docs.taiga.io/api.html#epic-statuses-create)
/api/v1/epic-statuses/{epicStatusId}
GET
[Get epic status](https://docs.taiga.io/api.html#epic-statuses-get)
/api/v1/epic-statuses/{epicStatusId}
PUT
[Modify epic status](https://docs.taiga.io/api.html#epic-statuses-edit)
/api/v1/epic-statuses/{epicStatusId}
PATCH
[Modify partially an epic status](https://docs.taiga.io/api.html#epic-statuses-edit)
/api/v1/epic-statuses/{epicStatusId}
DELETE
[Delete an epic status](https://docs.taiga.io/api.html#epic-statuses-delete)
/api/v1/epic-statuses/bulk_update_order
POST
[Update epic statuses order in bulk mode](https://docs.taiga.io/api.html#epic-statuses-bulk-update-order)

### 2.14. Epic custom attribute

**URL**
**Method**
**Functionality**
/api/v1/epic-custom-attributes
GET
[List epic custom attributes](https://docs.taiga.io/api.html#epic-custom-attributes-list)
/api/v1/epic-custom-attributes
POST
[Create epic custom attribute](https://docs.taiga.io/api.html#epic-custom-attributes-create)
/api/v1/epic-custom-attributes/{epicCustomAttributeId}
GET
[Get epic custom attribute](https://docs.taiga.io/api.html#epic-custom-attributes-get)
/api/v1/epic-custom-attributes/{epicCustomAttributeId}
PUT
[Modify epic custom attribute](https://docs.taiga.io/api.html#epic-custom-attributes-edit)
/api/v1/epic-custom-attributes/{epicCustomAttributeId}
PATCH
[Modify partially an epic custom attribute](https://docs.taiga.io/api.html#epic-custom-attributes-edit)
/api/v1/epic-custom-attributes/{epicCustomAttributeId}
DELETE
[Delete an epic custom attribute](https://docs.taiga.io/api.html#epic-custom-attributes-delete)
/api/v1/epic-custom-attributes/bulk_update_order
POST
[Update epic custom attributes order in bulk mode](https://docs.taiga.io/api.html#epic-custom-attributes-bulk-update-order)

### 2.15. Epic custom attributes values

**URL**
**Method**
**Functionality**
/api/v1/epics/custom-attributes-values/{epicId}
GET
[Get epic custom attributes values](https://docs.taiga.io/api.html#epic-custom-attributes-values-get)
/api/v1/epics/custom-attributes-values/{epicId}
PUT
[Modify epic custom attributes values](https://docs.taiga.io/api.html#epic-custom-attributes-values-edit)
/api/v1/epics/custom-attributes-values/{epicId}
PATCH
[Modify partially an epic custom attributes values](https://docs.taiga.io/api.html#epic-custom-attributes-values-edit)

### 2.16. User stories

**URL**
**Method**
**Functionality**
/api/v1/userstories
GET
[List user stories](https://docs.taiga.io/api.html#user-stories-list)
/api/v1/userstories
POST
[Create user story](https://docs.taiga.io/api.html#user-stories-create)
/api/v1/userstories/{userStoryId}
GET
[Get user story](https://docs.taiga.io/api.html#user-stories-get)
/api/v1/userstories/by_ref?ref={userStoryRef}&amp;project={userStoryId}
GET
[Get user story](https://docs.taiga.io/api.html#user-stories-get-by-ref)
/api/v1/userstories/{userStoryId}
PUT
[Modify user story](https://docs.taiga.io/api.html#user-stories-edit)
/api/v1/userstories/{userStoryId}
PATCH
[Modify partially a user story](https://docs.taiga.io/api.html#user-stories-edit)
/api/v1/userstories/{userStoryId}
DELETE
[Delete a user story](https://docs.taiga.io/api.html#user-stories-delete)
/api/v1/userstories/bulk_create
POST
[Create user stories un bulk mode](https://docs.taiga.io/api.html#user-stories-bulk-create)
/api/v1/userstories/bulk_update_backlog_order
POST
[Update user stories order for backlog in bulk mode](https://docs.taiga.io/api.html#user-stories-bulk-update-backlog-order)
/api/v1/userstories/bulk_update_kanban_order
POST
[Update user stories order for kanban in bulk mode](https://docs.taiga.io/api.html#user-stories-bulk-update-kanban-order)
/api/v1/userstories/bulk_update_sprint_order
POST
[Update user stories order for sprint in bulk mode](https://docs.taiga.io/api.html#user-stories-bulk-update-sprint-order)
/api/v1/userstories/bulk_update_milestone
POST
[Update user stories sprint in bulk mode](https://docs.taiga.io/api.html#user-stories-bulk-update-milestone)
/api/v1/userstories/filters_data?project={projectId}
GET
[Get filters data](https://docs.taiga.io/api.html#user-stories-get-filters-data)
/api/v1/userstories/{userStoryId}/upvote
POST
[Add star to a user story](https://docs.taiga.io/api.html#user-stories-upvote)
/api/v1/userstories/{userStoryId}/downvote
POST
[Remove star from user story](https://docs.taiga.io/api.html#user-stories-downvote)
/api/v1/userstories/{userStoryId}/voters
GET
[Get user story voters](https://docs.taiga.io/api.html#user-stories-voters)
/api/v1/userstories/{userStoryId}/watch
POST
[Watch a user story](https://docs.taiga.io/api.html#user-stories-watch)
/api/v1/userstories/{userStoryId}/unwatch
POST
[Unwatch a user story](https://docs.taiga.io/api.html#user-stories-unwatch)
/api/v1/userstories/{userStoryId}/watchers
GET
[Get user story watchers](https://docs.taiga.io/api.html#user-stories-watchers)
/api/v1/userstories/attachments
GET
[List user story attachments](https://docs.taiga.io/api.html#user-stories-list-attachments)
/api/v1/userstories/attachments
POST
[Create user story attachments](https://docs.taiga.io/api.html#user-stories-create-attachment)
/api/v1/userstories/attachments/{userStoryAttachmentId}
GET
[Get user story attachments](https://docs.taiga.io/api.html#user-stories-get-attachment)
/api/v1/userstories/attachments/{userStoryAttachmentId}
PUT
[Modify user story attachments](https://docs.taiga.io/api.html#user-stories-edit-attachment)
/api/v1/userstories/attachments/{userStoryAttachmentId}
PATCH
[Modify partially a user story attachments](https://docs.taiga.io/api.html#user-stories-edit-attachment)
/api/v1/userstories/attachments/{userStoryAttachmentId}
DELETE
[Delete a user story attachments](https://docs.taiga.io/api.html#user-stories-delete-attachment)

### 2.17. User story status

**URL**
**Method**
**Functionality**
/api/v1/userstory-statuses
GET
[List user story status](https://docs.taiga.io/api.html#user-story-statuses-list)
/api/v1/userstory-statuses
POST
[Create user story status](https://docs.taiga.io/api.html#user-story-statuses-create)
/api/v1/userstory-statuses/{userStoryStatusId}
GET
[Get user story status](https://docs.taiga.io/api.html#user-story-statuses-get)
/api/v1/userstory-statuses/{userStoryStatusId}
PUT
[Modify user story status](https://docs.taiga.io/api.html#user-story-statuses-edit)
/api/v1/userstory-statuses/{userStoryStatusId}
PATCH
[Modify partially a user story status](https://docs.taiga.io/api.html#user-story-statuses-edit)
/api/v1/userstory-statuses/{userStoryStatusId}
DELETE
[Delete a user story status](https://docs.taiga.io/api.html#user-story-statuses-delete)
/api/v1/userstory-statuses/bulk_update_order
POST
[Update user story statuses order in bulk mode](https://docs.taiga.io/api.html#user-story-statuses-bulk-update-order)

### 2.18. Points

**URL**
**Method**
**Functionality**
/api/v1/points
GET
[List points](https://docs.taiga.io/api.html#points-list)
/api/v1/points
POST
[Create point](https://docs.taiga.io/api.html#points-create)
/api/v1/points/{pointId}
GET
[Get point](https://docs.taiga.io/api.html#points-get)
/api/v1/points/{pointId}
PUT
[Modify point](https://docs.taiga.io/api.html#points-edit)
/api/v1/points/{pointId}
PATCH
[Modify partially a point](https://docs.taiga.io/api.html#points-edit)
/api/v1/points/{pointId}
DELETE
[Delete a point](https://docs.taiga.io/api.html#points-delete)
/api/v1/points/bulk_update_order
POST
[Update points order in bulk mode](https://docs.taiga.io/api.html#points-bulk-update-order)

### 2.19. User story custom attribute

**URL**
**Method**
**Functionality**
/api/v1/userstory-custom-attributes
GET
[List user story custom attributes](https://docs.taiga.io/api.html#user-story-custom-attributes-list)
/api/v1/userstory-custom-attributes
POST
[Create user story custom attribute](https://docs.taiga.io/api.html#user-story-custom-attributes-create)
/api/v1/userstory-custom-attributes/{userStoryCustomAttributeId}
GET
[Get user story custom attribute](https://docs.taiga.io/api.html#user-story-custom-attributes-get)
/api/v1/userstory-custom-attributes/{userStoryCustomAttributeId}
PUT
[Modify user story custom attribute](https://docs.taiga.io/api.html#user-story-custom-attributes-edit)
/api/v1/userstory-custom-attributes/{userStoryCustomAttributeId}
PATCH
[Modify partially a user story custom attribute](https://docs.taiga.io/api.html#user-story-custom-attributes-edit)
/api/v1/userstory-custom-attributes/{userStoryCustomAttributeId}
DELETE
[Delete a user story custom attribute](https://docs.taiga.io/api.html#user-story-custom-attributes-delete)
/api/v1/userstory-custom-attributes/bulk_update_order
POST
[Update user story custom attributes order in bulk mode](https://docs.taiga.io/api.html#user-story-custom-attributes-bulk-update-order)

### 2.20. User story custom attributes values

**URL**
**Method**
**Functionality**
/api/v1/userstories/custom-attributes-values/{userStoryId}
GET
[Get user story custom attributes values](https://docs.taiga.io/api.html#user-story-custom-attributes-values-get)
/api/v1/userstories/custom-attributes-values/{userStoryId}
PUT
[Modify user story custom attributes values](https://docs.taiga.io/api.html#user-story-custom-attributes-values-edit)
/api/v1/userstories/custom-attributes-values/{userStoryId}
PATCH
[Modify partially a user story custom attributes values](https://docs.taiga.io/api.html#user-story-custom-attributes-values-edit)

### 2.21. Tasks

**URL**
**Method**
**Functionality**
/api/v1/tasks
GET
[List tasks](https://docs.taiga.io/api.html#tasks-list)
/api/v1/tasks
POST
[Create task](https://docs.taiga.io/api.html#tasks-create)
/api/v1/tasks/{taskId}
GET
[Get task](https://docs.taiga.io/api.html#tasks-get)
/api/v1/tasks/by_ref?ref={taskRef}&amp;project={projectId}
GET
[Get task](https://docs.taiga.io/api.html#tasks-get-by-ref)
/api/v1/tasks/{taskId}
PUT
[Modify task](https://docs.taiga.io/api.html#tasks-edit)
/api/v1/tasks/{taskId}
PATCH
[Modify partially a task](https://docs.taiga.io/api.html#tasks-edit)
/api/v1/tasks/{taskId}
DELETE
[Delete a task](https://docs.taiga.io/api.html#tasks-delete)
/api/v1/tasks/bulk_create
POST
[Create tasks on bulk mode](https://docs.taiga.io/api.html#tasks-bulk-create)
/api/v1/tasks/filters_data?project={projectId}
GET
[Get filters data](https://docs.taiga.io/api.html#tasks-get-filters-data)
/api/v1/tasks/{taskId}/upvote
POST
[Add star to a task](https://docs.taiga.io/api.html#tasks-upvote)
/api/v1/tasks/{taskId}/downvote
POST
[Remove star from task](https://docs.taiga.io/api.html#tasks-downvote)
/api/v1/tasks/{taskId}/voters
GET
[Get task voters](https://docs.taiga.io/api.html#tasks-voters)
/api/v1/tasks/{taskId}/watch
POST
[Watch a task](https://docs.taiga.io/api.html#tasks-watch)
/api/v1/tasks/{taskId}/unwatch
POST
[Unwatch a task](https://docs.taiga.io/api.html#tasks-unwatch)
/api/v1/tasks/{taskId}/watchers
GET
[Get task watchers](https://docs.taiga.io/api.html#tasks-watchers)
/api/v1/tasks/attachments
GET
[List task attachments](https://docs.taiga.io/api.html#tasks-list-attachments)
/api/v1/tasks/attachments
POST
[Create task attachments](https://docs.taiga.io/api.html#tasks-create-attachment)
/api/v1/tasks/attachments/{taskAttachmentId}
GET
[Get task attachments](https://docs.taiga.io/api.html#tasks-get-attachment)
/api/v1/tasks/attachments/{taskAttachmentId}
PUT
[Modify task attachments](https://docs.taiga.io/api.html#tasks-edit-attachment)
/api/v1/tasks/attachments/{taskAttachmentId}
PATCH
[Modify partially a task attachments](https://docs.taiga.io/api.html#tasks-edit-attachment)
/api/v1/tasks/attachments/{taskAttachmentId}
DELETE
[Delete a task attachments](https://docs.taiga.io/api.html#tasks-delete-attachment)

### 2.22. Task status

**URL**
**Method**
**Functionality**
/api/v1/task-statuses
GET
[List task statuses](https://docs.taiga.io/api.html#task-statuses-list)
/api/v1/task-statuses
POST
[Create task status](https://docs.taiga.io/api.html#task-statuses-create)
/api/v1/task-statuses/{taskStatusId}
GET
[Get task status](https://docs.taiga.io/api.html#task-statuses-get)
/api/v1/task-statuses/{taskStatusId}
PUT
[Modify task status](https://docs.taiga.io/api.html#task-statuses-edit)
/api/v1/task-statuses/{taskStatusId}
PATCH
[Modify partially a task status](https://docs.taiga.io/api.html#task-statuses-edit)
/api/v1/task-statuses/{taskStatusId}
DELETE
[Delete a task status](https://docs.taiga.io/api.html#task-statuses-delete)
/api/v1/task-statuses/bulk_update_order
POST
[Update task statuses order in bulk mode](https://docs.taiga.io/api.html#task-statuses-bulk-update-order)

### 2.23. Task custom attribute

**URL**
**Method**
**Functionality**
/api/v1/task-custom-attributes
GET
[List task custom attributes](https://docs.taiga.io/api.html#task-custom-attributes-list)
/api/v1/task-custom-attributes
POST
[Create task custom attribute](https://docs.taiga.io/api.html#task-custom-attributes-create)
/api/v1/task-custom-attributes/{taskCustomAttributeId}
GET
[Get task custom attribute](https://docs.taiga.io/api.html#task-custom-attributes-get)
/api/v1/task-custom-attributes/{taskCustomAttributeId}
PUT
[Modify task custom attribute](https://docs.taiga.io/api.html#task-custom-attributes-edit)
/api/v1/task-custom-attributes/{taskCustomAttributeId}
PATCH
[Modify partially a task custom attribute](https://docs.taiga.io/api.html#task-custom-attributes-edit)
/api/v1/task-custom-attributes/{taskCustomAttributeId}
DELETE
[Delete a task custom attribute](https://docs.taiga.io/api.html#task-custom-attributes-delete)
/api/v1/task-custom-attributes/bulk_update_order
POST
[Update task custom attributes order in bulk mode](https://docs.taiga.io/api.html#task-custom-attributes-bulk-update-order)

### 2.24. Task custom attributes values

**URL**
**Method**
**Functionality**
/api/v1/tasks/custom-attributes-values/{taskId}
GET
[Get task custom attributes values](https://docs.taiga.io/api.html#task-custom-attributes-values-get)
/api/v1/tasks/custom-attributes-values/{taskId}
PUT
[Modify task custom attributes values](https://docs.taiga.io/api.html#task-custom-attributes-values-edit)
/api/v1/tasks/custom-attributes-values/{taskId}
PATCH
[Modify partially a task custom attributes values](https://docs.taiga.io/api.html#task-custom-attributes-values-edit)

### 2.25. Issues

**URL**
**Method**
**Functionality**
/api/v1/issues
GET
[List issues](https://docs.taiga.io/api.html#issues-list)
/api/v1/issues
POST
[Create issue](https://docs.taiga.io/api.html#issues-create)
/api/v1/issues/{issueId}
GET
[Get issue](https://docs.taiga.io/api.html#issues-get)
/api/v1/issues/by_ref?ref={issueRef}&amp;project={projectId}
GET
[Get issue](https://docs.taiga.io/api.html#issues-get-by-ref)
/api/v1/issues/{issueId}
PUT
[Modify issue](https://docs.taiga.io/api.html#issues-edit)
/api/v1/issues/{issueId}
PATCH
[Modify partially an issue](https://docs.taiga.io/api.html#issues-edit)
/api/v1/issues/{issueId}
DELETE
[Delete an issue](https://docs.taiga.io/api.html#issues-delete)
/api/v1/issues/bulk_create
POST
[Create issues un bulk mode](https://docs.taiga.io/api.html#issues-bulk-create)
/api/v1/issues/filters_data?project={projectId}
GET
[Get filters data](https://docs.taiga.io/api.html#issues-get-filters-data)
/api/v1/issues/{issueId}/upvote
POST
[Add a vote to an issue](https://docs.taiga.io/api.html#issues-upvote)
/api/v1/issues/{issueId}/downvote
POST
[Remove your vote to an issue](https://docs.taiga.io/api.html#issues-downvote)
/api/v1/issues/{issueId}/voters
GET
[Get issue voters list](https://docs.taiga.io/api.html#issues-voters)
/api/v1/issues/{issueId}/watch
POST
[Watch an issue](https://docs.taiga.io/api.html#issues-watch)
/api/v1/issues/{issueId}/unwatch
POST
[Unwatch an issue](https://docs.taiga.io/api.html#issues-unwatch)
/api/v1/issues/{issueId}/watchers
GET
[Get issue watchers](https://docs.taiga.io/api.html#issues-watchers)
/api/v1/issues/attachments
GET
[List issue attachments](https://docs.taiga.io/api.html#issues-list-attachments)
/api/v1/issues/attachments
POST
[Create issue attachments](https://docs.taiga.io/api.html#issues-create-attachment)
/api/v1/issues/attachments/{issueAttachmentId}
GET
[Get issue attachments](https://docs.taiga.io/api.html#issues-get-attachment)
/api/v1/issues/attachments/{issueAttachmentId}
PUT
[Modify issue attachments](https://docs.taiga.io/api.html#issues-edit-attachment)
/api/v1/issues/attachments/{issueAttachmentId}
PATCH
[Modify partially an issue attachments](https://docs.taiga.io/api.html#issues-edit-attachment)
/api/v1/issues/attachments/{issueAttachmentId}
DELETE
[Delete an issue attachments](https://docs.taiga.io/api.html#issues-delete-attachment)

### 2.26. Issue status

**URL**
**Method**
**Functionality**
/api/v1/issue-statuses
GET
[List issue statuses](https://docs.taiga.io/api.html#issue-statuses-list)
/api/v1/issue-statuses
POST
[Create issue status](https://docs.taiga.io/api.html#issue-statuses-create)
/api/v1/issue-statuses/{issueStatusId}
GET
[Get issue status](https://docs.taiga.io/api.html#issue-statuses-get)
/api/v1/issue-statuses/{issueStatusId}
PUT
[Modify issue status](https://docs.taiga.io/api.html#issue-statuses-edit)
/api/v1/issue-statuses/{issueStatusId}
PATCH
[Modify partially a issue status](https://docs.taiga.io/api.html#issue-statuses-edit)
/api/v1/issue-statuses/{issueStatusId}
DELETE
[Delete a issue status](https://docs.taiga.io/api.html#issue-statuses-delete)
/api/v1/issue-statuses/bulk_update_order
POST
[Update issue statuses order in bulk mode](https://docs.taiga.io/api.html#issue-statuses-bulk-update-order)

### 2.27. Issue types

**URL**
**Method**
**Functionality**
/api/v1/issue-types
GET
[List issue types](https://docs.taiga.io/api.html#issue-types-list)
/api/v1/issue-types
POST
[Create issue type](https://docs.taiga.io/api.html#issue-types-create)
/api/v1/issue-types/{issueTypeId}
GET
[Get issue type](https://docs.taiga.io/api.html#issue-types-get)
/api/v1/issue-types/{issueTypeId}
PUT
[Modify issue type](https://docs.taiga.io/api.html#issue-types-edit)
/api/v1/issue-types/{issueTypeId}
PATCH
[Modify partially a issue type](https://docs.taiga.io/api.html#issue-types-edit)
/api/v1/issue-types/{issueTypeId}
DELETE
[Delete a issue type](https://docs.taiga.io/api.html#issue-types-delete)
/api/v1/issue-types/bulk_update_order
POST
[Update issue types order in bulk mode](https://docs.taiga.io/api.html#issue-types-bulk-update-order)

### 2.28. Priorities

**URL**
**Method**
**Functionality**
/api/v1/priorities
GET
[List priorities](https://docs.taiga.io/api.html#priorities-list)
/api/v1/priorities
POST
[Create priority](https://docs.taiga.io/api.html#priorities-create)
/api/v1/priorities/{priorityId}
GET
[Get priority](https://docs.taiga.io/api.html#priorities-get)
/api/v1/priorities/{priorityId}
PUT
[Modify priority](https://docs.taiga.io/api.html#priorities-edit)
/api/v1/priorities/{priorityId}
PATCH
[Modify partially a priority](https://docs.taiga.io/api.html#priorities-edit)
/api/v1/priorities/{priorityId}
DELETE
[Delete a priority](https://docs.taiga.io/api.html#priorities-delete)
/api/v1/priorities/bulk_update_order
POST
[Update priorities order in bulk mode](https://docs.taiga.io/api.html#priorities-bulk-update-order)

### 2.29. Severities

**URL**
**Method**
**Functionality**
/api/v1/severities
GET
[List severities](https://docs.taiga.io/api.html#severities-list)
/api/v1/severities
POST
[Create severity](https://docs.taiga.io/api.html#severities-create)
/api/v1/severities/{severityId}
GET
[Get severity](https://docs.taiga.io/api.html#severities-get)
/api/v1/severities/{severityId}
PUT
[Modify severity](https://docs.taiga.io/api.html#severities-edit)
/api/v1/severities/{severityId}
PATCH
[Modify partially a severity](https://docs.taiga.io/api.html#severities-edit)
/api/v1/severities/{severityId}
DELETE
[Delete a severity](https://docs.taiga.io/api.html#severities-delete)
/api/v1/severities/bulk_update_order
POST
[Update severities order in bulk mode](https://docs.taiga.io/api.html#severities-bulk-update-order)

### 2.30. Issue custom attribute

**URL**
**Method**
**Functionality**
/api/v1/issue-custom-attributes
GET
[List issue custom attributes](https://docs.taiga.io/api.html#issue-custom-attributes-list)
/api/v1/issue-custom-attributes
POST
[Create issue custom attribute](https://docs.taiga.io/api.html#issue-custom-attributes-create)
/api/v1/issue-custom-attributes/{issueCustomAttributeId}
GET
[Get issue custom attribute](https://docs.taiga.io/api.html#issue-custom-attributes-get)
/api/v1/issue-custom-attributes/{issueCustomAttributeId}
PUT
[Modify issue custom attribute](https://docs.taiga.io/api.html#issue-custom-attributes-edit)
/api/v1/issue-custom-attributes/{issueCustomAttributeId}
PATCH
[Modify partially a issue custom attribute](https://docs.taiga.io/api.html#issue-custom-attributes-edit)
/api/v1/issue-custom-attributes/{issueCustomAttributeId}
DELETE
[Delete a issue custom attribute](https://docs.taiga.io/api.html#issue-custom-attributes-delete)
/api/v1/issue-custom-attributes/bulk_update_order
POST
[Update issue custom attributes order in bulk mode](https://docs.taiga.io/api.html#issue-custom-attributes-bulk-update-order)

### 2.31. Issue custom attributes values

**URL**
**Method**
**Functionality**
/api/v1/issues/custom-attributes-values/{issueId}
GET
[Get issue custom attributes values](https://docs.taiga.io/api.html#issue-custom-attributes-values-get)
/api/v1/issues/custom-attributes-values/{issueId}
PUT
[Modify issue custom attributes values](https://docs.taiga.io/api.html#issue-custom-attributes-values-edit)
/api/v1/issues/custom-attributes-values/{issueId}
PATCH
[Modify partially a issue custom attributes values](https://docs.taiga.io/api.html#issue-custom-attributes-values-edit)

### 2.32. Wiki pages

**URL**
**Method**
**Functionality**
/api/v1/wiki
GET
[List wiki pages](https://docs.taiga.io/api.html#wiki-list)
/api/v1/wiki
POST
[Create wiki page](https://docs.taiga.io/api.html#wiki-create)
/api/v1/wiki/{wikiId}
GET
[Get wiki page](https://docs.taiga.io/api.html#wiki-get)
/api/v1/wiki/by_slug?slug={wikiPageSlug}&amp;project={projectId}
GET
[Get wiki page](https://docs.taiga.io/api.html#wiki-get-by-slug)
/api/v1/wiki/{wikiPageId}
PUT
[Modify wiki page](https://docs.taiga.io/api.html#wiki-edit)
/api/v1/wiki/{wikiPageId}
PATCH
[Modify partially an wiki page](https://docs.taiga.io/api.html#wiki-edit)
/api/v1/wiki/{wikiPageId}
DELETE
[Delete an wiki page](https://docs.taiga.io/api.html#wiki-delete)
/api/v1/wiki/{wikiPageId}/watch
POST
[Watch a wiki page](https://docs.taiga.io/api.html#wiki-watch)
/api/v1/wiki/{wikiPageId}/unwatch
POST
[Stop watching a wiki page](https://docs.taiga.io/api.html#wiki-unwatch)
/api/v1/wiki/{wikiPageId}/watchers
GET
[Get wiki page watchers](https://docs.taiga.io/api.html#wiki-watchers)
/api/v1/wiki/attachments
GET
[List wiki page attachments](https://docs.taiga.io/api.html#wiki-list-attachments)
/api/v1/wiki/attachments
POST
[Create wiki page attachments](https://docs.taiga.io/api.html#wiki-create-attachment)
/api/v1/wiki/attachments/{wikiPageAttachmentId}
GET
[Get wiki page attachments](https://docs.taiga.io/api.html#wiki-get-attachment)
/api/v1/wiki/attachments/{wikiPageAttachmentId}
PUT
[Modify wiki page attachments](https://docs.taiga.io/api.html#wiki-edit-attachment)
/api/v1/wiki/attachments/{wikiPageAttachmentId}
PATCH
[Modify partially an wiki page attachments](https://docs.taiga.io/api.html#wiki-edit-attachment)
/api/v1/wiki/attachments/{wikiPageAttachmentId}
DELETE
[Delete an wiki page attachments](https://docs.taiga.io/api.html#wiki-delete-attachment)

### 2.33. Wiki links

**URL**
**Method**
**Functionality**
/api/v1/wiki-links
GET
[List wiki links](https://docs.taiga.io/api.html#wikilinks-list)
/api/v1/wiki-links
POST
[Create wiki link](https://docs.taiga.io/api.html#wikilinks-create)
/api/v1/wiki-links/{wikiLinkId}
GET
[Get wiki link](https://docs.taiga.io/api.html#wikilinks-get)
/api/v1/wiki-links/{wikiLinkId}
PUT
[Modify wiki link](https://docs.taiga.io/api.html#wikilinks-edit)
/api/v1/wiki-links/{wikiLinkId}
PATCH
[Modify partially an wiki link](https://docs.taiga.io/api.html#wikilinks-edit)
/api/v1/wiki-links/{wikiLinkId}
DELETE
[Delete an wiki link](https://docs.taiga.io/api.html#wikilinks-delete)

### 2.34. History

**URL**
**Method**
**Functionality**
/api/v1/history/userstory/{usId}
GET
[Get user story history](https://docs.taiga.io/api.html#history-get)
/api/v1/history/userstory/{usId}/commentVersions?id={commentId}
GET
[Get user story comment versions](https://docs.taiga.io/api.html#history-comment-versions)
/api/v1/history/userstory/{usId}/edit_comment?id={commentId}
POST
[Edit user story comment](https://docs.taiga.io/api.html#history-edit-comment)
/api/v1/history/userstory/{usId}/delete_comment?id={commentId}
POST
[Delete user story comment](https://docs.taiga.io/api.html#history-delete-comment)
/api/v1/history/userstory/{usId}/undelete_comment?id={commentId}
POST
[Undelete user story comment](https://docs.taiga.io/api.html#history-undelete-comment)
/api/v1/history/issue/{issueId}
GET
[Get issue history](https://docs.taiga.io/api.html#history-get)
/api/v1/history/issue/{issueId}/commentVersions?id={commentId}
POST
[Get issue comment versions](https://docs.taiga.io/api.html#history-comment-versions)
/api/v1/history/issue/{issueId}/edit_comment?id={commentId}
POST
[Edit issue comment](https://docs.taiga.io/api.html#history-edit-comment)
/api/v1/history/issue/{issueId}/delete_comment?id={commentId}
POST
[Delete issue comment](https://docs.taiga.io/api.html#history-delete-comment)
/api/v1/history/issue/{issueId}/undelete_comment?id={commentId}
POST
[Undelete issue comment](https://docs.taiga.io/api.html#history-undelete-comment)
/api/v1/history/task/&lt;taskId&gt;
GET
[Get task history](https://docs.taiga.io/api.html#history-get)
/api/v1/history/task/{taskId}/commentVersions?id={commentId}
POST
[Get task comment versions](https://docs.taiga.io/api.html#history-comment-versions)
/api/v1/history/task/{taskId}/edit_comment?id={commentId}
POST
[Edit task comment](https://docs.taiga.io/api.html#history-edit-comment)
/api/v1/history/task/{taskId}/delete_comment?id={commentId}
POST
[Delete task comment](https://docs.taiga.io/api.html#history-delete-comment)
/api/v1/history/task/{taskId}/undelete_comment?id={commentId}
POST
[Undelete task comment](https://docs.taiga.io/api.html#history-undelete-comment)
/api/v1/history/wiki/{wikiId}
GET
[Get wiki history](https://docs.taiga.io/api.html#history-get)
/api/v1/history/wiki/{wikiId}/commentVersions?id={commentId}
POST
[Get wiki comment versions](https://docs.taiga.io/api.html#history-comment-versions)
/api/v1/history/wiki/{wikiId}/edit_comment?id={commentId}
POST
[Edit wiki comment](https://docs.taiga.io/api.html#history-edit-comment)
/api/v1/history/wiki/{wikiId}/delete_comment?id={commentId}
POST
[Delete wiki comment](https://docs.taiga.io/api.html#history-delete-comment)
/api/v1/history/wiki/{wikiId}/undelete_comment?id={commentId}
POST
[Undelete wiki comment](https://docs.taiga.io/api.html#history-undelete-comment)

### 2.35. Users

**URL**
**Method**
**Functionality**
/api/v1/users
GET
[List users](https://docs.taiga.io/api.html#users-list)
/api/v1/users/{userId}
GET
[Get user](https://docs.taiga.io/api.html#users-get)
/api/v1/users/me
GET
[Get myself](https://docs.taiga.io/api.html#users-me)
/api/v1/users/{userId}
PUT
[Modify user](https://docs.taiga.io/api.html#users-edit)
/api/v1/users/{userId}
PATCH
[Modify partially a user](https://docs.taiga.io/api.html#users-edit)
/api/v1/users/{userId}/stats
GET
[Get user stats](https://docs.taiga.io/api.html#users-stats)
/api/v1/users/{userId}/watched
GET
[Get user watched content](https://docs.taiga.io/api.html#users-watched)
/api/v1/users/{userId}/liked
GET
[Get user liked content](https://docs.taiga.io/api.html#users-liked)
/api/v1/users/{userId}/voted
GET
[Get user voted content](https://docs.taiga.io/api.html#users-voted)
/api/v1/users/{userId}
DELETE
[Delete a user](https://docs.taiga.io/api.html#users-delete)
/api/v1/users/{userId}/contacts
GET
[Get user contacts](https://docs.taiga.io/api.html#users-get-contacts)
/api/v1/users/cancel
POST
[Cancel user](https://docs.taiga.io/api.html#users-cancel)
/api/v1/users/change_avatar
POST
[Change avatar](https://docs.taiga.io/api.html#users-change-avatar)
/api/v1/users/remove_avatar
POST
[Remove avatar](https://docs.taiga.io/api.html#users-remove-avatar)
/api/v1/users/change_email
POST
[Change email](https://docs.taiga.io/api.html#users-change-email)
/api/v1/users/change_password
POST
[Change password](https://docs.taiga.io/api.html#users-change-password)
/api/v1/users/password_recovery
POST
[Password recovery](https://docs.taiga.io/api.html#users-password-recovery)
/api/v1/users/change_password_from_recovery
POST
[Change password from recovery](https://docs.taiga.io/api.html#users-change-password-from-recovery)

### 2.36. Notify policies

**URL**
**Method**
**Functionality**
/api/v1/notify-policies
GET
[List notify policies](https://docs.taiga.io/api.html#notify-policies-list)
/api/v1/notify-policies/{policyId}
GET
[Get notify policy](https://docs.taiga.io/api.html#notify-policies-get)
/api/v1/notify-policies/{policyId}
PUT
[Modify notify policy](https://docs.taiga.io/api.html#notify-policies-edit)
/api/v1/notify-policies/{policyId}
PATCH
[Modify partially a notify policy](https://docs.taiga.io/api.html#notify-policies-edit)

### 2.37. Contact

**URL**
**Method**
**Functionality**
/api/v1/contact
POST
[Contact project](https://docs.taiga.io/api.html#contact)

### 2.38. Feedback

**URL**
**Method**
**Functionality**
/api/v1/feedback
POST
[Send feedback](https://docs.taiga.io/api.html#feedback-create)

### 2.39. Export/Import

**URL**
**Method**
**Functionality**
/api/v1/exporter/{projectId}
GET
[Export a project dump](https://docs.taiga.io/api.html#export-import-export-dump)
/api/v1/importer/load_dump
POST
[Import a project dump](https://docs.taiga.io/api.html#export-import-import-dump)

### 2.40. Webhooks

**URL**
**Method**
**Functionality**
/api/v1/webhooks
GET
[List webhooks](https://docs.taiga.io/api.html#webhooks-list)
/api/v1/webhooks
POST
[Create webhook](https://docs.taiga.io/api.html#webhooks-create)
/api/v1/webhooks/{webhookId}
GET
[Get webhook](https://docs.taiga.io/api.html#webhooks-get)
/api/v1/webhooks/{webhookId}
PUT
[Modify webhook](https://docs.taiga.io/api.html#webhooks-edit)
/api/v1/webhooks/{webhookId}
PATCH
[Modify partially an webhook](https://docs.taiga.io/api.html#webhooks-edit)
/api/v1/webhooks/{webhookId}
DELETE
[Delete an webhook](https://docs.taiga.io/api.html#webhooks-delete)
/api/v1/webhooks/{webhookId}/test
POST
[Test webhook](https://docs.taiga.io/api.html#webhooks-test)
/api/v1/webhooklogs
GET
[List webhooks logs](https://docs.taiga.io/api.html#webhooks-list)
/api/v1/webhooklogs/{webhookLogId}
GET
[Get webhook log](https://docs.taiga.io/api.html#webhooks-get)
/api/v1/webhooklogs/{webhookLogId}/resend
POST
[Resend webhook log request](https://docs.taiga.io/api.html#webhooklogs-resend)

### 2.41. Timelines

**URL**
**Method**
**Functionality**
/api/v1/timeline/user/{userId}
GET
[List user timeline](https://docs.taiga.io/api.html#timeline-user-list)
/api/v1/timeline/profile/{userId}
GET
[List profile timeline](https://docs.taiga.io/api.html#timeline-profile-list)
/api/v1/timeline/project/{projectId}
GET
[List project timeline](https://docs.taiga.io/api.html#timeline-project-list)

### 2.42. Locales

**URL**
**Method**
**Functionality**
/api/v1/locales
GET
[List locales](https://docs.taiga.io/api.html#locales-list)

### 2.43. Stats

**URL**
**Method**
**Functionality**
/api/v1/stats/discover
GET
[Get discover stats](https://docs.taiga.io/api.html#discover-stats)
/api/v1/stats/system
GET
[Get system stats](https://docs.taiga.io/api.html#system-stats)

### 2.44. Importers

**URL**
**Method**
**Functionality**
/api/v1/importers/trello/auth_url
GET
[Get the authorization url](https://docs.taiga.io/api.html#importers-trello-auth-url)
/api/v1/importers/trello/authorize
POST
[Obtain the authorization token](https://docs.taiga.io/api.html#importers-trello-authorize)
/api/v1/importers/trello/list_projects
POST
[List the Trello boards](https://docs.taiga.io/api.html#importers-trello-list-projects)
/api/v1/importers/trello/list_users
POST
[List the users related to a Trello board](https://docs.taiga.io/api.html#importers-trello-list-users)
/api/v1/importers/trello/import_project
POST
[Import the Trello project](https://docs.taiga.io/api.html#importers-trello-import-project)
/api/v1/importers/github/auth_url
GET
[Get the authorization url](https://docs.taiga.io/api.html#importers-github-auth-url)
/api/v1/importers/github/authorize
POST
[Obtain the authorization token](https://docs.taiga.io/api.html#importers-github-authorize)
/api/v1/importers/github/list_projects
POST
[List the Github boards](https://docs.taiga.io/api.html#importers-github-list-projects)
/api/v1/importers/github/list_users
POST
[List the users related to a Github board](https://docs.taiga.io/api.html#importers-github-list-users)
/api/v1/importers/github/import_project
POST
[Import the Github project](https://docs.taiga.io/api.html#importers-github-import-project)
/api/v1/importers/jira/auth_url
GET
[Get the authorization url](https://docs.taiga.io/api.html#importers-jira-auth-url)
/api/v1/importers/jira/authorize
POST
[Obtain the authorization token](https://docs.taiga.io/api.html#importers-jira-authorize)
/api/v1/importers/jira/list_projects
POST
[List the Jira boards](https://docs.taiga.io/api.html#importers-jira-list-projects)
/api/v1/importers/jira/list_users
POST
[List the users related to a Jira board](https://docs.taiga.io/api.html#importers-jira-list-users)
/api/v1/importers/jira/import_project
POST
[Import the Jira project](https://docs.taiga.io/api.html#importers-jira-import-project)

// @vibe-generated: conforms to taiga-api-interface
import { request } from "undici";
import { Schema } from "effect";
import {
  type HttpClient,
  type HttpClientConfig,
  type HttpResponse,
  type RequestOptions,
  HeaderKey,
  HeaderValue,
  HttpStatus,
  type TaigaApi,
  type TaigaApiFactory,
  type AuthService,
  type TasksService,
  type UserStoriesService,
  type TaskStatusesService,
  type TaskCustomAttributesService,
  type UserStoryCustomAttributesService,
  type UserStoryCustomAttributesValuesService,
  type UserStoryStatusesService,
  type PointsService,
  type AuthCredentials,
  AuthResponse,
  type RefreshRequest,
  RefreshResponse,
  TaskDetail,
  type CreateTaskRequest,
  type UpdateTaskRequest,
  UserStoryDetail,
  type CreateUserStoryRequest,
  type UpdateUserStoryRequest,
  TaskStatus,
  TaskCustomAttribute,
  type CreateTaskCustomAttributeRequest,
  type UpdateTaskCustomAttributeRequest,
  UserStoryCustomAttribute,
  type CreateUserStoryCustomAttributeRequest,
  type UpdateUserStoryCustomAttributeRequest,
  type BulkUpdateUserStoryCustomAttributesRequest,
  UserStoryCustomAttributesValues,
  UserStoryStatus,
  type BulkCreateUserStoriesRequest,
  type BulkUpdateUserStoryOrderRequest,
  type BulkUpdateUserStoryMilestoneRequest,
  type BulkUpdateUserStoryStatusesRequest,
  Point,
  type CreatePointRequest,
  type UpdatePointRequest,
  type BulkUpdatePointsRequest,
  User,
  type ProjectId,
  type TaskId,
  type UserStoryId,
  type StatusId,
  type UserId,
  type CustomAttributeId,
  type PointId,
  type AuthToken,
  type RefreshToken,
} from "@taiga-task-master/taiga-api-interface";

// ============================================================================
// HTTP Client Implementation
// ============================================================================

const buildUrl = (
  baseUrl: string,
  path: string,
  params?: Record<string, unknown>
): string => {
  const url = new URL(path, baseUrl);
  const searchParams = params
    ? Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
        )
        .join("&")
    : "";
  return searchParams ? `${url.toString()}?${searchParams}` : url.toString();
};

const buildHeaders = (
  defaultHeaders?: Record<HeaderKey, HeaderValue>,
  requestHeaders?: Record<HeaderKey, HeaderValue>,
  hasData?: boolean
): Record<string, string> => {
  const base = defaultHeaders
    ? Object.fromEntries(Object.entries(defaultHeaders))
    : {};
  const withRequest = requestHeaders
    ? { ...base, ...Object.fromEntries(Object.entries(requestHeaders)) }
    : base;
  return hasData && !withRequest["Content-Type"]
    ? { ...withRequest, "Content-Type": "application/json" }
    : withRequest;
};

const buildResponseHeaders = (
  headers: Record<string, string | string[] | undefined>
): Record<HeaderKey, HeaderValue> =>
  Object.entries(headers).reduce(
    (acc, [key, value]) =>
      typeof value === "string"
        ? (() => {
            try {
              const validKey = Schema.decodeSync(HeaderKey)(key);
              const validValue = Schema.decodeSync(HeaderValue)(value);
              return { ...acc, [validKey]: validValue };
            } catch {
              // Skip invalid headers
              return acc;
            }
          })()
        : acc,
    {} as Record<HeaderKey, HeaderValue>
  );

const makeRequest = async (
  baseUrl: string,
  defaultHeaders: Record<HeaderKey, HeaderValue> | undefined,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  data?: unknown,
  options?: RequestOptions & { params?: Record<string, unknown> }
): Promise<HttpResponse<unknown>> => {
  const url = buildUrl(baseUrl, path, options?.params);
  const headers = buildHeaders(defaultHeaders, options?.headers, !!data);
  const requestOptions: Parameters<typeof request>[1] = {
    method: method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    headers,
    signal: options?.signal,
    ...(data ? { body: JSON.stringify(data) } : {}),
  };

  const response = await request(url, requestOptions);
  const responseHeaders = buildResponseHeaders(response.headers);
  const status = Schema.decodeSync(HttpStatus)(response.statusCode);

  const responseData = response.headers["content-type"]?.includes(
    "application/json"
  )
    ? await response.body.json()
    : await response.body.text();

  return response.statusCode >= 400
    ? Promise.reject(new Error(`HTTP ${response.statusCode}`))
    : {
        data: responseData,
        status,
        headers: responseHeaders,
      };
};

const createHttpClient = (config: HttpClientConfig): HttpClient => ({
  get: (
    path: string,
    options?: RequestOptions & { params?: Record<string, unknown> }
  ) =>
    makeRequest(
      config.baseUrl,
      config.defaultHeaders,
      "GET",
      path,
      undefined,
      options
    ),

  post: (path: string, data?: unknown, options?: RequestOptions) =>
    makeRequest(
      config.baseUrl,
      config.defaultHeaders,
      "POST",
      path,
      data,
      options
    ),

  put: (path: string, data?: unknown, options?: RequestOptions) =>
    makeRequest(
      config.baseUrl,
      config.defaultHeaders,
      "PUT",
      path,
      data,
      options
    ),

  patch: (path: string, data?: unknown, options?: RequestOptions) =>
    makeRequest(
      config.baseUrl,
      config.defaultHeaders,
      "PATCH",
      path,
      data,
      options
    ),

  delete: (
    path: string,
    options?: RequestOptions
  ): Promise<HttpResponse<void>> =>
    makeRequest(
      config.baseUrl,
      config.defaultHeaders,
      "DELETE",
      path,
      undefined,
      options
    ).then((res) => ({ ...res, data: undefined })),
});

// ============================================================================
// Authenticated HTTP Client with Auto-Refresh
// ============================================================================

const createAuthenticatedHttpClient = (
  baseClient: HttpClient,
  getAuthToken: () => AuthToken | null,
  refreshAuth: () => Promise<void>
): HttpClient => {
  const withAuthAndRetry = async (
    operation: () => Promise<HttpResponse<unknown>>
  ): Promise<HttpResponse<unknown>> => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error && error.message.includes("HTTP 401")) {
        // eslint-disable-next-line functional/no-expression-statements
        console.log(
          `🔄 [${new Date().toISOString()}] Token expired (401), attempting refresh...`
        );
        // eslint-disable-next-line functional/no-expression-statements
        await refreshAuth();
        // eslint-disable-next-line functional/no-expression-statements
        console.log(
          `✅ [${new Date().toISOString()}] Token refresh completed, retrying original request`
        );
        return await operation();
      }
      throw error;
    }
  };

  const addAuthHeader = (options?: RequestOptions): RequestOptions => {
    const authToken = getAuthToken();
    if (!authToken) {
      return options || {};
    }

    const authHeader = {
      Authorization: Schema.decodeSync(HeaderValue)(`Bearer ${authToken}`),
    };
    return {
      ...options,
      headers: {
        ...options?.headers,
        ...authHeader,
      },
    };
  };

  return {
    get: (
      path: string,
      options?: RequestOptions & { params?: Record<string, unknown> }
    ) => withAuthAndRetry(() => baseClient.get(path, addAuthHeader(options))),

    post: (path: string, data?: unknown, options?: RequestOptions) =>
      withAuthAndRetry(() =>
        baseClient.post(path, data, addAuthHeader(options))
      ),

    put: (path: string, data?: unknown, options?: RequestOptions) =>
      withAuthAndRetry(() =>
        baseClient.put(path, data, addAuthHeader(options))
      ),

    patch: (path: string, data?: unknown, options?: RequestOptions) =>
      withAuthAndRetry(() =>
        baseClient.patch(path, data, addAuthHeader(options))
      ),

    delete: (
      path: string,
      options?: RequestOptions
    ): Promise<HttpResponse<void>> =>
      withAuthAndRetry(() =>
        baseClient.delete(path, addAuthHeader(options))
      ) as Promise<HttpResponse<void>>,
  };
};

// ============================================================================
// Auth Service Implementation
// ============================================================================

const createAuthService = (
  client: HttpClient,
  credentials?: AuthCredentials
): [AuthService, () => Promise<void>, () => AuthToken | null] => {
  const state = {
    currentRefreshToken: null as RefreshToken | null,
    currentAuthToken: null as AuthToken | null,
    storedCredentials: credentials || (null as AuthCredentials | null),
    ongoingRefresh: null as Promise<void> | null,
  };

  const api = {
    login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
      const response = await client.post("/api/v1/auth", credentials);
      const authResponse = Schema.decodeUnknownSync(AuthResponse)(
        response.data
      );

      // Store credentials for future login retry
      // eslint-disable-next-line functional/immutable-data
      state.storedCredentials = credentials;

      return {
        ...authResponse,
        refresh: (() => {
          // eslint-disable-next-line functional/immutable-data
          state.currentRefreshToken = authResponse.refresh;
          return authResponse.refresh;
        })(),
        auth_token: (() => {
          // eslint-disable-next-line functional/immutable-data
          state.currentAuthToken = authResponse.auth_token;
          return authResponse.auth_token;
        })(),
      };
    },

    refresh: async (refreshToken: RefreshRequest): Promise<RefreshResponse> => {
      // eslint-disable-next-line functional/no-expression-statements
      console.log(`🔄 [${new Date().toISOString()}] Refreshing auth token...`);
      const response = await client.post("/api/v1/auth/refresh", refreshToken);
      const refreshResponse = Schema.decodeUnknownSync(RefreshResponse)(
        response.data
      );
      // eslint-disable-next-line functional/no-expression-statements
      console.log(
        `✅ [${new Date().toISOString()}] Token refresh successful, new token received`
      );
      return {
        ...refreshResponse,
        refresh: (() => {
          // eslint-disable-next-line functional/immutable-data
          state.currentRefreshToken = refreshResponse.refresh;
          return refreshResponse.refresh;
        })(),
        auth_token: (() => {
          // eslint-disable-next-line functional/immutable-data
          state.currentAuthToken = refreshResponse.auth_token;
          return refreshResponse.auth_token;
        })(),
      };
    },
  };

  const refreshWithStoredToken = async (): Promise<void> => {
    // If a refresh is already in progress, wait for it to complete
    if (state.ongoingRefresh) {
      // eslint-disable-next-line functional/no-expression-statements
      console.log(
        `⏳ [${new Date().toISOString()}] Auth refresh already in progress, waiting...`
      );
      return await state.ongoingRefresh;
    }

    // Start a new refresh operation and cache the promise
    // eslint-disable-next-line functional/immutable-data
    state.ongoingRefresh = (async (): Promise<void> => {
      try {
        if (!state.currentRefreshToken) {
          // eslint-disable-next-line functional/no-expression-statements
          console.log(
            `🔄 [${new Date().toISOString()}] No refresh token available, attempting login with stored credentials...`
          );
          if (!state.storedCredentials) {
            throw new Error("No refresh token or stored credentials available");
          }
          // eslint-disable-next-line functional/no-expression-statements
          await api.login(state.storedCredentials);
          return;
        }

        try {
          // eslint-disable-next-line functional/no-expression-statements
          await api.refresh({ refresh: state.currentRefreshToken });
        } catch (error) {
          // eslint-disable-next-line functional/no-expression-statements
          console.log(
            `❌ [${new Date().toISOString()}] Token refresh failed, attempting login with stored credentials...`,
            error
          );
          if (!state.storedCredentials) {
            throw new Error(
              "Token refresh failed and no stored credentials available"
            );
          }
          // eslint-disable-next-line functional/no-expression-statements
          await api.login(state.storedCredentials);
        }
      } finally {
        // Clear the ongoing refresh promise when operation completes
        // eslint-disable-next-line functional/immutable-data
        state.ongoingRefresh = null;
      }
    })();

    return await state.ongoingRefresh;
  };

  const getAuthToken = (): AuthToken | null => state.currentAuthToken;

  return [api, refreshWithStoredToken, getAuthToken];
};

// ============================================================================
// Tasks Service Implementation
// ============================================================================

const createTasksService = (client: HttpClient): TasksService => ({
  list: async (filters?: {
    project?: ProjectId;
    status?: StatusId;
    user_story?: UserStoryId;
  }): Promise<readonly TaskDetail[]> => {
    const response = await client.get("/api/v1/tasks", { params: filters });
    return Schema.decodeUnknownSync(Schema.Array(TaskDetail))(response.data);
  },

  create: async (task: CreateTaskRequest): Promise<TaskDetail> => {
    const response = await client.post("/api/v1/tasks", task);
    return Schema.decodeUnknownSync(TaskDetail)(response.data);
  },

  get: async (id: TaskId): Promise<TaskDetail> => {
    const response = await client.get(`/api/v1/tasks/${id}`);
    return Schema.decodeUnknownSync(TaskDetail)(response.data);
  },

  update: async (id: TaskId, task: UpdateTaskRequest): Promise<TaskDetail> => {
    const response = await client.patch(`/api/v1/tasks/${id}`, task);
    return Schema.decodeUnknownSync(TaskDetail)(response.data);
  },

  delete: async (id: TaskId): Promise<void> => {
    await client.delete(`/api/v1/tasks/${id}`);
  },
});

// ============================================================================
// User Stories Service Implementation
// ============================================================================

const createUserStoriesService = (client: HttpClient): UserStoriesService => ({
  list: async (filters?: {
    project?: ProjectId;
    status?: StatusId;
    milestone?: number;
    milestone__isnull?: boolean;
    status__is_archived?: boolean;
    tags?: string;
    watchers?: UserId;
    assigned_to?: UserId;
    epic?: number;
    role?: number;
    status__is_closed?: boolean;
    exclude_status?: StatusId;
    exclude_tags?: string;
    exclude_assigned_to?: UserId;
    exclude_role?: number;
    exclude_epic?: number;
  }): Promise<readonly UserStoryDetail[]> => {
    const response = await client.get("/api/v1/userstories", {
      params: filters,
    });
    return Schema.decodeUnknownSync(Schema.Array(UserStoryDetail))(
      response.data
    );
  },

  create: async (
    userStory: CreateUserStoryRequest
  ): Promise<UserStoryDetail> => {
    const response = await client.post("/api/v1/userstories", userStory);
    return Schema.decodeUnknownSync(UserStoryDetail)(response.data);
  },

  get: async (id: UserStoryId): Promise<UserStoryDetail> => {
    const response = await client.get(`/api/v1/userstories/${id}`);
    return Schema.decodeUnknownSync(UserStoryDetail)(response.data);
  },

  getByRef: async (
    ref: number,
    filters: {
      project?: ProjectId;
      project__slug?: string;
    }
  ): Promise<UserStoryDetail> => {
    const response = await client.get(`/api/v1/userstories/by_ref`, {
      params: { ref, ...filters },
    });
    return Schema.decodeUnknownSync(UserStoryDetail)(response.data);
  },

  update: async (
    id: UserStoryId,
    userStory: UpdateUserStoryRequest
  ): Promise<UserStoryDetail> => {
    const response = await client.patch(`/api/v1/userstories/${id}`, userStory);
    return Schema.decodeUnknownSync(UserStoryDetail)(response.data);
  },

  delete: async (id: UserStoryId): Promise<void> => {
    await client.delete(`/api/v1/userstories/${id}`);
  },

  bulkCreate: async (
    request: BulkCreateUserStoriesRequest
  ): Promise<readonly UserStoryDetail[]> => {
    const response = await client.post(
      "/api/v1/userstories/bulk_create",
      request
    );
    return Schema.decodeUnknownSync(Schema.Array(UserStoryDetail))(
      response.data
    );
  },

  bulkUpdateBacklogOrder: async (
    request: BulkUpdateUserStoryOrderRequest
  ): Promise<readonly UserStoryDetail[]> => {
    const response = await client.post(
      "/api/v1/userstories/bulk_update_backlog_order",
      request
    );
    return Schema.decodeUnknownSync(Schema.Array(UserStoryDetail))(
      response.data
    );
  },

  bulkUpdateKanbanOrder: async (
    request: BulkUpdateUserStoryOrderRequest
  ): Promise<readonly UserStoryDetail[]> => {
    const response = await client.post(
      "/api/v1/userstories/bulk_update_kanban_order",
      request
    );
    return Schema.decodeUnknownSync(Schema.Array(UserStoryDetail))(
      response.data
    );
  },

  bulkUpdateSprintOrder: async (
    request: BulkUpdateUserStoryOrderRequest
  ): Promise<readonly UserStoryDetail[]> => {
    const response = await client.post(
      "/api/v1/userstories/bulk_update_sprint_order",
      request
    );
    return Schema.decodeUnknownSync(Schema.Array(UserStoryDetail))(
      response.data
    );
  },

  bulkUpdateMilestone: async (
    request: BulkUpdateUserStoryMilestoneRequest
  ): Promise<void> => {
    await client.post("/api/v1/userstories/bulk_update_milestone", request);
  },

  vote: async (id: UserStoryId): Promise<void> => {
    await client.post(`/api/v1/userstories/${id}/upvote`);
  },

  removeVote: async (id: UserStoryId): Promise<void> => {
    await client.post(`/api/v1/userstories/${id}/downvote`);
  },

  getVoters: async (id: UserStoryId): Promise<readonly User[]> => {
    const response = await client.get(`/api/v1/userstories/${id}/voters`);
    return Schema.decodeUnknownSync(Schema.Array(User))(response.data);
  },

  watch: async (id: UserStoryId): Promise<void> => {
    await client.post(`/api/v1/userstories/${id}/watch`);
  },

  stopWatching: async (id: UserStoryId): Promise<void> => {
    await client.post(`/api/v1/userstories/${id}/unwatch`);
  },

  getWatchers: async (id: UserStoryId): Promise<readonly User[]> => {
    const response = await client.get(`/api/v1/userstories/${id}/watchers`);
    return Schema.decodeUnknownSync(Schema.Array(User))(response.data);
  },
});

// ============================================================================
// Task Statuses Service Implementation
// ============================================================================

const createTaskStatusesService = (
  client: HttpClient
): TaskStatusesService => ({
  list: async (filters?: {
    project?: ProjectId;
  }): Promise<readonly TaskStatus[]> => {
    const response = await client.get("/api/v1/task-statuses", {
      params: filters,
    });
    return Schema.decodeUnknownSync(Schema.Array(TaskStatus))(response.data);
  },

  create: async (status: Omit<TaskStatus, "id">): Promise<TaskStatus> => {
    const response = await client.post("/api/v1/task-statuses", status);
    return Schema.decodeUnknownSync(TaskStatus)(response.data);
  },

  get: async (id: StatusId): Promise<TaskStatus> => {
    const response = await client.get(`/api/v1/task-statuses/${id}`);
    return Schema.decodeUnknownSync(TaskStatus)(response.data);
  },

  update: async (
    id: StatusId,
    status: Partial<Omit<TaskStatus, "id">>
  ): Promise<TaskStatus> => {
    const response = await client.patch(`/api/v1/task-statuses/${id}`, status);
    return Schema.decodeUnknownSync(TaskStatus)(response.data);
  },

  delete: async (id: StatusId): Promise<void> => {
    await client.delete(`/api/v1/task-statuses/${id}`);
  },
});

// ============================================================================
// Task Custom Attributes Service Implementation
// ============================================================================

const createTaskCustomAttributesService = (
  client: HttpClient
): TaskCustomAttributesService => ({
  list: async (filters?: {
    project?: ProjectId;
  }): Promise<readonly TaskCustomAttribute[]> => {
    const response = await client.get("/api/v1/task-custom-attributes", {
      params: filters,
    });
    return Schema.decodeUnknownSync(Schema.Array(TaskCustomAttribute))(
      response.data
    );
  },

  create: async (
    attribute: CreateTaskCustomAttributeRequest
  ): Promise<TaskCustomAttribute> => {
    const response = await client.post(
      "/api/v1/task-custom-attributes",
      attribute
    );
    return Schema.decodeUnknownSync(TaskCustomAttribute)(response.data);
  },

  get: async (id: CustomAttributeId): Promise<TaskCustomAttribute> => {
    const response = await client.get(`/api/v1/task-custom-attributes/${id}`);
    return Schema.decodeUnknownSync(TaskCustomAttribute)(response.data);
  },

  update: async (
    id: CustomAttributeId,
    attribute: UpdateTaskCustomAttributeRequest
  ): Promise<TaskCustomAttribute> => {
    const response = await client.patch(
      `/api/v1/task-custom-attributes/${id}`,
      attribute
    );
    return Schema.decodeUnknownSync(TaskCustomAttribute)(response.data);
  },

  delete: async (id: CustomAttributeId): Promise<void> => {
    await client.delete(`/api/v1/task-custom-attributes/${id}`);
  },
});

// ============================================================================
// User Story Statuses Service Implementation
// ============================================================================

const createUserStoryStatusesService = (
  client: HttpClient
): UserStoryStatusesService => ({
  list: async (filters?: {
    project?: ProjectId;
  }): Promise<readonly UserStoryStatus[]> => {
    const response = await client.get("/api/v1/userstory-statuses", {
      params: filters,
    });
    return Schema.decodeUnknownSync(Schema.Array(UserStoryStatus))(
      response.data
    );
  },

  create: async (
    status: Omit<UserStoryStatus, "id">
  ): Promise<UserStoryStatus> => {
    const response = await client.post("/api/v1/userstory-statuses", status);
    return Schema.decodeUnknownSync(UserStoryStatus)(response.data);
  },

  get: async (id: StatusId): Promise<UserStoryStatus> => {
    const response = await client.get(`/api/v1/userstory-statuses/${id}`);
    return Schema.decodeUnknownSync(UserStoryStatus)(response.data);
  },

  update: async (
    id: StatusId,
    status: Partial<Omit<UserStoryStatus, "id">>
  ): Promise<UserStoryStatus> => {
    const response = await client.patch(
      `/api/v1/userstory-statuses/${id}`,
      status
    );
    return Schema.decodeUnknownSync(UserStoryStatus)(response.data);
  },

  delete: async (id: StatusId): Promise<void> => {
    await client.delete(`/api/v1/userstory-statuses/${id}`);
  },

  bulkUpdateOrder: async (
    request: BulkUpdateUserStoryStatusesRequest
  ): Promise<void> => {
    await client.post("/api/v1/userstory-statuses/bulk_update_order", request);
  },
});

// ============================================================================
// Points Service Implementation
// ============================================================================

const createPointsService = (client: HttpClient): PointsService => ({
  list: async (filters?: {
    project?: ProjectId;
  }): Promise<readonly Point[]> => {
    const response = await client.get("/api/v1/points", {
      params: filters,
    });
    return Schema.decodeUnknownSync(Schema.Array(Point))(response.data);
  },

  create: async (point: CreatePointRequest): Promise<Point> => {
    const response = await client.post("/api/v1/points", point);
    return Schema.decodeUnknownSync(Point)(response.data);
  },

  get: async (id: PointId): Promise<Point> => {
    const response = await client.get(`/api/v1/points/${id}`);
    return Schema.decodeUnknownSync(Point)(response.data);
  },

  update: async (id: PointId, point: UpdatePointRequest): Promise<Point> => {
    const response = await client.patch(`/api/v1/points/${id}`, point);
    return Schema.decodeUnknownSync(Point)(response.data);
  },

  delete: async (id: PointId): Promise<void> => {
    await client.delete(`/api/v1/points/${id}`);
  },

  bulkUpdateOrder: async (request: BulkUpdatePointsRequest): Promise<void> => {
    await client.post("/api/v1/points/bulk_update_order", request);
  },
});

// ============================================================================
// User Story Custom Attributes Service Implementation
// ============================================================================

const createUserStoryCustomAttributesService = (
  client: HttpClient
): UserStoryCustomAttributesService => ({
  list: async (filters?: {
    project?: ProjectId;
  }): Promise<readonly UserStoryCustomAttribute[]> => {
    const response = await client.get("/api/v1/userstory-custom-attributes", {
      params: filters,
    });
    return Schema.decodeUnknownSync(Schema.Array(UserStoryCustomAttribute))(
      response.data
    );
  },

  create: async (
    attribute: CreateUserStoryCustomAttributeRequest
  ): Promise<UserStoryCustomAttribute> => {
    const response = await client.post(
      "/api/v1/userstory-custom-attributes",
      attribute
    );
    return Schema.decodeUnknownSync(UserStoryCustomAttribute)(response.data);
  },

  get: async (id: CustomAttributeId): Promise<UserStoryCustomAttribute> => {
    const response = await client.get(
      `/api/v1/userstory-custom-attributes/${id}`
    );
    return Schema.decodeUnknownSync(UserStoryCustomAttribute)(response.data);
  },

  update: async (
    id: CustomAttributeId,
    attribute: UpdateUserStoryCustomAttributeRequest
  ): Promise<UserStoryCustomAttribute> => {
    const response = await client.patch(
      `/api/v1/userstory-custom-attributes/${id}`,
      attribute
    );
    return Schema.decodeUnknownSync(UserStoryCustomAttribute)(response.data);
  },

  delete: async (id: CustomAttributeId): Promise<void> => {
    await client.delete(`/api/v1/userstory-custom-attributes/${id}`);
  },

  bulkUpdateOrder: async (
    request: BulkUpdateUserStoryCustomAttributesRequest
  ): Promise<void> => {
    await client.post(
      "/api/v1/userstory-custom-attributes/bulk_update_order",
      request
    );
  },
});

// ============================================================================
// User Story Custom Attributes Values Service Implementation
// ============================================================================

const createUserStoryCustomAttributesValuesService = (
  client: HttpClient
): UserStoryCustomAttributesValuesService => ({
  get: async (id: CustomAttributeId): Promise<UserStoryCustomAttribute> => {
    const response = await client.get(
      `/api/v1/userstory-custom-attributes-values/${id}`
    );
    return Schema.decodeUnknownSync(UserStoryCustomAttribute)(response.data);
  },

  update: async (
    id: UserStoryId,
    values: UserStoryCustomAttributesValues
  ): Promise<UserStoryCustomAttributesValues> => {
    const response = await client.patch(
      `/api/v1/userstory-custom-attributes-values/${id}`,
      values
    );
    return Schema.decodeUnknownSync(UserStoryCustomAttributesValues)(
      response.data
    );
  },
});

// ============================================================================
// Main Taiga API Factory
// ============================================================================

const createTaigaApi = (config: HttpClientConfig): TaigaApi => {
  const baseClient = createHttpClient(config);
  const [authService, refreshAuth, getAuthToken] = createAuthService(
    baseClient,
    config.credentials
  );
  const authenticatedClient = createAuthenticatedHttpClient(
    baseClient,
    getAuthToken,
    refreshAuth
  );

  return {
    auth: authService,
    tasks: createTasksService(authenticatedClient),
    userStories: createUserStoriesService(authenticatedClient),
    taskStatuses: createTaskStatusesService(authenticatedClient),
    userStoryStatuses: createUserStoryStatusesService(authenticatedClient),
    points: createPointsService(authenticatedClient),
    taskCustomAttributes:
      createTaskCustomAttributesService(authenticatedClient),
    userStoryCustomAttributes:
      createUserStoryCustomAttributesService(authenticatedClient),
    userStoryCustomAttributesValues:
      createUserStoryCustomAttributesValuesService(authenticatedClient),
  };
};

export const taigaApiFactory: TaigaApiFactory = {
  create: createTaigaApi,
};

export * from "@taiga-task-master/taiga-api-interface";
export * from "./webhook-handler.js";

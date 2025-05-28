// @vibe-generated: conforms to taiga-api-interface
import { request } from "undici";
import {
  type HttpClient,
  type HttpClientConfig,
  type HttpResponse,
  type RequestOptions,
  type HeaderKey,
  type HeaderValue,
  type HttpStatus,
  type TaigaApi,
  type TaigaApiFactory,
  type AuthService,
  type TasksService,
  type UserStoriesService,
  type TaskStatusesService,
  type TaskCustomAttributesService,
  type AuthCredentials,
  type AuthResponse,
  type RefreshRequest,
  type RefreshResponse,
  type TaskDetail,
  type CreateTaskRequest,
  type UpdateTaskRequest,
  type UserStoryDetail,
  type CreateUserStoryRequest,
  type UpdateUserStoryRequest,
  type TaskStatus,
  type TaskCustomAttribute,
  type CreateTaskCustomAttributeRequest,
  type UpdateTaskCustomAttributeRequest,
  type ProjectId,
  type TaskId,
  type UserStoryId,
  type StatusId,
  type CustomAttributeId,
  type AuthToken,
  type RefreshToken
} from '@taiga-task-master/taiga-api-interface';

// ============================================================================
// HTTP Client Implementation
// ============================================================================

const buildUrl = (baseUrl: string, path: string, params?: Record<string, unknown>): string => {
  const url = new URL(path, baseUrl);
  const searchParams = params 
    ? Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&')
    : '';
  return searchParams ? `${url.toString()}?${searchParams}` : url.toString();
};

const buildHeaders = (
  defaultHeaders?: Record<HeaderKey, HeaderValue>, 
  requestHeaders?: Record<HeaderKey, HeaderValue>,
  hasData?: boolean
): Record<string, string> => {
  const base = defaultHeaders ? Object.fromEntries(Object.entries(defaultHeaders)) : {};
  const withRequest = requestHeaders ? { ...base, ...Object.fromEntries(Object.entries(requestHeaders)) } : base;
  return hasData && !withRequest["Content-Type"] 
    ? { ...withRequest, "Content-Type": "application/json" }
    : withRequest;
};

const buildResponseHeaders = (headers: Record<string, string | string[] | undefined>): Record<HeaderKey, HeaderValue> => 
  Object.entries(headers).reduce((acc, [key, value]) => 
    typeof value === "string" 
      ? { ...acc, [key as HeaderKey]: value as HeaderValue }
      : acc, 
    {} as Record<HeaderKey, HeaderValue>
  );

const makeRequest = async <T>(
  baseUrl: string,
  defaultHeaders: Record<HeaderKey, HeaderValue> | undefined,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  data?: unknown,
  options?: RequestOptions & { params?: Record<string, unknown> }
): Promise<HttpResponse<T>> => {
  const url = buildUrl(baseUrl, path, options?.params);
  const headers = buildHeaders(defaultHeaders, options?.headers, !!data);
  
  const requestOptions: Parameters<typeof request>[1] = {
    method: method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    headers,
    signal: options?.signal,
    ...(data ? { body: JSON.stringify(data) } : {})
  };

  const response = await request(url, requestOptions);
  const responseHeaders = buildResponseHeaders(response.headers);
  const status = response.statusCode as HttpStatus;
  
  const responseData: T = response.headers["content-type"]?.includes("application/json")
    ? await response.body.json() as T
    : await response.body.text() as T;

  return response.statusCode >= 400
    ? Promise.reject(new Error(`HTTP ${response.statusCode}`))
    : {
        data: responseData,
        status,
        headers: responseHeaders
      };
};

const createHttpClient = (config: HttpClientConfig): HttpClient => ({
  get: <T>(path: string, options?: RequestOptions & { params?: Record<string, unknown> }) =>
    makeRequest<T>(config.baseUrl, config.defaultHeaders, "GET", path, undefined, options),
  
  post: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    makeRequest<T>(config.baseUrl, config.defaultHeaders, "POST", path, data, options),
  
  put: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    makeRequest<T>(config.baseUrl, config.defaultHeaders, "PUT", path, data, options),
  
  patch: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    makeRequest<T>(config.baseUrl, config.defaultHeaders, "PATCH", path, data, options),
  
  delete: (path: string, options?: RequestOptions) =>
    makeRequest<void>(config.baseUrl, config.defaultHeaders, "DELETE", path, undefined, options)
});

// ============================================================================
// Authenticated HTTP Client with Auto-Refresh
// ============================================================================

const createAuthenticatedHttpClient = (
  baseClient: HttpClient, 
  getAuthToken: () => AuthToken | null,
  refreshAuth: () => Promise<void>
): HttpClient => {
  const withAuthAndRetry = async <T>(
    operation: () => Promise<HttpResponse<T>>
  ): Promise<HttpResponse<T>> => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error && error.message.includes("HTTP 401")) {
        await refreshAuth();
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
    
    const authHeader = { "Authorization": `Bearer ${authToken}` as HeaderValue };
    return {
      ...options,
      headers: {
        ...options?.headers,
        ...authHeader as Record<HeaderKey, HeaderValue>
      }
    };
  };

  return {
    get: <T>(path: string, options?: RequestOptions & { params?: Record<string, unknown> }) =>
      withAuthAndRetry(() => baseClient.get<T>(path, addAuthHeader(options))),
    
    post: <T>(path: string, data?: unknown, options?: RequestOptions) =>
      withAuthAndRetry(() => baseClient.post<T>(path, data, addAuthHeader(options))),
    
    put: <T>(path: string, data?: unknown, options?: RequestOptions) =>
      withAuthAndRetry(() => baseClient.put<T>(path, data, addAuthHeader(options))),
    
    patch: <T>(path: string, data?: unknown, options?: RequestOptions) =>
      withAuthAndRetry(() => baseClient.patch<T>(path, data, addAuthHeader(options))),
    
    delete: (path: string, options?: RequestOptions) =>
      withAuthAndRetry(() => baseClient.delete(path, addAuthHeader(options)))
  };
};

// ============================================================================
// Auth Service Implementation
// ============================================================================

const createAuthService = (client: HttpClient): [AuthService, () => Promise<void>, () => AuthToken | null] => {
  const state = {
    currentRefreshToken: null as RefreshToken | null,
    currentAuthToken: null as AuthToken | null
  };
  
  const api = {
    login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
      const response = await client.post<AuthResponse>("/api/v1/auth", credentials);
      return {
        ...response.data,
        refresh: (() => { state.currentRefreshToken = response.data.refresh; return response.data.refresh; })(),
        auth_token: (() => { state.currentAuthToken = response.data.auth_token; return response.data.auth_token; })()
      };
    },

    refresh: async (refreshToken: RefreshRequest): Promise<RefreshResponse> => {
      const response = await client.post<RefreshResponse>("/api/v1/auth/refresh", refreshToken);
      return {
        ...response.data,
        refresh: (() => { state.currentRefreshToken = response.data.refresh; return response.data.refresh; })(),
        auth_token: (() => { state.currentAuthToken = response.data.auth_token; return response.data.auth_token; })()
      };
    }
  };
  
  const refreshWithStoredToken = async (): Promise<void> => {
    if (!state.currentRefreshToken) {
      throw new Error("No refresh token available");
    }
    return api.refresh({ refresh: state.currentRefreshToken }).then(() => void 0);
  };
  
  const getAuthToken = (): AuthToken | null => state.currentAuthToken;
  
  return [api, refreshWithStoredToken, getAuthToken];
};

// ============================================================================
// Tasks Service Implementation
// ============================================================================

const createTasksService = (client: HttpClient): TasksService => ({
  list: async (filters?: { project?: ProjectId; status?: StatusId; user_story?: UserStoryId }): Promise<TaskDetail[]> => {
    const response = await client.get<TaskDetail[]>("/api/v1/tasks", { params: filters });
    return response.data;
  },

  create: async (task: CreateTaskRequest): Promise<TaskDetail> => {
    const response = await client.post<TaskDetail>("/api/v1/tasks", task);
    return response.data;
  },

  get: async (id: TaskId): Promise<TaskDetail> => {
    const response = await client.get<TaskDetail>(`/api/v1/tasks/${id}`);
    return response.data;
  },

  update: async (id: TaskId, task: UpdateTaskRequest): Promise<TaskDetail> => {
    const response = await client.patch<TaskDetail>(`/api/v1/tasks/${id}`, task);
    return response.data;
  },

  delete: async (id: TaskId): Promise<void> => {
    await client.delete(`/api/v1/tasks/${id}`);
  }
});

// ============================================================================
// User Stories Service Implementation
// ============================================================================

const createUserStoriesService = (client: HttpClient): UserStoriesService => ({
  list: async (filters?: { project?: ProjectId; status?: StatusId; milestone?: number }): Promise<UserStoryDetail[]> => {
    const response = await client.get<UserStoryDetail[]>("/api/v1/userstories", { params: filters });
    return response.data;
  },

  create: async (userStory: CreateUserStoryRequest): Promise<UserStoryDetail> => {
    const response = await client.post<UserStoryDetail>("/api/v1/userstories", userStory);
    return response.data;
  },

  get: async (id: UserStoryId): Promise<UserStoryDetail> => {
    const response = await client.get<UserStoryDetail>(`/api/v1/userstories/${id}`);
    return response.data;
  },

  update: async (id: UserStoryId, userStory: UpdateUserStoryRequest): Promise<UserStoryDetail> => {
    const response = await client.patch<UserStoryDetail>(`/api/v1/userstories/${id}`, userStory);
    return response.data;
  },

  delete: async (id: UserStoryId): Promise<void> => {
    await client.delete(`/api/v1/userstories/${id}`);
  }
});

// ============================================================================
// Task Statuses Service Implementation
// ============================================================================

const createTaskStatusesService = (client: HttpClient): TaskStatusesService => ({
  list: async (filters?: { project?: ProjectId }): Promise<TaskStatus[]> => {
    const response = await client.get<TaskStatus[]>("/api/v1/task-statuses", { params: filters });
    return response.data;
  },

  create: async (status: Omit<TaskStatus, 'id'>): Promise<TaskStatus> => {
    const response = await client.post<TaskStatus>("/api/v1/task-statuses", status);
    return response.data;
  },

  get: async (id: StatusId): Promise<TaskStatus> => {
    const response = await client.get<TaskStatus>(`/api/v1/task-statuses/${id}`);
    return response.data;
  },

  update: async (id: StatusId, status: Partial<Omit<TaskStatus, 'id'>>): Promise<TaskStatus> => {
    const response = await client.patch<TaskStatus>(`/api/v1/task-statuses/${id}`, status);
    return response.data;
  },

  delete: async (id: StatusId): Promise<void> => {
    await client.delete(`/api/v1/task-statuses/${id}`);
  }
});

// ============================================================================
// Task Custom Attributes Service Implementation
// ============================================================================

const createTaskCustomAttributesService = (client: HttpClient): TaskCustomAttributesService => ({
  list: async (filters?: { project?: ProjectId }): Promise<TaskCustomAttribute[]> => {
    const response = await client.get<TaskCustomAttribute[]>("/api/v1/task-custom-attributes", { params: filters });
    return response.data;
  },

  create: async (attribute: CreateTaskCustomAttributeRequest): Promise<TaskCustomAttribute> => {
    const response = await client.post<TaskCustomAttribute>("/api/v1/task-custom-attributes", attribute);
    return response.data;
  },

  get: async (id: CustomAttributeId): Promise<TaskCustomAttribute> => {
    const response = await client.get<TaskCustomAttribute>(`/api/v1/task-custom-attributes/${id}`);
    return response.data;
  },

  update: async (id: CustomAttributeId, attribute: UpdateTaskCustomAttributeRequest): Promise<TaskCustomAttribute> => {
    const response = await client.patch<TaskCustomAttribute>(`/api/v1/task-custom-attributes/${id}`, attribute);
    return response.data;
  },

  delete: async (id: CustomAttributeId): Promise<void> => {
    await client.delete(`/api/v1/task-custom-attributes/${id}`);
  }
});

// ============================================================================
// Main Taiga API Factory
// ============================================================================

const createTaigaApi = (config: HttpClientConfig): TaigaApi => {
  const baseClient = createHttpClient(config);
  const [authService, refreshAuth, getAuthToken] = createAuthService(baseClient);
  const authenticatedClient = createAuthenticatedHttpClient(baseClient, getAuthToken, refreshAuth);
  
  return {
    auth: authService,
    tasks: createTasksService(authenticatedClient),
    userStories: createUserStoriesService(authenticatedClient),
    taskStatuses: createTaskStatusesService(authenticatedClient),
    taskCustomAttributes: createTaskCustomAttributesService(authenticatedClient)
  };
};

export const taigaApiFactory: TaigaApiFactory = {
  create: createTaigaApi
};

export * from "@taiga-task-master/taiga-api-interface";
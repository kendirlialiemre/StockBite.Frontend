import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';

const ACCESS_TOKEN_KEY = 'sb_access_token';
const REFRESH_TOKEN_KEY = 'sb_refresh_token';

function getBaseUrl(): string {
  const viteEnv = (import.meta as { env?: { VITE_API_URL?: string } }).env;
  return viteEnv?.VITE_API_URL ?? 'http://localhost:5000/api';
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

export function setAuthTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearAuthTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Attach access token to every request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: AxiosError) => void;
}> = [];

function processQueue(error: AxiosError | null, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

// On 401, attempt refresh once then retry
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err: AxiosError) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      clearAuthTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const response = await axios.post<{
        accessToken: string;
        refreshToken: string;
      }>(`${getBaseUrl()}/auth/refresh`, { refreshToken });

      const { accessToken, refreshToken: newRefresh } = response.data;
      setAuthTokens(accessToken, newRefresh);
      processQueue(null, accessToken);

      if (originalRequest.headers) {
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      clearAuthTokens();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

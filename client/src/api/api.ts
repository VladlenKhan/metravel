// export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5066";
// export const AUTH_STORAGE_KEY = "metravel_auth";

// type RequestOptions = {
//   method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
//   headers?: Record<string, string>;
//   body?: unknown;
// };

// export type AuthResponse = {
//   token: string;
//   fullName: string;
//   email: string;
//   role: "Admin" | "Operator" | "Client";
// };

// async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
//   const headers: Record<string, string> = {
//     "Content-Type": "application/json",
//     ...(options.headers || {}),
//   };

//   const response = await fetch(`${API_BASE_URL}${path}`, {
//     method: options.method || "GET",
//     headers,
//     body: options.body ? JSON.stringify(options.body) : undefined,
//   });

//   if (!response.ok) {
//     let message = "Request failed";

//     try {
//       const data = (await response.json()) as { message?: string; title?: string };
//       message = data?.message || data?.title || message;
//     } catch {
//       // Keep fallback message for non-json errors.
//     }

//     throw new Error(message);
//   }

//   if (response.status === 204) {
//     return null as T;
//   }

//   return (await response.json()) as T;
// }

// export function saveAuthSession(authResponse: AuthResponse): void {
//   localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authResponse));
// }

// export function getAuthSession(): AuthResponse | null {
//   try {
//     const raw = localStorage.getItem(AUTH_STORAGE_KEY);
//     return raw ? (JSON.parse(raw) as AuthResponse) : null;
//   } catch {
//     return null;
//   }
// }

// export function clearAuthSession(): void {
//   localStorage.removeItem(AUTH_STORAGE_KEY);
// }

// export function register(payload: {
//   fullName: string;
//   email: string;
//   phoneNumber: string;
//   passportNumber: string;
//   password: string;
// }): Promise<AuthResponse> {
//   return request<AuthResponse>("/api/Auth/register", {
//     method: "POST",
//     body: payload,
//   });
// }

// export function login(payload: {
//   email: string;
//   password: string;
// }): Promise<AuthResponse> {
//   return request<AuthResponse>("/api/Auth/login", {
//     method: "POST",
//     body: payload,
//   });
// }

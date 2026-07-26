const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ??
  "http://localhost:4100/api";

export interface LoginResponse {
  accessToken: string;
  user: OdinUser;
}

export interface OdinUser {
  id: string;
  username: string;
  email: string;
  displayNameEn: string;
  displayNameAr: string;
  role: string;
  permissions: string[];
  mustChangePassword: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const bodyText = await response.text();
  let body: unknown = null;

  if (bodyText) {
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = bodyText;
    }
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return body as T;
}
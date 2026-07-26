export type AppEnvironment = "development" | "test" | "production";

function readEnvironment(): AppEnvironment {
  if (import.meta.env.MODE === "production") return "production";
  if (import.meta.env.MODE === "test") return "test";
  return "development";
}

export const appConfig = Object.freeze({
  productName: "JCWS",
  productTitle: "Joint Command & Wargaming System",
  environment: readEnvironment(),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4100/api",
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4100",
  defaultRoute: "/dashboard",
  mapRoute: "/workspace",
});

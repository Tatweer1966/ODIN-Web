import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest, type LoginResponse, type OdinUser } from "./api";

interface AuthContextValue {
  user: OdinUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = "odin-access-token";
const LEGACY_TOKEN_KEY = "odin_access_token";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredToken(): string | null {
  const current = localStorage.getItem(TOKEN_KEY);
  if (current) return current;

  const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacy) {
    localStorage.setItem(TOKEN_KEY, legacy);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
  return legacy;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<OdinUser | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem("odin_user");
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const loadCurrentUser = useCallback(
    async (activeToken: string) => {
      try {
        const currentUser = await apiRequest<OdinUser>(
          "/auth/me",
          { method: "GET" },
          activeToken,
        );
        setUser(currentUser);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    },
    [logout],
  );

  useEffect(() => {
    if (token) {
      void loadCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token, loadCurrentUser]);

  async function login(username: string, password: string) {
    const response = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem("odin_user");
    setToken(response.accessToken);
    setUser(response.user);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [user, token, loading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}

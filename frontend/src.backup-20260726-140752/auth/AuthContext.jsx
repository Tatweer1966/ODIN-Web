import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "odin-access-token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const loadCurrentUser = useCallback(async (activeToken) => {
    try {
      const { data } = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      setUser(data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      void loadCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token, loadCurrentUser]);

  const login = async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(() => ({
    token,
    user,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(token && user)
  }), [token, user, loading, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
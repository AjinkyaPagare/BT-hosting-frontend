import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CurrentUser, fetchCurrentUser } from "@/services/user";
import { logoutUser } from "@/services/auth";
import { tokenStorage, ACCESS_TOKEN_KEY } from "@/services/api";

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.get(ACCESS_TOKEN_KEY);
    if (!token) {
      setUser(null);
      return;
    }

    const data = await fetchCurrentUser();
    setUser(data);
  }, []);

  const initialize = useCallback(async () => {
    try {
      await refreshUser();
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      // ignore API errors, proceed with local cleanup
    } finally {
      tokenStorage.clearAuth();
      setUser(null);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      refreshUser,
      logout,
    }),
    [user, isLoading, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };

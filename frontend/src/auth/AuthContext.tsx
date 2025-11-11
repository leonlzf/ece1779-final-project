import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loginApi, meApi } from "./api";
import api from "../lib/axios";

type User = { id: string; email: string; name?: string; role?: string };

type AuthCtx = {
  user?: User;
  token?: string;
  loading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | undefined>(
    localStorage.getItem("token") || undefined
  );
  const [user, setUser] = useState<User | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await meApi();
        setUser(data);
      } catch {
        localStorage.removeItem("token");
        setToken(undefined);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const login = async (data: { email: string; password: string }) => {
    const res = await loginApi(data);
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete (api.defaults.headers as any).Authorization;
    setToken(undefined);
    setUser(undefined);
    window.location.replace("/login");
  };

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Ctx);
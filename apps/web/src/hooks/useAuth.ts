import { useEffect } from "react";
import { authApi } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    authApi
      .me()
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, [setUser]);

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return { user, setUser, logout };
}

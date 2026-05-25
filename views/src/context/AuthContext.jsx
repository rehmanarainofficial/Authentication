import { useState, useEffect } from "react";
import { API_URL, axiosClient, setAccessToken } from "../api/axiosClient";
import { AuthContext } from "./useAuth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionEventsVersion, setSessionEventsVersion] = useState(0);

  const loadCurrentUser = async () => {
    const response = await axiosClient.get("/user/get-me");
    setUser(response.data.data.user);
    return response.data.data.user;
  };

  useEffect(() => {
    let isCurrent = true;

    const checkAuth = async () => {
      try {
        const currentUser = await loadCurrentUser();
        if (!isCurrent) return;
        setUser(currentUser);
      } catch {
        if (!isCurrent) return;
        setAccessToken(null);
        setUser(null);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };
    
    checkAuth();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    const events = new EventSource(`${API_URL}/user/session-events`, {
      withCredentials: true,
    });

    const handleSessionRevoked = () => {
      setAccessToken(null);
      setUser(null);
      events.close();
    };

    const handleSessionsChanged = () => {
      setSessionEventsVersion((version) => version + 1);
    };

    events.addEventListener("session-revoked", handleSessionRevoked);
    events.addEventListener("sessions-changed", handleSessionsChanged);

    return () => {
      events.removeEventListener("session-revoked", handleSessionRevoked);
      events.removeEventListener("sessions-changed", handleSessionsChanged);
      events.close();
    };
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await axiosClient.post("/auth/login", { email, password });
      const { accessToken } = response.data.data;
      setAccessToken(accessToken);
      await loadCurrentUser();
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || "Login failed";
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axiosClient.post("/auth/register", { name, email, password });
      const { accessToken } = response.data.data;
      setAccessToken(accessToken);
      await loadCurrentUser();
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || "Registration failed";
    }
  };

  const logout = async () => {
    try {
      await axiosClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const logoutAll = async () => {
    try {
      await axiosClient.post("/auth/logout-all");
      setUser(null);
      setAccessToken(null);
    } catch (error) {
      console.error("Logout all error", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, sessionEventsVersion, login, register, logout, logoutAll }}
    >
      {children}
    </AuthContext.Provider>
  );
};

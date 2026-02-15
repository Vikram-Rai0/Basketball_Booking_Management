import { createContext, useState, useEffect } from "react";
import api from "../../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login function
  const login = async (email, password) => {
    await api.post("/auth/login", { email, password });
    await fetchUser(); // update context after login
  };

  // Register function
  const register = async (full_name, email, phone, password) => {
    await api.post(
      "/auth/register",
      { full_name, email, phone, password },
      { withCredentials: true },
    );
    await fetchUser(); // update context after registration
  };
  const fetchUser = async () => {
    try {
      const res = await api.get("auth/me");
      setUser(res.data.user || null);
    } catch (err) {
      setUser(null);
      console.error("Failed to fetch user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);
  // Logout function
  const logout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isAuthenticated = () => !!user;
  const isAdmin = () => user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

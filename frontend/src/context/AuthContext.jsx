import { createContext, useContext, useState } from "react";

export const AuthContext = createContext(null);

export const useAuthContext = () => useContext(AuthContext);

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(getStoredUser);

  const updateAuthUser = (user) => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
    setAuthUser(user);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    updateAuthUser(null);
  };

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser: updateAuthUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


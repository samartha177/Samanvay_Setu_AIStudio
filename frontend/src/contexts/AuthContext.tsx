import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "CITIZEN" | "OFFICER";

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  loginTime: string;
}

export interface DemoAccount {
  id: string;
  password: "demo123";
  name: string;
  role: UserRole;
  title: string;
}

export const DEMO_ACCOUNTS: Record<UserRole, DemoAccount> = {
  CITIZEN: {
    id: "CIT-1001",
    password: "demo123",
    name: "Aarav Sharma",
    role: "CITIZEN",
    title: "Registered Citizen",
  },
  OFFICER: {
    id: "OFF-1001",
    password: "demo123",
    name: "Officer S. Ramanathan",
    role: "OFFICER",
    title: "Operations & Oversight Officer",
  },
};

export const AUTH_STORAGE_KEY = "samanvaysetu_auth_session";

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface AuthContextType {
  user: UserSession | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (selectedRole: UserRole, idInput: string, passwordInput: string) => LoginResult;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.role === "CITIZEN" || parsed.role === "OFFICER")) {
            return parsed as UserSession;
          }
        }
      }
    } catch {
      // Ignore local storage parsing failures
    }
    return null;
  });

  const login = (selectedRole: UserRole, idInput: string, passwordInput: string): LoginResult => {
    const trimmedId = idInput.trim().toUpperCase();
    const trimmedPass = passwordInput.trim();

    // Check if credentials belong to the opposite role
    const oppositeRole: UserRole = selectedRole === "CITIZEN" ? "OFFICER" : "CITIZEN";
    const oppositeAccount = DEMO_ACCOUNTS[oppositeRole];

    if (trimmedId === oppositeAccount.id.toUpperCase()) {
      return {
        success: false,
        error: "These credentials do not belong to the selected role.",
      };
    }

    const expectedAccount = DEMO_ACCOUNTS[selectedRole];
    if (trimmedId !== expectedAccount.id.toUpperCase() || trimmedPass !== expectedAccount.password) {
      return {
        success: false,
        error: "Invalid demo credentials.",
      };
    }

    const session: UserSession = {
      id: expectedAccount.id,
      name: expectedAccount.name,
      role: selectedRole,
      title: expectedAccount.title,
      loginTime: new Date().toISOString(),
    };

    setUser(session);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage write issues
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore storage remove issues
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: Boolean(user),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import { createContext, useContext } from "react";

/**
 * AuthContext - User authentication and session management
 * Uses real Supabase Auth (see AuthContext.jsx)
 */

export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

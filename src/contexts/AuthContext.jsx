import { useState, useEffect, useRef } from "react";
import { AuthContext } from "./auth.js";
import { supabase } from "../lib/supabase.js";
import { toast } from "react-toastify";

/**
 * AuthProvider — Real Supabase authentication.
 * Uses onAuthStateChange as the single source of truth
 * to avoid double-trigger / infinite loop issues.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Single source of truth: onAuthStateChange handles everything
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return;

        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock on token refresh
          setTimeout(async () => {
            if (!isMounted.current) return;
            await fetchProfile(session.user);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch the profile row created by the handle_new_user trigger
  async function fetchProfile(authUser) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (!isMounted.current) return;

    if (data) {
      setUser({
        id: authUser.id,
        email: authUser.email,
        role: data.role,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        newsletter: data.newsletter,
        avatarUrl: data.avatar_url,
      });
    } else {
      // Fallback if profile row hasn't been created yet
      setUser({
        id: authUser.id,
        email: authUser.email,
        role: authUser.user_metadata?.role || "customer",
      });
    }
    setLoading(false);
  }

  // Login with email + password
  const login = async (email, password) => {
    const toastId = toast.loading("Please wait...");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Login error:", error.message);
      toast.update(toastId, {
        render: () => (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: '0.95rem', marginBottom: '2px' }}>Error</strong>
            <span>Invalid email or password</span>
          </div>
        ),
        type: "error", isLoading: false, autoClose: 3000
      });
      return { success: false, error: error.message };
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, first_name')
      .eq('id', data.user.id)
      .single();
    
    const username = profile?.first_name || data.user?.user_metadata?.first_name || email.split('@')[0];
    toast.update(toastId, {
      render: () => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong style={{ fontSize: '0.95rem', marginBottom: '2px' }}>Success</strong>
          <span>Welcome back, {username}!</span>
        </div>
      ),
      type: "success", isLoading: false, autoClose: 3000
    });
    
    return { success: true, role: profile?.role || 'customer', firstName: profile?.first_name };
  };

  // Register a new account
  const register = async (email, password, role = "customer", firstName, lastName, phone, newsletter = false) => {
    const toastId = toast.loading("Please wait...");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, phone, role, newsletter },
      },
    });
    if (error) {
      console.error("Register error:", error.message);
      toast.update(toastId, {
        render: () => (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: '0.95rem', marginBottom: '2px' }}>Error</strong>
            <span>Registration failed. Please try again</span>
          </div>
        ),
        type: "error", isLoading: false, autoClose: 3000
      });
      return { success: false, error: error.message };
    }
    toast.update(toastId, {
      render: () => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong style={{ fontSize: '0.95rem', marginBottom: '2px' }}>Success</strong>
          <span>Account created successfully!</span>
        </div>
      ),
      type: "success", isLoading: false, autoClose: 3000
    });
    return { success: true };
  };

  // Logout - Smooth and consistent
  const logout = async () => {
    try {
      // Sign out immediately (no delay)
      await supabase.auth.signOut();
      // Show toast notification (non-blocking)
      toast.success("You have been logged out");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Please try again.");
    }
    // Note: onAuthStateChange listener will handle setUser(null) automatically
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

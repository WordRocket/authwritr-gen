
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  isAuthenticated: boolean;
  apiKey: string | null;
  user: User | null;
  login: (apiKey: string) => void;
  logout: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedApiKey = localStorage.getItem("openrouter_api_key");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          toast.error("Authentication error");
          return;
        }

        if (session) {
          setUser(session.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setIsAuthenticated(!!session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success("Signup successful! Please check your email for verification.");
    } catch (error: any) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success("Successfully logged in");
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const login = (apiKey: string) => {
    if (apiKey.trim().length < 10) {
      toast.error("Please enter a valid API key");
      return;
    }
    
    localStorage.setItem("openrouter_api_key", apiKey);
    setApiKey(apiKey);
    toast.success("API key updated successfully");
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        toast.error("Error signing out");
        return;
      }

      localStorage.removeItem("openrouter_api_key");
      setApiKey(null);
      setUser(null);
      setIsAuthenticated(false);
      toast.info("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");
    }
  };

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, apiKey, user, login, logout, signIn, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

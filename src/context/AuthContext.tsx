
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

interface AuthContextType {
  isAuthenticated: boolean;
  apiKey: string | null;
  login: (apiKey: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem("openrouter_api_key");
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (apiKey: string) => {
    // In a real app, we would validate the API key here
    if (apiKey.trim().length < 10) {
      toast.error("Please enter a valid API key");
      return;
    }
    
    localStorage.setItem("openrouter_api_key", apiKey);
    setApiKey(apiKey);
    setIsAuthenticated(true);
    toast.success("Successfully logged in");
  };

  const logout = () => {
    localStorage.removeItem("openrouter_api_key");
    setApiKey(null);
    setIsAuthenticated(false);
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, apiKey, login, logout }}>
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

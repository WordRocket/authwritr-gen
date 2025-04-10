
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Define subscription interface to match our database structure
interface Subscription {
  id: string;
  user_id: string;
  status: string;
  subscription_type: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  apiKey: string | null;
  user: User | null;
  supabase: typeof supabase;
  isPremium: boolean;
  login: (apiKey: string) => void;
  logout: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  setApiKey: (apiKey: string) => void;
  startCheckoutSession: (priceType: 'monthly' | 'lifetime') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem("openrouter_api_key");
    if (storedApiKey) {
      setApiKeyState(storedApiKey);
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setIsAuthenticated(!!session);
        
        // Check premium status when auth state changes
        if (session?.user) {
          checkPremium(session.user);
        } else {
          setIsPremium(false);
        }
      }
    );

    // THEN check for existing session
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
          checkPremium(session.user);
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check premium status function
  const checkPremium = async (currentUser: User) => {
    if (!currentUser) return;
    
    try {
      console.log(`Checking premium status for user ${currentUser.id}`);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', currentUser.id)
        .maybeSingle();
          
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking premium status:", error);
        return;
      }
      
      // Use type assertion only after error check
      setIsPremium(data ? data.status === 'active' : false);
      console.log("Premium status:", data ? data.status : "no subscription found");
    } catch (error) {
      console.error("Premium check error:", error);
    }
  };

  // Add placeholder for the startCheckoutSession function
  const startCheckoutSession = async (priceType: 'monthly' | 'lifetime') => {
    try {
      if (!user) {
        toast.error("Please login to subscribe");
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceType }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error starting checkout:", error);
      toast.error("Failed to start checkout process");
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            email_confirmed: true
          }
        }
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      // If we have a user, sign them in right away
      if (data.user) {
        try {
          // Sign in immediately after signup
          const { error: signInError } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
          });
          
          if (signInError) {
            console.error("Auto sign-in error:", signInError);
            toast.error("Account created, but couldn't automatically log you in. Please sign in manually.");
            return;
          }
          
          toast.success("Account created and logged in successfully!");
        } catch (signInError: any) {
          console.error("Auto sign-in error:", signInError);
          toast.error("Account created, but couldn't automatically log you in. Please sign in manually.");
        }
      } else {
        toast.success("Signup successful! Please check your email for verification.");
      }
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
    setApiKeyState(apiKey);
    toast.success("API key updated successfully");
  };

  // Function to set the API key directly
  const setApiKey = (apiKey: string) => {
    if (apiKey.trim().length < 10) {
      toast.error("Please enter a valid API key");
      return;
    }
    
    localStorage.setItem("openrouter_api_key", apiKey);
    setApiKeyState(apiKey);
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
      setApiKeyState(null);
      setUser(null);
      setIsAuthenticated(false);
      toast.info("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-background">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      apiKey, 
      user,
      supabase,
      isPremium,
      login, 
      logout, 
      signIn, 
      signUp,
      setApiKey,
      startCheckoutSession
    }}>
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

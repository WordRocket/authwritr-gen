
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Define interfaces for our database tables
interface UserUsage {
  id: string;
  user_id: string;
  date: string;
  words_used: number;
  last_reset: string | null;
}

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  subscription_type: string;
  created_at: string | null;
  updated_at: string | null;
  expires_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

interface PremiumContextType {
  isPremium: boolean;
  usageLimit: number;
  usedWords: number;
  remainingWords: number;
  isLoading: boolean;
  startCheckoutSession: (priceType: 'monthly' | 'lifetime') => Promise<void>;
  trackWordUsage: (wordCount: number) => Promise<boolean>;
  resetUsage: () => Promise<void>;
}

interface PremiumProviderProps {
  children: ReactNode;
}

// Create the context
const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ children }) => {
  const { user, supabase } = useAuth();
  const { toast } = useToast();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [usageLimit, setUsageLimit] = useState<number>(5000);
  const [usedWords, setUsedWords] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const remainingWords = Math.max(0, usageLimit - usedWords);

  useEffect(() => {
    if (user) {
      checkPremiumStatus();
      loadUserUsage();
    } else {
      setIsPremium(false);
      setUsedWords(0);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const checkDateForReset = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_usage')
          .select('last_reset')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error) {
          console.error("Error checking date for reset:", error);
          return;
        }
        
        if (data && data.last_reset) {
          const lastResetDate = new Date(data.last_reset);
          const today = new Date();
          
          if (lastResetDate.getDate() !== today.getDate() || 
              lastResetDate.getMonth() !== today.getMonth() || 
              lastResetDate.getFullYear() !== today.getFullYear()) {
            resetUsage();
          }
        }
      } catch (error) {
        console.error("Error checking date for reset:", error);
      }
    };
    
    checkDateForReset();
  }, [user]);

  const checkPremiumStatus = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, subscription_type, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking premium status:", error);
        setIsPremium(false);
        setIsLoading(false);
        return;
      }
      
      if (data) {
        const isPremiumActive = 
          data.subscription_type === 'lifetime' || 
          (data.status === 'active' && (!data.expires_at || new Date(data.expires_at) > new Date()));
        
        setIsPremium(isPremiumActive);
        console.log("Premium status checked:", isPremiumActive ? "Premium" : "Free");
      } else {
        setIsPremium(false);
        console.log("No subscription found, setting to free tier");
      }
    } catch (error) {
      console.error("Error checking premium status:", error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserUsage = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log("Loading usage for date:", today);
      
      const { data, error } = await supabase
        .from('user_usage')
        .select('words_used')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error loading user usage:", error);
        setIsLoading(false);
        return;
      }
      
      if (data) {
        console.log("Loaded user usage:", data.words_used, "words used today");
        setUsedWords(data.words_used);
      } else {
        console.log("No usage data found for today, creating new entry");
        // Create a new usage entry for today
        const newUsage = {
          user_id: user.id,
          date: today,
          words_used: 0,
          last_reset: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('user_usage')
          .insert(newUsage);
          
        if (insertError) {
          console.error("Error creating user usage:", insertError);
        } else {
          console.log("Created new usage entry for today");
        }
        setUsedWords(0);
      }
    } catch (error) {
      console.error("Error loading user usage:", error);
      toast({
        title: "Error",
        description: "Failed to load usage data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const trackWordUsage = async (wordCount: number): Promise<boolean> => {
    if (!user) return false;
    
    console.log(`Tracking ${wordCount} words for user ${user.id}`);
    
    if (isPremium) {
      console.log("User is premium, unlimited usage");
      return true;
    }
    
    const newTotal = usedWords + wordCount;
    console.log(`Current usage: ${usedWords}, New total would be: ${newTotal}, Limit: ${usageLimit}`);
    
    if (newTotal > usageLimit) {
      console.log("Daily limit would be exceeded");
      toast({
        title: "Daily Limit Reached",
        description: `You've reached your free daily limit of ${usageLimit} words. Upgrade to Premium for unlimited usage.`,
        variant: "destructive"
      });
      return false;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`Updating usage for ${today}`);
      
      const { data, error } = await supabase
        .from('user_usage')
        .select('words_used')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error tracking word usage:", error);
        return false;
      }
      
      if (data) {
        console.log(`Found existing usage: ${data.words_used} words`);
        const dbNewTotal = data.words_used + wordCount;
        
        const { error: updateError } = await supabase
          .from('user_usage')
          .update({ words_used: dbNewTotal })
          .eq('user_id', user.id)
          .eq('date', today);
          
        if (updateError) {
          console.error("Error updating word usage:", updateError);
          return false;
        }
        
        console.log(`Updated usage to ${dbNewTotal} words`);
        setUsedWords(dbNewTotal);
      } else {
        console.log("No usage entry found, creating new one");
        const newUsage = {
          user_id: user.id,
          date: today,
          words_used: wordCount,
          last_reset: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('user_usage')
          .insert(newUsage);
          
        if (insertError) {
          console.error("Error inserting word usage:", insertError);
          return false;
        }
        
        console.log(`Created new usage entry with ${wordCount} words`);
        setUsedWords(wordCount);
      }
      
      toast({
        title: "Usage Updated",
        description: `${wordCount} words added to today's usage.`,
      });
      
      return true;
    } catch (error) {
      console.error("Error tracking word usage:", error);
      toast({
        title: "Error",
        description: "Failed to update usage data.",
        variant: "destructive"
      });
      return false;
    }
  };

  const resetUsage = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const newUsage = {
        user_id: user.id,
        date: today,
        words_used: 0,
        last_reset: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_usage')
        .upsert(newUsage);
        
      if (error) {
        console.error("Error resetting usage:", error);
        return;
      }
      
      setUsedWords(0);
    } catch (error) {
      console.error("Error resetting usage:", error);
    }
  };

  const startCheckoutSession = async (priceType: 'monthly' | 'lifetime') => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to subscribe.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
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
      toast({
        title: "Checkout Error",
        description: "Failed to start checkout process.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isPremium,
    usageLimit,
    usedWords,
    remainingWords,
    isLoading,
    startCheckoutSession,
    trackWordUsage,
    resetUsage
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
};


import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Define interfaces for our database tables
interface UserUsage {
  id: string;
  user_id: string;
  date: string;
  content_count: number;
  last_reset: string | null;
  words_used: number;
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
  contentLimit: number;
  contentCount: number;
  remainingContent: number;
  isLoading: boolean;
  startCheckoutSession: (priceType: 'monthly' | 'lifetime') => Promise<void>;
  trackContentUsage: () => Promise<boolean>;
  resetUsage: () => Promise<void>;
}

interface PremiumProviderProps {
  children: ReactNode;
}

// Create the context
const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ children }) => {
  const { user, supabase } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [contentLimit, setContentLimit] = useState<number>(5);
  const [contentCount, setContentCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const remainingContent = Math.max(0, contentLimit - contentCount);

  useEffect(() => {
    if (user) {
      console.log("Premium context user detected, checking premium status and loading usage...");
      checkPremiumStatus();
      loadUserUsage();
    } else {
      console.log("No user detected in Premium context, resetting to default values");
      setIsPremium(false);
      setContentCount(0);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const checkDateForReset = async () => {
      if (!user) return;
      
      try {
        console.log("Checking date for potential usage reset");
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
          
          console.log("Last reset date:", lastResetDate);
          console.log("Today's date:", today);
          
          if (lastResetDate.getDate() !== today.getDate() || 
              lastResetDate.getMonth() !== today.getMonth() || 
              lastResetDate.getFullYear() !== today.getFullYear()) {
            console.log("Need to reset usage - date has changed");
            await resetUsage();
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
      console.log(`Checking premium status for user ${user.id}`);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, subscription_type, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking premium status:", error);
        if (error.code !== 'PGRST116') { 
          toast("Failed to check premium status.", {
            description: "Please try again or contact support.",
            style: { backgroundColor: "red" }
          });
        }
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
        .select('content_count, words_used')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      
      if (error) {
        console.error("Error loading user usage:", error);
        if (error.code !== 'PGRST116') {
          toast.error("Failed to load usage data.");
        }
        setIsLoading(false);
        return;
      }
      
      if (data) {
        const contentCountValue = data.content_count ?? 0;
        console.log("Loaded user usage:", contentCountValue, "content generated today");
        setContentCount(contentCountValue);
      } else {
        console.log("No usage data found for today, creating new entry");
        // Create a new usage entry for today
        const newUsage = {
          user_id: user.id,
          date: today,
          content_count: 0,
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
        setContentCount(0);
      }
    } catch (error) {
      console.error("Error loading user usage:", error);
      toast.error("Failed to load usage data.");
    } finally {
      setIsLoading(false);
    }
  };

  const trackContentUsage = async (): Promise<boolean> => {
    if (!user) {
      console.log("Cannot track content usage: No user logged in");
      toast.error("Please log in to generate content.");
      return false;
    }
    
    console.log(`Tracking content generation for user ${user.id}`);
    
    if (isPremium) {
      console.log("User is premium, unlimited usage");
      return true;
    }
    
    const newTotal = contentCount + 1;
    console.log(`Current usage: ${contentCount}, New total would be: ${newTotal}, Limit: ${contentLimit}`);
    
    if (newTotal > contentLimit) {
      console.log("Daily limit would be exceeded");
      toast.error(`You've reached your free daily limit of ${contentLimit} content generations. Upgrade to Premium for unlimited usage.`);
      return false;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`Updating usage for ${today}`);
      
      // First, get the current usage to ensure we're working with the latest data
      const { data: currentData, error: fetchError } = await supabase
        .from('user_usage')
        .select('content_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching current content usage:", fetchError);
        toast.error("Failed to update usage tracker.");
        return false;
      }
      
      let currentUsage = 0;
      if (currentData && currentData.content_count !== null) {
        currentUsage = currentData.content_count;
        console.log(`Found existing usage: ${currentUsage} content generations`);
      }
      
      const updatedTotal = currentUsage + 1;
      
      // Double-check if we'd exceed the limit with the updated total
      if (updatedTotal > contentLimit && !isPremium) {
        console.log("Daily limit would be exceeded based on latest data");
        toast.error(`You've reached your free daily limit of ${contentLimit} content generations. Upgrade to Premium for unlimited usage.`);
        return false;
      }
      
      if (currentData) {
        const { error: updateError } = await supabase
          .from('user_usage')
          .update({ 
            content_count: updatedTotal,
            last_reset: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('date', today);
          
        if (updateError) {
          console.error("Error updating content usage:", updateError);
          toast.error("Failed to update usage tracker.");
          return false;
        }
        
        console.log(`Updated usage to ${updatedTotal} content generations`);
      } else {
        console.log("No usage entry found, creating new one");
        const newUsage = {
          user_id: user.id,
          date: today,
          content_count: 1,
          words_used: 0,
          last_reset: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('user_usage')
          .insert(newUsage);
          
        if (insertError) {
          console.error("Error inserting content usage:", insertError);
          toast.error("Failed to create usage tracker.");
          return false;
        }
        
        console.log(`Created new usage entry with 1 content generation`);
      }
      
      // Update local state
      setContentCount(updatedTotal);
      
      toast.success(`Content generation added (${updatedTotal}/${contentLimit} today).`);
      
      return true;
    } catch (error) {
      console.error("Error tracking content usage:", error);
      toast.error("Failed to update usage data.");
      return false;
    }
  };

  const resetUsage = async () => {
    if (!user) {
      console.log("Cannot reset usage: No user logged in");
      return;
    }
    
    try {
      console.log("Attempting to reset usage for user:", user.id);
      const today = new Date().toISOString().split('T')[0];
      
      // First check if there's an existing entry
      const { data, error: checkError } = await supabase
        .from('user_usage')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking for existing usage entry:", checkError);
        return;
      }
      
      const newUsage = {
        user_id: user.id,
        date: today,
        content_count: 0,
        words_used: 0,
        last_reset: new Date().toISOString()
      };

      // If entry exists, update it; otherwise insert a new one
      if (data) {
        console.log("Updating existing usage entry:", data.id);
        const { error } = await supabase
          .from('user_usage')
          .update(newUsage)
          .eq('id', data.id);
          
        if (error) {
          console.error("Error updating usage during reset:", error);
          return;
        }
      } else {
        console.log("Creating new usage entry during reset");
        const { error } = await supabase
          .from('user_usage')
          .insert(newUsage);
          
        if (error) {
          console.error("Error creating new usage during reset:", error);
          return;
        }
      }
      
      console.log("Usage reset successfully");
      
      // Update the local state
      setContentCount(0);
      
      // Also reload usage to ensure everything is in sync
      await loadUserUsage();
      
      toast.success("Daily usage has been reset.");
    } catch (error) {
      console.error("Error resetting usage:", error);
      toast.error("Failed to reset usage data.");
    }
  };

  const startCheckoutSession = async (priceType: 'monthly' | 'lifetime') => {
    if (!user) {
      toast.error("Please login to subscribe.");
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
      toast.error("Failed to start checkout process.");
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isPremium,
    contentLimit,
    contentCount,
    remainingContent,
    isLoading,
    startCheckoutSession,
    trackContentUsage,
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

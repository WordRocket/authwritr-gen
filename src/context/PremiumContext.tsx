import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
          .single();
          
        if (error) throw error;
        
        if (data) {
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
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        if (data.subscription_type === 'lifetime' || 
            (data.status === 'active' && (!data.expires_at || new Date(data.expires_at) > new Date()))) {
          setIsPremium(true);
        } else {
          setIsPremium(false);
        }
      } else {
        setIsPremium(false);
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
      
      const { data, error } = await supabase
        .from('user_usage')
        .select('words_used')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setUsedWords(data.words_used);
      } else {
        const { error: insertError } = await supabase
          .from('user_usage')
          .insert({
            user_id: user.id,
            date: today,
            words_used: 0,
            last_reset: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
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
    
    if (isPremium) return true;
    
    if (usedWords + wordCount > usageLimit) {
      toast({
        title: "Daily Limit Reached",
        description: `You've reached your free daily limit of ${usageLimit} words. Upgrade to Premium for unlimited usage.`,
        variant: "destructive"
      });
      return false;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('user_usage')
        .select('words_used')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        const newTotal = data.words_used + wordCount;
        const { error: updateError } = await supabase
          .from('user_usage')
          .update({ words_used: newTotal })
          .eq('user_id', user.id)
          .eq('date', today);
          
        if (updateError) throw updateError;
        setUsedWords(newTotal);
      } else {
        const { error: insertError } = await supabase
          .from('user_usage')
          .insert({
            user_id: user.id,
            date: today,
            words_used: wordCount,
            last_reset: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
        setUsedWords(wordCount);
      }
      
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
      
      const { error } = await supabase
        .from('user_usage')
        .upsert({
          user_id: user.id,
          date: today,
          words_used: 0,
          last_reset: new Date().toISOString()
        });
        
      if (error) throw error;
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

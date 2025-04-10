
import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign, Infinity } from "lucide-react";
import { usePremium } from "@/context/PremiumContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const UsageDisplay = () => {
  const { isPremium, usageLimit, usedWords, remainingWords, isLoading } = usePremium();
  const navigate = useNavigate();
  
  const percentUsed = isPremium ? 0 : Math.min(100, (usedWords / usageLimit) * 100);

  // Display the current status in the console for debugging
  useEffect(() => {
    console.log("UsageDisplay Status:", {
      isPremium,
      usedWords,
      usageLimit,
      remainingWords,
      percentUsed,
      isLoading
    });
  }, [isPremium, usedWords, usageLimit, remainingWords, percentUsed, isLoading]);

  // Force refresh of usage data when component mounts
  useEffect(() => {
    const refreshUsage = async () => {
      try {
        // This will trigger a refresh of the usage data in the PremiumContext
        const { usePremium } = await import("@/context/PremiumContext");
        const premiumContext = usePremium();
        
        if (premiumContext && typeof premiumContext.resetUsage === 'function') {
          await premiumContext.resetUsage();
          console.log("Usage data refreshed");
        }
      } catch (error) {
        console.error("Error refreshing usage data:", error);
      }
    };

    refreshUsage();
  }, []);
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Loading Usage Data...</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={0} className="h-2" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Daily Word Usage</span>
          {isPremium && (
            <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center">
              <Infinity className="h-3 w-3 mr-1" />
              Premium
            </div>
          )}
        </CardTitle>
        <CardDescription>
          {isPremium 
            ? "Unlimited words with Premium" 
            : `${usedWords.toLocaleString()} of ${usageLimit.toLocaleString()} words used (${remainingWords.toLocaleString()} remaining)`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isPremium && (
          <Progress value={percentUsed} className="h-2" />
        )}
      </CardContent>
      {!isPremium && percentUsed > 70 && (
        <CardFooter>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => navigate('/pricing')}
          >
            <BadgeDollarSign className="h-3 w-3 mr-1" />
            Upgrade for unlimited words
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

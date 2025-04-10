
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign, Infinity } from "lucide-react";
import { usePremium } from "@/context/PremiumContext";
import { useNavigate } from "react-router-dom";

export const UsageDisplay = () => {
  const { isPremium, usageLimit, usedWords, remainingWords } = usePremium();
  const navigate = useNavigate();
  
  const percentUsed = isPremium ? 0 : Math.min(100, (usedWords / usageLimit) * 100);
  
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
            : `${remainingWords.toLocaleString()} of ${usageLimit.toLocaleString()} words remaining`}
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

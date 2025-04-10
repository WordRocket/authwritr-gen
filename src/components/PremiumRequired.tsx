
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign, Star, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PremiumRequiredProps {
  feature: string;
}

export const PremiumRequired: React.FC<PremiumRequiredProps> = ({ feature }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader className="text-center">
        <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-3 w-14 h-14 mx-auto mb-2 flex items-center justify-center">
          <Lock className="h-6 w-6 text-amber-600 dark:text-amber-300" />
        </div>
        <CardTitle>Premium Feature</CardTitle>
        <CardDescription>
          <span className="font-semibold">{feature}</span> is a premium feature
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p>Upgrade to WordRocket Premium to access:</p>
        <ul className="space-y-2">
          <li className="flex items-center justify-center">
            <Star className="h-4 w-4 text-amber-500 mr-2" />
            <span>Unlimited content generation</span>
          </li>
          <li className="flex items-center justify-center">
            <Star className="h-4 w-4 text-amber-500 mr-2" />
            <span>Low AI Humanized Blog Posts</span>
          </li>
          <li className="flex items-center justify-center">
            <Star className="h-4 w-4 text-amber-500 mr-2" />
            <span>Bulk Blog Generator</span>
          </li>
          <li className="flex items-center justify-center">
            <Star className="h-4 w-4 text-amber-500 mr-2" />
            <span>WordPress integration</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          className="w-full" 
          onClick={() => navigate('/pricing')}
        >
          <BadgeDollarSign className="mr-2 h-4 w-4" />
          View Pricing & Upgrade
        </Button>
      </CardFooter>
    </Card>
  );
};

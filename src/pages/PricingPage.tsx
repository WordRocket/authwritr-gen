
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, AlertCircle, Clock, BadgeDollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function PricingPage() {
  const { user, isPremium, startCheckoutSession } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleSubscribe = async (priceType: 'monthly' | 'lifetime') => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to subscribe to WordRocket Premium",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    
    try {
      await startCheckoutSession(priceType);
    } catch (error) {
      toast({
        title: "Checkout Error",
        description: "There was a problem starting the checkout process. Please try again.",
        variant: "destructive"
      });
      console.error("Checkout error:", error);
    }
  };
  
  return (
    <div className="container py-10">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          WordRocket Premium
        </h1>
        <p className="text-muted-foreground">
          Upgrade to Premium for unlimited content generation and access to all premium templates
        </p>
      </div>
      
      <Alert className="max-w-xl mx-auto mb-8 bg-amber-50 dark:bg-amber-950/20 border-amber-300">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-amber-800 dark:text-amber-300">
          <span className="font-semibold">Limited-time beta pricing!</span> Prices will increase as we add more features.
        </AlertDescription>
      </Alert>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="relative border-primary/30">
          <Badge className="absolute -top-2 right-4 bg-primary">Most Popular</Badge>
          <CardHeader>
            <div className="rounded-full bg-primary/10 p-3 w-fit mb-2">
              <BadgeDollarSign className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Monthly Premium</CardTitle>
            <CardDescription className="flex items-baseline mt-2">
              <span className="text-3xl font-bold text-foreground">$9.99</span>
              <span className="ml-1 text-muted-foreground">/month</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Unlimited content generation</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Access to all premium templates</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Low AI Humanized Blog Posts</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Bulk Blog Generator</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>WordPress integration</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Cancel anytime</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => handleSubscribe('monthly')}
              disabled={isPremium}
            >
              {isPremium ? "Already Subscribed" : "Subscribe Monthly"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-primary/20">
          <CardHeader>
            <div className="rounded-full bg-primary/10 p-3 w-fit mb-2">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Lifetime Access</CardTitle>
            <CardDescription className="flex items-baseline mt-2">
              <span className="text-3xl font-bold text-foreground">$49.99</span>
              <span className="ml-1 text-muted-foreground">one-time</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Everything in Monthly</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Never pay again</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>No recurring payments</span>
              </li>
              <li className="flex items-center">
                <Star className="h-4 w-4 text-amber-500 mr-2" />
                <span>Limited time offer</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => handleSubscribe('lifetime')}
              disabled={isPremium}
              variant="outline"
            >
              {isPremium ? "Already Subscribed" : "Buy Lifetime Access"}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-12 max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Free Plan Limitations</h3>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Clock className="h-6 w-6 text-muted-foreground" />
            <div>
              <h4 className="font-medium">Daily Word Limit</h4>
              <p className="text-muted-foreground text-sm">Free users are limited to 5,000 words of content generation per day. Limits reset at 12:01 AM.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { usePremium } from "@/context/PremiumContext";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { isPremium } = usePremium();
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate checking payment status
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Redirect to dashboard if user navigates to this page directly without a session id
  useEffect(() => {
    if (!sessionId && !isLoading) {
      navigate('/');
    }
  }, [sessionId, isLoading, navigate]);
  
  return (
    <div className="max-w-md mx-auto py-10">
      <Card>
        <CardHeader className="text-center">
          {isLoading ? (
            <div className="mx-auto p-3">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
          ) : (
            <div className="mx-auto p-3">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          )}
          <CardTitle>
            {isLoading ? "Processing Payment..." : "Payment Successful!"}
          </CardTitle>
          <CardDescription>
            {isLoading 
              ? "Please wait while we confirm your payment" 
              : "Thank you for upgrading to WordRocket Premium"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-2">
          {isLoading ? (
            <p className="text-muted-foreground">
              This may take a few moments...
            </p>
          ) : (
            <>
              <p className="font-medium">Your account has been upgraded!</p>
              <p className="text-muted-foreground">
                You now have access to all premium features and unlimited content generation.
              </p>
            </>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          {!isLoading && (
            <Button onClick={() => navigate('/')}>
              Return to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

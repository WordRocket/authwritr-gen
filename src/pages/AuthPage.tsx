
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenTool, ArrowRight, Info, Mail, Lock, UserPlus, LogIn } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("signin");
  const [apiKey, setApiKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      // Navigation will happen automatically in the useEffect when isAuthenticated changes
    } catch (error) {
      console.error("Sign in error:", error);
      // Toast is already shown in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password);
      setActiveTab("signin");
    } catch (error) {
      console.error("Sign up error:", error);
      // Toast is already shown in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This is kept for backwards compatibility
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-background p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <PenTool className="h-10 w-10 text-primary" />
          </div>
          <h1 className="gradient-heading mb-2">ContentGenius</h1>
          <p className="text-muted-foreground">
            AI-powered blog post & article generator
          </p>
        </div>

        <Tabs defaultValue="signin" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Sign in to your account to generate content
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        <label htmlFor="email" className="text-sm font-medium">
                          Email
                        </label>
                      </div>
                      <Input
                        id="email"
                        placeholder="your.email@example.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        <label htmlFor="password" className="text-sm font-medium">
                          Password
                        </label>
                      </div>
                      <Input
                        id="password"
                        placeholder="••••••••"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !email || !password}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                    <LogIn className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>
                  Sign up to start generating great content
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        <label htmlFor="signup-email" className="text-sm font-medium">
                          Email
                        </label>
                      </div>
                      <Input
                        id="signup-email"
                        placeholder="your.email@example.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        <label htmlFor="signup-password" className="text-sm font-medium">
                          Password
                        </label>
                      </div>
                      <Input
                        id="signup-password"
                        placeholder="••••••••"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 6 characters long
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !email || !password}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                    <UserPlus className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="apikey">
            <Card>
              <CardHeader>
                <CardTitle>API Key Access</CardTitle>
                <CardDescription>
                  Enter your OpenRouter API key to continue
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleApiKeySubmit}>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="apiKey" className="text-sm font-medium">
                          API Key
                        </label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5">
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Get your API key from OpenRouter.ai dashboard.
                                We never store your API key on our servers.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        id="apiKey"
                        placeholder="Enter your OpenRouter API key"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={apiKey.trim() === ""}
                  >
                    <span>Continue</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground">
          {activeTab === "signin" ? (
            <p>
              Don't have an account?{" "}
              <Button variant="link" className="p-0" onClick={() => setActiveTab("signup")}>
                Sign up
              </Button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <Button variant="link" className="p-0" onClick={() => setActiveTab("signin")}>
                Sign in
              </Button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

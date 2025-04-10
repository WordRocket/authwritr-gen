
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ExternalLink, Check, AlertTriangle, Info } from "lucide-react";
import { testWordPressConnection } from "@/services/wordpressService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function WordPressSettings() {
  const { user } = useAuth();
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load saved WordPress settings from localStorage
  useEffect(() => {
    if (!user) return;
    
    const savedSettings = localStorage.getItem(`wordpress_settings_${user.id}`);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSiteUrl(parsed.siteUrl || "");
      setUsername(parsed.username || "");
      // Don't set the password from localStorage for security reasons
      // Instead, just indicate if it's been set before
      if (parsed.appPassword) {
        setAppPassword("********");
        setIsConnected(parsed.isConnected || false);
      }
    }
  }, [user]);

  const saveSettings = () => {
    if (!user) return;
    
    // Don't allow saving with empty fields
    if (!siteUrl || !username || !appPassword) {
      toast.error("Please fill in all WordPress connection fields");
      return;
    }

    // Make sure URL has proper format
    let formattedUrl = siteUrl;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    // Remove trailing slash if present
    if (formattedUrl.endsWith('/')) {
      formattedUrl = formattedUrl.slice(0, -1);
    }

    const settings = {
      siteUrl: formattedUrl,
      username,
      appPassword: appPassword !== "********" ? appPassword : JSON.parse(localStorage.getItem(`wordpress_settings_${user.id}`) || '{}').appPassword,
      isConnected
    };

    localStorage.setItem(`wordpress_settings_${user.id}`, JSON.stringify(settings));
    toast.success("WordPress settings saved");
    setSiteUrl(formattedUrl);
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionError(null);
    setErrorDetails(null);
    
    try {
      // Format the URL properly before testing
      let testUrl = siteUrl;
      if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
        testUrl = 'https://' + testUrl;
      }
      if (testUrl.endsWith('/')) {
        testUrl = testUrl.slice(0, -1);
      }
      
      const result = await testWordPressConnection(
        testUrl, 
        username, 
        appPassword !== "********" ? appPassword : JSON.parse(localStorage.getItem(`wordpress_settings_${user.id}`) || '{}').appPassword
      );
      
      console.log("WordPress connection test result:", result);
      
      if (result.success) {
        setIsConnected(true);
        setConnectionError(null);
        setErrorDetails(null);
        toast.success("Successfully connected to WordPress site");
        
        // Save the updated connection state
        const settings = {
          siteUrl: testUrl,
          username,
          appPassword: appPassword !== "********" ? appPassword : JSON.parse(localStorage.getItem(`wordpress_settings_${user.id}`) || '{}').appPassword,
          isConnected: true
        };
        localStorage.setItem(`wordpress_settings_${user.id}`, JSON.stringify(settings));
      } else {
        setIsConnected(false);
        setConnectionError(result.message || "Unknown connection error");
        setErrorDetails(result.details || null);
        toast.error(`Connection failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Error testing WordPress connection:", error);
      setIsConnected(false);
      const errorMessage = error instanceof Error ? error.message : "Network or connection error";
      setConnectionError(errorMessage);
      toast.error(`Connection failed: ${errorMessage}`);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <Card className="border hover:border-primary/10 transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle>WordPress Integration</CardTitle>
        <CardDescription>
          Connect to your WordPress site to publish content directly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="site-url">WordPress Site URL</Label>
          <Input
            id="site-url"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
          />
          <p className="text-sm text-muted-foreground">
            Enter your WordPress site URL (e.g., https://yourwebsite.com)
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="wp-username">Username</Label>
          <Input
            id="wp-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="WordPress username"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="app-password">Application Password</Label>
          <Input
            id="app-password"
            type="password"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            placeholder="Application password"
          />
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Use an application password for security. Never use your main WordPress password.
            </p>
            <a 
              href="https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center text-primary hover:underline text-sm transition-colors"
            >
              How to create an application password
              <ExternalLink className="h-3 w-3 ml-1 inline" />
            </a>
          </div>
        </div>

        {connectionError && (
          <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex flex-col">
              <span>{connectionError}</span>
              {errorDetails && (
                <Collapsible open={showDetails} onOpenChange={setShowDetails} className="mt-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs mt-1">
                      {showDetails ? "Hide Details" : "Show Technical Details"}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="bg-destructive/5 p-3 rounded text-xs font-mono whitespace-pre-wrap">
                      {errorDetails}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Alert className="bg-muted/50 border-muted">
          <Info className="h-4 w-4" />
          <AlertTitle>WordPress REST API requirement</AlertTitle>
          <AlertDescription className="text-sm">
            Make sure your WordPress site has the REST API enabled and that application passwords are supported.
            Some security plugins might block the REST API.
          </AlertDescription>
        </Alert>

        {isConnected && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Check size={16} />
            <span>Connected to WordPress</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          onClick={testConnection}
          disabled={testingConnection || !siteUrl || !username || !appPassword}
          variant="outline"
        >
          {testingConnection ? "Testing..." : "Test Connection"}
        </Button>
        <Button 
          onClick={saveSettings}
          disabled={!siteUrl || !username || !appPassword}
        >
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
}

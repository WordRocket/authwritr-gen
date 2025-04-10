
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ExternalLink, Check } from "lucide-react";

export default function WordPressSettings() {
  const { user } = useAuth();
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

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
    
    try {
      const result = await testWordPressConnection(
        siteUrl, 
        username, 
        appPassword !== "********" ? appPassword : JSON.parse(localStorage.getItem(`wordpress_settings_${user.id}`) || '{}').appPassword
      );
      
      if (result.success) {
        setIsConnected(true);
        toast.success("Successfully connected to WordPress site");
        
        // Save the updated connection state
        saveSettings();
      } else {
        setIsConnected(false);
        toast.error(`Connection failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Error testing WordPress connection:", error);
      setIsConnected(false);
      toast.error("Connection failed. Please check your credentials and site URL.");
    } finally {
      setTestingConnection(false);
    }
  };

  async function testWordPressConnection(url: string, user: string, password: string) {
    // Make sure URL is properly formatted
    let apiUrl = url;
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = 'https://' + apiUrl;
    }
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }
    
    const endpoint = `${apiUrl}/wp-json/wp/v2/users/me`;
    
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          'Authorization': 'Basic ' + btoa(user + ':' + password),
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          user: data,
          message: "Connected successfully"
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || `Error ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      console.error("Error in WordPress connection test:", error);
      return {
        success: false,
        message: "Network or connection error. Please check the site URL and try again."
      };
    }
  }

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

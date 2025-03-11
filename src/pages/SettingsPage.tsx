
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function SettingsPage() {
  const { apiKey, login } = useAuth();
  const [newApiKey, setNewApiKey] = useState(apiKey || "");

  const handleUpdateApiKey = () => {
    login(newApiKey);
    toast.success("API key updated successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Settings</h1>
        <p className="text-muted-foreground">
          Manage your API keys and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Update your OpenRouter API key. This is stored locally on your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openrouter-api-key">OpenRouter API Key</Label>
            <Input
              id="openrouter-api-key"
              type="password"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="Enter your OpenRouter API key"
            />
            <p className="text-sm text-muted-foreground">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpdateApiKey}
            disabled={newApiKey.trim() === "" || newApiKey === apiKey}
          >
            Update API Key
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application Preferences</CardTitle>
          <CardDescription>
            Configure your content generation preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            More preferences will be available in future updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

export default function SettingsPage() {
  const { apiKey, login, user } = useAuth();
  const [newApiKey, setNewApiKey] = useState(apiKey || "");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch user profile on mount
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }
        
        if (data) {
          setUsername(data.username || "");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleUpdateApiKey = () => {
    login(newApiKey);
    toast.success("API key updated successfully");
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);
        
      if (error) {
        toast.error("Failed to update profile");
        console.error("Error updating profile:", error);
        return;
      }
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Update your profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                Your email address is used for login and cannot be changed.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </CardFooter>
        </Card>
      )}

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

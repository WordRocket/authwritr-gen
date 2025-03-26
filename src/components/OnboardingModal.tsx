
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate("/settings");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to WordRocket 🚀</DialogTitle>
          <DialogDescription>
            Let's set up your content generation environment
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">OpenRouter API Key</h3>
            <p className="text-sm text-muted-foreground">
              WordRocket uses OpenRouter to access AI models for content generation. 
              You'll need an API key to use all features.
            </p>
            <div className="rounded-md bg-muted p-4 space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  <a 
                    href="https://openrouter.ai/keys" 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline flex items-center"
                  >
                    Create an OpenRouter account
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>Generate an API key for WordRocket</li>
                <li>Add your API key in the Settings page</li>
              </ol>
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Skip for now
          </Button>
          <Button onClick={handleSettingsClick}>
            Go to Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

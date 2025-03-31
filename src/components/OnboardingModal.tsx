
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const { setApiKey } = useAuth();
  const [key, setKey] = React.useState("");

  const handleSave = () => {
    if (key.trim()) {
      setApiKey(key.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to WordRocket</DialogTitle>
          <DialogDescription>
            To get started, please enter your OpenRouter API key. This will allow you to generate content using various AI models.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="col-span-4">
              OpenRouter API Key
            </Label>
            <Input
              id="apiKey"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter your API key"
              className="col-span-4"
            />
          </div>
          <div className="col-span-4 text-sm text-muted-foreground">
            You can get an API key from{" "}
            <a 
              href="https://openrouter.ai/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              OpenRouter.ai
            </a>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={!key.trim()}>
            Save API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BackgroundGenerationOptionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function BackgroundGenerationOption({ enabled, onToggle }: BackgroundGenerationOptionProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label htmlFor="background-generation" className="text-sm font-medium">
            Generate in background
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>
                  When enabled, content will be generated in the background and automatically saved to 
                  your "My Content" section. You can continue using the app while content is being 
                  generated.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          id="background-generation"
          checked={enabled}
          onCheckedChange={onToggle}
        />
      </div>
      {enabled && (
        <p className="text-xs text-muted-foreground">
          Content will be generated in the background and automatically saved to your "My Content" section.
        </p>
      )}
    </div>
  );
}

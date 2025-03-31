
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface CustomOutlineSectionProps {
  outline: string;
  onChange: (outline: string) => void;
}

export function CustomOutlineSection({ outline, onChange }: CustomOutlineSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempOutline, setTempOutline] = useState(outline);

  const handleSave = () => {
    onChange(tempOutline);
    setIsDialogOpen(false);
  };

  const handleCancel = () => {
    setTempOutline(outline);
    setIsDialogOpen(false);
  };

  const handleDialogOpen = (open: boolean) => {
    if (open) {
      setTempOutline(outline);
    }
    setIsDialogOpen(open);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">Additional Context</div>
      </div>

      <Alert className="bg-muted/50">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Add a custom outline to guide the AI. The outline will be used alongside the AI-generated structure.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-2">
        {outline ? (
          <div className="border rounded-md p-4 relative">
            <Badge variant="outline" className="absolute -top-2.5 left-2 bg-background">
              Custom Outline
            </Badge>
            <div className="whitespace-pre-wrap text-sm mt-1">{outline}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => handleDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Outline
            </Button>
          </div>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Custom Outline
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Add Custom Outline</DialogTitle>
                <DialogDescription>
                  Enter your custom outline to guide the AI. Use bullet points or numbered lists for best results.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea
                  placeholder="Enter your outline here... 
                  
Example:
1. Introduction
  - Background information
  - Thesis statement
2. Main Point 1
  - Evidence/examples
  - Analysis
3. Main Point 2
  - Evidence/examples
  - Analysis
4. Conclusion"
                  rows={10}
                  value={tempOutline}
                  onChange={(e) => setTempOutline(e.target.value)}
                  className="resize-y min-h-[200px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave}>Save Outline</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {outline && (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Edit Custom Outline</DialogTitle>
                <DialogDescription>
                  Modify your custom outline to guide the AI. Use bullet points or numbered lists for best results.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea
                  placeholder="Enter your outline here..."
                  rows={10}
                  value={tempOutline}
                  onChange={(e) => setTempOutline(e.target.value)}
                  className="resize-y min-h-[200px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave}>Save Outline</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

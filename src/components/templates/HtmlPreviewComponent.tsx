
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Code, Eye, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface HtmlPreviewComponentProps {
  htmlCode: string;
  className?: string;
}

export const HtmlPreviewComponent = ({ htmlCode, className }: HtmlPreviewComponentProps) => {
  const [viewMode, setViewMode] = useState<"code" | "preview">("preview");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    toast({
      title: "HTML copied to clipboard",
      description: "You can now paste the HTML code into your website",
    });

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <Card className={cn("mt-8", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Interactive HTML Element Preview</span>
          <div className="flex items-center space-x-2">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "code" | "preview")}>
              <TabsList>
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code">
                  <Code className="h-4 w-4 mr-2" />
                  HTML Code
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyToClipboard}
              className="flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy HTML
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={viewMode} className="w-full">
          <TabsContent value="preview" className="mt-0 w-full">
            <div className="p-4 border rounded-md bg-card">
              <div dangerouslySetInnerHTML={{ __html: htmlCode }} />
            </div>
          </TabsContent>
          <TabsContent value="code" className="mt-0 w-full">
            <pre className="p-4 bg-muted rounded-md overflow-x-auto font-mono text-sm">
              {htmlCode}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

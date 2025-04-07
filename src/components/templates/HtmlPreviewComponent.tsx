
import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Code, Eye, Copy, Check, Maximize, Minimize, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface HtmlPreviewComponentProps {
  htmlCode: string;
  className?: string;
}

export const HtmlPreviewComponent = ({ htmlCode, className }: HtmlPreviewComponentProps) => {
  const [viewMode, setViewMode] = useState<"preview" | "markdown">("preview");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const htmlElementRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast({
      title: "Content copied to clipboard",
      description: "You can now paste the content into your desired location",
    });

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Convert HTML to Markdown representation
  const getMarkdownRepresentation = (): string => {
    // For simplicity, we're just showing the HTML as code blocks in markdown
    return "```html\n" + htmlCode + "\n```";
  }

  return (
    <Card className={cn("mt-8", className, isFullscreen ? "fixed inset-0 z-[100] rounded-none" : "")}>
      <CardHeader className={cn("flex-row items-center justify-between", isFullscreen ? "sticky top-0 bg-background z-10" : "")}>
        <CardTitle className="flex items-center justify-between w-full">
          <span className="text-primary font-semibold">Content Preview</span>
          <div className="flex items-center space-x-2">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "preview" | "markdown")}>
              <TabsList>
                <TabsTrigger value="preview" className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="markdown" className="flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  Markdown
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(viewMode === "preview" ? htmlCode : getMarkdownRepresentation())}
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
                    Copy {viewMode === "preview" ? "HTML" : "Markdown"}
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="flex items-center gap-1"
              >
                {isFullscreen ? (
                  <>
                    <Minimize className="h-3.5 w-3.5" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize className="h-3.5 w-3.5" />
                    Fullscreen
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(isFullscreen ? "h-[calc(100vh-100px)] overflow-auto" : "")}>
        <Tabs value={viewMode} className="w-full">
          <TabsContent value="preview" className="mt-0 w-full">
            <div className="p-6 border rounded-md bg-card">
              <div 
                ref={htmlElementRef}
                className="content-container prose lg:prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: htmlCode }} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="markdown" className="mt-0 w-full">
            <pre className="p-4 bg-muted rounded-md overflow-x-auto font-mono text-sm whitespace-pre-wrap">
              {getMarkdownRepresentation()}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

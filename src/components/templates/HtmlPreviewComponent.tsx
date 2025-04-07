
import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Code, Eye, Copy, Check, Maximize, Minimize, FileText, HtmlIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface HtmlPreviewComponentProps {
  htmlCode: string;
  className?: string;
}

export const HtmlPreviewComponent = ({ htmlCode, className }: HtmlPreviewComponentProps) => {
  const [viewMode, setViewMode] = useState<"preview" | "code" | "markdown">("preview");
  const [copied, setCopied] = useState<"none" | "html" | "markdown" | "htmlElement">("none");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const htmlElementRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = (content: string, type: "html" | "markdown" | "htmlElement") => {
    navigator.clipboard.writeText(content);
    setCopied(type);
    toast({
      title: `${type === "html" ? "HTML" : type === "markdown" ? "Markdown" : "HTML Element"} copied to clipboard`,
      description: "You can now paste the content into your desired location",
    });

    setTimeout(() => {
      setCopied("none");
    }, 2000);
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Extract HTML element from the content (finds content between <table>, <div class="comparison">, etc.)
  const extractHtmlElement = (): string => {
    if (!htmlCode) return "";
    
    // Look for common HTML elements used in product comparisons
    const elementPatterns = [
      /<table[\s\S]*?<\/table>/i,
      /<div[^>]*?comparison[\s\S]*?<\/div>/i,
      /<div[^>]*?product-comparison[\s\S]*?<\/div>/i,
      /<figure[\s\S]*?<\/figure>/i,
      /<div[^>]*?comparison-chart[\s\S]*?<\/div>/i
    ];
    
    for (const pattern of elementPatterns) {
      const match = htmlCode.match(pattern);
      if (match && match[0]) {
        return match[0];
      }
    }
    
    return "";
  };

  // Convert HTML to Markdown representation (simplified)
  const getMarkdownRepresentation = (): string => {
    // For simplicity, we're just showing the HTML as code blocks in markdown
    return "```html\n" + htmlCode + "\n```";
  }
  
  const getHtmlElementMarkdown = (): string => {
    const element = extractHtmlElement();
    if (!element) return "";
    return "```html\n" + element + "\n```";
  }

  // Determine if there's an extractable HTML element
  const hasHtmlElement = extractHtmlElement().length > 0;

  return (
    <Card className={cn("mt-8", className, isFullscreen ? "fixed inset-0 z-[100] rounded-none" : "")}>
      <CardHeader className={cn("flex-row items-center justify-between", isFullscreen ? "sticky top-0 bg-background z-10" : "")}>
        <CardTitle className="flex items-center justify-between w-full">
          <span className="text-primary font-semibold">Interactive HTML Element Preview</span>
          <div className="flex items-center space-x-2">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "preview" | "code" | "markdown")}>
              <TabsList>
                <TabsTrigger value="preview" className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  HTML Code
                </TabsTrigger>
                <TabsTrigger value="markdown" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Markdown
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(htmlCode, "html")}
                className="flex items-center gap-1"
              >
                {copied === "html" ? (
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
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(getMarkdownRepresentation(), "markdown")}
                className="flex items-center gap-1"
              >
                {copied === "markdown" ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5" />
                    Copy Markdown
                  </>
                )}
              </Button>
              
              {hasHtmlElement && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(getHtmlElementMarkdown(), "htmlElement")}
                  className="flex items-center gap-1"
                >
                  {copied === "htmlElement" ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <HtmlIcon className="h-3.5 w-3.5" />
                      Copy Element
                    </>
                  )}
                </Button>
              )}
              
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
          
          <TabsContent value="code" className="mt-0 w-full">
            <pre className="p-4 bg-muted rounded-md overflow-x-auto font-mono text-sm whitespace-pre-wrap">
              {htmlCode}
            </pre>
          </TabsContent>
          
          <TabsContent value="markdown" className="mt-0 w-full">
            <pre className="p-4 bg-muted rounded-md overflow-x-auto font-mono text-sm whitespace-pre-wrap">
              {getMarkdownRepresentation()}
            </pre>
            
            {hasHtmlElement && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">HTML Element Markdown</h3>
                <pre className="p-4 bg-muted rounded-md overflow-x-auto font-mono text-sm whitespace-pre-wrap">
                  {getHtmlElementMarkdown()}
                </pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Optionally show just the HTML Element if any */}
        {viewMode === "preview" && hasHtmlElement && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-medium mb-2">HTML Element Preview</h3>
            <div className="p-4 border rounded-md bg-card">
              <div dangerouslySetInnerHTML={{ __html: extractHtmlElement() }} />
            </div>
            <div className="flex justify-end mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(extractHtmlElement(), "htmlElement")}
                className="flex items-center gap-1"
              >
                {copied === "htmlElement" ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <HtmlIcon className="h-3.5 w-3.5" />
                    Copy HTML Element
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

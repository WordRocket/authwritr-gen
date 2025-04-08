
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Code, Eye, Copy, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface HtmlPreviewComponentProps {
  htmlCode: string;
  className?: string;
}

export const HtmlPreviewComponent = ({ htmlCode, className }: HtmlPreviewComponentProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    toast({
      title: "Content copied to clipboard",
      description: "You can now paste the content into your desired location",
    });

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  const downloadAsMarkdown = () => {
    const blob = new Blob([htmlCode], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your content is being downloaded as a Markdown file",
    });
  };

  // Get just the HTML content as markdown for preview
  const getMarkdownRepresentation = (): string => {
    return htmlCode;
  };

  return (
    <Card className={cn("mt-8", className)}>
      <CardHeader className="p-0">
        <CardTitle className="flex items-center justify-between w-full bg-muted/40 border-b">
          <Tabs defaultValue="preview" className="w-full">
            <div className="flex items-center justify-between p-2">
              <TabsList className="bg-background">
                <TabsTrigger value="preview" className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="markdown" className="flex items-center gap-1">
                  <Code className="h-4 w-4" />
                  Markdown
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyToClipboard}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadAsMarkdown}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
            
            <TabsContent value="preview" className="mt-0 w-full p-6">
              <div className="content-container prose lg:prose-lg max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: htmlCode }} />
              </div>
            </TabsContent>
            
            <TabsContent value="markdown" className="mt-0 w-full p-6">
              <Textarea 
                value={getMarkdownRepresentation()} 
                readOnly 
                className="w-full min-h-[400px] font-mono text-sm"
              />
            </TabsContent>
          </Tabs>
        </CardTitle>
      </CardHeader>
      <CardContent className="hidden">
        {/* Hidden content to maintain Card structure */}
      </CardContent>
    </Card>
  );
};


import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Loader2, Code, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { HtmlPreviewComponent } from "@/components/templates/HtmlPreviewComponent";

interface ContentItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function ContentPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [viewMode, setViewMode] = useState<"rendered" | "markdown">("rendered");
  const [extractedHtmlCode, setExtractedHtmlCode] = useState<string>("");

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserContent();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Extract HTML when content is selected
  useEffect(() => {
    if (selectedContent?.content) {
      // Look for code blocks that appear to contain HTML
      const htmlCodeBlockRegex = /```(?:html)?\s*(<[\s\S]*?>[\s\S]*?<\/[\s\S]*?>)```/g;
      const htmlInlineRegex = /<(!DOCTYPE|html|div|section|article|header|footer|table|form|button|input|iframe)[\s\S]*?<\/\1>/g;
      
      let matches = [];
      let match;
      
      // First try to find code blocks with HTML
      while ((match = htmlCodeBlockRegex.exec(selectedContent.content)) !== null) {
        if (match[1] && match[1].trim()) {
          matches.push(match[1].trim());
        }
      }
      
      // If no code blocks found, try to find inline HTML
      if (matches.length === 0) {
        while ((match = htmlInlineRegex.exec(selectedContent.content)) !== null) {
          if (match[0] && match[0].trim()) {
            matches.push(match[0].trim());
          }
        }
      }
      
      // Use the longest match as it's likely the most complete HTML
      if (matches.length > 0) {
        matches.sort((a, b) => b.length - a.length);
        setExtractedHtmlCode(matches[0]);
      } else {
        setExtractedHtmlCode("");
      }
    } else {
      setExtractedHtmlCode("");
    }
  }, [selectedContent]);

  const fetchUserContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching content",
          description: error.message,
        });
        return;
      }

      setContentItems(data || []);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch your content. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewContent = (item: ContentItem) => {
    setSelectedContent(item);
    setViewMode("rendered");
  };

  const copyToClipboard = () => {
    if (selectedContent) {
      navigator.clipboard.writeText(selectedContent.content);
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to your clipboard",
      });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="mb-4 text-center text-muted-foreground">
              You need to login to view and manage your content.
            </p>
            <Button onClick={() => navigate("/auth")}>
              Login / Register
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (contentItems.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>No content yet</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="mb-4 text-center text-muted-foreground">
              You haven't created any content yet. Start by selecting a template to generate your first piece.
            </p>
            <Button onClick={() => navigate("/templates")}>
              <Plus className="mr-2 h-4 w-4" /> Create New Content
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contentItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg truncate">{item.title}</CardTitle>
              <CardDescription>
                Created on {new Date(item.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {item.content.replace(/[#*`]/g, '').substring(0, 150)}...
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => handleViewContent(item)}
                  >
                    <FileText className="mr-2 h-4 w-4" /> View Content
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <DialogTitle>{item.title}</DialogTitle>
                      <div className="flex items-center gap-2">
                        <div className="border rounded-md overflow-hidden flex">
                          <Button 
                            variant={viewMode === "rendered" ? "default" : "ghost"} 
                            size="sm"
                            onClick={() => setViewMode("rendered")}
                            className="rounded-none px-3"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button 
                            variant={viewMode === "markdown" ? "default" : "ghost"} 
                            size="sm"
                            onClick={() => setViewMode("markdown")}
                            className="rounded-none px-3"
                          >
                            <Code className="h-4 w-4 mr-2" />
                            Markdown
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={copyToClipboard}
                        >
                          Copy {viewMode === "markdown" ? "Markdown" : "Content"}
                        </Button>
                      </div>
                    </div>
                  </DialogHeader>
                  
                  <Tabs value={viewMode} className="mt-2" onValueChange={(value) => setViewMode(value as "rendered" | "markdown")}>
                    <TabsContent value="rendered" className="h-[calc(80vh-180px)] overflow-y-auto">
                      <div className="content-container prose dark:prose-invert max-w-none">
                        <ReactMarkdown components={{
                          p: ({ node, ...props }) => {
                            const content = props.children;
                            // Check if content contains HTML elements
                            if (typeof content === 'string' && (content.includes('<') && content.includes('>'))) {
                              return <div dangerouslySetInnerHTML={{ __html: content }} />;
                            }
                            return <p {...props} />;
                          },
                          // Handle tables properly
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-6">
                              <table className="w-full border-collapse border border-border" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead className="bg-muted" {...props} />
                          ),
                          tbody: ({ node, ...props }) => (
                            <tbody className="divide-y divide-border" {...props} />
                          ),
                          tr: ({ node, ...props }) => (
                            <tr className="hover:bg-muted/50" {...props} />
                          ),
                          th: ({ node, ...props }) => (
                            <th className="border border-border px-4 py-2 text-left font-semibold" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="border border-border px-4 py-2" {...props} />
                          ),
                          // Handle lists properly
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc pl-6 my-4 space-y-2" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal pl-6 my-4 space-y-2" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="pl-1" {...props} />
                          ),
                          // Properly style headings
                          h1: ({ node, ...props }) => (
                            <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-2xl font-semibold mt-8 mb-3" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-xl font-semibold mt-6 mb-2" {...props} />
                          ),
                          h4: ({ node, ...props }) => (
                            <h4 className="text-lg font-medium mt-4 mb-2" {...props} />
                          ),
                          // Handle blockquotes
                          blockquote: ({ node, ...props }) => (
                            <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4" {...props} />
                          ),
                          // Handle code blocks properly
                          code: ({ className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !match && (className || '').indexOf('language-') !== 0;
                            
                            if (isInline) {
                              return <code className="px-1 py-0.5 bg-muted rounded text-sm" {...props}>{children}</code>;
                            }
                            
                            return (
                              <pre className="p-4 bg-muted rounded-md overflow-x-auto">
                                <code className="text-sm" {...props}>{children}</code>
                              </pre>
                            );
                          },
                        }}>
                          {selectedContent?.content || ""}
                        </ReactMarkdown>
                        
                        {/* Add HTML Preview below content if HTML is found */}
                        {extractedHtmlCode && (
                          <HtmlPreviewComponent 
                            htmlCode={extractedHtmlCode} 
                            className="mt-8 border-t pt-8" 
                          />
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="markdown" className="h-[calc(80vh-180px)]">
                      <Textarea 
                        value={selectedContent?.content || ""} 
                        readOnly 
                        className="w-full h-full min-h-[400px] font-mono text-sm"
                      />
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>My Content</h1>
          <p className="text-muted-foreground">View and manage your generated content</p>
        </div>
        
        {isAuthenticated && contentItems.length > 0 && (
          <Button onClick={() => navigate("/templates")}>
            <Plus className="mr-2 h-4 w-4" /> Create New Content
          </Button>
        )}
      </div>

      {renderContent()}
    </div>
  );
}

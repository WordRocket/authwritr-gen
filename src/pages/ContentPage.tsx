
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserContent();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

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
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{item.title}</DialogTitle>
                  </DialogHeader>
                  <div className="content-container prose dark:prose-invert max-w-none">
                    <ReactMarkdown components={{
                      // Allow HTML to be rendered within markdown
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
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full divide-y divide-border" {...props} />
                        </div>
                      ),
                      // Handle lists properly
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-6 my-4" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-6 my-4" {...props} />
                      ),
                      // Properly style headings
                      h1: ({ node, ...props }) => (
                        <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-2xl font-semibold mt-6 mb-3" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-xl font-semibold mt-5 mb-2" {...props} />
                      ),
                      h4: ({ node, ...props }) => (
                        <h4 className="text-lg font-medium mt-4 mb-2" {...props} />
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
                  </div>
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

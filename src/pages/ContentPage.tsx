
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
                    <ReactMarkdown>{item.content}</ReactMarkdown>
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

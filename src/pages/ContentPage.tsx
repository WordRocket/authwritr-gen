import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Loader2, Code, Eye, Search, Filter, Grid2X2, List, Calendar, Download, ExternalLink, Copy, Edit, Trash2, Maximize, Minimize } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { HtmlPreviewComponent } from "@/components/templates/HtmlPreviewComponent";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink } from "@/components/ui/pagination";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "alphabetical">("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const itemsPerPage = 6;

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserContent();
      
      // Set up real-time subscription for new content
      const channel = supabase
        .channel('public:content')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'content',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          // Show a notification
          toast({
            title: "New Content Available",
            description: "Your background content generation is complete!",
          });
          
          // Add the new content to the list
          const newContent = payload.new as ContentItem;
          setContentItems(prev => [newContent, ...prev]);
        })
        .subscribe();
      
      // Cleanup function
      return () => {
        supabase.removeChannel(channel);
      };
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

  const deleteContent = async () => {
    if (!deleteId) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', deleteId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error deleting content",
          description: error.message,
        });
        return;
      }

      setContentItems(prev => prev.filter(item => item.id !== deleteId));
      toast({
        title: "Content deleted",
        description: "The content has been successfully deleted",
      });
      
      // Close the alert dialog
      setDeleteId(null);
      
      // If selected content is the one being deleted, clear it
      if (selectedContent && selectedContent.id === deleteId) {
        setSelectedContent(null);
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete content. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sort and filter content
  const getSortedAndFilteredContent = () => {
    let filtered = [...contentItems];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.content.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    switch (sortOrder) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "alphabetical":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    
    return filtered;
  };
  
  // Pagination
  const paginatedContent = () => {
    const sorted = getSortedAndFilteredContent();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  };
  
  const totalPages = Math.ceil(getSortedAndFilteredContent().length / itemsPerPage);

  const downloadAsMarkdown = () => {
    if (!selectedContent) return;
    
    const blob = new Blob([selectedContent.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedContent.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your content is being downloaded as a Markdown file",
    });
  };

  const getContentPreview = (content: string) => {
    // Remove markdown formatting for preview
    return content
      .replace(/[#*`]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with just the text
      .substring(0, 150) + "...";
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              aria-disabled={currentPage === 1}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          
          {Array.from({ length: totalPages }).map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink 
                isActive={currentPage === i + 1}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              aria-disabled={currentPage === totalPages}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
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

    if (getSortedAndFilteredContent().length === 0) {
      // Empty state
      return (
        <Card className="border-dashed bg-card/50">
          <CardHeader className="text-center">
            <CardTitle>No content found</CardTitle>
            <CardDescription>
              {searchTerm 
                ? "No content matches your search. Try different keywords." 
                : "You haven't created any content yet. Start by selecting a template to generate your first piece."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            {!searchTerm && (
              <Button onClick={() => navigate("/templates")} className="animate-pulse">
                <Plus className="mr-2 h-4 w-4" /> Create New Content
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {viewType === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedContent().map((item) => (
              <Card key={item.id} className="overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-1 group">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> 
                        {new Date(item.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {getContentPreview(item.content)}
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    {isMobile ? (
                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={() => handleViewContent(item)}
                          >
                            <FileText className="mr-2 h-4 w-4" /> View Content
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent className="h-[85vh] px-4 pb-4">
                          <div className="mt-4 px-4">
                            <h3 className="text-lg font-bold">{item.title}</h3>
                            <div className="mt-4 overflow-auto max-h-[70vh] prose dark:prose-invert">
                              <ReactMarkdown>
                                {item.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </DrawerContent>
                      </Drawer>
                    ) : (
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
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={downloadAsMarkdown}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
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
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/templates?edit=${item.id}`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Content</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this content? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={deleteContent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      if (selectedContent?.id === item.id) {
                        copyToClipboard();
                      } else {
                        setSelectedContent(item);
                        setTimeout(copyToClipboard, 100);
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedContent().map((item) => (
              <Card key={item.id} className="overflow-hidden transition-all duration-200 hover:shadow-md group">
                <div className="flex flex-col md:flex-row md:items-center p-4">
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold truncate">{item.title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3.5 w-3.5 mr-1" /> 
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                      {getContentPreview(item.content)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 md:mt-0">
                    {isMobile ? (
                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewContent(item)}
                          >
                            <Eye className="h-4 w-4 mr-2" /> View
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent className="h-[85vh] px-4 pb-4">
                          <div className="mt-4 px-4">
                            <h3 className="text-lg font-bold">{item.title}</h3>
                            <div className="mt-4 overflow-auto max-h-[70vh] prose dark:prose-invert">
                              <ReactMarkdown>
                                {item.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </DrawerContent>
                      </Drawer>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewContent(item)}
                          >
                            <Eye className="h-4 w-4 mr-2" /> View
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
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={downloadAsMarkdown}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </DialogHeader>
                          
                          <Tabs value={viewMode} className="mt-2" onValueChange={(value) => setViewMode(value as "rendered" | "markdown")}>
                            <TabsContent value="rendered" className="h-[calc(80vh-180px)] overflow-y-auto">
                              <div className="content-container prose dark:prose-invert max-w-none">
                                <ReactMarkdown>
                                  {selectedContent?.content || ""}
                                </ReactMarkdown>
                                
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
                    )}
                    
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/templates?edit=${item.id}`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Content</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this content? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={deleteContent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        if (selectedContent?.id === item.id) {
                          copyToClipboard();
                        } else {
                          setSelectedContent(item);
                          setTimeout(copyToClipboard, 100);
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {renderPagination()}
      </>
    );
  };

  // Modify the dialog content to use our enhanced fullscreen capability
  const renderContentDialog = (item: ContentItem) => {
    return (
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden" showFullscreenButton>
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
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadAsMarkdown}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <Tabs value={viewMode} className="mt-2" onValueChange={(value) => setViewMode(value as "rendered" | "markdown")}>
            <TabsContent value="rendered" className="h-[calc(90vh-180px)] overflow-y-auto">
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

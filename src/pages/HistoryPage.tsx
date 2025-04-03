
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle, Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tables } from "@/integrations/supabase/types";

interface GenerationHistoryItem {
  id: string;
  title: string;
  created_at: string;
  status: "completed" | "failed" | "pending";
  error_message?: string | null;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [historyItems, setHistoryItems] = useState<GenerationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "completed" | "failed">("all");

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchGenerationHistory();
      
      const channel = supabase
        .channel('content_updates')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'content',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchGenerationHistory();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated, user]);

  const fetchGenerationHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching history",
          description: error.message,
        });
        return;
      }

      // Transform data for the history view with explicit type casting
      const historyData: GenerationHistoryItem[] = data?.map((item: Tables["content"]["Row"]) => ({
        id: item.id,
        title: item.title,
        created_at: item.created_at,
        status: (item.error_message ? "failed" : "completed") as "completed" | "failed" | "pending",
        error_message: item.error_message,
      })) || [];

      setHistoryItems(historyData);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch generation history. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredItems = () => {
    if (activeTab === "all") return historyItems;
    return historyItems.filter(item => item.status === activeTab);
  };

  const handleViewContent = (id: string) => {
    navigate(`/content?id=${id}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">Completed</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">Failed</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <p className="mb-4 text-center text-muted-foreground">
            You need to login to view your generation history.
          </p>
          <Button onClick={() => navigate("/auth")}>
            Login / Register
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Generation History</h1>
        <p className="text-muted-foreground">View your content generation history and status</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "completed" | "failed")}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-24 ml-auto" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : getFilteredItems().length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredItems().map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {getStatusIcon(item.status)}
                            <span className="ml-2">{getStatusBadge(item.status)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-muted-foreground text-sm">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            {new Date(item.created_at).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.status === "failed" && item.error_message && (
                            <span className="text-sm text-red-500">
                              {item.error_message}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status === "completed" && (
                            <Button variant="outline" size="sm" onClick={() => handleViewContent(item.id)}>
                              <ExternalLink className="h-4 w-4 mr-2" /> View Content
                            </Button>
                          )}
                          {item.status === "failed" && (
                            <Button variant="outline" size="sm" onClick={() => navigate("/templates")}>
                              <ArrowRight className="h-4 w-4 mr-2" /> Try Again
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No generation history</CardTitle>
                <CardDescription>
                  {activeTab === "all" 
                    ? "You haven't generated any content yet."
                    : activeTab === "completed"
                    ? "You don't have any completed generations."
                    : "You don't have any failed generations."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Button onClick={() => navigate("/templates")}>
                  <Plus className="mr-2 h-4 w-4" /> Create New Content
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

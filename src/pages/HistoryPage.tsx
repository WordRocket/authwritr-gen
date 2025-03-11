
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HistoryPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1>Generation History</h1>
        <p className="text-muted-foreground">View your recent content generation history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No generation history</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <p className="mb-4 text-center text-muted-foreground">
            You haven't generated any content yet. Your generation history will appear here.
          </p>
          <Button onClick={() => navigate("/templates")}>
            <Plus className="mr-2 h-4 w-4" /> Create New Content
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

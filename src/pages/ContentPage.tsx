
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ContentPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1>My Content</h1>
        <p className="text-muted-foreground">View and manage your generated content</p>
      </div>

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
    </div>
  );
}

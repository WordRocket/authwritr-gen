
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Globe } from "lucide-react";
import { createWordPressPost, getWordPressSettings } from "@/services/wordpressService";
import { useAuth } from "@/context/AuthContext";

interface WordPressPublishButtonProps {
  title: string;
  content: string;
  metaDescription?: string;
  excerpt?: string;
  disabled?: boolean;
}

export default function WordPressPublishButton({
  title,
  content,
  metaDescription,
  excerpt,
  disabled = false
}: WordPressPublishButtonProps) {
  const [publishing, setPublishing] = useState(false);
  const { user } = useAuth();

  const handlePublish = async () => {
    if (!user) {
      toast.error("You must be logged in to publish to WordPress");
      return;
    }

    // Check if WordPress is connected
    const settings = getWordPressSettings(user.id);
    if (!settings || !settings.isConnected) {
      toast.error("WordPress not connected", {
        description: "Please connect your WordPress site in Settings first."
      });
      return;
    }

    setPublishing(true);
    try {
      const result = await createWordPressPost(
        { title, content, metaDescription, excerpt },
        user.id
      );

      if (result.success) {
        toast.success("Published to WordPress!", {
          description: "Your content was successfully published as a draft."
        });
        
        // If we have an edit URL, offer to open it
        if (result.editUrl) {
          window.open(result.editUrl, '_blank');
        }
      } else {
        toast.error("Publishing failed", {
          description: result.message || "An error occurred while publishing to WordPress."
        });
      }
    } catch (error) {
      console.error("Error publishing to WordPress:", error);
      toast.error("Publishing error", {
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Button
      onClick={handlePublish}
      disabled={disabled || publishing || !title || !content}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Globe size={16} />
      {publishing ? "Publishing..." : "Publish to WordPress"}
    </Button>
  );
}

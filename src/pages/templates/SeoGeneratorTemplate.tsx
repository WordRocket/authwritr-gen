
import React from "react";
import { Button } from "@/components/ui/button";
import { SeoGeneratorForm } from "@/components/templates/SeoGeneratorForm";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function SeoGeneratorTemplate() {
  const navigate = useNavigate();
  const { apiKey } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => navigate("/templates")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1>All In One SEO Generator</h1>
      </div>
      
      <p className="text-muted-foreground">
        Create comprehensive SEO-optimized content with keywords, meta descriptions, and structured sections.
      </p>
      
      {!apiKey && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Key Required</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>To generate content, you'll need to add your OpenRouter API key in the Settings page. You can still explore the template form below.</p>
            <div className="flex gap-2 mt-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-fit"
                onClick={() => navigate("/settings")}
              >
                Go to Settings
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-fit"
                onClick={() => window.open("https://openrouter.ai/keys", "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Get an OpenRouter API Key
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <SeoGeneratorForm />
    </div>
  );
}

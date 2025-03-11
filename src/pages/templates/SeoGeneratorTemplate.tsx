
import React from "react";
import { Button } from "@/components/ui/button";
import { SeoGeneratorForm } from "@/components/templates/SeoGeneratorForm";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SeoGeneratorTemplate() {
  const navigate = useNavigate();
  
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
      
      <SeoGeneratorForm />
    </div>
  );
}

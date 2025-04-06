
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Globe, AlertCircle } from "lucide-react";
import { RealTimeBlogGeneratorForm } from "@/components/templates/RealTimeBlogGeneratorForm";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

export default function WebSearchTemplate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { apiKey } = useAuth();
  
  useEffect(() => {
    document.title = "Real-Time Web Search Article Generator | Content Genius";
  }, []);
  
  const handleGeneratingState = (generating: boolean) => {
    setIsGenerating(generating);
    if (generating) {
      setApiError(null);
    }
  };

  const handleApiError = (error: string) => {
    setApiError(error);
    setIsGenerating(false);
  };

  return (
    <div className="mx-auto container py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Real-Time Web Search Article Generator
      </h1>
      <p className="text-muted-foreground mt-2">
        Create content with real-time web search results to ensure accuracy and relevance
      </p>
      
      {!apiKey && (
        <Alert className="mt-4 border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            API key is missing. Please add your OpenRouter API key in{" "}
            <Link to="/settings" className="font-medium underline hover:text-destructive/80">
              Settings
            </Link>{" "}
            to use content generation features.
          </AlertDescription>
        </Alert>
      )}
      
      {apiError && (
        <Alert className="mt-4 border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <p><strong>API Error:</strong> {apiError}</p>
            <p className="mt-2">
              If this is an authentication error (401), please check:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>That you have sufficient credits in your OpenRouter account</li>
              <li>Your API key is valid and entered correctly</li>
              <li>
                Try creating a new API key in OpenRouter and updating it in your{" "}
                <Link to="/settings" className="font-medium underline hover:text-destructive/80">
                  Settings
                </Link>
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {isGenerating && (
        <Alert className="mt-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <InfoIcon className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            Content is being generated. Please do not leave this page. It may take a few minutes to complete.
          </AlertDescription>
        </Alert>
      )}
      
      <RealTimeBlogGeneratorForm 
        onGeneratingStateChange={handleGeneratingState}
        onApiError={handleApiError}
        apiKey={apiKey}
      />
    </div>
  );
}

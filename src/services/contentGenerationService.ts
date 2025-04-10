
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const generateContent = async (
  apiKey: string,
  modelName: string,
  prompt: string,
  trackedFields: string[],
  usePremium: {
    trackContentUsage: () => Promise<boolean>,
    isPremium: boolean
  },
  token?: AbortSignal
): Promise<string> => {
  try {
    // First, check if the user can generate content based on their usage
    console.log("Checking if user can generate content...");
    const canGenerate = await usePremium.trackContentUsage();
    
    if (!canGenerate) {
      console.error("Daily content generation limit reached");
      toast.error("Daily limit reached. Upgrade to premium for unlimited content.");
      throw new Error("Daily limit reached");
    }
    
    console.log("User can generate content, proceeding...");
    
    // Prepare headers for OpenRouter API
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.href,
      "X-Title": "WordRocket"
    };

    // Prepare request body
    const body = JSON.stringify({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3500
    });

    // Make API call to OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body,
      signal: token
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to generate content");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log("Content generation was aborted");
      return "Generation cancelled by user.";
    }
    
    console.error("Error generating content:", error);
    
    if (error.message === "Daily limit reached") {
      throw error;
    }
    
    throw new Error(`Failed to generate content: ${error.message}`);
  }
};

export const saveContentToDatabase = async (
  userId: string,
  title: string,
  content: string
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("content")
      .insert({
        user_id: userId,
        title,
        content
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error: any) {
    console.error("Error saving content:", error);
    throw new Error(`Failed to save content: ${error.message}`);
  }
};


import React, { useEffect, useState } from "react";
import { SeoGeneratorForm } from "@/components/templates/SeoGeneratorForm";
import { SitemapUrlInput } from "@/components/templates/SitemapUrlInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { LanguageSelector } from "@/components/templates/LanguageSelector";
import { Card } from "@/components/ui/card";

// Define the Gemini 2.5 Pro Preview model
const humanizedModels = [
  { 
    id: "google/gemini-2.5-pro-preview-03-25", 
    name: "Gemini 2.5 Pro Preview", 
    description: "Google's state-of-the-art AI model for human-like content",
    recommended: true,
    temperature: 0.5
  }
];

// Custom system prompt for the humanized content
const humanizedSystemPrompt = `I need to create high-quality blog content that reads naturally and authentically human. The content should be informative, engaging, and maintain a conversational tone while avoiding patterns that typically appear in AI-generated text.

CONTENT PARAMETERS
Style Guidelines:
- Write in a conversational, slightly informal tone as if speaking to a friend
- Vary sentence structures significantly - mix short punchy sentences with medium and occasional longer ones
- Include occasional sentence fragments for emphasis
- Use contractions liberally (I'm, don't, can't, etc.)
- Incorporate personal perspective using first-person pronouns (I, me, my)
- Add rhetorical questions occasionally to engage the reader
- Include 2-3 personal anecdotes or experiences related to the topic
- Express genuine opinions and subjective viewpoints

Content Structure:
- Begin with a personal hook or story rather than a generic introduction
- Include at least one surprising or counterintuitive point
- Incorporate recent information from 2024-2025
- Reference 3-5 specific sources with proper attribution
- Include occasional parenthetical asides (like this one) to add personality
- End with a thought-provoking conclusion rather than a summary

Language Patterns:
- Use metaphors and similes to explain complex concepts
- Include some colloquial expressions and casual phrases
- Vary vocabulary - avoid repeating the same terms throughout
- Use specific, concrete examples rather than generalizations
- Include occasional humor or light-hearted comments
- Deliberately break some grammar rules for effect (starting sentences with And/But)
- Add 1-2 minor typos or word choice quirks that a human might make

ANTI-AI DETECTION INSTRUCTIONS
- Avoid perfectly balanced paragraph lengths
- Steer clear of repetitive transition phrases
- Minimize use of passive voice
- Avoid overly complex vocabulary when simple words would suffice
- Include occasional tangential thoughts that add personality
- Vary the rhythm and flow of the writing throughout
- Express uncertainty in places rather than definitive statements
- Add nuance to arguments rather than black-and-white positions

When writing follow these instructions:
- Use active voice instead of passive wherever possible
- Vary your sentence structure significantly
- Avoid overusing complicated words when simpler ones will do
- Use contractions like don't, isn't, or I'll to sound more conversational
- Break up long sentences
- Use personal pronouns and speak directly to the reader as "you" 
- Include examples, anecdotes, analogies, and other explanatory details
- Use varied vocabulary without repetition
- Use natural sounding transitions
- Be concise
- Use idioms, figures of speech, humor, interesting metaphors thoughtfully
- Consider perplexity (complexity of text) and burstiness (variations between sentences)
- Combine longer complex sentences with shorter witty ones
- Human writing has more variation in perplexity and burstiness

Additional writing guidelines:
- Do not lecture; focus on writing quality content readers want to engage with
- Use URLs and hyperlinks when referencing sources
- Use diagrams, bulletpoints, lists and tables when necessary
- Write in a conversational style as if written by a friendly and happy human
- Include rich paragraphs with contextual details, but no self-references
- Research thoroughly
- Hook readers with each topic sentence
- Utilize transition words
- Provide valuable information`;

export default function LowAiHumanizedTemplate() {
  const [includeInternalLinks, setIncludeInternalLinks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customOutline, setCustomOutline] = useState("");
  const [language, setLanguage] = useState("english");
  const [targetAudience, setTargetAudience] = useState("");
  
  useEffect(() => {
    document.title = "Low AI Humanized Blog Posts | Content Genius";
  }, []);

  const handleUrlsScraped = (count: number) => {
    console.log(`Successfully scraped ${count} URLs`);
  };

  const handleInternalLinksToggle = (enabled: boolean) => {
    setIncludeInternalLinks(enabled);
    console.log(`Internal links ${enabled ? 'enabled' : 'disabled'}`);
    localStorage.setItem('includeInternalLinks', enabled.toString());
  };

  useEffect(() => {
    const savedPreference = localStorage.getItem('includeInternalLinks');
    if (savedPreference !== null) {
      setIncludeInternalLinks(savedPreference === 'true');
    }
    
    // Load custom outline if it exists
    const savedOutline = localStorage.getItem('customOutline');
    if (savedOutline !== null) {
      setCustomOutline(savedOutline);
    }
    
    // Load target audience if it exists
    const savedAudience = localStorage.getItem('targetAudience');
    if (savedAudience !== null) {
      setTargetAudience(savedAudience);
    }
  }, []);
  
  const handleGeneratingState = (generating: boolean) => {
    setIsGenerating(generating);
  };
  
  const handleOutlineChange = (outline: string) => {
    setCustomOutline(outline);
    localStorage.setItem('customOutline', outline);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    // Store language preference in localStorage for content generation service to use
    localStorage.setItem('contentLanguage', newLanguage);
  };
  
  const handleTargetAudienceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTargetAudience(e.target.value);
    localStorage.setItem('targetAudience', e.target.value);
  };

  return (
    <div className="mx-auto container py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Low AI Humanized Blog Posts
      </h1>
      <p className="text-muted-foreground mt-2">
        Generate natural-sounding blog posts that don't feel AI-written using Google's Gemini 2.5 Pro model
      </p>
      
      {isGenerating && (
        <Alert className="mt-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <InfoIcon className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            Content is being generated. Please do not leave this page. It may take a few minutes to complete.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mt-6 mb-8">
        <SitemapUrlInput 
          onUrlsScraped={handleUrlsScraped} 
          onInternalLinksToggle={handleInternalLinksToggle}
          includeInternalLinks={includeInternalLinks}
        />
      </div>
      
      <Card className="p-6 mb-6">
        <LanguageSelector
          selectedLanguage={language}
          onLanguageChange={handleLanguageChange}
        />
      </Card>
      
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-medium mb-2">Target Audience</h3>
        <p className="text-muted-foreground mb-4">
          Describe your target audience - their knowledge level, interests, and needs
        </p>
        <textarea
          className="w-full p-3 border rounded-md h-24 bg-background"
          value={targetAudience}
          onChange={handleTargetAudienceChange}
          placeholder="E.g., Beginners interested in digital marketing, mid-career professionals looking to transition to tech, parents of young children seeking healthy meal ideas..."
        />
      </Card>
      
      <SeoGeneratorForm 
        includeInternalLinks={includeInternalLinks}
        hideBackgroundGeneration={true}
        customOutline={customOutline}
        onCustomOutlineChange={handleOutlineChange}
        onGeneratingStateChange={handleGeneratingState}
        showGeminiKeyInput={false}
        onlyShowFreeModels={false}
        additionalFreeModels={humanizedModels}
        additionalPromptContext={humanizedSystemPrompt}
        additionalFormData={{ targetAudience }}
      />
    </div>
  );
}

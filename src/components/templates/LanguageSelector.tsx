
import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { FormDescription } from '@/components/ui/form';
import { Languages } from 'lucide-react';
import { languageOptions } from '@/utils/languageOptions';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export function LanguageSelector({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) {
  // Load language preference from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('contentLanguage');
    if (savedLanguage) {
      onLanguageChange(savedLanguage);
    }
  }, [onLanguageChange]);

  // Handle language change and save preference
  const handleLanguageChange = (language: string) => {
    onLanguageChange(language);
    localStorage.setItem('contentLanguage', language);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Languages className="mr-2 h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Content Language</span>
      </div>
      <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {languageOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center">
                <span className="mr-2">{option.flag}</span>
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription>
        Select the language for your generated content
      </FormDescription>
    </div>
  );
}

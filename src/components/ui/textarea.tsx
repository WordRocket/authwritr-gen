
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean;
  maxCount?: number;
  countType?: "characters" | "words";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, showCount, maxCount, countType = "characters", onChange, value, ...props }, ref) => {
    const [count, setCount] = React.useState<number>(0);
    
    React.useEffect(() => {
      if (typeof value === 'string') {
        if (countType === "words") {
          // Count words by splitting on whitespace and filtering out empty strings
          const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
          setCount(wordCount);
        } else {
          // Default to character count
          setCount(value.length);
        }
      }
    }, [value, countType]);
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e);
      }
      
      if (countType === "words") {
        // Count words by splitting on whitespace and filtering out empty strings
        const wordCount = e.target.value.trim() ? e.target.value.trim().split(/\s+/).length : 0;
        setCount(wordCount);
      } else {
        // Default to character count
        setCount(e.target.value.length);
      }
    };
    
    return (
      <div className="w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          onChange={handleChange}
          value={value}
          {...props}
        />
        {showCount && (
          <div className="flex justify-end mt-1">
            <span className={cn(
              "text-xs text-muted-foreground",
              maxCount && count > maxCount ? "text-destructive font-medium" : ""
            )}>
              {count}{maxCount ? `/${maxCount}` : ""} {countType === "words" ? "words" : "characters"}
            </span>
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

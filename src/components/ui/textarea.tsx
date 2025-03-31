
import * as React from "react"
import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean;
  countType?: "characters" | "words";
  maxCount?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, showCount, countType = "characters", maxCount, ...props }, ref) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      if (showCount && props.value !== undefined) {
        if (countType === "words") {
          const text = String(props.value).trim();
          setCount(text ? text.split(/\s+/).length : 0);
        } else {
          setCount(String(props.value).length);
        }
      }
    }, [props.value, showCount, countType]);
    
    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            showCount && "pb-6",
            className
          )}
          ref={ref}
          {...props}
        />
        {showCount && (
          <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
            {count} {countType === "words" ? "words" : "characters"}
            {maxCount ? ` / ${maxCount}` : ""}
          </div>
        )}
      </div>
    );
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

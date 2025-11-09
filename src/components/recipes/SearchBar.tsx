/**
 * Search Bar Component for Recipes List
 * Input field with search icon, clear button and accessibility features
 */
import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Search Bar Component
 * Features: search icon, clear button, Escape key support, live region
 */
export function SearchBar({ value, onChange, placeholder = "Szukaj przepisu..." }: SearchBarProps) {
  const [isSearching] = useState(false);

  /**
   * Handle clear button click
   * Clears search value and triggers onChange
   */
  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  /**
   * Handle Escape key press
   * Clears search value when Escape is pressed
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        onChange("");
      }
    },
    [onChange]
  );

  return (
    <>
      <div className="relative">
        {/* Search icon (left) */}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />

        {/* Search input */}
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Wyszukaj przepisy"
          className="pl-10 pr-10"
          maxLength={100}
        />

        {/* Clear button (right, conditional) */}
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
            aria-label="Wyczyść wyszukiwanie"
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Live region for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {isSearching && "Wyszukiwanie..."}
      </div>
    </>
  );
}

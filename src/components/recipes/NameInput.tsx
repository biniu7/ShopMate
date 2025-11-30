/**
 * Name Input Component
 * Input field for recipe name with validation
 */
import { memo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * Name Input Component
 * Displays input for recipe name with error messages
 */
export const NameInput = memo<NameInputProps>(({ value, onChange, error }) => {
  return (
    <div className="name-input-field space-y-2">
      <Label htmlFor="recipe-name" className="text-base font-medium">
        Nazwa przepisu <span className="text-red-500">*</span>
      </Label>
      <Input
        id="recipe-name"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="np. Spaghetti Carbonara"
        aria-invalid={!!error}
        aria-describedby={error ? "name-error" : undefined}
        className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
        data-testid="recipe-name-input"
      />
      {error && (
        <p id="name-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
});

NameInput.displayName = "NameInput";

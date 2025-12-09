/**
 * Add Recipe Button Component
 * Button for navigating to recipe creation page
 * Supports two variants: normal (desktop) and FAB (mobile)
 */
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddRecipeButtonProps {
  variant?: "normal" | "fab";
  className?: string;
}

/**
 * Add Recipe Button Component
 * Two variants:
 * - normal: Regular button for desktop header
 * - fab: Floating Action Button for mobile (sticky bottom-right)
 */
export function AddRecipeButton({ variant = "normal", className }: AddRecipeButtonProps) {
  const isFab = variant === "fab";

  return (
    <a href="/recipes/new" className={className}>
      <Button
        variant={isFab ? "default" : "default"}
        size={isFab ? "lg" : "default"}
        className={cn(isFab && "rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow", !isFab && "gap-2")}
        aria-label="Dodaj nowy przepis"
      >
        {isFab ? (
          <Plus className="h-6 w-6" />
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Dodaj przepis
          </>
        )}
      </Button>
    </a>
  );
}

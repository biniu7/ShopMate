/**
 * Recipe Edit View Wrapper
 * Wraps RecipeEditView with QueryProvider to ensure proper React Query context
 * This is necessary because Astro's client:load creates separate islands
 */
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RecipeEditView } from "./RecipeEditView";

interface RecipeEditViewWrapperProps {
  recipeId: string;
}

/**
 * Wrapper component that provides QueryClient context to RecipeEditView
 * Must be used as a single client:load component in Astro
 */
export function RecipeEditViewWrapper({ recipeId }: RecipeEditViewWrapperProps) {
  return (
    <QueryProvider>
      <RecipeEditView recipeId={recipeId} />
    </QueryProvider>
  );
}
/**
 * Recipe Details View Wrapper
 * Wraps RecipeDetailsView with QueryProvider to ensure proper React Query context
 * This is necessary because Astro's client:load creates separate islands
 */
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RecipeDetailsView } from "./RecipeDetailsView";

interface RecipeDetailsViewWrapperProps {
  recipeId: string;
}

/**
 * Wrapper component that provides QueryClient context to RecipeDetailsView
 * Must be used as a single client:load component in Astro
 */
export function RecipeDetailsViewWrapper({ recipeId }: RecipeDetailsViewWrapperProps) {
  return (
    <QueryProvider>
      <RecipeDetailsView recipeId={recipeId} />
    </QueryProvider>
  );
}

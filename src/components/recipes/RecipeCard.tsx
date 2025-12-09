/**
 * Recipe Card Component
 * Displays a single recipe in the recipes list grid
 */
import { ChefHat, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { truncate } from "@/lib/utils/text";
import { formatRelativeTime } from "@/lib/utils/date";
import type { RecipeListItemDto } from "@/types";

interface RecipeCardProps {
  recipe: RecipeListItemDto;
  onPrefetch?: (recipeId: string) => void;
}

/**
 * Recipe Card Component
 * Clickable card showing recipe name, ingredients count and creation date
 * Implements prefetching on hover for better UX
 */
export function RecipeCard({ recipe, onPrefetch }: RecipeCardProps) {
  const displayName = truncate(recipe.name, 50);
  const isNameTruncated = recipe.name.length > 50;

  /**
   * Handle mouse enter for prefetching
   * Prefetches recipe details for instant navigation
   */
  const handleMouseEnter = () => {
    if (onPrefetch) {
      onPrefetch(recipe.id);
    }
  };

  return (
    <a href={`/recipes/${recipe.id}`} onMouseEnter={handleMouseEnter} className="recipe-card block">
      <article className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white h-full">
        {/* Recipe name with truncation */}
        <h3
          className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2"
          title={isNameTruncated ? recipe.name : undefined}
        >
          {displayName}
        </h3>

        {/* Metadata: ingredients count and creation date */}
        <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
          {/* Ingredients count badge */}
          <Badge variant="secondary" className="flex items-center gap-1">
            <ChefHat className="h-3 w-3" />
            <span>
              {recipe.ingredients_count} {recipe.ingredients_count === 1 ? "składnik" : "składników"}
            </span>
          </Badge>

          {/* Creation date (relative) */}
          <time
            dateTime={recipe.created_at}
            className="flex items-center gap-1"
            title={new Date(recipe.created_at).toLocaleString("pl-PL")}
          >
            <Clock className="h-3 w-3" />
            {formatRelativeTime(recipe.created_at)}
          </time>
        </div>
      </article>
    </a>
  );
}

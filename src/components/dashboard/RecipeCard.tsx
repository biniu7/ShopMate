/**
 * RecipeCard - Karta przepisu
 * Wyświetla nazwę przepisu (skrócona do 50 znaków), liczbę składników i datę dodania
 * Karta jest kliklalna i prowadzi do szczegółów przepisu
 */

import { cn } from "@/lib/utils";
import { truncate } from "@/lib/utils/text";
import { formatRelativeTime } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import type { RecipeListItemDto } from "@/types";

interface RecipeCardProps {
  recipe: RecipeListItemDto;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  // Truncate name do 50 znaków
  const truncatedName = truncate(recipe.name, 50);

  // Format relative time
  const relativeTime = formatRelativeTime(recipe.created_at);

  return (
    <a
      href={`/recipes/${recipe.id}`}
      className={cn(
        "recipe-card group block",
        "p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
        "shadow-sm hover:shadow-md transition-all duration-200",
        "hover:border-primary-500 dark:hover:border-primary-400",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      )}
    >
      <article>
        <h3
          className="recipe-card-name text-lg font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
          title={recipe.name}
        >
          {truncatedName}
        </h3>
        <div className="recipe-card-meta flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs">
            {recipe.ingredients_count} składników
          </Badge>
          <time dateTime={recipe.created_at} className="recipe-card-date text-sm text-gray-500 dark:text-gray-400">
            {relativeTime}
          </time>
        </div>
      </article>
    </a>
  );
}

/**
 * Ingredients Section - sekcja ze składnikami przepisu
 * Wyświetla listę składników posortowaną według sort_order
 */
import type { IngredientResponseDto } from "@/types";

interface IngredientsSectionProps {
  ingredients: IngredientResponseDto[];
}

/**
 * IngredientsSection
 * Sekcja ze składnikami wyświetlana jako lista punktowana
 * Każdy składnik pokazuje ilość, jednostkę i nazwę
 */
export function IngredientsSection({ ingredients }: IngredientsSectionProps) {
  // Sort ingredients by sort_order
  const sortedIngredients = [...ingredients].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="ingredients-section" aria-labelledby="ingredients-heading">
      <h2 id="ingredients-heading" className="text-2xl font-semibold text-gray-900 mb-4">
        Składniki ({ingredients.length})
      </h2>

      <ul className="space-y-2">
        {sortedIngredients.map((ingredient) => (
          <li key={ingredient.id} className="flex items-baseline gap-2 text-gray-800">
            <span className="text-primary" aria-hidden="true">
              •
            </span>
            <span>
              {ingredient.quantity && <strong className="font-semibold">{ingredient.quantity} </strong>}
              {ingredient.unit && <span className="text-gray-600">{ingredient.unit} </span>}
              <span>{ingredient.name}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

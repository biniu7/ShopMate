/**
 * Recipe Details Content - główna zawartość strony szczegółów przepisu
 * Wyświetla nazwę, meta dane, składniki, instrukcje i info o przypisaniach
 */
import type { RecipeResponseDto } from "@/types";
import { RecipeMeta } from "./RecipeMeta";
import { IngredientsSection } from "./IngredientsSection";
import { InstructionsSection } from "./InstructionsSection";
import { AssignmentsInfo } from "./AssignmentsInfo";

interface RecipeDetailsContentProps {
  recipe: RecipeResponseDto;
}

/**
 * RecipeDetailsContent
 * Główna zawartość strony z nazwą przepisu, meta informacjami,
 * składnikami i instrukcjami
 */
export function RecipeDetailsContent({ recipe }: RecipeDetailsContentProps) {
  return (
    <div className="recipe-details-content container mx-auto max-w-4xl px-4 py-8">
      {/* Recipe name */}
      <h1 className="text-4xl font-bold text-gray-900 mb-2">{recipe.name}</h1>

      {/* Meta information */}
      <RecipeMeta
        createdAt={recipe.created_at}
        updatedAt={recipe.updated_at}
      />

      {/* Ingredients and Instructions grid */}
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <IngredientsSection ingredients={recipe.ingredients} />
        <InstructionsSection instructions={recipe.instructions} />
      </div>

      {/* Assignments info (conditional) */}
      {recipe.meal_plan_assignments && recipe.meal_plan_assignments > 0 && (
        <AssignmentsInfo count={recipe.meal_plan_assignments} />
      )}
    </div>
  );
}

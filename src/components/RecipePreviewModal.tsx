/**
 * Recipe Preview Modal Component
 * Modal for viewing recipe details from calendar
 */
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { fetchRecipe } from "@/lib/api/recipes";
import type { RecipeResponseDto } from "@/types";

interface RecipePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string | null;
  assignmentId: string | null;
  onRemoveFromCalendar: (assignmentId: string) => void;
}

/**
 * Recipe Preview Modal Component
 * Displays recipe details with actions
 */
const RecipePreviewModal = memo<RecipePreviewModalProps>(
  ({ isOpen, onClose, recipeId, assignmentId, onRemoveFromCalendar }) => {
    // Fetch recipe details
    const {
      data: recipe,
      isLoading,
      error,
    } = useQuery<RecipeResponseDto>({
      queryKey: ["recipe", recipeId],
      queryFn: () => {
        if (!recipeId) throw new Error("Recipe ID is required");
        return fetchRecipe(recipeId);
      },
      enabled: !!recipeId && isOpen,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Handle remove from calendar
    const handleRemoveFromCalendar = () => {
      if (assignmentId) {
        onRemoveFromCalendar(assignmentId);
        onClose();
      }
    };

    // Handle edit recipe
    const handleEditRecipe = () => {
      if (recipeId) {
        window.location.href = `/recipes/${recipeId}/edit`;
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{recipe?.name || "Podgląd przepisu"}</DialogTitle>
            {recipe && (
              <DialogDescription>
                {recipe.ingredients.length} {recipe.ingredients.length === 1 ? "składnik" : "składników"}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Content */}
          <ScrollArea className="flex-1 h-[500px] -mx-6 px-6">
            {isLoading && (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                Ładowanie przepisu...
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-red-600">Nie udało się załadować przepisu. Spróbuj ponownie.</div>
            )}

            {recipe && (
              <div className="space-y-6">
                {/* Ingredients Section */}
                <section>
                  <h3 className="font-semibold text-lg text-gray-900 mb-3">Składniki ({recipe.ingredients.length})</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {recipe.ingredients.map((ingredient) => (
                      <li key={ingredient.id} className="text-gray-700">
                        {ingredient.quantity && ingredient.unit ? (
                          <>
                            <span className="font-medium">
                              {ingredient.quantity} {ingredient.unit}
                            </span>{" "}
                            {ingredient.name}
                          </>
                        ) : (
                          <span className="font-medium">{ingredient.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Instructions Section */}
                <section>
                  <h3 className="font-semibold text-lg text-gray-900 mb-3">Instrukcje</h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{recipe.instructions}</p>
                </section>

                {/* Metadata */}
                {recipe.meal_plan_assignments !== undefined && (
                  <section className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Przepis przypisany do {recipe.meal_plan_assignments}{" "}
                      {recipe.meal_plan_assignments === 1 ? "posiłku" : "posiłków"}
                    </p>
                  </section>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Footer with Actions */}
          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={handleEditRecipe} disabled={!recipe}>
              Edytuj przepis
            </Button>
            <Button variant="destructive" onClick={handleRemoveFromCalendar} disabled={!assignmentId}>
              Usuń z kalendarza
            </Button>
            <Button onClick={onClose}>Zamknij</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

RecipePreviewModal.displayName = "RecipePreviewModal";

export default RecipePreviewModal;

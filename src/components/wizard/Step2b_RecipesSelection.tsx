import React, { useState, useEffect, useMemo } from "react";
import type { RecipeListItemDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import SelectionCounter from "./SelectionCounter";
import NavigationButtons from "./NavigationButtons";
import { cn } from "@/lib/utils";

interface Step2b_RecipesSelectionProps {
  selectedRecipes: string[];
  onToggleRecipe: (recipeId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const MAX_RECIPES = 20;

/**
 * Krok 2b: Wybór przepisów z listy
 */
export default function Step2b_RecipesSelection({
  selectedRecipes,
  onToggleRecipe,
  onBack,
  onNext,
}: Step2b_RecipesSelectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<RecipeListItemDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Pobierz wszystkie przepisy użytkownika
   */
  useEffect(() => {
    async function fetchRecipes() {
      setIsLoading(true);
      setError(null);

      try {
        // Pobierz wszystkie przepisy (max 100 - limit API)
        const response = await fetch("/api/recipes?limit=100");

        if (!response.ok) {
          throw new Error("Nie udało się pobrać przepisów");
        }

        const data = await response.json();
        setRecipes(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecipes();
  }, []);

  /**
   * Filtrowanie przepisów po nazwie
   */
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;

    const query = searchQuery.toLowerCase();
    return recipes.filter((recipe) => recipe.name.toLowerCase().includes(query));
  }, [recipes, searchQuery]);

  /**
   * Wyczyść zaznaczenie
   */
  const clearSelection = () => {
    // Usuwamy wszystkie zaznaczone przepisy poprzez toggle każdego z nich
    selectedRecipes.forEach((recipeId) => {
      onToggleRecipe(recipeId);
    });
  };

  if (isLoading) {
    return (
      <div className="step-2b">
        <h2 className="text-2xl font-semibold mb-6">Wybierz przepisy</h2>
        <RecipesListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="step-2b">
        <h2 className="text-2xl font-semibold mb-6">Wybierz przepisy</h2>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <NavigationButtons onBack={onBack} />
      </div>
    );
  }

  return (
    <div className="step-2b">
      <h2 className="text-2xl font-semibold mb-2">Wybierz przepisy</h2>
      <p className="text-gray-600 mb-6">Zaznacz przepisy, z których chcesz wygenerować listę zakupów</p>

      <div className="mb-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Szukaj przepisu..." />
      </div>

      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <SelectionCounter count={selectedRecipes.length} label="przepisów" max={MAX_RECIPES} />

        {selectedRecipes.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Wyczyść
          </Button>
        )}
      </div>

      {recipes.length === 0 ? (
        <Alert variant="default" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Nie masz jeszcze żadnych przepisów. Przejdź do sekcji przepisów, aby dodać swój pierwszy przepis.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {filteredRecipes.length === 0 ? (
            <Alert variant="default" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nie znaleziono przepisów pasujących do wyszukiwania &quot;{searchQuery}&quot;
              </AlertDescription>
            </Alert>
          ) : (
            <div className="recipes-list max-h-96 overflow-y-auto border rounded-lg p-4 bg-white">
              <div className="space-y-2">
                {filteredRecipes.map((recipe) => {
                  const isSelected = selectedRecipes.includes(recipe.id);
                  const isDisabled = selectedRecipes.length >= MAX_RECIPES && !isSelected;

                  return (
                    <div
                      key={recipe.id}
                      className={cn(
                        "recipe-checkbox-item flex items-center p-3 rounded border transition-colors",
                        !isDisabled && "hover:bg-gray-50 cursor-pointer",
                        isSelected && "border-primary bg-primary/5",
                        isDisabled && "bg-gray-50 opacity-60 cursor-not-allowed"
                      )}
                      onClick={() => !isDisabled && onToggleRecipe(recipe.id)}
                      onKeyDown={(e) => {
                        if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          onToggleRecipe(recipe.id);
                        }
                      }}
                      role="button"
                      tabIndex={isDisabled ? -1 : 0}
                    >
                      <Checkbox id={`recipe-${recipe.id}`} checked={isSelected} disabled={isDisabled} />
                      <div className="ml-3 flex-1 min-w-0">
                        <Label
                          htmlFor={`recipe-${recipe.id}`}
                          className={cn("cursor-pointer block", isDisabled && "cursor-not-allowed")}
                        >
                          <div className="font-medium text-sm">{recipe.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {recipe.ingredients_count}{" "}
                            {recipe.ingredients_count === 1
                              ? "składnik"
                              : recipe.ingredients_count < 5
                                ? "składniki"
                                : "składników"}
                          </div>
                        </Label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedRecipes.length >= MAX_RECIPES && (
            <Alert variant="default" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Osiągnięto maksymalną liczbę przepisów ({MAX_RECIPES}). Usuń niektóre, aby dodać inne.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={selectedRecipes.length === 0}
        nextLabel="Generuj listę"
      />
    </div>
  );
}

/**
 * Skeleton dla loadingu listy przepisów
 */
function RecipesListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

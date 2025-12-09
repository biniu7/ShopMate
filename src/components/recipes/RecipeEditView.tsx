/**
 * Recipe Edit View Component
 * Entry point for recipe editing with QueryProvider
 */
import React from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RecipeEditContainer } from "./RecipeEditContainer";

interface RecipeEditViewProps {
  recipeId: string;
}

/**
 * RecipeEditView
 * Entry point component with QueryProvider wrapper
 */
export function RecipeEditView({ recipeId }: RecipeEditViewProps) {
  return (
    <QueryProvider>
      <RecipeEditContainer recipeId={recipeId} />
    </QueryProvider>
  );
}

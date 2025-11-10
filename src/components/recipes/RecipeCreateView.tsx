/**
 * Recipe Create View Component
 * Main container for recipe creation form
 */
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";
import { RecipeForm } from "./RecipeForm";

/**
 * Recipe Create View Component
 * Wraps RecipeForm with QueryProvider for TanStack Query
 */
export default function RecipeCreateView() {
  return (
    <QueryProvider>
      <div className="recipe-create-view min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-3xl p-4 py-8">
          <RecipeForm />
        </div>
      </div>
      <Toaster />
    </QueryProvider>
  );
}

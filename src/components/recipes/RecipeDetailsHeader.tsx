/**
 * Recipe Details Header - sticky header z breadcrumbs i przyciskami akcji
 * Zawiera nawigację (breadcrumbs) i przyciski: Edytuj, Usuń, Powrót
 */
import { Edit, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface RecipeDetailsHeaderProps {
  recipeName: string;
  recipeId: string;
  onDelete: () => void;
}

/**
 * RecipeDetailsHeader
 * Sticky header z breadcrumbs i przyciskami akcji
 */
export function RecipeDetailsHeader({
  recipeName,
  recipeId,
  onDelete,
}: RecipeDetailsHeaderProps) {
  // Truncate recipe name if too long for breadcrumb
  const truncatedName =
    recipeName.length > 30 ? `${recipeName.slice(0, 30)}...` : recipeName;

  return (
    <header className="recipe-details-header sticky top-0 bg-white z-10 border-b shadow-sm">
      <div className="container mx-auto max-w-7xl px-4 py-4">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/recipes">Przepisy</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{truncatedName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href={`/recipes/${recipeId}/edit`}>
              <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
              Edytuj
            </a>
          </Button>

          <Button
            onClick={onDelete}
            variant="destructive"
            aria-label={`Usuń przepis ${recipeName}`}
          >
            <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
            Usuń
          </Button>

          <Button asChild variant="ghost">
            <a href="/recipes">
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Powrót do listy
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

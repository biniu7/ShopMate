/**
 * ShoppingListsHeader component
 * Sticky header with breadcrumbs and "Generate new list" button
 */

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";

export function ShoppingListsHeader() {
  return (
    <header className="shopping-lists-header sticky top-0 bg-white z-10 border-b shadow-sm">
      <div className="container mx-auto p-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Listy zakupów</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between mt-4">
          <h1 className="text-3xl font-bold text-gray-900">Listy zakupów</h1>

          <Button asChild size="lg">
            <a href="/shopping-lists/generate">
              <Plus className="h-4 w-4 mr-2" />
              Generuj nową listę
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

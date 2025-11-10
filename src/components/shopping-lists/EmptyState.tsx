/**
 * EmptyState component
 * Displayed when user has no shopping lists
 */

import { ShoppingCart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="empty-state py-16 text-center">
      <div className="max-w-md mx-auto">
        <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Nie masz jeszcze list zakupów</h2>
        <p className="text-gray-600 mb-6">Wygeneruj pierwszą listę z kalendarza tygodniowego lub wybranych przepisów</p>
        <Button asChild size="lg">
          <a href="/shopping-lists/generate">
            <Plus className="h-4 w-4 mr-2" />
            Generuj pierwszą listę
          </a>
        </Button>
      </div>
    </div>
  );
}

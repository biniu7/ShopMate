/**
 * EmptyState - Widok dla nowych użytkowników (0 przepisów)
 * Wyświetla komunikat powitalny, CTA i feature highlights
 */

import { ChefHat, Calendar, ShoppingCart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="empty-state max-w-3xl mx-auto py-12 px-4">
      {/* Ilustracja */}
      <div className="empty-state-illustration flex justify-center mb-8">
        <div className="w-32 h-32 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
          <ChefHat className="w-16 h-16 text-primary-600 dark:text-primary-400" />
        </div>
      </div>

      {/* Treść */}
      <div className="empty-state-content text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Witaj w ShopMate!</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">Zacznij od dodania pierwszego przepisu</p>

        {/* CTA Button */}
        <a href="/recipes/new">
          <Button size="lg" className="empty-state-cta text-base px-8 py-6 h-auto">
            Dodaj pierwszy przepis
          </Button>
        </a>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Będziesz mógł przypisać go do kalendarza</p>
      </div>

      {/* Feature Highlights */}
      <div className="empty-state-features grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="feature-highlight text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Planuj posiłki na cały tydzień</p>
        </div>

        <div className="feature-highlight text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Generuj listy zakupów automatycznie</p>
        </div>

        <div className="feature-highlight text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">AI kategoryzuje składniki za Ciebie</p>
        </div>
      </div>
    </div>
  );
}

/**
 * QuickActionsSection - Sekcja z szybkimi akcjami (CTA)
 * Wyświetla 3 przyciski: Dodaj przepis, Zaplanuj tydzień, Generuj listę
 */

import { Plus, Calendar, ShoppingCart } from "lucide-react";
import { ActionButton } from "./ActionButton";

export function QuickActionsSection() {
  return (
    <section className="quick-actions-section mb-8" aria-label="Szybkie akcje">
      <div className="quick-actions-grid grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionButton
          icon={<Plus className="w-6 h-6" />}
          label="Dodaj przepis"
          description="Stwórz nowy przepis"
          href="/recipes/new"
          variant="primary"
        />
        <ActionButton
          icon={<Calendar className="w-6 h-6" />}
          label="Zaplanuj tydzień"
          description="Przypisz przepisy do kalendarza"
          href="/calendar"
          variant="secondary"
        />
        <ActionButton
          icon={<ShoppingCart className="w-6 h-6" />}
          label="Generuj listę"
          description="Stwórz listę zakupów"
          href="/shopping-lists/generate"
          variant="secondary"
        />
      </div>
    </section>
  );
}

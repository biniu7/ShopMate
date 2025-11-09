/**
 * StatsSection - Sekcja ze statystykami
 * Wyświetla 3 karty: liczba przepisów, posiłków w kalendarzu, list zakupów
 */

import { ChefHat, Calendar, ShoppingCart } from "lucide-react";
import { StatCard } from "./StatCard";
import type { DashboardStats } from "@/types";

interface StatsSectionProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export function StatsSection({ stats, isLoading }: StatsSectionProps) {
  if (isLoading) {
    // Skeleton podczas ładowania
    return (
      <section className="stats-section mb-8" aria-label="Statystyki">
        <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card-skeleton h-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="stats-section mb-8" aria-label="Statystyki">
      <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={<ChefHat className="w-8 h-8" />} label="Przepisy" value={stats.recipesCount} href="/recipes" />
        <StatCard
          icon={<Calendar className="w-8 h-8" />}
          label="Zaplanowane posiłki"
          value={stats.mealPlansCount}
          href="/calendar"
        />
        <StatCard
          icon={<ShoppingCart className="w-8 h-8" />}
          label="Listy zakupów"
          value={stats.shoppingListsCount}
          href="/shopping-lists"
        />
      </div>
    </section>
  );
}

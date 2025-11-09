/**
 * StatCard - Pojedyncza karta statystyki
 * Wyświetla ikonę, etykietę i wartość liczbową
 * Karta jest kliklalna i prowadzi do odpowiedniej sekcji aplikacji
 */

import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
}

export function StatCard({ icon, label, value, href }: StatCardProps) {
  // Walidacja: zawsze wyświetlamy liczbę nieujemną
  const displayValue = typeof value === "number" && value >= 0 ? value : 0;

  return (
    <a
      href={href}
      className={cn(
        "stat-card group",
        "flex items-center gap-4 p-6",
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
        "shadow-sm hover:shadow-md transition-all duration-200",
        "hover:border-primary-500 dark:hover:border-primary-400",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      )}
      aria-label={`${label}: ${displayValue}`}
    >
      <div className="stat-card-icon flex-shrink-0 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="stat-card-content flex-1 min-w-0">
        <p className="stat-card-label text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          {label}
        </p>
        <p className="stat-card-value text-3xl font-bold text-gray-900 dark:text-white">
          {displayValue}
        </p>
      </div>
    </a>
  );
}

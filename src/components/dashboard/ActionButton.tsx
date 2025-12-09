/**
 * ActionButton - Przycisk CTA z ikoną, etykietą główną i opisem
 * Używany w QuickActionsSection
 */

import { cn } from "@/lib/utils";

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  variant: "primary" | "secondary";
}

export function ActionButton({ icon, label, description, href, variant }: ActionButtonProps) {
  return (
    <a
      href={href}
      className={cn(
        "action-button group flex items-center gap-4 p-5 rounded-lg border transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        {
          "bg-primary-600 hover:bg-primary-700 border-primary-600 hover:border-primary-700 text-white shadow-md hover:shadow-lg":
            variant === "primary",
          "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 hover:border-primary-500 shadow-sm hover:shadow-md":
            variant === "secondary",
        }
      )}
    >
      <div
        className={cn("action-button-icon flex-shrink-0 group-hover:scale-110 transition-transform", {
          "text-white": variant === "primary",
          "text-primary-600 dark:text-primary-400": variant === "secondary",
        })}
      >
        {icon}
      </div>
      <div className="action-button-content flex-1 min-w-0">
        <span
          className={cn("action-button-label block font-semibold text-base mb-1", {
            "text-white": variant === "primary",
            "text-gray-900 dark:text-white": variant === "secondary",
          })}
        >
          {label}
        </span>
        <span
          className={cn("action-button-description block text-sm", {
            "text-primary-100": variant === "primary",
            "text-gray-600 dark:text-gray-400": variant === "secondary",
          })}
        >
          {description}
        </span>
      </div>
    </a>
  );
}

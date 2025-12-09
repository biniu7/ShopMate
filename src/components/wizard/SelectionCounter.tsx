import React from "react";
import { Badge } from "@/components/ui/badge";

interface SelectionCounterProps {
  count: number;
  label: string;
  max?: number;
}

/**
 * Komponent wyświetlający licznik zaznaczonych elementów
 */
export default function SelectionCounter({ count, label, max }: SelectionCounterProps) {
  const isAtMax = max !== undefined && count >= max;

  return (
    <div className="selection-counter flex items-center gap-2">
      <span className="text-sm text-gray-600">Wybrano:</span>
      <Badge variant={count > 0 ? "default" : "secondary"} className="text-sm">
        {count} {label}
        {max !== undefined && ` / ${max}`}
      </Badge>
      {isAtMax && <span className="text-sm text-orange-600 font-medium">Osiągnięto maksimum</span>}
    </div>
  );
}

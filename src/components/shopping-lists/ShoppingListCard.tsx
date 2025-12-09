/**
 * ShoppingListCard component
 * Card for a single shopping list showing name, metadata, badge with item count, and delete button
 */

import { Clock, Calendar, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, formatWeekRange } from "@/lib/utils/date";
import { truncate } from "@/lib/utils/text";
import type { ShoppingListListItemDto } from "@/types";

interface ShoppingListCardProps {
  list: ShoppingListListItemDto;
  onDelete: () => void;
}

export function ShoppingListCard({ list, onDelete }: ShoppingListCardProps) {
  return (
    <article className="shopping-list-card relative">
      <a href={`/shopping-lists/${list.id}`} className="block">
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-10" title={list.name}>
            {truncate(list.name, 60)}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <time dateTime={list.created_at} className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(list.created_at)}
            </time>

            {list.week_start_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatWeekRange(list.week_start_date)}
              </span>
            )}

            <Badge variant="secondary" className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              {list.items_count} {list.items_count === 1 ? "składnik" : "składników"}
            </Badge>
          </div>
        </div>
      </a>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-4 right-4"
        aria-label={`Usuń listę ${list.name}`}
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </article>
  );
}

/**
 * ListMeta - metadane listy zakupów (data utworzenia, zakres tygodnia)
 */
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Clock, Calendar } from "lucide-react";
import { formatWeekRange } from "@/lib/utils/date";

interface ListMetaProps {
  createdAt: string;
  weekStartDate: string | null;
}

export function ListMeta({ createdAt, weekStartDate }: ListMetaProps) {
  return (
    <div className="list-meta flex flex-wrap gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>Utworzono: {format(new Date(createdAt), "d MMMM yyyy, HH:mm", { locale: pl })}</span>
      </div>

      {weekStartDate && (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{formatWeekRange(weekStartDate)}</span>
        </div>
      )}
    </div>
  );
}

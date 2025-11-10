/**
 * Assignments Info - alert informacyjny o przypisaniach przepisu do kalendarza
 * Wyświetla liczbę przypisań i link do kalendarza
 */
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AssignmentsInfoProps {
  count: number;
}

/**
 * AssignmentsInfo
 * Alert informacyjny wyświetlany gdy przepis jest przypisany do kalendarza posiłków
 * Pokazuje liczbę przypisań i link do kalendarza
 */
export function AssignmentsInfo({ count }: AssignmentsInfoProps) {
  // Plural forms for Polish
  const mealLabel = count === 1 ? "posiłku" : "posiłków";

  return (
    <Alert variant="default" className="mt-8 bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
      <AlertTitle className="text-blue-900">Ten przepis jest przypisany do kalendarza</AlertTitle>
      <AlertDescription className="text-blue-800">
        Ten przepis jest przypisany do {count} {mealLabel} w kalendarzu.{" "}
        <a
          href="/calendar"
          className="font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        >
          Zobacz kalendarz →
        </a>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Recipe Meta - wyświetla meta informacje o przepisie
 * Pokazuje daty utworzenia i ostatniej edycji
 */
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface RecipeMetaProps {
  createdAt: string;
  updatedAt: string;
}

/**
 * RecipeMeta
 * Wyświetla daty utworzenia i ostatniej edycji w formacie czytelnym dla użytkownika
 */
export function RecipeMeta({ createdAt, updatedAt }: RecipeMetaProps) {
  return (
    <div className="recipe-meta flex flex-wrap gap-4 text-sm text-gray-600">
      <div>
        <span className="font-medium">Dodano:</span>{" "}
        <time dateTime={createdAt}>
          {format(new Date(createdAt), "d MMMM yyyy, HH:mm", { locale: pl })}
        </time>
      </div>

      {updatedAt !== createdAt && (
        <div>
          <span className="font-medium">Ostatnia edycja:</span>{" "}
          <time dateTime={updatedAt}>
            {format(new Date(updatedAt), "d MMMM yyyy, HH:mm", { locale: pl })}
          </time>
        </div>
      )}
    </div>
  );
}

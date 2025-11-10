import React, { useState, useEffect, useMemo } from "react";
import type { CalendarSelectionDto, MealType, WeekCalendarResponseDto } from "@/types";
import { MEAL_TYPES } from "@/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, AlertTriangle } from "lucide-react";
import CalendarSelector from "./CalendarSelector";
import SelectionCounter from "./SelectionCounter";
import NavigationButtons from "./NavigationButtons";

interface Step2a_CalendarSelectionProps {
  selectedMeals: CalendarSelectionDto[];
  onToggleMeal: (dayOfWeek: number, mealType: MealType) => void;
  onSelectAllMeals: (selections: CalendarSelectionDto[]) => void;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Krok 2a: Wybór posiłków z kalendarza tygodniowego
 */
export default function Step2a_CalendarSelection({
  selectedMeals,
  onToggleMeal,
  onSelectAllMeals,
  onBack,
  onNext,
}: Step2a_CalendarSelectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<WeekCalendarResponseDto | null>(null);

  /**
   * Pobierz kalendarz bieżącego tygodnia
   */
  useEffect(() => {
    async function fetchCalendar() {
      setIsLoading(true);
      setError(null);

      try {
        const weekStartDate = getCurrentWeekStart();
        const response = await fetch(`/api/meal-plan?week_start_date=${weekStartDate}`);

        if (!response.ok) {
          throw new Error("Nie udało się pobrać kalendarza");
        }

        const data: WeekCalendarResponseDto = await response.json();
        setCalendar(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCalendar();
  }, []);

  /**
   * Licznik wybranych posiłków
   */
  const selectedMealsCount = useMemo(() => {
    return selectedMeals.reduce((sum, day) => sum + day.meal_types.length, 0);
  }, [selectedMeals]);

  /**
   * Licznik pustych posiłków (zaznaczonych, ale bez przepisów)
   */
  const emptyMealsCount = useMemo(() => {
    if (!calendar) return 0;

    let count = 0;
    selectedMeals.forEach((day) => {
      day.meal_types.forEach((mealType) => {
        const hasAssignment = calendar.assignments.some(
          (a) => a.day_of_week === day.day_of_week && a.meal_type === mealType
        );
        if (!hasAssignment) {
          count++;
        }
      });
    });

    return count;
  }, [selectedMeals, calendar]);

  /**
   * Zaznacz cały tydzień (wszystkie posiłki z przypisanymi przepisami)
   */
  const selectAllMeals = () => {
    if (!calendar) return;

    const allSelections: CalendarSelectionDto[] = [];

    for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
      const mealTypesForDay = MEAL_TYPES.filter((mealType) =>
        calendar.assignments.some((a) => a.day_of_week === dayOfWeek && a.meal_type === mealType)
      );

      if (mealTypesForDay.length > 0) {
        allSelections.push({
          day_of_week: dayOfWeek,
          meal_types: mealTypesForDay,
        });
      }
    }

    onSelectAllMeals(allSelections);
  };

  /**
   * Wyczyść zaznaczenie
   */
  const clearSelection = () => {
    onSelectAllMeals([]);
  };

  if (isLoading) {
    return (
      <div className="step-2a">
        <h2 className="text-2xl font-semibold mb-6">Wybierz posiłki z kalendarza</h2>
        <CalendarSkeleton />
      </div>
    );
  }

  if (error || !calendar) {
    return (
      <div className="step-2a">
        <h2 className="text-2xl font-semibold mb-6">Wybierz posiłki z kalendarza</h2>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || "Nie udało się załadować kalendarza"}</AlertDescription>
        </Alert>
        <NavigationButtons onBack={onBack} />
      </div>
    );
  }

  return (
    <div className="step-2a">
      <h2 className="text-2xl font-semibold mb-2">Wybierz posiłki z kalendarza</h2>
      <p className="text-gray-600 mb-6">
        Zaznacz posiłki z tygodnia {calendar.week_start_date} - {calendar.week_end_date}
      </p>

      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <SelectionCounter count={selectedMealsCount} label="posiłków" />

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAllMeals} disabled={calendar.assignments.length === 0}>
            <Check className="h-4 w-4 mr-2" />
            Zaznacz wszystkie
          </Button>
          {selectedMealsCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Wyczyść
            </Button>
          )}
        </div>
      </div>

      {calendar.assignments.length === 0 ? (
        <Alert variant="default" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Brak przypisanych przepisów w tym tygodniu. Przejdź do kalendarza, aby dodać posiłki.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <CalendarSelector
            assignments={calendar.assignments}
            selectedMeals={selectedMeals}
            onToggleMeal={onToggleMeal}
          />

          {emptyMealsCount > 0 && (
            <Alert variant="default" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {emptyMealsCount} {emptyMealsCount === 1 ? "zaznaczony posiłek nie ma" : "zaznaczone posiłki nie mają"}{" "}
                przypisanego przepisu i {emptyMealsCount === 1 ? "zostanie pominięty" : "zostaną pominięte"}.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={selectedMealsCount === 0}
        nextLabel="Generuj listę"
      />
    </div>
  );
}

/**
 * Skeleton dla loadingu kalendarza
 */
function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pomocnicza funkcja do pobrania początku aktualnego tygodnia
 */
function getCurrentWeekStart(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Poniedziałek = 1
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

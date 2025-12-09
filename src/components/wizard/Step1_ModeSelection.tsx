import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step1_ModeSelectionProps {
  selectedMode: "calendar" | "recipes" | null;
  onSelectMode: (mode: "calendar" | "recipes") => void;
  onNext: () => void;
}

/**
 * Krok 1: Wybór trybu generowania listy zakupów
 */
export default function Step1_ModeSelection({ selectedMode, onSelectMode, onNext }: Step1_ModeSelectionProps) {
  return (
    <div className="step-1 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-2">Wybierz tryb generowania</h2>
      <p className="text-gray-600 mb-6">Zdecyduj, w jaki sposób chcesz utworzyć listę zakupów</p>

      <RadioGroup value={selectedMode || ""} onValueChange={(value) => onSelectMode(value as "calendar" | "recipes")}>
        <div className="space-y-4">
          {/* Option 1: Z kalendarza */}
          <div
            className={cn(
              "border rounded-lg p-6 cursor-pointer transition hover:border-primary/50",
              selectedMode === "calendar" && "border-primary bg-primary/5 ring-2 ring-primary/20"
            )}
            onClick={() => onSelectMode("calendar")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectMode("calendar");
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-start gap-4">
              <RadioGroupItem value="calendar" id="mode-calendar" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="mode-calendar" className="cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="font-medium text-lg">Z kalendarza</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Wybierz posiłki z kalendarza tygodniowego i wygeneruj listę zakupów na podstawie przypisanych
                    przepisów
                  </div>
                </Label>
              </div>
            </div>
          </div>

          {/* Option 2: Z przepisów */}
          <div
            className={cn(
              "border rounded-lg p-6 cursor-pointer transition hover:border-primary/50",
              selectedMode === "recipes" && "border-primary bg-primary/5 ring-2 ring-primary/20"
            )}
            onClick={() => onSelectMode("recipes")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectMode("recipes");
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-start gap-4">
              <RadioGroupItem value="recipes" id="mode-recipes" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="mode-recipes" className="cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="font-medium text-lg">Z przepisów</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Wybierz dowolne przepisy z kolekcji i wygeneruj listę zakupów na podstawie ich składników
                  </div>
                </Label>
              </div>
            </div>
          </div>
        </div>
      </RadioGroup>

      <div className="flex justify-end mt-8">
        <Button onClick={onNext} disabled={!selectedMode} size="lg">
          Dalej
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

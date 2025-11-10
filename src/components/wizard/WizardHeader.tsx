import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface WizardHeaderProps {
  currentStep: 1 | 2 | 3 | 4;
}

const STEP_LABELS: Record<number, string> = {
  1: "Tryb",
  2: "Wybór",
  3: "Generowanie",
  4: "Edycja",
};

/**
 * Header wizarda z breadcrumbs i progress bar
 */
export default function WizardHeader({ currentStep }: WizardHeaderProps) {
  return (
    <div className="wizard-header mb-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/shopping-lists">Listy zakupów</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Generuj listę</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-6">Generuj listę zakupów</h1>

      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={4}
        aria-label={`Krok ${currentStep} z 4`}
      >
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={cn("flex-1 text-center", step <= currentStep ? "text-primary font-medium" : "text-gray-400")}
            >
              <div className="text-sm">Krok {step}</div>
              <div className="text-xs">{STEP_LABELS[step]}</div>
            </div>
          ))}
        </div>

        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

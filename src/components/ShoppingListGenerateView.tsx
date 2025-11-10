import React from "react";
import ShoppingListWizard from "./wizard/ShoppingListWizard";

/**
 * Główny widok generowania listy zakupów
 * Renderuje 4-etapowy wizard
 */
export default function ShoppingListGenerateView() {
  return (
    <div className="shopping-list-generate-view">
      <div className="container mx-auto max-w-5xl p-4">
        <ShoppingListWizard />
      </div>
    </div>
  );
}

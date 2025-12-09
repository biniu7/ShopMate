import React from "react";
import WizardHeader from "./WizardHeader";
import Step1_ModeSelection from "./Step1_ModeSelection";
import Step2a_CalendarSelection from "./Step2a_CalendarSelection";
import Step2b_RecipesSelection from "./Step2b_RecipesSelection";
import Step3_Generation from "./Step3_Generation";
import Step4_PreviewEdit from "./Step4_PreviewEdit";
import { useShoppingListWizard } from "@/components/hooks/useShoppingListWizard";

/**
 * Shopping List Wizard Component
 * Main wizard component for generating shopping lists
 */
export default function ShoppingListWizard() {
  const wizard = useShoppingListWizard();

  return (
    <div className="wizard">
      <WizardHeader currentStep={wizard.state.currentStep} />

      {wizard.state.currentStep === 1 && (
        <Step1_ModeSelection
          selectedMode={wizard.state.mode}
          onSelectMode={wizard.selectMode}
          onNext={() => wizard.goToStep(2)}
        />
      )}

      {wizard.state.currentStep === 2 && wizard.state.mode === "calendar" && (
        <Step2a_CalendarSelection
          selectedMeals={wizard.state.selectedMeals}
          onToggleMeal={wizard.toggleMeal}
          onSelectAllMeals={wizard.selectAllMeals}
          onBack={() => wizard.goToStep(1)}
          onNext={() => {
            wizard.goToStep(3);
            wizard.generateShoppingListPreview();
          }}
        />
      )}

      {wizard.state.currentStep === 2 && wizard.state.mode === "recipes" && (
        <Step2b_RecipesSelection
          selectedRecipes={wizard.state.selectedRecipes}
          onToggleRecipe={wizard.toggleRecipe}
          onBack={() => wizard.goToStep(1)}
          onNext={() => {
            wizard.goToStep(3);
            wizard.generateShoppingListPreview();
          }}
        />
      )}

      {wizard.state.currentStep === 3 && (
        <Step3_Generation status={wizard.state.generationStatus} progress={wizard.state.generationProgress} />
      )}

      {wizard.state.currentStep === 4 && (
        <Step4_PreviewEdit
          items={wizard.state.modifiedItems}
          metadata={wizard.state.previewMetadata}
          onUpdateItem={wizard.updateItem}
          onRemoveItem={wizard.removeItem}
          onAddItem={wizard.addItem}
          onBack={() => wizard.goToStep(2)}
          onCancel={() => (window.location.href = "/shopping-lists")}
          onSave={wizard.saveList}
        />
      )}
    </div>
  );
}

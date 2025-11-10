/**
 * Instructions Section - sekcja z instrukcjami przepisu
 * Wyświetla instrukcje z zachowaniem formatowania (newlines)
 */

interface InstructionsSectionProps {
  instructions: string;
}

/**
 * InstructionsSection
 * Sekcja z instrukcjami wyświetlana jako paragraph z zachowaniem formatowania
 */
export function InstructionsSection({
  instructions,
}: InstructionsSectionProps) {
  return (
    <section className="instructions-section" aria-labelledby="instructions-heading">
      <h2
        id="instructions-heading"
        className="text-2xl font-semibold text-gray-900 mb-4"
      >
        Instrukcje
      </h2>

      <p className="whitespace-pre-wrap leading-relaxed text-gray-800">
        {instructions}
      </p>
    </section>
  );
}

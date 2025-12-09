/**
 * Form Header Component
 * Header with breadcrumbs and title for recipe form
 */
import { memo } from "react";

/**
 * Breadcrumbs Component
 * Simple breadcrumbs navigation
 */
const Breadcrumbs = memo<{ items: { label: string; href: string }[] }>(({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm text-gray-600">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-400">/</span>}
            {index === items.length - 1 ? (
              <span className="text-gray-900 font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              <a href={item.href} className="hover:text-blue-600 transition-colors">
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
});

Breadcrumbs.displayName = "Breadcrumbs";

interface FormHeaderProps {
  mode?: "create" | "edit";
  recipeName?: string;
}

/**
 * Form Header Component
 * Displays breadcrumbs and page title
 */
export const FormHeader = memo<FormHeaderProps>(({ mode = "create", recipeName }) => {
  const isEdit = mode === "edit";
  const truncatedName = recipeName && recipeName.length > 30 ? `${recipeName.slice(0, 30)}...` : recipeName;

  return (
    <div className="form-header mb-8">
      <Breadcrumbs
        items={[
          { label: "Przepisy", href: "/recipes" },
          isEdit
            ? { label: truncatedName || "Edytuj przepis", href: "" }
            : { label: "Dodaj przepis", href: "/recipes/new" },
        ]}
      />

      <h1 className="text-3xl font-bold text-gray-900">{isEdit ? "Edytuj przepis" : "Dodaj nowy przepis"}</h1>
      <p className="text-gray-600 mt-2">
        {isEdit
          ? "Wprowadź zmiany w poniższym formularzu"
          : "Wypełnij poniższy formularz, aby dodać nowy przepis do swojej kolekcji"}
      </p>
    </div>
  );
});

FormHeader.displayName = "FormHeader";

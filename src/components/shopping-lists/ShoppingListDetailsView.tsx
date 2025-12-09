/**
 * ShoppingListDetailsView - główny kontener zarządzający fetchem, mutacjami i modali
 */
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingListHeader } from "./ShoppingListHeader";
import { ShoppingListDetailsContent } from "./ShoppingListDetailsContent";
import { ShoppingListDetailsSkeleton } from "./ShoppingListDetailsSkeleton";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { PDFPreviewModal } from "./PDFPreviewModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateShoppingListTXT, downloadTXT, generateFilename } from "@/lib/utils/export";
import type { ShoppingListResponseDto } from "@/types";

interface ShoppingListDetailsViewProps {
  listId: string;
}

export function ShoppingListDetailsView({ listId }: ShoppingListDetailsViewProps) {
  const queryClient = useQueryClient();

  // Local state for modals
  const [pdfModalOpen, setPDFModalOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Fetch shopping list with items
  const {
    data: shoppingList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shopping-list", listId],
    queryFn: async () => {
      const response = await fetch(`/api/shopping-lists/${listId}`);

      if (response.status === 404) {
        throw new Error("Shopping list not found");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch shopping list");
      }

      return response.json() as Promise<ShoppingListResponseDto>;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Toggle item mutation with optimistic update
  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) => {
      const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_checked: isChecked }),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      return response.json();
    },
    onMutate: async ({ itemId, isChecked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["shopping-list", listId] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<ShoppingListResponseDto>(["shopping-list", listId]);

      // Optimistically update
      queryClient.setQueryData<ShoppingListResponseDto>(["shopping-list", listId], (old) => {
        if (!old) return old;

        return {
          ...old,
          items: old.items.map((item) => (item.id === itemId ? { ...item, is_checked: isChecked } : item)),
        };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["shopping-list", listId], context.previous);
      }

      toast.error("Nie udało się zaktualizować składnika");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["shopping-list", listId] });
    },
  });

  // Handler for toggle item
  const handleToggleItem = (itemId: string, currentChecked: boolean) => {
    toggleItemMutation.mutate({ itemId, isChecked: !currentChecked });
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete shopping list");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
      toast.success("Lista zakupów usunięta");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się usunąć listy");
    },
  });

  // Handle navigation after successful delete
  React.useEffect(() => {
    if (deleteMutation.isSuccess) {
      window.location.href = "/shopping-lists";
    }
  }, [deleteMutation.isSuccess]);

  // Handler for delete
  const handleDelete = () => {
    deleteMutation.mutate();
  };

  // Handler for TXT export
  const handleExportTXT = () => {
    if (!shoppingList) return;

    try {
      const content = generateShoppingListTXT(shoppingList);
      const filename = generateFilename(shoppingList.name, "txt");
      downloadTXT(content, filename);
      toast.success("Lista wyeksportowana do TXT");
    } catch (error) {
      console.error("Error exporting TXT:", error);
      toast.error("Nie udało się wyeksportować listy");
    }
  };

  // Loading state
  if (isLoading) {
    return <ShoppingListDetailsSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>
            {error instanceof Error && error.message === "Shopping list not found"
              ? "Lista zakupów nie została znaleziona"
              : "Nie udało się załadować listy zakupów"}
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <a href="/shopping-lists">Powrót do list zakupów</a>
        </Button>
      </div>
    );
  }

  // No data state (shouldn't happen, but defensive coding)
  if (!shoppingList) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Brak danych</AlertTitle>
          <AlertDescription>Lista zakupów nie została znaleziona</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <a href="/shopping-lists">Powrót do list zakupów</a>
        </Button>
      </div>
    );
  }

  // Success state
  return (
    <div className="shopping-list-details-view">
      <ShoppingListHeader
        list={shoppingList}
        onExportPDF={() => setPDFModalOpen(true)}
        onExportTXT={handleExportTXT}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      <ShoppingListDetailsContent list={shoppingList} onToggleItem={handleToggleItem} />

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        listId={shoppingList.id}
        listName={shoppingList.name}
        isDeleting={deleteMutation.isPending}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />

      {/* PDF preview modal */}
      {pdfModalOpen && (
        <PDFPreviewModal isOpen={pdfModalOpen} onClose={() => setPDFModalOpen(false)} list={shoppingList} />
      )}
    </div>
  );
}

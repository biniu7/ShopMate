/**
 * ShoppingListsHistoryView - Main container
 * Manages fetching shopping lists, delete dialog state, and pagination
 */

import React from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingListsHeader } from "./ShoppingListsHeader";
import { ShoppingListsGrid } from "./ShoppingListsGrid";
import { EmptyState } from "./EmptyState";
import { ShoppingListsGridSkeleton } from "./ShoppingListsGridSkeleton";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PaginatedResponse, ShoppingListListItemDto } from "@/types";

interface DeleteDialogState {
  isOpen: boolean;
  listId: string | null;
  listName: string | null;
}

interface ShoppingListsPageResponse {
  data: ShoppingListListItemDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  nextPage: number | undefined;
}

export function ShoppingListsHistoryView() {
  const queryClient = useQueryClient();
  const [deleteDialog, setDeleteDialog] = React.useState<DeleteDialogState>({
    isOpen: false,
    listId: null,
    listName: null,
  });

  // Infinite query for shopping lists
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ["shopping-lists", "list"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/shopping-lists?page=${pageParam}&limit=20`);

      if (!response.ok) {
        throw new Error("Failed to fetch shopping lists");
      }

      const result: PaginatedResponse<ShoppingListListItemDto> = await response.json();

      return {
        data: result.data,
        pagination: result.pagination,
        nextPage: result.pagination.page < result.pagination.total_pages ? result.pagination.page + 1 : undefined,
      } as ShoppingListsPageResponse;
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 2 * 60 * 1000, // 2 minutes
    initialPageParam: 1,
  });

  // Flatten pages
  const shoppingLists = React.useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (listId: string) => {
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
      toast.success("Lista usunięta");
      closeDeleteDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się usunąć listy");
    },
  });

  const openDeleteDialog = React.useCallback((listId: string, listName: string) => {
    setDeleteDialog({ isOpen: true, listId, listName });
  }, []);

  const closeDeleteDialog = React.useCallback(() => {
    setDeleteDialog({ isOpen: false, listId: null, listName: null });
  }, []);

  const handleDelete = React.useCallback(() => {
    if (deleteDialog.listId) {
      deleteMutation.mutate(deleteDialog.listId);
    }
  }, [deleteDialog.listId, deleteMutation]);

  return (
    <div className="shopping-lists-history-view">
      <ShoppingListsHeader />

      {isLoading && <ShoppingListsGridSkeleton />}

      {error && (
        <div className="container mx-auto p-4">
          <Alert variant="destructive">
            <AlertDescription>Nie udało się załadować list zakupów. Spróbuj odświeżyć stronę.</AlertDescription>
          </Alert>
        </div>
      )}

      {!isLoading && !error && shoppingLists.length === 0 && <EmptyState />}

      {!isLoading && !error && shoppingLists.length > 0 && (
        <ShoppingListsGrid
          shoppingLists={shoppingLists}
          onDelete={openDeleteDialog}
          hasNextPage={hasNextPage ?? false}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      )}

      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        listId={deleteDialog.listId}
        listName={deleteDialog.listName}
        isDeleting={deleteMutation.isPending}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
      />
    </div>
  );
}

# Plan implementacji widoku Shopping List Details

## 1. Przegląd

Widok Shopping List Details wyświetla szczegóły zapisanej listy zakupów wraz z możliwością zaznaczania kupionych składników oraz eksportu do PDF lub TXT. Składniki są pogrupowane po kategoriach (7 kategorii w stałej kolejności) i wyświetlane w collapsible accordion. Każdy składnik ma checkbox umożliwiający oznaczenie jako kupiony (optimistic update z TanStack Query).

**Główne funkcjonalności:**

- Wyświetlanie składników pogrupowanych po kategoriach
- Zaznaczanie składników jako kupione (checkbox toggle z optimistic update)
- Eksport do PDF z preview modal
- Eksport do TXT (direct download)
- Usuwanie listy (dialog potwierdzenia)
- Checked items z line-through i muted color

Po zaznaczeniu składnika zmiana jest natychmiast widoczna (optimistic UI) i synchronizowana z API w tle. Eksport PDF otwiera preview modal, eksport TXT pobiera plik bezpośrednio.

## 2. Routing widoku

**Ścieżka:** `/shopping-lists/[id]` (dynamic route)

**URL Parameters:**

- `id` - UUID listy zakupów

**Typ:** Strona Astro z dynamicznym komponentem React (client:load)

**Zabezpieczenia:**

- Middleware sprawdza autentykację
- RLS zapewnia dostęp tylko do list zalogowanego użytkownika
- 404 jeśli lista nie istnieje lub nie należy do użytkownika

## 3. Struktura komponentów

```
src/pages/shopping-lists/[id].astro (Astro page)
└── ShoppingListDetailsView.tsx (React component, client:load)
    ├── ShoppingListHeader.tsx (sticky top)
    │   ├── Breadcrumbs ("Listy zakupów > [nazwa]")
    │   ├── ExportButtons
    │   │   ├── ExportPDFButton → open PDFPreviewModal
    │   │   └── ExportTXTButton → direct download
    │   └── DeleteButton → open DeleteDialog
    ├── ShoppingListDetailsContent.tsx
    │   ├── ListTitle (h1)
    │   ├── ListMeta (dates, creation info)
    │   └── CategoriesAccordion
    │       └── CategorySection × 7 (collapsible)
    │           ├── CategoryHeader (name + count)
    │           └── IngredientItem × n
    │               ├── Checkbox (toggle optimistic)
    │               └── IngredientText (qty, unit, name)
    ├── PDFPreviewModal (lazy loaded)
    │   ├── PDFPreview (iframe)
    │   └── DownloadButton
    ├── DeleteConfirmationDialog
    └── ShoppingListDetailsSkeleton
```

## 4. Szczegóły komponentów

### 4.1. ShoppingListDetailsView (Główny kontener)

**Opis:**
Główny kontener zarządzający fetchem listy zakupów, stanem modali oraz exportem.

**Główne elementy:**

```tsx
<div className="shopping-list-details-view">
  {isLoading && <ShoppingListDetailsSkeleton />}

  {error && <ErrorMessage error={error} />}

  {shoppingList && (
    <>
      <ShoppingListHeader
        list={shoppingList}
        onExportPDF={() => setPDFModalOpen(true)}
        onExportTXT={handleExportTXT}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      <ShoppingListDetailsContent list={shoppingList} onToggleItem={handleToggleItem} />

      <PDFPreviewModal isOpen={pdfModalOpen} onClose={() => setPDFModalOpen(false)} list={shoppingList} />

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        listId={shoppingList.id}
        listName={shoppingList.name}
        onClose={() => setDeleteDialogOpen(false)}
      />
    </>
  )}
</div>
```

**Obsługiwane interakcje:**

- Fetch shopping list details
- Toggle item checkbox (optimistic update)
- Export PDF (modal preview)
- Export TXT (direct download)
- Delete list (dialog → mutation)

**Propsy:**

```typescript
interface ShoppingListDetailsViewProps {
  listId: string; // z URL params
}
```

### 4.2. ShoppingListHeader

**Opis:**
Sticky header z breadcrumbs i przyciskami akcji.

**Główne elementy:**

```tsx
<header className="shopping-list-header sticky top-0 bg-white z-10 border-b shadow-sm">
  <div className="container mx-auto p-4">
    <Breadcrumbs
      items={[
        { label: "Listy zakupów", href: "/shopping-lists" },
        { label: list.name, href: `/shopping-lists/${list.id}`, truncate: 40 },
      ]}
    />

    <div className="flex flex-wrap gap-3 mt-4">
      <Button onClick={onExportPDF} variant="default">
        <FileText className="h-4 w-4 mr-2" />
        Eksportuj PDF
      </Button>

      <Button onClick={onExportTXT} variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Eksportuj TXT
      </Button>

      <Button onClick={onDelete} variant="destructive">
        <Trash2 className="h-4 w-4 mr-2" />
        Usuń listę
      </Button>

      <Button asChild variant="ghost">
        <Link href="/shopping-lists">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Powrót
        </Link>
      </Button>
    </div>
  </div>
</header>
```

**Obsługiwane interakcje:**

- Click "Eksportuj PDF" → onExportPDF (open modal)
- Click "Eksportuj TXT" → onExportTXT (direct download)
- Click "Usuń listę" → onDelete (open dialog)
- Click "Powrót" → nawigacja do `/shopping-lists`

**Propsy:**

```typescript
interface ShoppingListHeaderProps {
  list: ShoppingListResponseDto;
  onExportPDF: () => void;
  onExportTXT: () => void;
  onDelete: () => void;
}
```

### 4.3. ShoppingListDetailsContent

**Opis:**
Główna zawartość z tytułem, meta informacjami oraz accordion z kategoriami składników.

**Główne elementy:**

```tsx
<div className="shopping-list-details-content container mx-auto max-w-4xl p-4">
  <h1 className="text-4xl font-bold text-gray-900 mb-2">{list.name}</h1>

  <ListMeta createdAt={list.created_at} weekStartDate={list.week_start_date} />

  <div className="mt-8">
    <CategoriesAccordion items={list.items} onToggleItem={onToggleItem} />
  </div>
</div>
```

**Propsy:**

```typescript
interface ShoppingListDetailsContentProps {
  list: ShoppingListResponseDto;
  onToggleItem: (itemId: string, currentChecked: boolean) => void;
}
```

### 4.4. ListMeta

**Opis:**
Metadane listy (data utworzenia, zakres tygodnia).

**Główne elementy:**

```tsx
<div className="list-meta flex flex-wrap gap-4 text-sm text-gray-600">
  <div className="flex items-center gap-1">
    <Clock className="h-3 w-3" />
    <span>Utworzono: {format(new Date(createdAt), "d MMMM yyyy, HH:mm", { locale: pl })}</span>
  </div>

  {weekStartDate && (
    <div className="flex items-center gap-1">
      <Calendar className="h-3 w-3" />
      <span>{formatWeekRange(weekStartDate)}</span>
    </div>
  )}
</div>
```

**Propsy:**

```typescript
interface ListMetaProps {
  createdAt: string;
  weekStartDate: string | null;
}
```

### 4.5. CategoriesAccordion

**Opis:**
Accordion z kategoriami składników. Tylko niepuste kategorie są wyświetlane.

**Główne elementy:**

```tsx
<Accordion type="multiple" defaultValue={CATEGORY_ORDER} className="space-y-2">
  {CATEGORY_ORDER.map((category) => {
    const categoryItems = items
      .filter((item) => item.category === category)
      .sort((a, b) => a.sort_order - b.sort_order);

    if (categoryItems.length === 0) return null;

    return (
      <AccordionItem key={category} value={category}>
        <AccordionTrigger className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{category}</span>
            <Badge variant="secondary">{categoryItems.length}</Badge>
          </div>
        </AccordionTrigger>

        <AccordionContent className="pt-4 space-y-2">
          {categoryItems.map((item) => (
            <IngredientItem key={item.id} item={item} onToggle={() => onToggleItem(item.id, item.is_checked)} />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  })}
</Accordion>
```

**Propsy:**

```typescript
interface CategoriesAccordionProps {
  items: ShoppingListItemDto[];
  onToggleItem: (itemId: string, currentChecked: boolean) => void;
}
```

### 4.6. IngredientItem

**Opis:**
Pojedynczy składnik z checkbox i tekstem. Checked state: line-through + muted color.

**Główne elementy:**

```tsx
<div
  className={cn(
    "ingredient-item flex items-center gap-3 p-3 border rounded-lg transition",
    item.is_checked && "bg-gray-50"
  )}
>
  <Checkbox
    id={`item-${item.id}`}
    checked={item.is_checked}
    onCheckedChange={() => onToggle()}
    className="h-6 w-6" // Large touch target
    aria-label={`Zaznacz składnik: ${item.ingredient_name}`}
  />

  <Label
    htmlFor={`item-${item.id}`}
    className={cn("flex-1 cursor-pointer", item.is_checked && "line-through text-gray-500")}
  >
    <span className="flex items-baseline gap-2">
      {item.quantity && <strong className="text-gray-900">{item.quantity}</strong>}
      {item.unit && <span className="text-gray-600">{item.unit}</span>}
      <span>{item.ingredient_name}</span>
    </span>
  </Label>
</div>
```

**Obsługiwane interakcje:**

- Click checkbox → toggle is_checked (optimistic update)
- Click label → toggle checkbox
- Touch-friendly (min 44px target)

**Propsy:**

```typescript
interface IngredientItemProps {
  item: ShoppingListItemDto;
  onToggle: () => void;
}
```

### 4.7. PDFPreviewModal

**Opis:**
Modal z preview wygenerowanego PDF przed pobraniem. Lazy loaded.

**Główne elementy:**

```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-4xl h-[90vh]">
    <DialogHeader>
      <DialogTitle>Podgląd PDF</DialogTitle>
      <DialogDescription>Sprawdź PDF przed pobraniem</DialogDescription>
    </DialogHeader>

    <div className="flex-1 overflow-hidden">
      {isGeneratingPDF ? (
        <div className="flex items-center justify-center h-full">
          <Spinner className="h-8 w-8 mr-3" />
          <span>Generuję PDF...</span>
        </div>
      ) : (
        <iframe src={pdfBlobUrl} className="w-full h-full border-0" title="PDF Preview" />
      )}
    </div>

    <DialogFooter>
      <Button variant="ghost" onClick={onClose}>
        Anuluj
      </Button>
      <Button onClick={handleDownload} disabled={!pdfBlobUrl}>
        <Download className="h-4 w-4 mr-2" />
        Pobierz PDF
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Generowanie PDF:**

```typescript
import { pdf } from '@react-pdf/renderer';
import { ShoppingListPDFDocument } from '@/lib/pdf-export';

React.useEffect(() => {
  if (isOpen) {
    setIsGeneratingPDF(true);

    (async () => {
      try {
        const doc = <ShoppingListPDFDocument list={list} />;
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);

        setPDFBlobUrl(url);
      } catch (error) {
        toast.error('Nie udało się wygenerować PDF');
      } finally {
        setIsGeneratingPDF(false);
      }
    })();

    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }
}, [isOpen]);
```

**Propsy:**

```typescript
interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: ShoppingListResponseDto;
}
```

### 4.8. ShoppingListPDFDocument (PDF generator)

**Opis:**
React component używający @react-pdf/renderer do generowania PDF.

**Implementacja:**

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  subheader: {
    fontSize: 12,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: 15,
    marginBottom: 8,
    borderBottom: "1px solid #ccc",
    paddingBottom: 4,
  },
  item: {
    fontSize: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  checkbox: {
    width: 12,
    height: 12,
    marginRight: 8,
    border: "1px solid #333",
  },
  itemText: {
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: "#999",
    textAlign: "center",
  },
});

export function ShoppingListPDFDocument({ list }: { list: ShoppingListResponseDto }) {
  const groupedItems = groupByCategory(list.items);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Lista zakupów - {list.name}</Text>
        <Text style={styles.subheader}>
          Wygenerowano: {format(new Date(), "d MMMM yyyy, HH:mm", { locale: pl })}
          {list.week_start_date && ` • ${formatWeekRange(list.week_start_date)}`}
        </Text>

        {CATEGORY_ORDER.map((category) => {
          const items = groupedItems[category];
          if (!items || items.length === 0) return null;

          return (
            <View key={category}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.item}>
                  <View style={styles.checkbox} />
                  <Text style={styles.itemText}>
                    {item.quantity && `${item.quantity} `}
                    {item.unit && `${item.unit} `}
                    {item.ingredient_name}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}

        <Text style={styles.footer}>Wygenerowano przez ShopMate • {new URL(window.location.href).origin}</Text>
      </Page>
    </Document>
  );
}
```

### 4.9. TXT Export (utility function)

**Implementacja:**

```typescript
export function generateShoppingListTXT(list: ShoppingListResponseDto): string {
  const lines: string[] = [];

  // Header
  lines.push("=".repeat(50));
  lines.push("LISTA ZAKUPÓW SHOPMATE");
  lines.push("=".repeat(50));
  lines.push("");
  lines.push(`Nazwa: ${list.name}`);
  lines.push(`Data utworzenia: ${format(new Date(list.created_at), "d MMMM yyyy, HH:mm", { locale: pl })}`);

  if (list.week_start_date) {
    lines.push(`Tydzień: ${formatWeekRange(list.week_start_date)}`);
  }

  lines.push("");
  lines.push("=".repeat(50));
  lines.push("");

  // Categories
  const groupedItems = groupByCategory(list.items);

  CATEGORY_ORDER.forEach((category) => {
    const items = groupedItems[category];
    if (!items || items.length === 0) return;

    lines.push(category.toUpperCase());
    lines.push("-".repeat(20));

    items.forEach((item) => {
      const parts: string[] = [];
      if (item.quantity) parts.push(String(item.quantity));
      if (item.unit) parts.push(item.unit);
      parts.push(item.ingredient_name);

      lines.push(`☐ ${parts.join(" ")}`);
    });

    lines.push("");
  });

  // Footer
  lines.push("=".repeat(50));
  lines.push(`Wygenerowano: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: pl })}`);
  lines.push("=".repeat(50));

  return lines.join("\n");
}

export function downloadTXT(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

**Handler w component:**

```typescript
const handleExportTXT = () => {
  try {
    const content = generateShoppingListTXT(shoppingList);
    const filename = generateFilename(shoppingList.name, "txt");
    downloadTXT(content, filename);
    toast.success("Lista wyeksportowana do TXT");
  } catch (error) {
    toast.error("Nie udało się wyeksportować listy");
  }
};
```

### 4.10. DeleteConfirmationDialog

**Opis:**
Dialog potwierdzający usunięcie listy.

**Główne elementy:**

```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Usuń listę zakupów?</DialogTitle>
      <DialogDescription>
        Czy na pewno chcesz usunąć listę &quot;{listName}&quot;? Ta operacja jest nieodwracalna.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <Button variant="ghost" onClick={onClose} disabled={deleteMutation.isLoading}>
        Anuluj
      </Button>
      <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isLoading}>
        {deleteMutation.isLoading ? (
          <>
            <Spinner className="h-4 w-4 mr-2" />
            Usuwanie...
          </>
        ) : (
          "Usuń listę"
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Delete mutation:**

```typescript
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
    queryClient.invalidateQueries(["shopping-lists"]);
    toast.success("Lista usunięta");
    router.push("/shopping-lists");
  },
  onError: (error: Error) => {
    toast.error(error.message || "Nie udało się usunąć listy");
  },
});
```

**Propsy:**

```typescript
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  listId: string;
  listName: string;
  onClose: () => void;
}
```

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
export interface ShoppingListResponseDto extends ShoppingList {
  items: ShoppingListItemDto[];
}

export type ShoppingListItemDto = ShoppingListItem;

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  week_start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  category: IngredientCategory;
  is_checked: boolean;
  sort_order: number;
}

export interface UpdateShoppingListItemDto {
  is_checked: boolean;
}
```

### 5.2. Utility types

```typescript
/**
 * Grouped items by category
 */
export type GroupedItems = Record<IngredientCategory, ShoppingListItemDto[]>;

/**
 * Helper function to group items
 */
export function groupByCategory(items: ShoppingListItemDto[]): GroupedItems {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as GroupedItems);
}

/**
 * Generate filename for export
 */
export function generateFilename(listName: string, extension: "pdf" | "txt"): string {
  const sanitized = listName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const date = format(new Date(), "yyyy-MM-dd");

  return `${sanitized}-${date}.${extension}`;
}
```

## 6. Zarządzanie stanem

### 6.1. TanStack Query dla fetch shopping list

```typescript
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
```

### 6.2. Optimistic update dla checkbox toggle

```typescript
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
    await queryClient.cancelQueries(["shopping-list", listId]);

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
    queryClient.invalidateQueries(["shopping-list", listId]);
  },
});

const handleToggleItem = (itemId: string, currentChecked: boolean) => {
  toggleItemMutation.mutate({ itemId, isChecked: !currentChecked });
};
```

### 6.3. Local state dla modali

```typescript
const [pdfModalOpen, setPDFModalOpen] = React.useState(false);
const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
```

## 7. Integracja API

### 7.1. GET /api/shopping-lists/:id

**Request:**

```
GET /api/shopping-lists/850e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**

```typescript
ShoppingListResponseDto
{
  id: "850e8400-e29b-41d4-a716-446655440000",
  user_id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Lista zakupów - Tydzień 20-26 stycznia",
  week_start_date: "2025-01-20",
  created_at: "2025-01-26T14:00:00Z",
  updated_at: "2025-01-26T14:00:00Z",
  items: [
    {
      id: "950e8400-e29b-41d4-a716-446655440000",
      shopping_list_id: "850e8400-e29b-41d4-a716-446655440000",
      ingredient_name: "spaghetti",
      quantity: 1500,
      unit: "g",
      category: "Pieczywo",
      is_checked: false,
      sort_order: 0
    }
    // ... items sorted by category, sort_order, name
  ]
}
```

**Sortowanie items:**

1. Category (fixed order: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne)
2. sort_order within category
3. Alphabetically by ingredient_name (case-insensitive)

### 7.2. PATCH /api/shopping-lists/:list_id/items/:item_id

**Request:**

```
PATCH /api/shopping-lists/850e8400-e29b-41d4-a716-446655440000/items/950e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "is_checked": true
}
```

**Response (200 OK):**

```typescript
ShoppingListItemDto
{
  id: "950e8400-e29b-41d4-a716-446655440000",
  shopping_list_id: "850e8400-e29b-41d4-a716-446655440000",
  ingredient_name: "spaghetti",
  quantity: 1500,
  unit: "g",
  category: "Pieczywo",
  is_checked: true, // UPDATED
  sort_order: 0
}
```

### 7.3. DELETE /api/shopping-lists/:id

**Request:**

```
DELETE /api/shopping-lists/850e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**

```json
{
  "message": "Shopping list deleted successfully"
}
```

## 8. Interakcje użytkownika

### 8.1. Przeglądanie listy zakupów

**Przepływ:**

1. User wchodzi na `/shopping-lists/:id`
2. Fetch shopping list z items
3. Grupowanie items po kategoriach
4. Renderowanie accordion (all open by default)
5. User może collapse/expand kategorie

### 8.2. Zaznaczanie składnika jako kupiony

**Przepływ:**

1. User klika checkbox przy składniku
2. Optimistic update → natychmiastowa zmiana UI (line-through + muted)
3. PATCH request w tle
4. Success → brak action (już zaktualizowane)
5. Error → rollback + toast "Nie udało się zaktualizować"

### 8.3. Eksport do PDF

**Przepływ:**

1. User klika "Eksportuj PDF"
2. PDFPreviewModal otwiera się
3. Loading state "Generuję PDF..."
4. @react-pdf/renderer generuje PDF blob
5. Iframe z preview
6. User klika "Pobierz PDF" → download
7. Filename: `{lista-nazwa}-2025-01-26.pdf`

### 8.4. Eksport do TXT

**Przepływ:**

1. User klika "Eksportuj TXT"
2. generateShoppingListTXT() → plaintext string
3. Blob creation + download (direct, no preview)
4. Filename: `{lista-nazwa}-2025-01-26.txt`
5. Toast "Lista wyeksportowana do TXT"

### 8.5. Usuwanie listy

**Przepływ:**

1. User klika "Usuń listę"
2. DeleteConfirmationDialog otwiera się
3. User klika "Usuń listę" → DELETE mutation
4. Success → invalidate queries + toast + redirect do `/shopping-lists`

## 9. Warunki i walidacja

### 9.1. Show week range (conditional)

```typescript
{list.week_start_date && (
  <span>{formatWeekRange(list.week_start_date)}</span>
)}
```

### 9.2. Empty categories (hide)

```typescript
{
  CATEGORY_ORDER.map((category) => {
    const items = groupedItems[category];
    if (!items || items.length === 0) return null;
    // ... render category
  });
}
```

### 9.3. Checked state styling

```typescript
className={cn(
  "item-text",
  item.is_checked && "line-through text-gray-500"
)}
```

### 9.4. Filename sanitization

```typescript
const sanitized = listName
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^a-z0-9-]/g, "");
```

## 10. Obsługa błędów

### 10.1. Shopping list not found (404)

- Error page "Lista nie znaleziona"
- Link "Powrót do list zakupów"

### 10.2. Toggle item failed

- Optimistic rollback (UI wraca do poprzedniego stanu)
- Toast: "Nie udało się zaktualizować składnika"

### 10.3. PDF generation failed

- Toast: "Nie udało się wygenerować PDF"
- Modal pozostaje pusty lub zamyka się

### 10.4. TXT export failed

- Toast: "Nie udało się wyeksportować listy"
- Brak download

### 10.5. Delete failed

- Toast: "Nie udało się usunąć listy"
- Dialog pozostaje otwarty
- User może spróbować ponownie

## 11. Kroki implementacji

### Krok 1: Struktura plików

```
src/
├── pages/
│   └── shopping-lists/
│       └── [id].astro
├── components/
│   └── shopping-lists/
│       ├── ShoppingListDetailsView.tsx
│       ├── ShoppingListHeader.tsx
│       ├── ShoppingListDetailsContent.tsx
│       ├── ListMeta.tsx
│       ├── CategoriesAccordion.tsx
│       ├── IngredientItem.tsx
│       ├── PDFPreviewModal.tsx
│       ├── DeleteConfirmationDialog.tsx
│       └── ShoppingListDetailsSkeleton.tsx
└── lib/
    ├── pdf-export/
    │   └── ShoppingListPDFDocument.tsx
    └── txt-export/
        └── generate-txt.ts
```

### Krok 2: useQuery dla fetch shopping list

### Krok 3: useMutation dla toggle item (optimistic update)

### Krok 4: useMutation dla delete

### Krok 5: Implementacja CategoriesAccordion + IngredientItem

### Krok 6: PDF export z @react-pdf/renderer

### Krok 7: TXT export (plaintext generation)

### Krok 8: PDFPreviewModal z iframe

### Krok 9: Stylowanie (large checkboxes, line-through)

### Krok 10: Testy (optimistic updates, export functions)

---

**Koniec planu implementacji widoku Shopping List Details**

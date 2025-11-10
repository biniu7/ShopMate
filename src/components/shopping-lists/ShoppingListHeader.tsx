/**
 * ShoppingListHeader - sticky header z breadcrumbs i przyciskami akcji
 */
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FileText, Download, Trash2, ArrowLeft } from "lucide-react";
import type { ShoppingListResponseDto } from "@/types";

interface ShoppingListHeaderProps {
  list: ShoppingListResponseDto;
  onExportPDF: () => void;
  onExportTXT: () => void;
  onDelete: () => void;
}

export function ShoppingListHeader({ list, onExportPDF, onExportTXT, onDelete }: ShoppingListHeaderProps) {
  // Truncate list name for breadcrumbs if too long
  const truncateName = (name: string, maxLength: number) => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength) + "...";
  };

  return (
    <header className="shopping-list-header sticky top-0 bg-white z-10 border-b shadow-sm">
      <div className="container mx-auto p-4">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/shopping-lists">Listy zakupów</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{truncateName(list.name, 40)}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Action buttons */}
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
            <a href="/shopping-lists">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

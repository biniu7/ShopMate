/**
 * PDFPreviewModal - modal z preview wygenerowanego PDF
 * Lazy loaded z iframe preview przed pobraniem
 */
import React from "react";
import { pdf } from "@react-pdf/renderer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ShoppingListPDFDocument } from "@/lib/pdf-export/ShoppingListPDFDocument";
import { generateFilename } from "@/lib/utils/export";
import type { ShoppingListResponseDto } from "@/types";

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: ShoppingListResponseDto;
}

export function PDFPreviewModal({ isOpen, onClose, list }: PDFPreviewModalProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const [pdfBlobUrl, setPDFBlobUrl] = React.useState<string | null>(null);

  // Generate PDF when modal opens
  React.useEffect(() => {
    if (!isOpen) {
      setPDFBlobUrl(null);
      return;
    }

    setIsGeneratingPDF(true);

    (async () => {
      try {
        const doc = <ShoppingListPDFDocument list={list} />;
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);

        setPDFBlobUrl(url);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error generating PDF:", error);
        toast.error("Nie udało się wygenerować PDF");
        onClose();
      } finally {
        setIsGeneratingPDF(false);
      }
    })();
  }, [isOpen, list, onClose]);

  // Cleanup blob URL when it changes or on unmount
  React.useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Handle download
  const handleDownload = () => {
    if (!pdfBlobUrl) return;

    const filename = generateFilename(list.name, "pdf");
    const link = document.createElement("a");
    link.href = pdfBlobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("PDF pobrano pomyślnie");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Podgląd PDF</DialogTitle>
          <DialogDescription>Sprawdź PDF przed pobraniem</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isGeneratingPDF ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 mr-3 animate-spin" />
              <span>Generuję PDF...</span>
            </div>
          ) : pdfBlobUrl ? (
            <iframe src={pdfBlobUrl} className="w-full h-full border-0" title="PDF Preview" />
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleDownload} disabled={!pdfBlobUrl || isGeneratingPDF}>
            <Download className="h-4 w-4 mr-2" />
            Pobierz PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ShoppingListPDFDocument - PDF generator using @react-pdf/renderer
 * Generates printable shopping list with categories
 */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { formatWeekRange } from "@/lib/utils/date";
import { groupByCategory, getAllCategories } from "@/lib/utils/export";
import type { ShoppingListResponseDto } from "@/types";

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

interface ShoppingListPDFDocumentProps {
  list: ShoppingListResponseDto;
}

export function ShoppingListPDFDocument({ list }: ShoppingListPDFDocumentProps) {
  const groupedItems = groupByCategory(list.items);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.header}>Lista zakupów - {list.name}</Text>
        <Text style={styles.subheader}>
          Wygenerowano: {format(new Date(), "d MMMM yyyy, HH:mm", { locale: pl })}
          {list.week_start_date && ` • ${formatWeekRange(list.week_start_date)}`}
        </Text>

        {/* Categories */}
        {getAllCategories().map((category) => {
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

        {/* Footer */}
        <Text style={styles.footer}>Wygenerowano przez ShopMate</Text>
      </Page>
    </Document>
  );
}

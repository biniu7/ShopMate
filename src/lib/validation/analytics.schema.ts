import { z } from "zod";

/**
 * Zod schema for validating export tracking requests
 * Used in POST /api/analytics/export
 */
export const trackExportSchema = z
  .object({
    shopping_list_id: z.string().uuid({
      message: "Invalid shopping list ID format",
    }),
    format: z.enum(["pdf", "txt"], {
      errorMap: () => ({ message: "Format must be 'pdf' or 'txt'" }),
    }),
  })
  .strict();

/**
 * Type inference from trackExportSchema
 * Ensures type safety between validation and usage
 */
export type TrackExportInput = z.infer<typeof trackExportSchema>;

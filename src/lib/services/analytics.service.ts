/**
 * Analytics Service
 *
 * Handles tracking of export events for analytics purposes.
 * MVP implementation uses console logging.
 * Future: Can be extended to send data to Plausible, GA4, or custom analytics DB.
 */

interface ExportEvent {
  userId: string;
  shoppingListId: string;
  format: "pdf" | "txt";
  timestamp: string;
}

/**
 * Track export event for analytics
 *
 * @param event - Export event data to track
 * @returns Promise<void>
 *
 * @example
 * await trackExportEvent({
 *   userId: 'user-uuid',
 *   shoppingListId: 'list-uuid',
 *   format: 'pdf',
 *   timestamp: new Date().toISOString()
 * });
 */
export async function trackExportEvent(event: ExportEvent): Promise<void> {
  // MVP: Simple console logging for tracking
  // This provides visibility during development and can be monitored in production logs
  console.log("[Analytics] Export event:", {
    user: event.userId,
    list: event.shoppingListId,
    format: event.format,
    time: event.timestamp,
  });

  // Future implementation options:
  // 1. Send to analytics service (Plausible, GA4)
  // await fetch('https://analytics.example.com/events', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(event)
  // });
  //
  // 2. Store in Supabase analytics_events table
  // await supabase.from('analytics_events').insert({
  //   user_id: event.userId,
  //   event_type: 'export',
  //   event_data: { shopping_list_id: event.shoppingListId, format: event.format },
  //   created_at: event.timestamp
  // });
  //
  // 3. Send to Sentry as breadcrumb/custom event
  // Sentry.addBreadcrumb({
  //   category: 'analytics',
  //   message: 'Shopping list exported',
  //   data: event,
  //   level: 'info'
  // });
}

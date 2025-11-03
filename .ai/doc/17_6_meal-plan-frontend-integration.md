# Frontend Integration Guide: GET /api/meal-plan

## Overview

This guide provides React hooks and components for integrating the GET /api/meal-plan endpoint into your frontend application.

---

## Table of Contents

1. [React Hook: useMealPlan](#1-react-hook-usemealplan)
2. [Example Component](#2-example-component)
3. [Error Handling](#3-error-handling)
4. [Loading States](#4-loading-states)
5. [Caching Strategy](#5-caching-strategy)
6. [Helper Functions](#6-helper-functions)

---

## 1. React Hook: useMealPlan

### Basic Implementation

Create file: `src/components/hooks/useMealPlan.ts`

```typescript
import { useState, useEffect } from 'react';
import type { WeekCalendarResponseDto, ErrorResponseDto } from '@/types';

interface UseMealPlanOptions {
  enabled?: boolean; // Whether to fetch immediately
  refetchInterval?: number; // Auto-refetch interval in ms
}

interface UseMealPlanResult {
  data: WeekCalendarResponseDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching meal plan assignments for a specific week
 *
 * @param weekStartDate - ISO date string (YYYY-MM-DD) for Monday
 * @param options - Optional configuration
 * @returns Meal plan data, loading state, error, and refetch function
 *
 * @example
 * const { data, loading, error, refetch } = useMealPlan('2025-01-20');
 */
export function useMealPlan(
  weekStartDate: string,
  options: UseMealPlanOptions = {}
): UseMealPlanResult {
  const { enabled = true, refetchInterval } = options;

  const [data, setData] = useState<WeekCalendarResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMealPlan = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/meal-plan?week_start_date=${weekStartDate}`
      );

      if (!response.ok) {
        const errorData: ErrorResponseDto = await response.json();
        throw new Error(errorData.message || errorData.error);
      }

      const result: WeekCalendarResponseDto = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchMealPlan();

    // Setup auto-refetch interval if specified
    if (refetchInterval) {
      const intervalId = setInterval(fetchMealPlan, refetchInterval);
      return () => clearInterval(intervalId);
    }
  }, [weekStartDate, enabled, refetchInterval]);

  return { data, loading, error, refetch: fetchMealPlan };
}
```

---

## 2. Example Component

### MealPlanCalendar Component

Create file: `src/components/MealPlanCalendar.tsx`

```tsx
import { useMealPlan } from '@/components/hooks/useMealPlan';
import type { MealPlanAssignmentDto } from '@/types';

interface MealPlanCalendarProps {
  weekStartDate: string; // YYYY-MM-DD
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEAL_TYPES = {
  breakfast: 'Breakfast',
  second_breakfast: 'Second Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
} as const;

export function MealPlanCalendar({ weekStartDate }: MealPlanCalendarProps) {
  const { data, loading, error, refetch } = useMealPlan(weekStartDate);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading meal plan...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Error loading meal plan</h3>
        <p className="text-red-600 mt-1">{error}</p>
        <button
          onClick={refetch}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (!data || data.assignments.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No meals planned for this week</p>
        <p className="text-sm text-gray-500 mt-1">
          Week: {data?.week_start_date} - {data?.week_end_date}
        </p>
        <button
          onClick={() => {/* Navigate to add meal */}}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Meal
        </button>
      </div>
    );
  }

  // Group assignments by day
  const assignmentsByDay = data.assignments.reduce((acc, assignment) => {
    if (!acc[assignment.day_of_week]) {
      acc[assignment.day_of_week] = [];
    }
    acc[assignment.day_of_week].push(assignment);
    return acc;
  }, {} as Record<number, MealPlanAssignmentDto[]>);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Week: {data.week_start_date} - {data.week_end_date}
        </h2>
        <button
          onClick={refetch}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => (
          <div key={dayOfWeek} className="border rounded-lg p-3">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">
              {DAYS_OF_WEEK[dayOfWeek - 1]}
            </h3>

            <div className="space-y-2">
              {assignmentsByDay[dayOfWeek]?.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-blue-50 border border-blue-200 rounded p-2 text-sm"
                >
                  <div className="font-medium text-blue-900">
                    {MEAL_TYPES[assignment.meal_type]}
                  </div>
                  <div className="text-blue-700 truncate" title={assignment.recipe_name}>
                    {assignment.recipe_name}
                  </div>
                </div>
              )) || (
                <div className="text-gray-400 text-xs italic">No meals</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
        Total meals planned: {data.assignments.length}
      </div>
    </div>
  );
}
```

---

## 3. Error Handling

### Comprehensive Error Handling Hook

```typescript
import { useState, useEffect } from 'react';
import type { WeekCalendarResponseDto, ErrorResponseDto, ValidationErrorResponseDto } from '@/types';

interface ApiError {
  type: 'validation' | 'auth' | 'server' | 'network';
  message: string;
  details?: Record<string, string[]>;
}

export function useMealPlanWithErrors(weekStartDate: string) {
  const [data, setData] = useState<WeekCalendarResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/meal-plan?week_start_date=${weekStartDate}`
        );

        // Handle different error types
        if (!response.ok) {
          if (response.status === 400) {
            const errorData: ValidationErrorResponseDto = await response.json();
            setError({
              type: 'validation',
              message: 'Invalid request parameters',
              details: errorData.details,
            });
          } else if (response.status === 401) {
            setError({
              type: 'auth',
              message: 'Please log in to view your meal plan',
            });
          } else if (response.status === 500) {
            setError({
              type: 'server',
              message: 'Server error. Please try again later.',
            });
          } else {
            setError({
              type: 'server',
              message: 'An unexpected error occurred',
            });
          }
          return;
        }

        const result: WeekCalendarResponseDto = await response.json();
        setData(result);
      } catch (err) {
        setError({
          type: 'network',
          message: 'Network error. Please check your connection.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMealPlan();
  }, [weekStartDate]);

  return { data, loading, error };
}
```

### Error Display Component

```tsx
import type { ApiError } from './useMealPlanWithErrors';

interface ErrorDisplayProps {
  error: ApiError;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const errorStyles = {
    validation: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    auth: 'bg-red-50 border-red-200 text-red-800',
    server: 'bg-red-50 border-red-200 text-red-800',
    network: 'bg-orange-50 border-orange-200 text-orange-800',
  };

  const errorIcons = {
    validation: '⚠️',
    auth: '🔒',
    server: '❌',
    network: '📡',
  };

  return (
    <div className={`border rounded-lg p-4 ${errorStyles[error.type]}`}>
      <div className="flex items-start">
        <span className="text-2xl mr-2">{errorIcons[error.type]}</span>
        <div className="flex-1">
          <h3 className="font-semibold">{error.message}</h3>

          {/* Validation errors details */}
          {error.type === 'validation' && error.details && (
            <ul className="mt-2 text-sm space-y-1">
              {Object.entries(error.details).map(([field, errors]) => (
                <li key={field}>
                  <strong>{field}:</strong> {errors.join(', ')}
                </li>
              ))}
            </ul>
          )}

          {/* Auth error - redirect to login */}
          {error.type === 'auth' && (
            <a
              href="/login"
              className="inline-block mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Log In
            </a>
          )}

          {/* Other errors - show retry button */}
          {error.type !== 'auth' && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Loading States

### Skeleton Loader Component

```tsx
export function MealPlanSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <div key={day} className="border rounded-lg p-3">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="space-y-2">
              <div className="h-16 bg-gray-100 rounded"></div>
              <div className="h-16 bg-gray-100 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. Caching Strategy

### Using React Query (Recommended)

```typescript
import { useQuery } from '@tanstack/react-query';
import type { WeekCalendarResponseDto } from '@/types';

async function fetchMealPlan(weekStartDate: string): Promise<WeekCalendarResponseDto> {
  const response = await fetch(`/api/meal-plan?week_start_date=${weekStartDate}`);

  if (!response.ok) {
    throw new Error('Failed to fetch meal plan');
  }

  return response.json();
}

export function useMealPlanQuery(weekStartDate: string) {
  return useQuery({
    queryKey: ['meal-plan', weekStartDate],
    queryFn: () => fetchMealPlan(weekStartDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true,
  });
}

// Usage in component:
export function MealPlanCalendarWithQuery({ weekStartDate }: { weekStartDate: string }) {
  const { data, isLoading, error, refetch } = useMealPlanQuery(weekStartDate);

  // ... component logic
}
```

---

## 6. Helper Functions

### Date Utilities

```typescript
/**
 * Get the Monday of the week for a given date
 */
export function getWeekStartDate(date: Date): string {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Navigate to previous/next week
 */
export function addWeeks(dateString: string, weeks: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().split('T')[0];
}

// Usage example:
export function WeekNavigator({ currentWeek, onWeekChange }: {
  currentWeek: string;
  onWeekChange: (week: string) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <button onClick={() => onWeekChange(addWeeks(currentWeek, -1))}>
        ← Previous Week
      </button>
      <span className="font-semibold">
        {formatDate(currentWeek)}
      </span>
      <button onClick={() => onWeekChange(addWeeks(currentWeek, 1))}>
        Next Week →
      </button>
    </div>
  );
}
```

### Meal Type Utilities

```typescript
import type { MealType } from '@/types';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  second_breakfast: 'Second Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: '🍳',
  second_breakfast: '🥪',
  lunch: '🍽️',
  dinner: '🍲',
};

export function getMealTypeLabel(mealType: MealType): string {
  return MEAL_TYPE_LABELS[mealType] || mealType;
}

export function getMealTypeIcon(mealType: MealType): string {
  return MEAL_TYPE_ICONS[mealType] || '🍴';
}
```

---

## Complete Example: Full Page Component

```tsx
import { useState } from 'react';
import { useMealPlan } from '@/components/hooks/useMealPlan';
import { MealPlanSkeleton } from '@/components/MealPlanSkeleton';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { WeekNavigator, getWeekStartDate, addWeeks } from '@/lib/date-utils';

export function MealPlanPage() {
  const [weekStartDate, setWeekStartDate] = useState(() =>
    getWeekStartDate(new Date())
  );

  const { data, loading, error, refetch } = useMealPlan(weekStartDate);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Meal Plan</h1>

      {/* Week Navigation */}
      <WeekNavigator
        currentWeek={weekStartDate}
        onWeekChange={setWeekStartDate}
      />

      <div className="mt-8">
        {/* Loading State */}
        {loading && <MealPlanSkeleton />}

        {/* Error State */}
        {error && (
          <ErrorDisplay
            error={{ type: 'server', message: error }}
            onRetry={refetch}
          />
        )}

        {/* Success State */}
        {!loading && !error && data && (
          <MealPlanCalendar weekStartDate={weekStartDate} />
        )}
      </div>
    </div>
  );
}
```

---

## API Reference

### Request

```
GET /api/meal-plan?week_start_date=YYYY-MM-DD
```

**Query Parameters:**
- `week_start_date` (required): ISO date string (YYYY-MM-DD)

**Authentication:** Required (Supabase session cookie)

### Response

**Success (200 OK):**
```typescript
{
  week_start_date: string;
  week_end_date: string;
  assignments: MealPlanAssignmentDto[];
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized (not logged in)
- `500` - Server error

---

## Testing Frontend Integration

```typescript
// Test in browser console
async function testMealPlanAPI() {
  const response = await fetch('/api/meal-plan?week_start_date=2025-01-20');
  const data = await response.json();
  console.log(data);
}

testMealPlanAPI();
```

---

## Next Steps

1. ✅ Implement `useMealPlan` hook
2. ✅ Create `MealPlanCalendar` component
3. ✅ Add error handling
4. ✅ Implement loading states
5. ✅ Add caching with React Query (optional)
6. Test with real user data
7. Add unit tests for hooks
8. Add E2E tests for complete flow

---

## Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com)
- [ShopMate Types Reference](../../src/types.ts)
/**
 * Unit tests for date utility functions
 * Tests date calculations, formatting, and validation
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getCurrentWeekStart,
  isValidWeekDate,
  formatDateRange,
  getDayName,
  getMealTypeLabel,
  addDaysToDateString,
  subDaysFromDateString,
  getWeekEndDate,
  formatRelativeTime,
  isToday,
  isTomorrow,
  formatWeekRange,
} from "../date";

describe("date utils", () => {
  describe("getCurrentWeekStart", () => {
    beforeEach(() => {
      // Mock system date to a known Monday: January 20, 2025
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-20T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return Monday when today is Monday", () => {
      // Act
      const result = getCurrentWeekStart();

      // Assert
      expect(result).toBe("2025-01-20");
    });

    it("should return previous Monday when today is Wednesday", () => {
      // Arrange - Wednesday, January 22, 2025
      vi.setSystemTime(new Date("2025-01-22T12:00:00Z"));

      // Act
      const result = getCurrentWeekStart();

      // Assert
      expect(result).toBe("2025-01-20");
    });

    it("should return previous Monday when today is Sunday", () => {
      // Arrange - Sunday, January 26, 2025
      vi.setSystemTime(new Date("2025-01-26T12:00:00Z"));

      // Act
      const result = getCurrentWeekStart();

      // Assert
      expect(result).toBe("2025-01-20");
    });

    it("should return next Monday when crossing to new week", () => {
      // Arrange - Monday, January 27, 2025 (next week)
      vi.setSystemTime(new Date("2025-01-27T12:00:00Z"));

      // Act
      const result = getCurrentWeekStart();

      // Assert
      expect(result).toBe("2025-01-27");
    });

    it("should return result in YYYY-MM-DD format", () => {
      // Act
      const result = getCurrentWeekStart();

      // Assert
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("isValidWeekDate", () => {
    it("should return true for valid Monday date", () => {
      // Arrange
      const dateString = "2025-01-20"; // Monday

      // Act
      const result = isValidWeekDate(dateString);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for Tuesday date", () => {
      // Arrange
      const dateString = "2025-01-21"; // Tuesday

      // Act
      const result = isValidWeekDate(dateString);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for Sunday date", () => {
      // Arrange
      const dateString = "2025-01-26"; // Sunday

      // Act
      const result = isValidWeekDate(dateString);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for invalid format (DD-MM-YYYY)", () => {
      // Arrange
      const dateString = "20-01-2025";

      // Act
      const result = isValidWeekDate(dateString);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for invalid format (YYYY/MM/DD)", () => {
      // Arrange
      const dateString = "2025/01/20";

      // Act
      const result = isValidWeekDate(dateString);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for invalid date (February 30)", () => {
      // Arrange
      const dateString = "2025-02-30";

      // Act
      const result = isValidWeekDate(dateString);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for date more than 10 years in future", () => {
      // Arrange - Mock current date
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-20T12:00:00Z"));

      const dateString = "2036-01-20"; // 11 years in future (Monday)

      // Act
      const result = isValidWeekDate(dateString);

      // Assert
      expect(result).toBe(false);

      // Cleanup
      vi.useRealTimers();
    });

    it("should return true for date exactly 10 years in future", () => {
      // Arrange - Mock current date
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-20T12:00:00Z"));

      const dateString = "2035-01-15"; // ~10 years in future (Monday)

      // Act
      const result = isValidWeekDate(dateString);

      // Assert
      expect(result).toBe(true);

      // Cleanup
      vi.useRealTimers();
    });

    it("should return true for past Monday dates", () => {
      // Arrange
      const dateString = "2024-01-01"; // Monday in the past

      // Act
      const result = isValidWeekDate(dateString);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for empty string", () => {
      // Arrange
      const dateString = "";

      // Act
      const result = isValidWeekDate(dateString);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for malformed date", () => {
      // Arrange
      const dateString = "not-a-date";

      // Act
      const result = isValidWeekDate(dateString);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("formatDateRange", () => {
    it("should format same month range", () => {
      // Arrange
      const startDate = "2025-01-20"; // Monday
      const endDate = "2025-01-26"; // Sunday

      // Act
      const result = formatDateRange(startDate, endDate);

      // Assert
      expect(result).toBe("20-26 stycznia 2025");
    });

    it("should format range crossing months", () => {
      // Arrange
      const startDate = "2025-01-27"; // Monday
      const endDate = "2025-02-02"; // Sunday

      // Act
      const result = formatDateRange(startDate, endDate);

      // Assert
      expect(result).toBe("27-2 lutego 2025");
    });

    it("should format range crossing years", () => {
      // Arrange
      const startDate = "2024-12-30"; // Monday
      const endDate = "2025-01-05"; // Sunday

      // Act
      const result = formatDateRange(startDate, endDate);

      // Assert
      expect(result).toBe("30-5 stycznia 2025");
    });

    it("should use Polish month names", () => {
      // Arrange
      const startDate = "2025-03-03"; // March (Marzec in Polish)
      const endDate = "2025-03-09";

      // Act
      const result = formatDateRange(startDate, endDate);

      // Assert
      expect(result).toContain("marca");
    });
  });

  describe("getDayName", () => {
    it("should return full day name for Monday", () => {
      // Arrange
      const dayOfWeek = 1;

      // Act
      const result = getDayName(dayOfWeek);

      // Assert
      expect(result).toBe("Poniedziałek");
    });

    it("should return full day name for Sunday", () => {
      // Arrange
      const dayOfWeek = 7;

      // Act
      const result = getDayName(dayOfWeek);

      // Assert
      expect(result).toBe("Niedziela");
    });

    it("should return short day name when short=true", () => {
      // Arrange
      const dayOfWeek = 1;

      // Act
      const result = getDayName(dayOfWeek, true);

      // Assert
      expect(result).toBe("Pon");
    });

    it("should return all full day names correctly", () => {
      // Assert
      expect(getDayName(1)).toBe("Poniedziałek");
      expect(getDayName(2)).toBe("Wtorek");
      expect(getDayName(3)).toBe("Środa");
      expect(getDayName(4)).toBe("Czwartek");
      expect(getDayName(5)).toBe("Piątek");
      expect(getDayName(6)).toBe("Sobota");
      expect(getDayName(7)).toBe("Niedziela");
    });

    it("should return all short day names correctly", () => {
      // Assert
      expect(getDayName(1, true)).toBe("Pon");
      expect(getDayName(2, true)).toBe("Wt");
      expect(getDayName(3, true)).toBe("Śr");
      expect(getDayName(4, true)).toBe("Czw");
      expect(getDayName(5, true)).toBe("Pt");
      expect(getDayName(6, true)).toBe("Sob");
      expect(getDayName(7, true)).toBe("Niedz");
    });

    it("should throw error for dayOfWeek < 1", () => {
      // Arrange
      const dayOfWeek = 0;

      // Act & Assert
      expect(() => getDayName(dayOfWeek)).toThrow("Invalid dayOfWeek: 0. Must be between 1 and 7.");
    });

    it("should throw error for dayOfWeek > 7", () => {
      // Arrange
      const dayOfWeek = 8;

      // Act & Assert
      expect(() => getDayName(dayOfWeek)).toThrow("Invalid dayOfWeek: 8. Must be between 1 and 7.");
    });

    it("should throw error for negative dayOfWeek", () => {
      // Arrange
      const dayOfWeek = -1;

      // Act & Assert
      expect(() => getDayName(dayOfWeek)).toThrow();
    });
  });

  describe("getMealTypeLabel", () => {
    it("should return label for breakfast", () => {
      // Act
      const result = getMealTypeLabel("breakfast");

      // Assert
      expect(result).toBe("Śniadanie");
    });

    it("should return label for second_breakfast", () => {
      // Act
      const result = getMealTypeLabel("second_breakfast");

      // Assert
      expect(result).toBe("Drugie śniadanie");
    });

    it("should return label for lunch", () => {
      // Act
      const result = getMealTypeLabel("lunch");

      // Assert
      expect(result).toBe("Obiad");
    });

    it("should return label for dinner", () => {
      // Act
      const result = getMealTypeLabel("dinner");

      // Assert
      expect(result).toBe("Kolacja");
    });
  });

  describe("addDaysToDateString", () => {
    it("should add days within same month", () => {
      // Arrange
      const dateString = "2025-01-20";
      const daysToAdd = 5;

      // Act
      const result = addDaysToDateString(dateString, daysToAdd);

      // Assert
      expect(result).toBe("2025-01-25");
    });

    it("should add days crossing month boundary", () => {
      // Arrange
      const dateString = "2025-01-30";
      const daysToAdd = 5;

      // Act
      const result = addDaysToDateString(dateString, daysToAdd);

      // Assert
      expect(result).toBe("2025-02-04");
    });

    it("should add days crossing year boundary", () => {
      // Arrange
      const dateString = "2024-12-30";
      const daysToAdd = 5;

      // Act
      const result = addDaysToDateString(dateString, daysToAdd);

      // Assert
      expect(result).toBe("2025-01-04");
    });

    it("should handle adding 0 days", () => {
      // Arrange
      const dateString = "2025-01-20";
      const daysToAdd = 0;

      // Act
      const result = addDaysToDateString(dateString, daysToAdd);

      // Assert
      expect(result).toBe("2025-01-20");
    });

    it("should handle leap year correctly", () => {
      // Arrange - 2024 is a leap year
      const dateString = "2024-02-28";
      const daysToAdd = 1;

      // Act
      const result = addDaysToDateString(dateString, daysToAdd);

      // Assert
      expect(result).toBe("2024-02-29");
    });

    it("should return result in YYYY-MM-DD format", () => {
      // Arrange
      const dateString = "2025-01-20";
      const daysToAdd = 10;

      // Act
      const result = addDaysToDateString(dateString, daysToAdd);

      // Assert
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("subDaysFromDateString", () => {
    it("should subtract days within same month", () => {
      // Arrange
      const dateString = "2025-01-20";
      const daysToSub = 5;

      // Act
      const result = subDaysFromDateString(dateString, daysToSub);

      // Assert
      expect(result).toBe("2025-01-15");
    });

    it("should subtract days crossing month boundary", () => {
      // Arrange
      const dateString = "2025-02-03";
      const daysToSub = 5;

      // Act
      const result = subDaysFromDateString(dateString, daysToSub);

      // Assert
      expect(result).toBe("2025-01-29");
    });

    it("should subtract days crossing year boundary", () => {
      // Arrange
      const dateString = "2025-01-03";
      const daysToSub = 5;

      // Act
      const result = subDaysFromDateString(dateString, daysToSub);

      // Assert
      expect(result).toBe("2024-12-29");
    });

    it("should handle subtracting 0 days", () => {
      // Arrange
      const dateString = "2025-01-20";
      const daysToSub = 0;

      // Act
      const result = subDaysFromDateString(dateString, daysToSub);

      // Assert
      expect(result).toBe("2025-01-20");
    });

    it("should return result in YYYY-MM-DD format", () => {
      // Arrange
      const dateString = "2025-01-20";
      const daysToSub = 10;

      // Act
      const result = subDaysFromDateString(dateString, daysToSub);

      // Assert
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getWeekEndDate", () => {
    it("should return Sunday (6 days after Monday)", () => {
      // Arrange
      const weekStartDate = "2025-01-20"; // Monday

      // Act
      const result = getWeekEndDate(weekStartDate);

      // Assert
      expect(result).toBe("2025-01-26"); // Sunday
    });

    it("should handle week crossing month boundary", () => {
      // Arrange
      const weekStartDate = "2025-01-27"; // Monday

      // Act
      const result = getWeekEndDate(weekStartDate);

      // Assert
      expect(result).toBe("2025-02-02"); // Sunday in February
    });

    it("should handle week crossing year boundary", () => {
      // Arrange
      const weekStartDate = "2024-12-30"; // Monday

      // Act
      const result = getWeekEndDate(weekStartDate);

      // Assert
      expect(result).toBe("2025-01-05"); // Sunday in new year
    });
  });

  describe("formatRelativeTime", () => {
    beforeEach(() => {
      // Mock current date: January 20, 2025, 12:00 PM
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-20T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should format date from 2 days ago", () => {
      // Arrange
      const dateString = "2025-01-18T12:00:00Z"; // 2 days ago

      // Act
      const result = formatRelativeTime(dateString);

      // Assert
      expect(result).toContain("2 dni");
      expect(result).toContain("temu");
    });

    it("should format date from 1 hour ago", () => {
      // Arrange
      const dateString = "2025-01-20T11:00:00Z"; // 1 hour ago

      // Act
      const result = formatRelativeTime(dateString);

      // Assert
      expect(result).toContain("godzin"); // Can be "około godziny" or "godziną"
      expect(result).toContain("temu");
    });

    it("should use Polish locale", () => {
      // Arrange
      const dateString = "2025-01-10T12:00:00Z"; // 10 days ago

      // Act
      const result = formatRelativeTime(dateString);

      // Assert
      // Should use Polish "temu" instead of English "ago"
      expect(result).toContain("temu");
    });
  });

  describe("isToday", () => {
    beforeEach(() => {
      // Mock current date: January 20, 2025
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-20T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true for today", () => {
      // Arrange
      const date = new Date("2025-01-20T15:00:00Z");

      // Act
      const result = isToday(date);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for yesterday", () => {
      // Arrange
      const date = new Date("2025-01-19T12:00:00Z");

      // Act
      const result = isToday(date);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for tomorrow", () => {
      // Arrange
      const date = new Date("2025-01-21T12:00:00Z");

      // Act
      const result = isToday(date);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true for today at different time", () => {
      // Arrange
      const date = new Date("2025-01-20T01:00:00"); // Local time (no Z)

      // Act
      const result = isToday(date);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("isTomorrow", () => {
    beforeEach(() => {
      // Mock current date: January 20, 2025
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-20T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true for tomorrow", () => {
      // Arrange
      const date = new Date("2025-01-21T12:00:00Z");

      // Act
      const result = isTomorrow(date);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for today", () => {
      // Arrange
      const date = new Date("2025-01-20T12:00:00Z");

      // Act
      const result = isTomorrow(date);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for day after tomorrow", () => {
      // Arrange
      const date = new Date("2025-01-22T12:00:00Z");

      // Act
      const result = isTomorrow(date);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true for tomorrow at different time", () => {
      // Arrange
      const date = new Date("2025-01-21T01:00:00"); // Local time (no Z)

      // Act
      const result = isTomorrow(date);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("formatWeekRange", () => {
    it("should format week range in same month", () => {
      // Arrange
      const weekStartDate = "2025-01-20"; // Monday

      // Act
      const result = formatWeekRange(weekStartDate);

      // Assert
      expect(result).toBe("Tydzień 20-26 stycznia");
    });

    it("should format week range crossing months", () => {
      // Arrange
      const weekStartDate = "2025-01-27"; // Monday

      // Act
      const result = formatWeekRange(weekStartDate);

      // Assert
      expect(result).toBe("Tydzień 27-2 lutego");
    });

    it("should use Polish month names", () => {
      // Arrange
      const weekStartDate = "2025-06-02"; // Monday in June

      // Act
      const result = formatWeekRange(weekStartDate);

      // Assert
      expect(result).toContain("czerwca");
    });

    it("should start with 'Tydzień' prefix", () => {
      // Arrange
      const weekStartDate = "2025-01-20";

      // Act
      const result = formatWeekRange(weekStartDate);

      // Assert
      expect(result).toMatch(/^Tydzień /);
    });
  });
});

/**
 * Unit tests for calendar utility functions
 * Tests calendar cell building, grouping, and text formatting
 */
import { describe, it, expect } from "vitest";
import {
  buildCalendarCells,
  groupCellsByDay,
  truncateText,
  formatDayMealType,
  type CalendarCellViewModel,
} from "../calendar";
import type { MealPlanAssignmentDto } from "@/types";

describe("calendar utils", () => {
  describe("buildCalendarCells", () => {
    // Arrange
    const weekStartDate = "2025-01-20"; // Monday, January 20, 2025

    it("should create 28 cells (7 days × 4 meals)", () => {
      // Act
      const cells = buildCalendarCells(weekStartDate, []);

      // Assert
      expect(cells).toHaveLength(28);
    });

    it("should create cells for all days (Monday to Sunday)", () => {
      // Act
      const cells = buildCalendarCells(weekStartDate, []);

      // Assert
      const uniqueDays = new Set(cells.map((cell) => cell.dayOfWeek));
      expect(uniqueDays.size).toBe(7);
      expect(uniqueDays).toEqual(new Set([1, 2, 3, 4, 5, 6, 7]));
    });

    it("should create cells for all meal types", () => {
      // Act
      const cells = buildCalendarCells(weekStartDate, []);

      // Assert
      const uniqueMealTypes = new Set(cells.map((cell) => cell.mealType));
      expect(uniqueMealTypes.size).toBe(4);
      expect(uniqueMealTypes).toEqual(new Set(["breakfast", "second_breakfast", "lunch", "dinner"]));
    });

    it("should mark all cells as empty when no assignments", () => {
      // Act
      const cells = buildCalendarCells(weekStartDate, []);

      // Assert
      expect(cells.every((cell) => cell.isEmpty)).toBe(true);
      expect(cells.every((cell) => cell.assignment === null)).toBe(true);
    });

    it("should assign recipe to correct cell", () => {
      // Arrange
      const assignments: MealPlanAssignmentDto[] = [
        {
          id: "assignment-1",
          recipe_id: "recipe-1",
          recipe_name: "Jajecznica",
          user_id: "user-1",
          week_start_date: weekStartDate,
          day_of_week: 1, // Monday
          meal_type: "breakfast",
          created_at: "2025-01-20T10:00:00Z",
        },
      ];

      // Act
      const cells = buildCalendarCells(weekStartDate, assignments);

      // Assert
      const mondayBreakfastCell = cells.find((cell) => cell.dayOfWeek === 1 && cell.mealType === "breakfast");

      expect(mondayBreakfastCell).toBeDefined();
      expect(mondayBreakfastCell!.isEmpty).toBe(false);
      expect(mondayBreakfastCell!.assignment).toEqual(assignments[0]);
      expect(mondayBreakfastCell!.assignment?.recipe_name).toBe("Jajecznica");
    });

    it("should assign multiple recipes to different cells", () => {
      // Arrange
      const assignments: MealPlanAssignmentDto[] = [
        {
          id: "assignment-1",
          recipe_id: "recipe-1",
          recipe_name: "Jajecznica",
          user_id: "user-1",
          week_start_date: weekStartDate,
          day_of_week: 1,
          meal_type: "breakfast",
          created_at: "2025-01-20T10:00:00Z",
        },
        {
          id: "assignment-2",
          recipe_id: "recipe-2",
          recipe_name: "Spaghetti",
          user_id: "user-1",
          week_start_date: weekStartDate,
          day_of_week: 1,
          meal_type: "lunch",
          created_at: "2025-01-20T11:00:00Z",
        },
        {
          id: "assignment-3",
          recipe_id: "recipe-3",
          recipe_name: "Sałatka",
          user_id: "user-1",
          week_start_date: weekStartDate,
          day_of_week: 3,
          meal_type: "dinner",
          created_at: "2025-01-20T12:00:00Z",
        },
      ];

      // Act
      const cells = buildCalendarCells(weekStartDate, assignments);

      // Assert
      const assignedCells = cells.filter((cell) => !cell.isEmpty);
      expect(assignedCells).toHaveLength(3);

      const mondayBreakfast = cells.find((cell) => cell.dayOfWeek === 1 && cell.mealType === "breakfast");
      expect(mondayBreakfast!.assignment?.recipe_name).toBe("Jajecznica");

      const mondayLunch = cells.find((cell) => cell.dayOfWeek === 1 && cell.mealType === "lunch");
      expect(mondayLunch!.assignment?.recipe_name).toBe("Spaghetti");

      const wednesdayDinner = cells.find((cell) => cell.dayOfWeek === 3 && cell.mealType === "dinner");
      expect(wednesdayDinner!.assignment?.recipe_name).toBe("Sałatka");
    });

    it("should set correct dateString in YYYY-MM-DD format", () => {
      // Act
      const cells = buildCalendarCells(weekStartDate, []);

      // Assert
      const mondayCell = cells.find((cell) => cell.dayOfWeek === 1);
      expect(mondayCell!.dateString).toBe("2025-01-20");

      const sundayCell = cells.find((cell) => cell.dayOfWeek === 7);
      expect(sundayCell!.dateString).toBe("2025-01-26");
    });

    it("should set correct dayName and dayNameShort", () => {
      // Act
      const cells = buildCalendarCells(weekStartDate, []);

      // Assert
      const mondayCell = cells.find((cell) => cell.dayOfWeek === 1);
      expect(mondayCell!.dayName).toBe("Poniedziałek");
      expect(mondayCell!.dayNameShort).toBe("Pon");

      const sundayCell = cells.find((cell) => cell.dayOfWeek === 7);
      expect(sundayCell!.dayName).toBe("Niedziela");
      expect(sundayCell!.dayNameShort).toBe("Niedz");
    });

    it("should set correct mealTypeLabel", () => {
      // Act
      const cells = buildCalendarCells(weekStartDate, []);

      // Assert
      const breakfastCell = cells.find((cell) => cell.mealType === "breakfast");
      expect(breakfastCell!.mealTypeLabel).toBe("Śniadanie");

      const lunchCell = cells.find((cell) => cell.mealType === "lunch");
      expect(lunchCell!.mealTypeLabel).toBe("Obiad");

      const dinnerCell = cells.find((cell) => cell.mealType === "dinner");
      expect(dinnerCell!.mealTypeLabel).toBe("Kolacja");
    });

    it("should handle week crossing month boundary", () => {
      // Arrange - January 27 is Monday, week goes to February 2
      const weekStartDate = "2025-01-27";

      // Act
      const cells = buildCalendarCells(weekStartDate, []);

      // Assert
      expect(cells).toHaveLength(28);
      const mondayCell = cells.find((cell) => cell.dayOfWeek === 1);
      expect(mondayCell!.dateString).toBe("2025-01-27"); // Still January

      const sundayCell = cells.find((cell) => cell.dayOfWeek === 7);
      expect(sundayCell!.dateString).toBe("2025-02-02"); // February
    });
  });

  describe("groupCellsByDay", () => {
    it("should group cells by day of week", () => {
      // Arrange
      const cells: CalendarCellViewModel[] = [
        {
          dayOfWeek: 1,
          mealType: "breakfast",
          date: new Date("2025-01-20"),
          dateString: "2025-01-20",
          dayName: "Poniedziałek",
          dayNameShort: "Pon",
          mealTypeLabel: "Śniadanie",
          assignment: null,
          isEmpty: true,
        },
        {
          dayOfWeek: 1,
          mealType: "lunch",
          date: new Date("2025-01-20"),
          dateString: "2025-01-20",
          dayName: "Poniedziałek",
          dayNameShort: "Pon",
          mealTypeLabel: "Obiad",
          assignment: null,
          isEmpty: true,
        },
        {
          dayOfWeek: 2,
          mealType: "breakfast",
          date: new Date("2025-01-21"),
          dateString: "2025-01-21",
          dayName: "Wtorek",
          dayNameShort: "Wt",
          mealTypeLabel: "Śniadanie",
          assignment: null,
          isEmpty: true,
        },
      ];

      // Act
      const grouped = groupCellsByDay(cells);

      // Assert
      expect(grouped.size).toBe(2);
      expect(grouped.get(1)).toHaveLength(2);
      expect(grouped.get(2)).toHaveLength(1);
    });

    it("should return empty Map for empty cells array", () => {
      // Arrange
      const cells: CalendarCellViewModel[] = [];

      // Act
      const grouped = groupCellsByDay(cells);

      // Assert
      expect(grouped.size).toBe(0);
    });

    it("should group all 28 cells into 7 days", () => {
      // Arrange
      const weekStartDate = "2025-01-20";
      const cells = buildCalendarCells(weekStartDate, []);

      // Act
      const grouped = groupCellsByDay(cells);

      // Assert
      expect(grouped.size).toBe(7);

      // Each day should have 4 meals
      for (let day = 1; day <= 7; day++) {
        expect(grouped.get(day)).toHaveLength(4);
      }
    });

    it("should maintain original cell order within each day", () => {
      // Arrange
      const weekStartDate = "2025-01-20";
      const cells = buildCalendarCells(weekStartDate, []);

      // Act
      const grouped = groupCellsByDay(cells);

      // Assert
      const mondayCells = grouped.get(1)!;
      expect(mondayCells[0].mealType).toBe("breakfast");
      expect(mondayCells[1].mealType).toBe("second_breakfast");
      expect(mondayCells[2].mealType).toBe("lunch");
      expect(mondayCells[3].mealType).toBe("dinner");
    });
  });

  describe("truncateText", () => {
    it("should not truncate text shorter than maxLength", () => {
      // Arrange
      const text = "Short";
      const maxLength = 10;

      // Act
      const result = truncateText(text, maxLength);

      // Assert
      expect(result).toBe("Short");
    });

    it("should not truncate text equal to maxLength", () => {
      // Arrange
      const text = "ExactlyTen";
      const maxLength = 10;

      // Act
      const result = truncateText(text, maxLength);

      // Assert
      expect(result).toBe("ExactlyTen");
    });

    it("should truncate text longer than maxLength", () => {
      // Arrange
      const text = "This is a very long recipe name that should be truncated";
      const maxLength = 20;

      // Act
      const result = truncateText(text, maxLength);

      // Assert
      expect(result).toBe("This is a very lo...");
      expect(result.length).toBe(20);
    });

    it("should add ellipsis when truncating", () => {
      // Arrange
      const text = "Long recipe name";
      const maxLength = 10;

      // Act
      const result = truncateText(text, maxLength);

      // Assert
      expect(result).toMatch(/\.\.\.$/);
      expect(result.endsWith("...")).toBe(true);
    });

    it("should handle maxLength of 3 (minimum for ellipsis)", () => {
      // Arrange
      const text = "Recipe";
      const maxLength = 3;

      // Act
      const result = truncateText(text, maxLength);

      // Assert
      expect(result).toBe("...");
    });

    it("should handle empty string", () => {
      // Arrange
      const text = "";
      const maxLength = 10;

      // Act
      const result = truncateText(text, maxLength);

      // Assert
      expect(result).toBe("");
    });

    it("should handle Polish characters correctly", () => {
      // Arrange
      const text = "Zupa pomidorowa z makaronem i bazylią";
      const maxLength = 20;

      // Act
      const result = truncateText(text, maxLength);

      // Assert
      expect(result).toBe("Zupa pomidorowa z...");
      expect(result.length).toBe(20);
    });
  });

  describe("formatDayMealType", () => {
    it("should format Monday breakfast correctly", () => {
      // Arrange
      const dayOfWeek = 1;
      const mealType = "breakfast";

      // Act
      const result = formatDayMealType(dayOfWeek, mealType);

      // Assert
      expect(result).toBe("Poniedziałek - Śniadanie");
    });

    it("should format Wednesday lunch correctly", () => {
      // Arrange
      const dayOfWeek = 3;
      const mealType = "lunch";

      // Act
      const result = formatDayMealType(dayOfWeek, mealType);

      // Assert
      expect(result).toBe("Środa - Obiad");
    });

    it("should format Sunday dinner correctly", () => {
      // Arrange
      const dayOfWeek = 7;
      const mealType = "dinner";

      // Act
      const result = formatDayMealType(dayOfWeek, mealType);

      // Assert
      expect(result).toBe("Niedziela - Kolacja");
    });

    it("should format second breakfast correctly", () => {
      // Arrange
      const dayOfWeek = 5;
      const mealType = "second_breakfast";

      // Act
      const result = formatDayMealType(dayOfWeek, mealType);

      // Assert
      expect(result).toBe("Piątek - Drugie śniadanie");
    });

    it("should use separator ' - ' between day and meal", () => {
      // Arrange
      const dayOfWeek = 2;
      const mealType = "breakfast";

      // Act
      const result = formatDayMealType(dayOfWeek, mealType);

      // Assert
      expect(result).toContain(" - ");
      expect(result.split(" - ")).toHaveLength(2);
    });
  });
});

/**
 * Przykładowy test jednostkowy
 * Ten plik pokazuje jak pisać testy z Vitest
 */

import { describe, it, expect } from "vitest";

describe("Example Test Suite", () => {
  it("should pass a simple assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("should work with objects", () => {
    const user = {
      name: "Jan Kowalski",
      email: "jan@example.com",
    };

    expect(user).toEqual({
      name: "Jan Kowalski",
      email: "jan@example.com",
    });
  });

  it("should work with arrays", () => {
    const numbers = [1, 2, 3, 4, 5];

    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
  });

  describe("String operations", () => {
    it("should handle string concatenation", () => {
      const greeting = "Hello" + " " + "World";
      expect(greeting).toBe("Hello World");
    });

    it("should handle string includes", () => {
      const text = "ShopMate is awesome";
      expect(text).toContain("ShopMate");
    });
  });

  describe("Async operations", () => {
    it("should handle promises", async () => {
      const promise = Promise.resolve("success");
      await expect(promise).resolves.toBe("success");
    });

    it("should handle async functions", async () => {
      const asyncFn = async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve("delayed"), 100);
        });
      };

      const result = await asyncFn();
      expect(result).toBe("delayed");
    });
  });
});

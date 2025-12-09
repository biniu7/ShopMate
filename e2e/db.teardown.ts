/**
 * Database Teardown for Playwright E2E Tests
 * This file handles cleanup after all tests complete
 * Removes test data from recipes and ingredients tables
 */
import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";

teardown("cleanup database", async () => {
  console.log("Starting database cleanup...");

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testUserEmail = process.env.E2E_USERNAME;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be set in .env.test file");
  }

  if (!testUserEmail) {
    throw new Error("E2E_USERNAME must be set in .env.test file");
  }

  // Create Supabase client
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  try {
    // Sign in as test user to get proper authentication context
    const testUserPassword = process.env.E2E_PASSWORD;
    if (!testUserPassword) {
      throw new Error("E2E_PASSWORD must be set in .env.test file");
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });

    if (authError || !authData.user) {
      console.error("Failed to authenticate test user for cleanup:", authError);
      throw new Error(`Authentication failed: ${authError?.message}`);
    }

    console.log(`Authenticated as: ${testUserEmail} (${authData.user.id})`);

    // Delete all recipes for the test user
    // Ingredients will be automatically deleted via CASCADE
    const { data: deletedRecipes, error: deleteError } = await supabase
      .from("recipes")
      .delete()
      .eq("user_id", authData.user.id)
      .select("id");

    if (deleteError) {
      console.error("Failed to delete recipes:", deleteError);
      throw new Error(`Database cleanup failed: ${deleteError.message}`);
    }

    const deletedCount = deletedRecipes?.length || 0;
    console.log(`Deleted ${deletedCount} recipe(s) and their ingredients`);

    // Sign out
    await supabase.auth.signOut();
    console.log("Database cleanup completed successfully");
  } catch (error) {
    console.error("Error during database cleanup:", error);
    // Re-throw to fail the teardown and alert developers
    throw error;
  }
});

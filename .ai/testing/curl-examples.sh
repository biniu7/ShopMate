#!/bin/bash

# Shopping List Preview API - curl Test Examples
# Replace variables with your actual values

# ============================================================================
# Configuration
# ============================================================================

BASE_URL="http://localhost:3001"
AUTH_TOKEN="your_supabase_jwt_token_here"
RECIPE_ID_1="your_recipe_uuid_1_here"
RECIPE_ID_2="your_recipe_uuid_2_here"
WEEK_START="2025-11-04"  # Must be Monday

# ============================================================================
# Test 1: Happy Path - Recipes Mode
# ============================================================================

echo "========================================="
echo "Test 1: Recipes Mode (Happy Path)"
echo "========================================="

curl -X POST "${BASE_URL}/api/shopping-lists/preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "source": "recipes",
    "recipe_ids": ["'${RECIPE_ID_1}'", "'${RECIPE_ID_2}'"]
  }' \
  | jq .

echo ""
echo ""

# ============================================================================
# Test 2: Happy Path - Calendar Mode
# ============================================================================

echo "========================================="
echo "Test 2: Calendar Mode (Happy Path)"
echo "========================================="

curl -X POST "${BASE_URL}/api/shopping-lists/preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "source": "calendar",
    "week_start_date": "'${WEEK_START}'",
    "selections": [
      {
        "day_of_week": 1,
        "meal_types": ["breakfast", "lunch"]
      },
      {
        "day_of_week": 2,
        "meal_types": ["breakfast", "second_breakfast", "lunch", "dinner"]
      }
    ]
  }' \
  | jq .

echo ""
echo ""

# ============================================================================
# Test 3: Error - Unauthorized (401)
# ============================================================================

echo "========================================="
echo "Test 3: Unauthorized (401)"
echo "========================================="

curl -X POST "${BASE_URL}/api/shopping-lists/preview" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "recipes",
    "recipe_ids": ["'${RECIPE_ID_1}'"]
  }' \
  | jq .

echo ""
echo ""

# ============================================================================
# Test 4: Error - Validation Failed (400)
# ============================================================================

echo "========================================="
echo "Test 4: Validation Error - Empty recipe_ids (400)"
echo "========================================="

curl -X POST "${BASE_URL}/api/shopping-lists/preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "source": "recipes",
    "recipe_ids": []
  }' \
  | jq .

echo ""
echo ""

# ============================================================================
# Test 5: Error - Invalid UUID (400)
# ============================================================================

echo "========================================="
echo "Test 5: Validation Error - Invalid UUID (400)"
echo "========================================="

curl -X POST "${BASE_URL}/api/shopping-lists/preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "source": "recipes",
    "recipe_ids": ["not-a-valid-uuid"]
  }' \
  | jq .

echo ""
echo ""

# ============================================================================
# Test 6: Error - Invalid Date Format (400)
# ============================================================================

echo "========================================="
echo "Test 6: Validation Error - Invalid Date (400)"
echo "========================================="

curl -X POST "${BASE_URL}/api/shopping-lists/preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "source": "calendar",
    "week_start_date": "2025/11/04",
    "selections": [
      {"day_of_week": 1, "meal_types": ["breakfast"]}
    ]
  }' \
  | jq .

echo ""
echo ""

# ============================================================================
# Test 7: Error - Not Monday (400)
# ============================================================================

echo "========================================="
echo "Test 7: Validation Error - Not Monday (400)"
echo "========================================="

curl -X POST "${BASE_URL}/api/shopping-lists/preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "source": "calendar",
    "week_start_date": "2025-11-05",
    "selections": [
      {"day_of_week": 1, "meal_types": ["breakfast"]}
    ]
  }' \
  | jq .

echo ""
echo ""

# ============================================================================
# Test 8: Error - Invalid JSON (400)
# ============================================================================

echo "========================================="
echo "Test 8: Invalid JSON (400)"
echo "========================================="

curl -X POST "${BASE_URL}/api/shopping-lists/preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{invalid json}' \
  | jq .

echo ""
echo ""

# ============================================================================
# Test 9: Single Recipe - Minimal Example
# ============================================================================

echo "========================================="
echo "Test 9: Single Recipe (Minimal)"
echo "========================================="

curl -X POST "${BASE_URL}/api/shopping-lists/preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "source": "recipes",
    "recipe_ids": ["'${RECIPE_ID_1}'"]
  }' \
  | jq .

echo ""
echo ""

echo "========================================="
echo "All tests completed!"
echo "========================================="

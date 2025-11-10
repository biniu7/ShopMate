# OpenAI API Configuration for ShopMate

## Overview

The Shopping List Preview endpoint (`POST /api/shopping-lists/preview`) uses OpenAI GPT-4o mini to categorize ingredients into Polish categories:

- Nabiał (Dairy)
- Warzywa (Vegetables)
- Owoce (Fruits)
- Mięso (Meat/Fish)
- Pieczywo (Bread/Pasta)
- Przyprawy (Spices)
- Inne (Other - fallback)

## Local Development Setup

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create new secret key
5. **Copy the key immediately** (you won't see it again)

### 2. Add to Local .env

Create or edit `.env` file in project root:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important**: Never commit `.env` file to git! It's already in `.gitignore`.

### 3. Verify Configuration

Start dev server:

```bash
npm run dev
```

Check console logs for:

- ✅ No errors about missing `OPENAI_API_KEY`
- ✅ Server starts successfully

## Production Setup (Vercel)

### 1. Add Environment Variable

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Environments**: Production, Preview, Development (select all)
3. Save

### 2. Redeploy

After adding env variable:

```bash
git push origin main
```

Vercel will automatically redeploy with new environment variable.

## Cost Estimation

**Model**: GPT-4o mini
**Pricing**: ~$0.000150 per 1K input tokens, ~$0.000600 per 1K output tokens

**Average request**:

- Input: ~50 ingredients × 10 tokens = 500 tokens + prompt (~200 tokens) = **~700 input tokens**
- Output: JSON response ~50 tokens = **~50 output tokens**
- **Cost per request**: ~$0.0001 - $0.0002

**Monthly estimates**:

- 1,000 users × 4 lists/month = 4,000 requests = **~$0.40 - $0.80/month**
- 10,000 users × 4 lists/month = 40,000 requests = **~$4 - $8/month**

Very affordable for MVP! 🎉

## Fallback Behavior

If OpenAI API fails (timeout, quota exceeded, network error):

- ✅ Endpoint still returns **200 OK**
- ✅ All ingredients get category **"Inne"** (Other)
- ✅ Metadata includes `ai_categorization_status: "failed"` and error message
- ✅ User can still save the list and manually adjust categories in UI

This ensures the app never breaks due to AI failures.

## Monitoring

**Check OpenAI usage**:

1. Go to https://platform.openai.com/usage
2. Monitor daily/monthly usage
3. Set up billing alerts if needed

**Console logs** (development):

```
[AI Categorization] Attempt 1/3 for 50 ingredients
[AI Categorization] Success on attempt 1
```

**Error logs** (if AI fails):

```
[AI Categorization] Attempt 1 failed: Timeout
[AI Categorization] Retrying in 1000ms...
[AI Categorization] All 3 attempts failed. Using fallback category "Inne" for all items.
```

## Troubleshooting

### Error: "OPENAI_API_KEY environment variable is not set"

**Solution**: Add `OPENAI_API_KEY` to `.env` file (local) or Vercel dashboard (production).

### Error: "OpenAI timeout after 2 retries"

**Possible causes**:

- Network issues
- OpenAI API downtime
- Timeout too short (currently 10s)

**Solution**: App will fallback to "Inne" category. User can proceed normally.

### Error: "Too many ingredients. Maximum 100 allowed"

**Cause**: Request contains >100 ingredients (safety limit)

**Solution**: This is enforced in code. Should not happen in normal use (20 recipes × 50 ingredients = 1000 max, but aggregation reduces this significantly).

## Security Notes

✅ **API key is server-side only** - never exposed to client
✅ **Requests are authenticated** - users must be logged in
✅ **No PII in logs** - ingredient names are OK to log (not personal data)
✅ **OpenAI policy** - API calls NOT used for training (per OpenAI API Terms)

## Testing

### Test without OpenAI (Mock)

To test without actual API calls, temporarily modify `ai-categorization.service.ts`:

```typescript
// Mock categorization for testing
export async function categorizeIngredientsWithRetry(ingredients: string[]): Promise<CategorizationResult> {
  console.log('[AI Categorization] MOCKED - returning all "Inne"');

  const categories = new Map<string, IngredientCategory>();
  ingredients.forEach((ing) => categories.set(ing, "Inne"));

  return {
    success: true,
    categories,
  };
}
```

### Test with Real OpenAI

Use Postman/Bruno to call:

```
POST http://localhost:3001/api/shopping-lists/preview
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json

{
  "source": "recipes",
  "recipe_ids": ["<your_recipe_uuid>"]
}
```

Check response metadata:

```json
{
  "metadata": {
    "ai_categorization_status": "success" // or "failed"
  }
}
```

---

**Setup complete!** 🚀 Your endpoint is now ready to categorize ingredients with AI.

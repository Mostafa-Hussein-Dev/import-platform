# Phase 1: Setup & Clerk Configuration Guide

## Problem: Clerk Authentication Not Working + TypeScript Build Errors

The application is experiencing two main issues:
1. **Clerk keys are empty** in .env file - authentication will fail
2. **Prisma Decimal type mismatch** - forms expect `number` but Prisma returns `Decimal` type

## Solutions

### 1. Fix Clerk Authentication

**Step 1: Get Clerk API Keys**
1. Go to https://dashboard.clerk.com
2. Create a new application (or select existing one)
3. Navigate to "API Keys" section
4. Copy your Publishable Key and Secret Key

**Step 2: Add Keys to .env**
Update the `.env` file in your project root:

\`\`\`\`bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_PUBLISHABLE_KEY
CLERK_SECRET_KEY=sk_test_SECRET_KEY
\`\`\`

**Step 3: Restart Dev Server**
\`\`\`bash
pnpm run dev
\`\`\`

### 2. Fix TypeScript Prisma Type Issues

The issue is that Prisma returns Decimal type but the forms expect `number`.

**Option A: Update Form Types** (RECOMMENDED)
Update the form types to accept `number | Prisma.Decimal`:

\`\`\`typescript
// In product-form.tsx, change the type from number to number | Prisma.Decimal
// Before:
costPrice: initialData?.costPrice || 0,
// After:
costPrice: initialData?.costPrice ?? 0,
\`\`\`

**Option B: Use Transform on Server Actions** (ALREADY IMPLEMENTED)
The server actions already handle the conversion:
\`\`\`typescript
// In lib/actions/products.ts
costPrice: Number(product.costPrice),
// So forms receive numbers correctly
\`\`\`

**Option C: Use Decimal in Forms** (TEMPORARY FIX)
Quick fix - convert to number in the component:

\`\`\`typescript
// In components/products/product-form.ts (line ~104)
const formData = {
  // ...
  costPrice: initialData?.costPrice ? Number(initialData.costPrice) : 0,
  // This ensures costPrice is always a number
}
\`\`\`

## Prisma Decimal Type Handling

Prisma 7 returns Decimal objects for price fields. To properly handle:
- **Server actions** already convert Decimal to Number
- **Forms** should handle Decimal→Number conversion for initial values
- **Validation schemas** use z.number() for price fields
- This provides type safety throughout the stack

## Verification Checklist

After making changes, verify:
- [ ] TypeScript compiles without errors
- [ ] Dev server runs without lock file issues
- [ ] Can navigate to /dashboard when signed in

## Files to Modify

### For Clerk Setup:
- `.env` - Add Clerk keys
- `middleware/proxy.ts` or `app/(dashboard)/middleware.ts` - Already configured correctly

### For TypeScript Build Errors:
- `lib/actions/products.ts` - Already converts Decimal to Number
- `lib/actions/suppliers.ts` - Check if similar conversion needed
- `components/products/product-form.ts` - Convert initial values
- `app/(dashboard)/dashboard/products/[id]/edit/page.tsx` - Convert Decimal to Number
- Validation schemas - Price fields use z.number()

---

## Next Steps

1. **Add Clerk keys** to `.env`
2. **Restart dev server** and test
3. **Verify build passes** with your changes

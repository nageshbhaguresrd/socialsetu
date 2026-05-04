# Editable WhatsApp Templates - Implementation Plan (Approved)

## Steps
1. ✅ **PLAN CONFIRMED** 
2. **SQL TABLE + SEED** - Append wa_templates CREATE/INSERT to lib/supabase/schema.sql
3. **CREATE API ROUTES** 
   - app/api/wa-templates/route.ts (GET/POST)
   - app/api/wa-templates/[id]/route.ts (PATCH/DELETE)
4. **UPDATE CRM PAGE** - Refactor WhatsAppPanel: states, fetch templates, dynamic buttons, applyTemplate func, Manage Templates modal
5. **TEST** - Verify CRUD, substitution, no breaking changes
6. **COMPLETE**

## Next: Step 4 - CRM Integration
✅ **Step 2: SQL table + seed**  
✅ **Step 3 APIs** - GET/POST/PATCH/DELETE routes fixed with createServerClient  
✅ **Step 3 fixed** - TS/runtime errors resolved (used @supabase/ssr)

**Now implementing:** app/crm/page.tsx WhatsAppPanel refactor

**Status:** UI refactor in progress

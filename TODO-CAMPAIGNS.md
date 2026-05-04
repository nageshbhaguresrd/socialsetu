# CRM Campaigns - Real Supabase Data (Approved Plan)

## Steps
1. **APPEND SCHEMA** - campaigns table + indexes to lib/supabase/schema.sql
2. **API ROUTES** 
   - app/api/campaigns/route.ts (GET/POST)
   - app/api/campaigns/[id]/route.ts (PATCH/DELETE)
3. **PAGE.TSX** 
   - Add campaigns state/fetchCampaigns
   - Add 'campaigns' sidebar tab
   - CampaignsView component: stats, charts, modal CRUD, cards with pct bars
4. **TEST** - Dev server, verify CRUD/charts
5. **COMPLETE**

## Next Step
✅ **Step 1: Schema** - campaigns table/indexes appended to lib/supabase/schema.sql

✅ **APIs complete** - Using lib/supabase/server.ts createClient()

**Next:** Add CampaignsView component stub

✅ **Step 3d:** Init useEffect calls fetchCampaigns  
✅ **Step 3e:** Added "Campaigns" sidebar tab w/ TrendingUp icon

**Status:** View ready

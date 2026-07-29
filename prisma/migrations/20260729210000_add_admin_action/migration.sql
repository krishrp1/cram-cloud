-- CreateTable
CREATE TABLE "admin_actions" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "admin_email" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_id" INTEGER,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_actions_created_at_idx" ON "admin_actions"("created_at");

-- Same hardening as every other app table (see 20260729190000): deny-all
-- for Supabase's Data API by default, app's own role bypasses via
-- BYPASSRLS. Especially relevant here since this table stores emails of
-- users who may since have been deleted.
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions FORCE  ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.admin_actions TO cram_cloud_app;

REVOKE ALL ON public.admin_actions FROM anon, authenticated;

-- CreateTable
CREATE TABLE "rate_limit_hits" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_hits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_limit_hits_key_created_at_idx" ON "rate_limit_hits"("key", "created_at");

-- Same hardening as the other 5 app tables: RLS enabled+forced with zero
-- policies (deny-all for Supabase's Data API), app's own Postgres role
-- already has BYPASSRLS so it's unaffected and just needs the CRUD grant.
ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_hits FORCE  ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.rate_limit_hits TO cram_cloud_app;

REVOKE ALL ON public.rate_limit_hits FROM anon, authenticated;

-- Security hardening: this app talks to Postgres exclusively via Prisma
-- (over DATABASE_URL/DIRECT_URL), never through Supabase's auto-generated
-- Data API (PostgREST). RLS was never enabled on any table, so the instant
-- anyone granted the `anon`/`authenticated` roles SELECT/INSERT/etc on
-- these tables (a routine, easy-to-reach-for step in Supabase workflows),
-- every row -- including `users.password_hash` -- would become directly
-- readable/writable over the internet with none of this app's own
-- ownership checks applied.
--
-- Fix: enable + force RLS with zero policies on every app table, which
-- makes the Data API path deny-all regardless of future GRANTs. The app's
-- own Postgres role (cram_cloud_app) is granted BYPASSRLS so its existing,
-- already-scoped table grants (SELECT/INSERT/UPDATE/DELETE on just these
-- 5 tables, no DDL) keep working unchanged -- RLS only closes the Data API
-- hole, it does not touch how the app itself reads/writes.

ALTER ROLE cram_cloud_app WITH BYPASSRLS;

ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users          FORCE  ROW LEVEL SECURITY;
ALTER TABLE public.pdfs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdfs           FORCE  ROW LEVEL SECURITY;
ALTER TABLE public.comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments       FORCE  ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads  FORCE  ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies  FORCE  ROW LEVEL SECURITY;

-- Belt-and-suspenders: strip the vestigial REFERENCES/TRIGGER/TRUNCATE
-- grants anon/authenticated already held on every table (harmless on
-- their own -- none of SELECT/INSERT/UPDATE/DELETE were ever granted --
-- but there's no reason for the Data API roles to hold any privilege here).
REVOKE ALL ON public.users, public.pdfs, public.comments,
             public.forum_threads, public.forum_replies
  FROM anon, authenticated;

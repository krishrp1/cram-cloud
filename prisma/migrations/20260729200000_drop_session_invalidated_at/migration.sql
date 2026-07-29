-- users.session_invalidated_at was added in 20260726045656_add_session_invalidation
-- to support forced session revocation, but nothing in the app ever read or
-- wrote it -- there is no logout-all-devices or password-change flow, so it
-- sat as a column that looked like a live security control without being one.
-- Dropping it rather than leaving a misleading unused field; the JWT session
-- (lib/session.ts) already carries the whole trust boundary via its 24h
-- expiry. Reintroducing per-session revocation later (e.g. alongside a
-- password-change feature) is a single new migration + a check in
-- lib/session.ts's decrypt(), not a schema migration away from here.
ALTER TABLE "users" DROP COLUMN "session_invalidated_at";

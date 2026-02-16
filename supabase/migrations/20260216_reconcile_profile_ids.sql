-- ============================================
-- MIGRATION: Reconcile legacy users.id with auth.users.id
-- Date: 2026-02-16
-- ============================================
-- Obiectiv:
-- 1) Repară datele legacy unde public.users.id diferă de auth.users.id
-- 2) Oferă auto-heal prin RPC pentru login-uri viitoare

BEGIN;

CREATE OR REPLACE FUNCTION public.reconcile_current_user_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_user_id text := auth.uid()::text;
  v_auth_email text;
  v_legacy_user_id text;
  v_legacy_name text;
  v_legacy_currency text;
  v_legacy_created_at timestamptz;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'E_AUTH_NOT_AUTHENTICATED';
  END IF;

  SELECT email
  INTO v_auth_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_auth_email IS NULL THEN
    RAISE EXCEPTION 'E_AUTH_EMAIL_MISSING';
  END IF;

  SELECT id, name, native_currency, created_at
  INTO v_legacy_user_id, v_legacy_name, v_legacy_currency, v_legacy_created_at
  FROM public.users
  WHERE lower(email) = lower(v_auth_email)
    AND id <> v_auth_user_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_legacy_user_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_auth_user_id) THEN
    INSERT INTO public.users (
      id, email, name, native_currency, created_at, updated_at
    )
    VALUES (
      v_auth_user_id,
      v_auth_user_id || '@reconcile.local',
      coalesce(v_legacy_name, 'Utilizator'),
      coalesce(v_legacy_currency, 'RON'),
      coalesce(v_legacy_created_at, now()),
      now()
    );
  END IF;

  UPDATE public.banks
  SET user_id = v_auth_user_id
  WHERE user_id = v_legacy_user_id;

  UPDATE public.currencies
  SET user_id = v_auth_user_id
  WHERE user_id = v_legacy_user_id;

  UPDATE public.categories
  SET user_id = v_auth_user_id
  WHERE user_id = v_legacy_user_id;

  UPDATE public.transactions
  SET user_id = v_auth_user_id
  WHERE user_id = v_legacy_user_id;

  DELETE FROM public.user_keywords legacy
  USING public.user_keywords target
  WHERE legacy.user_id = v_legacy_user_id
    AND target.user_id = v_auth_user_id
    AND target.keyword = legacy.keyword;

  UPDATE public.user_keywords
  SET user_id = v_auth_user_id
  WHERE user_id = v_legacy_user_id;

  DELETE FROM public.users
  WHERE id = v_legacy_user_id;

  UPDATE public.users
  SET
    email = v_auth_email,
    name = coalesce(name, v_legacy_name, 'Utilizator'),
    native_currency = coalesce(native_currency, v_legacy_currency, 'RON'),
    updated_at = now()
  WHERE id = v_auth_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_current_user_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_current_user_profile() TO authenticated;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      u.id AS legacy_user_id,
      u.name AS legacy_name,
      u.native_currency AS legacy_currency,
      u.created_at AS legacy_created_at,
      u.email AS legacy_email,
      au.id::text AS auth_user_id
    FROM public.users u
    JOIN auth.users au
      ON lower(au.email) = lower(u.email)
    WHERE u.id <> au.id::text
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = rec.auth_user_id) THEN
      INSERT INTO public.users (
        id, email, name, native_currency, created_at, updated_at
      )
      VALUES (
        rec.auth_user_id,
        rec.auth_user_id || '@reconcile.local',
        coalesce(rec.legacy_name, 'Utilizator'),
        coalesce(rec.legacy_currency, 'RON'),
        coalesce(rec.legacy_created_at, now()),
        now()
      );
    END IF;

    UPDATE public.banks
    SET user_id = rec.auth_user_id
    WHERE user_id = rec.legacy_user_id;

    UPDATE public.currencies
    SET user_id = rec.auth_user_id
    WHERE user_id = rec.legacy_user_id;

    UPDATE public.categories
    SET user_id = rec.auth_user_id
    WHERE user_id = rec.legacy_user_id;

    UPDATE public.transactions
    SET user_id = rec.auth_user_id
    WHERE user_id = rec.legacy_user_id;

    DELETE FROM public.user_keywords legacy
    USING public.user_keywords target
    WHERE legacy.user_id = rec.legacy_user_id
      AND target.user_id = rec.auth_user_id
      AND target.keyword = legacy.keyword;

    UPDATE public.user_keywords
    SET user_id = rec.auth_user_id
    WHERE user_id = rec.legacy_user_id;

    DELETE FROM public.users
    WHERE id = rec.legacy_user_id;

    UPDATE public.users
    SET
      email = rec.legacy_email,
      name = coalesce(name, rec.legacy_name, 'Utilizator'),
      native_currency = coalesce(native_currency, rec.legacy_currency, 'RON'),
      updated_at = now()
    WHERE id = rec.auth_user_id;
  END LOOP;
END;
$$;

COMMIT;

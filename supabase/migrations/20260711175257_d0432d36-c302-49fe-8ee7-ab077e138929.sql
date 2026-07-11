
-- =========================================================
-- profiles
-- =========================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- couples
-- =========================================================
CREATE TABLE public.couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'dating',
  money_model text,
  split_rule text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couples TO authenticated;
GRANT ALL ON public.couples TO service_role;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- couple_members
-- =========================================================
CREATE TABLE public.couple_members (
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (couple_id, user_id)
);
CREATE INDEX couple_members_user_idx ON public.couple_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couple_members TO authenticated;
GRANT ALL ON public.couple_members TO service_role;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;

-- Security-definer helper: does user belong to couple?
CREATE OR REPLACE FUNCTION public.is_couple_member(_couple_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couple_members
    WHERE couple_id = _couple_id AND user_id = _user_id
  );
$$;

-- Helper: current user's couple_id (first match)
CREATE OR REPLACE FUNCTION public.current_couple_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- couple_members policies
CREATE POLICY "Members read their couple memberships"
  ON public.couple_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_couple_member(couple_id, auth.uid()));

-- couples policies
CREATE POLICY "Members read their couple"
  ON public.couples FOR SELECT TO authenticated
  USING (public.is_couple_member(id, auth.uid()));
CREATE POLICY "Members update their couple"
  ON public.couples FOR UPDATE TO authenticated
  USING (public.is_couple_member(id, auth.uid()))
  WITH CHECK (public.is_couple_member(id, auth.uid()));

-- =========================================================
-- occasions
-- =========================================================
CREATE TABLE public.occasions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  kind text NOT NULL,
  label text NOT NULL,
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX occasions_couple_idx ON public.occasions(couple_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.occasions TO authenticated;
GRANT ALL ON public.occasions TO service_role;
ALTER TABLE public.occasions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage occasions"
  ON public.occasions FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()))
  WITH CHECK (public.is_couple_member(couple_id, auth.uid()));

-- =========================================================
-- transactions
-- =========================================================
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  category text,
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_couple_idx ON public.transactions(couple_id, occurred_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()));
CREATE POLICY "Members insert transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (public.is_couple_member(couple_id, auth.uid()) AND owner_id = auth.uid());
CREATE POLICY "Owners update their transactions"
  ON public.transactions FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete their transactions"
  ON public.transactions FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- =========================================================
-- RPCs: create_couple / join_couple
-- =========================================================
CREATE OR REPLACE FUNCTION public.create_couple(p_status text DEFAULT 'dating')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  new_id uuid;
  uid uuid := auth.uid();
  attempts int := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- If user already has a couple, return its code
  SELECT c.code INTO new_code
  FROM public.couple_members cm
  JOIN public.couples c ON c.id = cm.couple_id
  WHERE cm.user_id = uid
  LIMIT 1;
  IF new_code IS NOT NULL THEN
    RETURN new_code;
  END IF;

  -- Generate a unique 6-char code
  LOOP
    new_code := upper(substr(encode(gen_random_bytes(6), 'base64'), 1, 6));
    new_code := regexp_replace(new_code, '[^A-Z0-9]', 'X', 'g');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.couples WHERE code = new_code);
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Could not allocate code';
    END IF;
  END LOOP;

  INSERT INTO public.couples (code, status) VALUES (new_code, p_status) RETURNING id INTO new_id;
  INSERT INTO public.couple_members (couple_id, user_id) VALUES (new_id, uid);
  RETURN new_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_couple(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
  uid uuid := auth.uid();
  member_count int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO target_id FROM public.couples WHERE code = upper(p_code);
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'Invalid code';
  END IF;

  SELECT count(*) INTO member_count FROM public.couple_members WHERE couple_id = target_id;
  IF member_count >= 2 AND NOT EXISTS (
    SELECT 1 FROM public.couple_members WHERE couple_id = target_id AND user_id = uid
  ) THEN
    RAISE EXCEPTION 'Couple is full';
  END IF;

  INSERT INTO public.couple_members (couple_id, user_id)
  VALUES (target_id, uid)
  ON CONFLICT DO NOTHING;

  RETURN target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_couple(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_couple(text) TO authenticated;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER couples_set_updated_at BEFORE UPDATE ON public.couples
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

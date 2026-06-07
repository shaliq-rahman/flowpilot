-- Fix infinite recursion in project_members SELECT policy.
-- The old policy queried project_members from within itself → stack overflow.
-- New policy: each user can only see their own membership rows (sufficient for this app).

DROP POLICY IF EXISTS "Members can view project membership" ON public.project_members;

CREATE POLICY "Members can view project membership" ON public.project_members
  FOR SELECT USING (user_id = auth.uid());

-- Add a foreign key constraint to the created_by column in the groups table

ALTER TABLE public.groups
ADD CONSTRAINT groups_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

COMMENT ON CONSTRAINT groups_created_by_fkey ON public.groups IS 'Ensures that the creator of a group is a valid user profile.';

-- Update trigger function to copy household data from inviter to invited family member
create or replace function public.handle_new_user()
returns trigger as $$
declare
  inviter_profile public.profiles%rowtype;
begin
  -- Check if this user was invited by someone
  if new.raw_user_meta_data->>'invited_by' is not null then
    select * into inviter_profile
    from public.profiles
    where id = (new.raw_user_meta_data->>'invited_by')::uuid;

    if found then
      insert into public.profiles (
        id, display_name, onboarding_completed,
        household_size, household_members, allergies,
        diet_preference, liked_recipes, budget_amount, budget_period
      ) values (
        new.id,
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        true,
        inviter_profile.household_size,
        inviter_profile.household_members,
        inviter_profile.allergies,
        inviter_profile.diet_preference,
        inviter_profile.liked_recipes,
        inviter_profile.budget_amount,
        inviter_profile.budget_period
      );
      return new;
    end if;
  end if;

  -- Default: create basic profile
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

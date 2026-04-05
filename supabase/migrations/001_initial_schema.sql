-- Fonix database schema

-- User profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Gamification state per user
create table public.gamification (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  xp integer default 0,
  level integer default 1,
  streak_count integer default 0,
  streak_last_date text default '',
  daily_challenge_completed_date text default '',
  badges text[] default '{}',
  total_coach_exchanges integer default 0,
  total_daily_challenges integer default 0,
  total_sentences integer default 0,
  total_perfect_scores integer default 0,
  total_great_words integer default 0,
  th_sound_great_count integer default 0,
  public_speaking_completed integer default 0,
  interview_completed integer default 0,
  updated_at timestamptz default now()
);

-- Practice history (each recording session)
create table public.practice_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mode text not null, -- 'shadowing', 'drill', 'coach'
  target_text text not null,
  feedback text,
  xp_earned integer default 0,
  created_at timestamptz default now()
);

-- Word progress (tracks individual word mastery)
create table public.word_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  word text not null,
  attempts integer default 1,
  last_band text default 'NEEDS_PRACTICE',
  best_band text default 'NEEDS_PRACTICE',
  tags text[] default '{}',
  last_practiced timestamptz default now(),
  unique(user_id, word)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.gamification enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.word_progress enable row level security;

-- RLS policies: users can only access their own data
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can read own gamification" on public.gamification for select using (auth.uid() = user_id);
create policy "Users can update own gamification" on public.gamification for update using (auth.uid() = user_id);
create policy "Users can insert own gamification" on public.gamification for insert with check (auth.uid() = user_id);

create policy "Users can read own sessions" on public.practice_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on public.practice_sessions for insert with check (auth.uid() = user_id);

create policy "Users can read own word progress" on public.word_progress for select using (auth.uid() = user_id);
create policy "Users can upsert own word progress" on public.word_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own word progress" on public.word_progress for update using (auth.uid() = user_id);

-- Auto-create profile + gamification row when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.gamification (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

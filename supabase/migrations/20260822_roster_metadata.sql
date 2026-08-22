alter table heat_entries add column if not exists team_code text;
alter table heat_entries add column if not exists gender text;
alter table meet_entries add column if not exists team_code text;
alter table meet_entries add column if not exists gender text;

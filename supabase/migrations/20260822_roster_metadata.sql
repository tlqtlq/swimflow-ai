alter table heat_entries add column if not exists team_code text;
alter table heat_entries add column if not exists gender text;
alter table meet_entries add column if not exists team_code text;
alter table meet_entries add column if not exists gender text;
alter table meets add column if not exists accent_color text not null default '#003296';

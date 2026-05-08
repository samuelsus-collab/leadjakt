-- Add notes field to leads
alter table leads add column if not exists notes text;

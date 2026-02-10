-- Seed filler items for the new `equipment` table
-- Run this in the Supabase SQL editor or psql with your project connection.
-- Assumes table definition:
--   id uuid primary key default uuid_generate_v4()
--   name text not null
--   description text
--   location text
--   status text
--   active boolean default true
--   notes text

insert into equipment (name, description, location, status, active, notes)
values
  ('Heat Gun', 'Adjustable temperature heat gun for shrink wrap and plastics.', 'Bench 3', 'Available', true, 'Return to front desk after use'),
  ('Clamp Set', 'Assorted C-clamps and quick clamps for workholding.', 'Tool Wall', 'Available', true, 'Please keep sets together'),
  ('Multimeter', 'Digital multimeter for voltage, continuity, and resistance.', 'Electronics Cart', 'In Use', true, 'Checked out — due back today'),
  ('Safety Glasses Bin', 'ANSI-rated eye protection in assorted sizes.', 'Entry Rack', 'Available', true, 'Please sanitize and return'),
  ('Oscilloscope', '2-channel scope for quick signal checks.', 'Electronics Cart', 'Maintenance', false, 'Calibration in progress');

-- Feel free to adjust status/notes per shop workflow.

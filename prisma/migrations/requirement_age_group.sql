-- Add age_group column to belt_requirements for age-specific requirements.
-- Values: "adults", "children", "common" (default).
ALTER TABLE belt_requirements
  ADD COLUMN age_group TEXT NOT NULL DEFAULT 'common';

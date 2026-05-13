/*
  # Add equipment rarity
    
  2. Changes to equipment table
    - Add rarity column with default value
    - Remove bonus_accuracy column
    
  3. Equipment slots
    - Now supports generic "장비" slots (max 5)
*/

-- Add rarity to equipment table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'rarity'
  ) THEN
    ALTER TABLE equipment ADD COLUMN rarity text DEFAULT '일반';
  END IF;
END $$;

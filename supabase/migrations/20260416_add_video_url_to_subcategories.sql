-- Add video_url column to subcategories table
ALTER TABLE subcategories ADD COLUMN video_url TEXT;

-- Add comment
COMMENT ON COLUMN subcategories.video_url IS 'URL to video resource for this subcategory';

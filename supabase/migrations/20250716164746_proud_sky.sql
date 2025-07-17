3/*
  # Blog Application Schema

  1. New Tables
    - `posts`: Blog posts with premium content support
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `content` (text, required)
      - `excerpt` (text, optional)
      - `is_premium` (boolean, default false)
      - `author_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on posts table
    - Public posts viewable by everyone
    - Premium posts viewable by subscribers only
    - Authors can create and edit their own posts
*/

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  is_premium boolean DEFAULT false,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Public posts are viewable by everyone"
  ON posts
  FOR SELECT
  USING (is_premium = false);

CREATE POLICY "Premium posts viewable by subscribers"
  ON posts
  FOR SELECT
  USING (
    is_premium = true AND 
    auth.uid() IN (
      SELECT sc.user_id 
      FROM stripe_customers sc
      JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id
      WHERE ss.status = 'active' AND sc.deleted_at IS NULL AND ss.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can create posts"
  ON posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
  ON posts
  FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
  ON posts
  FOR DELETE
  USING (auth.uid() = author_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
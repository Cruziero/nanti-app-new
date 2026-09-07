CREATE TABLE IF NOT EXISTS blog_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  read_time TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT TRUE,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_articles_slug ON blog_articles(slug);
CREATE INDEX idx_blog_articles_published ON blog_articles(published);
CREATE INDEX idx_blog_articles_date ON blog_articles(date DESC);

ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published articles" ON blog_articles
  FOR SELECT USING (published = TRUE);

CREATE POLICY "Service role can do everything" ON blog_articles
  FOR ALL USING (TRUE);

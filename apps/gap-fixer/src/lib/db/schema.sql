-- Gap Fixer Database Schema for Supabase
-- Run this in the Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table: represents a single gap report upload
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  member_id TEXT,
  member_name TEXT,
  total_articles INTEGER NOT NULL DEFAULT 0,
  processed_articles INTEGER NOT NULL DEFAULT 0,
  recoverable_articles INTEGER NOT NULL DEFAULT 0,
  total_gaps INTEGER NOT NULL DEFAULT 0,
  recoverable_gaps INTEGER NOT NULL DEFAULT 0,
  price_per_article DECIMAL(10, 2) NOT NULL DEFAULT 2.00,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  paid BOOLEAN NOT NULL DEFAULT FALSE
);

-- Articles table: individual DOIs from the gap report
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  doi TEXT NOT NULL,
  created_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'enriching', 'enriched', 'failed')),
  confidence_score DECIMAL(5, 2),
  is_recoverable BOOLEAN NOT NULL DEFAULT FALSE,
  enrichment_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, doi)
);

-- Gaps table: individual metadata gaps for each article
CREATE TABLE gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  gap_type TEXT NOT NULL CHECK (gap_type IN (
    'references',
    'abstracts',
    'orcid_ids',
    'affiliations',
    'ror_ids',
    'funder_registry_ids',
    'funding_award_numbers',
    'license_urls',
    'crossmark_enabled'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'recoverable', 'not_recoverable', 'recovered')),
  confidence_score DECIMAL(5, 2),
  sources TEXT[] DEFAULT '{}',
  recovered_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, gap_type)
);

-- Indexes for performance
CREATE INDEX idx_articles_job_id ON articles(job_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_doi ON articles(doi);
CREATE INDEX idx_gaps_article_id ON gaps(article_id);
CREATE INDEX idx_gaps_status ON gaps(status);
CREATE INDEX idx_gaps_gap_type ON gaps(gap_type);
CREATE INDEX idx_jobs_status ON jobs(status);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gaps_updated_at
  BEFORE UPDATE ON gaps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - enable for production
-- ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gaps ENABLE ROW LEVEL SECURITY;

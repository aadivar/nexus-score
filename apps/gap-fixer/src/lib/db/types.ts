export type GapType =
  | 'references'
  | 'abstracts'
  | 'orcid_ids'
  | 'affiliations'
  | 'ror_ids'
  | 'funder_registry_ids'
  | 'funding_award_numbers'
  | 'license_urls'
  | 'crossmark_enabled';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ArticleStatus = 'pending' | 'enriching' | 'enriched' | 'failed';
export type GapStatus = 'pending' | 'recoverable' | 'not_recoverable' | 'recovered';

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          status: JobStatus;
          member_id: string | null;
          member_name: string | null;
          total_articles: number;
          processed_articles: number;
          recoverable_articles: number;
          total_gaps: number;
          recoverable_gaps: number;
          price_per_article: number;
          total_price: number;
          paid: boolean;
        };
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
      };
      articles: {
        Row: {
          id: string;
          job_id: string;
          doi: string;
          created_date: string | null;
          status: ArticleStatus;
          confidence_score: number | null;
          is_recoverable: boolean;
          enrichment_data: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['articles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['articles']['Insert']>;
      };
      gaps: {
        Row: {
          id: string;
          article_id: string;
          gap_type: GapType;
          status: GapStatus;
          confidence_score: number | null;
          sources: string[];
          recovered_value: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['gaps']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['gaps']['Insert']>;
      };
    };
  };
}

// Helper types for the application
export interface Job {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: JobStatus;
  memberId: string | null;
  memberName: string | null;
  totalArticles: number;
  processedArticles: number;
  recoverableArticles: number;
  totalGaps: number;
  recoverableGaps: number;
  pricePerArticle: number;
  totalPrice: number;
  paid: boolean;
}

export interface Article {
  id: string;
  jobId: string;
  doi: string;
  createdDate: string | null;
  status: ArticleStatus;
  confidenceScore: number | null;
  isRecoverable: boolean;
  enrichmentData: Record<string, unknown> | null;
  gaps: Gap[];
}

export interface Gap {
  id: string;
  articleId: string;
  gapType: GapType;
  status: GapStatus;
  confidenceScore: number | null;
  sources: string[];
  recoveredValue: Record<string, unknown> | null;
}

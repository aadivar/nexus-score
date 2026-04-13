/**
 * OpenAlex publisher ID -> Crossref member ID mapping.
 *
 * Each Crossref member may be represented in OpenAlex by multiple publisher
 * entities (parent + L1/L2 children, imprints, regional arms). Any of these
 * OpenAlex IDs that deposit under the same Crossref member must aggregate here.
 * Missing an alternate ID means that publisher's articles get silently dropped
 * into the "Not analyzed" bucket — so the map must be kept current.
 *
 * Grouping uses `primary_location.source.host_organization` (singular) to avoid
 * ancestor double-counting from `host_organization_lineage`.
 */

export interface PublisherInfo {
  crossrefId: number;
  name: string;
}

export const PUBLISHER_MAP: Record<string, PublisherInfo> = {
  // Elsevier (78) — includes RELX parent, plus imprints/subsidiaries
  'https://openalex.org/P4310320990': { crossrefId: 78, name: 'Elsevier' },
  'https://openalex.org/I1318003438': { crossrefId: 78, name: 'Elsevier' }, // RELX Group institution entity
  'https://openalex.org/P4310315673': { crossrefId: 78, name: 'Elsevier' }, // Cell Press
  'https://openalex.org/P4310319955': { crossrefId: 78, name: 'Elsevier' }, // Academic Press
  'https://openalex.org/P4310321208': { crossrefId: 78, name: 'Elsevier' }, // Churchill Livingstone
  'https://openalex.org/P4310320345': { crossrefId: 78, name: 'Elsevier' }, // KeAi (joint Elsevier + China Science Publishing)
  'https://openalex.org/P4310320479': { crossrefId: 78, name: 'Elsevier' }, // Saunders

  // Springer Nature (297) — parent plus children/imprints
  'https://openalex.org/P4310319965': { crossrefId: 297, name: 'Springer Nature' },
  'https://openalex.org/P4310319900': { crossrefId: 297, name: 'Springer Nature' }, // Springer Science+Business Media
  'https://openalex.org/P4310319908': { crossrefId: 297, name: 'Springer Nature' }, // Nature Portfolio
  'https://openalex.org/P4310320256': { crossrefId: 297, name: 'Springer Nature' }, // BioMed Central
  'https://openalex.org/P4310319703': { crossrefId: 297, name: 'Springer Nature' }, // Palgrave Macmillan (primary)
  'https://openalex.org/P4310319702': { crossrefId: 297, name: 'Springer Nature' }, // Palgrave Macmillan (alternate entity)
  'https://openalex.org/P4310319972': { crossrefId: 297, name: 'Springer Nature' }, // Springer International Publishing
  'https://openalex.org/P4310320330': { crossrefId: 297, name: 'Springer Nature' }, // Adis, Springer Healthcare
  'https://openalex.org/P4310320267': { crossrefId: 297, name: 'Springer Nature' }, // Pleiades Publishing
  'https://openalex.org/P4310320108': { crossrefId: 297, name: 'Springer Nature' }, // Springer Nature (Netherlands)
  'https://openalex.org/P4310319986': { crossrefId: 297, name: 'Springer Nature' }, // Springer VS
  'https://openalex.org/P4310319879': { crossrefId: 297, name: 'Springer Nature' }, // J.B. Metzler
  'https://openalex.org/P4310321666': { crossrefId: 297, name: 'Springer Nature' }, // Springer Vienna
  'https://openalex.org/P4310320090': { crossrefId: 297, name: 'Springer Nature' }, // Springer Medizin
  'https://openalex.org/P4310319985': { crossrefId: 297, name: 'Springer Nature' }, // Spektrum-Verlag

  // Wiley (311) — no distinct OpenAlex children as of this map revision
  'https://openalex.org/P4310320595': { crossrefId: 311, name: 'Wiley' },

  // Oxford University Press (286)
  'https://openalex.org/P4310311648': { crossrefId: 286, name: 'Oxford University Press' },

  // Taylor & Francis (301) — includes CRC Press, Routledge, and smaller imprints
  'https://openalex.org/P4310320547': { crossrefId: 301, name: 'Taylor & Francis' },
  'https://openalex.org/P4310320584': { crossrefId: 301, name: 'Taylor & Francis' }, // CRC Press
  'https://openalex.org/P4310319847': { crossrefId: 301, name: 'Taylor & Francis' }, // Routledge
  'https://openalex.org/P4310320374': { crossrefId: 301, name: 'Taylor & Francis' }, // Heldref
  'https://openalex.org/P4310317116': { crossrefId: 301, name: 'Taylor & Francis' }, // Co-Action Publishing

  // Cambridge University Press (56)
  'https://openalex.org/P4310311721': { crossrefId: 56, name: 'Cambridge University Press' },

  // SAGE (179)
  'https://openalex.org/P4310320017': { crossrefId: 179, name: 'SAGE' },

  // PLOS (340)
  'https://openalex.org/P4310315706': { crossrefId: 340, name: 'PLOS' },

  // BMJ (239)
  'https://openalex.org/P4310319945': { crossrefId: 239, name: 'BMJ' },

  // MDPI AG (1968) — NOTE: 3611 is "Pro Pharma Communications", NOT MDPI.
  'https://openalex.org/P4310310987': { crossrefId: 1968, name: 'MDPI' },

  // Frontiers (1965)
  'https://openalex.org/P4310320527': { crossrefId: 1965, name: 'Frontiers' },

  // American Chemical Society (316)
  'https://openalex.org/P4310320006': { crossrefId: 316, name: 'ACS' },

  // American Physical Society (16)
  'https://openalex.org/P4310320261': { crossrefId: 16, name: 'APS' },

  // IOP Publishing (266) — parent "Institute of Physics" plus publishing arm
  'https://openalex.org/P4310311669': { crossrefId: 266, name: 'IOP Publishing' }, // Institute of Physics (parent)
  'https://openalex.org/P4310320083': { crossrefId: 266, name: 'IOP Publishing' }, // IOP Publishing

  // Wolters Kluwer (276) — Lippincott + Medknow
  'https://openalex.org/P4310318547': { crossrefId: 276, name: 'Wolters Kluwer' },
  'https://openalex.org/P4310315671': { crossrefId: 276, name: 'Wolters Kluwer' }, // Lippincott Williams & Wilkins
  'https://openalex.org/P4310320448': { crossrefId: 276, name: 'Wolters Kluwer' }, // Medknow

  // IEEE (263) — primary entity plus society sub-entities
  'https://openalex.org/P4310319808': { crossrefId: 263, name: 'IEEE' }, // Primary (1.47M works)
  'https://openalex.org/P4310320439': { crossrefId: 263, name: 'IEEE' }, // Computer Society
  'https://openalex.org/P4310320755': { crossrefId: 263, name: 'IEEE' }, // Magnetics Society
  'https://openalex.org/P4310320753': { crossrefId: 263, name: 'IEEE' }, // Antennas & Propagation Society
  'https://openalex.org/P4310316002': { crossrefId: 263, name: 'IEEE' }, // Communications Society
  'https://openalex.org/P4310321027': { crossrefId: 263, name: 'IEEE' }, // Sensors Council
  'https://openalex.org/P4310322178': { crossrefId: 263, name: 'IEEE' }, // Photonics Society
  'https://openalex.org/P4310322504': { crossrefId: 263, name: 'IEEE' }, // Engineering in Medicine and Biology
  'https://openalex.org/P4310322189': { crossrefId: 263, name: 'IEEE' }, // Education Society

  // American Medical Association (10) — note: JAMA Network uses AMA's Crossref member
  'https://openalex.org/P4310320406': { crossrefId: 10, name: 'AMA' },
  'https://openalex.org/P4310320259': { crossrefId: 10, name: 'AMA' }, // AMA (alternate listing)

  // Royal Society of Chemistry (292)
  'https://openalex.org/P4310320556': { crossrefId: 292, name: 'Royal Society of Chemistry' },

  // Cold Spring Harbor Laboratory (246)
  'https://openalex.org/P4310315909': { crossrefId: 246, name: 'Cold Spring Harbor Laboratory' },
  'https://openalex.org/I2750212522': { crossrefId: 246, name: 'Cold Spring Harbor Laboratory' },

  // AIP Publishing (317)
  'https://openalex.org/P4310320257': { crossrefId: 317, name: 'AIP Publishing' },

  // PNAS (341)
  'https://openalex.org/P4310320052': { crossrefId: 341, name: 'PNAS' },

  // De Gruyter / Brill (374) — Brill merged into De Gruyter; Brill's DOI
  // prefix 10.1163 now deposits under Crossref member 374. The standalone
  // "Brill" member (50) holds 0 DOIs post-merger.
  'https://openalex.org/P4310313990': { crossrefId: 374, name: 'De Gruyter' },

  // Emerald (140)
  'https://openalex.org/P4310319811': { crossrefId: 140, name: 'Emerald' },

  // Hindawi (98) — still has distinct Crossref member despite Wiley acquisition
  'https://openalex.org/P4310319869': { crossrefId: 98, name: 'Hindawi' },

  // Karger (127)
  'https://openalex.org/P4310317820': { crossrefId: 127, name: 'Karger' },

  // Thieme (194)
  'https://openalex.org/P4310320000': { crossrefId: 194, name: 'Thieme' },

  // Princeton University Press (10341)
  'https://openalex.org/P4310316492': { crossrefId: 10341, name: 'Princeton University Press' },

  // Brill — now deposits under De Gruyter post-merger; Crossref member 50
  // holds 0 DOIs. Route Brill's OpenAlex entity to De Gruyter's member (374).
  'https://openalex.org/P4310320561': { crossrefId: 374, name: 'De Gruyter / Brill' },

  // American Society for Microbiology (235)
  'https://openalex.org/P4310320263': { crossrefId: 235, name: 'ASM' },

  // American Psychological Association (15)
  'https://openalex.org/P4310320262': { crossrefId: 15, name: 'APA' },

  // AAAS / Science (221)
  'https://openalex.org/P4310315823': { crossrefId: 221, name: 'AAAS' },

  // University of Chicago Press (200)
  'https://openalex.org/P4310315672': { crossrefId: 200, name: 'University of Chicago Press' },

  // EDP Sciences (250)
  'https://openalex.org/P4310319748': { crossrefId: 250, name: 'EDP Sciences' },

  // World Scientific (26953)
  'https://openalex.org/P4310319815': { crossrefId: 26953, name: 'World Scientific' },

  // Trans Tech Publications (2457)
  'https://openalex.org/P4310317839': { crossrefId: 2457, name: 'Trans Tech Publications' },

  // ACM (320)
  'https://openalex.org/P4310319798': { crossrefId: 320, name: 'ACM' },

  // IOS Press (7437)
  'https://openalex.org/P4310318577': { crossrefId: 7437, name: 'IOS Press' },

  // AIAA (1387)
  'https://openalex.org/P4310315709': { crossrefId: 1387, name: 'AIAA' },

  // SPIE (189)
  'https://openalex.org/P4310315543': { crossrefId: 189, name: 'SPIE' },

  // ASM International — materials society, distinct from ASME (14553)
  'https://openalex.org/P4310316053': { crossrefId: 14553, name: 'ASM International' },

  // The Royal Society (175)
  'https://openalex.org/P4310319787': { crossrefId: 175, name: 'The Royal Society' },

  // Optica Publishing Group (formerly OSA) (285)
  'https://openalex.org/P4310315679': { crossrefId: 285, name: 'Optica Publishing Group' },

  // American Geophysical Union (13)
  'https://openalex.org/P4310315809': { crossrefId: 13, name: 'American Geophysical Union' },

  // American Society of Civil Engineers (30)
  'https://openalex.org/P4310315747': { crossrefId: 30, name: 'ASCE' },

  // American Physiological Society (24)
  'https://openalex.org/P4310320155': { crossrefId: 24, name: 'American Physiological Society' },

  // AAAI — Association for the Advancement of Artificial Intelligence (9382)
  'https://openalex.org/P4310320058': { crossrefId: 9382, name: 'AAAI' },

  // The Company of Biologists (237)
  'https://openalex.org/P4310311847': { crossrefId: 237, name: 'The Company of Biologists' },

  // Copernicus (3145)
  'https://openalex.org/P4310313756': { crossrefId: 3145, name: 'Copernicus Publications' },

  // Bentham Science (965)
  'https://openalex.org/P4310320079': { crossrefId: 965, name: 'Bentham Science' },

  // Society for Neuroscience (393)
  'https://openalex.org/P4310319739': { crossrefId: 393, name: 'Society for Neuroscience' },

  // American Association for Cancer Research (1086)
  'https://openalex.org/P4310320273': { crossrefId: 1086, name: 'AACR' },

  // eLife (4374)
  'https://openalex.org/P4310311710': { crossrefId: 4374, name: 'eLife' },

  // Massachusetts Medical Society — publisher of NEJM (150)
  'https://openalex.org/P4310320239': { crossrefId: 150, name: 'Massachusetts Medical Society' },

  // Wellcome (13928)
  'https://openalex.org/P4310311838': { crossrefId: 13928, name: 'Wellcome' },

  // JMIR Publications (1010)
  'https://openalex.org/P4310320608': { crossrefId: 1010, name: 'JMIR Publications' },

  // Microbiology Society (345) — UK, distinct from American Society for Microbiology (235)
  'https://openalex.org/P4310320497': { crossrefId: 345, name: 'Microbiology Society' },

  // British Editorial Society of Bone & Joint Surgery (42)
  'https://openalex.org/P4310311815': { crossrefId: 42, name: 'Bone & Joint Surgery' },

  // Royal College of General Practitioners — publisher of BJGP (1987)
  'https://openalex.org/P4310311776': { crossrefId: 1987, name: 'Royal College of General Practitioners' },
};

export interface CoverageMetrics {
  affiliations: number;
  rorIds: number;
  funders: number;
  abstracts: number;
  orcids: number;
  licenses: number;
}

export interface PublisherGap {
  name: string;
  crossrefId: number;
  articles: number;
  /** True when we measured gaps; false when articles < MIN_SAMPLE_SIZE */
  measured: boolean;
  coverage: CoverageMetrics;
  /** institutionalRor: articles where THIS institution's ROR was deposited on any author */
  institutionalRor: number;
  gap: {
    noAffiliation: number;
    noRor: number;
    noFunder: number;
    noAbstract: number;
    noLicense: number;
    noOrcid: number;
    /** articles missing this institution's ROR specifically (not just any ROR) */
    noInstitutionalRor: number;
  };
}

export interface UnmappedPublisher {
  name: string;
  articles: number;
  /**
   * Category for the entry:
   *  - 'no-metadata': OpenAlex itself has no publisher metadata for the article
   *  - 'institutional': entity is an institution/repo/lab, not a traditional publisher
   *  - 'unmapped-publisher': a real publisher we haven't added to our Crossref mapping yet
   */
  category: 'no-metadata' | 'institutional' | 'unmapped-publisher';
}

export interface InstitutionReport {
  institution: {
    name: string;
    ror: string;
    country: string;
  };
  dateRange: string;
  windowDays: number;
  totalArticles: number;
  /** Institution's journal-article count in the last 365 days — used for annual extrapolation in cost estimates. */
  annualArticleCount: number;
  /** Sum of articles at publishers mapped to Crossref (measured + sampleTooSmall) */
  trackedArticles: number;
  /** Sum of articles at publishers mapped AND with sample >= MIN_SAMPLE_SIZE */
  measuredArticles: number;
  publishers: PublisherGap[];
  unmappedPublishers: UnmappedPublisher[];
  /** Totals computed only over measuredArticles */
  totals: {
    noAffiliation: number;
    noRor: number;
    noFunder: number;
    noAbstract: number;
    noLicense: number;
    noInstitutionalRor: number;
    affiliationPercent: number;
    rorPercent: number;
    funderPercent: number;
    abstractPercent: number;
    institutionalRorPercent: number;
  };
  generatedAt: string;
  notes: {
    contentType: string;
    source: string;
    minSampleSize: number;
  };
}

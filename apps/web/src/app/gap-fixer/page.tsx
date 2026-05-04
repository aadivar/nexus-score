import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gap Fixer · Research Nexus Score',
  description:
    'A local diagnostic tool that turns a journal article PDF/DOCX into a Research Nexus scorecard plus a Crossref-ready DOI deposit XML. Self-hosted, AGPL-3.0, no vendor lock-in.',
};

const demoMailto =
  'mailto:varma2friend@gmail.com?subject=' +
  encodeURIComponent('Nexus Gap Fixer — Demo request') +
  '&body=' +
  encodeURIComponent(
    'Publisher:\nISSN(s):\nPreferred times:\nAnything we should know:\n',
  );

const pilotMailto =
  'mailto:varma2friend@gmail.com?subject=' +
  encodeURIComponent('Nexus Gap Fixer — Pilot application') +
  '&body=' +
  encodeURIComponent(
    'Publisher:\nTypical article volume / month:\nGap types you care most about:\nTimeline:\n',
  );

const layers = [
  {
    name: 'L0 · Docling layout',
    cost: '$0',
    detail: 'PDF/DOCX → structured JSON, per-element bboxes, page renders. Always runs.',
  },
  {
    name: 'L1 · Deterministic factsheet',
    cost: '$0',
    detail:
      'Regex sweep for DOI / ORCID / ROR / ISSN / arXiv / license / grant patterns + PDF /Info + header parser + boilerplate anchors (funding, CoI, data availability, ethics). Always runs.',
  },
  {
    name: 'L2 · Free identifier APIs',
    cost: '$0',
    detail:
      'ORCID public API, ROR v2, OpenAlex, Crossref REST. Affiliation normalisation, name-swap fallback, ROR clear-winner auto-accept. Triggered by the Auto-fix button.',
  },
  {
    name: 'L3 · LLM picker (opt-in)',
    cost: '~$0.0002 / call',
    detail:
      'Per-field structured-output call that picks among API candidates with reasoning + confidence. Only when the editor clicks "Adjudicate with AI".',
  },
  {
    name: 'L4 · LLM structurer (opt-in)',
    cost: '~$0.0003 – $0.013 / call',
    detail:
      'Higher-leverage call that takes a content region and returns a clean structured record. Five named tasks: structure_authors, structure_references, structure_funding, structure_credit, verify_authors.',
  },
  {
    name: 'Side path · GLiNER2 NER',
    cost: '$0 (on-device)',
    detail:
      'Local zero-shot NER (fastino/gliner2-large-v1) for ad-hoc entity extraction over a chosen text region. No network calls, no LLM cost.',
  },
];

const principles = [
  {
    title: 'Self-hosted',
    body: 'docker compose up. Runs on your infrastructure. No data leaves your network unless you opt into an LLM call.',
  },
  {
    title: 'No vendor lock-in',
    body: 'OpenAI-compatible LLM router — point it at OpenAI, OpenRouter, Anthropic-compat, Groq, Ollama, LiteLLM. Storage is plain disk; swap to S3/Postgres without touching app code.',
  },
  {
    title: 'AGPL-3.0',
    body: 'Fully reusable source code. Run it, modify it, redistribute it. If you run a modified version on a network service, you must offer that source to your users.',
  },
  {
    title: 'No fabrication',
    body: 'The LLM is constrained by structured outputs and explicit candidate lists. ORCIDs, DOIs, RORs, ISSNs come from APIs or PDF text — never invented.',
  },
  {
    title: 'Cost ledger per submission',
    body: 'Every paid call is the editor’s deliberate choice and is recorded in a per-submission USD ledger. Standard auto-fix is $0. Full premium pass tops out around $0.025/paper.',
  },
  {
    title: 'Crossref-ready output',
    body: 'Generates Crossref deposit XML (schema 5.3.1; 5.4.0 on the roadmap). Not just a report — a depositable artefact.',
  },
];

export default function GapFixerPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-amber-200 bg-amber-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
            Pilot · open for sign-ups
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Nexus Gap Fixer
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            A local diagnostic tool that turns a journal article PDF/DOCX into a
            Research Nexus scorecard plus a Crossref-ready DOI deposit XML.
            Self-hosted. AGPL-3.0. No vendor lock-in.
          </p>
          <p className="mt-4 text-base text-gray-600">
            Where the score tells you <em>what&apos;s missing</em>, this tool helps
            you <em>fix it</em> — one paper at a time, with every paid LLM call
            metered in USD and gated behind an explicit editor click.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={demoMailto}
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
            >
              Book a 30-min demo
            </a>
            <a
              href={pilotMailto}
              className="inline-flex items-center justify-center rounded-lg border border-amber-600 bg-white px-6 py-3 font-semibold text-amber-700 transition-colors hover:bg-amber-50"
            >
              Apply for the pilot
            </a>
            <a
              href="https://github.com/aadivar/metadata_gapfixer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              View source on GitHub &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Pilot pricing — $1 per article
            </h2>
            <p className="mt-3 text-gray-700">
              The $1/article fee is{' '}
              <strong>sustenance only — to keep the project alive</strong>. It
              covers infrastructure, identifier-API polite-pool registration,
              and the time to keep extractors current with Crossref schema
              changes. The software itself is AGPL-3.0; you can self-host the
              entire pipeline at zero per-article cost forever.
            </p>
            <p className="mt-3 text-gray-700">
              Invoiced monthly. Pilot is invite-only and capacity-limited so we
              can give every publisher real onboarding attention.
            </p>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            What you get — and what you don&apos;t lose
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {principles.map((p) => (
              <div
                key={p.title}
                className="rounded-lg border bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-gray-900">{p.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Architecture — five layers, transparent costs
          </h2>
          <p className="mt-3 text-gray-600">
            Each layer is independent. The deterministic layers (L0–L2) cover
            most fields for free. The LLM layers (L3, L4) only run when the
            editor explicitly opts in, with an upfront cost-confirm dialog.
          </p>
          <div className="mt-8 overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">Layer</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">What</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {layers.map((l) => (
                  <tr key={l.name}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {l.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {l.cost}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{l.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            For a typical paper, full premium processing tops out around{' '}
            <strong>$0.025</strong>. Standard auto-fix (no LLM) is{' '}
            <strong>$0</strong>.
          </p>
        </div>
      </section>

      {/* Scoring alignment */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Scored on the same Research Nexus rubric as the leaderboard
          </h2>
          <p className="mt-3 text-gray-600">
            One Mandatory deposit gate, then five Research Nexus dimensions
            using the exact weights you see on{' '}
            <Link href="/" className="text-blue-600 hover:underline">
              nexus-score
            </Link>
            . The hero score on every paper is the same weighted percentage —
            so what an editor sees on a single article maps directly to what
            their publisher sees on the leaderboard.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Mandatory gate', body: 'DOI, title, journal, ISSN, year, ≥1 author, full pub date, vol/issue/pages, copyright. Must be satisfied before deposit.' },
              { name: 'Provenance · 25%', body: 'References, refs-with-DOI, preprint→VoR link, Crossmark, conflict-of-interest, data/code availability.' },
              { name: 'People · 20%', body: 'Full author names, ORCID for corresponding + every author, CRediT contributor roles.' },
              { name: 'Funding · 20%', body: 'Funder Registry DOI, award/grant numbers.' },
              { name: 'Access · 20%', body: 'Abstract (plain + JATS), license, OA indicator, plain-language summary.' },
              { name: 'Organizations · 15%', body: 'Affiliations extracted, ROR for every affiliation.' },
            ].map((d) => (
              <div key={d.name} className="rounded-lg border bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900">{d.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-amber-200 bg-amber-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Try it on your titles
          </h2>
          <p className="mt-3 text-gray-700">
            Demo first. Pilot if it earns its place. $1/article pilot pricing —
            sustenance only, AGPL forever.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={demoMailto}
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
            >
              Book a 30-min demo
            </a>
            <a
              href={pilotMailto}
              className="inline-flex items-center justify-center rounded-lg border border-amber-600 bg-white px-6 py-3 font-semibold text-amber-700 transition-colors hover:bg-amber-50"
            >
              Apply for the pilot
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

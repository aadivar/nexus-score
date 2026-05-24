# Repo placement and rollout notes

> **Superseded 2026-05-24.** The data layer has moved from CC BY 4.0
> (with an AI-specific reservation) to **CC BY-NC 4.0**. Commercial use
> of any kind — not only AI — now requires a separate license. The
> notes below predate that change; the file/rollout structure still
> holds, but treat the "Don't list this as non-commercial" guidance and
> the Rob/Alice draft as historical context, not current messaging. See
> `LICENSE-DATA` and `COMMERCIAL-USE.md` for current terms.

## File placement

```
nexus-score/                  (repo root)
├── LICENSE                   ← existing AGPL-3.0, unchanged
├── LICENSE-DATA              ← new, CC BY 4.0 + AI reservation
├── AI-USE.md                 ← new, plain-English AI use page
├── ai.txt                    ← new, machine-readable opt-out
├── README.md                 ← edit to add the licensing section
└── ...

nexus-score.vercel.app/       (project website, public folder)
└── robots.txt                ← new, blocks AI crawlers
```

Everything legal-adjacent stays at repo root. GitHub auto-detects
`LICENSE`; `LICENSE-DATA` sits next to it; `AI-USE.md` and `ai.txt`
are visible in the file tree on first scroll.

`robots.txt` goes on the *website*, not in the repo root, because it
needs to be served at `https://nexus-score.vercel.app/robots.txt` to do
its job. For a Vercel/Next.js project, put it in the `public/` directory.

## Rollout sequence

1. **Contributor check.** `git log --all --format='%aN %aE' | sort -u` —
   if anyone other than you appears, the code is fine (AGPL stays), but
   confirm informally with anyone who shaped the methodology before
   changing the data layer terms. If it's just you, proceed.

2. **One coherent commit.** Push all four repo files together with a
   message like: "Add data license (CC BY 4.0), AI use policy, and
   machine-readable opt-out. Code remains AGPL-3.0." Single commit reads
   cleaner in history than three small ones.

3. **Website update.** Deploy `robots.txt` to the Vercel project's
   `public/` directory. Verify at
   `https://nexus-score.vercel.app/robots.txt` after deploy.

4. **GitHub repo description.** Add a short line like "Free for research
   and most commercial use under CC BY. Commercial AI training requires
   a license — see AI-USE.md."

5. **Heads-up to Rob and Alice.** Short note before the SK piece lands.
   Suggested wording in separate draft below.

6. **Pinned discussion or issue** titled "Licensing: code AGPL, data
   CC BY, commercial AI reserved" with a 4-line summary. This is your
   reference point if anyone asks publicly. Keep tone neutral and
   factual.

## What NOT to do

- **Don't relicense retroactively without a note.** Any dataset releases
  already published with no specified terms — add a one-line note to
  those releases: "Releases from this date forward are governed by
  LICENSE-DATA; earlier releases may be treated as CC BY 4.0 with the
  AI reservation."

- **Don't add AI restrictions to the code license.** AGPL on the engine
  is the right call; bolting AI restrictions onto AGPL would break OSI
  compatibility for no real gain — the value AI companies want is the
  *data and methodology*, not the Python.

- **Don't write a price into AI-USE.md.** Keep it a conversation until
  you have a few real inquiries and can calibrate. The first three AI
  conversations will teach you the right number; guessing in advance
  will either leave money on the table or scare people off.

- **Don't list this as a "non-commercial" project anywhere.** It isn't.
  CC BY 4.0 is unambiguously open. The reservation is narrow and
  specific. The framing matters for community positioning.

## Checks after deploy

- `https://nexus-score.vercel.app/robots.txt` returns the file.
- `https://nexus-score.vercel.app/ai.txt` (optional but worth adding) —
  copy `ai.txt` into the Vercel `public/` folder too so it's served at
  the website root, not only the repo root.
- GitHub repo sidebar shows AGPL-3.0 (auto-detected from LICENSE).
- README licensing section renders correctly with working links to
  LICENSE, LICENSE-DATA, AI-USE.md, ai.txt.

## Suggested heads-up to Rob and Alice (draft)

> Subject: Quick heads-up on Nexus Score licensing before the SK piece
>
> Rob, Alice — quick note before the piece lands.
>
> I am tightening up the licensing on the Nexus Score repo this week.
> Code stays AGPL. Scores and data are going under CC BY 4.0 — so
> everything in the piece about it being open remains accurate, no
> change there.
>
> The one addition: I am reserving rights for commercial AI training and
> AI product integration specifically. The well-funded AI labs that
> would otherwise scrape this should have to ask. Researchers,
> libraries, publishers, journalists, discovery platforms — all
> unaffected, all still free under CC BY.
>
> Flagging because if a publisher's legal team reads the piece and goes
> to the repo, I want them to see clear terms rather than ambiguity.
> Nothing in the piece needs to change. Just wanted you to know in case
> it comes up.
>
> Best
> AADI

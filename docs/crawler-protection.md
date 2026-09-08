# Crawler protection and hosting costs

Crawler protection is configured at both Cloudflare and Vercel. `robots.txt`
disallows every crawler, including search engines, but enforcement happens in
the firewalls. These controls also prevent search indexing and some automated
link previews.

## Cloudflare

The `nexus-index.com` zone proxies the apex and `www` records. The custom rule
**Block crawlers and known bots** blocks requests to those two hosts when
Cloudflare identifies a known bot (`cf.client.bot`) or the user agent identifies
a crawler, scraper, or headless browser. Matching is case insensitive. The
existing AI Crawl Control rule and Bot Fight Mode remain enabled.

`/robots.txt` is excluded from the custom crawler rule so compliant crawlers can
read the disallow policy. Cloudflare's managed rules may still block some agents.

## Vercel

The `nexus-score` project's **Block crawlers and scraper identities** rule denies
matching user agents on every project hostname, including `nexus-score.vercel.app`
and `nexus-score.org`. Those alternate hostnames redirect ordinary visitors to
`www.nexus-index.com`, but their initial requests still reach Vercel.

The rule matches bot, crawl, spider, slurp, Scrapy, archiver, BingPreview,
GoogleOther, Google-InspectionTool, Mediapartners-Google, Yandex, Claude,
Anthropic, ChatGPT, Perplexity, facebookexternalhit, meta-external, Cohere, and
HeadlessChrome, with case-insensitive character classes. It excludes
`/robots.txt`. The managed AI Bots ruleset is also set to Deny.

General Vercel Bot Protection remains in Log mode because
[Vercel documents reduced accuracy behind reverse proxies](https://vercel.com/docs/bot-management#bot-protection-ruleset-with-reverse-proxies).
Use Cloudflare's bot detection for proxied traffic. User-agent rules alone cannot
detect every scraper impersonating an ordinary browser.

Firewall changes take effect without a deployment. Inspect the current state
before editing, review the draft diff, and publish only the intended changes:

```sh
npx vercel@latest firewall overview --project nexus-score
npx vercel@latest firewall rules list --project nexus-score
npx vercel@latest firewall diff --project nexus-score
```

## Application cost control

Publisher pages reuse the parsed overall and current leaderboard snapshots
within each server process. The snapshots are immutable deployment files, so a
new data deployment starts a fresh cache. Rankings and scores are unchanged.
Restart a local development server after regenerating the snapshots.

## Verification

After a firewall change, check a named crawler, an unlisted crawler, and an
ordinary browser user agent on both the custom domain and the Vercel hostname.
Crawlers should receive 403, browsers should receive 200 or the canonical-domain
redirect, and robots.txt should remain available to compliant crawlers.

Review Firewall Traffic and Usage after the reporting delay. Vercel's
[WAF pricing documentation](https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing)
states that denied or challenged traffic does not incur CDN request or Fast Data
Transfer usage; traffic that passes through is billed normally.

Vercel spend notifications alone do not stop usage. Automatic budget pausing
affects every production project on the team, so configure that separately with
an agreed budget and availability policy.

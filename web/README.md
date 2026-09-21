# web

The documentation site — [Fumadocs](https://fumadocs.dev) on Next.js. Its
catalog is generated from this repository at build time, so the site builds
from a checkout and never from a copy of this directory alone.

- `content/docs/` — the prose: one page per plugin, plus the guides
- `lib/catalog.json` — generated from `marketplace.json`, each `plugin.json`,
  and each `SKILL.md`'s frontmatter

Never restate a skill list in MDX. The catalog components read the live data,
so a plugin missing from `marketplace.json` is invisible here, and a
hand-written list is wrong the moment a skill is added.

```bash
bun install
bun run dev              # catalog is rebuilt first, via predev
bun run catalog          # regenerate lib/catalog.json on its own
bun run types:check && bun run build
```

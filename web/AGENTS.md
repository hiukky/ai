<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# The `ai` documentation site

Fumadocs on Next.js, modelled on `uze/web`. It documents the marketplace that
lives in the parent directory.

## The catalog is generated, not written

`scripts/build-catalog.mjs` reads the **repository**: `../marketplace.json`
for the roster, each `../<plugin>/plugin.json` for the manifest, each
`../<plugin>/skills/*/SKILL.md`'s frontmatter for the capability and its
`invoke:` policy, then writes `lib/catalog.json`. It runs as `predev` and
`prebuild`, and its output is committed.

Consequences worth knowing before editing:

- **Never hand-edit `lib/catalog.json`.** Run `bun run catalog` (or just build).
- **Never restate a skill list in MDX.** Use `<PluginCards />`,
  `<PluginHeader name>`, `<PluginSkills name>`, `<PluginResources name>` or
  `<SkillTable />`. They all read the live catalog and take no facts as props.
- Adding a plugin to `../marketplace.json` puts it on the landing page, in
  `/docs/plugins` and in `/docs/plugins/skills` with no edit here. Only its own page
  (`content/docs/plugins/<name>.mdx`, plus an entry in that folder's
  `meta.json`) is hand-written.
- The generator runs at build time only, so nothing in the deployed app touches
  the filesystem, which is what keeps `web/` from tracing the whole repo into
  its output.

## Colour

Every colour is indirected through a `--p-*` variable. The four palettes
(`amber`, `periwinkle`, `terracotta`, `violet`) all ship in `app/palettes.css`;
`lib/palette.ts` picks the one the site ships with, and `?palette=<name>` on any
URL overrides it for a visit (`?palette=` clears). No component names a hex
value. If you find yourself writing one, add a token instead.

## Docs pages

The sidebar is Introduction (Welcome, Quickstart), then the `plugins/` and
`reference/` folders, each with a lucide icon. Every page carries an `icon:`
in its frontmatter; a plugin page's icon is also read by the catalog
generator, so its card and its sidebar entry show the same one. Pages are one
or two screens: what it does, the commands, a table. A page that moves keeps
its old URL through `redirects()` in `next.config.mjs`.

Frontmatter `title` is rendered by `DocsTitle`, so an MDX file must **not** open
with its own `# Heading`, which prints the title twice and adds a redundant
first TOC entry. Start at `##`.

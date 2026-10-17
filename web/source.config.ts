import { defineConfig } from 'fumadocs-mdx/config';

/*
  Monochrome syntax highlighting, to match a site with no hue in it. Contrast
  does the work colour usually does: commands at full ink, strings and
  flags a step down, comments the faintest. The hex values mirror
  the `--p-*` tokens in app/global.css (a highlighter runs at build time and
  cannot read CSS variables).
*/
function mono(name: string, type: 'light' | 'dark', ink: string, muted: string, faint: string) {
  return {
    name,
    type,
    colors: { 'editor.foreground': ink, 'editor.background': '#00000000' },
    tokenColors: [
      { settings: { foreground: ink } },
      { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: faint, fontStyle: 'italic' } },
      { scope: ['string', 'constant.other.option', 'constant.numeric', 'variable.parameter'], settings: { foreground: muted } },
      { scope: ['keyword', 'storage', 'entity.name.function', 'support.function', 'entity.name.tag'], settings: { foreground: ink } },
      { scope: ['punctuation', 'meta.brace'], settings: { foreground: muted } },
    ],
  };
}

// Additive: merged into fumadocs' default remark/rehype pipeline (GFM tables,
// headings, ...) rather than replacing it.
export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: mono('ai-mono-light', 'light', '#09090a', '#5d5d66', '#9a9aa3'),
        dark: mono('ai-mono-dark', 'dark', '#f4f4f5', '#9b9ba4', '#5e5e66'),
      },
    },
  },
});

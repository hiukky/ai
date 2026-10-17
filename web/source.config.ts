import { defineConfig } from 'fumadocs-mdx/config';
import { codeThemes } from './lib/code-theme';

// Additive: merged into fumadocs' default remark/rehype pipeline (GFM tables,
// headings, ...) rather than replacing it.
export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: codeThemes,
    },
  },
});

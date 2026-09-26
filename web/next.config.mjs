import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // The docs were regrouped into Introduction, Catalog and Reference; every
  // page that moved keeps its old address.
  async redirects() {
    const moved = {
      '/docs/getting-started': '/docs/quickstart',
      '/docs/skills': '/docs/plugins/skills',
      '/docs/anatomy': '/docs/reference/plugin-format',
      '/docs/authoring': '/docs/reference/adding-a-plugin',
    };
    return Object.entries(moved).map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

export default withMDX(config);

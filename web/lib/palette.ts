/*
  Which palette the site ships with. Change this one string to change the whole
  site. Every colour is indirected through app/palettes.css, and nothing in a
  component names a hex value.

  To compare without a rebuild, append `?palette=<name>` to any URL: the
  PaletteSwitch component stamps it on <html> for that visit only, and
  `?palette=` with no value returns to the shipped default.
*/
export const palettes = ['amber', 'periwinkle', 'terracotta', 'violet'] as const;

export type Palette = (typeof palettes)[number];

export const palette: Palette = 'amber';

export function isPalette(value: string | null): value is Palette {
  return value !== null && (palettes as readonly string[]).includes(value);
}

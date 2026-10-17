/*
  Monochrome syntax highlighting, to match a site with no hue in it. Contrast
  and weight do the work colour usually does: the command a line runs is ink
  and bold, its arguments a step down, flags and comments the faintest. The
  hex values mirror the `--p-*` tokens in app/global.css (the highlighter runs
  at build time and cannot read CSS variables).

  Shared by fenced code blocks (source.config.ts) and <InstallCommand>, so a
  command reads the same whichever one renders it.
*/
function mono(name: string, type: 'light' | 'dark', ink: string, muted: string, faint: string) {
  return {
    name,
    type,
    colors: { 'editor.foreground': ink, 'editor.background': '#00000000' },
    tokenColors: [
      { settings: { foreground: ink } },
      {
        scope: ['comment', 'punctuation.definition.comment'],
        settings: { foreground: faint, fontStyle: 'italic' },
      },
      {
        scope: ['string', 'constant.numeric', 'variable.parameter', 'variable.other'],
        settings: { foreground: muted },
      },
      { scope: ['constant.other.option'], settings: { foreground: faint } },
      {
        scope: [
          'entity.name.command',
          'entity.name.function',
          'support.function',
          'keyword',
          'storage',
          'entity.name.tag',
        ],
        settings: { foreground: ink, fontStyle: 'bold' },
      },
      { scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: muted } },
    ],
  };
}

export const codeThemes = {
  light: mono('ai-mono-light', 'light', '#09090a', '#5d5d66', '#9a9aa3'),
  dark: mono('ai-mono-dark', 'dark', '#f4f4f5', '#9b9ba4', '#5e5e66'),
};

/* Pure theme color generation and validation. */

const HEADER = `  /* ============================================================================
   * Theme Colors - Auto-generated from constants.ts
   * DO NOT EDIT THIS SECTION MANUALLY
   * Run: npm run build:css-vars to regenerate
   * ============================================================================ */`;
const END = '  /* END GENERATED THEME COLORS */';
const GROUPS = [
  ['Text Colors', ['text-primary', 'text-secondary']],
  ['Background Colors', ['bg-primary', 'bg-secondary']],
  ['Theme/Brand Colors', ['theme-primary', 'theme-secondary']],
  ['Drag & Drop Colors', ['ghost-background', 'ghost-border', 'drop-zone']],
  ['Shadow Colors', ['shadow-light', 'shadow-medium', 'shadow-success', 'shadow-success-light']],
  ['Success Colors', ['success']],
  ['Pending Status Colors', ['pending', 'pending-foreground', 'pending-accent', 'pending-button']],
  ['Overlay Colors', ['overlay']],
  [
    'Interaction Colors',
    ['interactive-focus', 'interactive-hover', 'interactive-hover-light', 'interactive-hover-dark'],
  ],
  [
    'Surface Colors',
    [
      'border-light',
      'border-medium',
      'border-dark',
      'control-bg',
      'control-hover',
      'control-accent',
    ],
  ],
  [
    'State - Success/Complete Colors',
    [
      'success-bg',
      'success-attention',
      'success-control-hover',
      'success-text',
      'success-text-dark',
      'success-border',
      'success-accent',
      'success-text-complete',
    ],
  ],
  ['State - Danger/Delete Colors', ['danger-text', 'danger-bg', 'danger-focus']],
];

/** Convert supported RGB colors to their canonical CSS representation.
 * @param {string} value - RGB or RGBA value.
 * @returns {string} Canonical color.
 */
export function normalizeColor(value) {
  const match = value.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d*\.?\d+))?\s*\)$/
  );
  if (!match || value.startsWith('rgba(') !== (match[4] !== undefined))
    throw new Error(`Unsupported color: ${value}`);
  const rgb = match.slice(1, 4).map(Number);
  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  if (rgb.some((number) => number > 255) || alpha > 1) throw new Error(`Invalid color: ${value}`);
  return alpha === 1
    ? `#${rgb.map((number) => number.toString(16).padStart(2, '0')).join('')}`
    : `rgba(${rgb.join(', ')}, ${alpha})`;
}

/** Read every theme entry; reject formats that cannot be generated safely.
 * @param {string} source - Constants source text.
 * @returns {Map<string, string>} CSS variable names and canonical values.
 */
export function parseThemeColors(source) {
  const matches = [...source.matchAll(/export const THEME_COLORS = \{([\s\S]*?)\n\};/g)];
  if (matches.length !== 1)
    throw new Error('Expected exactly one THEME_COLORS object in constants.ts');
  const colors = new Map();
  const content = matches[0][1].replace(/\/\*[\s\S]*?\*\//g, '');
  for (const line of content.split('\n')) {
    const entry = line.replace(/\/\/.*$/, '').trim();
    if (!entry) continue;
    const match = entry.match(/^(\w+):\s*'(rgba?\([^)]+\))',?$/);
    if (!match) throw new Error(`Unsupported THEME_COLORS entry: ${entry}`);
    const name = `--${match[1].replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
    if (colors.has(name)) throw new Error(`Duplicate theme variable: ${name}`);
    colors.set(name, normalizeColor(match[2]));
  }
  if (!colors.size) throw new Error('THEME_COLORS must not be empty');
  const grouped = GROUPS.flatMap(([, names]) => names.map((name) => `--${name}`));
  if (new Set(grouped).size !== grouped.length)
    throw new Error('Duplicate theme generation group entry');
  const missingGroup = [...colors.keys()].filter((name) => !grouped.includes(name));
  const missingColor = grouped.filter((name) => !colors.has(name));
  if (missingGroup.length || missingColor.length)
    throw new Error(
      `Theme generation groups mismatch: ungrouped ${missingGroup.join(', ') || 'none'}; missing constants ${missingColor.join(', ') || 'none'}`
    );
  return colors;
}

/** Render the explicitly owned CSS region.
 * @param {Map<string, string>} colors - Theme variables.
 * @returns {string} Generated CSS region.
 */
export function renderThemeRegion(colors) {
  const sections = GROUPS.map(
    ([label, names]) =>
      `  /* ${label} */\n${names.map((name) => `  --${name}: ${colors.get(`--${name}`)};`).join('\n')}`
  );
  return `${HEADER}\n\n${sections.join('\n\n')}\n${END}`;
}

/** Find the generated region, preserving every byte outside it.
 * @param {string} css - Original stylesheet.
 * @returns {{start: number, end: number, root: number, rootEnd: number}} Region offsets.
 */
export function findThemeRegion(css) {
  const root = css.indexOf(':root {');
  const rootEnd = css.indexOf('}', root);
  const start = css.indexOf(HEADER);
  const end = css.indexOf(END);
  if (
    root < 0 ||
    rootEnd < 0 ||
    start < root ||
    end < start ||
    end > rootEnd ||
    css.indexOf(HEADER, start + 1) !== -1 ||
    css.indexOf(END, end + 1) !== -1
  )
    throw new Error('Missing or ambiguous generated theme markers inside :root');
  return { start, end: end + END.length, root, rootEnd };
}

/** Compare actual CSS declarations against independent parsed constants.
 * @param {string} source - Constants source text.
 * @param {string} css - Original stylesheet.
 * @returns {number} Number of validated variables.
 */
export function checkThemeCss(source, css) {
  const colors = parseThemeColors(source);
  const region = findThemeRegion(css);
  const raw = css.slice(region.start, region.end).replace(/\/\*[\s\S]*?\*\//g, '');
  const actual = new Map();
  if (raw.trim() && !raw.trim().endsWith(';'))
    throw new Error('Missing CSS declaration terminator');
  for (const declaration of raw.split(';')) {
    const entry = declaration.trim();
    if (!entry) continue;
    const match = entry.match(/^(--[a-z0-9-]+)\s*:\s*([^;]+)$/);
    if (!match) throw new Error(`Unsupported generated CSS entry: ${entry}`);
    if (actual.has(match[1])) throw new Error(`Duplicate CSS variable: ${match[1]}`);
    const value = match[2].trim();
    const hex = value.toLowerCase();
    const normalized = /^#[0-9a-f]{3}$/.test(hex)
      ? `#${[...hex.slice(1)].map((digit) => digit + digit).join('')}`
      : hex;
    actual.set(match[1], value.startsWith('rgb') ? normalizeColor(value) : normalized);
  }
  const outside = (css.slice(0, region.start) + css.slice(region.end)).replace(
    /\/\*[\s\S]*?\*\//g,
    ''
  );
  const duplicate = [...outside.matchAll(/(--[a-z0-9-]+)\s*:/g)]
    .map((match) => match[1])
    .filter((name) => colors.has(name));
  if (duplicate.length)
    throw new Error(
      `Theme variables also declared outside the generated region: ${duplicate.join(', ')}`
    );
  const missing = [...colors.keys()].filter((name) => !actual.has(name));
  const extra = [...actual.keys()].filter((name) => !colors.has(name));
  const changed = [...colors]
    .filter(([name, value]) => actual.has(name) && actual.get(name) !== value)
    .map(([name]) => name);
  if (missing.length || extra.length || changed.length)
    throw new Error(
      `Theme CSS mismatch: missing ${missing.join(', ') || 'none'}; extra ${extra.join(', ') || 'none'}; changed ${changed.join(', ') || 'none'}`
    );
  return colors.size;
}

/** Generate updated CSS without modifying unrelated regions.
 * @param {string} source - Constants source text.
 * @param {string} css - Original stylesheet.
 * @returns {string} Updated stylesheet.
 */
export function generateThemeCss(source, css) {
  const colors = parseThemeColors(source);
  const region = findThemeRegion(css);
  const updated = css.slice(0, region.start) + renderThemeRegion(colors) + css.slice(region.end);
  checkThemeCss(source, updated);
  return updated;
}

/**
 * THEME CONFIGURATION - Nuestras Artesanías
 * Extracted from brand logo - unified design system
 */

export const themeColors = {
  // Primary Palette (Warm Earth Tones - from Logo)
  primary: {
    darkest: '#5C2D0E',    // Deep chocolate brown
    dark: '#6B4423',       // Main brand brown (logo text)
    mid: '#8B4513',        // Rich saddle brown
    light: '#A0522D',      // Warm sienna
    lighter: '#C9956A',    // Light tan
    lightest: '#D4A574',   // Pale tan
  },

  // Backgrounds & Neutrals
  background: {
    canvas: '#E8D5C4',     // Warm sand (from logo bg)
    primary: '#FFFDF9',    // Parchment/cream (from logo lines)
    secondary: '#FAF5F0',  // Off-white
    tertiary: '#F5F0EB',   // Light cream
    hover: '#F9F3ED',      // Subtle hover bg
  },

  // Text Colors
  text: {
    primary: '#2D1A0E',    // Near black (for best readability)
    secondary: '#6B4423',  // Brown text
    tertiary: '#9A7060',   // Muted brown
    light: '#B8A89C',      // Light gray-brown
    muted: '#888888',      // Gray
    inverse: '#FFFDF9',    // Text on dark backgrounds
  },

  // Semantic Colors
  semantic: {
    success: '#27AE60',    // Green
    error: '#E74C3C',      // Red
    warning: '#F39C12',    // Orange
    info: '#3498DB',       // Blue
  },

  // Borders & Dividers
  border: {
    primary: 'rgba(107, 68, 35, 0.15)',   // Brown tint
    light: 'rgba(107, 68, 35, 0.08)',    // Lighter brown
    lighter: 'rgba(107, 68, 35, 0.04)',  // Very light
  },

  // Accents & Highlights
  accent: {
    gold: '#C9956A',       // Warm accent
    goldLight: '#E8C49A',  // Light gold
    goldLighter: '#F5E6D3', // Pale gold
  },
};

/**
 * Component-Specific Theme Objects
 */
export const componentThemes = {
  button: {
    primary: {
      bg: themeColors.primary.dark,
      text: themeColors.text.inverse,
      hover: themeColors.primary.mid,
      active: themeColors.primary.darkest,
    },
    secondary: {
      bg: themeColors.background.tertiary,
      text: themeColors.text.primary,
      hover: themeColors.background.hover,
      active: themeColors.primary.lighter,
    },
    ghost: {
      bg: 'transparent',
      text: themeColors.primary.dark,
      hover: themeColors.background.tertiary,
      active: themeColors.primary.light,
    },
  },

  card: {
    bg: themeColors.text.inverse,
    border: themeColors.border.light,
    shadow: 'rgba(107, 68, 35, 0.12)',
    hover: 'rgba(107, 68, 35, 0.08)',
  },

  sidebar: {
    dark: {
      bg: themeColors.primary.dark,
      text: themeColors.text.inverse,
      hover: themeColors.primary.mid,
      accent: themeColors.accent.gold,
    },
    light: {
      bg: themeColors.text.inverse,
      text: themeColors.text.primary,
      hover: themeColors.background.tertiary,
      accent: themeColors.primary.dark,
    },
  },

  navbar: {
    bg: themeColors.text.inverse,
    text: themeColors.text.primary,
    border: themeColors.border.light,
    hover: themeColors.background.tertiary,
  },

  input: {
    bg: themeColors.text.inverse,
    border: themeColors.border.light,
    borderFocus: themeColors.primary.dark,
    text: themeColors.text.primary,
    placeholder: themeColors.text.light,
  },

  badge: {
    paid: { bg: '#D1FAE5', text: '#065F46' },
    pending: { bg: '#FEE2E2', text: '#991B1B' },
    shipped: { bg: '#DDD6FE', text: '#4338CA' },
  },
};

/**
 * CSS Variables Export (for JS access)
 */
export const getCSSVariables = () => {
  const vars = {};
  Object.entries(themeColors).forEach(([key, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, color]) => {
        vars[`--color-${key}-${subKey}`] = color;
      });
    } else {
      vars[`--color-${key}`] = value;
    }
  });
  return vars;
};

export default themeColors;



export const themeColors = {

  primary: {
    darkest: '#5C2D0E',
    dark: '#6B4423',
    mid: '#8B4513',
    light: '#A0522D',
    lighter: '#C9956A',
    lightest: '#D4A574',
  },

  background: {
    canvas: '#E8D5C4',
    primary: '#FFFDF9',
    secondary: '#FAF5F0',
    tertiary: '#F5F0EB',
    hover: '#F9F3ED',
  },

  text: {
    primary: '#2D1A0E',
    secondary: '#6B4423',
    tertiary: '#9A7060',
    light: '#B8A89C',
    muted: '#888888',
    inverse: '#FFFDF9',
  },

  semantic: {
    success: '#27AE60',
    error: '#E74C3C',
    warning: '#F39C12',
    info: '#3498DB',
  },

  border: {
    primary: 'rgba(107, 68, 35, 0.15)',
    light: 'rgba(107, 68, 35, 0.08)',
    lighter: 'rgba(107, 68, 35, 0.04)',
  },

  accent: {
    gold: '#C9956A',
    goldLight: '#E8C49A',
    goldLighter: '#F5E6D3',
  },
};

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

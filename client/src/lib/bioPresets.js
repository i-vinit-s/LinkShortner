export var BIO_PRESETS = {
  signal: {
    label: "Signal",
    bg: "#12141C",
    surface: "#1B1F2A",
    accent: "#F5A623",
    text: "#EDEFF4",
  },
  ocean: {
    label: "Ocean",
    bg: "#0B1220",
    surface: "#111C2E",
    accent: "#38BDF8",
    text: "#E7F0FA",
  },
  sunset: {
    label: "Sunset",
    bg: "#1A1210",
    surface: "#241714",
    accent: "#FB7185",
    text: "#FDEDEB",
  },
  forest: {
    label: "Forest",
    bg: "#0F1712",
    surface: "#16231C",
    accent: "#4ADE80",
    text: "#E7F5EC",
  },
  mono: {
    label: "Mono",
    bg: "#0A0A0A",
    surface: "#171717",
    accent: "#FFFFFF",
    text: "#F5F5F5",
  },
  midnight: {
    label: "Midnight",
    bg: "#0B0B1A",
    surface: "#15152B",
    accent: "#818CF8",
    text: "#E8E8FF",
  },
  neon: {
    label: "Neon",
    bg: "#0A0612",
    surface: "#150B24",
    accent: "#FF2E97",
    text: "#F5E9FF",
  },
  aurora: {
    label: "Aurora",
    bg: "#06141B",
    surface: "#0C222D",
    accent: "#2DD4BF",
    text: "#E6FBF7",
  },
  sakura: {
    label: "Sakura",
    bg: "#FFF1F5",
    surface: "#FFFFFF",
    accent: "#E11D74",
    text: "#3B1426",
  },
  sand: {
    label: "Sand",
    bg: "#F6F1E7",
    surface: "#FFFDF8",
    accent: "#B45309",
    text: "#2B2218",
  },
  terminal: {
    label: "Terminal",
    bg: "#050A05",
    surface: "#0B140B",
    accent: "#22FF66",
    text: "#C8F7D0",
  },
};

export var DEFAULT_THEME = {
  preset: "signal",
  custom: {
    bg: "#12141C",
    surface: "#1B1F2A",
    accent: "#F5A623",
    text: "#EDEFF4",
  },
  buttonStyle: "rounded",
  buttonFill: "surface",
  buttonHover: "fade",
  background: "solid",
  font: "classic",
  avatarShape: "circle",
  avatarRing: false,
  animate: false,
};

// One-click looks: they only set theme fields, the user can fine-tune afterwards
export var BIO_TEMPLATES = [
  {
    key: "clean",
    label: "Clean",
    theme: {
      preset: "signal",
      background: "solid",
      font: "classic",
      buttonStyle: "rounded",
      buttonFill: "surface",
      buttonHover: "fade",
      avatarShape: "circle",
      avatarRing: false,
      animate: false,
    },
  },
  {
    key: "neon",
    label: "Neon Night",
    theme: {
      preset: "neon",
      background: "aurora",
      font: "grotesk",
      buttonStyle: "pill",
      buttonFill: "outline",
      buttonHover: "glow",
      avatarShape: "circle",
      avatarRing: true,
      animate: true,
    },
  },
  {
    key: "glass",
    label: "Glass Aurora",
    theme: {
      preset: "aurora",
      background: "aurora",
      font: "grotesk",
      buttonStyle: "rounded",
      buttonFill: "glass",
      buttonHover: "lift",
      avatarShape: "circle",
      avatarRing: true,
      animate: true,
    },
  },
  {
    key: "terminal",
    label: "Terminal",
    theme: {
      preset: "terminal",
      background: "grid",
      font: "mono",
      buttonStyle: "square",
      buttonFill: "outline",
      buttonHover: "glow",
      avatarShape: "square",
      avatarRing: false,
      animate: false,
    },
  },
  {
    key: "pastel",
    label: "Soft Pastel",
    theme: {
      preset: "sakura",
      background: "gradient",
      font: "serif",
      buttonStyle: "pill",
      buttonFill: "solid",
      buttonHover: "lift",
      avatarShape: "circle",
      avatarRing: true,
      animate: true,
    },
  },
  {
    key: "brutal",
    label: "Brutalist",
    theme: {
      preset: "sand",
      background: "solid",
      font: "mono",
      buttonStyle: "square",
      buttonFill: "brutal",
      buttonHover: "lift",
      avatarShape: "square",
      avatarRing: false,
      animate: false,
    },
  },
];

// Fills in anything missing so old pages (saved before these options existed) still render
export function normalizeTheme(theme) {
  var t = Object.assign({}, DEFAULT_THEME, theme || {});
  t.custom = Object.assign(
    {},
    DEFAULT_THEME.custom,
    (theme && theme.custom) || {},
  );
  return t;
}

export function resolveThemeColors(theme) {
  if (!theme) return BIO_PRESETS.signal;
  if (theme.preset === "custom" && theme.custom) {
    return {
      bg: theme.custom.bg || BIO_PRESETS.signal.bg,
      surface: theme.custom.surface || BIO_PRESETS.signal.surface,
      accent: theme.custom.accent || BIO_PRESETS.signal.accent,
      text: theme.custom.text || BIO_PRESETS.signal.text,
    };
  }
  return BIO_PRESETS[theme.preset] || BIO_PRESETS.signal;
}

// ---- color helpers (inputs are validated 6-digit hex values) ----
var HEX = /^#[0-9a-fA-F]{6}$/;

function parseHex(hex) {
  if (!HEX.test(hex)) return [0, 0, 0];
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function hexToRgba(hex, alpha) {
  var c = parseHex(hex);
  return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alpha + ")";
}

export function mixHex(a, b, t) {
  var x = parseHex(a);
  var y = parseHex(b);
  var out = "#";
  for (var i = 0; i < 3; i++) {
    var v = Math.round(x[i] + (y[i] - x[i]) * t);
    out += (v < 16 ? "0" : "") + v.toString(16);
  }
  return out;
}

// Dark or light text, whichever reads better on the given background
export function readableOn(hex) {
  var c = parseHex(hex);
  var lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  return lum > 0.6 ? "#0A0A0A" : "#FFFFFF";
}

// ---- style builders ----
export function buttonRadiusClass(buttonStyle) {
  if (buttonStyle === "pill") return "rounded-full";
  if (buttonStyle === "square") return "rounded-none";
  return "rounded-lg";
}

export function avatarRadiusClass(shape) {
  if (shape === "square") return "rounded-none";
  if (shape === "rounded") return "rounded-2xl";
  return "rounded-full";
}

export function fontSetup(font) {
  if (font === "grotesk")
    return { name: "font-display", body: "font-display", style: {} };
  if (font === "mono")
    return { name: "font-mono", body: "font-mono", style: {} };
  if (font === "serif") {
    return {
      name: "",
      body: "",
      style: { fontFamily: "Georgia, 'Times New Roman', serif" },
    };
  }
  return { name: "font-display", body: "font-body", style: {} }; // classic
}

export function pageBackgroundStyle(background, colors) {
  if (background === "gradient") {
    return {
      backgroundColor: colors.bg,
      backgroundImage:
        "linear-gradient(160deg, " +
        colors.bg +
        " 0%, " +
        mixHex(colors.bg, colors.accent, 0.22) +
        " 100%)",
    };
  }
  if (background === "grid") {
    var line = hexToRgba(colors.text, 0.07);
    return {
      backgroundColor: colors.bg,
      backgroundImage:
        "linear-gradient(" +
        line +
        " 1px, transparent 1px), linear-gradient(90deg, " +
        line +
        " 1px, transparent 1px)",
      backgroundSize: "32px 32px",
    };
  }
  return { backgroundColor: colors.bg }; // solid, and the base layer for aurora
}

export function buttonLook(fill, colors) {
  if (fill === "outline") {
    return {
      backgroundColor: "transparent",
      color: colors.text,
      border: "1.5px solid " + colors.accent,
    };
  }
  if (fill === "solid") {
    return {
      backgroundColor: colors.accent,
      color: readableOn(colors.accent),
      border: "1px solid " + colors.accent,
    };
  }
  if (fill === "glass") {
    return {
      backgroundColor: hexToRgba(colors.surface, 0.55),
      color: colors.text,
      border: "1px solid " + hexToRgba(colors.text, 0.18),
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
    };
  }
  if (fill === "brutal") {
    return {
      backgroundColor: colors.surface,
      color: colors.text,
      border: "2px solid " + colors.accent,
      boxShadow: "4px 4px 0 " + colors.accent,
    };
  }
  return {
    backgroundColor: colors.surface,
    color: colors.text,
    border: "1px solid " + colors.accent + "33",
  };
}

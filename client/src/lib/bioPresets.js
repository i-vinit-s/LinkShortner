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
};

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

export function buttonRadiusClass(buttonStyle) {
  if (buttonStyle === "pill") return "rounded-full";
  if (buttonStyle === "square") return "rounded-none";
  return "rounded-lg";
}

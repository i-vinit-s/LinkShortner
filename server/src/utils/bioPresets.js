var PRESET_KEYS = [
  "signal",
  "ocean",
  "sunset",
  "forest",
  "mono",
  "midnight",
  "neon",
  "aurora",
  "sakura",
  "sand",
  "terminal",
  "custom",
];
var HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

// Every visual option is an allow-listed value, so nothing user-controlled
// can reach the inline styles on public pages except validated hex colors.
var THEME_ENUMS = {
  buttonStyle: ["rounded", "pill", "square"],
  buttonFill: ["surface", "outline", "solid", "glass", "brutal"],
  buttonHover: ["fade", "lift", "glow", "none"],
  background: ["solid", "gradient", "aurora", "grid"],
  font: ["classic", "grotesk", "mono", "serif"],
  avatarShape: ["circle", "rounded", "square"],
};
var THEME_BOOLEANS = ["avatarRing", "animate"];

function isValidTheme(theme) {
  if (theme === undefined || theme === null) return true; // optional — defaults apply
  if (typeof theme !== "object" || Array.isArray(theme)) return false;

  if (theme.preset && PRESET_KEYS.indexOf(theme.preset) === -1) return false;

  var enumKeys = Object.keys(THEME_ENUMS);
  for (var i = 0; i < enumKeys.length; i++) {
    var value = theme[enumKeys[i]];
    if (value !== undefined && THEME_ENUMS[enumKeys[i]].indexOf(value) === -1)
      return false;
  }

  for (var b = 0; b < THEME_BOOLEANS.length; b++) {
    var flag = theme[THEME_BOOLEANS[b]];
    if (flag !== undefined && typeof flag !== "boolean") return false;
  }

  if (theme.custom) {
    if (typeof theme.custom !== "object" || Array.isArray(theme.custom))
      return false;
    var keys = ["bg", "surface", "accent", "text"];
    for (var k = 0; k < keys.length; k++) {
      var c = theme.custom[keys[k]];
      if (c && !HEX_REGEX.test(c)) return false;
    }
  }
  return true;
}

module.exports = { PRESET_KEYS, THEME_ENUMS, isValidTheme };

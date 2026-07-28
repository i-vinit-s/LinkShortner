var PRESET_KEYS = ["signal", "ocean", "sunset", "forest", "mono", "custom"];
var HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

function isValidTheme(theme) {
  if (!theme) return true; // optional — defaults apply
  if (theme.preset && PRESET_KEYS.indexOf(theme.preset) === -1) return false;
  if (
    theme.buttonStyle &&
    ["rounded", "pill", "square"].indexOf(theme.buttonStyle) === -1
  )
    return false;
  if (theme.preset === "custom" && theme.custom) {
    var c = theme.custom;
    var keys = ["bg", "surface", "accent", "text"];
    for (var i = 0; i < keys.length; i++) {
      if (c[keys[i]] && !HEX_REGEX.test(c[keys[i]])) return false;
    }
  }
  return true;
}

module.exports = { PRESET_KEYS, isValidTheme };

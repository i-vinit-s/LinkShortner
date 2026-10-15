import { BioIcon } from "@/components/BioIcons";
import {
  normalizeTheme,
  resolveThemeColors,
  buttonRadiusClass,
  avatarRadiusClass,
  fontSetup,
  pageBackgroundStyle,
  buttonLook,
  mixHex,
} from "@/lib/bioPresets";

// Two soft, slowly drifting color blobs behind the content
function AuroraBlobs(props) {
  var colors = props.colors;
  var second = mixHex(colors.accent, "#7C6FF0", 0.55);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="bio-blob absolute -top-24 -left-24 h-72 w-72 rounded-full"
        style={{
          background: colors.accent,
          opacity: 0.28,
          filter: "blur(80px)",
        }}
      />
      <div
        className="bio-blob bio-blob-b absolute -bottom-28 -right-20 h-80 w-80 rounded-full"
        style={{ background: second, opacity: 0.25, filter: "blur(90px)" }}
      />
    </div>
  );
}

// Single renderer used by BOTH the public page and the builder's live preview,
// so what you see while editing is exactly what visitors get.
export default function BioPageView(props) {
  var page = props.page;
  var preview = !!props.preview;

  var theme = normalizeTheme(page.theme);
  var colors = resolveThemeColors(theme);
  var fonts = fontSetup(theme.font);
  var radius = buttonRadiusClass(theme.buttonStyle);
  var look = buttonLook(theme.buttonFill, colors);
  var rise = theme.animate ? " bio-rise" : "";

  function delay(i) {
    return theme.animate ? { animationDelay: 120 + i * 70 + "ms" } : {};
  }

  var name = page.displayName || (preview ? "Your name" : "");
  var bioText = page.bio || (preview ? "Your bio goes here" : "");
  var initial = page.displayName
    ? page.displayName.charAt(0).toUpperCase()
    : "?";
  var links = (page.links || []).filter(function (l) {
    return !preview || l.label;
  });

  var rootStyle = Object.assign(
    { "--bio-accent": colors.accent, color: colors.text },
    pageBackgroundStyle(theme.background, colors),
    fonts.style,
  );

  var avatarShadow = theme.avatarRing
    ? "0 0 0 3px " +
      colors.bg +
      ", 0 0 0 5px " +
      colors.accent +
      ", 0 0 26px " +
      colors.accent +
      "55"
    : "none";

  var rootClass =
    "relative overflow-hidden flex justify-center " +
    fonts.body +
    (preview
      ? " rounded-xl px-6 py-10"
      : " min-h-screen items-center px-4 py-16");

  return (
    <div className={rootClass} style={rootStyle}>
      {theme.background === "aurora" ? <AuroraBlobs colors={colors} /> : null}

      <div className="relative z-10 w-full max-w-sm text-center space-y-5">
        <div
          className={
            "mx-auto overflow-hidden flex items-center justify-center " +
            (preview ? "w-20 h-20 " : "w-24 h-24 ") +
            avatarRadiusClass(theme.avatarShape) +
            rise
          }
          style={Object.assign(
            { backgroundColor: colors.surface, boxShadow: avatarShadow },
            delay(0),
          )}
        >
          {page.avatarUrl ? (
            <img
              src={page.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className={"text-3xl " + fonts.name}
              style={{ color: colors.text }}
            >
              {initial}
            </span>
          )}
        </div>

        <div className={rise.trim()} style={delay(1)}>
          <h1
            className={"font-bold text-xl " + fonts.name}
            style={{ color: colors.text }}
          >
            {name}
          </h1>
          {bioText ? (
            <p
              className="text-sm mt-2"
              style={{ color: colors.text, opacity: 0.7 }}
            >
              {bioText}
            </p>
          ) : null}
        </div>

        <div className="space-y-3 pt-2">
          {links.map(function (link, i) {
            var cls =
              "bio-btn bio-hover-" +
              theme.buttonHover +
              " flex items-center justify-center gap-2 px-4 py-3 text-sm " +
              radius +
              rise;
            var style = Object.assign({}, look, delay(i + 2));
            var inner = (
              <>
                <BioIcon platform={link.platform} />
                <span>{link.label}</span>
              </>
            );
            if (preview) {
              return (
                <div key={link.id} className={cls} style={style}>
                  {inner}
                </div>
              );
            }
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cls}
                style={style}
              >
                {inner}
              </a>
            );
          })}
        </div>

        {page.showBranding ? (
          <p
            className="text-xs pt-4"
            style={{ color: colors.text, opacity: 0.5 }}
          >
            <a href="/">Made with ShortLink</a>
          </p>
        ) : null}
      </div>
    </div>
  );
}

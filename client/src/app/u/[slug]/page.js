import { cache } from "react";
import { notFound } from "next/navigation";
import { BioIcon } from "@/components/BioIcons";
import { resolveThemeColors, buttonRadiusClass } from "@/lib/bioPresets";
import Link from "next/link";

var fetchBioPage = cache(async function (slug) {
  try {
    var res = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "/bio/public/" + slug,
      {
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
});

export async function generateMetadata(props) {
  var resolvedParams = await props.params;
  var slug = resolvedParams.slug;
  var page = await fetchBioPage(slug);

  if (!page) {
    return { title: "Page not found - ShortLink" };
  }

  var name = page.displayName || slug;
  var title = name + " | ShortLink";
  var description = page.bio || "Check out " + name + "'s links";
  var images = page.avatarUrl ? [page.avatarUrl] : [];

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: images,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: title,
      description: description,
      images: images,
    },
  };
}

export default async function PublicBioPage(props) {
  var resolvedParams = await props.params;
  var slug = resolvedParams.slug;
  var page = await fetchBioPage(slug);

  if (!page) {
    notFound();
  }

  var colors = resolveThemeColors(page.theme);
  var radiusClass = buttonRadiusClass(page.theme && page.theme.buttonStyle);
  var borderColor = colors.accent + "33";
  var linkBorderStyle = "1px solid " + borderColor;

  var avatarInitial = "?";
  if (page.displayName && page.displayName.length > 0) {
    avatarInitial = page.displayName.charAt(0).toUpperCase();
  }

  function renderLink(link) {
    var itemStyle = {
      backgroundColor: colors.surface,
      color: colors.text,
      border: linkBorderStyle,
    };
    var itemClass =
      "flex items-center justify-center gap-2 px-4 py-3 text-sm transition-opacity hover:opacity-80 " +
      radiusClass;
    return (
      <a
        key={link.id}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={itemClass}
        style={itemStyle}
      >
        <BioIcon platform={link.platform} />
        <span>{link.label}</span>
      </a>
    );
  }

  var linkItems = page.links.map(renderLink);

  var pageBg = { backgroundColor: colors.bg };
  var avatarBg = { backgroundColor: colors.surface };
  var nameStyle = { color: colors.text };
  var bioStyle = { color: colors.text, opacity: 0.7 };
  var footerStyle = { color: colors.text, opacity: 0.5 };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={pageBg}
    >
      <div className="max-w-sm w-full text-center space-y-5">
        <div
          className="w-24 h-24 rounded-full mx-auto overflow-hidden flex items-center justify-center"
          style={avatarBg}
        >
          {page.avatarUrl ? (
            <img
              src={page.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl font-display" style={nameStyle}>
              {avatarInitial}
            </span>
          )}
        </div>

        <div>
          <h1 className="font-display font-bold text-xl" style={nameStyle}>
            {page.displayName}
          </h1>
          {page.bio ? (
            <p className="text-sm mt-2" style={bioStyle}>
              {page.bio}
            </p>
          ) : null}
        </div>

        <div className="space-y-3 pt-2">{linkItems}</div>

        {page.showBranding ? (
          <p className="text-xs pt-4" style={footerStyle}>
            <a href="/">Made with ShortLink</a>
          </p>
        ) : null}
      </div>
    </div>
  );
}

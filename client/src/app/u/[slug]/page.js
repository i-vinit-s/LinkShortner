import { cache } from "react";
import { notFound } from "next/navigation";
import BioPageView from "@/components/BioPageView";

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

  return <BioPageView page={page} />;
}

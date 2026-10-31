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
    if (res.status === 404) return null;
    if (!res.ok) return { unavailable: true };
    return await res.json();
  } catch {
    return { unavailable: true };
  }
});

export async function generateMetadata(props) {
  var resolvedParams = await props.params;
  var slug = resolvedParams.slug;
  var page = await fetchBioPage(slug);

  if (!page || page.unavailable) {
    if (page && page.unavailable) {
      return { title: "Bio page temporarily unavailable" };
    }
    return { title: "Page not found" };
  }

  var name = page.displayName || slug;
  var title = name;
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

  if (page.unavailable) {
    var retryUrl = "/u/" + encodeURIComponent(slug);
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-5 py-12">
        <section className="w-full max-w-md space-y-4 text-center" aria-labelledby="bio-unavailable-title">
          <p className="text-sm font-medium text-signal">Connection interrupted</p>
          <h1 id="bio-unavailable-title" className="font-display text-3xl font-semibold tracking-tight text-white">This page is temporarily unavailable.</h1>
          <p className="text-sm leading-6 text-text-muted">We couldn’t load this bio page. Please try again in a moment.</p>
          <a href={retryUrl} className="ui-button-primary focus-ring inline-flex items-center justify-center">Try again</a>
        </section>
      </main>
    );
  }

  return <BioPageView page={page} />;
}

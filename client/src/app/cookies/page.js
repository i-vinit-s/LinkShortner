import PublicHeader from "@/components/PublicHeader";

export const metadata = {
  title: "Cookie notice",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-ink">
      <PublicHeader />
      <div className="mx-auto max-w-2xl space-y-8 px-5 py-12 text-sm leading-7 text-text-muted sm:px-8">
        <div>
          <p className="mb-2 text-sm text-text-muted">Legal</p>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-white">Cookie notice</h1>
        </div>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">
            What we use cookies for
          </h2>
          <p>
            We set exactly one cookie: a session identifier used to keep you
            logged in after you sign in. This cookie is{" "}
            <strong className="text-white">essential</strong> to the functioning
            of the service — without it, you would be logged out on every page
            load.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">
            What we don&apos;t do
          </h2>
          <p>
            We do not use advertising cookies, third-party tracking pixels, or
            cross-site tracking of any kind. Our session cookie is not shared
            with or readable by any other website.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">
            Managing cookies
          </h2>
          <p>
            Since this cookie is required for login to function, disabling it in
            your browser will prevent you from staying signed in. You can still
            use the service anonymously (creating links without an account)
            without this cookie being set.
          </p>
        </section>
      </div>
    </div>
  );
}

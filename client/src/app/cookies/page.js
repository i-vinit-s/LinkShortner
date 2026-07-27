export const metadata = {
  title: "Cookie Notice - ShortLink",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6 text-text-muted text-sm leading-relaxed">
        <div>
          <p className="text-xs uppercase tracking-widest text-wire font-mono mb-1">
            Legal
          </p>
          <h1 className="text-2xl font-display font-bold text-white">
            Cookie Notice
          </h1>
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

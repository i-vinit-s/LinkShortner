const Link = require("next/link");

export const metadata = {
  title: "Privacy Policy - ShortLink",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6 text-text-muted text-sm leading-relaxed">
        <div>
          <p className="text-xs uppercase tracking-widest text-wire font-mono mb-1">
            Legal
          </p>
          <h1 className="text-2xl font-display font-bold text-white">
            Privacy Policy
          </h1>
          <p className="text-xs text-text-muted mt-2">
            Last updated: July 2026
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">
            What we collect
          </h2>
          <p>
            When you create an account, we collect your name and email address.
            When you create a short link, we store the destination URL and any
            tags or settings you configure. When someone clicks a short link, we
            log the timestamp, referring page, approximate device/browser/OS,
            and an approximate geographic location (derived from IP address, not
            your exact location).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">
            Why we collect it
          </h2>
          <p>
            Account information is used to let you log in and manage your links.
            Click data is used solely to power the analytics dashboard shown to
            the link&apos;s creator — so you can see how your own links are
            performing. We do not sell, rent, or share this data with third
            parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">IP addresses</h2>
          <p>
            We use IP addresses transiently to determine approximate geographic
            location (country/city level) and to enforce rate limiting against
            abuse. We do not permanently store raw IP addresses alongside click
            records.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">Cookies</h2>
          <p>
            We use a single essential session cookie to keep you logged in. This
            cookie is required for the service to function and is not used for
            advertising or cross-site tracking. See our{" "}
            <Link href="/cookies" className="text-wire hover:underline">
              Cookie Notice
            </Link>{" "}
            for details.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">
            Data retention
          </h2>
          <p>
            Your account and link data are retained as long as your account is
            active. You may delete individual links at any time from your
            dashboard. To request full account deletion, contact us using the
            details below.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">Contact</h2>
          <p>
            Questions about this policy or your data can be sent to the contact
            address listed on our{" "}
            <Link href="/report" className="text-wire hover:underline">
              report page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

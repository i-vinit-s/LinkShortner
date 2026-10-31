import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";

export const metadata = {
  title: "Terms of service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ink">
      <PublicHeader />
      <div className="mx-auto max-w-2xl space-y-8 px-5 py-12 text-sm leading-7 text-text-muted sm:px-8">
        <div>
          <p className="mb-2 text-sm text-text-muted">Legal</p>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-white">Terms of service</h1>
          <p className="text-xs text-text-muted mt-2">
            Last updated: July 2026
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">
            Acceptable use
          </h2>
          <p>
            You may not use this service to shorten links pointing to phishing
            pages, malware, illegal content, or content that violates the rights
            of others. We reserve the right to deactivate any link, with or
            without notice, that violates these terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">No warranty</h2>
          <p>
            This service is provided on an &quot;as-is&quot; basis, without warranty of
            any kind. Links may be deactivated, delayed, or become unavailable
            due to maintenance, abuse prevention, or factors outside our
            control.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">
            Account responsibility
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activity that occurs under your
            account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">
            Rate limits and fair use
          </h2>
          <p>
            To keep the service usable for everyone, requests are rate-limited.
            Attempting to circumvent these limits, or using the service to
            generate large volumes of spam links, may result in your account or
            IP address being blocked.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">
            Reporting abuse
          </h2>
          <p>
            If you encounter a short link you believe violates these terms,
            please{" "}
            <Link href="/report" className="text-wire hover:underline">
              report it here
            </Link>
            . We investigate reports and deactivate offending links.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-display font-medium">
            Changes to these terms
          </h2>
          <p>
            These terms may be updated from time to time. Continued use of the
            service after changes constitutes acceptance of the updated terms.
          </p>
        </section>
      </div>
    </div>
  );
}

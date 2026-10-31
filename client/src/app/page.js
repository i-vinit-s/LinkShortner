import Link from "next/link";
import DashboardRedirect from "@/components/DashboardRedirect";
import Icon from "@/components/Icon";
import MotionToggle from "@/components/MotionToggle";
import QuickShortenForm from "@/components/QuickShortenForm";
import ScrollReveal from "@/components/ScrollReveal";
import WordReveal from "@/components/WordReveal";
import { benefits, faqStructuredData, questions, steps } from "@/lib/landingContent";

export const metadata = {
  title: "Short links, clear insights",
  description: "Create clean short links, understand each click, and control where your links lead.",
  alternates: { canonical: "/" },
};

function BrandMark() {
  return <span aria-hidden="true" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-signal text-ink"><Icon name="link" size={18} strokeWidth={2} /></span>;
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-ink text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
      <DashboardRedirect />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="focus-ring inline-flex items-center gap-3 rounded-lg" aria-label="ShortLink home">
          <BrandMark />
          <span className="font-display text-lg font-semibold tracking-tight">ShortLink</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main navigation">
          <Link href="/pricing" className="focus-ring hidden rounded-md px-3 py-2 text-sm text-text-muted transition-colors hover:text-white sm:inline-flex">Pricing</Link>
          <Link href="/login" className="focus-ring rounded-md border border-white/15 px-3 py-2 text-sm font-semibold text-white transition-colors hover:border-white/35">Log in</Link>
          <MotionToggle compact onlyWhenDisabled />
        </nav>
      </header>

      <main>
        <section className="hero-surface border-y border-white/10">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-12 sm:px-8 sm:py-16 min-[720px]:grid-cols-[1.05fr_0.95fr] min-[720px]:items-center min-[720px]:gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12 lg:py-24">
            <div>
              <div className="mb-5 flex items-center gap-3 text-sm text-text-muted">
                <span className="h-2 w-2 rounded-full bg-led" aria-hidden="true" />
                <span>Short links with a clear signal</span>
              </div>
              <WordReveal as="h1" text="Make every click easier to understand." className="hero-title max-w-2xl text-4xl font-semibold leading-none tracking-[-0.04em] sm:text-5xl lg:text-6xl" delayStep={48} />
              <p className="text-pretty mt-4 max-w-xl text-base leading-7 text-[#C2CBD2] sm:text-lg sm:leading-8">Turn long URLs into clean, trackable links with analytics, QR codes, and controls that stay out of your way.</p>
              <div className="mt-7 max-w-xl"><QuickShortenForm /></div>
              <div className="mt-3">
                <Link href="#how-it-works" className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md text-sm text-text-muted transition-colors hover:text-white">
                  See how it works <Icon name="arrowDown" size={16} />
                </Link>
              </div>
            </div>

            <figure className="relative border-y border-white/15 py-5 sm:px-5 sm:py-9">
              <figcaption className="mb-5 flex items-center justify-between text-sm text-text-muted sm:mb-8">
                <span>Long URL in</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs">Example</span>
              </figcaption>
              <p className="break-all font-mono text-sm leading-7 text-[#C2CBD2] sm:text-base">https://shop.example.com/spring/collection?source=newsletter</p>
              <div className="my-5 flex items-center gap-3 text-signal sm:my-7" aria-hidden="true">
                <span className="h-px flex-1 bg-white/10" /><Icon name="arrowRight" size={18} /><span className="h-px flex-1 bg-white/10" />
              </div>
              <figcaption className="mb-3 text-sm text-text-muted">Short link out</figcaption>
              <p className="font-display text-2xl font-semibold tracking-tight text-white">short.link/spring</p>
              <p className="mt-3 text-sm text-text-muted">One clean address. The destination stays yours to manage.</p>
            </figure>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20" aria-labelledby="benefits-title">
          <ScrollReveal className="max-w-2xl">
            <p className="text-sm font-semibold text-signal">Tools for links you share</p>
            <WordReveal id="benefits-title" text="The controls you need, without the clutter." className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl" />
            <p className="text-pretty mt-4 text-lg leading-8 text-text-muted">Manage the destination, decide who can open it, then check the results when you need them.</p>
          </ScrollReveal>
          <div className="mt-8 grid gap-5 border-t border-white/10 pt-5 min-[720px]:grid-cols-3 min-[720px]:gap-8">
            {benefits.map((benefit, index) => (
              <ScrollReveal as="article" key={benefit.title} delay={index * 80}>
                <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-surface-raised text-signal"><Icon name={benefit.icon} size={18} /></span>
                <h3 className="text-lg font-semibold text-white">{benefit.title}</h3>
                <p className="mt-2 leading-6 text-text-muted">{benefit.body}</p>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <ScrollReveal as="section" id="how-it-works" className="border-y border-white/10 bg-[#131209]" aria-labelledby="steps-title">
          <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
            <div className="mb-8 max-w-xl">
              <p className="text-sm font-semibold text-signal">A straightforward workflow</p>
              <WordReveal id="steps-title" text="From long URL to useful signal." className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl" />
            </div>
            <div className="grid gap-7 min-[720px]:grid-cols-3 min-[720px]:gap-8">
              {steps.map((step, index) => (
                <article key={step.title} className="border-t border-white/15 pt-5">
                  <p className="font-mono text-sm text-signal">0{index + 1}</p>
                  <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 leading-7 text-text-muted">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20" aria-labelledby="faq-title">
          <ScrollReveal className="grid gap-8 min-[720px]:grid-cols-[0.7fr_1.3fr] min-[720px]:gap-12">
            <div>
              <p className="text-sm font-semibold text-signal">Before you start</p>
              <WordReveal id="faq-title" text="Common questions" className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl" />
            </div>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {questions.map((item) => (
                <details key={item.question} className="faq-item group">
                  <summary className="focus-ring flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-medium text-white">
                    <span>{item.question}</span>
                    <Icon name="chevronDown" size={18} className="shrink-0 text-text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="max-w-2xl pb-5 pr-8 leading-7 text-text-muted">{item.answer}</p>
                </details>
              ))}
            </div>
          </ScrollReveal>
        </section>

        <ScrollReveal as="section" className="border-t border-white/10 bg-surface" aria-labelledby="final-cta-title">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-14 sm:px-8 sm:py-16 min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between lg:py-20">
            <div>
              <WordReveal id="final-cta-title" text="Ready to make your next link clearer?" as="h2" className="text-3xl font-semibold tracking-tight text-white sm:text-4xl" />
              <p className="mt-3 text-text-muted">Shorten one now. Create an account when you want more control.</p>
            </div>
            <Link href="#shorten" className="ui-button-primary focus-ring inline-flex w-fit items-center gap-2">
              Shorten a link <Icon name="arrowUpRight" size={17} />
            </Link>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
}

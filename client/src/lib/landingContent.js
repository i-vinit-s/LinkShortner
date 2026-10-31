export const benefits = [
  {
    icon: "shield",
    title: "Control access",
    body: "Protect a link with a password or set a clear end date.",
  },
  {
    icon: "chart",
    title: "Understand clicks",
    body: "Review activity by time, referrer, device, and country.",
  },
  {
    icon: "layers",
    title: "Keep links together",
    body: "Organize destinations with tags and a public bio page.",
  },
];

export const steps = [
  { title: "Paste a destination", body: "Start with any URL. Anonymous links are ready in seconds." },
  { title: "Share the short link", body: "Use it anywhere, or make it yours with a custom alias." },
  { title: "Learn from the clicks", body: "Return to the dashboard when you want the full picture." },
];

export const questions = [
  {
    question: "Can I shorten a link without an account?",
    answer: "Yes. You can create an anonymous link from this page. Anonymous links expire after 14 days.",
  },
  {
    question: "What can I see in link analytics?",
    answer: "The dashboard shows clicks over time, referrers, devices, browsers, operating systems, and approximate country information when available.",
  },
  {
    question: "Can I change a destination after sharing?",
    answer: "Yes. Sign in, open the link in your dashboard, and update its destination. The short address and QR code remain the same.",
  },
  {
    question: "Can I protect or expire a link?",
    answer: "Yes. Signed-in users can add password protection and set an expiration date when creating or editing a link.",
  },
];

export const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: questions.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

import { Fragment } from "react";
import ScrollReveal from "@/components/ScrollReveal";

export default function WordReveal({ text, as = "h2", className = "", id, delayStep = 42 }) {
  const words = text.split(" ");

  return (
    <ScrollReveal as={as} id={id} ariaLabel={text} className={`word-reveal ${className}`}>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <Fragment key={`${word}-${index}`}>
            <span className="word-reveal-item" style={{ transitionDelay: `${index * delayStep}ms` }}>
              {word}
            </span>
            {index < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </ScrollReveal>
  );
}

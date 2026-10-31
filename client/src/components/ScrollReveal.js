"use client";

import { useEffect, useRef, useState } from "react";
import { applyMotionPreference, MOTION_PREFERENCE_EVENT } from "@/lib/motionPreference";

export default function ScrollReveal({ as: Element = "div", children, className = "", delay = 0, id, ariaLabel }) {
  const elementRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    document.documentElement.classList.add("has-scroll-reveal");
    let observer;

    const observe = () => {
      observer?.disconnect();
      if (!element || !("IntersectionObserver" in window)) {
        setVisible(true);
        return;
      }
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          setVisible(true);
          observer.disconnect();
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
      );
      observer.observe(element);
    };

    const syncPreference = () => {
      if (applyMotionPreference()) {
        setVisible(false);
        observe();
      } else {
        observer?.disconnect();
        setVisible(true);
      }
    };

    syncPreference();
    window.addEventListener(MOTION_PREFERENCE_EVENT, syncPreference);
    return () => {
      observer?.disconnect();
      window.removeEventListener(MOTION_PREFERENCE_EVENT, syncPreference);
    };
  }, []);

  return (
    <Element
      id={id}
      aria-label={ariaLabel}
      ref={elementRef}
      onFocusCapture={() => setVisible(true)}
      className={`scroll-reveal ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={{ "--reveal-delay": `${delay}ms` }}
    >
      {children}
    </Element>
  );
}

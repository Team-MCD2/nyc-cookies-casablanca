"use client";

import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    // Find all elements with class .text-reveal
    const elements = document.querySelectorAll(".text-reveal");
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: "0px 0px -15% 0px", // triggers when element is 15% above the bottom of the screen
        threshold: 0.05, // triggers when at least 5% of the element is visible
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return null;
}

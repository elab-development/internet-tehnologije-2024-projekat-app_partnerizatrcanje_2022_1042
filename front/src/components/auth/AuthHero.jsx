import React, { useEffect } from "react";
import "../../pages/home.css";

export default function AuthHero({ title, lead, tag="RUN • CONNECT • THRIVE" }) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="hero">
      <div className="hero__bg" />
      <div className="hero__content">
        <div className="brand reveal">
          <span className="brand__tag">{tag}</span>
          <h1 className="brand__title">{title}</h1>
          {lead && <p className="brand__lead">{lead}</p>}
        </div>
      </div>
    </section>
  );
}

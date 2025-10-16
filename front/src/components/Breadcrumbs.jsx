import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import "./breadcrumbs.css";

/**
 * Reusable Breadcrumbs
 *
 * Props:
 * - labelMap: { [segment|fullPath]: "Label" }  // preslikavanje segmenata ili punih putanja
 * - separator: string | ReactNode               // default: "›"
 * - showHome: boolean                           // default: true
 * - homePath: string                            // default: "/"
 * - homeLabel: string                           // default: "Početna"
 * - maxItems: number                            // default: 5 (skraćivanje sredine sa …)
 * - className: string                           // dodatne klase
 * - formatter: (seg, fullPath) => string        // custom format teksta
 */
export default function Breadcrumbs({
  labelMap = {
    "/": "Početna",
    "run-events": "Događaji",
    "login": "Prijava",
    "register": "Registracija",
  },
  separator = "›",
  showHome = true,
  homePath = "/",
  homeLabel = "Početna",
  maxItems = 5,
  className = "",
  formatter,
}) {
  const { pathname } = useLocation();

  const items = useMemo(() => {
    const raw = pathname.replace(/\/+$/, ""); // trim trailing slash
    const segs = raw.split("/").filter(Boolean); // bez praznih
    const crumbs = [];

    // Helper format label
    const formatLabel = (seg, full) => {
      if (labelMap[full]) return labelMap[full];
      if (labelMap[seg]) return labelMap[seg];
      if (formatter) return formatter(seg, full);

      // podrazumevni: broj -> #id, ostalo -> Capitalize i minus->razmak
      if (/^\d+$/.test(seg)) return `#${seg}`;
      const pretty = seg.replace(/-/g, " ");
      return pretty.charAt(0).toUpperCase() + pretty.slice(1);
    };

    // Home
    if (showHome) {
      crumbs.push({ to: homePath, label: labelMap["/"] || homeLabel });
    }

    // Ostali segmenti
    let acc = "";
    segs.forEach((seg, idx) => {
      acc += `/${seg}`;
      crumbs.push({
        to: acc,
        label: formatLabel(seg, acc),
      });
    });

    // Ako smo na rootu, imamo samo Home
    return crumbs;
  }, [pathname, showHome, homePath, homeLabel, labelMap, formatter]);

  // nemoj prikazivati ako ima samo jedan crumb (Početna)
  if (!items || items.length <= 1) return null;

  // skraćivanje: npr. [Home, A, B, C, D, E] -> [Home, …, C, D, E]
  let view = items;
  if (items.length > maxItems) {
    const first = items[0];
    const lastThree = items.slice(-3);
    view = [first, { label: "…", to: null, ellipsis: true }, ...lastThree];
  }

  const lastIndex = view.length - 1;

  return (
    <nav className={`breadcrumbs ${className}`} aria-label="Breadcrumb">
      <ol className="breadcrumbs__list">
        {view.map((c, i) => {
          const isLast = i === lastIndex;
          return (
            <li key={`${c.to || c.label}-${i}`} className="breadcrumbs__item">
              {c.ellipsis ? (
                <span className="breadcrumbs__ellipsis">…</span>
              ) : isLast ? (
                <span className="breadcrumbs__current" aria-current="page">
                  {c.label}
                </span>
              ) : (
                <Link to={c.to} className="breadcrumbs__link">
                  {c.label}
                </Link>
              )}
              {!isLast && !c.ellipsis && (
                <span className="breadcrumbs__sep" aria-hidden="true">
                  {separator}
                </span>
              )}
              {!isLast && c.ellipsis && (
                <span className="breadcrumbs__sep" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

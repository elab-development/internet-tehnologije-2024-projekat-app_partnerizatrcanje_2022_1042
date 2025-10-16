import React from "react";

export function Button({ children, variant="primary", tiny=false, ...props }) {
  const cls =
    "btn " +
    (variant === "primary" ? "btn--primary " : "btn--ghost ") +
    (tiny ? "btn--tiny" : "");
  return (
    <button className={cls} {...props}>{children}</button>
  );
}

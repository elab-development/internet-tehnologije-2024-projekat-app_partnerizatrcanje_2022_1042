import React from "react";

export function Note({ children }) {
  if (!children) return null;
  return <div className="note">{children}</div>;
}

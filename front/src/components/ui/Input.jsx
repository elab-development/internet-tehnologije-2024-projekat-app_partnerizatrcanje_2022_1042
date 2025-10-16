import React from "react";

export function Input({ label, name, type="text", error, className="", ...props }) {
  return (
    <label className={`fld ${className}`}>
      {label && <span>{label}</span>}
      <input name={name} type={type} className="" {...props} />
      {error && <small className="err">{error}</small>}
    </label>
  );
}

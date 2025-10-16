import React from "react";

export function Select({ label, name, options=[], error, ...props }) {
  return (
    <label className="fld">
      {label && <span>{label}</span>}
      <select name={name} {...props}>
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? String(opt)}
          </option>
        ))}
      </select>
      {error && <small className="err">{error}</small>}
    </label>
  );
}

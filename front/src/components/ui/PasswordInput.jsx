import React, { useState } from "react";

export function PasswordInput({ label="Lozinka", name="password", error, placeholder="unesi lozinku", ...props }) {
  const [show, setShow] = useState(false);
  return (
    <label className="fld">
      <span>{label}</span>
      <div className="fld__pass">
        <input
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          {...props}
        />
        <button
          type="button"
          className="btn btn--tiny fld__toggle"
          onClick={() => setShow(s => !s)}
          aria-label="Prikaži/sakrij lozinku"
        >
          {show ? "Sakrij" : "Prikaži"}
        </button>
      </div>
      {error && <small className="err">{error}</small>}
    </label>
  );
}

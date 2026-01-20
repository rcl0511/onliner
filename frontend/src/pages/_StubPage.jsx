import React from "react";

export default function StubPage({ title, desc }) {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <p style={{ marginTop: 8, opacity: 0.7 }}>{desc}</p>
    </div>
  );
}

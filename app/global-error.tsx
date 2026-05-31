"use client"

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="pl">
      <body
        style={{
          fontFamily: "sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          backgroundColor: "#fafafa",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "4rem", margin: 0 }}>⚠️</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginTop: "1rem" }}>
            Krytyczny błąd aplikacji
          </h1>
          <button
            onClick={unstable_retry}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1.5rem",
              background: "#18181b",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Spróbuj ponownie
          </button>
        </div>
      </body>
    </html>
  )
}

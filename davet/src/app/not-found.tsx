export default function NotFound() {
  return (
    <main className="page">
      <h1>Not found</h1>
      <p className="lede">
        This invitation either moved or was never published.
      </p>
      <p style={{ marginTop: "1.5rem" }}>
        <a className="cta cta-ghost" href="/">Home</a>
      </p>
    </main>
  );
}

export function SkipToContent() {
  return (
    <a
      className="skip-to-content"
      href="#main-content"
      onClick={(event) => {
        event.preventDefault();
        document.getElementById('main-content')?.focus();
      }}
    >
      Saltar al contenido
    </a>
  );
}

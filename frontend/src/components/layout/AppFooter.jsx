const brand = '#5d45fd';

export default function AppFooter() {
  return (
    <footer className="border-top bg-white mt-auto">
      <div className="container-fluid px-3 px-lg-4 py-4">
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 small text-secondary">
          <div className="d-flex align-items-center gap-2">
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-2 text-white fw-bold"
              style={{ width: 28, height: 28, background: brand, fontSize: '0.7rem' }}
            >
              C
            </span>
            <span>© {new Date().getFullYear()} Campus Sprint Hub. Built for students.</span>
          </div>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <span className="text-muted">Help Center</span>
            <span className="text-muted">Agile Guide</span>
            <span className="text-muted">Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

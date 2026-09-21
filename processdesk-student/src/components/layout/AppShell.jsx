export default function AppShell({ header, sidebar, children }) {
  return (
    <div className="app-shell">
      {header}
      <div className="body">
        {sidebar}
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

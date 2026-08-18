import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "JanVaani — Citizen Demand Intelligence",
  description:
    "A multilingual, multi-channel AI platform that aggregates citizen development requests and surfaces national infrastructure priorities.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="container topbar-inner">
            <a href="/" className="brand">
              <span className="brand-mark" />
              JanVaani <span className="brand-tag">/// citizen demand intelligence</span>
            </a>
            <nav className="nav">
              <a href="/">Home</a>
              <a href="/submit">Submit</a>
              <a href="/dashboard">Dashboard</a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

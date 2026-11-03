/**
 * src/components/Footer.jsx
 * ---------------------------------------------------------------------------
 * Persistent footer in the Lab 19 style: centered slate-800 band with the
 * copyright line. Text is driven by props / the shared site config so it can
 * be reused and overridden without editing the component.
 * ---------------------------------------------------------------------------
 */
import { Link } from 'react-router-dom';
import { site } from '../data/site.js';

export default function Footer({
  note = `${site.fullName} | ${site.course}`,
  year = new Date().getFullYear(),
}) {
  return (
    <footer className="mt-16 bg-slate-800 text-white">
      <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-sm sm:flex-row">
        <p className="text-slate-200">
          © {year} <span className="font-semibold text-white">{site.fullName}</span>
        </p>

        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap items-center justify-center gap-4">
            <li>
              <Link to="/projects" className="text-slate-200 underline-offset-4 hover:text-white hover:underline">
                Projects
              </Link>
            </li>
            <li>
              <Link to="/blog" className="text-slate-200 underline-offset-4 hover:text-white hover:underline">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-slate-200 underline-offset-4 hover:text-white hover:underline">
                Contact
              </Link>
            </li>
            <li>
              <a
                href={site.github}
                target="_blank"
                rel="noreferrer"
                className="text-slate-200 underline-offset-4 hover:text-white hover:underline"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>

        <p className="text-xs text-slate-400">{note}</p>
      </div>
    </footer>
  );
}

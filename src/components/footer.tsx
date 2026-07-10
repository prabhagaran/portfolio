import { Mail } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa6";
import { site } from "@/data/site";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <p className="text-sm text-faint">
          Designed and engineered with precision.
        </p>
        <p className="font-mono text-xs text-faint">
          © {new Date().getFullYear()} {site.name}
        </p>
        <ul className="flex items-center gap-1">
          <li>
            <a
              href={site.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-slate-100"
            >
              <FaGithub className="h-4 w-4" aria-hidden="true" />
            </a>
          </li>
          <li>
            <a
              href={site.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-slate-100"
            >
              <FaLinkedin className="h-4 w-4" aria-hidden="true" />
            </a>
          </li>
          <li>
            <a
              href={`mailto:${site.email}`}
              aria-label="Email"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-slate-100"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}

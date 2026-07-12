import { Link } from "react-router-dom";
import { Terminal, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-md bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 text-primary">
            <Terminal className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">Void Coder</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/chat">
            <Button variant="ghost" size="sm">Chat</Button>
          </Link>
          <a
            href="https://github.com/IdentityVoid/VoidGPT"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:block"
          >
            <Button variant="ghost" size="icon" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </Button>
          </a>
          <Link to="/chat">
            <Button size="sm">Start coding</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

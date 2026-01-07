import { Link } from "wouter";
import { GraduationCap } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b bg-primary backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-center md:justify-start">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="font-heading font-bold text-xl tracking-tight text-primary-foreground">CoursePlanner</span>
        </Link>
      </div>
    </header>
  );
}

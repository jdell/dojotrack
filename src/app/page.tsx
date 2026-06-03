import Link from "next/link";
import { ArrowRight, Award, CalendarDays, MapPin, Search } from "lucide-react";
import { Logo } from "@/components/logo";

/** Placeholder directory entries — replaced by real clubs once registration ships. */
const SAMPLE_CLUBS = [
  {
    slug: "gracie-barra-downtown",
    name: "Gracie Barra Downtown",
    discipline: "Brazilian Jiu-Jitsu",
    city: "Austin, TX",
  },
  {
    slug: "shotokan-karate-academy",
    name: "Shotokan Karate Academy",
    discipline: "Karate",
    city: "Portland, OR",
  },
  {
    slug: "kodokan-judo-club",
    name: "Kodokan Judo Club",
    discipline: "Judo",
    city: "Chicago, IL",
  },
  {
    slug: "tiger-taekwondo",
    name: "Tiger Taekwondo",
    discipline: "Taekwondo",
    city: "San Diego, CA",
  },
];

const FEATURES = [
  {
    icon: Award,
    title: "Belt progression",
    desc: "Students see their journey white to black, with a visual requirements checklist.",
  },
  {
    icon: CalendarDays,
    title: "Classes & attendance",
    desc: "Plan a weekly timetable and check students in from any device.",
  },
  {
    icon: MapPin,
    title: "Public club page",
    desc: "Every club gets a shareable page so new students can find and join you.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Register club
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
        <p className="eyebrow mb-6">For martial arts clubs</p>
        <h1 className="mx-auto max-w-2xl text-4xl font-bold leading-tight tracking-tight text-brand-navy sm:text-5xl">
          Run your dojo,{" "}
          <span className="text-brand-teal">not your spreadsheets</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Classes, belt progression, and payments in one mobile-first place.
          Supports BJJ, Karate, Judo, Taekwondo, and custom ranking systems.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Register your club <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-border px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Public club directory placeholder */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-10 text-center">
            <p className="eyebrow mb-3">Club directory</p>
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy">
              Find a club near you
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Browse martial arts clubs on DojoTrack. This directory is a
              preview — real clubs appear here as they register.
            </p>
          </div>

          <div className="mx-auto mb-8 flex max-w-md items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-muted-foreground">
            <Search size={16} />
            <span className="text-sm">
              Search by club, discipline, or city…
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {SAMPLE_CLUBS.map((club) => (
              <Link
                key={club.slug}
                href={`/club/${club.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-background p-4 transition-colors hover:border-brand-teal"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-lg font-bold text-brand-teal">
                  {club.name.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-brand-navy">
                    {club.name}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {club.discipline} · {club.city}
                  </span>
                </span>
                <ArrowRight
                  size={16}
                  className="ml-auto shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-teal"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-teal/10 text-brand-teal">
                <Icon size={24} />
              </div>
              <h3 className="mb-2 text-lg font-bold tracking-tight text-brand-navy">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo size={24} />
          <p className="text-xs text-muted-foreground">
            © 2026 DojoTrack. Martial arts club management, simplified.
          </p>
        </div>
      </footer>
    </div>
  );
}

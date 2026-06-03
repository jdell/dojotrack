import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CalendarDays,
  Check,
  CreditCard,
  QrCode,
  Star,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "DojoTrack — Run your dojo, not your spreadsheets",
  description:
    "All-in-one martial arts club management: student roster, belt progression, class scheduling, QR check-in, Stripe payments, competitions, and sparring pairing. Start free.",
};

/** The seven headline capabilities shown in the features grid. */
const FEATURES = [
  {
    icon: Users,
    title: "Student management",
    desc: "A complete roster with families, contact details, medical notes, and one-tap invites.",
  },
  {
    icon: Award,
    title: "Belt progression tracking",
    desc: "Visual requirement checklists from white to black across BJJ, Karate, Judo, and more.",
  },
  {
    icon: CalendarDays,
    title: "Class scheduling",
    desc: "Build a weekly timetable, manage bookings, and track attendance from any device.",
  },
  {
    icon: QrCode,
    title: "QR check-in",
    desc: "Students scan a code on the wall to check themselves into class. No clipboard required.",
  },
  {
    icon: CreditCard,
    title: "Stripe payments",
    desc: "Memberships, drop-ins, and exam fees — billed and reconciled automatically via Stripe.",
  },
  {
    icon: Trophy,
    title: "Competition tracking",
    desc: "Log tournament entries, divisions, and medals so the whole club can celebrate wins.",
  },
  {
    icon: Swords,
    title: "Sparring pairing",
    desc: "Generate fair rounds by belt and avoid repeat matchups — no whiteboard maths.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Everything a small dojo needs to get organised.",
    features: [
      "Up to 30 active students",
      "Belt progression & class scheduling",
      "QR check-in & attendance",
      "Public club page",
    ],
    cta: "Start free",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "per month",
    blurb: "For growing clubs that bill online and run gradings.",
    features: [
      "Unlimited students",
      "Stripe payments & memberships",
      "Grading exams & certificates",
      "Competitions & sparring tools",
      "Email & WhatsApp notifications",
    ],
    cta: "Start free trial",
    href: "/register",
    highlighted: true,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We moved off three different spreadsheets and a group chat. Now belt requirements, attendance, and payments all live in one place — onboarding a new student takes a minute.",
    name: "Marcus Oliveira",
    role: "Head Coach, Cobra BJJ Academy",
  },
  {
    quote:
      "The QR check-in alone sold my front desk. Parents love seeing their kids' belt progress, and I finally stopped chasing late memberships by hand.",
    name: "Aisha Rahman",
    role: "Owner, Crescent Karate Dojo",
  },
  {
    quote:
      "Running gradings used to be a paperwork weekend. DojoTrack tracks every requirement per student and prints the certificates. It pays for itself.",
    name: "Kenji Watanabe",
    role: "Sensei, North Shore Judo Club",
  },
];

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Register your club", href: "/register" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Get started", href: "/register" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "mailto:hello@dojotrack.app" },
      { label: "Privacy", href: "#" },
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
            <a href="#testimonials" className="transition-colors hover:text-foreground">
              Testimonials
            </a>
          </nav>
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
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-teal/5 to-transparent"
        />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <p className="eyebrow mb-6">For martial arts clubs</p>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold leading-tight tracking-tight text-brand-navy sm:text-6xl">
            Run your dojo,{" "}
            <span className="text-brand-teal">not your spreadsheets</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            DojoTrack brings your roster, belt progression, scheduling, and
            payments into one mobile-first place — so you can spend less time on
            admin and more time on the mats.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Start free <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-border px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              See features
            </a>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            No credit card required · Free for up to 30 students
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="eyebrow mb-3">Everything in one place</p>
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
              Built for the way clubs actually run
            </h2>
            <p className="mt-3 text-muted-foreground">
              From a student&apos;s first trial class to their black belt — and
              every payment, grading, and competition in between.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                  <Icon size={22} />
                </div>
                <h3 className="mb-1.5 text-lg font-bold tracking-tight text-brand-navy">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="eyebrow mb-3">Pricing</p>
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
              Start free, upgrade when you grow
            </h2>
            <p className="mt-3 text-muted-foreground">
              Simple plans with no setup fees. Cancel anytime.
            </p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.highlighted
                    ? "border-brand-teal bg-brand-navy text-white shadow-lg"
                    : "border-border bg-background"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-8 rounded-full bg-brand-gold px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-navy">
                    Most popular
                  </span>
                )}
                <h3
                  className={`text-lg font-bold ${plan.highlighted ? "text-white" : "text-brand-navy"}`}
                >
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-end gap-1.5">
                  <span
                    className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-brand-navy"}`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`pb-1 text-sm ${plan.highlighted ? "text-white/60" : "text-muted-foreground"}`}
                  >
                    {plan.cadence}
                  </span>
                </div>
                <p
                  className={`mt-3 text-sm ${plan.highlighted ? "text-white/70" : "text-muted-foreground"}`}
                >
                  {plan.blurb}
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        size={18}
                        className={`mt-0.5 shrink-0 ${plan.highlighted ? "text-brand-gold" : "text-brand-teal"}`}
                      />
                      <span className={plan.highlighted ? "text-white/90" : ""}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
                    plan.highlighted
                      ? "bg-brand-gold text-brand-navy"
                      : "bg-brand-teal text-white"
                  }`}
                >
                  {plan.cta} <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Pro pricing is indicative — billing tiers are finalised at launch.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="eyebrow mb-3">Loved by instructors</p>
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
              Dojo owners run leaner with DojoTrack
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col rounded-2xl border border-border bg-background p-6"
              >
                <div className="mb-4 flex gap-0.5 text-brand-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-brand-navy">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            Ready to run your dojo the easy way?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Set up your club in under a minute. It&apos;s free to start.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Logo size={28} />
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                Martial arts club management, simplified.
              </p>
            </div>
            {FOOTER_LINKS.map((col) => (
              <div key={col.heading}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-navy">
                  {col.heading}
                </h3>
                <ul className="space-y-2 text-sm">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-muted-foreground transition-colors hover:text-brand-teal"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © 2026 DojoTrack. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Supports BJJ, Karate, Judo, Taekwondo &amp; custom belt systems.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

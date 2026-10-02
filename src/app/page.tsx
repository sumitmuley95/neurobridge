import Link from "next/link";
import {
  GraduationCap,
  Heart,
  UserCheck,
  School,
  Sprout,
  ClipboardCheck,
  PlayCircle,
  MessageCircle,
  Accessibility,
  Users,
  Trophy,
  Phone,
  Mail,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import { getActiveRole } from "@/lib/auth-session";
import { DASHBOARD_FOR } from "@/lib/session";

export const dynamic = "force-dynamic";

const ROLE_BUTTONS = [
  { role: "student", label: "Student", icon: GraduationCap, cls: "bg-student text-student-foreground" },
  { role: "parent", label: "Parent", icon: Heart, cls: "bg-parent text-parent-foreground" },
  { role: "teacher", label: "Teacher", icon: UserCheck, cls: "bg-teacher text-teacher-foreground" },
  { role: "admin", label: "Admin", icon: School, cls: "bg-admin text-admin-foreground" },
] as const;

const PHOTOS = [
  { src: "/landing/team-visit.jpg", alt: "NeuroBridge team with students and staff at a partner school" },
  { src: "/landing/idol-workshop.jpg", alt: "Students crafting Ganesha idols in a vocational workshop" },
  { src: "/landing/woodwork-class.jpg", alt: "Students working together in a woodwork class" },
  { src: "/landing/team-workshop.jpg", alt: "NeuroBridge team visiting the idol-making workshop" },
  { src: "/landing/educational-visit.jpg", alt: "Group photo from an educational visit" },
  { src: "/landing/yoga-session.jpg", alt: "A student practising yoga during a group session" },
];

const FEATURES = [
  { icon: ClipboardCheck, title: "Gentle screening", text: "A short picture-based check across 8 life-skill areas finds where each learner shines and where to practise." },
  { icon: PlayCircle, title: "Step-by-step learning paths", text: "Short video lessons unlock one by one, followed by practice and a friendly mastery check." },
  { icon: MessageCircle, title: "Talk with pictures", text: "An AAC board lets learners who find speaking hard build sentences from picture cards and hear them spoken." },
  { icon: Accessibility, title: "Built for every mind", text: "Readable fonts, large buttons, read-aloud, high contrast, text sizes and reduced motion — on every page." },
  { icon: Trophy, title: "Streaks, XP & badges", text: "Real progress is celebrated with daily streaks, XP for lessons and badges to unlock." },
  { icon: Users, title: "Families & teachers together", text: "Parents see progress and message their child's teacher; teachers record observations for home." },
];

const STEPS = [
  { n: 1, title: "School joins", text: "The school admin adds teachers, students and any extra subjects." },
  { n: 2, title: "Student screening", text: "Each learner takes a short picture-based screening." },
  { n: 3, title: "Personal path", text: "Lessons, practice and AI-picked activities focus on what they need." },
  { n: 4, title: "Everyone stays in the loop", text: "Parents and teachers follow progress, streaks and badges." },
];

// Placeholder partner schools — replace with real partners when available.
const SCHOOLS = [
  { name: "Asha Learning Centre - DEMO", city: "Kolhapur" },
  { name: "Prerna Special School - DEMO", city: "Pune" },
  { name: "Umang Inclusive Academy - DEMO", city: "Sangli" },
  { name: "Sparsh Vocational Institute - DEMO", city: "Satara" },
  { name: "Navjeevan School for Special Needs - DEMO", city: "Mumbai" },
  { name: "Saksham Learning Hub - DEMO", city: "Nashik" },
];

const PHONE = "+91 8669391467";
const EMAIL = "sumitmuley95@gmail.com";

export default async function LandingPage() {
  const activeRole = await getActiveRole();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b-2 border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 min-h-11" aria-label="NeuroBridge home">
            <span className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <Sprout className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="font-heading font-bold text-xl">NeuroBridge</span>
          </Link>

          <nav aria-label="Page sections" className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {[
              ["#about", "About"],
              ["#how", "How it works"],
              ["#schools", "Schools"],
              ["#contact", "Contact"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="px-3 min-h-11 inline-flex items-center rounded-xl hover:bg-muted">
                {label}
              </a>
            ))}
          </nav>

          {activeRole ? (
            <Link
              href={DASHBOARD_FOR[activeRole]}
              className="min-h-11 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 text-sm font-semibold hover:opacity-90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Go to my dashboard
            </Link>
          ) : (
            <div className="grid grid-cols-4 gap-1.5 w-full sm:w-auto" role="group" aria-label="Log in or sign up">
              {ROLE_BUTTONS.map(({ role, label, icon: Icon, cls }) => (
                <Link
                  key={role}
                  href={`/login?role=${role}`}
                  className={`${cls} min-h-11 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      <main id="main-content">
        {/* ---------- Hero ---------- */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10 space-y-5">
          <span className="inline-block text-xs font-semibold uppercase tracking-wide bg-parent-soft text-parent px-3 py-1 rounded-full">
            Adaptive learning for neurodivergent learners
          </span>
          <h1 className="font-heading font-bold text-4xl sm:text-6xl tracking-tight">NeuroBridge</h1>
          <p className="font-heading text-xl sm:text-2xl text-primary font-semibold">
            Every mind learns differently. We build the bridge.
          </p>
          <p className="max-w-2xl text-base sm:text-lg text-muted-foreground">
            A calm, accessible learning platform for children and young adults with autism, ADHD, dyslexia,
            Down syndrome and other learning differences — connecting students, parents, teachers and schools
            around real-life skills.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={activeRole ? DASHBOARD_FOR[activeRole] : "/login?role=student&mode=signup"}
              className="min-h-12 inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-6 font-semibold hover:opacity-90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {activeRole ? "Continue learning" : "Start as a student"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#contact"
              className="min-h-12 inline-flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-6 font-semibold hover:bg-muted focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Bring NeuroBridge to your school
            </a>
          </div>
        </section>

        {/* ---------- Photo band: moves right → left ---------- */}
        <section aria-label="Photos from our school visits" className="nb-marquee relative overflow-hidden py-4 bg-muted/60 border-y-2 border-border">
          <div className="nb-marquee-track gap-4 pl-4">
            {[...PHOTOS, ...PHOTOS].map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={p.src}
                alt={i < PHOTOS.length ? p.alt : ""}
                aria-hidden={i >= PHOTOS.length ? true : undefined}
                className="h-44 sm:h-56 w-auto rounded-2xl object-cover shadow-sm border-2 border-card"
                loading={i < 3 ? "eager" : "lazy"}
              />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" aria-hidden="true" />
        </section>

        {/* ---------- About ---------- */}
        <section id="about" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-8 scroll-mt-24">
          <div className="space-y-2 max-w-2xl">
            <h2 className="font-heading font-bold text-3xl">About NeuroBridge</h2>
            <p className="text-muted-foreground">
              We visited special schools and vocational centres and saw how much learners can do with the right
              support. NeuroBridge turns that support into a simple, predictable daily routine.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-card border-2 border-border rounded-3xl p-6 space-y-3">
                <span className="h-12 w-12 rounded-2xl bg-student-soft text-student flex items-center justify-center">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="font-heading font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how" className="bg-card border-y-2 border-border scroll-mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-8">
            <h2 className="font-heading font-bold text-3xl">How it works</h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STEPS.map((s) => (
                <li key={s.n} className="rounded-3xl border-2 border-border p-6 space-y-2 bg-background">
                  <span className="h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                    {s.n}
                  </span>
                  <h3 className="font-heading font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Schools ---------- */}
        <section id="schools" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-8 scroll-mt-24">
          <div className="space-y-2">
            <h2 className="font-heading font-bold text-3xl">Schools we work with</h2>
            <p className="text-muted-foreground">Partner schools and learning centres using NeuroBridge.</p>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCHOOLS.map((s) => (
              <li key={s.name} className="bg-card border-2 border-border rounded-2xl p-5 flex items-center gap-4">
                <span className="h-12 w-12 shrink-0 rounded-2xl bg-teacher-soft text-teacher flex items-center justify-center">
                  <School className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.city}, Maharashtra</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Contact ---------- */}
        <section id="contact" className="bg-parent text-parent-foreground scroll-mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <h2 className="font-heading font-bold text-3xl">Contact us</h2>
              <p className="opacity-90 max-w-md">
                Want NeuroBridge for your school or centre, or have a question? We&apos;d love to hear from you.
              </p>
            </div>
            <div className="grid gap-3">
              <a
                href="tel:+918669391467"
                className="bg-card text-foreground rounded-2xl p-5 flex items-center gap-4 hover:opacity-95 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Phone className="h-6 w-6 text-parent" aria-hidden="true" />
                <span>
                  <span className="block text-sm text-muted-foreground">Call us</span>
                  <span className="font-semibold">{PHONE}</span>
                </span>
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="bg-card text-foreground rounded-2xl p-5 flex items-center gap-4 hover:opacity-95 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Mail className="h-6 w-6 text-parent" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm text-muted-foreground">Email us</span>
                  <span className="font-semibold break-all">{EMAIL}</span>
                </span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} NeuroBridge. Every mind learns differently.</span>
          <span className="flex gap-4">
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

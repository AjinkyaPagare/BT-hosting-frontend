import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, ShieldCheck, Clock } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80 text-foreground">
      <header className="border-b border-border/60 bg-background/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Baap Connect</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-6 py-16">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Team collaboration made delightful
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Bring your team together with real-time messaging, tasks, and collaboration.
            </h1>
            <p className="text-lg text-muted-foreground">
              Baap Connect is a modern workspace for fast-moving teams. Stay aligned, share files,
              and move projects forward with conversations that feel natural and organized.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/signup">Start for free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Sign in to your workspace</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Enterprise-grade security
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                24/7 support available
              </div>
            </div>
          </div>
          <Card className="border-primary/10 bg-card/80 shadow-xl shadow-primary/5">
            <CardContent className="space-y-6 p-8">
              <h2 className="text-2xl font-semibold">Everything your team needs in one place</h2>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    1
                  </span>
                  Organize conversations with channels for projects, teams, and clients.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    2
                  </span>
                  Share files instantly and keep discussions and decisions side-by-side.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    3
                  </span>
                  See real-time presence, read receipts, and delivery confirmations.
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {["Instant Messaging", "Smart Groups", "Integrated Tasks"].map((title, index) => {
            const icons = [MessageSquare, Users, ShieldCheck];
            const Icon = icons[index];
            const descriptions = [
              "Keep conversations organized with threads, mentions, and message highlights.",
              "Segment contacts into groups for better collaboration and access control.",
              "Track action items right beside the conversations that created them.",
            ];
            return (
              <Card key={title} className="border-border/70 bg-card/70">
                <CardContent className="space-y-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{descriptions[index]}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 py-8 text-center text-sm text-muted-foreground md:flex-row md:justify-between">
          <p>&copy; {new Date().getFullYear()} Baap Connect. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link to="/signup" className="hover:text-foreground">
              Request demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

import * as React from 'react';
import { ArrowUpRight, Coffee, Github, Heart, Lock, MessageSquare, Share2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Separator } from '@/components/ui/misc';
import { SUPPORT } from './config';

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10.25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".3" />
      <path d="M6.5 12.5c1.4-1.6 2.6-1.6 4 0s2.6 1.6 4 0 2.6-1.6 3.5-.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

type Way = { title: string; desc: string; href: string; cta: string; icon: React.ComponentType<{ className?: string }>; featured?: boolean };

const WAYS: Way[] = [
  { title: 'Ko-fi', desc: 'A one-off coffee, or a small monthly tip. No account needed.', href: SUPPORT.kofi, cta: 'Tip on Ko-fi', icon: Coffee, featured: true },
  { title: 'GitHub Sponsors', desc: 'Monthly support, with 0% fees going to the platform.', href: SUPPORT.githubSponsors, cta: 'Sponsor', icon: Github },
  { title: 'Buy Me a Coffee', desc: 'Quick and simple, if that’s what you already use.', href: SUPPORT.buyMeACoffee, cta: 'Buy a coffee', icon: Heart },
];

const FREE: { title: string; desc: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { title: 'Leave a review', desc: 'Reviews are how people find hush.', href: SUPPORT.chromeWebStore, icon: Star },
  { title: 'Star it on GitHub', desc: 'Or report a site that hush should calm down.', href: SUPPORT.github, icon: MessageSquare },
  { title: 'Share it', desc: 'Send it to someone who needs a quieter web.', href: SUPPORT.website || SUPPORT.chromeWebStore, icon: Share2 },
];

function open(href: string) {
  if (!href) return;
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) chrome.tabs.create({ url: href });
  else window.open(href, '_blank', 'noopener');
}

export function SupportPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-12 px-6 py-16">
      {/* hero */}
      <section className="flex flex-col items-start gap-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-2.5">
          <img src="./logo.png" alt="" className="size-8 rounded-[9px]" />
          <span className="text-lg font-semibold tracking-tight">hush</span>
          <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
            free, forever
          </Badge>
        </div>
        <h1 className="max-w-xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance">
          A quieter web shouldn’t cost anything.
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
          hush is free and always will be. No ads, no tracking, no premium tier holding the calm hostage. If it’s made the
          web feel a little less loud for you, you can help keep it going.
        </p>
      </section>

      {/* ways to give */}
      <section className="grid gap-4 sm:grid-cols-3">
        {WAYS.map((w, i) => {
          const Icon = w.icon;
          const ready = !!w.href;
          return (
            <Card
              key={w.title}
              className={`gap-4 py-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 fill-mode-both ${w.featured ? 'border-foreground/20' : ''}`}
              style={{ animationDelay: `${120 + i * 70}ms` }}
            >
              <CardHeader className="px-5">
                <div className="mb-2 grid size-9 place-items-center rounded-lg bg-muted">
                  <Icon className="size-4" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  {w.title}
                  {w.featured && <Badge variant="secondary">Popular</Badge>}
                </CardTitle>
                <CardDescription className="leading-relaxed">{w.desc}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto px-5">
                <Button
                  variant={w.featured ? 'default' : 'outline'}
                  size="sm"
                  className="w-full"
                  disabled={!ready}
                  onClick={() => open(w.href)}
                >
                  {ready ? (
                    <>
                      {w.cta}
                      <ArrowUpRight className="size-3.5" />
                    </>
                  ) : (
                    'Coming soon'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </section>

      <Separator />

      {/* free ways */}
      <section className="flex flex-col gap-4 animate-in fade-in-0 duration-500 fill-mode-both" style={{ animationDelay: '360ms' }}>
        <div>
          <h2 className="text-sm font-medium">Free ways to help</h2>
          <p className="text-sm text-muted-foreground">Just as valuable as a tip.</p>
        </div>
        <div className="grid gap-2">
          {FREE.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.title}
                type="button"
                disabled={!f.href}
                onClick={() => open(f.href)}
                className="group flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-150 hover:bg-accent/50 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent"
              >
                <Icon className="size-4 text-muted-foreground" />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{f.title}</span>
                  <span className="block text-xs text-muted-foreground">{f.desc}</span>
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </section>

      {/* promise */}
      <section
        className="flex items-start gap-3 rounded-xl border bg-card/40 p-5 animate-in fade-in-0 duration-500 fill-mode-both"
        style={{ animationDelay: '440ms' }}
      >
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="text-sm leading-relaxed">
          <span className="font-medium">The promise.</span>{' '}
          <span className="text-muted-foreground">
            hush stores nothing but your settings, never touches what you read or watch, and never injects ads or
            affiliate links. Supporting it changes none of that.
          </span>
        </div>
      </section>

      <footer className="text-xs text-muted-foreground">Thank you for turning the volume down with us.</footer>
    </main>
  );
}

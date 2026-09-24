"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { NavigationItem } from "@/lib/navigation";

type MegaMenuProps = { items: readonly NavigationItem[]; className?: string };

function Chevron({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={`size-4 shrink-0 ${className}`}>
    <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function MenuLink({ item, onNavigate, className = "" }: {
  item: NavigationItem; onNavigate: () => void; className?: string;
}) {
  return item.href ? <Link href={item.href} onClick={onNavigate} className={`theme-link block rounded-lg px-3 py-2 [overflow-wrap:anywhere] hover:bg-secondary hover:text-secondary-foreground ${className}`}>
    {item.label}
  </Link> : <span className={`block px-3 py-2 text-foreground [overflow-wrap:anywhere] ${className}`}>{item.label}</span>;
}

function NestedItems({ items, onNavigate }: { items: readonly NavigationItem[]; onNavigate: () => void }) {
  return <ul className="space-y-1">
    {items.map(item => <li key={item.id} className="min-w-0">
      {item.children?.length ? <details className="[&[open]>summary>svg]:rotate-180">
        <summary className="button-quiet flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-2 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 [overflow-wrap:anywhere]">{item.label}</span>
          <Chevron className="transition-transform" />
        </summary>
        <div className="ml-3 border-l border-border pl-2">
          {item.href ? <MenuLink item={{ ...item, label: `View all ${item.label}` }} onNavigate={onNavigate} className="font-medium" /> : null}
          <NestedItems items={item.children} onNavigate={onNavigate} />
        </div>
      </details> : <MenuLink item={item} onNavigate={onNavigate} />}
    </li>)}
  </ul>;
}

function MenuContents({ items, className = "" }: MegaMenuProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const id = useId();
  const close = () => { setActiveId(null); setMobileOpen(false); };

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        setActiveId(null);
        setMobileOpen(false);
      }
    };
    const breakpoint = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { setActiveId(null); setMobileOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    breakpoint.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      breakpoint.removeEventListener("change", onResize);
    };
  }, []);

  if (!items.length) return null;

  return <div ref={root} className={`min-w-0 lg:static ${className}`}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}
    onKeyDown={event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      const branch = event.target instanceof Element ? event.target.closest("details[open]") : null;
      if (branch instanceof HTMLDetailsElement) {
        branch.open = false;
        branch.querySelector("summary")?.focus();
      } else {
        const opener = activeId ? triggers.current.get(activeId) : mobileTrigger.current;
        close();
        opener?.focus();
      }
    }}>
    <div className="lg:hidden">
      <button ref={mobileTrigger} type="button" aria-expanded={mobileOpen} aria-controls={`${id}-mobile`}
        onClick={() => setMobileOpen(open => !open)} className="button-secondary inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
          <path d={mobileOpen ? "m6 6 12 12M6 18 18 6" : "M4 6h16M4 12h16M4 18h16"} strokeLinecap="round" />
        </svg>
        Menu
      </button>
      {mobileOpen ? <div id={`${id}-mobile`} className="mt-3 max-h-[60dvh] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface p-3 text-sm">
        <NestedItems items={items} onNavigate={close} />
      </div> : null}
    </div>

    <ul className="hidden flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm lg:flex">
      {items.map((item, index) => {
        const isOpen = activeId === item.id;
        const panelId = `${id}-panel-${index}`;
        const triggerId = `${id}-trigger-${index}`;
        return <li key={item.id} className="min-w-0 max-w-full">
          {item.children?.length ? <>
            <button ref={element => { if (element) triggers.current.set(item.id, element); else triggers.current.delete(item.id); }}
              id={triggerId} type="button" aria-expanded={isOpen} aria-controls={panelId}
              onClick={() => setActiveId(isOpen ? null : item.id)}
              className={`button-quiet flex max-w-full items-center gap-2 rounded-full px-3 py-2 font-medium ${isOpen ? "bg-secondary text-secondary-foreground" : ""}`}>
              <span className="min-w-0 [overflow-wrap:anywhere]">{item.label}</span>
              <Chevron className={isOpen ? "rotate-180" : ""} />
            </button>
            {isOpen ? <div id={panelId} aria-labelledby={triggerId}
              className="absolute inset-x-0 top-full z-40 mt-4 max-h-[min(70dvh,36rem)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface shadow-xl shadow-shadow">
              <div className="flex items-center justify-between gap-4 border-b border-border bg-secondary px-6 py-4 text-secondary-foreground">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em]">Explore</p>
                  <p className="mt-1 text-xl font-medium [overflow-wrap:anywhere]">{item.label}</p>
                </div>
                <button type="button" aria-label={`Close ${item.label} menu`} onClick={() => { close(); triggers.current.get(item.id)?.focus(); }} className="button-secondary rounded-full border border-border p-2">
                  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><path d="m6 6 12 12M6 18 18 6" strokeLinecap="round" /></svg>
                </button>
              </div>
              <ul className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-6 p-6">
                {item.children.map(group => <li key={group.id} className="min-w-0">
                  <MenuLink item={group} onNavigate={close} className="mb-2 font-semibold" />
                  {group.children?.length ? <NestedItems items={group.children} onNavigate={close} /> : null}
                </li>)}
              </ul>
              {item.href ? <div className="border-t border-border px-6 py-3">
                <MenuLink item={{ ...item, label: `View all ${item.label}` }} onNavigate={close} className="inline-block font-medium" />
              </div> : null}
            </div> : null}
          </> : <MenuLink item={item} onNavigate={close} className="font-medium" />}
        </li>;
      })}
    </ul>
  </div>;
}

export function MegaMenu(props: MegaMenuProps) {
  const pathname = usePathname();
  return <MenuContents key={pathname} {...props} />;
}

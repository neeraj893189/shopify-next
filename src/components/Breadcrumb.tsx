import Link, { type LinkProps } from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: LinkProps["href"];
};

export type BreadcrumbProps = {
  items: readonly BreadcrumbItem[];
  className?: string;
  ariaLabel?: string;
};

export function Breadcrumb({
  items,
  className,
  ariaLabel = "Breadcrumb",
}: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className={["text-sm text-muted-foreground", className].filter(Boolean).join(" ")}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {items.map((item, index) => {
          const isCurrentPage = index === items.length - 1;

          return (
            <li
              key={`${index}-${item.label}`}
              className="flex min-w-0 max-w-full items-center gap-2"
            >
              {index > 0 ? (
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-3 w-3 shrink-0"
                >
                  <path d="m6 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
              {isCurrentPage ? (
                <span
                  aria-current="page"
                  className="min-w-0 font-medium text-foreground [overflow-wrap:anywhere]"
                >
                  {item.label}
                </span>
              ) : item.href !== undefined ? (
                <Link
                  href={item.href}
                  className="theme-link min-w-0 rounded-sm underline-offset-4 hover:underline [overflow-wrap:anywhere]"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="min-w-0 [overflow-wrap:anywhere]">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

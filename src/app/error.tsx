"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-6xl px-6 py-16">
    <h1 className="text-2xl font-semibold">We could not load this page.</h1>
    <p className="mt-3">Please try again in a moment.</p>
    <button type="button" onClick={reset} className="mt-6 button-primary px-5 py-3">Try again</button>
  </main>;
}

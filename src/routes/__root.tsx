import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { Header } from "@/components/Header";
import { registerChunkLoadRecovery } from "@/lib/chunk-load-recovery";

function NotFoundComponent() {
  return (
    <div className="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-2xl p-8">
        <h1 className="text-6xl font-bold neon-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That page doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md neon-button px-5 py-2.5 text-sm font-semibold"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-2xl p-8">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Try again or head home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="neon-button rounded-md px-4 py-2 text-sm font-semibold"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-md border border-border bg-secondary px-4 py-2 text-sm hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Blazt Share — Send anything instantly" },
      {
        name: "description",
        content:
          "Share text and files with a 4-digit code. No accounts, temporary, peer-to-peer style.",
      },
      { property: "og:title", content: "Blazt Share" },
      {
        property: "og:description",
        content: "Send text and files with a 4-digit code.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "theme-color", content: "#0a1426" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    registerChunkLoadRecovery();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <main className="relative z-10">
        <Outlet />
      </main>
      <Toaster theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}

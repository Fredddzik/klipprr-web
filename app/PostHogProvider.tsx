"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

// Initialise at module level on the client — runs before any component mounts
if (typeof window !== "undefined" && POSTHOG_KEY && POSTHOG_HOST) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false, // fired manually on route change below
    capture_pageleave: true,
  });
}

function PostHogPageview() {
  const pathname = usePathname();
  const ph = usePostHog();

  useEffect(() => {
    ph?.capture("$pageview");
  }, [pathname, ph]);

  return null;
}

function PostHogIdentity() {
  const ph = usePostHog();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        ph?.identify(session.user.id, {
          email: session.user.email,
          created_at: session.user.created_at,
        });
      } else {
        ph?.reset();
      }
    });
    return () => subscription.unsubscribe();
  }, [ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_KEY) return <>{children}</>;
  return (
    <PHProvider client={posthog}>
      <PostHogPageview />
      <PostHogIdentity />
      {children}
    </PHProvider>
  );
}

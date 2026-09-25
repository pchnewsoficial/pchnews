import { useEffect } from "react";
import { useLocation } from "wouter";
import { initAnalytics, trackEvent } from "@/lib/analytics";

/** SPA route tracking for Clarity. Admin routes are tagged but never carry content. */
export default function AnalyticsTracker() {
  const [location] = useLocation();
  useEffect(() => { initAnalytics(); }, []);
  useEffect(() => {
    const section = location.split("/")[1] || "home";
    trackEvent("page_view", { section });
  }, [location]);
  return null;
}

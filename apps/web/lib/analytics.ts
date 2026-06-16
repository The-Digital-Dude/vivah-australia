'use client';

/**
 * Lightweight analytics wrapper for Vivah Australia.
 *
 * Uses PostHog if available via the global posthog object (loaded via
 * PostHogProvider or script tag). Falls back silently so analytics never
 * breaks the application.
 */

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
      identify: (id: string, properties?: Record<string, unknown>) => void;
    };
    gtag?: (command: 'event', eventName: string, properties?: Record<string, unknown>) => void;
  }
}

function hasAnalyticsConsent(): boolean {
  try {
    const stored = window.localStorage.getItem('vivah_cookie_consent_v1');
    if (!stored) return false;
    return Boolean((JSON.parse(stored) as { analytics?: boolean }).analytics);
  } catch {
    return false;
  }
}

export type MembershipEvent =
  | 'membership_page_viewed'
  | 'membership_plan_selected'
  | 'membership_checkout_started'
  | 'membership_checkout_completed'
  | 'membership_coupon_applied'
  | 'membership_faq_opened'
  | 'membership_success_story_viewed'
  | 'membership_billing_toggle'
  | 'membership_recommendation_answered'
  | 'membership_vip_section_viewed'
  | 'membership_trust_strip_viewed';

export function track(
  event: MembershipEvent,
  properties?: Record<string, unknown>,
): void {
  try {
    if (typeof window === 'undefined' || !hasAnalyticsConsent()) {
      return;
    }
    if (window.posthog?.capture) {
      window.posthog.capture(event, properties);
    }
    if (window.gtag) {
      window.gtag('event', event, properties);
    }
  } catch {
    // Never throw from analytics
  }
}

export function useAnalytics() {
  return { track };
}

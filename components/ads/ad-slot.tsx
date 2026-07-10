// components/ads/ad-slot.tsx
//
// The one place an ad ever renders (issue #37). A SERVER component, so the gating
// decision runs on the server and no ad markup or SDK is ever sent to a parent who
// should not see ads. Drop `<AdSlot placement="..." />` onto a screen and it takes
// care of everything: it self-resolves the parent and their subscription, applies
// the free-tier-only rule, and returns null (renders nothing) when ads are off,
// when the parent is a subscriber or on a trial, or when the config is incomplete.
//
// Never place this in the story reader, the paywall, the parental gate, or the
// subscribe / account / auth screens (docs/COMPLIANCE-COPPA.md; issue #37). Ads
// belong only on browse surfaces (the library and the collection) where they never
// interrupt a child reading a story.
import { getParent } from "@/lib/session";
import { getSubscription } from "@/lib/entitlements";
import { getAdsConfig, shouldShowAds, type AdPlacement } from "@/lib/ads";
import { HouseAd } from "@/components/ads/house-ad";

export async function AdSlot({ placement }: { placement: AdPlacement }) {
  const config = getAdsConfig();

  // Cheap short-circuit: when ads are globally off (kill switch / missing config)
  // we do no session or billing work at all.
  if (!config.enabled) return null;

  const parent = await getParent();
  const subscription = await getSubscription(parent);
  if (!shouldShowAds(subscription, config)) return null;

  return (
    // A labeled, visually separated region. `aria-label` names it "Advertisement"
    // for assistive tech; the visible eyebrow says the same in high-contrast text
    // so it is never mistaken for app content. This container is deliberately NOT a
    // Paper Cut button (no bottom-edge shadow, no active translate, default cursor).
    <aside
      aria-label="Advertisement"
      className="mt-8 rounded-3xl border-2 border-dashed border-[var(--pc-line)] bg-[var(--accent)] p-4"
    >
      <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[var(--pc-ink)]">
        Advertisement
      </p>
      {renderAd(config, placement)}
    </aside>
  );
}

/**
 * Render the selected network. Only "house" renders today; the third-party paths
 * stay null until they are actually integrated (behind vendor and LAWYER sign-off,
 * docs/COMPLIANCE-COPPA.md section 6a), so selecting one before it is wired shows
 * nothing rather than something non-compliant. getAdsConfig already guarantees a
 * third-party network is only ever `enabled` once its unit id is present.
 */
function renderAd(config: ReturnType<typeof getAdsConfig>, placement: AdPlacement) {
  switch (config.network) {
    case "house":
      return <HouseAd placement={placement} />;
    case "superawesome":
    case "google-gam":
    default:
      return null;
  }
}

// app/terms/page.tsx
// Public, indexable Terms of Service (issue #49). Canonical published copy lives
// here; the working draft of record is docs/legal/terms-of-service.md (keep the
// two in sync). Still unfilled values come from lib/legal.ts and render as
// visible placeholder badges via <Ph>/<Email>. Public route: allowlisted in
// proxy.ts and listed in lib/seo.ts so crawlers reach and index it.
import type { Metadata } from "next";
import { LegalChrome } from "@/components/legal/legal-chrome";
import { LegalPage } from "@/components/legal/legal-page";
import { Ph, Email } from "@/components/legal/tokens";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using Bedtime Quests, the interactive bedtime story app for young children, agreed to by a parent or guardian.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalChrome>
      <LegalPage
        title="Terms of Service"
        effectiveDate={LEGAL.effectiveDate}
        lastUpdated={LEGAL.lastUpdated}
      >
        <h2>1. Agreement to these terms</h2>
        <p>
          These Terms of Service (&quot;Terms&quot;) are a legal agreement between you and{" "}
          <Ph>{LEGAL.companyName}</Ph> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) about your use of the
          Bedtime Quests app and website (the &quot;Service&quot;). By creating an account
          or using the Service, you agree to these Terms. If you do not agree,
          please do not use the Service.
        </p>

        <h2>2. The Service is for parents and guardians</h2>
        <p>
          Bedtime Quests is an interactive bedtime story app for young children,
          meant to be read aloud by a parent or guardian.
        </p>
        <ul>
          <li>
            Accounts may be created and managed only by an adult who is at least
            18 years old (or the age of majority where you live).
          </li>
          <li>
            <strong>
              A parent or guardian agrees to these Terms on behalf of the child
            </strong>{" "}
            who uses the Service, and is responsible for supervising the child&apos;s
            use.
          </li>
          <li>
            Children do not create accounts and should use the Service only with
            an adult present.
          </li>
        </ul>
        <p>
          Our handling of children&apos;s information is described in our{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>

        <h2>3. Your account</h2>
        <ul>
          <li>
            You are responsible for keeping your login credentials secure and for
            activity under your account.
          </li>
          <li>Please give accurate account information and keep it current.</li>
          <li>
            Tell us promptly at <Email address={LEGAL.supportEmail} /> if you
            believe your account has been used without your permission.
          </li>
        </ul>

        <h2>4. Acceptable use</h2>
        <p>
          You agree to use the Service only for its intended, personal, family
          purpose. You agree <strong>not</strong> to:
        </p>
        <ul>
          <li>Break the law or infringe anyone&apos;s rights while using the Service.</li>
          <li>
            Copy, resell, rent, or redistribute the stories, artwork, or other
            content except as the Service allows.
          </li>
          <li>
            Reverse engineer, tamper with, or try to gain unauthorized access to
            the Service or its systems.
          </li>
          <li>
            Interfere with or disrupt the Service, or attempt to get around
            security, rate limits, or the parental check.
          </li>
          <li>
            Upload harmful code, or use the Service to harass or harm others.
          </li>
          <li>
            Use automated means to scrape or bulk download content without our
            permission.
          </li>
        </ul>
        <p>
          We may suspend or close accounts that violate these Terms or that we
          reasonably believe put children, other users, or the Service at risk.
        </p>

        <h2>5. Content and intellectual property</h2>
        <p>
          The stories, artwork, text, logos, and software in the Service are owned
          by <Ph>{LEGAL.companyName}</Ph> or our licensors and are protected by
          law. We grant you a limited, personal, non exclusive, non transferable,
          revocable license to use the Service for your family&apos;s own enjoyment.
          All rights we do not expressly grant are reserved. The Bedtime Quests
          name and logo are our brand and may not be used without permission.
        </p>

        <h2>6. Subscriptions, billing, and cancellation</h2>
        <p>
          Some features may require a paid subscription. When subscriptions are
          offered:
        </p>
        <ul>
          <li>
            <strong>Where you buy.</strong> Subscriptions are sold through the app
            stores (Apple App Store or Google Play) and are managed by their
            billing systems. Your purchase is also subject to the app store&apos;s
            terms.
          </li>
          <li>
            <strong>Free trial.</strong> If we offer a free trial, it converts to
            a paid subscription when the trial ends unless you cancel before the
            trial ends. The trial length and terms will be shown at sign up.
          </li>
          <li>
            <strong>Auto renew.</strong> Paid subscriptions renew automatically at
            the end of each billing period at the then current price, until you
            cancel. You are charged through your app store account.
          </li>
          <li>
            <strong>How to cancel.</strong> You cancel through your app store
            account settings (Apple or Google), not by uninstalling the app.
            Cancellation takes effect at the end of the current billing period,
            and you keep access until then.
          </li>
          <li>
            <strong>Price changes.</strong> If a price changes, we or the app
            store will notify you as required, and the new price applies to
            renewals after the notice.
          </li>
          <li>
            <strong>Refunds.</strong> Refunds are handled by the app store under
            its policies. We do not process card payments directly and generally
            cannot issue app store refunds.
          </li>
        </ul>
        <p>
          Purchases are made by the adult account holder. A parental check helps
          confirm an adult is present before a purchase begins.
        </p>

        <h2>7. Changes to the Service</h2>
        <p>
          We may add, change, or remove features, stories, or other parts of the
          Service over time. We may also suspend or discontinue the Service, in
          whole or in part. We will try to give reasonable notice of major changes
          where practical.
        </p>

        <h2>8. Disclaimers</h2>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available.&quot; To the fullest
          extent the law allows, we disclaim all warranties, whether express or
          implied, including any implied warranties of merchantability, fitness
          for a particular purpose, and non infringement. We do not warrant that
          the Service will be uninterrupted, error free, or free of harmful
          components. Bedtime Quests is for entertainment and is not educational,
          medical, or developmental advice.
        </p>

        <h2>9. Limitation of liability</h2>
        <p>
          To the fullest extent the law allows, <Ph>{LEGAL.companyName}</Ph> and
          its owners, employees, and suppliers will not be liable for any
          indirect, incidental, special, consequential, or punitive damages, or
          for any loss of data, arising out of or relating to your use of the
          Service. To the fullest extent the law allows, our total liability for
          any claim relating to the Service is limited to the greater of the
          amount you paid us for the Service in the twelve months before the
          claim, or twenty five U.S. dollars. Some places do not allow certain
          limitations, so parts of this section may not apply to you.
        </p>

        <h2>10. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless <Ph>{LEGAL.companyName}</Ph>{" "}
          from claims, losses, and expenses (including reasonable legal fees)
          arising from your misuse of the Service or your violation of these
          Terms, to the extent the law allows.
        </p>

        <h2>11. Termination</h2>
        <p>
          You may stop using the Service and delete your account at any time from
          the app. We may suspend or end your access if you violate these Terms or
          to protect the Service or its users. When your account ends, your right
          to use the Service ends, and we handle your data as described in the{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>

        <h2>12. Governing law and disputes</h2>
        <p>
          These Terms are governed by the laws of{" "}
          <Ph>{LEGAL.governingLawRegion}</Ph>, without regard to its conflict of
          laws rules. Any dispute that is not resolved informally will be handled
          by the courts located in <Ph>{LEGAL.courtsLocation}</Ph>, and you and we
          consent to their jurisdiction. Nothing here limits any rights you have
          under the mandatory laws of the place where you live.
        </p>

        <h2>13. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. When we make a material
          change, we will update the effective date above and, where appropriate,
          notify you. If you keep using the Service after a change takes effect,
          you accept the updated Terms.
        </p>

        <h2>14. Contact us</h2>
        <p>Questions about these Terms:</p>
        <ul>
          <li>
            Email: <Email address={LEGAL.supportEmail} />
          </li>
          <li>
            Mail: <Ph>{LEGAL.companyName}</Ph>, <Ph>{LEGAL.companyAddress}</Ph>
          </li>
          <li>
            App: <a href={`https://${LEGAL.website}`}>{LEGAL.website}</a>
          </li>
        </ul>
      </LegalPage>
    </LegalChrome>
  );
}

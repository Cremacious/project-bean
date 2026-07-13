// app/privacy/page.tsx
// Public, indexable Privacy Policy (issue #49). Canonical published copy lives
// here; the working draft of record is docs/legal/privacy-policy.md (keep the
// two in sync). Still unfilled values come from lib/legal.ts and render as
// visible placeholder badges via <Ph>/<Email>. Public route: allowlisted in
// proxy.ts and listed in lib/seo.ts so crawlers reach and index it.
import type { Metadata } from "next";
import { LegalChrome } from "@/components/legal/legal-chrome";
import { LegalPage } from "@/components/legal/legal-page";
import { Ph, Email } from "@/components/legal/tokens";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Bedtime Quests protects your family's information, with a child directed, data minimizing approach built for COPPA.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalChrome>
      <LegalPage
        title="Privacy Policy"
        effectiveDate={LEGAL.effectiveDate}
        lastUpdated={LEGAL.lastUpdated}
      >
        <h2>1. Who we are</h2>
        <p>
          Bedtime Quests is an interactive bedtime story app for young children,
          read aloud by a parent or guardian. It is operated by{" "}
          <Ph>{LEGAL.companyName}</Ph> ("we", "us", "our"). You can reach us
          about privacy at <Email address={LEGAL.supportEmail} /> or by mail at{" "}
          <Ph>{LEGAL.companyAddress}</Ph>.
        </p>
        <p>
          This policy explains what information we collect, why, who we share it
          with, and the choices you have. Because our app is meant for young
          children, we designed it to collect as little about a child as
          possible.
        </p>

        <h2>2. A note for parents (this is a child directed app)</h2>
        <p>
          Bedtime Quests is directed to children under 13, so we follow the U.S.
          Children's Online Privacy Protection Act (COPPA). The important points:
        </p>
        <ul>
          <li>
            The <strong>parent or guardian</strong> creates and controls the
            account. Children do not create accounts and do not enter their own
            information.
          </li>
          <li>
            About a child, we store <strong>only a first name</strong> (so the
            story can greet them), plus reading preferences and which story
            endings they have found.
          </li>
          <li>
            We do <strong>not</strong> knowingly collect a child's last name,
            birthdate, age, photos, voice, precise location, email, phone number,
            or any other contact details.
          </li>
          <li>
            Parents can review and delete their child's information at any time
            (see section 8).
          </li>
        </ul>

        <h2>3. Information we collect</h2>
        <h3>3a. Information about your child</h3>
        <ul>
          <li>
            <strong>First name.</strong> You, the parent, enter your child's
            first name so the story can use it. We store the first name only.
          </li>
          <li>
            <strong>Reading preferences.</strong> How the story is shown: read to
            me or can read, font, and text size.
          </li>
          <li>
            <strong>Story progress.</strong> Which story endings your child has
            reached, so we can show what they have discovered.
          </li>
        </ul>
        <p>
          We do not ask your child to type anything about themselves, and we do
          not collect a child's last name, age, birthdate, photo, voice,
          location, or contact information.
        </p>

        <h3>3b. Information about you, the parent</h3>
        <ul>
          <li>
            <strong>Account details.</strong> Your name and email address.
          </li>
          <li>
            <strong>Sign in credentials.</strong> If you use email and password,
            we store a secure hash of your password, never the password itself.
            If you use Google or Apple sign in, we store the login token that
            provider gives us, and possibly a profile image if the provider
            returns one.
          </li>
          <li>
            <strong>Session and security data.</strong> When you are signed in we
            record basic session information such as your IP address and browser
            type to keep you logged in and to protect the account from abuse.
          </li>
        </ul>

        <h3>3c. Purchases</h3>
        <p>
          Subscriptions are planned through the app stores (Apple and Google)
          using a subscription tool called RevenueCat. When you subscribe, the
          purchase happens through your app store account.{" "}
          <strong>We never see or store your card number.</strong> We receive a
          confirmation that a subscription is active, tied to your adult account,
          not to your child.
        </p>

        <h3>3d. Advertising and analytics identifiers</h3>
        <p>
          If we show ads or measure app usage, the ad and analytics providers may
          create technical identifiers. We require these to be configured in a{" "}
          <strong>child directed, limited</strong> mode: contextual ads only, no
          behavioral or interest based advertising, and no ad personalization.
          See sections 5 and 6.
        </p>

        <h2>4. How we use information</h2>
        <ul>
          <li>To personalize the story with your child's first name.</li>
          <li>To remember reading preferences and story progress.</li>
          <li>To create and secure your account and keep you signed in.</li>
          <li>To send you account email such as password resets.</li>
          <li>To provide and manage subscriptions.</li>
          <li>To measure and improve the app in a privacy protective way.</li>
          <li>To show contextual (non behavioral) ads, if ads are enabled.</li>
          <li>To keep the service safe and prevent abuse.</li>
        </ul>
        <p>
          We do <strong>not</strong> use your child's information to build
          advertising profiles, and we do not sell personal information.
        </p>

        <h2>5. Advertising</h2>
        <p>
          If Bedtime Quests shows ads, the ads are <strong>contextual only</strong>.
          That means they are based on the content of the app, not on tracking
          your child or building a profile of them. We do not permit behavioral or
          interest based advertising to children. The ad provider{" "}
          <Ph>{LEGAL.adNetwork}</Ph> is configured for child directed treatment,
          which turns off personalized ads. We do not share your child's first
          name or profile with the ad provider.
        </p>

        <h2>6. Analytics</h2>
        <p>
          If we use analytics (<Ph>{LEGAL.analyticsProvider}</Ph>) to understand
          how the app is used, we configure it for a child directed audience:
          advertising features and ad personalization are turned off, and we do
          not use it to build cross service profiles of your child. We aim to keep
          analytics aggregate and non identifying, and we do not send your child's
          first name to the analytics provider.
        </p>

        <h2>7. Who we share information with</h2>
        <p>
          We do not sell personal information. We share information only with
          service providers that help us run the app, and only for that purpose:
        </p>
        <ul>
          <li>
            <strong>Infrastructure providers:</strong> our database host (Neon)
            stores the data; our email provider (Resend) delivers account email
            such as password resets; our web host serves the app.
          </li>
          <li>
            <strong>RevenueCat:</strong> to manage subscriptions, using an
            identifier tied to your adult account, never your child's name.
          </li>
          <li>
            <strong><Ph>{LEGAL.adNetwork}</Ph>:</strong> only if ads are enabled,
            in contextual, child directed mode.
          </li>
          <li>
            <strong><Ph>{LEGAL.analyticsProvider}</Ph>:</strong> only if analytics
            is enabled, in a limited, child directed configuration.
          </li>
          <li>
            <strong>Legal reasons:</strong> if required by law, or to protect the
            safety and rights of users and the public.
          </li>
        </ul>

        <h2>8. Parental rights and choices</h2>
        <p>As a parent or guardian, you can:</p>
        <ul>
          <li>
            <strong>Review</strong> the information we hold about your child.
            Contact <Email address={LEGAL.supportEmail} /> and we will help.
          </li>
          <li>
            <strong>Delete</strong> your child's information. You can remove a
            child profile in the app, or delete your whole account, which erases
            your child's first name and story progress along with the account. You
            can also email <Email address={LEGAL.supportEmail} /> to request
            deletion.
          </li>
          <li>
            <strong>Withdraw consent.</strong> You can stop our further collection
            of your child's information at any time. If you do, we will stop
            collecting and delete the child's information on request. Note that
            withdrawing consent may mean parts of the app no longer work.
          </li>
          <li>
            <strong>Update</strong> your account details from the app settings.
          </li>
        </ul>
        <p>
          Some of these actions are protected by a parental check to confirm an
          adult is present.
        </p>

        <h2>9. Data retention</h2>
        <p>
          We keep information only as long as we need it to run the app for your
          family. When you delete a child profile or your account, we delete the
          associated child first name and story progress. We remove data from
          active systems promptly and from backups within a reasonable period. We
          may keep limited records where the law requires it.
        </p>

        <h2>10. Security</h2>
        <p>
          We protect information with reasonable safeguards: passwords are stored
          only as secure hashes, connections use encryption in transit, sign in
          endpoints are rate limited against abuse, and access to production data
          is restricted. No system is perfectly secure, but we work to protect
          your family's information.
        </p>

        <h2>11. Changes to this policy</h2>
        <p>
          We may update this policy as the app changes. When we make a material
          change, we will update the effective date above and, where appropriate,
          notify parents. If a change expands how we use a child's information, we
          will obtain parental consent as required.
        </p>

        <h2>12. How to contact us</h2>
        <p>Questions, requests, or concerns about privacy:</p>
        <ul>
          <li>
            Email: <Email address={LEGAL.supportEmail} />
          </li>
          <li>
            Mail: <Ph>{LEGAL.companyName}</Ph>, <Ph>{LEGAL.companyAddress}</Ph>
          </li>
          <li>
            App:{" "}
            <a href={`https://${LEGAL.website}`}>{LEGAL.website}</a>
          </li>
        </ul>
        <p>
          We respond to parental requests about a child's data as promptly as we
          can. This policy is intended to be read together with our{" "}
          <a href="/terms">Terms of Service</a>.
        </p>
      </LegalPage>
    </LegalChrome>
  );
}

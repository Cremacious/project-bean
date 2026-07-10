# COPPA compliance review for Bedtime Quests

> **Draft for review. Not legal advice.** This document is an internal, plain
> language review written by the product team to guide how Bedtime Quests
> handles children's data. It is a starting point for a real attorney, not a
> substitute for one. Anything marked **LAWYER** below needs sign off from
> qualified counsel before launch. Laws change and vary by region; treat this
> as a living document.

**Product:** Bedtime Quests (repo codename `project-bean`)
**Reviewed against:** the U.S. Children's Online Privacy Protection Act (COPPA)
and the FTC COPPA Rule.
**What it is:** an interactive bedtime story web app aimed at young children,
read aloud by a parent. Because the audience is young children, we treat the
app as **child directed** and assume every reader may be under 13.
**Draft date:** July 10, 2026.

---

## 1. Why COPPA applies to us

COPPA governs operators of online services that are directed to children under
13, or that knowingly collect personal information from children under 13. It
requires those operators to:

1. Post a clear privacy policy.
2. Give parents direct notice and obtain **verifiable parental consent** before
   collecting, using, or disclosing a child's personal information.
3. Collect only what is reasonably necessary (data minimization).
4. Let parents review and delete their child's information and refuse further
   collection.
5. Keep the information secure and retain it only as long as needed.
6. Not condition a child's participation on disclosing more information than is
   reasonably necessary.

Bedtime Quests is designed for young children, so we do not rely on being able
to say "this is really a general audience app." We assume COPPA applies and
build to it.

---

## 2. What personal information we collect, and why

Data minimization is our core strategy. We collect as little as possible about
the child, and we push all account level data onto the **parent**, who is an
adult with their own account.

### 2a. About the child

| Data | Stored where | Why we collect it | Notes |
| --- | --- | --- | --- |
| Child **first name** | `child.name` | To personalize the story text (the `{{name}}` token is swapped for the child's name as the parent reads aloud). | First name only. No last name. |
| Reading preferences | `child.readingMode`, `child.readerFont`, `child.readerFontSize` | To set how the story is displayed (read to me vs can read, font, size). | Not identifying on their own. |
| Story progress | `ending_found` (child id, story id, page id, timestamp) | To show which story endings the child has discovered. | Gameplay state, tied to the child profile, not shared out. |

**We deliberately do NOT collect from the child:** birthdate or age, photos or
video, voice recordings, last name, home or email address, phone number,
gender or pronouns, precise location, contacts, or any free text the child
types about themselves. The only child identifier we store is a first name that
the **parent** enters.

**COPPA nuance worth understanding (LAWYER to confirm):** under the COPPA Rule,
a first name **on its own** is generally not treated as "personal information."
Personal information includes a *first and last name*, and it also includes
**persistent identifiers** (cookies, device identifiers, advertising identifiers)
when they are used to recognize a user over time or across services. That means
our real COPPA exposure comes less from the stored first name and more from the
**third party identifiers** created by analytics and advertising (see section 6).
Because we combine the child's first name with the parent account and with
those third party identifiers, we treat the whole child profile as covered by
COPPA and apply consent, access, and deletion rights to it.

### 2b. About the parent (the adult account holder)

The parent creates the account and is not a child, so this is ordinary adult
personal data, not child data. We still keep it lean.

| Data | Stored where | Why |
| --- | --- | --- |
| Parent **name** | `user.name` | Account display, greeting. |
| Parent **email** | `user.email` | Login identifier, password reset. |
| Password hash **or** social login token | `account` | Authentication (email/password, or Google/Apple sign in). We never store a raw password. |
| Session metadata: IP address, user agent | `session` | Keeping the parent signed in, security, and abuse and rate limiting on the auth endpoints. |
| Optional profile image | `user.image` | Only if a social provider returns one. |

Purchases (planned, via RevenueCat and the app store) are made by the **parent**
through their app store account. We do not handle or store card numbers.

---

## 3. Verifiable parental consent (VPC)

COPPA requires verifiable parental consent **before** we collect personal
information from a child, with limited exceptions.

How this maps to Bedtime Quests:

- **The person entering the child's first name is the parent**, from inside an
  authenticated adult account. The child never types their own information into
  a sign up form. This is a strong, favorable fact, but on its own it is **not**
  a substitute for a documented VPC method. **LAWYER** to confirm which VPC
  method we rely on.
- Common VPC methods the FTC recognizes include: a signed consent form, a small
  credit or debit card transaction, a phone or video call, or checking a
  government ID. There is also the **"email plus"** method, which is allowed
  only when the personal information is used purely for internal purposes and is
  not disclosed to third parties.
- **Important interaction with our ad and analytics plans:** the "email plus"
  lighter method is generally **not** available once you share personal
  information (including persistent identifiers) with third parties such as ad
  networks or analytics. If we serve ads or run analytics that create
  identifiers tied to the child, we likely need a **stronger** VPC method.
  **LAWYER** to decide.
- **Consent must be revocable.** A parent can withdraw consent at any time,
  after which we must stop collecting from that child and delete the child's
  data on request (see section 5).

**Action:** pick and document a concrete VPC mechanism before enabling ads or
analytics in production. Until then, keep third party data flows off or in a
non identifying configuration.

---

## 4. The parental gate (tracked separately as #32)

A **parental gate** is a simple challenge that a young child is unlikely to
pass (for example, "hold two fingers here for three seconds" or a simple
arithmetic prompt) placed in front of any action that should be taken by an
adult. It is a well established pattern for kids apps and is expected by both
Apple and Google for child directed apps.

Where Bedtime Quests must put a parental gate:

- Before starting a purchase or managing a subscription.
- Before leaving the app to an external link (store listing, social, support).
- Before reaching account settings, billing, or the privacy and data controls.
- Before any flow that would collect or change personal information.

The parental gate is **not itself** verifiable parental consent; it is a
lighter "is an adult present" check. Both are needed. Implementation is tracked
in **issue #32** and is out of scope for this document, which only defines the
requirement.

---

## 5. Data retention and deletion

Principles:

- **Retain only as long as needed.** Child data exists to power the reading
  experience for that family. When it is no longer needed, delete it.
- **Parent controls deletion today.** The app already supports self serve
  account deletion (see `lib/auth.ts`, `deleteUser`). Deleting the parent
  `user` row **cascades** by foreign key to the child rows and to
  `ending_found`, so removing the account removes the child's first name and
  progress in the same operation. Sessions and accounts also cascade.
- **Per child deletion.** A parent should also be able to remove a single child
  profile without deleting their whole account. Deleting a `child` row cascades
  to that child's `ending_found` rows. **Action:** make sure the UI exposes a
  clear "remove this child" control that a parent can reach (behind the
  parental gate).
- **Backups and third parties.** Deletion must also propagate, within a
  reasonable window, to database backups and to any third party that received
  the data (analytics, ads, RevenueCat). **Action:** document the backup
  retention window and the deletion path for each third party. **LAWYER** to
  confirm the acceptable window.

**Action items:**
- [ ] Publish a plain language retention statement in the Privacy Policy.
- [ ] Confirm cascade deletes cover every table that holds child data (today:
      `child`, `ending_found`).
- [ ] Expose per child delete in the parent UI, behind the parental gate.
- [ ] Define backup retention and a third party deletion propagation process.

---

## 6. Third parties that receive data

This is our highest risk area under COPPA, because behavioral or interest based
advertising to children under 13, and persistent identifiers shared with third
parties, are exactly what COPPA restricts. Every third party below must be
configured in a **child directed / limited data** mode, or not used at all in
child facing surfaces.

### 6a. Advertising network (kid safe ads, planned)

- **Requirement:** **no behavioral or interest based advertising** to users who
  may be under 13. Ads must be **contextual only** (based on the content of the
  app, not on a profile of the user).
- The ad SDK must be told the traffic is child directed (for example, Google's
  "tag for child directed treatment" style flag), which disables personalized
  ads and limits identifier use.
- No passing of the child's first name or any profile to the ad network.
- **LAWYER / vendor review** to confirm the specific network supports a fully
  COPPA compliant, contextual only, child directed configuration, and that its
  contract reflects it.

### 6b. Analytics (child directed Google Analytics, planned)

- Analytics on a child directed property must be configured so it does **not**
  enable advertising features, ad personalization, or Google Signals, and does
  not use identifiers to build cross service profiles. IP anonymization and
  disabling data sharing for ads are expected.
- **Caution / LAWYER:** Google's own terms restrict using Google Analytics in
  connection with child directed content in some configurations. We must
  confirm that our intended setup is actually permitted by the vendor's terms,
  not only by COPPA, before shipping it. If it is not cleanly permitted,
  consider a privacy first, cookieless analytics alternative or aggregate only
  measurement.
- Prefer aggregate, non identifying metrics. Do not send the child's first name
  or profile to analytics.

### 6c. RevenueCat (subscriptions, planned)

- Purchases are initiated by the **parent** through the app store. RevenueCat
  receives purchase receipts and an app user identifier.
- **Requirement:** the app user identifier we send to RevenueCat must be a
  **random or parent scoped id**, never the child's name or a child identifier.
- Do not attach child attributes to RevenueCat. Keep the subscription tied to
  the adult account.

### 6d. Infrastructure processors (not advertising)

- **Neon (Postgres)** stores the data; **Resend** sends password reset email to
  the parent; the **host** serves the app. These are data processors acting on
  our behalf, not audiences for the child's data. Each should be covered by a
  data processing agreement. **LAWYER** to confirm agreements are in place.

---

## 7. Security

- Passwords are stored only as hashes; social logins use provider tokens.
- Auth endpoints have rate limiting to slow brute force and abuse
  (`lib/auth.ts`).
- Sessions are re read from the database on every request (no long lived cached
  cookie), so sign out and account deletion take effect immediately.
- **Action:** ensure transport is HTTPS in production, secrets are never in the
  repo, and access to the production database is restricted and logged.

---

## 8. Compliance checklist

Concrete actions the app must complete to comply:

**Notice and consent**
- [ ] Publish a COPPA aware Privacy Policy (see `docs/legal/privacy-policy.md`).
- [ ] Publish Terms of Service (see `docs/legal/terms-of-service.md`).
- [ ] Give parents **direct notice** of what we collect about the child, at the
      point the child profile is created.
- [ ] Choose, implement, and document a **verifiable parental consent** method
      appropriate to our data sharing (stronger if ads or analytics are on).
- [ ] Make consent **revocable**, and honor withdrawal by stopping collection
      and deleting on request.

**Data practices**
- [ ] Keep child collection to first name plus reading preferences and progress.
- [ ] Never collect child birthdate, photos, voice, location, or contact info.
- [ ] Provide parent access to, and deletion of, the child's data (account
      delete exists; add per child delete in the UI).
- [ ] Document data retention and a deletion propagation path to backups and
      third parties.

**Third parties**
- [ ] Configure the ad network for **contextual only**, child directed
      treatment; no behavioral ads; no child profile shared.
- [ ] Configure analytics with advertising features and ad personalization
      **off**; confirm the vendor's terms actually allow child directed use.
- [ ] Send RevenueCat a non identifying, parent scoped app user id only.
- [ ] Put data processing agreements in place with Neon, Resend, and the host.

**Gate and platform**
- [ ] Implement the **parental gate** (#32) in front of purchases, external
      links, and settings.
- [ ] Meet Apple App Store and Google Play kids category requirements when the
      native apps ship.

**Security**
- [ ] HTTPS everywhere, secrets out of the repo, restricted production DB access.

---

## 9. Open questions for counsel (LAWYER)

1. Which **verifiable parental consent** method do we adopt, given that we plan
   to run ads and analytics that may create persistent identifiers?
2. Is our intended **Google Analytics** configuration permitted by Google's own
   terms for child directed content, or should we switch analytics providers?
3. Does our chosen **ad network** contractually support a fully contextual,
   child directed, COPPA compliant mode?
4. What **retention window** is acceptable for backups and third party copies of
   child data after a deletion request?
5. Do we need to address **other regimes** beyond COPPA (for example UK Age
   Appropriate Design Code, EU GDPR and GDPR-K, California, or state level kids
   codes) based on where we distribute?
6. Is a **first name alone**, as we store it, treated as personal information in
   each market we target, and does that change our consent obligations?

---

*End of review. Keep this file updated as the data model, third parties, or
distribution regions change.*

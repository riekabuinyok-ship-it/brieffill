export default function ReferralTerms() {
  return (
    <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop pt-20 md:pt-24 pb-stack-lg">
      <h1 className="font-headline-lg text-headline-lg mb-stack-sm text-on-background">Referral Program Terms</h1>
      <p className="mb-stack-md text-on-surface-variant">Last updated: today.</p>

      <section className="mb-stack-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
        <h2 className="mb-stack-sm font-headline-md text-headline-md text-on-background">1. The reward</h2>
        <p className="text-on-surface">
          When a friend signs up using your unique referral link and then activates a paid BriefFill plan (Pro, Team, or Agency),
          you receive <strong>$10 in account credit</strong> and your friend receives <strong>1 month free on the Pro plan</strong> (credited to their first paid invoice).
        </p>
        <p className="mt-stack-sm text-on-surface">
          Credit is automatically applied to your next renewal invoice. It cannot be redeemed for cash, transferred to another account, or combined with other promotional offers.
        </p>
      </section>

      <section className="mb-stack-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
        <h2 className="mb-stack-sm font-headline-md text-headline-md text-on-background">2. Eligibility</h2>
        <ul className="list-disc pl-5 text-on-surface space-y-1">
          <li>You must be a registered BriefFill user with a unique referral code.</li>
          <li>You are not eligible to receive referral credit on the Free plan; you must remain an active paid subscriber to redeem earned credit on a future renewal.</li>
          <li>The referred friend must be a new user who has never previously held a BriefFill account.</li>
        </ul>
      </section>

      <section className="mb-stack-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
        <h2 className="mb-stack-sm font-headline-md text-headline-md text-on-background">3. What counts as a "valid" referral</h2>
        <p className="text-on-surface">A referral becomes valid (and triggers rewards) when all of the following are true:</p>
        <ul className="mt-stack-sm list-disc pl-5 text-on-surface space-y-1">
          <li>The referred user signs up using your referral link (or enters your referral code at registration).</li>
          <li>The referred user has a different email address from you and is not on the same email domain (e.g. @yourcompany.com).</li>
          <li>The referred user is a real, unique individual — not a self-referral, alternate account, or fictitious user.</li>
          <li>The referred user activates a paid plan (Pro, Team, or Agency) within 12 months of signing up.</li>
        </ul>
        <p className="mt-stack-sm text-on-surface">
          Signups alone do not trigger a reward. The reward triggers only when the referred friend becomes a paying subscriber.
        </p>
      </section>

      <section className="mb-stack-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
        <h2 className="mb-stack-sm font-headline-md text-headline-md text-on-background">4. Anti-abuse rules</h2>
        <p className="text-on-surface">
          BriefFill actively monitors the referral program for abuse. The following are <strong>not allowed</strong> and will result in immediate disqualification of pending rewards and possible account suspension:
        </p>
        <ul className="mt-stack-sm list-disc pl-5 text-on-surface space-y-1">
          <li>Self-referral (signing up under your own referral link from a second account).</li>
          <li>Multiple accounts created by the same person to claim the same reward.</li>
          <li>Spam: posting your referral link in unrelated forums, comment sections, mass DMs, or unsolicited emails.</li>
          <li>Incentivizing signups with cash, gift cards, or other compensation (other than the official BriefFill reward).</li>
          <li>Bot-generated signups or any automated traffic attributable to your link.</li>
        </ul>
      </section>

      <section className="mb-stack-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
        <h2 className="mb-stack-sm font-headline-md text-headline-md text-on-background">5. Changes and termination</h2>
        <p className="text-on-surface">
          BriefFill may modify, pause, or terminate the referral program at any time with reasonable notice. Rewards already earned and credited before such a change will be honored.
        </p>
      </section>

      <section className="mb-stack-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
        <h2 className="mb-stack-sm font-headline-md text-headline-md text-on-background">6. Contact</h2>
        <p className="text-on-surface">
          Questions about the referral program? Email <a href="mailto:support@brieffill.com" className="text-primary hover:underline">support@brieffill.com</a>.
        </p>
      </section>
    </div>
  );
}

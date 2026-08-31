export default function HomePage() {
  return (
    <div>
      <section className="hero">
        <h2>Welcome, Cathedral School families!</h2>
        <p>
          This site is run by the Parents Association at the Cathedral School of St. John the
          Divine. Sign up to volunteer at events like spirit wear sales, Winterfest, and the
          Spring Fair, or submit a receipt for reimbursement of PA-related expenses.
        </p>
        <div className="hero-links">
          <a className="button" href="/volunteer">Find a Volunteer Slot</a>
          <a className="button" href="/reimbursement">Submit a Reimbursement</a>
        </div>
      </section>

      <div className="card">
        <h3>How volunteering works</h3>
        <p className="muted">
          Browse open slots below, add your name, and you're set. We'll email you a confirmation
          right away and a reminder the day before the event. Slots close automatically once
          they're full or the date has passed.
        </p>
      </div>

      <div className="card">
        <h3>Reimbursements</h3>
        <p className="muted">
          If you paid out of pocket for a PA activity, fill out the reimbursement form and attach
          a photo or PDF of your receipt. The PA treasurer reviews requests and will follow up by
          email.
        </p>
      </div>
    </div>
  );
}

import './globals.css';

export const metadata = {
  title: 'Cathedral School Parents Association',
  description: 'Volunteer sign-ups and reimbursement requests for the Cathedral School (St. John the Divine) Parents Association.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site">
          <div className="inner">
            <h1><a href="/">Cathedral School PA</a></h1>
            <nav>
              <a href="/volunteer">Volunteer</a>
              <a href="/reimbursement">Reimbursements</a>
              <a href="/admin">Admin</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}

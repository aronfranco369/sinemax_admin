import './globals.css';
import AppShell from '@/components/shell';

export const metadata = {
  title: 'SINEMAX Admin',
  description: 'Catalog administration for SINEMAX — movies, series, episodes and engagement.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

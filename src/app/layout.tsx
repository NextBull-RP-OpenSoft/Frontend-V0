import Providers from './providers';
import '../index.css';
import '../App.css';

export const metadata = {
  title: 'SyntheticBull — Trading Terminal',
  description: 'Professional stock trading terminal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

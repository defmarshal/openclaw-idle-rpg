import './globals.css';

export const metadata = {
  title: 'OpenClaw Idle RPG',
  description: 'Manage agents, gather resources, survive crises!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

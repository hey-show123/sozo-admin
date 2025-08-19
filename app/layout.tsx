import './globals.css'

export const metadata = {
  title: 'SOZO Admin',
  description: 'Admin panel for SOZO language learning app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
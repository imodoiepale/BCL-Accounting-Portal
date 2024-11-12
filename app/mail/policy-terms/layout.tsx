

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Legal Documents - Booksmart Consultancy',
  description: 'Privacy Policy and Terms of Service for Booksmart Consultancy Limited',
}

export default function PolicyTermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  )
}
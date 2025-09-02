import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Likho: Realistic computer-generated handwriting',
  description: 'Realistic handwriting generator. Convert text to handwriting using an in-browser recurrent neural network. Choose from various print and cursive styles. Customize the outputs and download as SVG.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-US">
      <head>
        <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'Open Sans, sans-serif', color: '#50555a', overscrollBehavior: 'none' }}>
        {children}
      </body>
    </html>
  )
}


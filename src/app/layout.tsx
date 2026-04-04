import type { Metadata } from 'next'
import {
  Inter,
  Space_Grotesk,
  Playfair_Display,
  Sofia_Sans_Condensed,
  Cutive_Mono,
  Space_Mono,
} from 'next/font/google'
import './globals.css'
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider'
import { SceneContextProvider } from '@/components/providers/SceneContext'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
})

const sofiaCondensed = Sofia_Sans_Condensed({
  variable: '--font-sofia-condensed',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

const cutiveMono = Cutive_Mono({
  variable: '--font-cutive-mono',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Observatory',
  description:
    'An immersive multi-dimensional portfolio — navigate through realms of creative work.',
}

const fontVariables = [
  inter.variable,
  spaceGrotesk.variable,
  playfair.variable,
  sofiaCondensed.variable,
  cutiveMono.variable,
  spaceMono.variable,
].join(' ')

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="antialiased">
        <SceneContextProvider>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </SceneContextProvider>
      </body>
    </html>
  )
}

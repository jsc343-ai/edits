import type React from "react";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppWrapper } from "@/components/app-wrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Made with App Studio",
  description: "AI 3D motion editing for photos and short videos",
    generator: 'v0.app'
};

export const viewport: Viewport = {
  themeColor: "#2f7fd1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="bg-background">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&family=Noto+Serif+TC:wght@700&family=ZCOOL+KuaiLe&family=ZCOOL+XiaoWei&family=Ma+Shan+Zheng&family=Long+Cang&family=Zhi+Mang+Xing&family=Liu+Jian+Mao+Cao&family=Pacifico&family=Dancing+Script:wght@700&family=Lobster&family=Playfair+Display:wght@700&family=Bebas+Neue&family=Permanent+Marker&family=ZCOOL+QingKe+HuangYou&family=Kaisei+Tokumin&family=Yusei+Magic&family=Dela+Gothic+One&family=Hachi+Maru+Pop&family=Reggae+One&family=Mochiy+Pop+One&family=DotGothic16&family=Caveat&family=Satisfy&family=Great+Vibes&family=Sacramento&family=Abril+Fatface&family=Bangers&family=Fredoka&family=Righteous&family=Orbitron&family=Press+Start+2P&family=Cinzel&family=Special+Elite&family=Shadows+Into+Light&family=Indie+Flower&family=Amatic+SC&family=Monoton&family=Rubik+Mono+One&family=Oswald&family=Anton&family=Archivo+Black&family=Comfortaa&family=Courgette&family=Kaushan+Script&family=Gloria+Hallelujah&family=Creepster&family=Fascinate&family=Cherry+Bomb+One&display=swap"
        />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}

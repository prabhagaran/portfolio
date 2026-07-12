"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

/** Classic-mode chrome; the 3D modes bring their own HUDs instead. */
const isImmersive = (pathname: string) =>
  pathname.startsWith("/city") || pathname.startsWith("/f1");

export function ChromeNavbar() {
  const pathname = usePathname();
  if (isImmersive(pathname)) return null;
  return <Navbar />;
}

export function ChromeFooter() {
  const pathname = usePathname();
  if (isImmersive(pathname)) return null;
  return <Footer />;
}

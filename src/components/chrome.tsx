"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

/** Classic-mode chrome; Electronic City brings its own HUD instead. */
export function ChromeNavbar() {
  const pathname = usePathname();
  if (pathname.startsWith("/city")) return null;
  return <Navbar />;
}

export function ChromeFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/city")) return null;
  return <Footer />;
}

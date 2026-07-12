import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 3D modes are non-canonical duplicates of the classic homepage content.
        disallow: ["/city", "/f1"],
      },
    ],
    sitemap: `${site.siteUrl}/sitemap.xml`,
  };
}

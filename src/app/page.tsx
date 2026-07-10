import { Suspense } from "react";
import { ModeGate } from "@/components/mode-gate";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Projects } from "@/components/sections/projects";
import { TechStack } from "@/components/sections/tech-stack";
import { Skills } from "@/components/sections/skills";
import { GitHub } from "@/components/sections/github";
import { ExperienceSection } from "@/components/sections/experience";
import { Certifications } from "@/components/sections/certifications";
import { Workflow } from "@/components/sections/workflow";
import { Blog } from "@/components/sections/blog";
import { Contact } from "@/components/sections/contact";
import { getAllPosts } from "@/lib/blog";

export default function Home() {
  const posts = getAllPosts();

  return (
    <main>
      <Suspense fallback={null}>
        <ModeGate />
      </Suspense>
      <Hero />
      <About />
      <div className="border-t border-line">
        <Projects />
      </div>
      <div className="border-t border-line">
        <TechStack />
      </div>
      <div className="border-t border-line">
        <Skills />
      </div>
      <div className="border-t border-line">
        <GitHub />
      </div>
      <div className="border-t border-line">
        <ExperienceSection />
      </div>
      <div className="border-t border-line">
        <Certifications />
      </div>
      <div className="border-t border-line">
        <Workflow />
      </div>
      <div className="border-t border-line">
        <Blog posts={posts} />
      </div>
      <div className="border-t border-line">
        <Contact />
      </div>
    </main>
  );
}

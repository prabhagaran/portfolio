"use client";

import {
  ClipboardList,
  Boxes,
  PenTool,
  Layers,
  Code2,
  FlaskConical,
  ShieldCheck,
  Factory,
} from "lucide-react";
import { Section } from "@/components/section";
import { Stagger, StaggerItem } from "@/components/motion";

const steps = [
  { name: "Requirements", icon: ClipboardList, detail: "Specs, constraints, standards" },
  { name: "Architecture", icon: Boxes, detail: "Partitioning, interfaces, budgets" },
  { name: "Schematic", icon: PenTool, detail: "Circuit design & review" },
  { name: "PCB Layout", icon: Layers, detail: "Stackup, routing, DFM" },
  { name: "Firmware", icon: Code2, detail: "Drivers, logic, safety states" },
  { name: "Validation", icon: FlaskConical, detail: "Bring-up, measurements" },
  { name: "Testing", icon: ShieldCheck, detail: "EMC, environmental, HIL" },
  { name: "Production", icon: Factory, detail: "EOL test, traceability" },
];

export function Workflow() {
  return (
    <Section
      id="workflow"
      eyebrow="08 · Engineering Workflow"
      title="From requirement to production"
      description="The same disciplined loop on every board — each stage gates the next, and nothing ships without data."
    >
      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 lg:gap-0">
        {steps.map((step, i) => (
          <StaggerItem key={step.name} className="relative lg:px-1.5">
            <div className="group relative flex h-full flex-col items-center rounded-card border border-line bg-surface p-4 text-center shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50">
              <span className="font-mono text-[10px] text-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <step.icon
                className="mt-2 h-5 w-5 text-accent transition-colors duration-200 group-hover:text-emerald"
                aria-hidden="true"
              />
              <p className="mt-2.5 text-xs font-semibold text-slate-100">{step.name}</p>
              <p className="mt-1 text-[11px] leading-snug text-faint">{step.detail}</p>
            </div>
            {/* connector — desktop only, animated dashes */}
            {i < steps.length - 1 && (
              <svg
                className="absolute -right-[7px] top-1/2 z-10 hidden h-2 w-3.5 -translate-y-1/2 lg:block"
                viewBox="0 0 14 8"
                aria-hidden="true"
              >
                <path
                  d="M 0 4 H 14"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  className="animate-flow"
                />
              </svg>
            )}
          </StaggerItem>
        ))}
      </Stagger>
      <p className="mt-6 text-center font-mono text-xs text-faint">
        signal flows left → right · every gate has an exit criterion
      </p>
    </Section>
  );
}

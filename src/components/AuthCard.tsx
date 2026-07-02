import { ReactNode } from "react";
import { Logo } from "./Logo";
import { CheckCircle2, Shield, Zap, Users, Clock, Award, Lock } from "lucide-react";

export function AuthCard({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen grid lg:grid-cols-2 bg-background ${className}`}>
      {/* Left side - Form */}
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="flex flex-col items-center mb-8">
              <Logo className="h-28 w-auto" animate />
            </div>
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div
        className="hidden lg:flex relative overflow-hidden flex-col"
        style={{ background: "linear-gradient(160deg, #0f2167 0%, #1a3a9f 40%, #1e56d9 100%)" }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.07)_1px,transparent_0)] [background-size:32px_32px]" />

        {/* Glow blobs */}
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

        <div className="relative flex h-full flex-col justify-between p-14 text-white">
          {/* Top */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-blue-300 rounded-full" />
              <span className="text-xs uppercase tracking-[0.2em] text-blue-200 font-medium">
                Computer Science Department · Ho Technical University
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-3">Student Dues Portal</h2>
            <p className="text-sm text-blue-200/80 max-w-xs">
              A secure, fast, and modern platform for managing your departmental dues.
            </p>
          </div>

          {/* Middle */}
          <div className="space-y-6">
            {/* Quote card */}
            <div className="relative bg-white/8 backdrop-blur-sm rounded-2xl p-7 border border-white/10 shadow-lg">
              <div className="absolute -top-3 left-6 text-5xl text-blue-300/50 font-serif leading-none select-none">"</div>
              <p className="text-base font-medium leading-relaxed text-white/90 mt-3">
                Paying my departmental dues took less than 10 seconds. The system is fast, simple, and completely secure.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xs font-bold shadow">
                  CS
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Compssa Student</p>
                  <p className="text-xs text-blue-200/70">HTU · Level 300</p>
                </div>
              </div>
            </div>

            {/* Feature list */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Zap, label: "Instant Payments", desc: "Processed in seconds" },
                { icon: Shield, label: "PCI-DSS Secure", desc: "Bank-level encryption" },
                { icon: CheckCircle2, label: "Auto Receipts", desc: "Generated instantly" },
                { icon: Clock, label: "24/7 Access", desc: "Anytime, anywhere" },
                { icon: Lock, label: "Data Privacy", desc: "Your data is safe" },
                { icon: Users, label: "2,400+ Students", desc: "Already onboarded" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/8">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/30">
                    <Icon className="h-4 w-4 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{label}</p>
                    <p className="text-[10px] text-blue-200/60 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          {/* <div className="space-y-4">
            <div className="h-px bg-white/10 w-full" />
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Users, value: "2.4k+", label: "Students" },
                { icon: Zap, value: "99.9%", label: "Uptime" },
                { icon: Award, value: "PCI", label: "Certified" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="rounded-xl bg-white/8 backdrop-blur p-4 border border-white/10">
                  <Icon className="h-4 w-4 opacity-60 mx-auto mb-1.5" />
                  <div className="text-xl font-bold">{value}</div>
                  <div className="text-[10px] text-blue-200/70 mt-0.5 uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>
            
          </div> */}

         <p className="text-center text-[10px] text-white/60 tracking-wide">
              © {new Date().getFullYear()} Computer Science Department, Ho Technical University · Secured by Paystack · All rights reserved
            </p>
        </div>
      </div>
    </div>
  );
}
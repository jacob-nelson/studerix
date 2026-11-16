import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-sidebar px-12 py-12 text-sidebar-foreground lg:flex">
        <div>
          <p className="font-heading text-3xl">Tech Masters</p>
          <p className="mt-2 max-w-sm text-sm text-sidebar-foreground/70">
            Academy desk for enquiries, fees and placements. One student record, carried
            from the first conversation through to a joining.
          </p>
        </div>
        <ol className="grid max-w-sm gap-4 text-sm">
          {[
            ["01", "Enquiry", "Name, source, course and the next follow-up."],
            ["02", "Admission", "Joined students keep their record. Fees add up on their own."],
            ["03", "Placement", "Testing students become eligible without typing them again."],
          ].map(([step, title, copy]) => (
            <li key={step} className="grid grid-cols-[auto_1fr] gap-3">
              <span className="font-heading text-sidebar-primary">{step}</span>
              <span>
                <span className="block font-medium">{title}</span>
                <span className="text-sidebar-foreground/70">{copy}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-sidebar-foreground/60">
          Thankam Towers, Pattoor, Thiruvananthapuram
        </p>
      </section>
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mb-8 lg:hidden">
          <p className="font-heading text-2xl">Tech Masters</p>
          <p className="text-sm text-muted-foreground">Academy desk</p>
        </div>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}

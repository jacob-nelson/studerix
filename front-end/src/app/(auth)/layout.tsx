import { AuthShell } from "@/components/auth-shell";
import { RedirectIfSignedIn } from "@/components/redirect-if-signed-in";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthShell>
      <RedirectIfSignedIn />
      {children}
    </AuthShell>
  );
}

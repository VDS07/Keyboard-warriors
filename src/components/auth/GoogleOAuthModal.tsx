import { UserRole } from "@/context/SearchContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock, Sparkles, Building2, User } from "lucide-react";
import { GoogleSignInButton } from "./GoogleSignInButton";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultRole?: UserRole;
};

export function GoogleOAuthModal({ open, onClose, onSuccess, defaultRole = "seeker" }: Props) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl text-white">
        
        {/* Google OAuth Top Bar */}
        <div className="bg-zinc-900/90 px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Official Google 4-Color G Logo */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-200">Google Identity Services</span>
              <span className="text-[10px] text-zinc-500 font-mono">Official OAuth 2.0 SSO</span>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Cryptographically Verified</span>
          </Badge>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-1.5">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Sign in with your Google Account
            </h3>
            <p className="text-xs text-zinc-400">
              Continue to <span className="font-semibold text-purple-300">Commute Buddy</span> with secure single sign-on
            </p>
          </div>

          {/* Active Role Indicator */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <div className="flex items-center gap-2">
              {defaultRole === "owner" ? (
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div>
                <p className="font-medium text-white text-xs">
                  {defaultRole === "owner" ? "Property Owner (Landlord)" : "Home Seeker (Commuter)"}
                </p>
                <p className="text-[10px] text-zinc-400">Selected workspace role</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] text-zinc-300 border-white/10 uppercase">
              {defaultRole}
            </Badge>
          </div>

          {/* Real Google Identity Services Button */}
          <div className="py-2 flex justify-center">
            <GoogleSignInButton
              role={defaultRole}
              text="continue_with"
              theme="outline"
              width={340}
              onSuccess={() => {
                onClose();
                onSuccess?.();
              }}
            />
          </div>

          {/* Security & Scopes Disclosure */}
          <div className="pt-3 border-t border-white/10 space-y-2 text-[11px] text-zinc-400">
            <div className="flex items-start gap-2 text-zinc-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                Tokens are cryptographically verified on our backend using Google's public key infrastructure. Your Google password is never requested or stored.
              </p>
            </div>
            <p className="text-[10px] text-zinc-500 text-center">
              By continuing, Google shares your verified name, email address, and profile picture with Commute Buddy.
            </p>
          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useRef, useState } from "react";
import { useSearch, UserRole } from "@/context/SearchContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldAlert, ExternalLink, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number | string;
              locale?: string;
            }
          ) => void;
          prompt?: (notification?: (notification: any) => void) => void;
          cancel?: () => void;
        };
      };
    };
  }
}

type Props = {
  role?: UserRole;
  text?: "signin_with" | "signup_with" | "continue_with";
  theme?: "outline" | "filled_blue" | "filled_black";
  width?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
};

export function GoogleSignInButton({
  role = "seeker",
  text = "continue_with",
  theme = "outline",
  width = 360,
  onSuccess,
  onError,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { loginWithSession } = useSearch();

  const [isLoading, setIsLoading] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);

  const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const isPlaceholder =
    !rawClientId ||
    rawClientId.includes("YOUR_GOOGLE_CLIENT_ID") ||
    rawClientId === "";

  // 1. Wait for Google Identity Services script to be available on window
  useEffect(() => {
    if (isPlaceholder) {
      setIsConfigured(false);
    }

    const checkGis = () => {
      if (window.google?.accounts?.id) {
        setGisLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGis()) return;

    const interval = setInterval(() => {
      if (checkGis()) {
        clearInterval(interval);
      }
    }, 150);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isPlaceholder]);

  // 2. Initialize and render the official Google Identity Services button
  useEffect(() => {
    if (!gisLoaded || !containerRef.current || isPlaceholder) return;

    try {
      window.google!.accounts.id.initialize({
        client_id: rawClientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear any previous rendered button inside container
      containerRef.current.innerHTML = "";

      window.google!.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme,
        size: "large",
        text,
        shape: "rectangular",
        logo_alignment: "left",
        width,
      });
    } catch (err) {
      console.error("Failed to render Google Identity Services button:", err);
    }
  }, [gisLoaded, rawClientId, theme, text, width, isPlaceholder, role]);

  /**
   * 3. Handle Google ID Token Credential from Google Identity Services
   * Exchanges the Google ID token with the Express backend for cryptographic verification
   */
  const handleCredentialResponse = async (response: { credential: string }) => {
    if (!response.credential) {
      toast.error("Google login cancelled or token missing.");
      onError?.("Missing Google credential");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: response.credential,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.message || data.error || "Google authentication failed";
        console.error("Backend Google Auth Error:", errorMsg);
        toast.error(errorMsg);
        onError?.(errorMsg);
        setIsLoading(false);
        return;
      }

      // Successful verification & session creation!
      // data contains: { success: true, token: string, user: UserProfile }
      loginWithSession(data.token, data.user);

      toast.success(`Welcome to Commute Buddy, ${data.user.name}!`);

      if (onSuccess) {
        onSuccess();
      } else {
        if (data.user.role === "owner") {
          navigate("/owner", { replace: true });
        } else {
          navigate("/map", { replace: true });
        }
      }
    } catch (networkErr: any) {
      console.error("Network error during Google authentication:", networkErr);
      toast.error("Backend server unavailable. Please ensure server is running on port 3001.");
      onError?.(networkErr.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center w-full ${className}`}>
      {/* Loading overlay during backend verification */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm rounded-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>Verifying Google token with server...</span>
          </div>
        </div>
      )}

      {/* Official Google Identity Services Button Container */}
      {!isPlaceholder ? (
        <div
          ref={containerRef}
          className="min-h-[44px] flex items-center justify-center transition-all overflow-hidden rounded-xl"
        />
      ) : (
        /* Helpful developer notice when VITE_GOOGLE_CLIENT_ID is not configured yet */
        <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-white">Google Client ID Setup Required</p>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                Add your Google Cloud OAuth Client ID to <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-[10px]">.env</code> (or Vercel Environment Variables):
              </p>
              <pre className="bg-black/50 p-2 rounded-lg text-[10px] font-mono text-zinc-300 overflow-x-auto select-all">
                VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com{"\n"}
                GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
              </pre>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 text-[10px]">
            <span className="text-zinc-400">
              Authorized Origin: {typeof window !== "undefined" ? window.location.origin : "http://localhost:8080"}
            </span>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-purple-400 hover:text-purple-300 underline font-medium"
            >
              Google Cloud Console <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

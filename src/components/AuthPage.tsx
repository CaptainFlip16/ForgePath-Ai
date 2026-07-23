import React, { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { 
  Compass, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  Copy,
  Compass as GoogleIcon
} from "lucide-react";

interface AuthPageProps {
  onBackToHome: () => void;
  onAuthSuccess: (hasCompletedOnboarding: boolean) => void;
}

export function AuthPage({ onBackToHome, onAuthSuccess }: AuthPageProps) {
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsUnauthorizedDomain(false);

    // Basic Validations
    if (!email || !password) {
      setError("Please fill out all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (isSignUp) {
      if (!fullName) {
        setError("Please enter your full name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, fullName);
        setSuccess("Account successfully created! Please sign in with your credentials.");
        setIsSignUp(false); // Switch to Sign In view immediately!
        setPassword("");
        setConfirmPassword("");
      } else {
        await signInWithEmail(email, password);
        onAuthSuccess(false); // We will evaluate real status in App.tsx and enter homepage/dashboard immediately
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "An authentication error occurred. Please try again.";
      if (err.code === "auth/unauthorized-domain" || err.message?.includes("unauthorized-domain") || err.message?.includes("auth/unauthorized-domain")) {
        setIsUnauthorizedDomain(true);
        errMsg = "Unauthorized Domain: This hosting domain is not authorized in your Firebase console.";
      } else if (err.code === "auth/invalid-credential") {
        errMsg = "Invalid email or password. Please verify your credentials.";
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = "An account with this email already exists.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "The password is too weak. Please choose a stronger password.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Please enter a valid email address.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setSuccess(null);
    setIsUnauthorizedDomain(false);
    setLoading(true);
    try {
      await signInWithGoogle();
      if (isSignUp) {
        setSuccess("Google account registered successfully! Please sign in.");
        setIsSignUp(false); // Take to sign-in page immediately!
      } else {
        onAuthSuccess(false); // Go to homepage/dashboard immediately!
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      let errMsg = err.message || "Google authentication failed.";
      if (err.code === "auth/unauthorized-domain" || err.message?.includes("unauthorized-domain") || err.message?.includes("auth/unauthorized-domain")) {
        setIsUnauthorizedDomain(true);
        errMsg = "Unauthorized Domain: This hosting domain is not authorized in your Firebase console.";
      } else if (err.code === "auth/popup-closed-by-user" || err.message?.includes("popup-closed-by-user") || err.code === "auth/cancelled-popup-request" || err.message?.includes("cancelled-popup-request") || err.code === "auth/popup-blocked") {
        errMsg = "Google sign-in popup closed or was blocked by browser iframe security. Please use Email & Password Sign In below or click 'Open App in New Tab' to sign in with Google in a standalone tab.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex-grow flex items-center justify-center px-4 py-16 md:py-24">
      <div className="w-full max-w-md">
        
        {/* Logo and Greeting */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3 cursor-pointer" onClick={onBackToHome}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <Compass className="text-white w-5 h-5 animate-spin-slow" />
            </div>
            <span className="font-sans font-bold text-xl tracking-tight text-white">ForgePath AI</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            {isSignUp ? "Forge Your Account" : "Access Your Workspace"}
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
            {isSignUp 
              ? "Synthesize structural career paths and build production-grade portfolios with active AI mentoring."
              : "Welcome back. Initialize your active learning pipelines and continue your curriculum milestones."
            }
          </p>
        </div>

        {/* Authentication Card */}
        <div className="glass-panel border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden bg-[#0c111d]/90">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
          
          {/* Error Banner */}
          {error && !isUnauthorizedDomain && (
            <div className="mb-5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-xs flex gap-2.5 items-start">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Unauthorized Domain Guide Box */}
          {isUnauthorizedDomain && (
            <div className="mb-5 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs flex flex-col gap-3 backdrop-blur-sm shadow-xl">
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-200">Whitelist This Domain in Firebase</p>
                  <p className="text-rose-200/80 leading-relaxed mt-1">
                    Firebase Authentication restricts authorization request sources. You must whitelist your current preview domain in your Firebase console.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 bg-[#070b13] border border-white/5 rounded-lg p-2.5 mt-1 font-mono">
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-outline">TARGET HOSTNAME:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.hostname);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 text-primary hover:text-white transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>COPY HOSTNAME</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-white truncate select-all">{window.location.hostname}</div>
              </div>

              <div className="text-[11px] text-on-surface-variant/90 leading-relaxed">
                <p className="font-bold text-white mb-1.5">Whitelist Instructions:</p>
                <ol className="list-decimal pl-4 space-y-1 text-on-surface-variant/80">
                  <li>Open the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-[#8083ff] hover:underline font-bold">Firebase Console</a></li>
                  <li>Go to <span className="text-white font-medium">Authentication</span> &gt; <span className="text-white font-medium">Settings</span> tab</li>
                  <li>Click <span className="text-white font-medium">Authorized Domains</span> in the side/list options</li>
                  <li>Click <span className="text-white font-medium">Add domain</span> and paste the hostname above</li>
                  <li>Refresh this page and re-initiate login!</li>
                </ol>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="mb-5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 text-xs flex gap-2.5 items-start">
              <CheckCircle className="w-4.5 h-4.5 shrink-0 text-emerald-400 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-primary uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Smith"
                    disabled={loading}
                    className="w-full bg-[#070b13] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-sans"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] text-primary uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@forgepath.ai"
                  disabled={loading}
                  className="w-full bg-[#070b13] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-sans"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] text-primary uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full bg-[#070b13] border border-white/5 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-primary uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full bg-[#070b13] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-sans"
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none border border-indigo-400/30"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isSignUp ? "Create Workspace Account" : "Authorize and Enter"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-grow h-[1px] bg-white/5"></div>
            <span className="font-mono text-[8px] text-on-surface-variant/50 uppercase tracking-widest shrink-0">Or proceed with</span>
            <div className="flex-grow h-[1px] bg-white/5"></div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 text-white rounded-xl py-3 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {/* Real SVG Google Icon */}
            <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          {/* Switch link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="text-xs text-on-surface-variant hover:text-white font-medium transition-colors cursor-pointer flex items-center gap-1.5 mx-auto"
            >
              {isSignUp ? (
                <>
                  Already registered? <span className="text-primary hover:underline">Access Workspace</span>
                </>
              ) : (
                <>
                  New developer? <span className="text-secondary hover:underline">Forge an account</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Back navigation footer link */}
        <div className="text-center mt-6">
          <button 
            onClick={onBackToHome}
            className="text-on-surface-variant/60 hover:text-on-surface text-xs font-bold tracking-wider uppercase inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            ← Return to Landing Overview
          </button>
        </div>

      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function AuthContent() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const { toast } = useToast();

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "signup") setMode("signup");
    else if (type === "login") setMode("login");
  }, [searchParams]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: fullName });
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          fullName,
          email,
          phoneNumber,
          createdAt: serverTimestamp(),
        });
      }
      router.push(redirect);
    } catch (error: any) {
      toast({
        title: mode === "login" ? "Login Failed" : "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Always ensure a document exists in Firestore for the user
      const userDoc = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDoc);
      
      if (!docSnap.exists() || mode === "signup") {
        await setDoc(userDoc, {
          uid: user.uid,
          fullName: user.displayName || "Google User",
          email: user.email,
          createdAt: serverTimestamp(),
        }, { merge: true });
      }
      
      router.push(redirect);
    } catch (error: any) {
      toast({
        title: "Google Auth Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white border border-slate-100 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row min-h-[650px]">
        {/* Left Column: System Info */}
        <div className="w-full md:w-5/12 bg-slate-50 p-8 md:p-12 flex flex-col">
          <div className="mb-12">
            <Link href="/" className="group inline-flex items-center text-sm font-medium text-slate-500 hover:text-black transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to home
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-3xl font-bold tracking-tight text-slate-900">ID Recovery System</span>
              </Link>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p className="text-lg">
                  We insist this is good will. Our mission is to bridge the gap between lost identification and their rightful owners through a secure and transparent process.
                </p>
                <p className="text-lg">
                  We do not distort people's money but assist a friend in need. We believe in the power of community and integrity to help individuals regain their essential documents safely.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-12">
            <p className="text-sm text-slate-400">
              © 2026 IRS. All rights reserved.
            </p>
          </div>
        </div>
        
        {/* Right Column: Auth Options */}
        <div className="w-full md:w-7/12 p-8 md:p-16 flex flex-col justify-center bg-white transition-all duration-300">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900">
                {mode === "login" ? "Welcome back" : "Create an account"}
              </h2>
              <p className="text-slate-500 mt-2">
                {mode === "login" 
                  ? "Enter your credentials to access your account" 
                  : "Join IRS today and help reconnect people with their IDs"}
              </p>
            </div>

            <div className="space-y-6">
              <Button 
                variant="outline" 
                className="w-full h-14 rounded-2xl border-slate-200 font-medium text-base hover:bg-slate-50 transition-colors" 
                onClick={handleGoogleAuth}
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {mode === "login" ? "Continue with Google" : "Sign up with Google"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-slate-400 font-medium">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === "signup" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-slate-700 font-medium ml-1">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-14 rounded-2xl border-slate-200 focus:ring-black focus:border-black px-5"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-slate-700 font-medium ml-1">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        placeholder="+254..."
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="h-14 rounded-2xl border-slate-200 focus:ring-black focus:border-black px-5"
                        required
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium ml-1">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 rounded-2xl border-slate-200 focus:ring-black focus:border-black px-5"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" title="Password" className="text-slate-700 font-medium">Password</Label>
                    {mode === "login" && (
                      <Link href="#" className="text-sm font-medium text-slate-500 hover:text-black transition-colors">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 rounded-2xl border-slate-200 focus:ring-black focus:border-black px-5"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl text-base font-semibold bg-black text-white hover:bg-slate-800 transition-all shadow-lg shadow-black/5 mt-2" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {mode === "login" ? "Logging in..." : "Creating account..."}
                    </>
                  ) : (
                    mode === "login" ? "Log in" : "Create account"
                  )}
                </Button>
              </form>

              <div className="pt-6 text-center">
                <p className="text-slate-600">
                  {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="font-bold text-black hover:underline underline-offset-4"
                  >
                    {mode === "login" ? "Sign up for free" : "Log in"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}

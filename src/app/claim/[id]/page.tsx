"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, use } from "react";
import { doc, getDoc, addDoc, collection, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FoundId } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, Phone, Mail, User, MapPin, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ClaimIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [foundId, setFoundId] = useState<FoundId | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchIdDetails = async () => {
      try {
        const docRef = doc(db, "found_ids", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFoundId({ id: docSnap.id, ...docSnap.data() } as FoundId);
          // Check if already claimed by this user
          if (docSnap.data().status === "owner_found" || docSnap.data().status === "recovered") {
            // In a real app, we'd verify if the current user is the one who claimed it
            // For MVP, we'll just show the details if the status is owner_found
            setClaimed(true);
          }
        } else {
          toast({
            title: "Not Found",
            description: "The ID record you are looking for does not exist.",
            variant: "destructive",
          });
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching ID details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchIdDetails();
  }, [id, router, toast]);

  const handleClaim = async () => {
    if (!user || !foundId) return;
    setClaiming(true);
    try {
      // 1. Create claim record
      await addDoc(collection(db, "claims"), {
        foundIdId: foundId.id,
        claimerUid: user.uid,
        createdAt: serverTimestamp(),
      });

      // 2. Update found_id status
      await updateDoc(doc(db, "found_ids", foundId.id), {
        status: "owner_found",
        claimedBy: user.uid,
        claimedAt: serverTimestamp()
      });

      setClaimed(true);
      toast({
        title: "Ownership Claimed",
        description: "You have successfully claimed this ID. You can now see the finder's contact details.",
      });
    } catch (error: any) {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!foundId) return null;

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Verify Ownership</h1>
          <p className="text-slate-500 mt-2">Please confirm if this is your lost ID card.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle>Found ID Details</CardTitle>
              <CardDescription>Matching details from our database</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</p>
                  <p className="text-lg font-medium text-slate-900">{foundId.fullName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">ID Number</p>
                  <p className="text-lg font-medium text-slate-900">********{foundId.idNumber.slice(-3)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Found Location</p>
                  <div className="flex items-center gap-1 text-slate-600">
                    <MapPin className="h-4 w-4" />
                    <span>{foundId.foundLocation}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            {!claimed && (
              <CardFooter className="bg-slate-50/30 border-t border-slate-100 py-6">
                <div className="w-full space-y-4">
                  <div className="flex items-start gap-3 text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-100">
                    <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
                    <p>By clicking "Yes, this is my ID", you are claiming ownership of this document. Misuse of this system may lead to account suspension.</p>
                  </div>
                  <Button 
                    onClick={handleClaim} 
                    className="w-full h-12 rounded-xl text-base font-medium" 
                    disabled={claiming}
                  >
                    {claiming ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Yes, this is my ID"
                    )}
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>

          <AnimatePresence>
            {claimed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-green-50 border border-green-100 rounded-2xl p-6 flex items-center gap-4 text-green-800">
                  <CheckCircle2 className="h-6 w-6 shrink-0" />
                  <div>
                    <p className="font-semibold">Verification Successful!</p>
                    <p className="text-sm opacity-90">The finder's contact details are now revealed below. Please reach out to them to coordinate the recovery.</p>
                  </div>
                </div>

                <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white ring-2 ring-black ring-offset-2">
                  <CardHeader className="bg-black text-white">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Finder Contact Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                          <User className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Name</p>
                          <p className="text-lg font-bold text-slate-900">{foundId.finderName}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a 
                          href={`tel:${foundId.finderPhone}`}
                          className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-black transition-colors"
                        >
                          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                            <Phone className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</p>
                            <p className="font-medium text-slate-900">{foundId.finderPhone}</p>
                          </div>
                        </a>
                        
                        <a 
                          href={`mailto:${foundId.finderEmail}`}
                          className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-black transition-colors"
                        >
                          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email</p>
                            <p className="font-medium text-slate-900 truncate max-w-[150px] md:max-w-none">{foundId.finderEmail}</p>
                          </div>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex justify-center py-6">
                    <Button variant="outline" className="rounded-xl" onClick={() => router.push("/dashboard")}>
                      Go to Dashboard
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </main>
  );
}

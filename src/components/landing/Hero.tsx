"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, CheckCircle2, AlertCircle, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const Hero = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [idNumber, setIdNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [searchResult, setSearchResult] = useState<"found" | "not_found" | null>(null);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber) return;

    setLoading(true);
    setSearchResult(null);
    try {
      const q = query(
        collection(db, "found_ids"),
        where("idNumber", "==", idNumber)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setSearchResult("found");
      } else {
        setSearchResult("not_found");
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchID = async () => {
    if (!user) {
      router.push("/login?redirect=/dashboard/watchlist");
      return;
    }

    setNotifying(true);
    try {
      // Check if already watching
      const watchId = `${user.uid}_${idNumber}`;
      const watchRef = doc(db, "id_watch_list", watchId);
      const watchSnap = await getDoc(watchRef);

      if (watchSnap.exists()) {
        toast({
          title: "Already watching",
          description: "You have already requested a notification for this ID.",
        });
        router.push("/dashboard/watchlist");
        return;
      }
      
      await setDoc(watchRef, {
        idNumber,
        userId: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
        status: "pending"
      });

      // Send Watch Request Confirmation Email
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: user.email,
          type: "WATCH_REQUEST",
          idNumber,
          ownerName: user.displayName || user.email?.split('@')[0],
        }),
      });

      toast({
        title: "Alert set!",
        description: `We'll notify you if ID ${idNumber} is reported.`,
      });

      // Redirect to watchlist page to show the new record
      router.push("/dashboard/watchlist");
    } catch (error: any) {
      toast({
        title: "Failed to set alert",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setNotifying(false);
    }
  };

  const proceedToClaim = () => {
    router.push(`/dashboard/search?idNumber=${idNumber}`);
  };

  return (
    <section className="bg-[#020202] pt-12 pb-24 relative rounded-br-[20px] md:rounded-br-[40px] z-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-start text-left">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
          >
            Niaje, ID yako imepotea?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-xl text-white/90"
          >
            Search if it’s already been found before spending money replacing it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 w-full max-w-4xl relative z-30"
          >
            <div className="relative p-1 rounded-[24px] bg-white/5 border border-white/10 backdrop-blur-xl overflow-visible">
              <form
                onSubmit={handleSearch}
                className="flex flex-col md:flex-row items-center gap-2 p-2 bg-transparent overflow-visible"
              >
                <div className="flex-1 w-full relative overflow-visible">
                  <input
                    type="text"
                    placeholder="Enter ID Number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-6 text-white placeholder:text-white/20 outline-none focus:bg-white/10 transition-all font-medium"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto h-14 px-10 bg-white text-black hover:bg-white/90 rounded-xl font-bold text-base transition-all active:scale-95 shadow-lg shadow-white/5"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
                </Button>
              </form>
            </div>

            <AnimatePresence>
              {searchResult === "found" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-6 p-6 rounded-3xl bg-green-500/10 border border-green-500/20 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 text-green-400">
                    <CheckCircle2 className="h-8 w-8" />
                    <div>
                      <p className="font-bold text-lg text-white">We found a match!</p>
                      <p className="text-green-400/80">Sign in to verify and claim your ID.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={proceedToClaim}
                    className="w-full md:w-auto h-12 px-8 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all"
                  >
                    Login to Claim ID
                  </Button>
                </motion.div>
              )}

              {searchResult === "not_found" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-6 p-6 rounded-3xl bg-red-500/10 border border-red-500/20 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 text-red-400">
                    <AlertCircle className="h-8 w-8" />
                    <div>
                      <p className="font-bold text-lg text-white">No match found yet.</p>
                      <p className="text-red-400/80">We haven't received a report for this ID number.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleWatchID}
                    disabled={notifying}
                    className="w-full md:w-auto h-12 px-8 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10 flex items-center gap-2"
                  >
                    {notifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                    {user ? "Notify me when found" : "Login to get notified"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

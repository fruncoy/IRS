"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  setDoc,
  getDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FoundId } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Search, 
  MapPin, 
  Calendar, 
  User, 
  ShieldCheck, 
  Phone, 
  Mail, 
  CheckCircle2,
  Bell,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CustomSelect } from "@/components/ui/custom-select";
import { useSearchParams, useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function SearchIdPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [idNumber, setIdNumber] = useState(searchParams.get("idNumber") || "");
  
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [results, setResults] = useState<FoundId[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [claimedId, setClaimedId] = useState<FoundId | null>(null);
  const { toast } = useToast();

  const handleWatchID = async () => {
    if (!user || !idNumber) return;

    setNotifying(true);
    try {
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
      
      // 1. Check if ID is ALREADY in found_ids
      const foundQ = query(
        collection(db, "found_ids"),
        where("idNumber", "==", idNumber),
        where("status", "==", "pending")
      );
      const foundSnap = await getDocs(foundQ);
      const isAlreadyFound = !foundSnap.empty;

      await setDoc(watchRef, {
        idNumber,
        userId: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
        status: isAlreadyFound ? "notified" : "pending"
      });

      // 2. If it was already found, send the MATCH email immediately
      if (isAlreadyFound) {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: user.email,
            type: "MATCH_FOUND",
            idNumber,
            ownerName: user.displayName || user.email?.split('@')[0],
          }),
        });
      } else {
        // Otherwise send the standard WATCH request confirmation
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
      }

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

  const performSearch = useCallback(async (searchId: string) => {
    if (!searchId) return;

    setLoading(true);
    setHasSearched(true);
    setResults([]); // Clear previous results
    try {
      const q = query(
        collection(db, "found_ids"),
        where("idNumber", "==", searchId)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoundId));
      setResults(data);
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (searchParams.get("idNumber")) {
      performSearch(searchParams.get("idNumber")!);
    }
  }, [searchParams, performSearch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(idNumber);
  };

  const handleClaim = async (foundId: FoundId) => {
    if (!user) return;

    setClaiming(foundId.id);
    try {
      // 1. Update the found_id status to owner_found
      const idRef = doc(db, "found_ids", foundId.id);
      await updateDoc(idRef, {
        status: "owner_found",
        claimedBy: user.uid,
        claimedAt: serverTimestamp()
      });

      // 2. Create a claim record
      await addDoc(collection(db, "claims"), {
        foundIdId: foundId.id,
        claimerUid: user.uid,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setClaimedId(foundId);

      // Send ID_CLAIMED email to Finder
      try {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: foundId.finderEmail,
            type: "ID_CLAIMED",
            idNumber: foundId.idNumber,
            finderName: foundId.finderName,
          }),
        });
      } catch (e) {
        console.error("Failed to send claim notification email", e);
      }

      // Update Watchlist status if this ID was being watched
      try {
        const watchId = `${user.uid}_${foundId.idNumber}`;
        const watchRef = doc(db, "id_watch_list", watchId);
        const watchSnap = await getDoc(watchRef);
        
        if (watchSnap.exists()) {
          await updateDoc(watchRef, {
            status: "claimed",
            claimedAt: serverTimestamp()
          });
        }
      } catch (watchError) {
        console.error("Failed to update watchlist status:", watchError);
      }

      toast({
        title: "Claim Initiated!",
        description: "Status updated to Owner Found. You can now see the finder's details.",
      });
    } catch (error: any) {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setClaiming(null);
    }
  };

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());

  if (claimedId) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="mx-auto bg-green-100 h-20 w-20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">ID Claimed Successfully!</h2>
          <p className="text-slate-500 text-lg">
            We have marked this ID as <strong>Owner Found</strong>. Please contact the finder to arrange for recovery.
          </p>
        </div>

        <Card className="border-slate-200 shadow-xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="text-2xl">Finder's Contact Details</CardTitle>
            <CardDescription className="text-slate-300">
              Reach out to the person who found your ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-slate-400 uppercase tracking-wider text-xs">Finder Name</Label>
                <div className="flex items-center gap-3 text-lg font-bold text-slate-900">
                  <User className="h-5 w-5 text-blue-500" />
                  {claimedId.finderName}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 uppercase tracking-wider text-xs">Phone Number</Label>
                <div className="flex items-center gap-3 text-lg font-bold text-slate-900">
                  <Phone className="h-5 w-5 text-green-500" />
                  {claimedId.finderPhone}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-400 uppercase tracking-wider text-xs">Email Address</Label>
                <div className="flex items-center gap-3 text-lg font-bold text-slate-900">
                  <Mail className="h-5 w-5 text-indigo-500" />
                  {claimedId.finderEmail}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex gap-4">
                <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
                <div>
                  <p className="font-bold text-blue-900">Security Reminder</p>
                  <p className="text-blue-800 text-sm leading-relaxed mt-1">
                    Meet in a public place for the recovery. Ensure you verify the ID physically before concluding the process.
                  </p>
                </div>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full h-14 rounded-2xl text-lg font-bold border-slate-200 hover:bg-slate-50">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Search ID</h2>
        <p className="text-slate-500">Search our database to see if your lost ID has been reported.</p>
      </div>

      <div className="relative p-1 rounded-[24px] bg-slate-900 shadow-2xl overflow-visible">
        <form
          onSubmit={handleSearch}
          className="flex flex-col lg:flex-row items-center gap-3 p-3 bg-transparent overflow-visible"
        >
          <div className="flex-1 w-full relative overflow-visible">
            <input
              type="text"
              placeholder="Enter ID Number"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="w-full h-14 bg-white/10 border border-white/10 rounded-xl px-6 text-white placeholder:text-white/30 outline-none focus:bg-white/15 transition-all font-medium"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full lg:w-auto h-14 px-10 bg-white text-black hover:bg-white/90 rounded-xl font-bold text-base transition-all active:scale-95"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search Database"}
          </Button>
        </form>
      </div>

      {hasSearched && results.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center px-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No ID Found with number: {idNumber}</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            We haven't received a report for this ID yet. Don't worry, someone might find it soon!
          </p>
          <div className="mt-8">
            <Button 
              onClick={handleWatchID}
              disabled={notifying}
              className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              {notifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />}
              Notify me when it's found
            </Button>
          </div>
        </div>
      )}

      {hasSearched && results.length > 0 && !loading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <h3 className="text-xl font-bold text-slate-900 px-1">
            {results.length} {results.length === 1 ? 'Result' : 'Results'} Found
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((id) => (
              <Card key={id.id} className="border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl">
                          {id.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">{id.fullName}</h4>
                          <p className="text-slate-500 font-medium">ID Number: {id.idNumber}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 pt-2">
                        <div className="flex items-center gap-3 text-slate-600">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">{id.foundLocation}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-end items-end gap-4">
                      {id.status === "pending" ? (
                        <Button 
                          onClick={() => handleClaim(id)} 
                          disabled={claiming === id.id}
                          className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700"
                        >
                          {claiming === id.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Claim ID"
                          )}
                        </Button>
                      ) : id.status === "owner_found" ? (
                        <div className="flex flex-col items-end gap-2">
                          <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full py-1.5 px-4 font-bold">
                            ALREADY CLAIMED
                          </Badge>
                          {id.claimedBy === user.uid ? (
                            <Button asChild variant="link" size="sm" className="text-blue-600 font-bold p-0 h-auto">
                              <Link href="/dashboard/claims">View in My Claims</Link>
                            </Button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">Claimed by another user</span>
                          )}
                        </div>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200 rounded-full py-1.5 px-4 font-bold uppercase">
                          {id.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

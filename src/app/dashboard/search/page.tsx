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
  CheckCircle2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CustomSelect } from "@/components/ui/custom-select";
import { useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function SearchIdPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [idNumber, setIdNumber] = useState(searchParams.get("idNumber") || "");
  const [month, setMonth] = useState(searchParams.get("month") || "");
  const [day, setDay] = useState(searchParams.get("day") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");
  
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [results, setResults] = useState<FoundId[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [claimedId, setClaimedId] = useState<FoundId | null>(null);
  const { toast } = useToast();

  const performSearch = useCallback(async (searchId: string, searchMonth: string, searchDay: string, searchYear: string) => {
    if (!searchId || !searchMonth || !searchDay || !searchYear) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const dob = `${searchYear}-${searchMonth.padStart(2, '0')}-${searchDay.padStart(2, '0')}`;
      const q = query(
        collection(db, "found_ids"),
        where("idNumber", "==", searchId),
        where("dob", "==", dob)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoundId));
      setResults(data);
      
      if (data.length === 0) {
        toast({
          title: "No results found",
          description: "We couldn't find an ID with that number and date of birth.",
        });
      }
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
      performSearch(
        searchParams.get("idNumber")!,
        searchParams.get("month")!,
        searchParams.get("day")!,
        searchParams.get("year")!
      );
    }
  }, [searchParams, performSearch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(idNumber, month, day, year);
  };

  const handleClaim = async (foundId: FoundId) => {
    if (!user) return;

    setClaiming(foundId.id);
    try {
      // 1. Update the found_id status to owner_found
      const idRef = doc(db, "found_ids", foundId.id);
      await updateDoc(idRef, {
        status: "owner_found"
      });

      // 2. Create a claim record
      await addDoc(collection(db, "claims"), {
        foundId: foundId.id,
        claimerUid: user.uid,
        status: "pending",
        createdAt: serverTimestamp(),
        idDetails: {
          fullName: foundId.fullName,
          idNumber: foundId.idNumber
        }
      });

      setClaimedId(foundId);
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
          <div className="flex-[1.5] w-full flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-3 h-14 overflow-visible">
            <CustomSelect
              value={month}
              onChange={setMonth}
              options={months}
              placeholder="Month"
              triggerClassName="bg-transparent border-none h-full text-white placeholder:text-white/30 hover:border-none focus:ring-0"
              dropdownClassName="bg-slate-900 border-white/10 text-white"
            />
            <div className="w-px h-6 bg-white/10" />
            <CustomSelect
              value={day}
              onChange={setDay}
              options={days.map((d) => ({ value: d, label: d }))}
              placeholder="Day"
              triggerClassName="bg-transparent border-none h-full text-white placeholder:text-white/30 hover:border-none focus:ring-0"
              dropdownClassName="bg-slate-900 border-white/10 text-white"
            />
            <div className="w-px h-6 bg-white/10" />
            <CustomSelect
              value={year}
              onChange={setYear}
              options={years.map((y) => ({ value: y, label: y }))}
              placeholder="Year"
              triggerClassName="bg-transparent border-none h-full text-white placeholder:text-white/30 hover:border-none focus:ring-0"
              dropdownClassName="bg-slate-900 border-white/10 text-white"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full lg:w-auto h-14 px-10 bg-white text-black hover:bg-slate-100 rounded-xl font-bold text-base transition-all active:scale-95 shadow-lg shadow-white/5"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
          </Button>
        </form>
      </div>

      {hasSearched && !loading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <h3 className="text-xl font-bold text-slate-900 px-1">
            {results.length} {results.length === 1 ? 'Result' : 'Results'} Found
          </h3>
          
          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
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
                        {id.status === "pending" && (
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
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
              <CardContent className="p-12 text-center">
                <div className="mx-auto bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">No matching ID found</h4>
                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                  We haven't found an ID matching that number yet. Check back later or subscribe for alerts.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

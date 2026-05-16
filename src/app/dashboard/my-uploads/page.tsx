"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FoundId } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";
import { MoreHorizontal, Eye, CheckCircle, Clock, Trash2, ShieldCheck, User, Phone, Mail, MapPin, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function MyUploads() {
  const { user } = useAuth();
  const [ids, setIds] = useState<FoundId[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<FoundId | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [claimerProfile, setClaimerProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const { toast } = useToast();

  const handleViewDetails = async (id: FoundId) => {
    setSelectedId(id);
    setIsDetailsOpen(true);
    setClaimerProfile(null);

    if (id.status === "owner_found" && id.claimedBy) {
      setLoadingProfile(true);
      try {
        const userDoc = await getDoc(doc(db, "users", id.claimedBy));
        if (userDoc.exists()) {
          setClaimerProfile(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching claimer profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    }
  };

  const fetchIds = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "found_ids"),
        where("createdBy", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoundId));
      setIds(data);
    } catch (error) {
      console.error("Error fetching IDs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIds();
  }, [user]);

  const handleMarkAsRecovered = async (id: string, idNumber?: string, claimedBy?: string) => {
    try {
      await updateDoc(doc(db, "found_ids", id), {
        status: "recovered"
      });

      // Update Watchlist status for the owner
      if (claimedBy && idNumber) {
        try {
          const watchId = `${claimedBy}_${idNumber}`;
          const watchRef = doc(db, "id_watch_list", watchId);
          const watchSnap = await getDoc(watchRef);
          if (watchSnap.exists()) {
            await updateDoc(watchRef, {
              status: "recovered",
              recoveredAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.error("Watchlist update failed:", e);
        }
      }

      toast({
        title: "Status Updated",
        description: "The ID has been marked as recovered.",
      });
      fetchIds();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "found_ids", id));
      toast({
        title: "Record Deleted",
        description: "The ID report has been permanently removed.",
      });
      fetchIds();
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectClaim = async (id: string, idNumber: string, claimedBy: string) => {
    try {
      await updateDoc(doc(db, "found_ids", id), {
        status: "pending",
        claimedBy: null,
        claimedAt: null
      });

      // Reset Watchlist status for the owner back to notified
      if (claimedBy) {
        try {
          const watchId = `${claimedBy}_${idNumber}`;
          const watchRef = doc(db, "id_watch_list", watchId);
          const watchSnap = await getDoc(watchRef);
          if (watchSnap.exists()) {
            await updateDoc(watchRef, {
              status: "notified"
            });
          }
        } catch (e) {
          console.error("Watchlist reset failed:", e);
        }
      }

      toast({
        title: "Claim Rejected",
        description: "The claim has been rejected and the ID is back to pending.",
      });
      fetchIds();
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "owner_found": return "bg-blue-100 text-blue-800 border-blue-200";
      case "recovered": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">My Uploaded IDs</h2>
          <p className="text-slate-500">Manage the IDs you've found and reported.</p>
        </div>
        <Button asChild className="rounded-xl px-6 bg-black text-white hover:bg-slate-800 shadow-lg shadow-black/5">
          <Link href="/dashboard/report">Report Found ID</Link>
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="px-6 py-4">Name on ID</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Reported</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j} className="px-6 py-4">
                        <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : ids.length > 0 ? (
                ids.map((id) => (
                  <TableRow key={id.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="px-6 py-4 font-medium text-slate-900">{id.fullName}</TableCell>
                    <TableCell className="text-slate-600">{id.idNumber}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(id.status) + " rounded-full font-medium"}>
                        {id.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {id.createdAt?.seconds ? format(new Date(id.createdAt.seconds * 1000), "MMM d, yyyy") : "Just now"}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end gap-2">
                        {id.status === "owner_found" && (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2 rounded-xl border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                              onClick={() => handleMarkAsRecovered(id.id, id.idNumber, id.claimedBy!)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Confirm Handover
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2 rounded-xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                              onClick={() => handleRejectClaim(id.id, id.idNumber, id.claimedBy!)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Not the Owner
                            </Button>
                          </div>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-slate-200 w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer"
                              onClick={() => handleViewDetails(id)}
                            >
                              <Eye className="h-4 w-4 text-slate-400" /> View Details
                            </DropdownMenuItem>
                            {id.status === "pending" && (
                              <DropdownMenuItem 
                                className="gap-2 cursor-pointer text-green-600 focus:text-green-600"
                                onClick={() => handleMarkAsRecovered(id.id)}
                              >
                                <CheckCircle className="h-4 w-4" /> Mark as Recovered
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                              onClick={() => handleDeleteRecord(id.id)}
                            >
                              <Trash2 className="h-4 w-4" /> Delete Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <p>You haven't uploaded any IDs yet.</p>
                      <Button asChild variant="link" className="text-black font-semibold">
                        <Link href="/dashboard/report">Report your first found ID</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          {selectedId && (
            <div className="flex flex-col">
              <div className="bg-slate-900 p-8 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white">Report Details</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Detailed information about this found ID report.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-8 mt-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</p>
                    <p className="text-xl font-bold">{selectedId.fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID Number</p>
                    <p className="text-xl font-bold">{selectedId.idNumber}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                      <MapPin className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Found Location</p>
                      <p className="font-bold text-slate-900">{selectedId.foundLocation}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(selectedId.status) + " rounded-full px-4 py-1.5 font-bold uppercase tracking-wider text-[10px]"}>
                    {selectedId.status.replace("_", " ")}
                  </Badge>
                </div>

                {selectedId.status === "owner_found" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ShieldCheck className="h-32 w-32 rotate-12" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <ShieldCheck className="h-7 w-7" />
                          <h3 className="text-xl font-bold">Verification Guide for Heroes</h3>
                        </div>
                        <p className="text-blue-50 text-sm leading-relaxed mb-6 max-w-md">
                          To keep things simple, we no longer ask for the Date of Birth here. Instead, when someone contacts you to claim this ID, <strong className="text-white">please ask them to verify these 4 details</strong> to be 100% sure they are the owner:
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            "Date of Birth",
                            "Place of Issue",
                            "Place of Birth",
                            "County / Ward"
                          ].map((detail) => (
                            <div key={detail} className="bg-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 border border-white/10 backdrop-blur-sm">
                              <div className="h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.8)]" />
                              <span className="text-xs font-bold tracking-wide uppercase">{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {claimerProfile ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Claimer Contact Details</h3>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                            <CheckCircle className="h-3 w-3" />
                            VERIFIED OWNER
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                              <User className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</p>
                              <p className="text-lg font-bold text-slate-900">{claimerProfile.fullName}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                              <Phone className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                              <p className="text-lg font-bold text-slate-900">{claimerProfile.phoneNumber || "Not provided"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                              <Mail className="h-6 w-6 text-indigo-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                              <p className="text-lg font-bold text-slate-900">{claimerProfile.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : loadingProfile ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-500 opacity-20" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching owner details...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <AlertCircle className="h-8 w-8 text-slate-300 mb-4" />
                        <p className="text-sm font-medium text-slate-500 text-center">
                          Waiting for owner to confirm contact info...
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

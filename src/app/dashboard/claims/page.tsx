"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Claim, FoundId } from "@/types";
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
import { Eye, ShieldCheck, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ClaimWithId extends Claim {
  idDetails?: FoundId;
}

export default function ClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<ClaimWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchClaims = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "claims"),
        where("claimerUid", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const claimsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClaimWithId));
      
      // Fetch ID details for each claim
      const enrichedClaims = await Promise.all(
        claimsData.map(async (claim) => {
          const idDoc = await getDoc(doc(db, "found_ids", claim.foundIdId));
          if (idDoc.exists()) {
            return { ...claim, idDetails: { id: idDoc.id, ...idDoc.data() } as FoundId };
          }
          return claim;
        })
      );

      setClaims(enrichedClaims);
    } catch (error) {
      console.error("Error fetching claims:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [user]);

  const handleCancelClaim = async (claim: ClaimWithId) => {
    if (!user) return;
    setCancelling(claim.id);
    try {
      // 1. Revert ID status to pending
      await updateDoc(doc(db, "found_ids", claim.foundIdId), {
        status: "pending"
      });

      // 2. Delete the claim record
      await deleteDoc(doc(db, "claims", claim.id));

      toast({
        title: "Claim Cancelled",
        description: "The claim has been removed and the ID status reverted.",
      });
      fetchClaims();
    } catch (error: any) {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">My Claims</h2>
        <p className="text-slate-500">Track the IDs you've claimed as yours.</p>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="px-6 py-4">Name on ID</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Claim Date</TableHead>
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
              ) : claims.length > 0 ? (
                claims.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="px-6 py-4 font-medium text-slate-900">
                      {claim.idDetails?.fullName || "Unknown"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {claim.idDetails?.idNumber ? `********${claim.idDetails.idNumber.slice(-3)}` : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={claim.idDetails?.status === "recovered" ? "default" : "secondary"} className="rounded-full">
                        {claim.idDetails?.status.replace("_", " ") || "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {claim.createdAt?.seconds ? format(new Date(claim.createdAt.seconds * 1000), "MMM d, yyyy") : "Just now"}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="ghost" size="sm" className="gap-2 rounded-lg">
                          <Link href={`/claim/${claim.foundIdId}`}>
                            <Eye className="h-4 w-4" />
                            View Finder
                          </Link>
                        </Button>
                        {claim.idDetails?.status === "owner_found" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleCancelClaim(claim)}
                            disabled={cancelling === claim.id}
                          >
                            {cancelling === claim.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            Cancel Claim
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <ShieldCheck className="h-6 w-6 text-slate-400" />
                      </div>
                      <p>You haven't claimed any IDs yet.</p>
                      <Button asChild variant="link" className="text-black font-semibold">
                        <Link href="/dashboard/search">Search for your ID</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore";
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
import { MoreHorizontal, Eye, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function MyUploads() {
  const { user } = useAuth();
  const [ids, setIds] = useState<FoundId[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  const handleMarkAsRecovered = async (id: string) => {
    try {
      await updateDoc(doc(db, "found_ids", id), {
        status: "recovered"
      });
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 rounded-xl border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                            onClick={() => handleMarkAsRecovered(id.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark Recovered
                          </Button>
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
                            <DropdownMenuItem className="gap-2 cursor-pointer">
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
                            <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 focus:text-red-600">
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
    </div>
  );
}

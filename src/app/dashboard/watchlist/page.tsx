"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Trash2, Clock, AlertCircle, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface WatchItem {
  id: string;
  idNumber: string;
  createdAt: any;
  status: "pending" | "notified" | "claimed" | "recovered";
}

export default function MyWatchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();
  const router = useRouter();

  const fetchWatchlist = useCallback(async (isAuto = false) => {
    if (!user) return;
    if (!isAuto) setLoading(true);
    else setIsRefreshing(true);

    try {
      const q = query(
        collection(db, "id_watch_list"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const watchItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WatchItem[];

      let matchFound = false;

      // AUTO-CHECK FOR MATCHES
      for (const item of watchItems) {
        if (item.status === "pending" || item.status === "notified") {
          const foundQ = query(
            collection(db, "found_ids"),
            where("idNumber", "==", item.idNumber),
            where("status", "==", "pending")
          );
          const foundSnap = await getDocs(foundQ);
          const hasActiveMatch = !foundSnap.empty;

          if (hasActiveMatch && item.status === "pending") {
            matchFound = true;
            // Update local state status to reflect match found
            item.status = "notified";
            // Update Firestore so it persists
            await updateDoc(doc(db, "id_watch_list", item.id), {
              status: "notified",
              notifiedAt: serverTimestamp()
            });
          } else if (!hasActiveMatch && item.status === "notified") {
            // Match is no longer available (e.g. deleted or claimed by someone else)
            // We revert to pending to resume monitoring
            item.status = "pending";
            await updateDoc(doc(db, "id_watch_list", item.id), {
              status: "pending",
              notifiedAt: null
            });
          }
        }
      }
      
      // Sort manually
      watchItems.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      setItems(watchItems);
      setLastUpdated(new Date());

      if (matchFound && isAuto) {
        toast({
          title: "Good news!",
          description: "A match was found for one of your watched IDs!",
        });
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchWatchlist();

    // Set up auto-refresher every 15 seconds
    const interval = setInterval(() => {
      fetchWatchlist(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchWatchlist]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "id_watch_list", id));
      setItems(items.filter(item => item.id !== id));
      toast({
        title: "Alert removed",
        description: "You will no longer receive notifications for this ID.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not remove the alert.",
        variant: "destructive",
      });
    }
  };

  const handleClaimFromWatchlist = (idNumber: string) => {
    router.push(`/dashboard/search?idNumber=${idNumber}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Watchlist</h1>
          <p className="text-slate-500 mt-1">Manage your active ID search alerts.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse flex flex-col p-8 space-y-6">
                <div className="flex justify-end">
                  <div className="h-10 w-10 bg-slate-50 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-slate-50 rounded" />
                  <div className="h-8 w-48 bg-slate-100 rounded" />
                </div>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-slate-100 rounded-full" />
                    <div className="h-3 w-24 bg-slate-50 rounded" />
                  </div>
                  <div className="h-10 w-32 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm"
          >
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Bell className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No active alerts</h3>
            <p className="text-slate-500 mt-2 max-w-xs text-center">
              Search for a missing ID on the home page and click "Notify me" to add it here.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID Number</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{item.idNumber}</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Alert Created</span>
                        </div>
                        <p className="font-semibold text-slate-700">
                          {item.createdAt?.toDate ? format(item.createdAt.toDate(), "MMM d, yyyy") : "Recent"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          item.status === 'pending' ? 'bg-amber-400 animate-pulse' : 
                          item.status === 'notified' ? 'bg-green-500' :
                          'bg-blue-500'
                        }`} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          {item.status === 'pending' ? 'Monitoring' : 
                           item.status === 'notified' ? 'Match Found!' : 
                           item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </div>
                      
                      {item.status === 'notified' ? (
                        <Button 
                          onClick={() => handleClaimFromWatchlist(item.idNumber)}
                          className="h-10 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-green-100"
                        >
                          Claim ID
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      ) : item.status === 'pending' && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                          <AlertCircle className="h-3 w-3" />
                          AUTO-WATCH ACTIVE
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

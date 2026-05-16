"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Trash2, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface WatchItem {
  id: string;
  idNumber: string;
  dob: string;
  createdAt: any;
  status: "pending" | "notified";
}

export default function MyWatchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWatchlist = async () => {
    if (!user) return;
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
      
      // Sort manually since we might not have a composite index yet
      watchItems.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      setItems(watchItems);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [user]);

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

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Watchlist</h1>
          <p className="text-slate-500 mt-1">Manage your active ID search alerts.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {items.length === 0 ? (
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
                        <div className={`h-2 w-2 rounded-full ${item.status === 'pending' ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          {item.status === 'pending' ? 'Monitoring' : 'Notified'}
                        </span>
                      </div>
                      {item.status === 'pending' && (
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

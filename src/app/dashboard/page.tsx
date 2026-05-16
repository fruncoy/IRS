"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  UserCheck,
  PlusCircle,
  ArrowUpRight,
  Search,
  Bell
} from "lucide-react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { FoundId } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    ownerFound: 0,
    recovered: 0,
    watchlist: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const q = query(collection(db, "found_ids"), where("createdBy", "==", user.uid));
        const snapshot = await getDocs(q);
        
        // Fetch watchlist count
        const watchQ = query(collection(db, "id_watch_list"), where("userId", "==", user.uid));
        const watchSnapshot = await getDocs(watchQ);
        
        const counts = {
          total: snapshot.size,
          pending: 0,
          ownerFound: 0,
          recovered: 0,
          watchlist: watchSnapshot.size,
        };

        snapshot.forEach((doc) => {
          const data = doc.data() as FoundId;
          if (data.status === "pending") counts.pending++;
          else if (data.status === "owner_found") counts.ownerFound++;
          else if (data.status === "recovered") counts.recovered++;
        });

        setStats(counts);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const statCards = [
    { title: "Total IDs Uploaded", value: stats.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Watchlist", value: stats.watchlist, icon: Bell, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Owner Found", value: stats.ownerFound, icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Recovered", value: stats.recovered, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h2>
        <p className="text-slate-500">Welcome back! Hizi ndo updates za ID zenye ulireport.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={stat.bg + " p-2 rounded-xl"}>
                  <stat.icon className={stat.color + " h-6 w-6"} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

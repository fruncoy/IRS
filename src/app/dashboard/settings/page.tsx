"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Shield, MapPin, LocateFixed, Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      // Extract 9 digits if it starts with +254
      const existingPhone = profile.phoneNumber || "";
      if (existingPhone.startsWith("+254")) {
        setPhoneNumber(existingPhone.replace("+254", ""));
      } else {
        setPhoneNumber(existingPhone);
      }
      setLocation(profile.location || "");
    }
  }, [profile]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ""); // Only numbers
    if (val.length <= 9) {
      setPhoneNumber(val);
    }
  };

  // Auto-save logic
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentFullPhone = `+254${phoneNumber}`;
      if (user && profile && (
        fullName !== (profile.fullName || "") || 
        currentFullPhone !== (profile.phoneNumber || "") || 
        location !== (profile.location || "")
      )) {
        handleAutoSave();
      }
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timer);
  }, [fullName, phoneNumber, location, user, profile]);

  const handleAutoSave = async () => {
    if (!user || phoneNumber.length !== 9) return;
    setIsSaving(true);
    try {
      const fullPhone = `+254${phoneNumber}`;
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        fullName,
        phoneNumber: fullPhone,
        location,
        email: user.email,
      }, { merge: true });
      await refreshProfile();
    } catch (error: any) {
      console.error("Auto-save error:", error);
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude}, ${longitude}`;
          setLocation(address);
          toast({
            title: "Location Updated",
            description: "Your location has been auto-detected and saved.",
          });
        } catch (error) {
          console.error("Geocoding error:", error);
          toast({
            title: "Detection Failed",
            description: "Could not identify your address.",
          });
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setDetecting(false);
        toast({
          title: "Permission Denied",
          description: "Please enable location access.",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2>
          <p className="text-slate-500">Manage your profile. Changes save automatically.</p>
        </div>
        {isSaving && (
          <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-300">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs font-medium">Saving changes...</span>
          </div>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-50">
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your personal details used for ID recovery.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="name" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-black focus:border-black" 
                  placeholder="Your full name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="email" 
                  value={profile?.email || ""} 
                  className="pl-10 h-12 rounded-xl border-slate-200 bg-slate-50 cursor-not-allowed" 
                  readOnly
                />
              </div>
              <p className="text-[10px] text-slate-400 ml-1">Email cannot be changed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative flex">
                <div className="flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium">
                  +254
                </div>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="phone" 
                    value={phoneNumber} 
                    onChange={handlePhoneChange}
                    className={`pl-10 h-12 rounded-l-none rounded-r-xl border-slate-200 focus:ring-black focus:border-black ${
                      phoneNumber.length > 0 && phoneNumber.length < 9 ? "border-red-300 bg-red-50/30" : ""
                    }`}
                    placeholder="712345678"
                  />
                </div>
              </div>
              {phoneNumber.length > 0 && phoneNumber.length < 9 ? (
                <p className="text-[10px] text-red-500 ml-1 font-medium animate-in fade-in slide-in-from-top-1">
                  Invalid: Exactly 9 digits required ({9 - phoneNumber.length} remaining).
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 ml-1">Enter the 9 digits after +254.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Your Location (Auto-detected)</Label>
              <div 
                className="flex gap-2 cursor-pointer group"
                onClick={!detecting ? detectLocation : undefined}
              >
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-black transition-colors" />
                  <Input 
                    value={location} 
                    readOnly
                    className="pl-10 h-12 rounded-xl border-slate-200 bg-slate-50 cursor-pointer group-hover:border-slate-300 transition-all" 
                    placeholder={detecting ? "Detecting..." : "Click to auto-detect location"}
                  />
                </div>
                <Button 
                  variant="outline" 
                  className="h-12 w-12 rounded-xl border-slate-200 shrink-0 group-hover:border-slate-300"
                  disabled={detecting}
                  title="Detect my location"
                >
                  {detecting ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                  ) : (
                    <LocateFixed className="h-5 w-5 text-slate-500 group-hover:text-black" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 ml-1">Click anywhere in the box above to update your location automatically.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

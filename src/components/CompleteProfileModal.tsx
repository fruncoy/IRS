"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, MapPin, LocateFixed, Loader2, Save } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function CompleteProfileModal() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (profile && (!profile.phoneNumber || !profile.location)) {
      setIsOpen(true);
      // If profile already has a phone number, extract the 9 digits after +254
      const existingPhone = profile.phoneNumber || "";
      if (existingPhone.startsWith("+254")) {
        setPhoneNumber(existingPhone.replace("+254", ""));
      }
      setLocation(profile.location || "");
    } else {
      setIsOpen(false);
    }
  }, [profile]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ""); // Only numbers
    if (val.length <= 9) {
      setPhoneNumber(val);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || phoneNumber.length !== 9 || !location) return;
    
    setLoading(true);
    try {
      const fullPhone = `+254${phoneNumber}`;
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        phoneNumber: fullPhone,
        location,
        fullName: profile?.fullName || user.displayName || "",
        email: user.email,
      }, { merge: true });
      
      await refreshProfile();
      setIsOpen(false);
      toast({
        title: "Profile Completed",
        description: "Thank you for providing your details.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      () => {
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
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent hideClose className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-center">
            To use IRS, you must provide your phone number and location. This helps in secure ID recovery.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSave} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="modal-phone">Phone Number</Label>
            <div className="relative flex">
              <div className="flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium">
                +254
              </div>
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="modal-phone"
                  placeholder="712345678"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className={`pl-10 h-12 rounded-l-none rounded-r-xl border-slate-200 focus:ring-black focus:border-black ${
                    phoneNumber.length > 0 && phoneNumber.length < 9 ? "border-red-300 bg-red-50/30" : ""
                  }`}
                  required
                />
              </div>
            </div>
            {phoneNumber.length > 0 && phoneNumber.length < 9 ? (
              <p className="text-[10px] text-red-500 ml-1 font-medium animate-in fade-in slide-in-from-top-1">
                Please enter exactly 9 digits. ({9 - phoneNumber.length} remaining)
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 ml-1">Enter the 9 digits after +254 (e.g., 712345678)</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Your Location</Label>
            <div 
              className="flex gap-2 cursor-pointer group"
              onClick={!detecting ? detectLocation : undefined}
            >
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-black transition-colors" />
                <Input
                  value={location}
                  readOnly
                  placeholder={detecting ? "Detecting..." : "Click to auto-detect location"}
                  className="pl-10 h-12 rounded-xl border-slate-200 bg-slate-50 cursor-pointer group-hover:border-slate-300 transition-all"
                  required
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-12 rounded-xl border-slate-200 shrink-0 group-hover:border-slate-300"
                disabled={detecting}
              >
                {detecting ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                ) : (
                  <LocateFixed className="h-5 w-5 text-slate-500 group-hover:text-black" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-black text-white hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-black/10"
            disabled={loading || !phoneNumber || !location}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Profile"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

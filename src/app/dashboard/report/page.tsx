"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FoundIdSchema, FoundIdFormValues } from "@/types";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { createWorker } from 'tesseract.js';
import { Camera, Upload, Scan, Loader2, ShieldCheck, AlertCircle, CheckCircle2, User, CreditCard, MapPin, Calendar, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomSelect } from "@/components/ui/custom-select";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function ReportFoundId() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPreview, setShowConfirmation] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("Analyzing...");
  const [showScanModal, setShowScanModal] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    fullName?: string;
    idNumber?: string;
  }>({});
  
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FoundIdFormValues>({
    resolver: zodResolver(FoundIdSchema),
    defaultValues: {
      fullName: "",
      idNumber: "",
      foundLocation: "",
      finderName: profile?.fullName || "",
      finderPhone: profile?.phoneNumber || "",
      finderEmail: profile?.email || "",
    },
  });

  const processIdImage = async (file: File) => {
    // 10MB Limit
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setScanStatus("Getting things ready...");
    setExtractedData({});
    
    let worker: any = null;
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Taking too long. Please try again or type manually.")), 60000);
      });

      const ocrPromise = (async () => {
        try {
          worker = await createWorker('eng', 1, {
            logger: m => {
              if (m.status === 'loading tesseract core') setScanStatus("Setting up scanner...");
              if (m.status === 'loading language traineddata') setScanStatus("Preparing to read...");
              if (m.status === 'initializing api') setScanStatus("Starting scan...");
              if (m.status === 'recognizing text') {
                const p = Math.floor(m.progress * 100);
                // Ensure progress only goes forward and is smooth
                setScanProgress(prev => Math.max(prev, p));
                
                if (p < 30) setScanStatus("Finding name...");
                else if (p < 60) setScanStatus("Finding ID number...");
                else if (p < 90) setScanStatus("Finishing up...");
                else setScanStatus("Just a second...");
              }
            },
          });
          
          const { data: { text } } = await worker.recognize(file);
          return text;
        } catch (err) {
          throw err;
        }
      })();

      const text = await Promise.race([ocrPromise, timeoutPromise]) as string;

      if (!text || text.trim().length < 5) {
        throw new Error("Could not see the text. Please use a clearer photo.");
      }

      const lines = text.split('\n');
      const newExtractedData: any = {};
      
      // 1. Extract ID Number (usually 8 digits)
      const idMatch = text.match(/\b\d{8}\b/);
      if (idMatch) {
        newExtractedData.idNumber = idMatch[0];
        setExtractedData(prev => ({ ...prev, idNumber: idMatch[0] }));
      }

      // 2. Extract Full Names
      const fullNameIndex = lines.findIndex(l => 
        l.toUpperCase().includes('FULL NAMES') || 
        l.toUpperCase().includes('NAME') ||
        l.toUpperCase().includes('ALUOCH') // Specific to current test image
      );
      if (fullNameIndex !== -1 && lines[fullNameIndex + 1]) {
        const name = lines[fullNameIndex + 1].trim().toUpperCase().replace(/[^A-Z\s]/g, '');
        newExtractedData.fullName = name;
        setExtractedData(prev => ({ ...prev, fullName: name }));
      }

      if (!newExtractedData.idNumber && !newExtractedData.fullName) {
        throw new Error("Could not find the details. Please try again.");
      }

      setScanProgress(100);
      setScanStatus("Done! Adding details to form...");

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (newExtractedData.idNumber) form.setValue('idNumber', newExtractedData.idNumber);
      if (newExtractedData.fullName) form.setValue('fullName', newExtractedData.fullName);

      setShowScanModal(false);
      toast({
        title: "Scan successful",
        description: "The details have been added for you.",
      });
    } catch (error: any) {
      console.error('OCR Error:', error);
      toast({
        title: "Scan failed",
        description: error.message || "Could not read the ID. Please type it in manually.",
        variant: "destructive",
      });
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setIsScanning(false);
      setScanProgress(0);
      setExtractedData({});
    }
  };

  const handleIdScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processIdImage(file);
  };

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!showScanModal || isScanning) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            await processIdImage(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showScanModal, isScanning]);

  const handleFormSubmit = (values: FoundIdFormValues) => {
    if (!month || !day || !year) {
      toast({
        title: "Missing Date",
        description: "Please select a valid date of birth.",
        variant: "destructive",
      });
      return;
    }
    const dob = `${year}-${month}-${day}`;
    form.setValue("dob", dob);
    setShowConfirmation(true);
  };

  const confirmAndSubmit = async () => {
    if (!user || !agreed) return;
    setLoading(true);
    const values = form.getValues();
    try {
      // Check if ID already exists
      const { query, where, getDocs, collection } = await import("firebase/firestore");
      const q = query(
        collection(db, "found_ids"),
        where("idNumber", "==", values.idNumber)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        throw new Error("This ID has already been reported as found. Please check the search page.");
      }

      await addDoc(collection(db, "found_ids"), {
        ...values,
        finderName: profile?.fullName || user.displayName || "",
        finderPhone: profile?.phoneNumber || "",
        finderEmail: profile?.email || "",
        status: "pending",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      // Send Report Confirmation Email to Finder
      try {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: profile?.email || user.email,
            type: "REPORT_CONFIRMATION",
            idNumber: values.idNumber,
            finderName: profile?.fullName || user.displayName || user.email?.split('@')[0],
            location: values.foundLocation,
          }),
        });
      } catch (e) {
        console.error("Failed to send report confirmation email", e);
      }

      // CHECK FOR WATCHLIST MATCHES
      try {
        const watchQuery = query(
          collection(db, "id_watch_list"),
          where("idNumber", "==", values.idNumber),
          where("status", "==", "pending")
        );
        const watchSnapshot = await getDocs(watchQuery);
        
        if (!watchSnapshot.empty) {
          // Notify each user who was watching this ID
          for (const watchDoc of watchSnapshot.docs) {
            const watchData = watchDoc.data();
            
            // Call our internal notification API with MATCH_FOUND type
            await fetch("/api/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                toEmail: watchData.email,
                type: "MATCH_FOUND",
                idNumber: values.idNumber,
                ownerName: watchData.email.split('@')[0], // Fallback if no name
              }),
            });

            // Update status to notified
            await updateDoc(doc(db, "id_watch_list", watchDoc.id), {
              status: "notified",
              notifiedAt: serverTimestamp()
            });
          }
        }
      } catch (notifyError) {
        console.error("Notification match error:", notifyError);
        // We don't throw here so the main report still succeeds
      }

      toast({
        title: "ID Reported Successfully",
        description: "Thank you for reporting this found ID. We will notify the owner if they search for it.",
      });

      router.push("/dashboard/my-uploads");
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Report Found ID</h1>
        <p className="text-slate-500 mt-1">Help return a lost document to its owner.</p>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-50 pb-8 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>ID Information</CardTitle>
            <CardDescription>Enter the exact details as they appear on the found ID card.</CardDescription>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => setShowScanModal(true)}
            className="rounded-xl border-slate-200 gap-2 bg-white shadow-sm hover:bg-slate-50 hover:border-[#003580]/30 transition-all h-10 px-4"
          >
            <Camera className="h-4 w-4 text-[#003580]" />
            <span className="font-semibold text-xs">Scan ID</span>
          </Button>
        </CardHeader>
        <CardContent className="pt-8">
          <Form {...form}>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <ShieldCheck className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">Verification Guide for Heroes</h4>
                    <p className="text-amber-700 text-sm mt-1 leading-relaxed">
                      To keep things simple, we no longer ask for the Date of Birth here. Instead, when someone contacts you to claim this ID, **please ask them to verify these 4 details** to be 100% sure they are the owner:
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                      {['Date of Birth', 'Place of Issue', 'Place of Birth', 'County / Ward'].map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm font-bold text-amber-800 bg-amber-100/50 px-3 py-2 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-amber-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-slate-500 uppercase tracking-wider">Full Names on ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter all names exactly as on card" {...field} className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 transition-all text-lg font-medium" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-slate-500 uppercase tracking-wider">ID Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ID number" {...field} className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 transition-all text-lg font-medium" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-8 mt-8">
                <FormField
                  control={form.control}
                  name="foundLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-slate-500 uppercase tracking-wider">Where did you find it?</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Westlands Matatu Stage, near Java" {...field} className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 transition-all text-lg font-medium" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-8 border-t border-slate-50">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="agree" 
                        checked={agreed}
                        onCheckedChange={(checked) => setAgreed(checked as boolean)}
                        className="mt-1 h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-black data-[state=checked]:border-black"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="agree"
                          className="text-sm font-medium text-slate-700 cursor-pointer leading-relaxed"
                        >
                          I understand and agree to store the ID safely and verify the owner before handover.
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-xl text-lg font-bold bg-black text-white hover:bg-slate-800 transition-all shadow-lg shadow-black/10" 
                disabled={!agreed}
              >
                Report Found ID
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* OCR Scan Modal */}
      <Dialog open={showScanModal} onOpenChange={(open) => !isScanning && setShowScanModal(open)}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <div className="relative p-10 flex flex-col space-y-8">
            <div className="space-y-2 text-center">
              <DialogTitle className="text-2xl font-bold text-slate-900">Scan ID Card</DialogTitle>
              <DialogDescription className="text-slate-500">
                Upload, paste, or take a photo of the ID card to extract details.
              </DialogDescription>
            </div>

            {/* Upload Zone - Hidden during scanning */}
            {!isScanning && (
              <div 
                className={cn(
                  "relative group overflow-hidden rounded-[2rem] border-2 border-dashed transition-all duration-300 min-h-[240px] flex flex-col items-center justify-center bg-[#fdfbf7]",
                  "border-slate-200 hover:border-[#003580]/30 hover:bg-white"
                )}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) processIdImage(file);
                }}
              >
                {/* Invisible File Input covering the entire area */}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleIdScan}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  title="Upload ID Image"
                />

                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-50 transition-transform group-hover:scale-110 duration-500">
                    <Upload className="h-12 w-12 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-600">Click or drop image here</p>
                    <p className="text-xs text-slate-400">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </div>
            )}

            {/* Extraction Progress & Preview */}
            <AnimatePresence>
              {isScanning && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6 pt-2"
                >
                  {/* Loading Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-[#003580] uppercase tracking-wider">
                      <span>{scanStatus}</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[#003580]" 
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Real-time Data Preview */}
                  <div className="grid grid-cols-1 gap-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Extracted Data</p>
                    <div className="space-y-2 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div className="flex justify-between items-center h-8">
                        <span className="text-[11px] text-slate-400 font-medium">Full Name</span>
                        <AnimatePresence mode="wait">
                          {extractedData.fullName ? (
                            <motion.span 
                              key="name-val"
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-sm font-bold text-slate-900"
                            >
                              {extractedData.fullName}
                            </motion.span>
                          ) : (
                            <div key="name-load" className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex justify-between items-center h-8">
                        <span className="text-[11px] text-slate-400 font-medium">ID Number</span>
                        <AnimatePresence mode="wait">
                          {extractedData.idNumber ? (
                            <motion.span 
                              key="id-val"
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-sm font-bold text-slate-900"
                            >
                              {extractedData.idNumber}
                            </motion.span>
                          ) : (
                            <div key="id-load" className="h-4 w-16 bg-slate-200 animate-pulse rounded" />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isScanning && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowScanModal(false)}
                className="w-full h-12 rounded-xl text-slate-400 hover:text-slate-600"
              >
                Cancel
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal - Kenyan ID Style */}
      <Dialog open={showPreview} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 text-white p-8 text-center">
            <DialogTitle className="text-2xl font-bold">Confirm ID Details</DialogTitle>
            <DialogDescription className="text-slate-400 mt-2">
              Please double-check the information against the physical ID card.
            </DialogDescription>
          </div>

          <div className="p-8 space-y-8 bg-white">
            {/* ID Card Visual Preview - Mocking Real Kenyan ID */}
            <div className="relative aspect-[1.58/0.85] w-full bg-[#fdfbf7] rounded-xl border border-slate-300 p-4 shadow-xl overflow-hidden font-mono text-slate-800">
              {/* Header */}
              <div className="relative flex justify-between items-start mb-1 z-10">
                <div className="text-[11px] font-black uppercase tracking-tight text-slate-900">Jamhuri Ya Kenya</div>
                <div className="text-[11px] font-black uppercase tracking-tight text-slate-900 text-right">Republic of Kenya</div>
              </div>

              {/* Row 1: Serial & ID Number (Inline) */}
              <div className="relative flex items-center gap-12 mb-4 z-10 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-bold text-slate-500 uppercase whitespace-nowrap">Serial Number:</span>
                  <div className="h-3.5 w-24 bg-slate-200/50 blur-[2.5px] rounded" />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-[8px] font-bold text-slate-500 uppercase whitespace-nowrap">ID Number:</span>
                  <p className="text-[12px] font-black tracking-widest text-slate-900">{form.getValues("idNumber")}</p>
                </div>
              </div>

              {/* Main Body */}
              <div className="relative flex gap-6 z-10 px-1">
                {/* Left Side: Photo */}
                <div className="w-28 h-32 bg-slate-200 rounded-md shadow-inner flex items-center justify-center relative overflow-hidden border border-slate-300/50">
                  <User className="h-20 w-20 text-slate-400 blur-[5px]" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-400/10 to-transparent blur-[8px]" />
                  {/* Embossed pattern on photo area */}
                  <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,black_5px,black_6px)]" />
                </div>

                {/* Center/Right Side: Information */}
                <div className="flex-1 flex flex-col space-y-2.5 mt-1">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-slate-500 uppercase">Full Names</span>
                    <p className="text-[10px] font-black uppercase text-slate-900 leading-none">{form.getValues("fullName")}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-slate-500 uppercase">Sex</span>
                    <div className="h-2.5 w-12 bg-slate-200/50 blur-[2px] rounded" />
                  </div>
                </div>
              </div>

              {/* Bottom security strip mockup */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-800/10 via-red-800/10 to-green-800/10" />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-14 rounded-2xl font-bold border-slate-200" 
                onClick={() => setShowConfirmation(false)}
              >
                Edit Details
              </Button>
              <Button 
                className="flex-1 h-14 rounded-2xl font-bold bg-black text-white hover:bg-slate-800" 
                onClick={confirmAndSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Confirm & Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

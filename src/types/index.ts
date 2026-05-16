import { z } from "zod";

export const FoundIdSchema = z.object({
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters")
    .refine((val) => val.trim().split(/\s+/).length >= 2, {
      message: "Please enter at least two names (First and Last name)",
    }),
  idNumber: z.string().min(5, "ID number must be at least 5 characters"),
  foundLocation: z.string().min(3, "Found location is required"),
  finderName: z.string().min(2, "Finder name is required"),
  finderPhone: z.string().min(10, "Valid phone number is required"),
  finderEmail: z.string().email("Invalid email address"),
});

export type FoundIdFormValues = z.infer<typeof FoundIdSchema>;

export interface FoundId extends FoundIdFormValues {
  id: string;
  status: "pending" | "owner_found" | "recovered";
  createdBy: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  location?: string;
  createdAt: any;
}

export interface Claim {
  id: string;
  foundIdId: string;
  claimerUid: string;
  createdAt: any;
}

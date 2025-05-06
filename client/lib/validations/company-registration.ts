import * as z from "zod"

/**
 * Company registration validation schema
 */
export const companyRegistrationSchema = z.object({
  // Basic Information
  basicInfo: z.object({
    name: z
      .string({ required_error: "Company name is required" })
      .min(2, { message: "Company name must be at least 2 characters" })
      .max(100, { message: "Company name must be at most 100 characters" })
      .trim(),
    legalName: z
      .string({ required_error: "Legal name is required" })
      .min(2, { message: "Legal name must be at least 2 characters" })
      .max(100, { message: "Legal name must be at most 100 characters" })
      .trim(),
    subdomain: z
      .string({ required_error: "Subdomain is required" })
      .min(3, { message: "Subdomain must be at least 3 characters" })
      .max(20, { message: "Subdomain must be at most 20 characters" })
      .regex(/^[a-z0-9-]+$/, {
        message: "Subdomain can only contain lowercase letters, numbers, and hyphens",
      })
      .trim(),
    website: z.string().url({ message: "Please enter a valid URL" }).or(z.literal("")).optional(),
    industry: z
      .string({ required_error: "Industry is required" })
      .min(2, { message: "Industry must be at least 2 characters" })
      .trim(),
    companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"], {
      required_error: "Company size is required",
    }),
  }),

  // Contact Information
  contactInfo: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Please enter a valid email address" })
      .trim(),
    phone: z
      .string({ required_error: "Phone number is required" })
      .regex(/^\+?[0-9]{10,15}$/, { message: "Please enter a valid phone number" })
      .trim(),
    address: z
      .string({ required_error: "Address is required" })
      .min(5, { message: "Address must be at least 5 characters" })
      .trim(),
    city: z
      .string({ required_error: "City is required" })
      .min(2, { message: "City must be at least 2 characters" })
      .trim(),
    state: z
      .string({ required_error: "State/Province is required" })
      .min(2, { message: "State/Province must be at least 2 characters" })
      .trim(),
    postalCode: z
      .string({ required_error: "Postal code is required" })
      .min(3, { message: "Postal code must be at least 3 characters" })
      .trim(),
    country: z
      .string({ required_error: "Country is required" })
      .min(2, { message: "Country must be at least 2 characters" })
      .trim(),
  }),

  // Legal Information - Now optional
  legalInfo: z
    .object({
      skipLegalInfo: z.boolean().optional(),
      taxId: z.string().min(5, { message: "Tax ID must be at least 5 characters" }).trim().optional().or(z.literal("")),
      registrationNumber: z
        .string()
        .min(3, { message: "Registration number must be at least 3 characters" })
        .trim()
        .optional()
        .or(z.literal("")),
      incorporationDate: z.string().optional().or(z.literal("")),
      legalEntity: z.enum(["LLC", "Corporation", "Partnership", "Sole Proprietorship", "Other"]).optional(),
    })
    .refine(
      (data) => {
        // If skipLegalInfo is true, we don't need to validate the other fields
        if (data.skipLegalInfo) {
          return true
        }

        // Otherwise, all fields are required
        return !!data.taxId && !!data.registrationNumber && !!data.incorporationDate && !!data.legalEntity
      },
      {
        message: "Please complete all legal information fields or check 'Skip legal information'",
        path: ["skipLegalInfo"],
      },
    ),

  // Primary Admin
  adminInfo: z.object({
    firstName: z
      .string({ required_error: "First name is required" })
      .min(2, { message: "First name must be at least 2 characters" })
      .trim(),
    lastName: z
      .string({ required_error: "Last name is required" })
      .min(2, { message: "Last name must be at least 2 characters" })
      .trim(),
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Please enter a valid email address" })
      .trim(),
    jobTitle: z
      .string({ required_error: "Job title is required" })
      .min(2, { message: "Job title must be at least 2 characters" })
      .trim(),
    phone: z
      .string({ required_error: "Phone number is required" })
      .regex(/^\+?[0-9]{10,15}$/, { message: "Please enter a valid phone number" })
      .trim(),
  }),

  // Terms and Privacy
  termsAndPrivacy: z.object({
    acceptTerms: z.literal(true, {
      required_error: "You must accept the terms and conditions",
      invalid_type_error: "You must accept the terms and conditions",
    }),
    acceptPrivacy: z.literal(true, {
      required_error: "You must accept the privacy policy",
      invalid_type_error: "You must accept the privacy policy",
    }),
  }),
})

// Type definitions for form values
export type CompanyRegistrationFormValues = z.infer<typeof companyRegistrationSchema>

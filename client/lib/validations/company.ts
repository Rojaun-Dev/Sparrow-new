import * as z from "zod"

/**
 * Company profile validation schema
 */
export const companyProfileSchema = z.object({
  name: z
    .string({ required_error: "Company name is required" })
    .min(2, { message: "Company name must be at least 2 characters" })
    .trim(),
  domain: z
    .string({ required_error: "Domain is required" })
    .regex(/^[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i, {
      message: "Please enter a valid domain (e.g., example.com)",
    })
    .trim(),
  address: z
    .string({ required_error: "Address is required" })
    .min(5, { message: "Address must be at least 5 characters" })
    .trim(),
  phone: z
    .string({ required_error: "Phone number is required" })
    .regex(/^\+?[0-9]{10,15}$/, { message: "Please enter a valid phone number" })
    .trim(),
  taxId: z
    .string({ required_error: "Tax ID is required" })
    .min(5, { message: "Tax ID must be at least 5 characters" })
    .trim(),
})

/**
 * Company branding validation schema
 */
export const companyBrandingSchema = z.object({
  logoUrl: z.string().url({ message: "Please enter a valid URL for the logo" }).optional(),
  primaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
      message: "Please enter a valid hex color code (e.g., #FF5733)",
    })
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
      message: "Please enter a valid hex color code (e.g., #FF5733)",
    })
    .optional(),
})

// Type definitions for form values
export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>
export type CompanyBrandingFormValues = z.infer<typeof companyBrandingSchema>

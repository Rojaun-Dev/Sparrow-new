import * as z from "zod"

/**
 * User profile validation schema
 */
export const userProfileSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, { message: "Name must be at least 2 characters" })
    .trim(),
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .trim(),
  trn: z
    .string({ required_error: "Tax Registration Number is required" })
    .regex(/^\d{9}$/, { message: "TRN must be a 9-digit number" })
    .trim(),
  phone: z
    .string({ required_error: "Phone number is required" })
    .regex(/^\+?[0-9]{10,15}$/, { message: "Please enter a valid phone number" })
    .trim(),
  address: z
    .string({ required_error: "Address is required" })
    .min(5, { message: "Address must be at least 5 characters" })
    .trim(),
})

/**
 * User preferences validation schema
 */
export const userPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  language: z
    .enum(["en", "es", "fr"], {
      errorMap: () => ({ message: "Please select a valid language" }),
    })
    .default("en"),
  timezone: z.string().min(1, { message: "Please select a timezone" }),
})

// Type definitions for form values
export type UserProfileFormValues = z.infer<typeof userProfileSchema>
export type UserPreferencesFormValues = z.infer<typeof userPreferencesSchema>

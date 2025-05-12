import * as z from "zod"

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" })
    .trim(),
  rememberMe: z.boolean().optional().default(false),
})

/**
 * Registration form validation schema
 */
export const registrationSchema = z
  .object({
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
    trn: z
      .string({ required_error: "Tax Registration Number is required" })
      .regex(/^\d{9}$/, { message: "TRN must be a 9-digit number" })
      .trim(),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" })
      .trim(),
    confirmPassword: z.string({ required_error: "Please confirm your password" }).trim(),
    terms: z.boolean({
      required_error: "You must accept the terms and conditions",
      invalid_type_error: "You must accept the terms and conditions",
    }).refine(val => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

/**
 * Password reset request validation schema
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .trim(),
})

/**
 * Password reset validation schema
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string({ required_error: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" })
      .trim(),
    confirmPassword: z.string({ required_error: "Please confirm your password" }).trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// Type definitions for form values
export type LoginFormValues = z.infer<typeof loginSchema>
export type RegistrationFormValues = z.infer<typeof registrationSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

import { Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormFieldFeedbackProps {
  isDirty?: boolean
  isValid?: boolean
  errorMessage?: string
  successMessage?: string
  showSuccessMessage?: boolean
  showErrorIcon?: boolean
  showSuccessIcon?: boolean
}

export function FormFieldFeedback({
  isDirty = false,
  isValid = false,
  errorMessage,
  successMessage,
  showSuccessMessage = true,
  showErrorIcon = true,
  showSuccessIcon = true,
}: FormFieldFeedbackProps) {
  // Don't show anything if the field hasn't been touched
  if (!isDirty) return null

  // Show success message and icon if valid
  if (isValid) {
    return showSuccessMessage && successMessage ? (
      <p className={cn("mt-1 flex items-center gap-1 text-xs text-green-600")}>
        {showSuccessIcon && <Check className="h-3.5 w-3.5" />}
        {successMessage}
      </p>
    ) : null
  }

  // Show error message and icon if invalid
  return errorMessage ? (
    <p className={cn("mt-1 flex items-center gap-1 text-xs text-red-500")}>
      {showErrorIcon && <AlertCircle className="h-3.5 w-3.5" />}
      {errorMessage}
    </p>
  ) : null
}

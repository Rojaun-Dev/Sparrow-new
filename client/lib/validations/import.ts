import * as z from "zod";

// Schema for CSV import form
export const importPackagesSchema = z.object({
  userId: z.string().optional(),
  file: z
    .instanceof(File, {
      message: "Please select a CSV file",
    })
    .refine(
      (file) => file.name.endsWith(".csv"),
      "Only CSV files are allowed"
    )
    .refine(
      (file) => file.size <= 1024 * 1024 * 5,
      "File size must be less than 5MB"
    ),
});

export type ImportPackagesFormValues = z.infer<typeof importPackagesSchema>;

// Schema for validating the structure of a package record from CSV
export const packageCsvRecordSchema = z.object({
  "Tracking Number": z.string().optional(),
  "Number": z.string().optional(),
  "Status": z.string().optional(),
  "Weight": z.string().optional(),
  "Weight (lb)": z.string().optional(),
  "Description": z.string().optional(),
  "Notes": z.string().optional(),
  // Add more fields as needed...
}).refine(
  (data) => data["Tracking Number"] || data["Number"],
  {
    message: "Either 'Tracking Number' or 'Number' must be provided",
    path: ["Tracking Number"]
  }
);

// Schema for validating parsed CSV data
export const parsedCsvSchema = z.object({
  data: z.array(z.record(z.string())).min(1, "CSV file must contain at least one data row"),
  headers: z.array(z.string()).min(1, "CSV file must have headers"),
}).refine(
  (parsed) => {
    // Check if required columns exist
    const headers = parsed.headers.map(h => h.toLowerCase());
    return headers.includes("tracking number") || headers.includes("number");
  },
  {
    message: "CSV must contain either 'Tracking Number' or 'Number' column",
    path: ["headers"]
  }
);

export type ParsedCsvData = z.infer<typeof parsedCsvSchema>; 
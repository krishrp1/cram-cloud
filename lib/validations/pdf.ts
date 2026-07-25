import { z } from "zod";
import { SEMESTERS } from "@/lib/constants";

const MAX_TITLE_LENGTH = 255;

export const uploadPdfSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(MAX_TITLE_LENGTH, `Title too long (max ${MAX_TITLE_LENGTH} characters)`),
  semester: z.enum(SEMESTERS as [string, ...string[]], { error: "Invalid semester" }),
});

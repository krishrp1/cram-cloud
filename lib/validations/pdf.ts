import { z } from "zod";
import { SEMESTERS, BRANCH_VALUES } from "@/lib/constants";

const MAX_TITLE_LENGTH = 255;

export const uploadPdfSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(MAX_TITLE_LENGTH, `Title too long (max ${MAX_TITLE_LENGTH} characters)`),
  branch: z.enum(BRANCH_VALUES, { error: "Invalid branch" }),
  semester: z.enum(SEMESTERS as [string, ...string[]], { error: "Invalid semester" }),
});

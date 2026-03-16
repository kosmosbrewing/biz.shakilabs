import { z } from "zod";

export const revenueSchema = z.number().min(0).max(100_000_000_000);
export const rateSchema = z.number().min(0).max(1);
export const salarySchema = z.number().min(0).max(10_000_000_000);
export const countSchema = z.number().int().min(0).max(100_000);
export const daysSchema = z.number().int().min(1).max(31);

function parseBySchema<T>(schema: z.ZodType<T>, value: unknown): T | null {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseRevenue(value: unknown): number | null {
  return parseBySchema(revenueSchema, value);
}

export function parseRate(value: unknown): number | null {
  return parseBySchema(rateSchema, value);
}

export function parseSalary(value: unknown): number | null {
  return parseBySchema(salarySchema, value);
}

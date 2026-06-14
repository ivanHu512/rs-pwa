import { z } from "zod";
const envSchema = z.object({ API_DOMAIN: z.string().url() });

export const env = envSchema.parse({
  API_DOMAIN: process.env.API_DOMAIN,
});

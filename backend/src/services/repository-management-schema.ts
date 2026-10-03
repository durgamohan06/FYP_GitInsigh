import { z } from "zod";

export const repositoryName = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_.-]+$/, "Use letters, numbers, dots, underscores, and hyphens.")
  .refine((name) => name !== "." && name !== "..", "Choose a repository name.");
export const collaboratorNames = z
  .array(
    z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/, "Enter valid GitHub usernames."),
  )
  .max(20, "Invite up to 20 members at a time.")
  .transform((names) => [...new Set(names.map((name) => name.toLowerCase()))]);
export const managementRequest = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    name: repositoryName,
    description: z.string().trim().max(350).default(""),
    private: z.boolean().default(true),
    members: collaboratorNames,
  }),
  z.object({ action: z.literal("invite"), name: repositoryName, members: collaboratorNames }),
]);
export const managementResult = z.object({
  repository: z.object({ name: z.string(), fullName: z.string(), url: z.string().url() }),
  invitations: z.array(
    z.object({
      username: z.string(),
      status: z.enum(["invited", "member", "failed"]),
      message: z.string(),
    }),
  ),
});
export type ManagementResult = z.infer<typeof managementResult>;

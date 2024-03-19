import { z } from "zod";

export const patrollingSchema = z.object({
  PatrolName: z.string().min(3, { message: "This field is required" }),
  PatrolArea: z.string().min(3, { message: "This field is required" }),
  PatrolLocation: z.object({
    latitude: z.string(),
    longitude: z.string(),
  }),
  PatrolTime: z.date(),
  PatrolAssignedGuardId: z
    .string()
    .min(3, { message: "This field is required" }),
  PatrolAssignedGuardName: z
    .string()
    .min(3, { message: "This field is required" }),
  PatrolCheckPoints: z.array(
    z.object({
      CheckPointId: z.string().min(3, { message: "This field is required" }),
      CheckPointName: z.string().min(3, { message: "This field is required" }),
      CheckPointStatus: z.enum(["checked", "not_checked"]),
      CheckPointCheckedTime: z.optional(z.date()),
      CheckPointFailureReason: z.string().nullable().optional(),
    })
  ),
  PatrolCurrentStatus: z.enum(["pending", "started", "completed"]),
  PatrolFailureReason: z.string().nullable().optional(),
  PatrolRestrictedRadius: z.coerce.number(),
  PatrolKeepGuardInRadiusOfLocation: z.boolean(),
});

export type PatrollingFormFields = z.infer<typeof patrollingSchema>;

import { z } from "zod";
import { numberString } from "./helper";

export const patrollingSchema = z.object({
  PatrolName: z.string().min(3, { message: "Patrol name is required" }),
  PatrolArea: z.string().min(3, { message: "Patrol area is required" }),
  PatrolLocation: z.object({
    latitude: z.string(),
    longitude: z.string(),
  }),
  PatrolLocationName: z
    .string()
    .min(3, { message: "Location name is required" }),
  PatrolTime: z.date(),
  PatrolAssignedGuardId: z
    .string()
    .min(3, { message: "This field is required" }),
  PatrolAssignedGuardName: z.string().min(3, { message: "Guard is required" }),
  PatrolAssignedGuardEmail: z.string().min(3, { message: "Guard is required" }),
  PatrolCheckPoints: z.array(z.string()),
  PatrolRestrictedRadius: numberString({
    message: "Restricted radius in meters is required",
  }),
  PatrolKeepGuardInRadiusOfLocation: z.boolean(),
});

export type PatrollingFormFields = z.infer<typeof patrollingSchema>;

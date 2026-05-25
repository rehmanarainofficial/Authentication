import { z } from "zod";

export const registerSchema = z.object({
  "body": z.object({
    "name": z
      .string({
        required_error: "Name is required",
      })
      .min(2, "Name must be at least 2 characters"),
    "email": z
      .string({
        required_error: "Email is required",
      })
      .email("Invalid email format"),
    "password": z
      .string({
        required_error: "Password is required",
      })
      .min(6, "Password must be at least 6 characters")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  }),
});

export const loginSchema = z.object({
  "body": z.object({
    "email": z
      .string({
        required_error: "Email is required",
      })
      .email("Invalid email format"),
    "password": z
      .string({
        required_error: "Password is required",
      })
      .min(6, "Password must be at least 6 characters")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter"),
  }),
});

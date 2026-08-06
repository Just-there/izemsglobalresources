import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin.from("messages").insert({
      name: data.name,
      email: data.email,
      phone: data.phone ? data.phone : null,
      message: data.message,
    });
    if (error) {
      console.error("[submitContact]", error);
      throw new Error("Your message could not be sent. Please try again.");
    }
    return { success: true } as const;
  });

const newsletterSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => newsletterSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .upsert({ email: data.email, is_active: true }, { onConflict: "email" });
    if (error) {
      console.error("[subscribeNewsletter]", error);
      throw new Error("Subscription failed. Please try again.");
    }
    return { success: true } as const;
  });
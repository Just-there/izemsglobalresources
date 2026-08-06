import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const quoteSchema = z.object({
  customer_name: z.string().trim().min(1, "Name is required").max(120),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  product_name: z.string().trim().max(200).optional().or(z.literal("")),
  category: z.string().trim().max(120).optional().or(z.literal("")),
  quantity: z.number().nonnegative().optional(),
  dimensions: z.string().trim().max(200).optional().or(z.literal("")),
  delivery_location: z.string().trim().max(200).optional().or(z.literal("")),
  urgency: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

/** Public: submit a quote request from the marketing site. */
export const submitQuote = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => quoteSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: inserted, error } = await supabaseAdmin
      .from("quotes")
      .insert({
        customer_name: data.customer_name,
        company: data.company || null,
        email: data.email,
        phone: data.phone || null,
        product_name: data.product_name || null,
        category: data.category || null,
        quantity: data.quantity ?? null,
        dimensions: data.dimensions || null,
        delivery_location: data.delivery_location || null,
        urgency: data.urgency,
        notes: data.notes || null,
      })
      .select("quote_number")
      .single();
    if (error) {
      console.error("[submitQuote]", error);
      throw new Error("Your quote request could not be sent. Please try again.");
    }
    // Best-effort notification for admins
    await supabaseAdmin.from("notifications").insert({
      title: "New quote request",
      body: `${data.customer_name} requested a quote (${inserted.quote_number}).`,
      type: "quote",
      link: "/admin/quotes",
    });
    await supabaseAdmin.from("activity_log").insert({
      actor_name: data.customer_name,
      action: "quote_received",
      entity_type: "quote",
      entity_id: inserted.quote_number,
      description: `Quote ${inserted.quote_number} received from ${data.customer_name}`,
    });
    return { success: true, quote_number: inserted.quote_number } as const;
  });

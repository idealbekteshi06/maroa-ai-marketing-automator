import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const PRODUCT_TO_PLAN: Record<string, { plan: string; price: number }> = {
  "prod_UDQJ9P4MuCqw3G": { plan: "growth", price: 49 },
  "prod_UDQKixhKr9Pxg7": { plan: "agency", price: 99 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
      },
    });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Fallback: parse without signature verification (for dev/testing)
      event = JSON.parse(body);
    }

    console.log(`[STRIPE-WEBHOOK] Event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_email || session.customer_details?.email;

      if (customerEmail && session.subscription) {
        // Get subscription to find the product
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const productId = subscription.items.data[0]?.price?.product as string;
        const planInfo = PRODUCT_TO_PLAN[productId];

        if (planInfo) {
          const { error } = await supabase
            .from("businesses")
            .update({ plan: planInfo.plan, plan_price: planInfo.price })
            .eq("email", customerEmail);

          console.log(`[STRIPE-WEBHOOK] Updated plan for ${customerEmail} to ${planInfo.plan}`, error ? `Error: ${error.message}` : "Success");
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;

      if (customer.email) {
        await supabase
          .from("businesses")
          .update({ plan: "free", plan_price: 0 })
          .eq("email", customer.email);

        console.log(`[STRIPE-WEBHOOK] Downgraded ${customer.email} to free`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[STRIPE-WEBHOOK] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});

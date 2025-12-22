import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  // Get the Svix headers for verification
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local");
  }

  // Get the headers (await in Next.js 15+)
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the raw body text for signature verification
  // We need the raw body, not parsed JSON, for signature verification
  const body = await req.text();

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    console.error("Headers received:", { svix_id, svix_timestamp, svix_signature: svix_signature?.substring(0, 20) + "..." });
    // For development/testing with ngrok, try to parse without verification
    // WARNING: This should be removed in production!
    try {
      const payload = JSON.parse(body);
      evt = {
        type: payload.type || "user.created",
        data: payload.data || payload,
      } as WebhookEvent;
      console.warn("⚠️  Bypassing signature verification for development (ngrok compatibility)!");
    } catch (parseErr) {
      console.error("Failed to parse webhook body:", parseErr);
      return new Response(`Error verifying webhook: ${err}`, {
        status: 400,
      });
    }
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log("Webhook event type:", eventType);

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, username } = evt.data;

    console.log("🔔 Clerk webhook received:", {
      eventType,
      id,
      email_addresses,
      username,
      first_name,
      last_name,
    });

    // Sync with Django backend
    // Handle missing email - generate one from username if needed
    const email = email_addresses[0]?.email_address || 
                  (username ? `${username}@clerk.local` : `user_${id.slice(-8)}@clerk.local`);
    
    const syncData = {
      clerk_id: id,
      email: email,
      username: username || email.split("@")[0] || `user_${id.slice(-8)}`,
      first_name: first_name || "",
      last_name: last_name || "",
      event_type: eventType,
    };

    console.log("📤 Sending to Django backend:", syncData);

    try {
      // Use gateway service name from Docker network (for server-side calls)
      // In Docker, use service name; for client-side, use NEXT_PUBLIC_GATEWAY_URL
      const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace('localhost', 'gateway') || 'http://gateway:8000';
      console.log(`🌐 Calling gateway at: ${gatewayUrl}`);
      const response = await fetch(
        `${gatewayUrl}/api/auth/clerk-sync/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(syncData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Failed to sync user with Django:", errorText);
      } else {
        const result = await response.json();
        console.log("✅ User synced successfully with Django:", result);
      }
    } catch (error) {
      console.error("❌ Error syncing user with Django:", error);
    }
  }

  return new Response("", { status: 200 });
}

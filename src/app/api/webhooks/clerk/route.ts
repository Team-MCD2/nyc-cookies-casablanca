import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const sb = createAdminClient();
    const clerk = await clerkClient();
    
    // Check if the user signed up via an invitation
    const unsafeMetadata = evt.data.unsafe_metadata as { invitationToken?: string } | undefined;
    const token = unsafeMetadata?.invitationToken;

    if (token) {
      // 1. Verify invitation
      const { data: inv } = await sb.from('invitations').select('*').eq('token', token).single();
      
      if (inv && !inv.used_at) {
        // 2. Create the Pro row
        const { error: proError } = await sb
          .from('pros')
          .insert({
            clerk_user_id: id,
            company: inv.company,
            contact_name: inv.contact_name,
            email: evt.data.email_addresses?.[0]?.email_address ?? inv.email,
            phone: inv.phone,
            payment_terms_days: 30,
            status: 'active'
          });

        if (!proError) {
          // 3. Mark invitation as used
          await sb.from('invitations').update({ used_at: new Date().toISOString() }).eq('token', token);
          
          // 4. Give the user the 'pro' role in Clerk
          await clerk.users.updateUserMetadata(id!, {
            publicMetadata: { role: 'pro' }
          });

          return new Response('Pro user linked successfully', { status: 200 });
        } else {
          console.error("Failed to update pro row:", proError);
        }
      }
    }

    // Default to B2C Customer if no token or token invalid
    const email = evt.data.email_addresses?.[0]?.email_address;
    const name = [evt.data.first_name, evt.data.last_name].filter(Boolean).join(' ') || email;

    const { error: custError } = await sb.from('customers').insert({
      clerk_user_id: id,
      email: email,
      name: name,
    });

    if (custError) {
      console.error("Failed to create customer:", custError);
    } else {
      // Set default role to B2C
      await clerk.users.updateUserMetadata(id!, {
        publicMetadata: { role: 'b2c' }
      });
    }
  }

  return new Response('', { status: 200 });
}

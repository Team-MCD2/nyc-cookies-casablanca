import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.SITE_API_SECRET || "my-super-secret";

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === '1';

  const sb = createAdminClient();
  let query = sb
    .from('pros')
    .select('id, company, contact_name, phone, status, email')
    .order('company', { ascending: true });

  if (!all) {
    query = query.eq('status', 'active');
  }

  const { data: pros, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pros });
}

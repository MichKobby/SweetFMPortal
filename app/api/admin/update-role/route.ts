import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/types';

const VALID_ROLES: UserRole[] = ['admin', 'manager', 'employee', 'client'];

export async function POST(request: Request) {
  // 1. Verify the caller is an authenticated admin
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: admin role required' }, { status: 403 });
  }

  // 2. Parse and validate the request body
  let userId: string;
  let role: UserRole;
  try {
    const body = await request.json();
    userId = body.userId;
    role = body.role;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
  }

  // 3. Prevent changing your own role (to avoid accidental self-demotion)
  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
  }

  // 4. Update the role in the profiles table
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (updateError) {
    console.error('Failed to update role:', updateError);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

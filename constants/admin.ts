import type { User } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['mcreyes@tecno.unca.edu.ar'];

export function isAdminUser(user: User | null): boolean {
  const email = user?.email?.toLowerCase();
  if (!email) {
    return false;
  }

  return ADMIN_EMAILS.includes(email);
}

'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

<<<<<<< HEAD
export async function updateProfile(formData: {
  display_name: string
  bio: string | null
}): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_profiles')
    .update({
      display_name: formData.display_name,
      bio: formData.bio || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return {}
}

=======
/**
 * Toggle the daily email digest preference for the current user.
 */
>>>>>>> 9d43a6c (feat: add email digest notifications via Resend)
export async function setEmailDigests(
  enabled: boolean
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
<<<<<<< HEAD
  const { data: { user } } = await supabase.auth.getUser()
=======
  const {
    data: { user },
  } = await supabase.auth.getUser()
>>>>>>> 9d43a6c (feat: add email digest notifications via Resend)

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_profiles')
    .update({ email_digests_enabled: enabled })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/settings/notifications')
  return {}
}

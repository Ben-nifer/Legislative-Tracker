'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type Stance = 'support' | 'oppose' | 'neutral' | 'watching'

/**
 * Set or clear a user's stance on a piece of legislation.
 * Pass `null` to remove the stance entirely.
 */
export async function setStance(
  legislationId: string,
  stance: Stance | null
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  if (stance === null) {
    const { error } = await supabase
      .from('user_stances')
      .delete()
      .match({ user_id: user.id, legislation_id: legislationId })

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('user_stances').upsert(
      {
        user_id: user.id,
        legislation_id: legislationId,
        stance,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,legislation_id' }
    )

    if (error) return { error: error.message }
  }

  revalidatePath('/legislation')
  revalidatePath('/')
  return {}
}

/**
 * Toggle a bookmark on a piece of legislation.
 * Returns the new bookmarked state.
 */
export async function toggleBookmark(
  legislationId: string
): Promise<{ bookmarked: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { bookmarked: false, error: 'Not authenticated' }

  // Check if already bookmarked
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('legislation_id')
    .match({ user_id: user.id, legislation_id: legislationId })
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .match({ user_id: user.id, legislation_id: legislationId })

    if (error) return { bookmarked: true, error: error.message }

    revalidatePath('/legislation')
    revalidatePath('/')
    return { bookmarked: false }
  } else {
    const { error } = await supabase.from('bookmarks').insert({
      user_id: user.id,
      legislation_id: legislationId,
    })

    if (error) return { bookmarked: false, error: error.message }

    revalidatePath('/legislation')
    revalidatePath('/')
    return { bookmarked: true }
  }
}

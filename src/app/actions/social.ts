'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Council members ──────────────────────────────────────────────────────────

export async function followLegislator(
  legislatorId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('legislator_follows')
    .insert({ user_id: user.id, legislator_id: legislatorId })

  if (error) return { error: error.message }

  revalidatePath('/following')
  return {}
}

export async function unfollowLegislator(
  legislatorId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('legislator_follows')
    .delete()
    .match({ user_id: user.id, legislator_id: legislatorId })

  if (error) return { error: error.message }

  revalidatePath('/following')
  return {}
}

// ── Topics ───────────────────────────────────────────────────────────────────

export async function followTopic(
  topicId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('topic_follows')
    .insert({ user_id: user.id, topic_id: topicId })

  if (error) return { error: error.message }

  revalidatePath('/following')
  return {}
}

export async function unfollowTopic(
  topicId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('topic_follows')
    .delete()
    .match({ user_id: user.id, topic_id: topicId })

  if (error) return { error: error.message }

  revalidatePath('/following')
  return {}
}

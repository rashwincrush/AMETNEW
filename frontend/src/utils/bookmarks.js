// Shared helper for toggling job bookmark via RPC
export async function toggleBookmarkRPC(supabase, jobId) {
  const { data, error } = await supabase.rpc('toggle_job_bookmark', { p_job_id: jobId });
  if (error) throw error;
  // RPC returns boolean: true => bookmarked, false => unbookmarked
  return data === true;
}

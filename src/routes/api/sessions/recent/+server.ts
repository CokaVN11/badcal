import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRecentSessions } from '$lib/server/sharing/session-store.js';

export const GET: RequestHandler = async ({ url }) => {
  const limit = Number(url.searchParams.get('limit') ?? 5);
  const sessions = await getRecentSessions(limit);
  return json(sessions, { status: 200 });
};

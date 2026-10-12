import { createClient } from '@supabase/supabase-js';

const USERNAME_COOKIE = 'spaceDodgerUsername';
const HIGHSCORE_COOKIE = 'spaceDodgerHighscore';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,16}$/;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('YOUR_SUPABASE') &&
  !supabaseAnonKey.includes('YOUR_SUPABASE')
);
const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

function readCookie(name) {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));
  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.slice(name.length + 1));
  } catch {
    return null;
  }
}

function writeCookie(name, value) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax${secure}`;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add your project URL and anon key to the .env file, then restart Vite.');
  }
  return supabase;
}

function throwOnError(error) {
  if (error) throw new Error(error.message);
}

export const Leaderboard = {
  isConfigured,

  getSavedUsername() {
    return readCookie(USERNAME_COOKIE);
  },

  getSavedHighscore() {
    const value = Number.parseInt(readCookie(HIGHSCORE_COOKIE) || '0', 10);
    return Number.isFinite(value) ? value : 0;
  },

  clearSavedUsername() {
    document.cookie = `${USERNAME_COOKIE}=; max-age=0; path=/; SameSite=Lax`;
  },

  validateUsername(username) {
    if (!USERNAME_PATTERN.test(username)) {
      throw new Error('Use 3-16 characters: letters, numbers, and underscores only.');
    }
  },

  async getPlayer(username) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('leaderboard')
      .select('username, highscore, isactive')
      .eq('username', username)
      .maybeSingle();
    throwOnError(error);
    return data?.isactive ? data : null;
  },

  async registerPlayer(username) {
    this.validateUsername(username);
    const client = requireSupabase();
    const { data: existing, error: lookupError } = await client
      .from('leaderboard')
      .select('username')
      .ilike('username', username)
      .limit(1)
      .maybeSingle();
    throwOnError(lookupError);
    if (existing) throw new Error('That username is already taken. Please choose another.');

    const { data, error } = await client
      .from('leaderboard')
      .insert({ username, highscore: 0, date: new Date().toISOString(), isactive: true })
      .select('username, highscore, isactive')
      .single();
    if (error?.code === '23505') {
      throw new Error('That username is already taken. Please choose another.');
    }
    throwOnError(error);
    this.savePlayerCookies(data.username, data.highscore);
    return data;
  },

  savePlayerCookies(username, highscore) {
    writeCookie(USERNAME_COOKIE, username);
    writeCookie(HIGHSCORE_COOKIE, String(highscore));
  },

  async getTopFive() {
    const client = requireSupabase();
    const { data, error } = await client
      .from('leaderboard')
      .select('username, highscore')
      .eq('isactive', true)
      .order('highscore', { ascending: false })
      .order('date', { ascending: true })
      .limit(5);
    throwOnError(error);
    return data;
  },

  async submitHighscore(username, score) {
    const client = requireSupabase();
    const { data: player, error: lookupError } = await client
      .from('leaderboard')
      .select('username, highscore, isactive')
      .eq('username', username)
      .maybeSingle();
    throwOnError(lookupError);
    if (!player?.isactive) {
      throw new Error('Your player record is unavailable. Reload the game and try again.');
    }

    let highscore = player.highscore;
    if (score > highscore) {
      const { data: updated, error: updateError } = await client
        .from('leaderboard')
        .update({ highscore: score, date: new Date().toISOString() })
        .eq('username', username)
        .lt('highscore', score)
        .select('highscore')
        .maybeSingle();
      throwOnError(updateError);

      if (updated) {
        highscore = updated.highscore;
      } else {
        const latestPlayer = await this.getPlayer(username);
        if (!latestPlayer) {
          throw new Error('Your player record is unavailable. Reload the game and try again.');
        }
        highscore = latestPlayer.highscore;
      }
    }

    this.savePlayerCookies(username, highscore);
    return highscore;
  }
};

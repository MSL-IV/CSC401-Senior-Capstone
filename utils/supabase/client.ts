import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Supabase environment variables are not set. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are configured.'
    );
  }
  
  // Create a supabase client on the browser with project's credentials
  return createBrowserClient(
    supabaseUrl,
    supabasePublishableKey
  );
}
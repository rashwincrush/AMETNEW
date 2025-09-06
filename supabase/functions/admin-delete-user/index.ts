import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allow localhost and your prod domain - expanded with more common development patterns
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173", // Vite default
  "http://127.0.0.1:5173",
  "http://localhost:8000", // Alternative dev port
  "http://127.0.0.1:8000",
  "https://ametalumni.in",
  "https://www.ametalumni.in",
  // Add staging/preview URLs here if you have them
]);

// In development mode, allow all origins for simplicity
// Use ENV env var to toggle: set ENV=production in prod deployments
const IS_DEV = (Deno.env.get("ENV") ?? "development") !== "production";

function cors(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  
  // In development, accept any origin
  if (IS_DEV) {
    console.log(`Development mode: accepting any origin (${origin})`);
    return {
      "access-control-allow-origin": origin || "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "*",
      "access-control-allow-credentials": "true",
      "access-control-max-age": "86400",
      "vary": "Origin",
      "x-cors-debug": JSON.stringify({ mode: "development", origin }),
    };
  }
  
  // Production mode - stricter CORS
  const isLocalhost = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
  const allowOrigin = ALLOWED_ORIGINS.has(origin) || isLocalhost ? origin : "";

  // Log details about CORS for debugging
  const corsDebugInfo = {
    requestOrigin: origin,
    isLocalhost,
    originAllowed: ALLOWED_ORIGINS.has(origin) || isLocalhost,
    allowOriginValue: allowOrigin || "(none set)",
    allowedOriginsList: Array.from(ALLOWED_ORIGINS),
  };
  
  console.log("CORS debug info:", corsDebugInfo);
  
  return {
    "access-control-allow-origin": allowOrigin || "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-supabase-auth",
    "access-control-allow-credentials": "true",
    "access-control-max-age": "86400",
    "vary": "Origin",
    "x-cors-debug": JSON.stringify(corsDebugInfo),
  };
}
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors(req) },
  });

serve(async (req) => {
  // 1) Handle preflight with explicit 200 status and permissive CORS headers
  if (req.method === "OPTIONS") {
    // In development, accept preflight from any origin
    const origin = req.headers.get("origin") ?? "";
    console.log(`OPTIONS preflight request from ${origin}`);
    
    return new Response(null, { 
      status: 204, // No content is the standard response for OPTIONS
      headers: { 
        "access-control-allow-origin": origin || "*",
        "access-control-allow-methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "access-control-allow-headers": "DNT, User-Agent, X-Requested-With, If-Modified-Since, Cache-Control, Content-Type, Range, Authorization, X-Client-Info, apikey, X-Supabase-Auth",
        "access-control-max-age": "86400",
        "access-control-allow-credentials": "true",
        "content-length": "0"
      } 
    });
  }

  // 2) Only POST allowed
  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const { userId } = await req.json();
    if (!userId) return json(req, { error: "Missing userId" }, 400);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!url || !anon || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing environment variables: SUPABASE_URL, SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY");
      return json(req, { 
        error: "Server configuration error",
        details: "Missing service role credentials"
      }, 500);
    }
    
    const admin = createClient(url, SUPABASE_SERVICE_ROLE_KEY);
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    // Identify caller
    const { data: me, error: meErr } = await caller.auth.getUser();
    if (meErr || !me?.user) return json(req, { error: "Unauthorized" }, 401);

    // Admin client was already created with service role above

    // Authorize: only admin/super_admin
    const { data: callerProf, error: profErr } = await admin
      .from("profiles")
      .select("role")
      .eq("id", me.user.id)
      .single();
    if (profErr || !callerProf || !["admin", "super_admin"].includes(callerProf.role)) {
      return json(req, { error: "Forbidden" }, 403);
    }

    // Optional: only super_admin can delete admin/super_admin
    const { data: targetProf } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (["admin", "super_admin"].includes(targetProf?.role ?? "") && callerProf.role !== "super_admin") {
      return json(req, { error: "Only super_admin can delete admin/super_admin" }, 403);
    }

    // Purge app data (define function in SQL once). If missing or fails, log and continue.
    const { error: purgeErr } = await admin.rpc("purge_user_data", { uid: userId });
    if (purgeErr) {
      console.warn("purge_user_data failed, continuing with auth deletion:", purgeErr.message);
    }

    // Delete Auth user
    try {
      console.log(`Attempting to delete auth user: ${userId}`);
      const { error: delErr } = await admin.auth.admin.deleteUser(userId);
      
      if (delErr) {
        console.error(`Auth delete failed for ${userId}:`, delErr);
        return json(req, { 
          error: "Auth delete failed", 
          details: delErr.message,
          code: delErr.code
        }, 500);
      }
      
      console.log(`Successfully deleted auth user: ${userId}`);
    } catch (deleteError) {
      console.error(`Exception during auth deletion for ${userId}:`, deleteError);
      return json(req, { 
        error: "Auth delete exception", 
        details: String(deleteError)
      }, 500);
    }

    // Optional: log action
    await admin.from("admin_actions").insert({
      action_type: "delete_user",
      target_type: "user",
      target_id: userId,
      description: "Deleted via admin-delete-user",
    });

    return json(req, { ok: true }, 200);
  } catch (e) {
    return json(req, { error: "Server error", details: String(e) }, 500);
  }
});

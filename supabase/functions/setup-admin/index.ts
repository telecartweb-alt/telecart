import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get admin email and password from request body
    const { email, password } = await req.json();
    
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Check if admin already exists in admin_users table
    const { data: existingAdmin } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ success: true, message: "Admin already exists", email }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;

    const userId = data.user.id;

    // Add to admin_users table
    const { error: adminError } = await supabaseAdmin
      .from("admin_users")
      .insert({ id: userId, email, is_admin: true });
    if (adminError) throw adminError;

    return new Response(JSON.stringify({ success: true, email, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

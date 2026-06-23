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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if admin user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const adminEmail = "shib@shibampress.local";
    let adminUser = existingUsers?.users?.find((u: any) => u.email === adminEmail) || null;

    if (!adminUser) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: "777492635",
        email_confirm: true,
        user_metadata: { username: "shib" },
      });
      if (error) throw error;
      adminUser = created.user;
    }

    if (!adminUser?.id) {
      throw new Error("Admin user missing after create/list");
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: adminUser.id, role: "admin" }, { onConflict: "user_id,role" });
    if (roleError) throw roleError;

    return new Response(JSON.stringify({ message: "Admin user ready", user_id: adminUser.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

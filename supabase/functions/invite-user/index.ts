import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SENHA_INICIAL = Deno.env.get("DEFAULT_USER_PASSWORD") ?? "mandotti2026";

type Grant = { rota: string; pode_ver: boolean; pode_editar: boolean };
type InviteBody = {
  email: string;
  nome: string;
  perfil: "admin" | "funcionario" | "contabilidade";
  grants?: Grant[];
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Não autenticado." }, 401);
  }

  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: caller },
  } = await callerClient.auth.getUser();

  if (!caller) {
    return jsonResponse({ error: "Não autenticado." }, 401);
  }

  const { data: isAdmin, error: isAdminError } = await callerClient.rpc("is_admin", {
    _user_id: caller.id,
  });

  if (isAdminError || !isAdmin) {
    return jsonResponse({ error: "Apenas administradores podem convidar usuários." }, 403);
  }

  let body: InviteBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Corpo da requisição inválido." }, 400);
  }

  const { email, nome, perfil, grants = [] } = body;

  if (!email || !nome || !perfil) {
    return jsonResponse({ error: "email, nome e perfil são obrigatórios." }, 400);
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: SENHA_INICIAL,
    email_confirm: true,
    user_metadata: {
      nome,
      must_change_password: true,
    },
  });

  if (createError || !createData.user) {
    const status = createError?.status === 422 ? 409 : 500;
    return jsonResponse({ error: createError?.message ?? "Falha ao criar usuário." }, status);
  }

  const userId = createData.user.id;

  const { error: updateError } = await adminClient
    .from("perfis")
    .update({ perfil, nome })
    .eq("user_id", userId);

  if (updateError) {
    return jsonResponse(
      { error: `Usuário criado, mas falhou ao definir perfil: ${updateError.message}` },
      500,
    );
  }

  if (perfil === "funcionario" && grants.length) {
    const { error: grantsError } = await adminClient.from("perfis_acesso").upsert(
      grants.map((g) => ({
        user_id: userId,
        rota: g.rota,
        pode_ver: g.pode_ver,
        pode_editar: g.pode_editar,
      })),
      { onConflict: "user_id,rota" },
    );

    if (grantsError) {
      return jsonResponse(
        { error: `Usuário criado, mas falhou ao salvar acessos: ${grantsError.message}` },
        500,
      );
    }
  }

  return jsonResponse(
    {
      ok: true,
      user_id: userId,
      senha_inicial: SENHA_INICIAL,
    },
    200,
  );
});

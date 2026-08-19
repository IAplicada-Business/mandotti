export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categorias_financeiras: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["categoria_tipo"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          id?: string
          nome: string
          tipo?: Database["public"]["Enums"]["categoria_tipo"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["categoria_tipo"]
          updated_at?: string
        }
        Relationships: []
      }
      certificados: {
        Row: {
          ativo: boolean
          cnpj: string | null
          created_at: string
          deleted_at: string | null
          emissor_id: string
          id: string
          nome: string
          senha_referencia: string | null
          tipo: Database["public"]["Enums"]["tipo_certificado"]
          titular: string | null
          updated_at: string
          validade: string | null
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          deleted_at?: string | null
          emissor_id: string
          id?: string
          nome: string
          senha_referencia?: string | null
          tipo?: Database["public"]["Enums"]["tipo_certificado"]
          titular?: string | null
          updated_at?: string
          validade?: string | null
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          deleted_at?: string | null
          emissor_id?: string
          id?: string
          nome?: string
          senha_referencia?: string | null
          tipo?: Database["public"]["Enums"]["tipo_certificado"]
          titular?: string | null
          updated_at?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificados_emissor_id_fkey"
            columns: ["emissor_id"]
            isOneToOne: false
            referencedRelation: "emissores"
            referencedColumns: ["id"]
          },
        ]
      }
      emissores: {
        Row: {
          ativo: boolean
          cep: string | null
          cidade: string | null
          cnpj: string
          created_at: string
          deleted_at: string | null
          email: string | null
          endereco: string | null
          id: string
          inscricao_estadual: string | null
          nome_fantasia: string | null
          razao_social: string
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome_fantasia?: string | null
          razao_social: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      extrato_movimentos: {
        Row: {
          conciliado: boolean
          created_at: string
          data_movimento: string
          deleted_at: string | null
          descricao: string
          extrato_id: string
          id: string
          lancamento_id: string | null
          tipo: Database["public"]["Enums"]["movimento_tipo"]
          updated_at: string
          valor: number
        }
        Insert: {
          conciliado?: boolean
          created_at?: string
          data_movimento: string
          deleted_at?: string | null
          descricao?: string
          extrato_id: string
          id?: string
          lancamento_id?: string | null
          tipo: Database["public"]["Enums"]["movimento_tipo"]
          updated_at?: string
          valor: number
        }
        Update: {
          conciliado?: boolean
          created_at?: string
          data_movimento?: string
          deleted_at?: string | null
          descricao?: string
          extrato_id?: string
          id?: string
          lancamento_id?: string | null
          tipo?: Database["public"]["Enums"]["movimento_tipo"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "extrato_movimentos_extrato_id_fkey"
            columns: ["extrato_id"]
            isOneToOne: false
            referencedRelation: "extratos_bancarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extrato_movimentos_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      extratos_bancarios: {
        Row: {
          banco: string
          conta_mascara: string | null
          created_at: string
          deleted_at: string | null
          emissor_id: string
          id: string
          nome_arquivo: string
          periodo_fim: string | null
          periodo_inicio: string | null
          updated_at: string
        }
        Insert: {
          banco?: string
          conta_mascara?: string | null
          created_at?: string
          deleted_at?: string | null
          emissor_id: string
          id?: string
          nome_arquivo: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          updated_at?: string
        }
        Update: {
          banco?: string
          conta_mascara?: string | null
          created_at?: string
          deleted_at?: string | null
          emissor_id?: string
          id?: string
          nome_arquivo?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extratos_bancarios_emissor_id_fkey"
            columns: ["emissor_id"]
            isOneToOne: false
            referencedRelation: "emissores"
            referencedColumns: ["id"]
          },
        ]
      }
      fazendas: {
        Row: {
          area_hectares: number | null
          ativo: boolean
          car: string | null
          codigo: string | null
          created_at: string
          deleted_at: string | null
          emissor_id: string
          id: string
          inscricao_estadual: string | null
          municipio: string | null
          nome: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          area_hectares?: number | null
          ativo?: boolean
          car?: string | null
          codigo?: string | null
          created_at?: string
          deleted_at?: string | null
          emissor_id: string
          id?: string
          inscricao_estadual?: string | null
          municipio?: string | null
          nome: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          area_hectares?: number | null
          ativo?: boolean
          car?: string | null
          codigo?: string | null
          created_at?: string
          deleted_at?: string | null
          emissor_id?: string
          id?: string
          inscricao_estadual?: string | null
          municipio?: string | null
          nome?: string
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fazendas_emissor_id_fkey"
            columns: ["emissor_id"]
            isOneToOne: false
            referencedRelation: "emissores"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          categoria_id: string | null
          conciliado: boolean
          created_at: string
          data_competencia: string
          data_pagamento: string | null
          deleted_at: string | null
          descricao: string
          emissor_id: string
          fornecedor: string | null
          id: string
          origem: Database["public"]["Enums"]["lancamento_origem"]
          tipo: Database["public"]["Enums"]["lancamento_tipo"]
          updated_at: string
          valor: number
          xml_chave: string | null
        }
        Insert: {
          categoria_id?: string | null
          conciliado?: boolean
          created_at?: string
          data_competencia?: string
          data_pagamento?: string | null
          deleted_at?: string | null
          descricao?: string
          emissor_id: string
          fornecedor?: string | null
          id?: string
          origem?: Database["public"]["Enums"]["lancamento_origem"]
          tipo?: Database["public"]["Enums"]["lancamento_tipo"]
          updated_at?: string
          valor: number
          xml_chave?: string | null
        }
        Update: {
          categoria_id?: string | null
          conciliado?: boolean
          created_at?: string
          data_competencia?: string
          data_pagamento?: string | null
          deleted_at?: string | null
          descricao?: string
          emissor_id?: string
          fornecedor?: string | null
          id?: string
          origem?: Database["public"]["Enums"]["lancamento_origem"]
          tipo?: Database["public"]["Enums"]["lancamento_tipo"]
          updated_at?: string
          valor?: number
          xml_chave?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_emissor_id_fkey"
            columns: ["emissor_id"]
            isOneToOne: false
            referencedRelation: "emissores"
            referencedColumns: ["id"]
          },
        ]
      }
      maquinarios: {
        Row: {
          ano: number | null
          ativo: boolean
          categoria: string
          chassi_serie: string | null
          cor: string | null
          created_at: string
          deleted_at: string | null
          emissor_id: string
          fazenda_id: string | null
          fazenda_nome: string | null
          id: string
          marca: string | null
          modelo: string | null
          nome: string
          ordem: number
          updated_at: string
          valor_aquisicao: number | null
        }
        Insert: {
          ano?: number | null
          ativo?: boolean
          categoria?: string
          chassi_serie?: string | null
          cor?: string | null
          created_at?: string
          deleted_at?: string | null
          emissor_id: string
          fazenda_id?: string | null
          fazenda_nome?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome: string
          ordem?: number
          updated_at?: string
          valor_aquisicao?: number | null
        }
        Update: {
          ano?: number | null
          ativo?: boolean
          categoria?: string
          chassi_serie?: string | null
          cor?: string | null
          created_at?: string
          deleted_at?: string | null
          emissor_id?: string
          fazenda_id?: string | null
          fazenda_nome?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome?: string
          ordem?: number
          updated_at?: string
          valor_aquisicao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maquinarios_emissor_id_fkey"
            columns: ["emissor_id"]
            isOneToOne: false
            referencedRelation: "emissores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maquinarios_fazenda_id_fkey"
            columns: ["fazenda_id"]
            isOneToOne: false
            referencedRelation: "fazendas"
            referencedColumns: ["id"]
          },
        ]
      }
      papeis_usuario: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      passivos: {
        Row: {
          apos_jun_2030: number
          ate_jun_2026: number
          contrato_finalidade: string
          created_at: string
          deleted_at: string | null
          emissor_id: string
          id: string
          instituicao: string
          jul26_jun27: number
          jul27_jun28: number
          jul28_jun29: number
          jul29_jun30: number
          origem: string
          saldo_devedor: number | null
          sem_cronograma: number
          taxa_juros: number | null
          total_projetado: number | null
          updated_at: string
          vencimento_final: string | null
        }
        Insert: {
          apos_jun_2030?: number
          ate_jun_2026?: number
          contrato_finalidade: string
          created_at?: string
          deleted_at?: string | null
          emissor_id: string
          id?: string
          instituicao: string
          jul26_jun27?: number
          jul27_jun28?: number
          jul28_jun29?: number
          jul29_jun30?: number
          origem?: string
          saldo_devedor?: number | null
          sem_cronograma?: number
          taxa_juros?: number | null
          total_projetado?: number | null
          updated_at?: string
          vencimento_final?: string | null
        }
        Update: {
          apos_jun_2030?: number
          ate_jun_2026?: number
          contrato_finalidade?: string
          created_at?: string
          deleted_at?: string | null
          emissor_id?: string
          id?: string
          instituicao?: string
          jul26_jun27?: number
          jul27_jun28?: number
          jul28_jun29?: number
          jul29_jun30?: number
          origem?: string
          saldo_devedor?: number | null
          sem_cronograma?: number
          taxa_juros?: number | null
          total_projetado?: number | null
          updated_at?: string
          vencimento_final?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passivos_emissor_id_fkey"
            columns: ["emissor_id"]
            isOneToOne: false
            referencedRelation: "emissores"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["perfil_usuario"]
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      perfis_acesso: {
        Row: {
          created_at: string
          id: string
          pode_editar: boolean
          pode_ver: boolean
          rota: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pode_editar?: boolean
          pode_ver?: boolean
          rota: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pode_editar?: boolean
          pode_ver?: boolean
          rota?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proporcoes_emissores: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          emissor_a_id: string
          emissor_b_id: string
          id: string
          percentual_a: number
          updated_at: string
          vigente_desde: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          emissor_a_id: string
          emissor_b_id: string
          id?: string
          percentual_a?: number
          updated_at?: string
          vigente_desde?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          emissor_a_id?: string
          emissor_b_id?: string
          id?: string
          percentual_a?: number
          updated_at?: string
          vigente_desde?: string
        }
        Relationships: [
          {
            foreignKeyName: "proporcoes_emissores_emissor_a_id_fkey"
            columns: ["emissor_a_id"]
            isOneToOne: false
            referencedRelation: "emissores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proporcoes_emissores_emissor_b_id_fkey"
            columns: ["emissor_b_id"]
            isOneToOne: false
            referencedRelation: "emissores"
            referencedColumns: ["id"]
          },
        ]
      }
      xml_importacoes: {
        Row: {
          categoria_sugerida: string | null
          chave_nfe: string | null
          created_at: string
          deleted_at: string | null
          emissor_id: string
          emitente: string | null
          erro: string | null
          id: string
          lancamento_id: string | null
          nome_arquivo: string
          payload_resumo: Json | null
          status: Database["public"]["Enums"]["xml_status"]
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          categoria_sugerida?: string | null
          chave_nfe?: string | null
          created_at?: string
          deleted_at?: string | null
          emissor_id: string
          emitente?: string | null
          erro?: string | null
          id?: string
          lancamento_id?: string | null
          nome_arquivo: string
          payload_resumo?: Json | null
          status?: Database["public"]["Enums"]["xml_status"]
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          categoria_sugerida?: string | null
          chave_nfe?: string | null
          created_at?: string
          deleted_at?: string | null
          emissor_id?: string
          emitente?: string | null
          erro?: string | null
          id?: string
          lancamento_id?: string | null
          nome_arquivo?: string
          payload_resumo?: Json | null
          status?: Database["public"]["Enums"]["xml_status"]
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "xml_importacoes_emissor_id_fkey"
            columns: ["emissor_id"]
            isOneToOne: false
            referencedRelation: "emissores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xml_importacoes_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_contabilidade: { Args: { _user_id: string }; Returns: boolean }
      pode_editar: { Args: { _user_id: string }; Returns: boolean }
      pode_editar_rota: {
        Args: { _rota: string; _user_id: string }
        Returns: boolean
      }
      pode_ver_rota: {
        Args: { _rota: string; _user_id: string }
        Returns: boolean
      }
      rota_e_fiscal_financeira: { Args: { _rota: string }; Returns: boolean }
    }
    Enums: {
      app_role: "administrador" | "gestor" | "operador" | "visualizador"
      categoria_tipo: "despesa" | "receita" | "folha" | "outros"
      lancamento_origem: "manual" | "xml" | "extrato" | "romaneio"
      lancamento_tipo: "despesa" | "receita" | "transferencia"
      movimento_tipo: "credito" | "debito"
      perfil_usuario: "admin" | "funcionario" | "contabilidade"
      tipo_certificado: "A1" | "A3"
      xml_status: "pendente" | "processado" | "erro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["administrador", "gestor", "operador", "visualizador"],
      categoria_tipo: ["despesa", "receita", "folha", "outros"],
      lancamento_origem: ["manual", "xml", "extrato", "romaneio"],
      lancamento_tipo: ["despesa", "receita", "transferencia"],
      movimento_tipo: ["credito", "debito"],
      perfil_usuario: ["admin", "funcionario", "contabilidade"],
      tipo_certificado: ["A1", "A3"],
      xml_status: ["pendente", "processado", "erro"],
    },
  },
} as const

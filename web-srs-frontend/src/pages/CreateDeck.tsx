import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// 1. Contratos de Interface Estritos
interface Deck {
  id: string;
  title: string;
  description?: string | null;
  sourceLanguage: string;
  targetLanguage?: string | null;
  createdAt: string;
  isArchived: boolean;
}

interface CreateDeckData {
  createDeck: Deck;
}

interface CreateDeckVars {
  data: {
    title: string;
    description?: string | null;
    sourceLanguage: string;
    targetLanguage?: string | null;
  };
}

// 2. Definição da Mutação GraphQL conforme o Schema do Backend
const CREATE_DECK_MUTATION = gql`
  mutation CreateDeck($data: CreateDeckInput!) {
    createDeck(data: $data) {
      id
      title
      description
      sourceLanguage
      targetLanguage
      createdAt
      isArchived
    }
  }
`;

export const CreateDeck: React.FC = () => {
  const navigate = useNavigate();

  // Estados locais controlados
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("pt-BR");
  const [targetLanguage, setTargetLanguage] = useState("");

  // 3. Hook de Mutação com Injeção de Generics e Manipulação do Cache
  const [createDeck, { loading, error }] = useMutation<
    CreateDeckData,
    CreateDeckVars
  >(CREATE_DECK_MUTATION, {
    update(cache, { data }) {
      if (!data) return;

      cache.modify({
        fields: {
          myDecks(existingDecks = []) {
            const newDeckRef = cache.writeFragment({
              data: data.createDeck,
              fragment: gql`
                fragment NewDeck on Deck {
                  id
                  title
                  description
                  sourceLanguage
                  targetLanguage
                  createdAt
                  isArchived
                }
              `,
            });
            return [newDeckRef, ...existingDecks];
          },
        },
      });
    },
    onCompleted: () => {
      navigate("/"); // Retorna à Dashboard após o sucesso
    },
  });

  // 4. Manipulador de Formulário aderente ao React 19
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createDeck({
      variables: {
        data: {
          title,
          description: description.trim() || null,
          sourceLanguage,
          targetLanguage: targetLanguage.trim() || null,
        },
      },
    });
  };

  // 5. Arquitetura de UI Estritamente Baseada em Flexbox
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#f4f4f5",
    padding: "2rem",
    boxSizing: "border-box",
  };

  const formCardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    width: "100%",
    maxWidth: "600px",
    backgroundColor: "#ffffff",
    padding: "2.5rem",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e4e4e7",
  };

  const fieldGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    gap: "1rem",
    width: "100%",
  };

  const inputStyle: React.CSSProperties = {
    padding: "0.75rem",
    borderRadius: "4px",
    border: "1px solid #d4d4d8",
    fontSize: "1rem",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={containerStyle}>
      <div style={{ width: "100%", maxWidth: "600px", marginBottom: "1.5rem" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "#2563eb",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
            padding: 0,
          }}
        >
          ← Voltar para a Dashboard
        </button>
      </div>

      <main style={formCardStyle}>
        <h1 style={{ margin: 0, fontSize: "1.75rem", color: "#09090b" }}>
          Criar Novo Baralho
        </h1>
        <p style={{ margin: 0, color: "#71717a", marginTop: "-0.75rem" }}>
          {" "}
          Configure os parâmetros textuais e linguísticos do seu Deck.
        </p>

        {error && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "4px",
              color: "#991b1b",
            }}
          >
            {error.message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div style={fieldGroupStyle}>
            <label
              htmlFor="title"
              style={{
                fontSize: "0.9rem",
                fontWeight: "bold",
                color: "#18181b",
              }}
            >
              Título do Baralho
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Vocabulário Avançado de Engenharia"
              required
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label
              htmlFor="description"
              style={{
                fontSize: "0.9rem",
                fontWeight: "bold",
                color: "#18181b",
              }}
            >
              Descrição / Ementa
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ex: Termos técnicos utilizados em documentações internacionais de arquitetura de software."
              style={{ ...inputStyle, resize: "none" }}
            />
          </div>

          <div style={rowStyle}>
            <div style={{ ...fieldGroupStyle, flex: 1 }}>
              <label
                htmlFor="sourceLanguage"
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  color: "#18181b",
                }}
              >
                Idioma Origem
              </label>
              <select
                id="sourceLanguage"
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                style={inputStyle}
              >
                <option value="pt-BR">Português (pt-BR)</option>
                <option value="en-US">Inglês (en-US)</option>
                <option value="es-ES">Espanhol (es-ES)</option>
                <option value="fr-FR">Francês (fr-FR)</option>
              </select>
            </div>

            <div style={{ ...fieldGroupStyle, flex: 1 }}>
              <label
                htmlFor="targetLanguage"
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  color: "#18181b",
                }}
              >
                Idioma Destino (Opcional)
              </label>
              <input
                id="targetLanguage"
                type="text"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                placeholder="Ex: en-US"
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                padding: "0.75rem 1.5rem",
                cursor: "pointer",
                border: "1px solid #d4d4d8",
                backgroundColor: "transparent",
                borderRadius: "4px",
                fontWeight: "500",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.75rem 1.5rem",
                cursor: "pointer",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              {loading ? "Salvando..." : "Confirmar Criação"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

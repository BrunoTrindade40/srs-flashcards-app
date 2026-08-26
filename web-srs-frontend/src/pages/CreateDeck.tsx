import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Módulos restritos à regra de segregação do Apollo Client
import type { Reference } from "@apollo/client/core";
import { useMutation } from "@apollo/client/react";

import { CREATE_DECK } from "../lib/graphql/deck";

export const CreateDeck: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const [createDeck, { loading }] = useMutation(CREATE_DECK, {
    update(cache, { data: mutationData }) {
      // Padrão Bouncer no modificador do cache
      if (!mutationData?.createDeck) return;

      // SUGESTÃO APLICADA: Substituição da reescrita de query inteira pela inserção isolada
      cache.modify({
        fields: {
          myDecks(existingDeckRefs: readonly Reference[] = [], { toReference }) {
            // Cria um ponteiro em memória para o item recém chegado na Mutation
            const newDeckRef = toReference(mutationData.createDeck);
            
            // Aborta se não gerar uma referência válida
            if (!newDeckRef) return existingDeckRefs;

            // Injeta o novo agrupamento no topo da fila visual com complexidade O(1)
            // utilizando spread operator, garantindo Imutabilidade Estrita.
            return [newDeckRef, ...existingDeckRefs];
          },
        },
      });
    },
  });

  // Tipagem estrita exigida para eventos no React
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const safeTitle = title.trim();
    const safeDescription = description.trim();

    // Padrão Bouncer de validação (Early Return)
    if (!safeTitle) {
      setFormError("O título do Deck é obrigatório.");
      return;
    }

    try {
      await createDeck({
        variables: {
          data: {
            title: safeTitle,
            // Higienização estrita garantindo null ao invés de undefined
            description: safeDescription ? safeDescription : null,
          },
        },
      });
      navigate("/dashboard");
    } catch (err: unknown) {
      // Inspeção com Type Guard, garantindo tolerância zero a 'any'
      if (err instanceof Error) {
        console.error("Falha ao criar o deck:", err.message);
      }
      setFormError("Ocorreu um erro ao comunicar com o servidor. Tente novamente.");
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Criar Novo Deck</h2>
          <p className="text-gray-500 text-sm mt-1">
            Organize o seu conhecimento por áreas de estudo.
          </p>
        </div>

        {/* Verificação explícita do estado de erro (evita renderização suja de '0') */}
        {formError !== null && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Título do Deck <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Ex: Inglês B2, Biologia Celular..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              maxLength={100}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Descrição (Opcional)
            </label>
            <textarea
              id="description"
              placeholder="Breve resumo sobre o conteúdo deste deck..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 text-white font-medium rounded-lg shadow-sm transition-colors ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              }`}
            >
              {loading ? "A criar..." : "Criar Deck"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
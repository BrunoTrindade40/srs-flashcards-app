// src/components/CreateDeckModal.tsx
import { type Reference } from "@apollo/client/core";
import { useMutation } from "@apollo/client/react";
import React, { useEffect, useState } from "react";
import { useToast } from "../hooks/useToast";
import { CREATE_DECK } from "../lib/graphql/deck";
// CORREÇÃO CRÍTICA: Extração de inteligência de domínio garantindo arquitetura limpa (DRY)
import { validateDeckInput } from "../domain/validators";

interface CreateDeckModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateDeckModal: React.FC<CreateDeckModalProps> = ({
  onClose,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("pt-BR");
  const [targetLanguage, setTargetLanguage] = useState("");
  const { showToast } = useToast();

  const [createDeck, { loading }] = useMutation(CREATE_DECK, {
    update(cache, { data: mutationData }) {
      if (!mutationData?.createDeck) return;
      cache.modify({
        fields: {
          myDecks(existingDeckRefs: readonly Reference[] = [], { toReference }) {
            const newDeckRef = toReference(mutationData.createDeck);
            if (!newDeckRef) return existingDeckRefs;
            return [newDeckRef, ...existingDeckRefs];
          },
        },
      });
    },
  });

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    // 1. Padrão Bouncer: Utilizando a função unificada do domínio
    const validationError = validateDeckInput(title, description);
    
    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    try {
      const response = await createDeck({
        variables: {
          data: {
            title: title.trim(),
            description: description.trim() ? description.trim() : null,
            sourceLanguage: sourceLanguage || null,
            targetLanguage: targetLanguage || null,
          },
        },
      });

      if (response.data?.createDeck) {
        showToast("Deck criado com sucesso!", "success");
        onClose();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        showToast(`Falha ao criar deck: ${error.message}`, "error");
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h2 className="text-lg font-bold text-slate-100">
              Criar Novo Deck
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-sm p-1 transition-colors cursor-pointer"
            aria-label="Fechar Modal"
          >
            ✖
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="deck-title"
              className="text-xs font-semibold text-slate-300 uppercase tracking-wider"
            >
              Título do Baralho *
            </label>
            <input
              id="deck-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Vocabulário de Inglês..."
              required
              disabled={loading}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="deck-desc"
              className="text-xs font-semibold text-slate-300 uppercase tracking-wider"
            >
              Descrição (Opcional)
            </label>
            <textarea
              id="deck-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve resumo do conteúdo..."
              rows={3}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-600 resize-none focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-800/50 pt-3 mt-1">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Idioma de Origem
              </label>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">Inglês (EUA)</option>
                <option value="es-ES">Espanhol</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Idioma Alvo
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Não Especificado</option>
                <option value="en-US">Inglês (EUA)</option>
                <option value="es-ES">Espanhol</option>
                <option value="fr-FR">Francês</option>
                <option value="de-DE">Alemão</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar Baralho"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
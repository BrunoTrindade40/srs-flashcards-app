import { useMutation } from "@apollo/client/react";
import React, { useEffect, useState } from "react";
import { useToast } from "../hooks/useToast";
import { UPDATE_DECK } from "../lib/graphql/deck";
import type { GetDeckDetailsQuery } from "../gql/graphql";
import { validateDeckInput } from "../domain/validators";

type DeckDetails = NonNullable<GetDeckDetailsQuery["deck"]>;

interface EditDeckModalProps {
  onClose: () => void;
  deck: DeckDetails;
}

export const EditDeckModal: React.FC<EditDeckModalProps> = ({
  onClose,
  deck,
}) => {
  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description ?? "");
  const [sourceLanguage, setSourceLanguage] = useState(
    deck.sourceLanguage ?? "pt-BR",
  );
  const [targetLanguage, setTargetLanguage] = useState(
    deck.targetLanguage ?? "",
  );

  const { showToast } = useToast();
  // Removido o bloqueio stateful de 'loading'.
  const [updateDeck] = useMutation(UPDATE_DECK);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const safeTitle = title.trim();
    const safeDescription = description.trim() ? description.trim() : null;
    const safeSourceLanguage = sourceLanguage ? sourceLanguage : null;
    const safeTargetLanguage = targetLanguage ? targetLanguage : null;

    // Acionamento Estrito da Validação (SSOT - Padrão Bouncer)
    const validationError = validateDeckInput(safeTitle, description ?? "");
    if (validationError !== null) {
      showToast(validationError, "error");
      return;
    }

    // Execução Otimista (Fire and Forget seguro via Apollo Cache)
    updateDeck({
      variables: {
        data: {
          id: deck.id,
          title: safeTitle,
          description: safeDescription,
          sourceLanguage: safeSourceLanguage,
          targetLanguage: safeTargetLanguage,
        },
      },
      optimisticResponse: {
        __typename: "Mutation",
        updateDeck: {
          __typename: "Deck",
          id: deck.id,
          title: safeTitle,
          description: safeDescription,
          sourceLanguage: safeSourceLanguage,
          targetLanguage: safeTargetLanguage,
          isArchived: deck.isArchived, // Preservado do estado local atual
        },
      },
    }).catch((err: unknown) => {
      // Regra 16: Alerta claro e explícito de rollback otimista
      if (err instanceof Error) {
        showToast(
          `Erro de rede. A ação foi revertida: ${err.message}`,
          "error",
        );
      }
    });

    // Interface avança em 0ms (Zero-Latency)
    showToast("Deck atualizado com sucesso!", "success");
    onClose();
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
            <span className="text-xl">✏️</span>
            <h2 className="text-lg font-bold text-slate-100">Editar Deck</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-sm p-1 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            ✖
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Título do Baralho *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Descrição (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm resize-none focus:outline-none focus:border-amber-500 transition-colors"
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
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={title.trim().length === 0}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

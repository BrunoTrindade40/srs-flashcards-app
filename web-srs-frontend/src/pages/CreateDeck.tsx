import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Reference } from "@apollo/client/core";
import { useMutation } from "@apollo/client/react";
import { CREATE_DECK } from "../lib/graphql/deck";
import { validateDeckInput } from "../domain/validators";

export const CreateDeck: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const [createDeck, { loading }] = useMutation(CREATE_DECK, {
    update(cache, { data: mutationData }) {
      if (!mutationData?.createDeck) return;

      cache.modify({
        fields: {
          myDecks(
            existingDeckRefs: readonly Reference[] = [],
            { toReference },
          ) {
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
    setFormError(null);

    const validationError = validateDeckInput(title, description);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      await createDeck({
        variables: {
          data: {
            title: title.trim(),
            description: description.trim() ? description.trim() : null,
          },
        },
      });
      navigate("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Falha ao criar o deck:", err.message);
      }
      setFormError(
        "Ocorreu um erro ao comunicar com o servidor. Tente novamente.",
      );
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-100">Criar Novo Deck</h2>
          <p className="text-slate-400 text-sm mt-1">
            Organize o seu conhecimento por áreas de estudo.
          </p>
        </div>

        {formError !== null && (
          <div className="mb-4 p-3 bg-rose-500/10 text-rose-400 text-sm rounded-lg border border-rose-500/30">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="title"
              className="text-sm font-medium text-slate-300"
            >
              Título do Deck <span className="text-amber-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Ex: Inglês B2, Biologia Celular..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:border-amber-500 focus:ring-amber-500 transition-colors"
              maxLength={100}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="description"
              className="text-sm font-medium text-slate-300"
            >
              Descrição (Opcional)
            </label>
            <textarea
              id="description"
              placeholder="Breve resumo sobre o conteúdo deste deck..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:border-amber-500 focus:ring-amber-500 transition-colors resize-none"
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="px-5 py-2.5 text-slate-400 bg-slate-800 hover:bg-slate-700 font-medium rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 text-slate-950 font-bold rounded-xl shadow-sm transition-colors ${
                loading
                  ? "bg-amber-500/50 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600 cursor-pointer"
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

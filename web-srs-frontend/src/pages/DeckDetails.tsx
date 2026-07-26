import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
import { CreateFlashcardModal } from "../components/CreateFlashcardModal";
import { useToast } from "../hooks/useToast";
import { DELETE_DECK, GET_DECK_DETAILS } from "../lib/graphql/deck";
import { REMOVE_FLASHCARD } from "../lib/graphql/flashcard"; // CORRIGIDO!

export function DeckDetails() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isDeleteDeckModalOpen, setIsDeleteDeckModalOpen] = useState(false);
  const [cardToDeleteId, setCardToDeleteId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_DECK_DETAILS, {
    variables: { id: deckId || "" },
    skip: !deckId,
  });

  const [deleteDeck, { loading: deletingDeck }] = useMutation(DELETE_DECK);
  // CORRIGIDO: Passando a utilizar REMOVE_FLASHCARD conforme declarado no seu schema
  const [deleteFlashcard, { loading: deletingCard }] =
    useMutation(REMOVE_FLASHCARD);

  const deck = data?.deck;

  const handleDeleteDeck = async () => {
    if (!deckId) return;

    try {
      await deleteDeck({ variables: { id: deckId } });
      showToast("Deck excluído com sucesso!", "success");
      navigate("/dashboard");
    } catch (err: unknown) {
      console.error("Erro ao deletar deck:", err);
      showToast("Falha ao excluir o deck.", "error");
    }
  };

  const handleDeleteFlashcard = async () => {
    if (!cardToDeleteId) return;

    try {
      // CORRIGIDO: Mapeando corretamente os IDs conforme seu schema de exclusão
      await deleteFlashcard({ variables: { id: cardToDeleteId } });
      showToast("Flashcard excluído com sucesso!", "success");
      setCardToDeleteId(null);
      refetch();
    } catch (err: unknown) {
      console.error("Erro ao deletar flashcard:", err);
      showToast("Falha ao excluir o flashcard.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 font-medium">
          Carregando detalhes do deck...
        </p>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-rose-400 font-medium">
          Deck não encontrado ou erro de carregamento.
        </p>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Cabeçalho do Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
            {deck.flashcards?.length || 0} Cartões
          </span>
          <h1 className="text-2xl font-bold text-slate-100 mt-2">
            {deck.title}
          </h1>
          {deck.description && (
            <p className="text-sm text-slate-400 mt-1">{deck.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCardModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl text-sm transition"
          >
            + Criar Card
          </button>
          <button
            onClick={() => setIsDeleteDeckModalOpen(true)}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium rounded-xl text-sm transition"
          >
            Excluir Deck
          </button>
        </div>
      </div>

      {/* Lista de Flashcards */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-200">
          Cartões do Deck
        </h2>

        {!deck.flashcards || deck.flashcards.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
            <p className="text-slate-400 text-sm">
              Este deck ainda não possui flashcards.
            </p>
            <button
              onClick={() => setIsCardModalOpen(true)}
              className="mt-3 text-amber-400 hover:text-amber-300 text-sm font-medium transition"
            >
              Adicionar o primeiro cartão
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {deck.flashcards.map((card) => (
              <div
                key={card.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div className="flex flex-col gap-2 flex-1">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Frente
                    </span>
                    <p className="text-sm text-slate-200 font-medium whitespace-pre-wrap">
                      {card.front}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-wider">
                      Verso
                    </span>
                    <p className="text-sm text-slate-400 whitespace-pre-wrap">
                      {card.back}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCardToDeleteId(card.id)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 transition"
                  title="Excluir Flashcard"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modais */}
      {isCardModalOpen && deckId && (
        <CreateFlashcardModal
          deckId={deckId}
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          onSuccess={() => {
            showToast("Flashcard criado com sucesso!", "success");
            refetch();
          }}
        />
      )}

      {isDeleteDeckModalOpen && (
        <ConfirmModal
          isOpen={isDeleteDeckModalOpen}
          title="Excluir Deck"
          message="Tem certeza que deseja excluir este deck e todos os seus cartões? Esta ação não poderá ser desfeita."
          confirmText="Excluir"
          isDanger
          loading={deletingDeck}
          onConfirm={handleDeleteDeck}
          onClose={() => setIsDeleteDeckModalOpen(false)}
        />
      )}

      {cardToDeleteId && (
        <ConfirmModal
          isOpen={!!cardToDeleteId}
          title="Excluir Flashcard"
          message="Tem certeza que deseja excluir este cartão?"
          confirmText="Excluir"
          isDanger
          loading={deletingCard}
          onConfirm={handleDeleteFlashcard}
          onClose={() => setCardToDeleteId(null)}
        />
      )}
    </div>
  );
}

export default DeckDetails;

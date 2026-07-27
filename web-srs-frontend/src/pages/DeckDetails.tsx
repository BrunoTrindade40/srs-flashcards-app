import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
import { CreateFlashcardModal } from "../components/CreateFlashcardModal";
import { EditDeckModal } from "../components/EditDeckModal";
import { EditFlashcardModal } from "../components/EditFlashcardModal";
import { useToast } from "../hooks/useToast";
import { GET_DECK_DETAILS, UPDATE_DECK } from "../lib/graphql/deck"; // Alterado para UPDATE_DECK
import { REMOVE_FLASHCARD } from "../lib/graphql/flashcard";

export function DeckDetails() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isAnonymizeDeckModalOpen, setIsAnonymizeDeckModalOpen] =
    useState(false); // Renomeado por clareza arquitetural
  const [isEditDeckModalOpen, setIsEditDeckModalOpen] = useState(false);
  const [cardToDeleteId, setCardToDeleteId] = useState<string | null>(null);
  const [flashcardToEdit, setFlashcardToEdit] = useState<{
    id: string;
    front: string;
    back: string;
  } | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_DECK_DETAILS, {
    variables: { id: deckId || "" },
    skip: !deckId,
  });

  // Alterado o motor para a mutação de atualização
  const [anonymizeDeck, { loading: anonymizingDeck }] =
    useMutation(UPDATE_DECK);
  const [deleteFlashcard, { loading: deletingCard }] =
    useMutation(REMOVE_FLASHCARD);

  useEffect(() => {
    if (error) {
      showToast(`Erro ao carregar deck: ${error.message}`, "error");
    }
  }, [error, showToast]);

  const deck = data?.deck;

  const handleAnonymizeDeck = async () => {
    if (!deckId) return;

    try {
      await anonymizeDeck({
        variables: {
          data: {
            id: deckId,
            isArchived: true, // Aciona o gatilho da anonimização no NestJS
          },
        },
        update(cache) {
          // Limpeza imperativa: Rompe a referência do objeto localmente e limpa a lixeira do Apollo
          cache.evict({
            id: cache.identify({ __typename: "Deck", id: deckId }),
          });
          cache.gc();
        },
      });
      showToast("Baralho anonimizado e removido com sucesso!", "success");
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Falha ao remover o deck: ${err.message}`, "error");
      }
    }
  };

  const handleDeleteFlashcard = async () => {
    if (!cardToDeleteId) return;
    try {
      await deleteFlashcard({
        variables: { id: cardToDeleteId },
        // 🔵 SUGESTÃO APLICADA: Manipulação direta da Store (Zero Latência)
        update(cache) {
          cache.evict({
            id: cache.identify({ __typename: "Flashcard", id: cardToDeleteId }),
          });
          cache.gc(); // Garbage collector recolhe o nó destruído
        },
      });
      showToast("Flashcard excluído com sucesso!", "success");
      setCardToDeleteId(null);

      // Remova (ou comente) a linha 'refetch()'
      // refetch();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Falha ao excluir o flashcard: ${err.message}`, "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-rose-400 font-medium">Deck não encontrado.</p>
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
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 w-fit">
            {deck.flashcards?.length || 0} Cartões
          </span>
          <h1 className="text-2xl font-bold text-slate-100">{deck.title}</h1>
          {deck.description && (
            <p className="text-sm text-slate-400 max-w-2xl">
              {deck.description}
            </p>
          )}
        </div>

        {/* Grupo de Ações (Flexbox) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsEditDeckModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition cursor-pointer"
          >
            Editar Deck
          </button>
          <button
            onClick={() => setIsCardModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg cursor-pointer"
          >
            + Criar Card
          </button>
          <button
            onClick={() => setIsAnonymizeDeckModalOpen(true)}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium rounded-xl text-sm transition cursor-pointer"
          >
            Remover
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
              className="mt-3 text-amber-400 hover:text-amber-300 text-sm font-bold transition cursor-pointer"
            >
              Adicionar o primeiro cartão
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {deck.flashcards.map((card) => (
              <div
                key={card.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start justify-between gap-4 group hover:border-slate-600 transition-colors"
              >
                <div className="flex flex-col gap-3 flex-1 w-full">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Frente
                    </span>
                    <p className="text-sm text-slate-200 font-medium whitespace-pre-wrap mt-1">
                      {card.front}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800/60">
                    <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider">
                      Verso
                    </span>
                    <p className="text-sm text-slate-400 whitespace-pre-wrap mt-1">
                      {card.back}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-2 pt-2 sm:pt-0 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-800 sm:border-transparent mt-2 sm:mt-0">
                  <button
                    onClick={() => setFlashcardToEdit(card)}
                    className="p-2 bg-slate-800/50 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                    title="Editar Flashcard"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setCardToDeleteId(card.id)}
                    className="p-2 bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="Excluir Flashcard"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modais Aninhados */}
      {isCardModalOpen && deckId && (
        <CreateFlashcardModal
          deckId={deckId}
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {isEditDeckModalOpen && (
        <EditDeckModal
          isOpen={isEditDeckModalOpen}
          onClose={() => setIsEditDeckModalOpen(false)}
          deck={deck}
        />
      )}

      {flashcardToEdit && (
        <EditFlashcardModal
          isOpen={!!flashcardToEdit}
          onClose={() => setFlashcardToEdit(null)}
          flashcard={flashcardToEdit}
        />
      )}

      {isAnonymizeDeckModalOpen && (
        <ConfirmModal
          isOpen={isAnonymizeDeckModalOpen}
          title="Remover Baralho (Anonimização)"
          message="Tem certeza que deseja remover este baralho? Para proteger sua privacidade, o baralho será irreversivelmente anonimizado e removido da sua interface, mantendo apenas métricas estatísticas impessoais para a calibração do algoritmo."
          confirmText="Anonimizar e Remover"
          isDanger
          loading={anonymizingDeck}
          onConfirm={handleAnonymizeDeck}
          onClose={() => setIsAnonymizeDeckModalOpen(false)}
        />
      )}

      {/* Modal de Delete de Flashcard original */}
      {cardToDeleteId && (
        <ConfirmModal
          isOpen={!!cardToDeleteId}
          title="Excluir Flashcard"
          message="Tem certeza que deseja excluir este cartão de forma permanente?"
          confirmText="Excluir Card"
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

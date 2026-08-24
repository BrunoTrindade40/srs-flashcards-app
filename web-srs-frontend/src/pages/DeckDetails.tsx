import React, { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
import { CreateFlashcardModal } from "../components/CreateFlashcardModal";
import { EditDeckModal } from "../components/EditDeckModal";
import { EditFlashcardModal } from "../components/EditFlashcardModal";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { useDeckDetails } from "../hooks/useDeckDetails";
import { useToast } from "../hooks/useToast";

export const DeckDetails: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const safeDeckId = deckId ?? null;

  const {
    deck,
    loading,
    error,
    deletingDeck,
    isCreateOpen,
    setIsCreateOpen,
    isEditDeckOpen,
    setIsEditDeckOpen,
    editingCard,
    setEditingCard,
    deletingCardId,
    setDeletingCardId,
    isDeletingDeck,
    setIsDeletingDeck,
    handleSaveEdit,
    handleConfirmDeleteCard,
    handleConfirmDeleteDeck,
  } = useDeckDetails(safeDeckId);

  useEffect(() => {
    if (error) {
      showToast(`Erro ao carregar detalhes do deck: ${error.message}`, "error");
    }
  }, [error, showToast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
        <div className="text-amber-500 font-bold animate-pulse text-lg">
          Carregando detalhes do deck...
        </div>
      </div>
    );
  }

  if (!safeDeckId || error || !deck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6 text-center w-full">
        <h2 className="text-xl font-bold text-rose-500">
          Erro ao carregar baralho.
        </h2>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-6 p-6 animate-fadeIn">
      <div className="flex items-center w-full">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800"
        >
          <span>← Voltar ao Dashboard</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-extrabold text-slate-100">
              {deck.title}
            </h1>
            
            {/* 🟡 ALERTA: Removido o badge 'Arquivado' que não deve mais existir na Fase 1 */}

            <div className="flex flex-wrap gap-2 md:ml-2 mt-2 md:mt-0">
              <button
                onClick={() => setIsEditDeckOpen(true)}
                className="px-3 py-1 text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer shadow-sm"
              >
                ✏️ Editar
              </button>
              
              {/* 🔴 CRÍTICO: Botão de Arquivamento/Reativamento totalmente removido */}

              <button
                onClick={() => setIsDeletingDeck(true)}
                className="px-3 py-1 text-xs font-semibold bg-rose-950/30 text-rose-400 hover:bg-rose-900/50 rounded border border-rose-900/50 transition-colors cursor-pointer shadow-sm"
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            {deck.description || "Sem descrição."}
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate(`/study/${deck.id}`)}
            disabled={!deck.flashcards || deck.flashcards.length === 0}
            className="flex-1 md:flex-none px-5 py-2.5 font-bold rounded-lg transition-colors shadow-md bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer disabled:opacity-50"
          >
            Iniciar Estudo 🧠
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 md:flex-none px-5 py-2.5 bg-slate-800 text-slate-100 font-bold rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer shadow-sm"
          >
            + Criar Card
          </button>
        </div>
      </div>

      {/* O restante do mapeamento de flashcards permanece idêntico... */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-slate-300">
          Cartões no Baralho ({deck.flashcards?.length || 0})
        </h2>
        {!deck.flashcards || deck.flashcards.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-500 flex items-center justify-center">
            <span>Nenhum cartão cadastrado neste baralho ainda.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {deck.flashcards.map((card) => (
               <div
                 key={card.id}
                 className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-5 rounded-xl gap-4 hover:border-slate-700 transition-all"
               >
                 {/* ... Conteúdo inalterado das renderizações dos cartões ... */}
                 <div className="flex flex-col md:flex-row flex-1 gap-6 w-full overflow-hidden">
                   <div className="flex flex-col flex-1 gap-1 min-w-0">
                     <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Frente</span>
                     <MarkdownRenderer content={card.frontContent ?? ""} />
                   </div>
                   <div className="flex flex-col flex-1 gap-1 min-w-0 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
                     <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Verso</span>
                     <MarkdownRenderer content={card.backContent ?? ""} />
                   </div>
                 </div>
                 <div className="flex gap-2 self-end md:self-center border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0 w-full md:w-auto justify-end">
                   <button
                     onClick={() => setEditingCard({
                         id: card.id,
                         frontContent: card.frontContent,
                         backContent: card.backContent,
                         sourceContext: card.sourceContext,
                       })}
                     className="px-3 py-1.5 text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                   >Editar</button>
                   <button
                     onClick={() => setDeletingCardId(card.id)}
                     className="px-3 py-1.5 text-xs font-semibold bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 rounded border border-rose-900/50 transition-colors cursor-pointer"
                   >Excluir</button>
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>

      {/* Renderiza o condicional e limpa dos Modais */}
      <CreateFlashcardModal
        deckId={deck.id}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {editingCard && (
        <EditFlashcardModal
          isOpen={true}
          initialFrontContent={editingCard.frontContent}
          initialBackContent={editingCard.backContent}
          initialSourceContext={editingCard.sourceContext}
          onClose={() => setEditingCard(null)}
          onSave={handleSaveEdit}
        />
      )}

      <EditDeckModal
        deck={deck}
        isOpen={isEditDeckOpen}
        onClose={() => setIsEditDeckOpen(false)}
      />

      <ConfirmModal
        isOpen={!!deletingCardId}
        title="Excluir Flashcard"
        message="Tem certeza que deseja remover este cartão do baralho?"
        onClose={() => setDeletingCardId(null)}
        onConfirm={handleConfirmDeleteCard}
        isDanger={true}
      />

      <ConfirmModal
        isOpen={isDeletingDeck}
        loading={deletingDeck}
        title="Excluir Baralho Inteiro"
        message={`Esta ação apagará permanentemente o baralho "${deck.title}" e TODOS os seus ${deck.flashcards?.length || 0} cartões. O algoritmo FSRS perderá o histórico desses estudos. Deseja prosseguir?`}
        confirmText="Sim, Apagar Tudo"
        isDanger={true}
        onClose={() => setIsDeletingDeck(false)}
        onConfirm={handleConfirmDeleteDeck}
      />
    </div>
  );
};
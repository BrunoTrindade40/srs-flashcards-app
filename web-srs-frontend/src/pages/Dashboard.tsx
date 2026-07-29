import { useQuery } from "@apollo/client/react"; // Importação estrita
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreateDeckModal } from "../components/CreateDeckModal";
import { useDailyReviewTracker } from "../hooks/useDailyReviewTracker";
import { useToast } from "../hooks/useToast";
import { GET_MY_DECKS, type Deck } from "../lib/graphql/deck";
import { GET_ME } from "../lib/graphql/settings";

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  const {
    data: dataDecks,
    loading: loadingDecks,
    error: errorDecks,
    refetch: refetchDecks,
  } = useQuery(GET_MY_DECKS, {
    fetchPolicy: "cache-and-network",
  });

  const { data: dataMe, error: errorMe } = useQuery(GET_ME, {
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (errorDecks)
      showToast(`Falha ao carregar baralhos: ${errorDecks.message}`, "error");
  }, [errorDecks, showToast]);

  useEffect(() => {
    if (errorMe)
      console.error("Erro ao sincronizar perfil do usuário:", errorMe.message);
  }, [errorMe]);

  const decks = (dataDecks?.myDecks as Deck[]) || [];
  const userStats = dataMe?.me;
  // 🔵 TRAVA DE SEGURANÇA ATIVADA (Fim do Mock)
  const { todayReviewCount } = useDailyReviewTracker(userStats?.id ?? null);
  const isConsolidationDay = new Date().getDay() === 0;
  // Cálculo derivado reativo (Render Phase Update)
  const hasReachedDailyLimit = userStats?.maxDailyReviews
    ? todayReviewCount >= userStats.maxDailyReviews
    : false;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 py-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex flex-col gap-2 max-w-xl text-center md:text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 w-fit mx-auto md:mx-0">
            Painel de Controle
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Otimize sua retenção diária
          </h1>
          <p className="text-sm text-slate-400">
            Gerencie seus baralhos, adicione flashcards e inicie sessões de
            estudo.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
          {/* Modo Caos Desabilitado - Proteção Fase 1 */}
          <button
            disabled
            title="Funcionalidade mapeada para a Fase 2 (TCC 2)"
            className="flex-1 md:flex-initial px-5 py-3 bg-slate-800/60 text-slate-500 border border-slate-700/60 font-bold rounded-xl text-xs uppercase tracking-wider cursor-not-allowed text-center flex items-center justify-center gap-2"
          >
            <span>⚡ Modo Chaos (Em Breve)</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-initial px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-lg text-center cursor-pointer"
          >
            + Criar Novo Deck
          </button>
        </div>
      </div>

      {(isConsolidationDay || hasReachedDailyLimit) && (
        <div
          className={`flex flex-col md:flex-row items-center justify-between p-5 rounded-2xl border shadow-lg ${hasReachedDailyLimit ? "bg-rose-900/20 border-rose-800/50" : "bg-blue-900/20 border-blue-800/50"} animate-fadeIn`}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl shrink-0">
              {hasReachedDailyLimit ? "🛑" : "🧘‍♂️"}
            </span>
            <div className="flex flex-col gap-1">
              <h3
                className={`text-sm font-extrabold uppercase tracking-wider ${hasReachedDailyLimit ? "text-rose-400" : "text-blue-400"}`}
              >
                {hasReachedDailyLimit
                  ? "Limite Cognitivo Atingido"
                  : "Hoje é Dia de Consolidação"}
              </h3>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                {hasReachedDailyLimit
                  ? `Você já atingiu o seu limite saudável de ${userStats?.maxDailyReviews ?? 0} revisões diárias. Descanse e retorne amanhã!`
                  : "Para evitar a sobrecarga e o 'Efeito Bola de Neve', foque apenas na limpeza do seu passivo de revisões hoje."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 w-full">
        <div className="flex-1 min-w-55 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl shrink-0">
            🔥
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Ofensiva Atual
            </span>
            <span className="text-xl font-black text-slate-100">
              {userStats?.currentStreak ?? 0}{" "}
              {userStats?.currentStreak === 1 ? "dia" : "dias"}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-55 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 text-2xl shrink-0">
            🏆
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Maior Sequência
            </span>
            <span className="text-xl font-black text-slate-100">
              {userStats?.longestStreak ?? 0}{" "}
              {userStats?.longestStreak === 1 ? "dia" : "dias"}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-55 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-2xl shrink-0">
            ⚡
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              XP Total
            </span>
            <span className="text-xl font-black text-slate-100">
              {userStats?.totalXp ?? 0} XP
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <span>📚</span> Seus Baralhos ({decks.length})
          </h2>
          <button
            onClick={() => refetchDecks()}
            className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition cursor-pointer"
          >
            🔄 Atualizar
          </button>
        </div>

        {loadingDecks && decks.length === 0 && (
          <div className="flex items-center justify-center min-h-[30vh]">
            <p className="text-slate-400 text-sm font-medium">
              Carregando seus baralhos...
            </p>
          </div>
        )}

        {!loadingDecks && !errorDecks && decks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center px-4">
            <span className="text-4xl mb-3">📭</span>
            <h3 className="text-base font-bold text-slate-200">
              Nenhum baralho encontrado
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
              Você ainda não criou nenhum deck. Crie seu primeiro baralho para
              começar.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              + Criar Primeiro Baralho
            </button>
          </div>
        )}

        {decks.length > 0 && (
          <div className="flex flex-wrap -mx-2">
            {decks.map((deck) => (
              <div key={deck.id} className="w-full sm:w-1/2 lg:w-1/3 p-2 flex">
                <div className="w-full bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-md hover:shadow-xl group">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                        {deck.title}
                      </h3>
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 border transition-colors ${
                          hasReachedDailyLimit
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : isConsolidationDay
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {deck._count?.flashcards || 0} cards
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {deck.description || "Sem descrição."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-5 mt-4 border-t border-slate-800/80">
                    <Link
                      to={hasReachedDailyLimit ? "#" : `/study/${deck.id}`}
                      onClick={(e) =>
                        hasReachedDailyLimit && e.preventDefault()
                      }
                      className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition border ${
                        hasReachedDailyLimit
                          ? "bg-slate-800/50 text-slate-500 border-slate-700/50 cursor-not-allowed"
                          : isConsolidationDay
                            ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {hasReachedDailyLimit
                        ? "Limite Atingido 🛑"
                        : isConsolidationDay
                          ? "Limpar Passivo 🧹"
                          : "Estudar ⚡"}
                    </Link>
                    <Link
                      to={`/deck/${deck.id}`}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-center text-xs font-semibold rounded-xl transition border border-slate-700/50"
                    >
                      Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateDeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default Dashboard;

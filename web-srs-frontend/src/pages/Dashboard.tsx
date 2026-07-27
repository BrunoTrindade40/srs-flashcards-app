import { useQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreateDeckModal } from "../components/CreateDeckModal";
import { useToast } from "../hooks/useToast";
import { GET_MY_DECKS, type Deck } from "../lib/graphql/deck";
import { GET_ME } from "../lib/graphql/settings";

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  // Query dos Baralhos
  const {
    data: dataDecks,
    loading: loadingDecks,
    error: errorDecks,
    refetch: refetchDecks,
  } = useQuery(GET_MY_DECKS, {
    fetchPolicy: "cache-and-network",
  });

  // Query de Gamificação e Perfil do Usuário
  const { data: dataMe, error: errorMe } = useQuery(GET_ME, {
    fetchPolicy: "cache-and-network",
  });

  // Tratamento declarativo e purista de erros no Apollo v4
  useEffect(() => {
    if (errorDecks) {
      showToast(`Falha ao carregar baralhos: ${errorDecks.message}`, "error");
    }
  }, [errorDecks, showToast]);

  useEffect(() => {
    if (errorMe) {
      console.error("Erro ao sincronizar perfil do usuário:", errorMe.message);
    }
  }, [errorMe]);

  const decks = (dataDecks?.myDecks as Deck[]) || [];
  const userStats = dataMe?.me;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 py-4">
      {/* Seção Hero / Boas-Vindas */}
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
            estudo baseadas na Curva do Esquecimento FSRS.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
          <Link
            to="/chaos"
            className="flex-1 md:flex-initial px-5 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs uppercase tracking-wider transition text-center flex items-center justify-center gap-2"
          >
            <span>⚡ Modo Chaos</span>
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-initial px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-lg text-center cursor-pointer"
          >
            + Criar Novo Deck
          </button>
        </div>
      </div>

      {/* Cartões de Gamificação / Estatísticas do Usuário (Flexbox Responsivo) */}
      <div className="flex flex-wrap gap-4 w-full">
        {/* CORREÇÃO: Utilização da classe nativa min-w-55 ao invés do valor arbitrário min-w-[220px] */}
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

        {/* CORREÇÃO: Utilização da classe nativa min-w-55 */}
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

        {/* CORREÇÃO: Utilização da classe nativa min-w-55 */}
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

      {/* Grade de Decks em Flexbox (Responsiva e Fluida) */}
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

        {/* Estado de Carregamento */}
        {loadingDecks && decks.length === 0 && (
          <div className="flex items-center justify-center min-h-[30vh]">
            <p className="text-slate-400 text-sm font-medium">
              Carregando seus baralhos...
            </p>
          </div>
        )}

        {/* Estado de Erro */}
        {errorDecks && decks.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-center">
            <p className="text-rose-400 text-sm font-medium">
              Erro ao sincronizar baralhos.
            </p>
            <button
              onClick={() => refetchDecks()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Estado Vazio */}
        {!loadingDecks && !errorDecks && decks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center px-4">
            <span className="text-4xl mb-3">📭</span>
            <h3 className="text-base font-bold text-slate-200">
              Nenhum baralho encontrado
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
              Você ainda não criou nenhum deck. Crie seu primeiro baralho para
              começar a adicionar flashcards.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              + Criar Primeiro Baralho
            </button>
          </div>
        )}

        {/* Lista de Baralhos (Flexbox Wrap Responsivo) */}
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
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md shrink-0">
                        {deck._count?.flashcards || 0} cards
                      </span>
                    </div>
                    {deck.description ? (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {deck.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-600 italic">
                        Sem descrição.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-5 mt-4 border-t border-slate-800/80">
                    <Link
                      to={`/study/${deck.id}`}
                      className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-center text-xs font-bold rounded-xl transition"
                    >
                      Estudar ⚡
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

      {/* Modal de Criação */}
      <CreateDeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default Dashboard;

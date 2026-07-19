import { InMemoryCache } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { GET_DECK } from "../../src/lib/graphql/deck";
import {
  CREATE_FLASHCARD,
  GET_DECK_FLASHCARDS,
  REMOVE_FLASHCARD,
} from "../../src/lib/graphql/flashcard";
import { DeckDetails } from "../../src/pages/DeckDetails";

const DECK_ID = "deck-uuid-123";
const FLASHCARD_ID = "card-uuid-456";

const mocks = [
  // 1. Mock do detalhamento do Baralho
  {
    request: { query: GET_DECK, variables: { id: DECK_ID } },
    result: {
      data: {
        deck: {
          id: DECK_ID,
          title: "Inglês Técnico",
          description: "Terminologias de TI",
          _count: { flashcards: 1 },
        },
      },
    },
  },
  // 2. Mock da listagem inicial de Cartões
  {
    request: { query: GET_DECK_FLASHCARDS, variables: { deckId: DECK_ID } },
    result: {
      data: {
        deckFlashcards: [
          {
            id: FLASHCARD_ID,
            front: "Database",
            back: "Banco de Dados",
          },
        ],
      },
    },
  },
  // 3. Mock da Mutação de Criação
  {
    request: {
      query: CREATE_FLASHCARD,
      variables: {
        data: {
          front: "Framework",
          back: "Estrutura de trabalho",
          deckId: DECK_ID,
        },
      },
    },
    result: {
      data: {
        createFlashcard: {
          id: "new-card-uuid",
          front: "Framework",
          back: "Estrutura de trabalho",
        },
      },
    },
  },
  // 4. Mock da Mutação de Exclusão (Soft Delete / Anonimização no Backend)
  {
    request: { query: REMOVE_FLASHCARD, variables: { id: FLASHCARD_ID } },
    result: {
      data: {
        removeFlashcard: {
          __typename: "Flashcard", // Tipagem estrita exigida pelo Apollo 4.2.7
          id: FLASHCARD_ID,
        },
      },
    },
  },
];

describe("Integração da Rota: DeckDetails e Mutações", () => {
  const renderComponent = () => {
    // CORREÇÃO: Criação de um cache isolado com a TypePolicy instruindo
    // o MockedProvider a como tratar o array 'deckFlashcards' durante o teste.
    const testCache = new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            deckFlashcards: {
              merge(_existing, incoming) {
                return incoming;
              },
            },
          },
        },
      },
    });

    return render(
      // CORREÇÃO: Injeção explícita da prop 'cache'
      <MockedProvider mocks={mocks} cache={testCache}>
        <MemoryRouter initialEntries={[`/deck/${DECK_ID}`]}>
          <Routes>
            <Route path="/deck/:deckId" element={<DeckDetails />} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>,
    );
  };

  it("deve carregar os dados iniciais do baralho e listar os cartões", async () => {
    renderComponent();

    // Aguarda a resolução da Query
    expect(await screen.findByText("Inglês Técnico")).toBeInTheDocument();
    expect(screen.getByText("Database")).toBeInTheDocument();
  });

  it("deve atualizar o cache otimista e a interface ao criar um novo flashcard", async () => {
    renderComponent();
    await screen.findByText("Inglês Técnico");

    // Abre o Modal
    fireEvent.click(screen.getByText("+ Criar Flashcard"));

    // Preenche os limites de input testados anteriormente
    const frontInput = await screen.findByPlaceholderText(
      "Ex: O que é a Mitocôndria?",
    );
    const backInput = screen.getByPlaceholderText(
      "Ex: É o organelo responsável pela respiração celular e produção de energia.",
    );

    fireEvent.change(frontInput, { target: { value: "Framework" } });
    fireEvent.change(backInput, { target: { value: "Estrutura de trabalho" } });

    // Submete a Mutação
    fireEvent.click(screen.getByText("Salvar e Adicionar Outro"));

    // Valida se o cache refletiu o novo item no DOM sem reload da página
    await waitFor(() => {
      expect(screen.getByText("Framework")).toBeInTheDocument();
    });
  });

  it("deve remover o flashcard da interface via cache ao confirmar a exclusão", async () => {
    renderComponent();

    // Aguarda o item inicial renderizar
    const cardFront = await screen.findByText("Database");
    expect(cardFront).toBeInTheDocument();

    // Clica no botão de excluir do cartão específico
    const deleteButtons = screen.getAllByText("Excluir");
    fireEvent.click(deleteButtons[0]);

    // Confirma a ação no Modal (ConfirmModal)
    const confirmButton = await screen.findByText("Sim, Excluir");
    fireEvent.click(confirmButton);

    // Valida se o nó foi removido do DOM (Cache atualizado)
    await waitFor(() => {
      expect(screen.queryByText("Database")).not.toBeInTheDocument();
    });
  });
});

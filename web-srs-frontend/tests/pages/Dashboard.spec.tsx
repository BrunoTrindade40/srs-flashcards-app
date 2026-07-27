import { MockedProvider } from "@apollo/client/testing/react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { GET_MY_DECKS } from "../../src/lib/graphql/deck";
import { Dashboard } from "../../src/pages/Dashboard";

// Fixture simulando a resposta exata do NestJS
const mocks = [
  {
    request: {
      query: GET_MY_DECKS,
    },
    result: {
      data: {
        myDecks: [
          {
            id: "uuid-1",
            title: "Estruturas de Dados",
            description: "Preparação para entrevistas",
            _count: { flashcards: 42 },
          },
        ],
      },
    },
  },
];

describe("Integração da Rota: Dashboard", () => {
  it("deve renderizar a interface e listar os baralhos do cache em memória", async () => {
    render(
      <MockedProvider mocks={mocks}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Dashboard />
        </MemoryRouter>
      </MockedProvider>,
    );

    expect(await screen.findByText("Estruturas de Dados")).toBeInTheDocument();
    expect(screen.getByText("42 Cartões")).toBeInTheDocument();
  });
});

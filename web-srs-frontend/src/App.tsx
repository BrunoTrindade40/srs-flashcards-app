import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";

function App() {
  // Retornamos estritamente o roteador, sem <div> extras ou importações de './App.css'
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

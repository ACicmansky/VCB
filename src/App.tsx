import { Routes, Route } from "react-router-dom";
import ElsaPage from "./pages/ElsaPage";
import ButterflyPage from "./pages/ButterflyPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<ElsaPage />} />
      <Route path="/paint" element={<ButterflyPage />} />
    </Routes>
  );
}

export default App;

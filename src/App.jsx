// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BuyCrypto from "./pages/BuyCrypto";
import SellCrypto from "./pages/SellCrypto";
import TradeHistory from "./pages/TradeHistory";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/buy" element={<BuyCrypto />} />
        <Route path="/sell" element={<SellCrypto />} />
        <Route path="/history" element={<TradeHistory />} />
        <Route path="*" element={<div className="text-center mt-20 text-red-600 text-xl">404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;

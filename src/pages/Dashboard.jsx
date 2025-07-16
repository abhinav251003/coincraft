import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import CryptoPriceList from "../components/CryptoPriceList";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [walletBalance, setWalletBalance] = useState(null);
  const [portfolio, setPortfolio] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("User not logged in");
          setLoading(false);
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setWalletBalance(data.balance ?? 0);
          setPortfolio(data.portfolio || {});
        } else {
          setError("No document found in Firestore for this user");
        }
      } catch (err) {
        console.error("Error fetching balance:", err.message);
        setError("Error fetching wallet balance");
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 p-6">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-8">🚀 Dashboard</h1>

      {loading && <p className="text-center text-gray-600">Loading wallet...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && walletBalance !== null && (
        <div className="text-center mb-10">
          <p className="text-xl font-semibold text-gray-800">
            💰 Wallet Balance:{" "}
            <span className="text-green-600 font-bold">
              ${walletBalance.toFixed(2)}
            </span>
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <button
              onClick={() => navigate("/buy")}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              Buy Crypto
            </button>
            <button
              onClick={() => navigate("/sell")}
              className="bg-red-600 text-white px-5 py-2 rounded-lg shadow hover:bg-red-700 transition"
            >
              Sell Crypto
            </button>
            <button
              onClick={() => navigate("/history")}
              className="bg-purple-600 text-white px-5 py-2 rounded-lg shadow hover:bg-purple-700 transition"
            >
              View Trade History
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-5 py-2 rounded-lg shadow hover:bg-gray-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Price List */}
      <div className="mb-10">
        <CryptoPriceList />
      </div>

      {/* Portfolio */}
      {Object.keys(portfolio).length > 0 && (
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center mb-4 text-blue-700">
            📊 Your Portfolio
          </h2>
          {Object.entries(portfolio).map(([crypto, qty]) => (
            <div
              key={crypto}
              className="flex justify-between border-b border-gray-200 py-2"
            >
              <span className="capitalize font-medium">{crypto}</span>
              <span className="text-gray-700">{qty}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

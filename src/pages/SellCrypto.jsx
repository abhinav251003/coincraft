import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function SellCrypto() {
  const [user] = useAuthState(auth);
  const [balance, setBalance] = useState(null);
  const [portfolio, setPortfolio] = useState({});
  const [crypto, setCrypto] = useState("");
  const [amount, setAmount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setBalance(data.balance);
        setPortfolio(data.portfolio || {});
        setCrypto(Object.keys(data.portfolio || {})[0] || "");
      }
    };
    fetchUserData();
  }, [user]);

  const handleSell = async () => {
    const priceMap = {
      bitcoin: 120000,
      ethereum: 3050,
      dogecoin: 0.20,
    };

    if (!portfolio[crypto] || amount > portfolio[crypto]) {
      alert("Insufficient amount of crypto to sell");
      return;
    }

    const earnings = amount * priceMap[crypto];
    const userRef = doc(db, "users", user.uid);
    const updatedPortfolio = { ...portfolio, [crypto]: portfolio[crypto] - amount };
    if (updatedPortfolio[crypto] === 0) delete updatedPortfolio[crypto];

    await updateDoc(userRef, {
      balance: balance + earnings,
      portfolio: updatedPortfolio,
    });

    setBalance(balance + earnings);
    setPortfolio(updatedPortfolio);
    alert(`✅ Sold ${amount} ${crypto.toUpperCase()} for $${earnings.toFixed(2)}`);

    await addDoc(collection(userRef, "trades"), {
      type: "sell",
      coin: crypto,
      amount,
      price: priceMap[crypto],
      total: earnings,
      timestamp: serverTimestamp(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-red-600 mb-6">
          💸 Sell Cryptocurrency
        </h1>

        <p className="text-center text-gray-700 mb-6">
          💰 <span className="font-semibold">Wallet Balance:</span>{" "}
          <span className="text-red-500 font-bold">${balance?.toFixed(2)}</span>
        </p>

        {Object.keys(portfolio).length === 0 ? (
          <p className="text-center text-red-500 font-semibold">You don't own any crypto to sell.</p>
        ) : (
          <>
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">Select Coin</label>
              <select
                value={crypto}
                onChange={(e) => setCrypto(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                {Object.keys(portfolio).map((coin) => (
                  <option key={coin} value={coin}>
                    {coin}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block mb-1 font-medium text-gray-700">Amount to Sell</label>
              <input
                type="number"
                placeholder="e.g. 1.5"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            <button
              onClick={handleSell}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-md transition"
            >
              Sell Now
            </button>
          </>
        )}

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full mt-4 text-blue-600 text-sm hover:underline text-center"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

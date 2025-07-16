import { useEffect, useState } from "react";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function BuyCrypto() {
  const [user] = useAuthState(auth);
  const [balance, setBalance] = useState(null);
  const [crypto, setCrypto] = useState("bitcoin");
  const [amount, setAmount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchBalance = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setBalance(userSnap.data().balance);
      }
    };
    fetchBalance();
  }, [user]);

  const handleBuy = async () => {
    const priceMap = {
      bitcoin: 117000,
      ethereum: 2950,
      dogecoin: 0.19,
    };

    const cost = amount * priceMap[crypto];
    if (cost > balance) {
      alert("Insufficient funds");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User document not found!");
      return;
    }

    const userData = userSnap.data();
    const currentPortfolio = userData.portfolio || {};
    const prevAmount = currentPortfolio[crypto] || 0;
    currentPortfolio[crypto] = prevAmount + amount;

    await updateDoc(userRef, {
      balance: balance - cost,
      portfolio: currentPortfolio,
    });

    setBalance(balance - cost);
    alert(`✅ Purchased ${amount} ${crypto.toUpperCase()}`);

    // 🔥 Save trade record
    await addDoc(collection(userRef, "trades"), {
      type: "buy",
      coin: crypto,
      amount,
      price: priceMap[crypto],
      total: cost,
      timestamp: serverTimestamp(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-green-700 mb-6">
          🪙 Buy Cryptocurrency
        </h1>

        <p className="text-center text-gray-700 mb-6">
          💰 <span className="font-semibold">Wallet Balance:</span>{" "}
          <span className="text-green-600 font-bold">${balance?.toFixed(2)}</span>
        </p>

        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700">Select Coin</label>
          <select
            value={crypto}
            onChange={(e) => setCrypto(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="bitcoin">Bitcoin</option>
            <option value="ethereum">Ethereum</option>
            <option value="dogecoin">Dogecoin</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block mb-1 font-medium text-gray-700">Amount to Buy</label>
          <input
            type="number"
            placeholder="e.g. 1.5"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <button
          onClick={handleBuy}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition"
        >
          Buy Now
        </button>

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

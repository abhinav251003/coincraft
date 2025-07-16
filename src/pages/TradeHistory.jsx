import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";

export default function TradeHistory() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalBuy, setTotalBuy] = useState(0);
  const [totalSell, setTotalSell] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const navigate = useNavigate();

  const staticPrices = {
    bitcoin: 117000,
    ethereum: 2950,
    dogecoin: 0.19,
  };

  useEffect(() => {
    const fetchTradesAndPortfolio = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("User not logged in");
          setLoading(false);
          return;
        }

        // Fetch trades
        const tradesRef = collection(db, "users", user.uid, "trades");
        const q = query(tradesRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        const tradesList = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const ts = data.timestamp?.toDate?.();
          return {
            id: doc.id,
            ...data,
            time: ts || null,
          };
        });

        // Calculate totals
        let buy = 0;
        let sell = 0;
        tradesList.forEach((trade) => {
          if (trade.type === "buy") buy += trade.total;
          else if (trade.type === "sell") sell += trade.total;
        });
        setTotalBuy(buy);
        setTotalSell(sell);
        setTrades(tradesList);

        // Fetch portfolio
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const portfolio = userSnap.exists() ? userSnap.data().portfolio || {} : {};

        let totalValue = 0;
        for (const coin in portfolio) {
          const qty = portfolio[coin];
          const price = staticPrices[coin] || 0;
          totalValue += qty * price;
        }
        setPortfolioValue(totalValue);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch trade history or portfolio");
      } finally {
        setLoading(false);
      }
    };

    fetchTradesAndPortfolio();
  }, []);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown time";
    const now = new Date();
    const diff = now - timestamp;
    return diff < 1000 * 60 * 60 * 24
      ? formatDistanceToNow(timestamp, { addSuffix: true })
      : format(timestamp, "MMM d, yyyy");
  };

  const netProfit = portfolioValue + totalSell - totalBuy;
  const isProfit = netProfit >= 0;

  const exportToCSV = () => {
    const header = "Type,Coin,Amount,Price per unit,Total,Date\n";
    const rows = trades.map((trade) => {
      const date = trade.time ? format(trade.time, "yyyy-MM-dd HH:mm") : "N/A";
      const unitPrice = trade.amount ? (trade.total / trade.amount).toFixed(2) : "0";
      return `${trade.type},${trade.coin},${trade.amount},${unitPrice},${trade.total.toFixed(2)},${date}`;
    });

    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trade_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-8">
      <h1 className="text-3xl font-extrabold text-center text-purple-700 mb-8">
        📜 Trade History
      </h1>

      {loading && <p className="text-center text-gray-600">Loading your trades...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && trades.length > 0 && (
        <div className="max-w-2xl mx-auto bg-white p-6 mb-6 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold mb-2 text-gray-800">💼 Profit / Loss Summary</h2>
          <p className="text-gray-700">
            💸 Total Spent on Buys: <strong>${totalBuy.toFixed(2)}</strong>
          </p>
          <p className="text-gray-700">
            💵 Total Earned from Sells: <strong>${totalSell.toFixed(2)}</strong>
          </p>
          <p className="text-gray-700">
            🧾 Current Value of Portfolio: <strong>${portfolioValue.toFixed(2)}</strong>
          </p>
          <p className={`mt-3 text-lg font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}>
            {isProfit ? "📈 Net Profit:" : "📉 Net Loss:"} ${Math.abs(netProfit).toFixed(2)}
          </p>

          <button
            onClick={exportToCSV}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            ⬇️ Download CSV
          </button>
        </div>
      )}

      {!loading && !error && trades.length > 0 && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className={`flex justify-between items-center py-3 border-b last:border-b-0 ${
                trade.type === "buy" ? "text-green-700" : "text-red-700"
              }`}
            >
              <div>
                <div className="font-semibold capitalize">
                  {trade.type} {trade.coin}
                </div>
                <div className="text-sm text-gray-500">
                  {trade.amount} units • {formatTimeAgo(trade.time)}
                </div>
              </div>
              <div className="text-right font-bold">${trade.total.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && trades.length === 0 && (
        <p className="text-center text-gray-500 italic">No trades recorded yet.</p>
      )}

      <div className="text-center mt-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-purple-600 hover:underline text-sm"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

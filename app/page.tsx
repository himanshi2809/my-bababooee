"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Transaction = {
  id: number;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  notes: string | null;
};

type BalanceItem = {
  id: number;
  name: string;
  type: "asset" | "liability";
  amount: number;
  notes: string | null;
};

export default function Home() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balanceItems, setBalanceItems] = useState<BalanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [balanceName, setBalanceName] = useState("");
  const [balanceType, setBalanceType] = useState<"asset" | "liability">("asset");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceNotes, setBalanceNotes] = useState("");
  
  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function loadTransactions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Could not load transactions.");
    } else {
      setTransactions(data || []);
    }

    setLoading(false);
  }

  async function loadBalanceItems() {
  const { data, error } = await supabase
    .from("balance_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    alert("Could not load assets and liabilities.");
  } else {
    setBalanceItems(data || []);
  }
}
  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      await loadTransactions();
      await loadBalanceItems();
    }

    checkUser();
  }, []);

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();

    if (!description || !amount) {
      alert("Please enter a description and amount.");
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      date,
      description,
      category,
      type,
      amount: Number(amount),
      notes: notes || null,
      user_id: user.id,
    });

    if (error) {
      console.error(error);
      alert("Could not add transaction.");
      return;
    }

    setDescription("");
    setAmount("");
    setNotes("");

    await loadTransactions();
  }

  async function addBalanceItem(e: React.FormEvent) {
  e.preventDefault();

  if (!balanceName || !balanceAmount) {
    alert("Please enter a name and amount.");
    return;
  }

  const { error } = await supabase.from("balance_items").insert({
    name: balanceName,
    type: balanceType,
    amount: Number(balanceAmount),
    notes: balanceNotes || null,
    user_id: user.id,
  });
  if (error) {
    console.error(error);
    alert("Could not add item.");
    return;
  }

  setBalanceName("");
  setBalanceAmount("");
  setBalanceNotes("");

  await loadBalanceItems();
  }

  async function deleteTransaction(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Could not delete transaction.");
      return;
    }

    await loadTransactions();
  }

  async function deleteBalanceItem(id: number) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this item?"
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("balance_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Could not delete item.");
    return;
  }

  await loadBalanceItems();
  }

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;
  const totalAssets = balanceItems
    .filter((item) => item.type === "asset")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalLiabilities = balanceItems
    .filter((item) => item.type === "liability")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const netWorth = totalAssets - totalLiabilities;

  function money(value: number): string {
  // Divides by 1,000 to match your original logic
    const thousands = value / 1000;

    return `₹${thousands.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}k`;
  }


  return (
  <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-slate-900">
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}

      <div className="mb-10 flex items-end justify-between">

        <div>

          <div className="mb-2 inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            PERSONAL FINANCE
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            My Ledger
          </h1>

          <p className="mt-2 text-slate-500">
            Your money, all in one place.
          </p>

        </div>


        <div className="flex items-center gap-6">

          <div className="hidden text-right sm:block">

            <p className="text-sm text-slate-400">
              Current balance
            </p>

            <p className="text-2xl font-bold text-indigo-600">
              {money(balance)}
            </p>

          </div>


          <button
            onClick={logout}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            Log out
          </button>

        </div>

      </div>


      {/* Cash Flow */}

      <div className="mb-3">
        <h2 className="text-lg font-semibold text-slate-800">
          Cash Flow
        </h2>
        <p className="text-sm text-slate-400">
          Money coming in and going out
        </p>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-3">

        {/* Income */}

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-700">
              Total Income
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
              ↑
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold text-emerald-700">
            {money(totalIncome)}
          </p>
        </div>


        {/* Expenses */}

        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-rose-700">
              Total Expenses
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm">
              ↓
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold text-rose-700">
            {money(totalExpenses)}
          </p>
        </div>


        {/* Net Cash Flow */}

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-indigo-700">
              Net Cash Flow
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
              =
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold text-indigo-700">
            {money(balance)}
          </p>
        </div>

      </div>


      {/* Financial Position */}

      <div className="mb-3">
        <h2 className="text-lg font-semibold text-slate-800">
          Financial Position
        </h2>

        <p className="text-sm text-slate-400">
          What you own versus what you owe
        </p>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-3">

        {/* Assets */}

        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-sky-700">
            Assets
          </p>

          <p className="mt-3 text-3xl font-bold text-sky-700">
            {money(totalAssets)}
          </p>

          <p className="mt-2 text-xs text-sky-600">
            What you own
          </p>
        </div>


        {/* Liabilities */}

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-amber-700">
            Liabilities
          </p>

          <p className="mt-3 text-3xl font-bold text-amber-700">
            {money(totalLiabilities)}
          </p>

          <p className="mt-2 text-xs text-amber-600">
            What you owe
          </p>
        </div>


        {/* Net Worth */}

        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-violet-700">
            Net Worth
          </p>

          <p className="mt-3 text-3xl font-bold text-violet-700">
            {money(netWorth)}
          </p>

          <p className="mt-2 text-xs text-violet-600">
            Assets − Liabilities
          </p>
        </div>

      </div>


      {/* Add Transaction */}

      <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            Add Transaction
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Record income or an expense
          </p>
        </div>

        <form
          onSubmit={addTransaction}
          className="grid gap-4 md:grid-cols-6"
        >

          {/* Date */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Date
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>


          {/* Description */}

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>

            <input
              type="text"
              placeholder="e.g. Tesco"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>


          {/* Category */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Category
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option>Food</option>
              <option>Transport</option>
              <option>Shopping</option>
              <option>Bills</option>
              <option>Entertainment</option>
              <option>Flights</option>
              <option>Hotels</option>
              <option>Rent</option>
              <option>Salary</option>
              <option>Tutoring</option>
              <option>Other</option>
            </select>
          </div>


          {/* Type */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Type
            </label>

            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as "income" | "expense")
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>


          {/* Amount */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Amount
            </label>

            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>


          {/* Notes */}

          <div className="md:col-span-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Notes
            </label>

            <input
              type="text"
              placeholder="Optional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>


          {/* Add Button */}

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
            >
              + Add
            </button>
          </div>

        </form>

      </div>


      {/* Assets & Liabilities */}

      <div className="mb-10 rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-6">

          <h2 className="text-xl font-bold text-slate-800">
            Assets & Liabilities
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Keep track of what you own and what you owe
          </p>

        </div>
        
        
        
        {/* Add Asset / Liability */}

        <div className="bg-slate-50 p-6">
          
          <form
            onSubmit={addBalanceItem}
            className="grid gap-4 md:grid-cols-5"
          >

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Name
              </label>

              <input
                type="text"
                placeholder="e.g. Savings Account"
                value={balanceName}
                onChange={(e) => setBalanceName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>


            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Type
              </label>

              <select
                value={balanceType}
                onChange={(e) =>
                  setBalanceType(
                    e.target.value as "asset" | "liability"
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
              </select>
            </div>


            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Amount
              </label>

              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>


            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Notes
              </label>

              <input
                type="text"
                placeholder="Optional"
                value={balanceNotes}
                onChange={(e) => setBalanceNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>


            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-slate-800 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-900"
              >
                + Add
              </button>
            </div>

          </form>

        </div>


        {/* Assets / Liabilities Table */}

        {balanceItems.length === 0 ? (

          <div className="p-8 text-center text-sm text-slate-400">
            No assets or liabilities added yet.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">

                <tr>
                  <th className="px-6 py-4">
                    Name
                  </th>

                  <th className="px-6 py-4">
                    Type
                  </th>

                  <th className="px-6 py-4">
                    Notes
                  </th>

                  <th className="px-6 py-4 text-right">
                    Amount
                  </th>
                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100">

                {balanceItems.map((item) => (

                  <tr
                    key={item.id}
                    className="transition hover:bg-slate-50"
                  >

                    <td className="px-6 py-4 font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.type === "asset"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>

                    <td className="max-w-xs px-6 py-4 text-sm text-slate-400">
                      {item.notes || "—"}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold text-slate-700">
                      {money(Number(item.amount))}
                    </td>

                    <td className="px-6 py-4 text-right">

                      <button
                        onClick={() =>
                          deleteBalanceItem(item.id)
                        }
                        className="text-sm text-slate-400 transition hover:text-rose-600"
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* Transactions */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-6">

          <h2 className="text-xl font-bold text-slate-800">
            Transactions
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Your income and expenses
          </p>

        </div>


        {loading ? (

          <div className="p-8 text-center text-slate-400">
            Loading...
          </div>

        ) : transactions.length === 0 ? (

          <div className="p-8 text-center text-slate-400">
            No transactions yet.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">

                <tr>

                  <th className="px-6 py-4">
                    Date
                  </th>

                  <th className="px-6 py-4">
                    Description
                  </th>

                  <th className="px-6 py-4">
                    Category
                  </th>

                  <th className="px-6 py-4">
                    Type
                  </th>

                  <th className="px-6 py-4 text-right">
                    Amount
                  </th>

                  <th className="px-6 py-4"></th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100">

                {transactions.map((transaction) => (

                  <tr
                    key={transaction.id}
                    className="transition hover:bg-slate-50"
                  >

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(
                        transaction.date + "T00:00:00"
                      ).toLocaleDateString("en-GB")}
                    </td>


                    <td className="px-6 py-4 font-medium text-slate-800">
                      {transaction.description}
                    </td>


                    <td className="px-6 py-4">

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {transaction.category}
                      </span>

                    </td>


                    <td className="px-6 py-4">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          transaction.type === "income"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {transaction.type}
                      </span>

                    </td>


                    <td
                      className={`px-6 py-4 text-right font-semibold ${
                        transaction.type === "income"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {transaction.type === "income"
                        ? "+"
                        : "-"}
                      {money(Number(transaction.amount))}
                    </td>


                    <td className="px-6 py-4 text-right">

                      <button
                        onClick={() =>
                          deleteTransaction(transaction.id)
                        }
                        className="text-sm text-slate-400 transition hover:text-rose-600"
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  </main>
);
}
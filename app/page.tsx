"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Transaction = {
  id: number;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  notes: string | null;
};

export default function Home() {
  const supabase = createClient();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

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

  useEffect(() => {
    loadTransactions();
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

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  function money(value: number) {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "INR",
    }).format(value);
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl px-6 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Ledger</h1>
          <p className="mt-1 text-gray-500">
            A simple record of your income and expenses.
          </p>
        </div>

        {/* Totals */}

        <div className="mb-8 grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="mt-2 text-3xl font-semibold">
              {money(totalIncome)}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="mt-2 text-3xl font-semibold">
              {money(totalExpenses)}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Balance</p>
            <p className="mt-2 text-3xl font-semibold">
              {money(balance)}
            </p>
          </div>

        </div>

        {/* Add transaction */}

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-xl font-semibold">
            Add transaction
          </h2>

          <form
            onSubmit={addTransaction}
            className="grid gap-4 md:grid-cols-6"
          >

            <div>
              <label className="mb-1 block text-sm font-medium">
                Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Description
              </label>

              <input
                type="text"
                placeholder="e.g. Tesco"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border p-2"
              >
                <option>Food</option>
                <option>Transport</option>
                <option>Shopping</option>
                <option>Bills</option>
                <option>Entertainment</option>
                <option>Travel</option>
                <option>Rent</option>
                <option>Salary</option>
                <option>Tutoring</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Type
              </label>

              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "income" | "expense")
                }
                className="w-full rounded-lg border p-2"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Amount
              </label>

              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div className="md:col-span-5">
              <label className="mb-1 block text-sm font-medium">
                Notes
              </label>

              <input
                type="text"
                placeholder="Optional"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
              >
                Add
              </button>
            </div>

          </form>

        </div>

        {/* Transactions */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">
              Transactions
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-gray-500">
              Loading...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-gray-500">
              No transactions yet.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="bg-gray-50 text-sm text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3 text-right">
                      Amount
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>

                <tbody className="divide-y">

                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>

                      <td className="px-6 py-4">
                        {new Date(
                          transaction.date + "T00:00:00"
                        ).toLocaleDateString("en-GB")}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        {transaction.description}
                      </td>

                      <td className="px-6 py-4 text-gray-500">
                        {transaction.category}
                      </td>

                      <td className="px-6 py-4 capitalize">
                        {transaction.type}
                      </td>

                      <td
                        className={`px-6 py-4 text-right font-medium ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
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
                          className="text-sm text-gray-400 hover:text-red-600"
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
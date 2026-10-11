import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const TransactionContext = createContext(null);

export const TransactionProvider = ({ children }) => {
  const { authUser } = useAuthContext();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const getHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (authUser && authUser.token) {
      headers['Authorization'] = `Bearer ${authUser.token}`;
    }
    return headers;
  }, [authUser]);

  const fetchTransactions = useCallback(async () => {
    if (!authUser) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/gettransaction', {
        headers: getHeaders(),
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setTransactions(data);
      } else if (data && data.error) {
        // If empty or handled error
        setTransactions([]);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [authUser, getHeaders]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(async ({ name, type, amount, date, category }) => {
    try {
      if (!name || !type || amount === undefined || amount === '' || !date || !category) {
        toast.error('Please fill in all fields');
        return false;
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        toast.error('Amount must be a positive number');
        return false;
      }

      const res = await fetch('/api/addtransaction', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          type,
          amount: numAmount,
          date,
          category: category.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to add transaction');
      }

      toast.success(type === 'income' ? 'Income added successfully!' : 'Expense added successfully!');
      // Refetch automatically so all cards, charts, and table refresh simultaneously
      await fetchTransactions();
      return true;
    } catch (err) {
      toast.error(err.message || 'Error adding transaction');
      return false;
    }
  }, [getHeaders, fetchTransactions]);

  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalBalance = useMemo(() => {
    return totalIncome - totalExpense;
  }, [totalIncome, totalExpense]);

  const value = useMemo(
    () => ({
      transactions,
      loading,
      totalIncome,
      totalExpense,
      totalBalance,
      refetch: fetchTransactions,
      addTransaction,
    }),
    [transactions, loading, totalIncome, totalExpense, totalBalance, fetchTransactions, addTransaction]
  );

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

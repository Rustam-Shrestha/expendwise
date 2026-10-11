import { useTransactions } from "../context/TransactionContext";

const useGetTransaction = () => {
  const { transactions, totalIncome, totalExpense, totalBalance, loading, refetch } = useTransactions();

  return {
    transaction: transactions,
    transactions,
    totalIncome,
    totalExpense,
    totalBalance,
    loading,
    getTransaction: refetch,
    refetch,
  };
};

export default useGetTransaction;
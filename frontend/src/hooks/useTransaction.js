import { useTransactions } from "../context/TransactionContext";

const useTransaction = () => {
  const { addTransaction } = useTransactions();
  return { addTransaction };
};

export default useTransaction;

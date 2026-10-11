import React from 'react';
import useGetTransaction from '../../hooks/useGetTransaction';

const BalanceCard = () => {
  const { totalBalance } = useGetTransaction();
  const balanceNum = Number(totalBalance || 0);

  return (
    <div className="w-80 md:w-96 mx-auto p-6 bg-white shadow-lg rounded-2xl border border-gray-100 transition-all hover:shadow-xl">
      <div className="text-center">
        <span
          className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
            balanceNum >= 0 ? 'text-blue-600 bg-blue-50' : 'text-rose-600 bg-rose-50'
          }`}
        >
          Net Worth
        </span>
        <h2 className="text-xl font-semibold text-gray-700 mt-2">Total Balance</h2>
        <p
          className={`text-3xl font-extrabold mt-2 ${
            balanceNum >= 0 ? 'text-blue-600' : 'text-rose-600'
          }`}
        >
          ${balanceNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="mt-4 py-2 px-4 bg-gray-50 rounded-xl text-xs text-gray-500 font-medium">
          {balanceNum >= 0 ? 'Positive Cash Flow' : 'Deficit Detected'}
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
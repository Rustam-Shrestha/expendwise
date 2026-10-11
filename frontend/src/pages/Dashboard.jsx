import React from 'react';
import Header from '../components/Header';
import IncomeCard from '../components/Modal/Addincome';
import ExpenseCard from '../components/Modal/Addexpense';
import BalanceCard from '../components/Modal/Totalbalance';
import Transactiontable from '../components/Transactiontable';
import Chart from '../components/Chart';
import PieChart from '../components/PieChart';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BalanceCard />
          <IncomeCard />
          <ExpenseCard />
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Chart />
          <PieChart />
        </section>

        {/* Transactions Table Section */}
        <section>
          <Transactiontable />
        </section>
      </main>
    </div>
  );
}

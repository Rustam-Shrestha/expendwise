import React, { useEffect, useRef, useMemo } from 'react';
import { Chart as ChartJS, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js';
import useGetTransaction from '../hooks/useGetTransaction';

ChartJS.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

export default function TransactionChart() {
  const { transaction } = useGetTransaction();
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const chartData = useMemo(() => {
    if (!transaction || transaction.length === 0) return null;

    // Group transactions by date
    const dateMap = {};
    const sorted = [...transaction].sort((a, b) => new Date(a.date) - new Date(b.date));

    sorted.forEach((t) => {
      const dateStr = new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { income: 0, expense: 0 };
      }
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        dateMap[dateStr].income += amt;
      } else if (t.type === 'expense') {
        dateMap[dateStr].expense += amt;
      }
    });

    const labels = Object.keys(dateMap);
    const incomePoints = labels.map((l) => dateMap[l].income);
    const expensePoints = labels.map((l) => dateMap[l].expense);

    return { labels, incomePoints, expensePoints };
  }, [transaction]);

  useEffect(() => {
    if (!canvasRef.current || !chartData) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Income',
            data: chartData.incomePoints,
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#16a34a',
            fill: true,
            tension: 0.3,
          },
          {
            label: 'Expenses',
            data: chartData.expensePoints,
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#dc2626',
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              font: { weight: '600' },
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: $${Number(ctx.raw || 0).toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 8 },
          },
          y: {
            grid: { color: '#f3f4f6' },
            ticks: {
              callback: (val) => `$${val}`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [chartData]);

  if (!transaction || transaction.length === 0) {
    return (
      <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col justify-center items-center min-h-[350px]">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Cash Flow Trends</h3>
        <p className="text-gray-400 text-sm">Add income and expense transactions to view cash flow charts.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Cash Flow Analytics</h3>
          <p className="text-sm text-gray-500">Income vs. Expense over time</p>
        </div>
      </div>
      <div className="w-full h-[320px]">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
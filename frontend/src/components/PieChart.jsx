import React, { useEffect, useRef, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, PieController } from 'chart.js';
import useGetTransaction from '../hooks/useGetTransaction';

ChartJS.register(ArcElement, Tooltip, Legend, PieController);

const PALETTE = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#64748b', // Slate
];

export default function ExpensePieChart() {
  const { transaction } = useGetTransaction();
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const pieData = useMemo(() => {
    if (!transaction || transaction.length === 0) return null;

    const expenses = transaction.filter((t) => t.type === 'expense');
    if (expenses.length === 0) return null;

    const categoryMap = {};
    expenses.forEach((t) => {
      const cat = t.category || t.categoryName || 'General';
      const amt = Number(t.amount) || 0;
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    });

    const labels = Object.keys(categoryMap);
    const data = labels.map((l) => categoryMap[l]);
    const backgroundColors = labels.map((_, i) => PALETTE[i % PALETTE.length]);

    return { labels, data, backgroundColors };
  }, [transaction]);

  useEffect(() => {
    if (!canvasRef.current || !pieData) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new ChartJS(ctx, {
      type: 'doughnut',
      data: {
        labels: pieData.labels,
        datasets: [
          {
            data: pieData.data,
            backgroundColor: pieData.backgroundColors,
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              padding: 12,
              font: { weight: '500' },
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = Number(ctx.raw || 0);
                const total = pieData.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${ctx.label}: $${val.toLocaleString()} (${pct}%)`;
              },
            },
          },
        },
        cutout: '65%',
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [pieData]);

  if (!pieData) {
    return (
      <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col justify-center items-center min-h-[350px]">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Expense Distribution</h3>
        <p className="text-gray-400 text-sm">Add expense transactions to see your spending breakdown by category.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Expense Distribution</h3>
          <p className="text-sm text-gray-500">Breakdown of expenses by category</p>
        </div>
      </div>
      <div className="w-full h-[320px]">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
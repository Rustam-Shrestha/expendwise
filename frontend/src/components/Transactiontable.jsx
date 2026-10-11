import React, { useMemo, useState } from 'react';
import useGetTransaction from '../hooks/useGetTransaction';
import { Table, Tag, Input, Select } from 'antd';

export default function TransactionTable() {
  const { transaction, loading } = useGetTransaction();
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-semibold text-gray-800">{text || 'Untitled'}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => {
        const formattedDate = text ? new Date(text).toLocaleDateString('en-GB') : '-';
        return <span className="text-gray-500">{formattedDate}</span>;
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text) => (
        <Tag color={text === 'income' ? 'green' : 'volcano'} className="capitalize font-medium px-2.5 py-0.5">
          {text}
        </Tag>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text, record) => {
        const cat = text || record.categoryName || 'General';
        return <span className="text-gray-700 font-medium">{cat}</span>;
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (text, record) => {
        const amt = Number(text || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return (
          <span className={`font-bold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
            {record.type === 'income' ? `+$${amt}` : `-$${amt}`}
          </span>
        );
      },
    },
  ];

  const filteredAndSortedTransactions = useMemo(() => {
    const list = [...(transaction || [])];
    return list
      .filter((item) => {
        if (filterType !== 'all' && item.type !== filterType) return false;
        if (search) {
          const s = search.toLowerCase();
          const nameMatch = (item.name || '').toLowerCase().includes(s);
          const catMatch = (item.category || item.categoryName || '').toLowerCase().includes(s);
          if (!nameMatch && !catMatch) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [transaction, filterType, search]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 my-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
          <p className="text-sm text-gray-500">Overview of your most recent earnings and expenditures</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 rounded-lg"
            allowClear
          />
          <Select
            value={filterType}
            onChange={setFilterType}
            className="w-32 rounded-lg"
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'income', label: 'Income Only' },
              { value: 'expense', label: 'Expense Only' },
            ]}
          />
        </div>
      </div>

      <Table
        dataSource={filteredAndSortedTransactions}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        rowKey={(record) => record._id || record.id || Math.random()}
        className="rounded-xl overflow-hidden"
        rowClassName={(_, index) => (index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white')}
      />
    </div>
  );
}
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { BudgetItem, BudgetItemType } from '../types';
import {
  Wallet,
  Plus,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sliders,
  DollarSign,
  FolderPlus,
} from 'lucide-react';

export const BudgetTrackerView: React.FC = () => {
  const { user } = useAuth();
  const {
    budgetPlans,
    activeBudgetPlan,
    switchBudgetPlan,
    createBudgetPlan,
    updateBudgetLimit,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
  } = useData();

  // Modal States
  const [newPlanModalOpen, setNewPlanModalOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);

  // Form states
  const [planName, setPlanName] = useState('');
  const [planCurrency, setPlanCurrency] = useState('GH₵');
  const [planLimit, setPlanLimit] = useState(5000);

  const [editLimitValue, setEditLimitValue] = useState(activeBudgetPlan.totalBudget || 5000);
  const [itemCategory, setItemCategory] = useState<BudgetItemType>('EXPENSES');
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState<number>(100);

  // Currency & calculations
  const cur = activeBudgetPlan.currency || 'GH₵';
  const totalBudget = activeBudgetPlan.totalBudget || 5000;

  const items = activeBudgetPlan.items || [];
  const billsItems = items.filter((i) => i.type === 'BILLS');
  const expensesItems = items.filter((i) => i.type === 'EXPENSES');
  const savingsItems = items.filter((i) => i.type === 'SAVINGS');
  const debtItems = items.filter((i) => i.type === 'DEBT');

  const sumCategory = (arr: BudgetItem[]) =>
    arr.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const billsTotal = sumCategory(billsItems);
  const expensesTotal = sumCategory(expensesItems);
  const savingsTotal = sumCategory(savingsItems);
  const debtTotal = sumCategory(debtItems);

  const totalOutflow = billsTotal + expensesTotal + savingsTotal + debtTotal;
  const remaining = totalBudget - totalOutflow;
  const usedPercent = totalBudget > 0 ? (totalOutflow / totalBudget) * 100 : 0;
  const isOverBudget = totalOutflow > totalBudget;

  const maxRows = Math.max(
    1,
    billsItems.length,
    expensesItems.length,
    savingsItems.length,
    debtItems.length
  );

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBudgetPlan(planName.trim() || 'Custom Plan', planCurrency, planLimit);
    setNewPlanModalOpen(false);
    setPlanName('');
  };

  const handleSaveLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBudgetLimit(editLimitValue);
    setLimitModalOpen(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    await addBudgetItem({
      type: itemCategory,
      name: itemName.trim().toUpperCase(),
      amount: Number(itemAmount) || 0,
    });
    setAddItemModalOpen(false);
    setItemName('');
    setItemAmount(100);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Smart Dynamic Budgeting 🔥
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Real-time multi-plan financial planner for semester hostel, bills, savings, and groceries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Plan Selector */}
          <select
            value={activeBudgetPlan.id}
            onChange={(e) => switchBudgetPlan(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            {budgetPlans.map((p) => (
              <option key={p.id} value={p.id}>
                📁 {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setNewPlanModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" /> New Plan
          </button>

          <button
            onClick={() => {
              setEditLimitValue(totalBudget);
              setLimitModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-slate-400" />
            Set Budget Limit
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Budget Limit</span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {cur} {totalBudget.toLocaleString()}
          </div>
          <small className="text-[11px] text-slate-400">Total planned cap</small>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-rose-500 to-red-600 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Outflow</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            {cur} {totalOutflow.toLocaleString()}
          </div>
          <small className="text-[11px] text-slate-400">Sum of all categories</small>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Remaining Balance</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div
            className={`text-xl md:text-2xl font-extrabold font-mono ${
              remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {cur} {remaining.toLocaleString()}
          </div>
          <small className="text-[11px] text-slate-400">
            {remaining >= 0 ? 'Surplus / Discretionary' : 'Deficit / Over budget'}
          </small>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-yellow-400 absolute top-0 inset-x-0" />
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Budget Usage</span>
            {isOverBudget ? (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {Math.round(usedPercent)}%
          </div>
          <small className="text-[11px] text-slate-400">
            {isOverBudget ? 'Exceeded by ' + cur + ' ' + Math.abs(remaining) : 'Within limit'}
          </small>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          <span>Budget Capacity Utilization</span>
          <span className={isOverBudget ? 'text-rose-600' : 'text-slate-600'}>
            {Math.round(usedPercent)}% Used
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            style={{ width: `${Math.min(100, usedPercent)}%` }}
            className={`h-full transition-all duration-500 rounded-full ${
              isOverBudget
                ? 'bg-gradient-to-r from-rose-500 to-red-600'
                : 'bg-gradient-to-r from-blue-600 to-cyan-400'
            }`}
          />
        </div>
      </div>

      {/* Category Grid Breakdown Table */}
      <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Category Breakdown: {activeBudgetPlan.name}
            </h3>
            <p className="text-xs text-slate-400">
              Click any item name or amount to edit inline. All changes sync immediately to Firestore.
            </p>
          </div>

          <button
            onClick={() => setAddItemModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Row Item
          </button>
        </div>

        {/* 4 Column Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3 w-1/4">BILLS ({billsItems.length})</th>
                <th className="py-3 px-3 w-1/4">EXPENSES ({expensesItems.length})</th>
                <th className="py-3 px-3 w-1/4">SAVINGS ({savingsItems.length})</th>
                <th className="py-3 px-3 w-1/4">DEBT ({debtItems.length})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {Array.from({ length: maxRows }).map((_, rIdx) => {
                const bItem = billsItems[rIdx];
                const eItem = expensesItems[rIdx];
                const sItem = savingsItems[rIdx];
                const dItem = debtItems[rIdx];

                const renderCell = (item?: BudgetItem) => {
                  if (!item) return <div className="text-slate-300 dark:text-slate-700 text-center py-2">—</div>;
                  return (
                    <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 group transition">
                      <input
                        type="text"
                        defaultValue={item.name}
                        onBlur={(e) => {
                          const val = e.target.value.trim().toUpperCase();
                          if (val && val !== item.name) {
                            updateBudgetItem(item.id, val, item.amount);
                          }
                        }}
                        className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:bg-white dark:focus:bg-slate-900 px-1.5 py-0.5 rounded truncate"
                      />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[10px] text-slate-400">{cur}</span>
                        <input
                          type="number"
                          defaultValue={item.amount}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val !== item.amount) {
                              updateBudgetItem(item.id, item.name, val);
                            }
                          }}
                          className="w-16 px-1.5 py-0.5 rounded text-xs font-mono font-bold text-right bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                        <button
                          onClick={() => deleteBudgetItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                };

                return (
                  <tr key={rIdx} className="border-b border-slate-100 dark:border-slate-700/40">
                    <td className="p-2 align-top">{renderCell(bItem)}</td>
                    <td className="p-2 align-top">{renderCell(eItem)}</td>
                    <td className="p-2 align-top">{renderCell(sItem)}</td>
                    <td className="p-2 align-top">{renderCell(dItem)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-900 font-extrabold text-xs font-mono border-t-2 border-slate-200 dark:border-slate-700">
                <td className="py-3 px-3 text-slate-900 dark:text-white">
                  Total: {cur} {billsTotal.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-slate-900 dark:text-white">
                  Total: {cur} {expensesTotal.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-slate-900 dark:text-white">
                  Total: {cur} {savingsTotal.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-slate-900 dark:text-white">
                  Total: {cur} {debtTotal.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* New Plan Modal */}
      {newPlanModalOpen && (
        <div
          onClick={() => setNewPlanModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Create New Budget Plan
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              e.g. Vacation Plan, Minimalist Living, Off-Campus Hostel.
            </p>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Semester 2 Hostel Plan"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    required
                    value={planCurrency}
                    onChange={(e) => setPlanCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Budget Ceiling
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={planLimit}
                    onChange={(e) => setPlanLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Limit Modal */}
      {limitModalOpen && (
        <div
          onClick={() => setLimitModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Set Total Budget Limit
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Adjust your overall spending ceiling for {activeBudgetPlan.name}.
            </p>

            <form onSubmit={handleSaveLimit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Budget Ceiling ({cur})
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={editLimitValue}
                  onChange={(e) => setEditLimitValue(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setLimitModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Row Item Modal */}
      {addItemModalOpen && (
        <div
          onClick={() => setAddItemModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Add Budget Row Item
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select category and enter description with expected amount.
            </p>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category Section
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value as BudgetItemType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="BILLS">BILLS</option>
                  <option value="EXPENSES">EXPENSES</option>
                  <option value="SAVINGS">SAVINGS</option>
                  <option value="DEBT">DEBT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Item Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INTERNET DATA, CAMPUS LAUNDRY"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount ({cur})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={itemAmount}
                  onChange={(e) => setItemAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

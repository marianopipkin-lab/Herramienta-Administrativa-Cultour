import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GeneralDashboard } from './components/dashboard/GeneralDashboard';
import { OperationsMaster } from './components/operations/OperationsMaster';
import { OperationDetailModal } from './components/operations/OperationDetailModal';
import { NewOperationModal } from './components/operations/NewOperationModal';
import { BulkImportModal } from './components/operations/BulkImportModal';
import { StudentPayerManager } from './components/students/StudentPayerManager';
import { SuppliersMaster } from './components/suppliers/SuppliersMaster';
import { FinancialMovementsView } from './components/movements/FinancialMovementsView';
import { ReconciliationView } from './components/reconciliation/ReconciliationView';
import { FixedExpensesView } from './components/fixed-expenses/FixedExpensesView';
import { FinancialProjectionView } from './components/projection/FinancialProjectionView';
import { MonthlyClosingView } from './components/closing/MonthlyClosingView';
import { HistoricalView } from './components/history/HistoricalView';
import { AccountsView } from './components/accounts/AccountsView';
import { GoogleSheetsView } from './components/sheets/GoogleSheetsView';
import { ClientsView } from './components/clients/ClientsView';

const MainContent: React.FC = () => {
  const {
    activeTab,
    selectedOperationId,
    setSelectedOperationId,
    isNewOpModalOpen,
    setIsNewOpModalOpen,
    isImportModalOpen,
    setIsImportModalOpen
  } = useApp();

  return (
    <div className="min-h-screen bg-[#111113] text-[#f2f2f2] flex flex-col font-sans antialiased selection:bg-[#a5b4fc] selection:text-[#111113]">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#111113] bg-grid-dots">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <GeneralDashboard />}
            {activeTab === 'operations' && <OperationsMaster />}
            {activeTab === 'clients' && <ClientsView />}
            {activeTab === 'students' && <StudentPayerManager />}
            {activeTab === 'suppliers' && <SuppliersMaster />}
            {activeTab === 'movements' && <FinancialMovementsView />}
            {activeTab === 'reconciliation' && <ReconciliationView />}
            {activeTab === 'fixed_expenses' && <FixedExpensesView />}
            {activeTab === 'projection' && <FinancialProjectionView />}
            {activeTab === 'closing' && <MonthlyClosingView />}
            {activeTab === 'history' && <HistoricalView />}
            {activeTab === 'sheets' && <GoogleSheetsView />}
            {activeTab === 'accounts' && <AccountsView />}
          </div>
        </main>
      </div>

      {/* Modals */}
      {selectedOperationId && (
        <OperationDetailModal
          operationId={selectedOperationId}
          onClose={() => setSelectedOperationId(null)}
        />
      )}

      {isNewOpModalOpen && (
        <NewOperationModal
          isOpen={isNewOpModalOpen}
          onClose={() => setIsNewOpModalOpen(false)}
        />
      )}

      {isImportModalOpen && (
        <BulkImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

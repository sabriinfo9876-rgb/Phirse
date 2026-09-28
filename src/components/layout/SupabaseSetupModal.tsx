import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Play,
  RefreshCw,
  X,
} from 'lucide-react';

import {
  isSupabaseConfigured,
  PersistenceTestReport,
  runSupabasePersistenceTest,
  supabaseProjectUrl,
} from '../../lib/supabase';

import {
  getSupabaseSqlEditorUrl,
  SUPABASE_SCHEMA_SQL,
} from '../../lib/supabaseSchemaSql';

import { useMarketplace } from '../../store/MarketplaceContext';

export const SupabaseSetupModal: React.FC = () => {
  const {
    supabaseStatus,
    supabaseError,
    supabaseModalOpen,
    setSupabaseModalOpen,
    refreshSupabaseData,
    pushToast,
  } = useMarketplace();

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testReport, setTestReport] =
    useState<PersistenceTestReport | null>(null);
  const [showRawSql, setShowRawSql] = useState(false);

  const sqlEditorUrl = getSupabaseSqlEditorUrl(supabaseProjectUrl);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);

      setCopied(true);

      pushToast({
        title: 'Copied supabase/schema.sql to clipboard',
        description:
          'Paste and click Run in your Supabase SQL Editor, then click Verify & Sync.',
        variant: 'success',
      });

      setTimeout(() => setCopied(false), 3000);
    } catch {
      setShowRawSql(true);

      pushToast({
        title: 'SQL schema expanded below — select all and copy',
        variant: 'default',
      });
    }
  };

  const handleVerifyAndSync = async () => {
    setSyncing(true);

    try {
      const res = await refreshSupabaseData();

      if (res.ok) {
        pushToast({
          title: 'Supabase Cloud Connected & Synced',
          description: res.message,
          variant: 'success',
        });
      } else {
        pushToast({
          title: 'Tables still missing in Supabase Cloud',
          description: res.message,
          variant: 'warning',
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleRunLiveTest = async () => {
    setTesting(true);
    setTestReport(null);

    try {
      const report = await runSupabasePersistenceTest();

      setTestReport(report);

      if (
        report.insertOk &&
        report.selectOk &&
        report.updateOk &&
        report.deleteOk
      ) {
        await refreshSupabaseData();

        pushToast({
          title: 'Supabase Cloud CRUD Test Passed (4/4)',
          description:
            'Real INSERT, SELECT, UPDATE, and DELETE verified on public.listings.',
          variant: 'success',
        });
      } else {
        pushToast({
          title: 'Supabase CRUD Test Completed',
          description:
            'One or more persistence checks failed. Review the test details below.',
          variant: 'warning',
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unexpected error while running the Supabase CRUD test.';

      setTestReport({
        configured: isSupabaseConfigured,
        insertOk: false,
        selectOk: false,
        updateOk: false,
        deleteOk: false,
        error: message,
        details: [],
      });

      pushToast({
        title: 'Supabase CRUD Test Failed',
        description: message,
        variant: 'warning',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      {/* Supabase connection / diagnostic banner */}
      {isSupabaseConfigured && !bannerDismissed && (
        <div className="bg-amber-50 border-b border-amber-200/90 px-4 py-2.5 text-xs text-amber-950">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {supabaseStatus === 'connected' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <Database className="w-4 h-4 text-[#0F5348] shrink-0" />
              )}

              <p className="leading-snug">
                <strong className="font-semibold">
                  {supabaseStatus === 'connected'
                    ? 'Supabase Cloud Connected:'
                    : 'Supabase Cloud:'}
                </strong>{' '}
                {supabaseStatus === 'connected'
                  ? 'Database is connected and ready for persistence testing.'
                  : `Your database (${supabaseProjectUrl}) may need setup in the SQL Editor.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {supabaseStatus !== 'connected' && (
                <>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3 py-1.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}

                    <span>
                      {copied ? 'SQL Copied!' : '1. Copy SQL Schema'}
                    </span>
                  </button>

                  <a
                    href={sqlEditorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-amber-300 text-gray-900 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>2. Open SQL Editor</span>
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>
                </>
              )}

              <button
                type="button"
                onClick={handleVerifyAndSync}
                disabled={syncing}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-amber-300 text-[#0F5348] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    syncing ? 'animate-spin' : ''
                  }`}
                />

                <span>{syncing ? 'Checking...' : 'Verify & Sync'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSupabaseModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg hover:bg-amber-100 text-amber-900 font-semibold underline"
              >
                Test Console
              </button>

              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss database setup notice"
                className="p-1 rounded-md text-amber-700 hover:bg-amber-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Interactive Setup & CRUD Diagnostic Modal */}
      {supabaseModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setSupabaseModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="supabase-modal-title"
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-gray-900/10 p-6 shadow-xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EBF3F1] text-[#0F5348] flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>

                <div>
                  <h2
                    id="supabase-modal-title"
                    className="font-display text-lg font-bold text-gray-900"
                  >
                    Supabase Cloud Setup & Live Persistence Verification
                  </h2>

                  <p className="text-xs text-gray-500 font-mono">
                    {supabaseProjectUrl || 'Not configured'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSupabaseModalOpen(false)}
                aria-label="Close modal"
                className="min-w-[36px] min-h-[36px] rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connection Status */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                supabaseStatus === 'connected'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                  {supabaseStatus === 'connected' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        Connected to Supabase Cloud — Tables Active & Synced
                      </span>
                    </>
                  ) : supabaseStatus === 'schema_missing' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        Connected to Supabase Cloud — Tables Not Created Yet
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Status: {supabaseStatus}</span>
                    </>
                  )}
                </div>

                {supabaseError && (
                  <p className="text-xs font-mono text-amber-800">
                    {supabaseError}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleVerifyAndSync}
                disabled={syncing}
                className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-900 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    syncing ? 'animate-spin' : ''
                  }`}
                />

                <span>
                  {syncing ? 'Checking...' : 'Re-check & Sync'}
                </span>
              </button>
            </div>

            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-gray-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                    Step 1: Initialize Tables & RLS Policies
                  </h3>

                  <p className="text-xs text-gray-600 mt-0.5">
                    Creates the PHIRSE database tables with Row Level Security
                    enabled.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}

                    <span>
                      {copied ? 'Copied SQL!' : 'Copy schema.sql'}
                    </span>
                  </button>

                  <a
                    href={sqlEditorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-300 text-gray-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open SQL Editor</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowRawSql((prev) => !prev)}
                  className="text-xs font-semibold text-[#0F5348] hover:underline"
                >
                  {showRawSql ? 'Hide SQL script' : 'View full SQL script'}
                </button>

                {showRawSql && (
                  <pre className="mt-2 p-3 rounded-lg bg-gray-900 text-gray-100 text-[11px] font-mono overflow-x-auto max-h-52">
                    {SUPABASE_SCHEMA_SQL}
                  </pre>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                    Step 2: Run Real End-to-End Database Test
                  </h3>

                  <p className="text-xs text-gray-600 mt-0.5">
                    Executes a live{' '}
                    <code className="font-mono">INSERT</code> →{' '}
                    <code className="font-mono">SELECT</code> →{' '}
                    <code className="font-mono">UPDATE</code> →{' '}
                    <code className="font-mono">DELETE</code> cycle against{' '}
                    <code className="font-mono">public.listings</code>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunLiveTest}
                  disabled={testing}
                  className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  <Play className="w-3.5 h-3.5" />

                  <span>
                    {testing
                      ? 'Running Live Test...'
                      : 'Run Live CRUD Test'}
                  </span>
                </button>
              </div>

              {testReport && (
                <div className="pt-3 border-t border-gray-100 space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        label: '1. INSERT',
                        ok: testReport.insertOk,
                      },
                      {
                        label: '2. SELECT',
                        ok: testReport.selectOk,
                      },
                      {
                        label: '3. UPDATE',
                        ok: testReport.updateOk,
                      },
                      {
                        label: '4. DELETE',
                        ok: testReport.deleteOk,
                      },
                    ].map((step) => (
                      <div
                        key={step.label}
                        className={`p-2.5 rounded-lg border font-semibold flex items-center justify-between ${
                          step.ok
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-red-50 border-red-200 text-red-900'
                        }`}
                      >
                        <span>{step.label}</span>
                        <span>{step.ok ? 'PASS' : 'FAIL'}</span>
                      </div>
                    ))}
                  </div>

                  {testReport.error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 font-mono text-[11px] break-words">
                      {testReport.error}
                    </div>
                  )}

                  {testReport.details.length > 0 && (
                    <ul className="space-y-1 text-gray-600 font-mono text-[11px] bg-gray-50 p-3 rounded-lg">
                      {testReport.details.map((line, idx) => (
                        <li key={idx}>✓ {line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
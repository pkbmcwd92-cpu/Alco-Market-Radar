import React, { useState, useMemo } from 'react';
import {
  MarketWorkspace,
  Competitor,
  AdObservation,
  CreativeFamily,
  MarketSignal,
  LandingPageObservation,
  MarketTrendMetric,
} from './types/radar';
import {
  INITIAL_WORKSPACES,
  INITIAL_COMPETITORS,
  INITIAL_AD_OBSERVATIONS,
  INITIAL_MARKET_SIGNALS,
  INITIAL_CREATIVE_FAMILIES,
  INITIAL_LANDING_PAGES,
  INITIAL_TREND_METRICS,
} from './data/mockData';
import {
  evaluateMarketSignals,
  clusterCreativeFamilies,
  classifyCreativeDeterministically,
} from './services/radarEngine';

import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { EvidenceModal } from './components/EvidenceModal';
import { AdDetailModal } from './components/AdDetailModal';
import { NewAdModal } from './components/NewAdModal';

import { DashboardView } from './components/views/DashboardView';
import { CompetitorsView } from './components/views/CompetitorsView';
import { AdsView } from './components/views/AdsView';
import { CreativesView } from './components/views/CreativesView';
import { SignalsView } from './components/views/SignalsView';
import { TrendsView } from './components/views/TrendsView';
import { LandingPagesView } from './components/views/LandingPagesView';
import { AlcoBridgeView } from './components/views/AlcoBridgeView';
import { ReportsView } from './components/views/ReportsView';
import { WorkspacesView } from './components/views/WorkspacesView';

export default function App() {
  // 1. Core State
  const [workspaces, setWorkspaces] = useState<MarketWorkspace[]>(INITIAL_WORKSPACES);
  const [currentWorkspace, setCurrentWorkspace] = useState<MarketWorkspace>(INITIAL_WORKSPACES[0]);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  const [competitors, setCompetitors] = useState<Competitor[]>(INITIAL_COMPETITORS);
  const [ads, setAds] = useState<AdObservation[]>(INITIAL_AD_OBSERVATIONS);
  const [signals, setSignals] = useState<MarketSignal[]>(INITIAL_MARKET_SIGNALS);
  const [landingPages, setLandingPages] = useState<LandingPageObservation[]>(INITIAL_LANDING_PAGES);
  const [trends, setTrends] = useState<MarketTrendMetric[]>(INITIAL_TREND_METRICS);

  // 2. Modals State
  const [selectedSignal, setSelectedSignal] = useState<MarketSignal | null>(null);
  const [selectedAd, setSelectedAd] = useState<AdObservation | null>(null);
  const [isNewAdModalOpen, setIsNewAdModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // 3. Workspace-scoped Entities
  const currentWorkspaceCompetitors = useMemo(() => {
    return competitors.filter((c) => c.workspaceId === currentWorkspace.id);
  }, [competitors, currentWorkspace.id]);

  const currentWorkspaceAds = useMemo(() => {
    return ads.filter((a) => a.workspaceId === currentWorkspace.id);
  }, [ads, currentWorkspace.id]);

  const currentWorkspaceSignals = useMemo(() => {
    return signals.filter((s) => s.workspaceId === currentWorkspace.id);
  }, [signals, currentWorkspace.id]);

  const currentWorkspaceFamilies = useMemo(() => {
    // Generate clusters deterministically from observed ads
    const clustered = clusterCreativeFamilies(currentWorkspaceAds);
    if (clustered.length > 0) return clustered;
    return INITIAL_CREATIVE_FAMILIES.filter((f) => f.workspaceId === currentWorkspace.id);
  }, [currentWorkspaceAds, currentWorkspace.id]);

  // 4. Handlers
  const handleAddAd = (newAd: AdObservation) => {
    const updatedAds = [newAd, ...ads];
    setAds(updatedAds);

    // Re-evaluate signals deterministically
    const competitorMap = new Map<string, string>(competitors.map((c) => [c.id, c.name]));
    const dynamicSignals = evaluateMarketSignals(currentWorkspace.id, updatedAds, competitorMap);

    // Merge without duplicate IDs
    const existingIds = new Set(signals.map((s) => s.id));
    const newSignals = dynamicSignals.filter((ds) => !existingIds.has(ds.id));
    if (newSignals.length > 0) {
      setSignals([...newSignals, ...signals]);
    }

    showToast(`Ad observation recorded! Deterministically classified as ${classifyCreativeDeterministically(newAd).hookType} hook.`);
  };

  const handleTriggerSurgeSimulation = () => {
    // Pick the first competitor in the current workspace
    const targetComp = currentWorkspaceCompetitors[0];
    if (!targetComp) return;

    const now = new Date().toISOString();
    const simulatedAd1: AdObservation = {
      id: `ad_surge_sim_1_${Date.now()}`,
      workspaceId: currentWorkspace.id,
      competitorId: targetComp.id,
      externalAdId: `meta_surge_live_1`,
      platform: 'meta',
      advertiserName: targetComp.name,
      pageName: targetComp.metaPageId,
      adStatus: 'active',
      firstSeen: now,
      lastSeen: now,
      detectedAt: now,
      format: 'video',
      headline: 'Kuis Cek Jenis Masalah Kulit: Rekomendasi Rutin Personal 60 Detik',
      primaryText: 'Masih bingung kenapa skincare kamu ga ada hasil? Dokter spesialis kami rancang kuis evaluasi skin barrier gratis khusus kamu.',
      description: 'Konsultasi dan rekomendasi personal dari dokter spesialis kulit.',
      CTA: 'learn more',
      destinationUrl: targetComp.website,
      landingPageId: null,
      mediaUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
      creativeId: `cr_surge_1`,
      observationSource: 'META_ADS_LIBRARY',
      observedDays: 1,
    };

    const simulatedAd2: AdObservation = {
      id: `ad_surge_sim_2_${Date.now()}`,
      workspaceId: currentWorkspace.id,
      competitorId: targetComp.id,
      externalAdId: `meta_surge_live_2`,
      platform: 'meta',
      advertiserName: targetComp.name,
      pageName: targetComp.metaPageId,
      adStatus: 'active',
      firstSeen: now,
      lastSeen: now,
      detectedAt: now,
      format: 'video',
      headline: 'Kenapa 90% Orang Salah Pakai Niacinamide? Tonton Edukasi Singkat Ini',
      primaryText: 'Simak penjelasan formulasi stabil pH 5.5 agar tidak memicu iritasi di kulit sensitif. Diskon bundle 3 produk hari ini.',
      description: 'Penjelasan formulasi aktif stabil pH 5.5 untuk perlindungan skin barrier maksimal.',
      CTA: 'shop now',
      destinationUrl: targetComp.website,
      landingPageId: null,
      mediaUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
      creativeId: `cr_surge_2`,
      observationSource: 'META_ADS_LIBRARY',
      observedDays: 1,
    };

    const updatedAds = [simulatedAd1, simulatedAd2, ...ads];
    setAds(updatedAds);

    // Update competitor status to surging
    setCompetitors(competitors.map((c) => (c.id === targetComp.id ? { ...c, status: 'surging' } : c)));

    // Emit new signal with traceable evidence
    const competitorMap = new Map<string, string>(competitors.map((c) => [c.id, c.name]));
    const dynamicSignals = evaluateMarketSignals(currentWorkspace.id, updatedAds, competitorMap);

    const existingIds = new Set(signals.map((s) => s.id));
    const newSignals = dynamicSignals.filter((ds) => !existingIds.has(ds.id));

    if (newSignals.length > 0) {
      setSignals([...newSignals, ...signals]);
      setSelectedSignal(newSignals[0]);
    }

    showToast(`Simulation triggered: ${targetComp.name} launched 2 new creatives within 7 days. Signal Engine emitted CREATIVE_SURGE!`);
  };

  const handleUpdateSignalStatus = (signalId: string, status: 'active' | 'investigating' | 'acknowledged') => {
    setSignals(signals.map((s) => (s.id === signalId ? { ...s, status } : s)));
    showToast(`Signal status updated to: ${status.toUpperCase()}`);
  };

  const handleResetData = () => {
    setWorkspaces(INITIAL_WORKSPACES);
    setCurrentWorkspace(INITIAL_WORKSPACES[0]);
    setCompetitors(INITIAL_COMPETITORS);
    setAds(INITIAL_AD_OBSERVATIONS);
    setSignals(INITIAL_MARKET_SIGNALS);
    setLandingPages(INITIAL_LANDING_PAGES);
    setTrends(INITIAL_TREND_METRICS);
    showToast('Simulation state reset to factory seed data.');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <Navbar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={(ws) => {
          setCurrentWorkspace(ws);
          showToast(`Switched workspace to: ${ws.name}`);
        }}
        onOpenNewAdModal={() => setIsNewAdModalOpen(true)}
        onTriggerSurgeSimulation={handleTriggerSurgeSimulation}
      />

      {/* Main Body with Sidebar and Active View */}
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activeSignalsCount={currentWorkspaceSignals.filter((s) => s.status === 'active').length}
        />

        {/* View Stage */}
        <main className="flex-1 bg-[#F8FAFC] min-w-0 overflow-y-auto pb-16">
          {currentTab === 'dashboard' && (
            <DashboardView
              workspace={currentWorkspace}
              competitors={currentWorkspaceCompetitors}
              ads={currentWorkspaceAds}
              signals={currentWorkspaceSignals}
              creativeFamilies={currentWorkspaceFamilies}
              trends={trends}
              onSelectSignal={setSelectedSignal}
              onSelectAd={setSelectedAd}
              onSelectCompetitor={(comp) => {
                setCurrentTab('competitors');
              }}
              onNavigateToTab={setCurrentTab}
            />
          )}

          {currentTab === 'signals' && (
            <SignalsView
              signals={currentWorkspaceSignals}
              allAds={currentWorkspaceAds}
              onSelectSignal={setSelectedSignal}
              onUpdateSignalStatus={handleUpdateSignalStatus}
            />
          )}

          {currentTab === 'competitors' && (
            <CompetitorsView
              competitors={currentWorkspaceCompetitors}
              ads={currentWorkspaceAds}
              creativeFamilies={currentWorkspaceFamilies}
              signals={currentWorkspaceSignals}
              onSelectAd={setSelectedAd}
              onAddCompetitor={(newComp) => {
                setCompetitors([newComp, ...competitors]);
                showToast(`Competitor "${newComp.name}" added to radar.`);
              }}
            />
          )}

          {currentTab === 'ads' && (
            <AdsView
              ads={currentWorkspaceAds}
              competitors={currentWorkspaceCompetitors}
              onSelectAd={setSelectedAd}
            />
          )}

          {currentTab === 'creatives' && (
            <CreativesView
              families={currentWorkspaceFamilies}
              ads={currentWorkspaceAds}
              competitors={currentWorkspaceCompetitors}
              onSelectAd={setSelectedAd}
            />
          )}

          {currentTab === 'trends' && (
            <TrendsView trends={trends} />
          )}

          {currentTab === 'landing-pages' && (
            <LandingPagesView
              landingPages={landingPages}
              competitors={currentWorkspaceCompetitors}
              onAddLandingPage={(lp) => {
                setLandingPages([lp, ...landingPages]);
                showToast('Landing page audit saved.');
              }}
            />
          )}

          {currentTab === 'alco-bridge' && (
            <AlcoBridgeView workspaceName={currentWorkspace.name} />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              workspace={currentWorkspace}
              competitors={currentWorkspaceCompetitors}
              ads={currentWorkspaceAds}
              signals={currentWorkspaceSignals}
              creativeFamilies={currentWorkspaceFamilies}
            />
          )}

          {currentTab === 'workspaces' && (
            <WorkspacesView
              workspaces={workspaces}
              currentWorkspace={currentWorkspace}
              onSelectWorkspace={setCurrentWorkspace}
              onAddWorkspace={(ws) => {
                setWorkspaces([...workspaces, ws]);
                showToast(`Workspace "${ws.name}" created.`);
              }}
              onResetData={handleResetData}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <EvidenceModal
        signal={selectedSignal}
        allAds={ads}
        onClose={() => setSelectedSignal(null)}
        onSelectAd={(ad) => {
          setSelectedSignal(null);
          setSelectedAd(ad);
        }}
      />

      <AdDetailModal
        ad={selectedAd}
        creativeFamily={
          selectedAd
            ? currentWorkspaceFamilies.find((f) => f.memberAdIds.includes(selectedAd.id))
            : undefined
        }
        onClose={() => setSelectedAd(null)}
        onSelectFamily={(fam) => {
          setSelectedAd(null);
          setCurrentTab('creatives');
        }}
      />

      {isNewAdModalOpen && (
        <NewAdModal
          competitors={currentWorkspaceCompetitors}
          workspaceId={currentWorkspace.id}
          onClose={() => setIsNewAdModalOpen(false)}
          onAddAd={handleAddAd}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-blue-400 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

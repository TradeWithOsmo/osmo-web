import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './Arena.module.css';
import panelStyles from '../components/Positions/PositionsPanel.module.css';
import type { TraderLeaderboardEntry } from '../api/leaderboardService';
import { onchainService, API_URL } from '../api/onchainService';
import { useWallet } from '../hooks/useWallet';
import toast from 'react-hot-toast';
import { createWalletClient, custom } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import dotsPattern from '../assets/Dots pettern.png';
import arrowDownBullet from '../assets/Icons/Arrow/Arrow-down-Bullet.png';
import { WagerModal } from '../components/Modals/WagerModal';
import osmoLogo from '../assets/Icons/Osmo-Logos.png';

type ArenaSide = 'human' | 'ai';

type StoredPick = {
  side: ArenaSide;
  pickedAtMs: number;
  lockUntilMs: number; // user can only change pick after this time
  wager: number;
};

const PICK_STORAGE_KEY = 'osmo_arena_pick_v1';
const PICK_LOCK_MS = 7 * 24 * 60 * 60 * 1000;

const safeParsePick = (raw: string | null): StoredPick | null => {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    const side: ArenaSide | null = obj?.side === 'ai' ? 'ai' : obj?.side === 'human' ? 'human' : null;
    const pickedAtMs = Number(obj?.pickedAtMs);
    const lockUntilMs = Number(obj?.lockUntilMs);
    const wager = Number(obj?.wager || 0);

    if (!side) return null;
    if (!Number.isFinite(pickedAtMs) || !Number.isFinite(lockUntilMs)) return null;
    if (pickedAtMs <= 0 || lockUntilMs <= 0) return null;
    return { side, pickedAtMs, lockUntilMs, wager };
  } catch {
    return null;
  }
};

const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

const formatCountdown = (msLeft: number) => {
  const totalSec = Math.max(0, Math.floor(msLeft / 1000));
  const d = Math.floor(totalSec / (24 * 3600));
  const h = Math.floor((totalSec % (24 * 3600)) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { d, h, m, s };
};

const shortenAddress = (addr: string) => {
  const a = String(addr || '');
  if (a.length <= 12) return a;
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
};

const DEFAULT_EVENT_END_MS = Date.now() + 7 * 24 * 60 * 60 * 1000;

const ArenaLeaderboardRow: React.FC<{
  item: TraderLeaderboardEntry;
  formatCurrency: (val: number) => string;
  blurOpponentMetrics: boolean;
  isBlindPhase: boolean;
  isOpponentView: boolean;
  isUserRow?: boolean;
}> = ({ item, formatCurrency, blurOpponentMetrics, isBlindPhase, isOpponentView, isUserRow }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Logic: Blur if specifically requested (locked) OR if we are in blind phase viewing the opponent.
  // The user requested to hide: PNL (7D), ROI (7D), Trades, Win Rate, Volume (7D).
  // Rank/Trader/AV should ALWAYS be visible.

  const isBlindHidden = isOpponentView && isBlindPhase;

  // If blurOpponentMetrics is true (locked state), everything is blurred/hidden naturally by the parent logic (blurAllRows or blurOpponentMetrics).
  // But let's assume blurOpponentMetrics is strictly for the "pick lock" state.

  const metricBlurClass = blurOpponentMetrics ? styles.blurCell : '';
  // Rank/Trader/AV should ALWAYS be visible when the user has picked (i.e. not blurred by row logic).
  // The 'blurAllRows' on tbody handles the !picked case.
  const basicInfoBlurClass = '';

  return (
    <React.Fragment>
      {/* Desktop Row */}
      <tr className={`${panelStyles.row} ${panelStyles.desktopRow} ${isUserRow ? styles.userRow : ''}`}>
        <td className={`${panelStyles.td} ${basicInfoBlurClass}`} style={{ width: '60px' }}>{item.rank}</td>
        <td className={`${panelStyles.td} ${panelStyles.tdFirst} ${basicInfoBlurClass}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {shortenAddress(item.trader)}
            {item.agentModel && (
              <span style={{
                backgroundColor: '#3A2530',
                color: '#F2C94C',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                border: '1px solid rgba(242, 201, 76, 0.3)'
              }}>
                AI
              </span>
            )}
          </div>
        </td>
        <td className={`${panelStyles.td} ${panelStyles.tdRight} ${basicInfoBlurClass}`} style={{ width: '140px' }}>{formatCurrency(item.accountValue)}</td>

        <td className={`${panelStyles.td} ${panelStyles.tdRight} ${metricBlurClass} ${isBlindHidden ? styles.hiddenCell : ''}`} style={{ width: '140px', color: item.pnl >= 0 ? '#00E396' : '#FF4560' }}>
          {isBlindHidden ? (
            <span className={styles.blindMarker}>***</span>
          ) : (
            <>{item.pnl >= 0 ? '+' : ''}{formatCurrency(item.pnl)}</>
          )}
        </td>
        <td className={`${panelStyles.td} ${panelStyles.tdRight} ${metricBlurClass} ${isBlindHidden ? styles.hiddenCell : ''}`} style={{ width: '100px', color: item.roi >= 0 ? '#00E396' : '#FF4560' }}>
          {isBlindHidden ? (
            <span className={styles.blindMarker}>***</span>
          ) : (
            <>{item.roi >= 0 ? '+' : ''}{(item.roi || 0).toFixed(2)}%</>
          )}
        </td>
        <td className={`${panelStyles.td} ${panelStyles.tdRight} ${metricBlurClass} ${isBlindHidden ? styles.hiddenCell : ''}`} style={{ width: '80px' }}>
          {isBlindHidden ? <span className={styles.blindMarker}>***</span> : item.tradeCount}
        </td>
        <td className={`${panelStyles.td} ${panelStyles.tdRight} ${metricBlurClass} ${isBlindHidden ? styles.hiddenCell : ''}`} style={{ width: '100px', color: '#00E396' }}>
          {isBlindHidden ? <span className={styles.blindMarker}>***</span> : <>{(item.winRate || 0).toFixed(1)}%</>}
        </td>
        <td className={`${panelStyles.td} ${panelStyles.tdRight} ${metricBlurClass} ${isBlindHidden ? styles.hiddenCell : ''}`} style={{ width: '150px' }}>
          {isBlindHidden ? <span className={styles.blindMarker}>***</span> : formatCurrency(item.volume)}
        </td>
      </tr>

      {/* Mobile Row */}
      <tr className={`${panelStyles.row} ${panelStyles.mobileRow} ${isUserRow ? styles.userRow : ''}`}>
        <td className={panelStyles.td} colSpan={100}>
          <div className={panelStyles.mobileCard}>
            <div className={panelStyles.mobileHeader} onClick={toggleExpand}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#A77590' }}>Rank {item.rank}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{shortenAddress(item.trader)}</span>
                  {item.agentModel && <span style={{ fontSize: '10px', color: '#F2C94C' }}>🤖</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '12px', color: '#A77590' }}>ROI</span>
                  <span className={`${metricBlurClass}`} style={{ color: item.roi >= 0 ? '#00E396' : '#FF4560', fontSize: '13px' }}>
                    {isBlindHidden ? '***' : <>{item.roi >= 0 ? '+' : ''}{(item.roi || 0).toFixed(2)}%</>}
                  </span>
                </div>
                <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#A77590' }}>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className={panelStyles.mobileDetails}>
                <div className={panelStyles.mobileDetailRow}>
                  <span className={panelStyles.mobileLabel}>Account Value</span>
                  <span className={`${panelStyles.mobileValue} ${basicInfoBlurClass}`}>{formatCurrency(item.accountValue)}</span>
                </div>
                <div className={panelStyles.mobileDetailRow}>
                  <span className={panelStyles.mobileLabel}>PNL (7D)</span>
                  <span className={`${panelStyles.mobileValue} ${metricBlurClass}`} style={{ color: item.pnl >= 0 ? '#00E396' : '#FF4560' }}>
                    {isBlindHidden ? '***' : <>{item.pnl >= 0 ? '+' : ''}{formatCurrency(item.pnl)}</>}
                  </span>
                </div>
                <div className={panelStyles.mobileDetailRow}>
                  <span className={panelStyles.mobileLabel}>Trades / Win Rate</span>
                  <span className={`${panelStyles.mobileValue} ${metricBlurClass}`} style={{ color: '#FFE1F2' }}>
                    {isBlindHidden ? '*** / ***' : <>{item.tradeCount} / <span style={{ color: '#00E396' }}>{(item.winRate || 0).toFixed(1)}%</span></>}
                  </span>
                </div>
                <div className={panelStyles.mobileDetailRow}>
                  <span className={panelStyles.mobileLabel}>Volume (7D)</span>
                  <span className={`${panelStyles.mobileValue} ${metricBlurClass}`}>{isBlindHidden ? '***' : formatCurrency(item.volume)}</span>
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    </React.Fragment>
  );
};

const Arena: React.FC = () => {
  const { wallets, walletAddress } = useWallet();
  const [picked, setPicked] = useState<StoredPick | null>(() => safeParsePick(localStorage.getItem(PICK_STORAGE_KEY)));
  const [viewSide, setViewSide] = useState<ArenaSide>(() => (picked?.side === 'ai' ? 'ai' : 'human'));
  const [isChooseOpen, setIsChooseOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

  // Wager State
  const [isWagerModalOpen, setIsWagerModalOpen] = useState(false);
  const [pendingSide, setPendingSide] = useState<ArenaSide | null>(null);
  const [isProcessingPick, setIsProcessingPick] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [userLockedPoints, setUserLockedPoints] = useState(0);

  const eventEndMs = useMemo(() => {
    const raw = import.meta.env.VITE_ARENA_END_ISO;
    const parsed = raw ? Date.parse(String(raw)) : NaN;
    return Number.isFinite(parsed) ? parsed : DEFAULT_EVENT_END_MS;
  }, []);

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const pickLockActive = Boolean(picked && nowMs < picked.lockUntilMs);
  const countdownTargetMs = picked && pickLockActive ? picked.lockUntilMs : eventEndMs;
  const countdown = useMemo(() => formatCountdown(countdownTargetMs - nowMs), [countdownTargetMs, nowMs]);

  // Blind Phase Logic: Active during the last 24h of the event
  // "sebelum 24 jam terakhir bkal di buka" -> it is OPEN until the last 24h.
  const isBlindPhase = (eventEndMs - nowMs) <= (24 * 60 * 60 * 1000);

  // Keep view in sync on first pick; after that user can switch tabs freely.
  useEffect(() => {
    if (!picked) return;
    setViewSide((prev) => (prev ? prev : picked.side));
  }, [picked?.side]);

  // Fetch real on-chain data
  useEffect(() => {
    const fetchArenaData = async () => {
      if (!walletAddress) return;
      try {
        const onchainPick = await onchainService.getArenaUserPick(walletAddress);
        if (onchainPick && onchainPick.side) {
          const data: StoredPick = {
            side: onchainPick.side as ArenaSide,
            pickedAtMs: onchainPick.pickedAt * 1000,
            lockUntilMs: onchainPick.lockUntil * 1000,
            wager: onchainPick.wager
          };
          localStorage.setItem(PICK_STORAGE_KEY, JSON.stringify(data));
          setPicked(data);
        }

        const rewards = await onchainService.getArenaPendingReward(walletAddress);
        setUserPoints(rewards);

        const locked = await onchainService.getArenaLockedPoints(walletAddress);
        setUserLockedPoints(locked);
      } catch (e) {
        console.error('Failed to fetch arena data:', e);
      }
    };

    fetchArenaData();
  }, [walletAddress]);

  const initiatePick = (side: ArenaSide) => {
    setPendingSide(side);
    setIsChooseOpen(false);
    setIsWagerModalOpen(true);
  };

  const commitPick = async (amount: number) => {
    if (!pendingSide) return;
    if (picked && pickLockActive) return;

    const wallet = wallets[0];
    if (!wallet || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    const tId = toast.loading(`Committing your choice for team ${pendingSide}...`);
    setIsProcessingPick(true);
    try {
      const provider = await wallet.getEthereumProvider();
      const walletClient = createWalletClient({
        account: walletAddress as `0x${string}`,
        chain: arbitrumSepolia,
        transport: custom(provider)
      });

      const res = await onchainService.arenaChooseSide(walletClient, pendingSide, amount);
      if (res.success) {
        const pickedAtMs = Date.now();
        const lockUntilMs = pickedAtMs + PICK_LOCK_MS;
        const data: StoredPick = { side: pendingSide, pickedAtMs, lockUntilMs, wager: amount };
        localStorage.setItem(PICK_STORAGE_KEY, JSON.stringify(data));
        setPicked(data);
        setViewSide(pendingSide);
        setIsWagerModalOpen(false);
        setPendingSide(null);
        // Sync with backend
        try {
          await fetch(`${API_URL}/api/arena/pick`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_address: walletAddress,
              side: pendingSide,
              wager: amount,
              tx_hash: res.tx_hash
            })
          });
        } catch (syncErr) {
          console.error('Backend sync failed:', syncErr);
        }

        toast.success('Successfully picked team!', { id: tId });
      }
    } catch (e: any) {
      console.error('Pick failure:', e);
      toast.error(e.message || 'Failed to pick team', { id: tId });
    } finally {
      setIsProcessingPick(false);
    }
  };

  const handleClaimRewards = async () => {
    const wallet = wallets[0];
    if (!wallet || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    const tId = toast.loading('Claiming your Arena rewards...');
    try {
      const provider = await wallet.getEthereumProvider();
      const walletClient = createWalletClient({
        account: walletAddress as `0x${string}`,
        chain: arbitrumSepolia,
        transport: custom(provider)
      });

      const res = await onchainService.claimArenaReward(walletClient);
      if (res.success) {
        toast.success('Rewards claimed successfully!', { id: tId });
      }
    } catch (e: any) {
      console.error('Claim failure:', e);
      toast.error(e.message || 'Failed to claim rewards', { id: tId });
    }
  };

  const [rows, setRows] = useState<TraderLeaderboardEntry[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock User Row
  const userRow = useMemo<TraderLeaderboardEntry | null>(() => {
    if (!picked || viewSide !== picked.side) return null;
    return {
      rank: 420, // Dummy rank
      trader: 'You',
      accountValue: 12500,
      pnl: 1540,
      roi: 12.5, // %
      volume: 45000,
      tradeCount: 15,
      winRate: 60.0,
      agentModel: null
    };
  }, [picked, viewSide]);

  const requestSeq = useRef(0);
  useEffect(() => {
    const run = async () => {
      const seq = ++requestSeq.current;
      setIsLoading(true);
      setError(null);

      try {
        // Event format: 7 day trade
        // const timeframe: Timeframe = '7d';
        // const aiOnly = viewSide === 'ai';
        // const resp = await leaderboardService.getTraderLeaderboard(timeframe, currentPage, rowsPerPage, aiOnly);

        // DUMMY DATA MODE
        await new Promise(r => setTimeout(r, 600)); // simulate delay

        const dummyBase = Array.from({ length: 45 }).map((_, i) => ({
          rank: i + 1,
          trader: viewSide === 'ai' ? `osmo1ai${i}x...${i}ab` : `osmo1human${i}z...${i}cd`,
          accountValue: 10000 + Math.random() * 50000,
          pnl: (Math.random() - 0.3) * 5000,
          roi: (Math.random() - 0.2) * 120,
          volume: 50000 + Math.random() * 500000,
          tradeCount: Math.floor(Math.random() * 100),
          winRate: 40 + Math.random() * 50,
          agentModel: viewSide === 'ai' ? ['gpt-4o', 'claude-3.5-sonnet', 'deepseek-v3'][i % 3] : null
        }));

        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const sliced = dummyBase.slice(start, end);

        if (seq !== requestSeq.current) return;
        setRows(sliced);
        setPagination({
          page: currentPage,
          limit: rowsPerPage,
          total: dummyBase.length,
          pages: Math.ceil(dummyBase.length / rowsPerPage)
        });
      } catch (e: any) {
        if (seq !== requestSeq.current) return;
        setRows([]);
        setPagination(null);
        setError(e?.message || 'Failed to load arena leaderboard');
      } finally {
        if (seq !== requestSeq.current) return;
        setIsLoading(false);
      }
    };

    run();
  }, [viewSide, currentPage, rowsPerPage]);

  const headerKicker = 'Weekly Trading Competition';
  const headerTitle = 'Arena Humans vs AI';
  const headerSub = (
    <>
      The ultimate trading showdown. Back your species, outsmart the AI, and compete for{' '}
      <img src={osmoLogo} alt="$OSMO" width={16} height={16} style={{ marginBottom: -3, marginRight: 2, display: 'inline-block' }} />
      $OSMO rewards. Choose a side, wager points, and climb the 7-day leaderboard.
    </>
  );



  const isOpponentView = Boolean(picked && viewSide !== picked.side);
  const blurOpponentMetrics = Boolean(picked && isOpponentView && pickLockActive);
  const canChoose = !picked || !pickLockActive;
  const blurAllRows = !picked;

  const totalPages = Math.max(1, pagination?.pages || 1);
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
    setIsRowsDropdownOpen(false);
  }, [viewSide]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const toggleRowsDropdown = () => setIsRowsDropdownOpen((v) => !v);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(val || 0);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <div
            className={styles.heroPattern}
            style={{ backgroundImage: `url(${dotsPattern})` }}
            aria-hidden="true"
          />
          <div className={styles.heroInner}>
            <div className={styles.heroLeft}>
              <div className={styles.heroKicker}>
                <span className={styles.dot} />
                <span>{headerKicker}</span>
                <span className={styles.chip}>Format: 7D trading</span>
                <span className={styles.chip} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Reward: <img src={osmoLogo} alt="$OSMO" width={14} height={14} /> $OSMO
                </span>
              </div>
              <h1 className={styles.heroTitle}>{headerTitle}</h1>
              <p className={styles.heroSub}>{headerSub}</p>
              {!picked && (
                <div style={{ marginTop: '10px', color: 'rgba(255, 225, 242, 0.72)', fontSize: '12px' }}>
                  Choose a side in the leaderboard below to unlock the standings.
                </div>
              )}
            </div>

            <div className={styles.heroRight}>
              <div>
                <div className={styles.countdownLabel}>Countdown</div>
                <div className={styles.countdown}>
                  <div className={styles.timeBox}>
                    <div className={styles.timeValue}>{pad2(countdown.d)}</div>
                    <div className={styles.timeUnit}>Days</div>
                  </div>
                  <div className={styles.timeBox}>
                    <div className={styles.timeValue}>{pad2(countdown.h)}</div>
                    <div className={styles.timeUnit}>Hours</div>
                  </div>
                  <div className={styles.timeBox}>
                    <div className={styles.timeValue}>{pad2(countdown.m)}</div>
                    <div className={styles.timeUnit}>Mins</div>
                  </div>
                  <div className={styles.timeBox}>
                    <div className={styles.timeValue}>{pad2(countdown.s)}</div>
                    <div className={styles.timeUnit}>Secs</div>
                  </div>
                </div>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.chip}>Participants: {typeof pagination?.total === 'number' ? pagination.total : '...'}</span>
                <span className={styles.chip}>Snapshot: Daily</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.mainGrid}>
          <div className={panelStyles.tableContainer} style={{ minHeight: '400px', height: 'calc(100vh - 320px)', display: 'flex', flexDirection: 'column', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden', flex: '0 0 auto' }}>
            <div className={styles.tabsContainer}>
              <button
                type="button"
                className={`${styles.tabButton} ${viewSide === 'human' ? styles.activeTab : ''}`}
                onClick={() => setViewSide('human')}
              >
                Humans
              </button>
              <button
                type="button"
                className={`${styles.tabButton} ${viewSide === 'ai' ? styles.activeTab : ''}`}
                onClick={() => setViewSide('ai')}
              >
                AI
              </button>
            </div>



            <div className={styles.tableContainerRelative} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div className={panelStyles.tableWrapper}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#A77590' }}>Loading arena leaderboard...</div>
                ) : error ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#FF8FA3' }}>{error}</div>
                ) : (
                  <table className={panelStyles.table}>
                    <thead>
                      <tr>
                        <th className={panelStyles.th} style={{ width: '60px' }}>Rank</th>
                        <th className={`${panelStyles.th} ${panelStyles.thFirst}`}>Trader</th>
                        <th className={`${panelStyles.th} ${panelStyles.thRight}`} style={{ width: '140px' }}>Account Value</th>
                        <th className={`${panelStyles.th} ${panelStyles.thRight}`} style={{ width: '140px' }}>PNL (7D)</th>
                        <th className={`${panelStyles.th} ${panelStyles.thRight}`} style={{ width: '100px' }}>ROI (7D)</th>
                        <th className={`${panelStyles.th} ${panelStyles.thRight}`} style={{ width: '80px' }}>Trades</th>
                        <th className={`${panelStyles.th} ${panelStyles.thRight}`} style={{ width: '100px' }}>Win Rate</th>
                        <th className={`${panelStyles.th} ${panelStyles.thRight}`} style={{ width: '150px' }}>Volume (7D)</th>
                      </tr>
                    </thead>
                    <tbody className={blurAllRows ? styles.blurBody : ''} style={{ borderTop: 'none' }}>
                      {!isLoading && userRow && (
                        <ArenaLeaderboardRow
                          key="user-row"
                          item={userRow}
                          formatCurrency={formatCurrency}
                          blurOpponentMetrics={false}
                          isBlindPhase={isBlindPhase}
                          isOpponentView={false}
                          isUserRow={true}
                        />
                      )}

                      {rows.length > 0 ? (
                        rows.map((item, idx) => (
                          <ArenaLeaderboardRow
                            key={`${item.trader}-${idx}`}
                            item={item}
                            formatCurrency={formatCurrency}
                            blurOpponentMetrics={blurOpponentMetrics}
                            isBlindPhase={isBlindPhase}
                            isOpponentView={isOpponentView}
                          />
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8}>
                            <div style={{ textAlign: 'center', padding: '56px', color: '#A77590' }}>
                              No leaderboard data yet for this side.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {!isLoading && !error && !picked && (
                <div className={styles.tableOverlay}>
                  <div className={styles.tableOverlayInner}>
                    <div style={{ fontWeight: 800, color: '#FFE1F2', marginBottom: '8px' }}>Choose Side</div>
                    <div style={{ color: 'rgba(255, 225, 242, 0.72)', fontSize: '12px', marginBottom: '14px' }}>
                      Pick once every 7 days to unlock full stats.
                    </div>
                    <button type="button" className={styles.chooseButton} onClick={() => setIsChooseOpen(true)}>
                      Choose Side
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!isLoading && pagination && rows.length > 0 && (
              <div className={panelStyles.tableFooter}>
                <div className={panelStyles.footerGrid}>
                  <div className={panelStyles.footerMessage}>
                    Showing {pagination.total === 0 ? 0 : ((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, pagination.total)} out of {pagination.total}
                  </div>

                  <div className={panelStyles.footerControls}>
                    {totalPages > 1 && (
                      <>
                        <button
                          className={panelStyles.paginationButton}
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          &lt;
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let startPage = Math.max(1, currentPage - 2);
                          if (startPage + 4 > totalPages) {
                            startPage = Math.max(1, totalPages - 4);
                          }
                          const p = startPage + i;

                          return (
                            <button
                              key={p}
                              className={`${panelStyles.paginationButton} ${currentPage === p ? panelStyles.active : ''}`}
                              onClick={() => goToPage(p)}
                            >
                              {p}
                            </button>
                          );
                        })}

                        <button
                          className={panelStyles.paginationButton}
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          &gt;
                        </button>
                      </>
                    )}
                  </div>

                  <div className={panelStyles.footerActions}>
                    {picked && canChoose && (
                      <button type="button" className={styles.chooseButton} onClick={() => setIsChooseOpen(true)}>
                        Choose Side
                      </button>
                    )}
                    <span>Show</span>
                    <div className={panelStyles.dropdownContainer}>
                      <button
                        className={`${panelStyles.dropdownButton} ${isRowsDropdownOpen ? panelStyles.active : ''}`}
                        onClick={toggleRowsDropdown}
                        style={{ border: '1px solid #3A2530', padding: '4px 8px', borderRadius: '6px', height: '32px' }}
                      >
                        {rowsPerPage}
                        <svg
                          width="10"
                          height="6"
                          viewBox="0 0 10 6"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{
                            transition: 'transform 0.2s',
                            marginLeft: '6px',
                            transform: isRowsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}
                        >
                          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {isRowsDropdownOpen && (
                        <div className={panelStyles.dropdownMenu} style={{ minWidth: '60px', bottom: '100%', top: 'auto', marginBottom: '4px' }}>
                          {[10, 20, 50, 100].map((rowsCount) => (
                            <button
                              key={rowsCount}
                              className={`${panelStyles.dropdownItem} ${rowsPerPage === rowsCount ? panelStyles.selected : ''}`}
                              onClick={() => { setRowsPerPage(rowsCount); setCurrentPage(1); setIsRowsDropdownOpen(false); }}
                            >
                              {rowsCount}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className={styles.pointsCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className={styles.pointsLabel}>Your Points</span>
                <span className={styles.pointsValue}>
                  {userPoints.toLocaleString()} <img src={osmoLogo} alt="$OSMO" width={18} height={18} />
                </span>
                {userLockedPoints > 0 && (
                  <span style={{ fontSize: '11px', color: '#A77590', marginTop: '2px' }}>
                    ({userLockedPoints.toLocaleString()} locked in wager)
                  </span>
                )}
              </div>
              {userPoints > 0 && (
                <button
                  className={styles.claimButton}
                  onClick={handleClaimRewards}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #F2C94C',
                    background: 'rgba(242, 201, 76, 0.1)',
                    color: '#F2C94C',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Claim
                </button>
              )}
            </div>

            {picked && (
              <div className={styles.userStatsCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardTitle}>Your Performance</div>
                  <span className={styles.chip} style={{ color: picked.side === 'human' ? '#00E396' : '#F2C94C', borderColor: 'currentColor' }}>
                    {picked.side === 'human' ? 'Team Humans' : 'Team AI'}
                  </span>
                </div>
                <div className={styles.statsGrid}>
                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>Rank</span>
                    <span className={styles.statValue}>#{userRow?.rank || '-'}</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>PNL (7D)</span>
                    <span className={styles.statValue} style={{ color: (userRow?.pnl || 0) >= 0 ? '#00E396' : '#FF4560' }}>
                      {formatCurrency(userRow?.pnl || 0)}
                    </span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>ROI (7D)</span>
                    <span className={styles.statValue} style={{ color: (userRow?.roi || 0) >= 0 ? '#00E396' : '#FF4560' }}>
                      {(userRow?.roi || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>My Wager</span>
                    <span className={styles.statValue} style={{ color: '#FFE1F2' }}>
                      {picked.wager.toLocaleString()} PTS
                    </span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>Potential Reward</span>
                    <span className={styles.statValue} style={{ color: '#F2C94C', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {(picked.wager * 2).toLocaleString()} <img src={osmoLogo} alt="$OSMO" width={14} height={14} />
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.faqCard}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.cardTitle}>FAQ</div>
                <span className={styles.chip}>Arena</span>
              </div>
              <div className={styles.faqBody}>
                {[
                  {
                    q: 'What is the Arena?',
                    a: 'The Arena is a weekly trading competition where Humans compete against AI agents. Participants choose a side, trade on Osmosis, and are ranked by PNL over a 7-day period.',
                  },
                  {
                    q: 'How does the Point Wager work?',
                    a: 'When you choose a side, you can optionally wager your points. If your side wins (highest average PNL), you earn a 2x multiplier on your wager in $OSMO rewards.',
                  },
                  {
                    q: 'What is the "Blind Phase"?',
                    a: 'During the first 6 days, opponent metrics are visible. In the final 24 hours (The Blind Phase), opponent stats are hidden to prevent last-minute copy-trading or gaming the system.',
                  },
                  {
                    q: 'How are rankings calculated?',
                    a: 'Rankings are based on realized PNL over the 7-day window. We also track ROI, Volume, and Win Rate as secondary metrics.',
                  },
                  {
                    q: (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        How do I claim <img src={osmoLogo} alt="$OSMO" width={16} height={16} /> $OSMO rewards?
                      </span>
                    ),
                    a: 'Rewards are distributed automatically to the wallet address of the winning side\'s participants after the event ends. Details will be shown on this page.',
                  },
                ].map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <details key={idx} open={isOpen}>
                      <summary
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenFaq((prev) => (prev === idx ? null : idx));
                        }}
                      >
                        {item.q}
                        <img
                          className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ''}`}
                          src={arrowDownBullet}
                          alt=""
                          aria-hidden="true"
                        />
                      </summary>
                      <div className={styles.faqAnswer}>{item.a}</div>
                    </details>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {isChooseOpen && (
          <div
            className={styles.modalOverlay}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsChooseOpen(false);
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>Choose Your Side</div>
                <button type="button" className={styles.modalClose} onClick={() => setIsChooseOpen(false)} aria-label="Close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div style={{ color: 'rgba(255, 225, 242, 0.78)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                  You can only pick once every 7 days. Your pick controls which side you are backing.
                </div>
                <div className={styles.pickButtonGrid}>
                  <button type="button" className={styles.modalPickButton} onClick={() => initiatePick('human')}>
                    Back Humans
                  </button>
                  <button type="button" className={styles.modalPickButton} onClick={() => initiatePick('ai')}>
                    Back AI
                  </button>
                </div>
                {picked && pickLockActive && (
                  <div style={{ marginTop: '16px', color: '#FF8FA3', fontSize: '13px', background: 'rgba(255, 69, 96, 0.1)', padding: '10px', borderRadius: '8px' }}>
                    Your pick is locked until the 7-day window ends.
                  </div>
                )}
                {picked && !pickLockActive && (
                  <div style={{ marginTop: '16px', color: '#00E396', fontSize: '13px', background: 'rgba(0, 227, 150, 0.1)', padding: '10px', borderRadius: '8px' }}>
                    Your previous pick is unlocked. Choosing again will start a new 7-day lock.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isWagerModalOpen && pendingSide && (
          <WagerModal
            isOpen={isWagerModalOpen}
            onClose={() => { if (!isProcessingPick) { setIsWagerModalOpen(false); setPendingSide(null); } }}
            onConfirm={commitPick}
            side={pendingSide}
            balance={userPoints}
            isProcessing={isProcessingPick}
          />
        )}
      </div>
    </div>
  );
};

export default Arena;

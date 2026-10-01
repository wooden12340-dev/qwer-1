import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import {
  DailyBoxOfficeItem,
  DailyBoxOfficeResponse,
  MultiMovieFilter,
  MovieInfo,
  MovieInfoResponse,
  NationFilter,
  SortField,
} from './types/kobis';
import {
  formatCompactAudience,
  formatCompactWon,
  formatKoreanDateLabel,
  formatNumber,
  getYesterdayDateInputString,
  inputDateToTargetDt,
  shiftDateInputString,
} from './utils/format';
import { MovieDetailPanel } from './components/MovieDetailPanel';
import { ShareBreakdown } from './components/ShareBreakdown';

export function App() {
  // Maximum selectable date is strictly yesterday (dates prior to today)
  const maxYesterdayDate = useMemo(() => getYesterdayDateInputString(), []);

  // Query state
  const [selectedDate, setSelectedDate] = useState<string>(maxYesterdayDate);
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [multiMovieYn, setMultiMovieYn] = useState<MultiMovieFilter>('');
  const [repNationCd, setRepNationCd] = useState<NationFilter>('');

  // Box office data state
  const [boxOfficeList, setBoxOfficeList] = useState<DailyBoxOfficeItem[]>([]);
  const [boxOfficeType, setBoxOfficeType] = useState<string>('일별 박스오피스');
  const [showRange, setShowRange] = useState<string>('');
  const [loadingBoxOffice, setLoadingBoxOffice] = useState<boolean>(true);
  const [boxOfficeError, setBoxOfficeError] = useState<string | null>(null);

  // Table search & sort state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('rank');

  // Selected movie detail state
  const [selectedMovieCd, setSelectedMovieCd] = useState<string>('');
  const [movieInfo, setMovieInfo] = useState<MovieInfo | null>(null);
  const [loadingMovieInfo, setLoadingMovieInfo] = useState<boolean>(false);
  const [movieInfoError, setMovieInfoError] = useState<string | null>(null);

  // Fetch Movie Detail Info by movieCd
  const fetchMovieInfo = useCallback(async (movieCd: string) => {
    if (!movieCd) return;
    setSelectedMovieCd(movieCd);
    setLoadingMovieInfo(true);
    setMovieInfoError(null);

    try {
      const res = await fetch(`/api/movie/info?movieCd=${encodeURIComponent(movieCd)}`);
      const data: MovieInfoResponse = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || '영화 상세정보를 불러오지 못했습니다.');
      }

      const info = data.movieInfoResult?.movieInfo;
      if (!info || !info.movieCd) {
        throw new Error('해당 영화코드의 상세정보가 존재하지 않습니다.');
      }

      setMovieInfo(info);
    } catch (err) {
      setMovieInfoError(
        err instanceof Error ? err.message : '영화 상세정보 조회 중 오류가 발생했습니다.'
      );
    } finally {
      setLoadingMovieInfo(false);
    }
  }, []);

  // Fetch Daily Box Office when date or KOBIS filters change
  const fetchDailyBoxOffice = useCallback(async () => {
    const targetDt = inputDateToTargetDt(selectedDate);
    if (targetDt.length !== 8) return;

    setLoadingBoxOffice(true);
    setBoxOfficeError(null);

    try {
      const params = new URLSearchParams({ targetDt });
      if (multiMovieYn) params.set('multiMovieYn', multiMovieYn);
      if (repNationCd) params.set('repNationCd', repNationCd);

      const res = await fetch(`/api/boxoffice/daily?${params.toString()}`);
      const data: DailyBoxOfficeResponse = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || '일일 박스오피스 데이터를 불러오지 못했습니다.');
      }

      const result = data.boxOfficeResult;
      const list = result?.dailyBoxOfficeList || [];

      setBoxOfficeType(result?.boxofficeType || '일별 박스오피스');
      setShowRange(result?.showRange || `${targetDt}~${targetDt}`);
      setBoxOfficeList(list);

      // Automatically load Rank #1 movie details
      if (list.length > 0) {
        fetchMovieInfo(list[0].movieCd);
      } else {
        setMovieInfo(null);
        setSelectedMovieCd('');
      }
    } catch (err) {
      setBoxOfficeError(
        err instanceof Error ? err.message : '박스오피스 조회 중 오류가 발생했습니다.'
      );
      setBoxOfficeList([]);
    } finally {
      setLoadingBoxOffice(false);
    }
  }, [selectedDate, multiMovieYn, repNationCd, fetchMovieInfo]);

  useEffect(() => {
    fetchDailyBoxOffice();
  }, [fetchDailyBoxOffice]);

  // Handle date selection with strict constraint: only dates before today (<= maxYesterdayDate)
  const handleDateChange = (newDateStr: string) => {
    if (!newDateStr) return;
    if (newDateStr > maxYesterdayDate) {
      setDateWarning(
        `일일 박스오피스 통계는 오늘 이전 날짜(${maxYesterdayDate}, 어제)까지만 조회할 수 있습니다.`
      );
      setSelectedDate(maxYesterdayDate);
      return;
    }
    if (newDateStr < '2004-01-01') {
      setDateWarning('KOBIS 공식 일별 통계는 2004년 1월 1일 이후부터 조회 가능합니다.');
      setSelectedDate('2004-01-01');
      return;
    }
    setDateWarning(null);
    setSelectedDate(newDateStr);
  };

  const handleStepDate = (deltaDays: number) => {
    const nextDate = shiftDateInputString(selectedDate, deltaDays, maxYesterdayDate);
    handleDateChange(nextDate);
  };

  // Filtered and sorted table rows
  const filteredAndSortedList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = boxOfficeList.filter((item) => {
      if (!q) return true;
      return (
        item.movieNm.toLowerCase().includes(q) ||
        item.movieCd.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortField === 'rank') {
        return Number(a.rank) - Number(b.rank);
      }
      return Number(b[sortField] || 0) - Number(a[sortField] || 0);
    });
  }, [boxOfficeList, searchQuery, sortField]);

  // Summary metrics calculated from the daily Top 10 list
  const summaryStats = useMemo(() => {
    const totalAudi = boxOfficeList.reduce((acc, cur) => acc + Number(cur.audiCnt || 0), 0);
    const totalSales = boxOfficeList.reduce((acc, cur) => acc + Number(cur.salesAmt || 0), 0);
    const totalScrn = boxOfficeList.reduce((acc, cur) => acc + Number(cur.scrnCnt || 0), 0);
    const totalShow = boxOfficeList.reduce((acc, cur) => acc + Number(cur.showCnt || 0), 0);
    const newEntriesCount = boxOfficeList.filter((i) => i.rankOldAndNew === 'NEW').length;
    const topMovie = boxOfficeList[0] || null;

    return {
      totalAudi,
      totalSales,
      totalScrn,
      totalShow,
      newEntriesCount,
      topMovie,
    };
  }, [boxOfficeList]);

  const selectedBoxOfficeItem = useMemo(
    () => boxOfficeList.find((item) => item.movieCd === selectedMovieCd) || null,
    [boxOfficeList, selectedMovieCd]
  );

  // Export current daily box office table as CSV
  const handleExportCsv = () => {
    if (boxOfficeList.length === 0) return;

    const headers = [
      '순위',
      '전일대비순위증감',
      '신규진입여부',
      '영화대표코드',
      '영화명',
      '개봉일',
      '일일관객수(명)',
      '전일대비관객증감률(%)',
      '누적관객수(명)',
      '일일매출액(원)',
      '매출점유율(%)',
      '누적매출액(원)',
      '스크린수(관)',
      '상영횟수(회)',
    ];

    const rows = boxOfficeList.map((item) => [
      item.rank,
      item.rankInten,
      item.rankOldAndNew,
      item.movieCd,
      `"${item.movieNm.replace(/"/g, '""')}"`,
      item.openDt,
      item.audiCnt,
      item.audiChange,
      item.audiAcc,
      item.salesAmt,
      item.salesShare,
      item.salesAcc,
      item.scrnCnt,
      item.showCnt,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kobis_daily_boxoffice_${inputDateToTargetDt(selectedDate)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderRankDelta = (item: DailyBoxOfficeItem) => {
    if (item.rankOldAndNew === 'NEW') {
      return (
        <span className="text-xs font-semibold text-amber-700 font-mono">
          NEW 진입
        </span>
      );
    }
    const inten = Number(item.rankInten || 0);
    if (inten > 0) {
      return (
        <span className="text-xs font-medium text-emerald-700 font-mono tabular-nums">
          ▲ {inten}
        </span>
      );
    }
    if (inten < 0) {
      return (
        <span className="text-xs font-medium text-red-600 font-mono tabular-nums">
          ▼ {Math.abs(inten)}
        </span>
      );
    }
    return <span className="text-xs text-slate-400 font-mono">-</span>;
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Brand title, one line */}
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Daily Movie Box Office
          </a>

          {/* Zone 2: 4 nav links, clean typography */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#boxoffice-table-section"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              일일 순위표
            </a>
            <a
              href="#movie-detail-section"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              영화 상세정보
            </a>
            <a
              href="#share-analysis-section"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              점유율 분석
            </a>
            <a
              href="#api-spec-section"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              API 연동 규격
            </a>
          </nav>

          {/* Zone 3: Primary actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleDateChange(maxYesterdayDate)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              어제 기준 조회
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={boxOfficeList.length === 0}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV 내보내기</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-8 space-y-8">
        {/* Date / Parameter Control Bar */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>영화진흥위원회(KOBIS) 공식 오픈API 연동</span>
                <span aria-hidden="true">·</span>
                <span>서버 환경변수(KOBIS_API_KEY) 참조</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">조회범위 {showRange || inputDateToTargetDt(selectedDate)}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1.5 text-balance">
                {formatKoreanDateLabel(selectedDate)} {boxOfficeType}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                오늘 이전 날짜(어제: <span className="font-mono font-medium text-slate-800">{maxYesterdayDate}</span>까지)를 선택하면 해당 일자의 박스오피스 TOP 10과 작품별 상세 정보를 실시간 조회합니다.
              </p>
            </div>

            {/* Interactive Date Selector & Quick Presets */}
            <div className="flex flex-col sm:items-end gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStepDate(-1)}
                  title="이전 날짜 (-1일)"
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>이전 일</span>
                </button>

                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                  <input
                    type="date"
                    aria-label="조회 기준 날짜 선택 (오늘 이전 날짜)"
                    value={selectedDate}
                    min="2004-01-01"
                    max={maxYesterdayDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="pl-9 pr-3.5 py-2 text-sm font-mono tabular-nums font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 transition-colors cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleStepDate(1)}
                  disabled={selectedDate >= maxYesterdayDate}
                  title="다음 날짜 (+1일, 오늘 이전 날짜까지만 가능)"
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
                >
                  <span>다음 일</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={fetchDailyBoxOffice}
                  className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBoxOffice ? 'animate-spin' : ''}`} />
                  <span>새로고침</span>
                </button>
              </div>

              {/* Quick Date Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500 mr-1">빠른 이동:</span>
                {[
                  { label: '어제 (최신)', delta: 0 },
                  { label: '3일 전', delta: -3 },
                  { label: '7일 전 (1주)', delta: -7 },
                  { label: '14일 전 (2주)', delta: -14 },
                  { label: '30일 전 (1개월)', delta: -30 },
                ].map((preset) => {
                  const targetDate = shiftDateInputString(
                    maxYesterdayDate,
                    preset.delta,
                    maxYesterdayDate
                  );
                  const isActive = selectedDate === targetDate;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleDateChange(targetDate)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {dateWarning && (
            <div className="mt-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              {dateWarning}
            </div>
          )}

          {/* Official KOBIS Query Filter Bar */}
          <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* multiMovieYn segmented control */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                  영화 유형
                </span>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(
                    [
                      { value: '', label: '전체 상영작' },
                      { value: 'N', label: '상업영화' },
                      { value: 'Y', label: '다양성영화' },
                    ] as { value: MultiMovieFilter; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setMultiMovieYn(opt.value)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        multiMovieYn === opt.value
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* repNationCd segmented control */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                  제작 국가
                </span>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(
                    [
                      { value: '', label: '전체 국가' },
                      { value: 'K', label: '한국영화' },
                      { value: 'F', label: '외국영화' },
                    ] as { value: NationFilter; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setRepNationCd(opt.value)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        repNationCd === opt.value
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-mono tabular-nums">
              요청 파라미터: targetDt={inputDateToTargetDt(selectedDate)}
              {multiMovieYn ? ` · multiMovieYn=${multiMovieYn}` : ''}
              {repNationCd ? ` · repNationCd=${repNationCd}` : ''}
            </div>
          </div>

          {/* Flat 4-Column Summary KPI Strip */}
          <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:divide-x lg:divide-slate-200">
            <div className="lg:pr-6">
              <p className="text-xs font-medium text-slate-500">박스오피스 1위 작품</p>
              <p className="text-lg font-bold text-slate-900 mt-1 truncate">
                {summaryStats.topMovie ? summaryStats.topMovie.movieNm : '-'}
              </p>
              <p className="text-xs text-slate-500 font-mono tabular-nums mt-1">
                {summaryStats.topMovie
                  ? `일일 ${formatNumber(summaryStats.topMovie.audiCnt)}명 · 점유율 ${summaryStats.topMovie.salesShare}%`
                  : '집계 데이터 없음'}
              </p>
            </div>

            <div className="lg:px-6">
              <p className="text-xs font-medium text-slate-500">TOP 10 일일 관객 합계</p>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatNumber(summaryStats.totalAudi)}명
              </p>
              <p className="text-xs text-slate-500 font-mono tabular-nums mt-1">
                약 {formatCompactAudience(summaryStats.totalAudi)} 관람
              </p>
            </div>

            <div className="lg:px-6">
              <p className="text-xs font-medium text-slate-500">TOP 10 일일 매출 합계</p>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatCompactWon(summaryStats.totalSales)}
              </p>
              <p className="text-xs text-slate-500 font-mono tabular-nums mt-1">
                {formatNumber(summaryStats.totalSales)}원
              </p>
            </div>

            <div className="lg:pl-6">
              <p className="text-xs font-medium text-slate-500">상영 규모 및 신규 진입</p>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatNumber(summaryStats.totalShow)}회 상영
              </p>
              <p className="text-xs text-slate-500 font-mono tabular-nums mt-1">
                스크린 합산 {formatNumber(summaryStats.totalScrn)}개관 · 신규(NEW) {summaryStats.newEntriesCount}편
              </p>
            </div>
          </div>
        </section>

        {/* Daily Box Office Table Section */}
        <section
          id="boxoffice-table-section"
          aria-label="일일 박스오피스 순위표"
          className="bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          {/* Table Header & Search/Sort Controls */}
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">
                KOBIS 일일 박스오피스 API · searchDailyBoxOfficeList.json
              </p>
              <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
                일별 박스오피스 순위 및 관객·매출 현황 (행을 클릭하면 하단 상세정보가 갱신됩니다)
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="영화명 또는 대표코드 검색"
                  aria-label="결과 내 영화명 또는 대표코드 검색"
                  className="w-52 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  aria-label="정렬 기준 선택"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  <option value="rank">박스오피스 순위순</option>
                  <option value="audiCnt">일일 관객수 많은순</option>
                  <option value="audiAcc">누적 관객수 많은순</option>
                  <option value="salesAmt">일일 매출액 높은순</option>
                  <option value="salesAcc">누적 매출액 높은순</option>
                  <option value="scrnCnt">상영 스크린 많은순</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loadingBoxOffice && (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className="px-6 py-4 flex items-center justify-between gap-4 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-6 bg-slate-200 rounded" />
                    <div className="space-y-1.5">
                      <div className="w-48 h-4 bg-slate-200 rounded" />
                      <div className="w-32 h-3 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-4 bg-slate-100 rounded" />
                    <div className="w-24 h-4 bg-slate-100 rounded" />
                    <div className="w-28 h-4 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loadingBoxOffice && boxOfficeError && (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-red-600">{boxOfficeError}</p>
              <p className="text-xs text-slate-500 mt-1">
                날짜를 다시 확인하거나 새로고침 버튼을 눌러 재시도해 주세요.
              </p>
              <button
                type="button"
                onClick={fetchDailyBoxOffice}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>다시 불러오기</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loadingBoxOffice && !boxOfficeError && filteredAndSortedList.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-slate-900">
                조회된 박스오피스 데이터가 없습니다
              </p>
              <p className="text-xs text-slate-500 mt-1">
                선택하신 날짜({selectedDate}) 또는 검색 조건에 해당하는 집계 결과가 없습니다.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setMultiMovieYn('');
                  setRepNationCd('');
                  handleDateChange(maxYesterdayDate);
                }}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                어제 기준 전체 목록으로 초기화
              </button>
            </div>
          )}

          {/* Populated Table */}
          {!loadingBoxOffice && !boxOfficeError && filteredAndSortedList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                    <th className="py-3 pl-6 pr-3 w-20">순위</th>
                    <th className="py-3 px-3 w-24">전일대비</th>
                    <th className="py-3 px-4 min-w-[240px]">영화명 · 대표코드 · 개봉일</th>
                    <th className="py-3 px-4 text-right">일일 관객수 (전일대비)</th>
                    <th className="py-3 px-4 text-right">누적 관객수</th>
                    <th className="py-3 px-4 text-right">일일 매출액 (점유율)</th>
                    <th className="py-3 px-4 text-right">누적 매출액</th>
                    <th className="py-3 px-4 text-right">스크린 · 상영횟수</th>
                    <th className="py-3 pl-3 pr-6 text-right w-28">상세정보</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredAndSortedList.map((item) => {
                    const isSelected = item.movieCd === selectedMovieCd;
                    const audiChangeNum = Number(item.audiChange || 0);

                    return (
                      <tr
                        key={item.movieCd}
                        onClick={() => fetchMovieInfo(item.movieCd)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-slate-100/90'
                            : 'hover:bg-slate-50/90'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3.5 pl-6 pr-3 font-mono tabular-nums">
                          <span
                            className={`text-base font-bold ${
                              Number(item.rank) <= 3 ? 'text-slate-900' : 'text-slate-500'
                            }`}
                          >
                            {String(item.rank).padStart(2, '0')}
                          </span>
                        </td>

                        {/* Rank Delta */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {renderRankDelta(item)}
                        </td>

                        {/* Movie Title & Code */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 text-balance">
                            {item.movieNm}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                            <span>코드 {item.movieCd}</span>
                            <span aria-hidden="true">·</span>
                            <span>개봉 {item.openDt || '미정'}</span>
                          </div>
                        </td>

                        {/* Daily Audience */}
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                          <div className="font-semibold text-slate-900">
                            {formatNumber(item.audiCnt)}명
                          </div>
                          <div
                            className={`text-xs mt-0.5 ${
                              audiChangeNum > 0
                                ? 'text-emerald-700'
                                : audiChangeNum < 0
                                ? 'text-red-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {audiChangeNum > 0 ? `+${item.audiChange}%` : `${item.audiChange}%`}
                          </div>
                        </td>

                        {/* Cumulative Audience */}
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                          <div className="font-medium text-slate-800">
                            {formatNumber(item.audiAcc)}명
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {formatCompactAudience(item.audiAcc)}
                          </div>
                        </td>

                        {/* Daily Sales & Share */}
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                          <div className="font-medium text-slate-900">
                            {formatCompactWon(item.salesAmt)}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            점유율 {item.salesShare}%
                          </div>
                        </td>

                        {/* Cumulative Sales */}
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                          <div className="text-slate-700">
                            {formatCompactWon(item.salesAcc)}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {formatNumber(item.salesAcc)}원
                          </div>
                        </td>

                        {/* Screens & Shows */}
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                          <div className="text-slate-800">
                            {formatNumber(item.scrnCnt)}개관
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {formatNumber(item.showCnt)}회 상영
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchMovieInfo(item.movieCd);
                              document
                                .getElementById('movie-detail-section')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? '상세 표시중' : '상세정보'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Movie Detail Info Panel (searchMovieInfo.json) */}
        <MovieDetailPanel
          movieInfo={movieInfo}
          selectedBoxOfficeItem={selectedBoxOfficeItem}
          loading={loadingMovieInfo}
          error={movieInfoError}
          onSelectMovieCd={fetchMovieInfo}
        />

        {/* Market Share & Screen Efficiency Breakdown */}
        <ShareBreakdown
          items={boxOfficeList}
          selectedMovieCd={selectedMovieCd}
          onSelectMovie={(item) => fetchMovieInfo(item.movieCd)}
        />

        {/* API Architecture & Security Notice */}
        <section
          id="api-spec-section"
          aria-label="KOBIS 오픈 API 연동 규격"
          className="bg-white border border-slate-200 rounded-xl p-6"
        >
          <h2 className="text-base font-semibold text-slate-900">
            오픈API 환경변수 참조 및 연동 규격 안내
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            본 웹페이지는 발급된 KOBIS 오픈API 인증키를 프론트엔드 소스코드나 브라우저 화면 입력란에 노출하지 않고, 서버측 환경변수(<span className="font-mono text-slate-800">process.env.KOBIS_API_KEY</span>)에서 직접 참조하여 안전하게 조회합니다.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <p className="font-semibold text-slate-900">01. 일일 박스오피스 조회 엔드포인트</p>
              <p className="font-mono text-slate-500 mt-1 break-all">
                GET /api/boxoffice/daily?targetDt={inputDateToTargetDt(selectedDate)}
              </p>
              <p className="text-slate-500 mt-1">
                내부 연동: <span className="font-mono">kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json</span>
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">02. 영화 상세정보 조회 엔드포인트</p>
              <p className="font-mono text-slate-500 mt-1 break-all">
                GET /api/movie/info?movieCd={selectedMovieCd || '20261807'}
              </p>
              <p className="text-slate-500 mt-1">
                내부 연동: <span className="font-mono">kobisopenapi/webservice/rest/movie/searchMovieInfo.json</span>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-5 mt-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>영화진흥위원회(KOBIS) 영화관입장권통합전산망 오픈API 기반 일일 박스오피스 조회 서비스</span>
          <span className="font-mono tabular-nums">
            기준 가능 범위: 2004-01-01 ~ {maxYesterdayDate} (오늘 이전 날짜)
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;

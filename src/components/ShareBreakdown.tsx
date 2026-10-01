import React from 'react';
import { DailyBoxOfficeItem } from '../types/kobis';
import { formatCompactAudience, formatCompactWon, formatNumber } from '../utils/format';

interface ShareBreakdownProps {
  items: DailyBoxOfficeItem[];
  selectedMovieCd: string;
  onSelectMovie: (item: DailyBoxOfficeItem) => void;
}

export const ShareBreakdown: React.FC<ShareBreakdownProps> = ({
  items,
  selectedMovieCd,
  onSelectMovie,
}) => {
  if (items.length === 0) return null;

  const totalAudi = items.reduce((acc, cur) => acc + Number(cur.audiCnt || 0), 0);
  const totalSales = items.reduce((acc, cur) => acc + Number(cur.salesAmt || 0), 0);
  const totalShowCnt = items.reduce((acc, cur) => acc + Number(cur.showCnt || 0), 0);

  return (
    <section
      id="share-analysis-section"
      aria-label="점유율 및 상영 효율 분석"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-500">
            TOP 10 시장 집중도 · 매출점유율 및 상영회차 대비 관객 효율
          </p>
          <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
            작품별 매출 점유율 및 상영 효율 비교
          </h2>
        </div>
        <div className="text-xs text-slate-500 font-mono tabular-nums">
          TOP 10 합산 관객 {formatCompactAudience(totalAudi)} · 합산 매출 {formatCompactWon(totalSales)}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Sales Share Horizontal Bars */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
            <span>작품명 (클릭 시 상세 조회)</span>
            <span>일일 매출액 · 점유율(salesShare)</span>
          </div>
          {items.map((item) => {
            const share = Math.min(100, Math.max(0, Number(item.salesShare || 0)));
            const isSelected = item.movieCd === selectedMovieCd;
            return (
              <button
                key={item.movieCd}
                type="button"
                onClick={() => onSelectMovie(item)}
                className={`w-full text-left group block py-1.5 px-2.5 -mx-2.5 rounded-lg transition-colors cursor-pointer ${
                  isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-baseline justify-between gap-4 text-xs mb-1.5">
                  <div className="flex items-baseline gap-2 truncate">
                    <span className="font-mono tabular-nums font-semibold text-slate-900 w-5">
                      {String(item.rank).padStart(2, '0')}
                    </span>
                    <span className="font-medium text-slate-900 truncate group-hover:underline">
                      {item.movieNm}
                    </span>
                  </div>
                  <div className="font-mono tabular-nums text-slate-600 shrink-0">
                    <span>{formatCompactWon(item.salesAmt)}</span>
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span className="font-semibold text-slate-900">{share.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className={`h-full transition-transform duration-200 origin-left ${
                      Number(item.rank) === 1
                        ? 'bg-slate-900'
                        : Number(item.rank) <= 3
                        ? 'bg-slate-700'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.max(share, 1.5)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Screen & Show Efficiency Metrics */}
        <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              회차당 평균 관객수 (상영 효율 지표)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              일일 관객수(audiCnt)를 일일 상영횟수(showCnt)로 나눈 1회 상영당 평균 관람 인원입니다.
            </p>

            <div className="mt-4 divide-y divide-slate-100">
              {items.slice(0, 6).map((item) => {
                const audi = Number(item.audiCnt || 0);
                const shows = Number(item.showCnt || 1);
                const screens = Number(item.scrnCnt || 1);
                const audiPerShow = shows > 0 ? audi / shows : 0;
                const showsPerScreen = screens > 0 ? shows / screens : 0;

                return (
                  <div
                    key={item.movieCd}
                    onClick={() => onSelectMovie(item)}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-slate-50 px-2 -mx-2 rounded"
                  >
                    <div className="truncate">
                      <span className="font-mono text-slate-400 mr-2">{item.rank}위</span>
                      <span className="font-medium text-slate-900">{item.movieNm}</span>
                    </div>
                    <div className="font-mono tabular-nums text-right shrink-0">
                      <span className="font-semibold text-slate-900">
                        회당 {audiPerShow.toFixed(1)}명
                      </span>
                      <span className="text-slate-400 ml-2">
                        (관당 {showsPerScreen.toFixed(1)}회)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
            <span>TOP 10 총 상영횟수</span>
            <span className="font-semibold text-slate-900">{formatNumber(totalShowCnt)}회</span>
          </div>
        </div>
      </div>
    </section>
  );
};

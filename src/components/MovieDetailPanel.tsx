import React, { useState } from 'react';
import { Search, Film, RefreshCw, ExternalLink } from 'lucide-react';
import { DailyBoxOfficeItem, MovieInfo } from '../types/kobis';
import { formatCompactAudience, formatCompactWon, formatNumber, formatOpenDt } from '../utils/format';

interface MovieDetailPanelProps {
  movieInfo: MovieInfo | null;
  selectedBoxOfficeItem: DailyBoxOfficeItem | null;
  loading: boolean;
  error: string | null;
  onSelectMovieCd: (movieCd: string) => void;
}

export const MovieDetailPanel: React.FC<MovieDetailPanelProps> = ({
  movieInfo,
  selectedBoxOfficeItem,
  loading,
  error,
  onSelectMovieCd,
}) => {
  const [customMovieCd, setCustomMovieCd] = useState('');

  const handleCustomLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customMovieCd.trim();
    if (trimmed) {
      onSelectMovieCd(trimmed);
    }
  };

  const watchGrade =
    movieInfo?.audits && movieInfo.audits.length > 0
      ? movieInfo.audits.map((a) => a.watchGradeNm).filter(Boolean).join(', ')
      : '등급 정보 없음';

  const auditNo =
    movieInfo?.audits && movieInfo.audits.length > 0
      ? movieInfo.audits.map((a) => a.auditNo).filter(Boolean).join(', ')
      : '-';

  const nationsText =
    movieInfo?.nations && movieInfo.nations.length > 0
      ? movieInfo.nations.map((n) => n.nationNm).join(', ')
      : '국가 미상';

  const genresText =
    movieInfo?.genres && movieInfo.genres.length > 0
      ? movieInfo.genres.map((g) => g.genreNm).join(' · ')
      : '장르 미상';

  return (
    <section
      id="movie-detail-section"
      aria-label="영화 상세정보"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Header & Direct Movie Code Lookup */}
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            KOBIS 영화상세정보 API · searchMovieInfo.json
          </p>
          <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
            선택 영화 상세 메타데이터
          </h2>
        </div>

        <form onSubmit={handleCustomLookup} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={customMovieCd}
              onChange={(e) => setCustomMovieCd(e.target.value)}
              placeholder="영화코드 직접 조회 (예: 20261807)"
              aria-label="영화 대표코드(movieCd) 직접 입력"
              className="w-56 pl-3 pr-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>코드 조회</span>
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-6 space-y-5 animate-pulse">
          <div className="space-y-2">
            <div className="h-3.5 w-40 bg-slate-200 rounded" />
            <div className="h-7 w-72 bg-slate-200 rounded" />
            <div className="h-4 w-56 bg-slate-100 rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div className="h-12 bg-slate-100 rounded" />
            <div className="h-12 bg-slate-100 rounded" />
            <div className="h-12 bg-slate-100 rounded" />
            <div className="h-12 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-5/6 bg-slate-100 rounded" />
            <div className="h-4 w-2/3 bg-slate-100 rounded" />
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-8 text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <p className="text-xs text-slate-500 mt-1">
            좌측 박스오피스 목록에서 영화를 선택하거나 올바른 8자리 영화코드를 입력해주세요.
          </p>
          {movieInfo?.movieCd && (
            <button
              type="button"
              onClick={() => onSelectMovieCd(movieInfo.movieCd)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>다시 시도</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !movieInfo && (
        <div className="p-10 text-center">
          <Film className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-900">
            선택된 영화 상세정보가 없습니다
          </p>
          <p className="text-xs text-slate-500 mt-1">
            일일 박스오피스 순위표에서 영화를 클릭하면 감독, 배우, 제작사 및 심의 정보를 즉시 조회합니다.
          </p>
        </div>
      )}

      {/* Populated State */}
      {!loading && !error && movieInfo && (
        <div className="divide-y divide-slate-200">
          {/* Primary Title & Unboxed Metadata Strip */}
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono text-slate-700 font-medium">
                코드 {movieInfo.movieCd}
              </span>
              <span aria-hidden="true">·</span>
              <span>{movieInfo.typeNm || '장편'}</span>
              <span aria-hidden="true">·</span>
              <span>{movieInfo.prdtStatNm || '개봉'}</span>
              <span aria-hidden="true">·</span>
              <span>{nationsText}</span>
              <span aria-hidden="true">·</span>
              <span>{genresText}</span>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight text-balance">
              {movieInfo.movieNm}
            </h3>

            {(movieInfo.movieNmEn || movieInfo.movieNmOg) && (
              <p className="text-sm text-slate-500 mt-1">
                {movieInfo.movieNmEn}
                {movieInfo.movieNmEn && movieInfo.movieNmOg && movieInfo.movieNmEn !== movieInfo.movieNmOg
                  ? ` / ${movieInfo.movieNmOg}`
                  : !movieInfo.movieNmEn
                  ? movieInfo.movieNmOg
                  : ''}
              </p>
            )}

            {/* Key Production Specs Grid */}
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6 pt-5 border-t border-slate-100">
              <div>
                <dt className="text-xs text-slate-500">개봉일자</dt>
                <dd className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-1">
                  {formatOpenDt(movieInfo.openDt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">상영시간 / 제작연도</dt>
                <dd className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-1">
                  {movieInfo.showTm ? `${movieInfo.showTm}분` : '-'} · {movieInfo.prdtYear || '-'}년
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">관람등급</dt>
                <dd className="text-sm font-semibold text-slate-900 mt-1">
                  {watchGrade}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">심의번호</dt>
                <dd className="text-sm font-mono tabular-nums text-slate-700 mt-1">
                  {auditNo}
                </dd>
              </div>
            </dl>
          </div>

          {/* Box Office Performance Context */}
          {selectedBoxOfficeItem && selectedBoxOfficeItem.movieCd === movieInfo.movieCd && (
            <div className="px-6 py-5 bg-slate-50/70">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700">
                  조회일 박스오피스 성적 요약
                </span>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  일일 순위 {selectedBoxOfficeItem.rank}위 · 매출점유율 {selectedBoxOfficeItem.salesShare}%
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500">일일 관객수</p>
                  <p className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                    {formatNumber(selectedBoxOfficeItem.audiCnt)}명
                  </p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums">
                    ({formatCompactAudience(selectedBoxOfficeItem.audiCnt)})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">누적 관객수</p>
                  <p className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                    {formatNumber(selectedBoxOfficeItem.audiAcc)}명
                  </p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums">
                    ({formatCompactAudience(selectedBoxOfficeItem.audiAcc)})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">일일 매출액</p>
                  <p className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                    {formatCompactWon(selectedBoxOfficeItem.salesAmt)}
                  </p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums">
                    {formatNumber(selectedBoxOfficeItem.salesAmt)}원
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">상영 스크린 · 횟수</p>
                  <p className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                    {formatNumber(selectedBoxOfficeItem.scrnCnt)}개관 · {formatNumber(selectedBoxOfficeItem.showCnt)}회
                  </p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums">
                    누적 {formatCompactWon(selectedBoxOfficeItem.salesAcc)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Directors & Cast */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4">
              <h4 className="text-xs font-semibold text-slate-500 mb-2.5">감독 (Directors)</h4>
              {movieInfo.directors && movieInfo.directors.length > 0 ? (
                <ul className="space-y-2">
                  {movieInfo.directors.map((dir, idx) => (
                    <li key={`${dir.peopleNm}-${idx}`} className="text-sm text-slate-900">
                      <span className="font-medium">{dir.peopleNm}</span>
                      {dir.peopleNmEn && (
                        <span className="text-xs text-slate-500 block">{dir.peopleNmEn}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">등록된 감독 정보가 없습니다.</p>
              )}

              {/* ShowTypes */}
              <h4 className="text-xs font-semibold text-slate-500 mt-6 mb-2.5">
                상영 형태 (Show Types)
              </h4>
              {movieInfo.showTypes && movieInfo.showTypes.length > 0 ? (
                <div className="text-xs text-slate-700 leading-relaxed">
                  {movieInfo.showTypes.map((st, i) => (
                    <React.Fragment key={`${st.showTypeGroupNm}-${st.showTypeNm}-${i}`}>
                      {i > 0 && <span className="mx-1.5 text-slate-300">·</span>}
                      <span>
                        {st.showTypeGroupNm} {st.showTypeNm}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">상영 형태 정보 없음</p>
              )}
            </div>

            <div className="md:col-span-8">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-semibold text-slate-500">
                  출연 배우 및 배역 ({movieInfo.actors ? movieInfo.actors.length : 0}명)
                </h4>
              </div>
              {movieInfo.actors && movieInfo.actors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 max-h-56 overflow-y-auto pr-1">
                  {movieInfo.actors.slice(0, 16).map((actor, idx) => (
                    <div
                      key={`${actor.peopleNm}-${idx}`}
                      className="py-1.5 border-b border-slate-100 flex items-baseline justify-between gap-2 text-xs"
                    >
                      <div className="truncate">
                        <span className="font-medium text-slate-900">{actor.peopleNm}</span>
                        {actor.peopleNmEn && (
                          <span className="text-slate-400 ml-1.5">{actor.peopleNmEn}</span>
                        )}
                      </div>
                      {actor.cast && (
                        <span className="text-slate-500 shrink-0 truncate max-w-[110px]">
                          {actor.cast} 역
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">등록된 출연 배우 정보가 없습니다.</p>
              )}
            </div>
          </div>

          {/* Participating Companies */}
          <div className="p-6">
            <h4 className="text-xs font-semibold text-slate-500 mb-3">
              참여 영화사 (제작 · 배급 · 수입)
            </h4>
            {movieInfo.companys && movieInfo.companys.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {movieInfo.companys.map((comp, idx) => (
                  <div
                    key={`${comp.companyCd}-${comp.companyPartNm}-${idx}`}
                    className="flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-100 text-xs"
                  >
                    <div className="truncate">
                      <span className="font-medium text-slate-900">{comp.companyNm}</span>
                      {comp.companyNmEn && (
                        <span className="text-slate-400 ml-1.5">{comp.companyNmEn}</span>
                      )}
                    </div>
                    <span className="text-slate-500 shrink-0 font-mono">
                      {comp.companyPartNm}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">등록된 영화사 정보가 없습니다.</p>
            )}
          </div>

          {/* Source Footer */}
          <div className="px-6 py-3.5 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>데이터 출처: 영화진흥위원회 (KOBIS 오픈API)</span>
            <a
              href="https://www.kobis.or.kr/kobis/business/mast/mvie/searchMovieList.do"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
              <span>KOBIS 공식 통계포털</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </section>
  );
};

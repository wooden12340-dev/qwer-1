export interface DailyBoxOfficeItem {
  rnum: string;
  rank: string;
  rankInten: string;
  rankOldAndNew: 'NEW' | 'OLD' | string;
  movieCd: string;
  movieNm: string;
  openDt: string;
  salesAmt: string;
  salesShare: string;
  salesInten: string;
  salesChange: string;
  salesAcc: string;
  audiCnt: string;
  audiInten: string;
  audiChange: string;
  audiAcc: string;
  scrnCnt: string;
  showCnt: string;
}

export interface DailyBoxOfficeResponse {
  boxOfficeResult?: {
    boxofficeType: string;
    showRange: string;
    dailyBoxOfficeList: DailyBoxOfficeItem[];
  };
  error?: string;
  code?: string;
}

export interface MovieNation {
  nationNm: string;
}

export interface MovieGenre {
  genreNm: string;
}

export interface MovieDirector {
  peopleNm: string;
  peopleNmEn: string;
}

export interface MovieActor {
  peopleNm: string;
  peopleNmEn: string;
  cast: string;
  castEn: string;
}

export interface MovieShowType {
  showTypeGroupNm: string;
  showTypeNm: string;
}

export interface MovieCompany {
  companyCd: string;
  companyNm: string;
  companyNmEn: string;
  companyPartNm: string;
}

export interface MovieAudit {
  auditNo: string;
  watchGradeNm: string;
}

export interface MovieStaff {
  peopleNm: string;
  peopleNmEn: string;
  staffRoleNm: string;
}

export interface MovieInfo {
  movieCd: string;
  movieNm: string;
  movieNmEn: string;
  movieNmOg: string;
  showTm: string;
  prdtYear: string;
  openDt: string;
  prdtStatNm: string;
  typeNm: string;
  nations: MovieNation[];
  genres: MovieGenre[];
  directors: MovieDirector[];
  actors: MovieActor[];
  showTypes: MovieShowType[];
  companys: MovieCompany[];
  audits: MovieAudit[];
  staffs: MovieStaff[];
}

export interface MovieInfoResponse {
  movieInfoResult?: {
    movieInfo: MovieInfo;
    source: string;
  };
  error?: string;
  code?: string;
}

export type MultiMovieFilter = '' | 'N' | 'Y';
export type NationFilter = '' | 'K' | 'F';
export type SortField = 'rank' | 'audiCnt' | 'audiAcc' | 'salesAmt' | 'salesAcc' | 'scrnCnt';

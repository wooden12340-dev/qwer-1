export default async function handler(req: any, res: any) {
  try {
    const apiKey = (process.env.KOBIS_API_KEY || process.env.VITE_KOBIS_API_KEY || '').trim();
    if (!apiKey) {
      res.status(500).json({
        error: '서버 환경변수(KOBIS_API_KEY)가 설정되지 않았습니다. Vercel 환경변수 설정을 확인해주세요.',
      });
      return;
    }

    const query = req.query || {};
    const targetDt = String(query.targetDt || '').replace(/[^0-9]/g, '');
    if (targetDt.length !== 8) {
      res.status(400).json({
        error: '유효한 조회 일자(YYYYMMDD 8자리)를 입력해주세요.',
      });
      return;
    }

    const multiMovieYn = String(query.multiMovieYn || '').trim();
    const repNationCd = String(query.repNationCd || '').trim();
    const wideAreaCd = String(query.wideAreaCd || '').trim();
    const itemPerPage = String(query.itemPerPage || '10').trim();

    const params = new URLSearchParams({
      key: apiKey,
      targetDt,
      itemPerPage,
    });

    if (multiMovieYn === 'Y' || multiMovieYn === 'N') {
      params.set('multiMovieYn', multiMovieYn);
    }
    if (repNationCd === 'K' || repNationCd === 'F') {
      params.set('repNationCd', repNationCd);
    }
    if (wideAreaCd) {
      params.set('wideAreaCd', wideAreaCd);
    }

    const apiUrl = `http://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?${params.toString()}`;
    const response = await fetch(apiUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `KOBIS 서버 응답 오류 (HTTP ${response.status})`,
      });
      return;
    }

    const data = await response.json();

    if (data && data.faultInfo) {
      res.status(400).json({
        error: data.faultInfo.message || 'KOBIS API 요청 처리 중 오류가 발생했습니다.',
        code: data.faultInfo.errorCode,
      });
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching daily box office:', error);
    res.status(500).json({
      error: '일일 박스오피스 데이터를 불러오는 중 오류가 발생했습니다.',
    });
  }
}

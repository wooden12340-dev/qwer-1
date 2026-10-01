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
    const movieCd = String(query.movieCd || '').trim();
    if (!movieCd) {
      res.status(400).json({
        error: '유효한 영화 대표코드(movieCd)를 입력해주세요.',
      });
      return;
    }

    const params = new URLSearchParams({
      key: apiKey,
      movieCd,
    });

    const apiUrl = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?${params.toString()}`;
    const response = await fetch(apiUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `KOBIS 영화 상세정보 응답 오류 (HTTP ${response.status})`,
      });
      return;
    }

    const data = await response.json();

    if (data && data.faultInfo) {
      res.status(400).json({
        error: data.faultInfo.message || 'KOBIS 영화 상세정보 요청 중 오류가 발생했습니다.',
        code: data.faultInfo.errorCode,
      });
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching movie info:', error);
    res.status(500).json({
      error: '영화 상세정보를 불러오는 중 오류가 발생했습니다.',
    });
  }
}

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Cache to prevent repetitive requests to KOBIS servers
const dailyCache = new Map<string, { timestamp: number; data: unknown }>();
const movieCache = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

function getKobisApiKey(): string {
  return (process.env.KOBIS_API_KEY || '').trim();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Daily Box Office Proxy: searchDailyBoxOfficeList.json
  app.get('/api/boxoffice/daily', async (req, res) => {
    try {
      const apiKey = getKobisApiKey();
      if (!apiKey) {
        res.status(500).json({
          error: '서버 환경변수(KOBIS_API_KEY)가 설정되지 않았습니다.',
        });
        return;
      }

      const targetDt = String(req.query.targetDt || '').replace(/[^0-9]/g, '');
      if (targetDt.length !== 8) {
        res.status(400).json({
          error: '유효한 조회 일자(YYYYMMDD 8자리)를 입력해주세요.',
        });
        return;
      }

      const multiMovieYn = String(req.query.multiMovieYn || '').trim();
      const repNationCd = String(req.query.repNationCd || '').trim();
      const wideAreaCd = String(req.query.wideAreaCd || '').trim();
      const itemPerPage = String(req.query.itemPerPage || '10').trim();

      const cacheKey = `${targetDt}:${multiMovieYn}:${repNationCd}:${wideAreaCd}:${itemPerPage}`;
      const cached = dailyCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        res.json(cached.data);
        return;
      }

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

      dailyCache.set(cacheKey, { timestamp: Date.now(), data });
      res.json(data);
    } catch (error) {
      console.error('Error fetching daily box office:', error);
      res.status(500).json({
        error: '일일 박스오피스 데이터를 불러오는 중 네트워크 오류가 발생했습니다.',
      });
    }
  });

  // 2. Movie Detail Info Proxy: searchMovieInfo.json
  app.get('/api/movie/info', async (req, res) => {
    try {
      const apiKey = getKobisApiKey();
      if (!apiKey) {
        res.status(500).json({
          error: '서버 환경변수(KOBIS_API_KEY)가 설정되지 않았습니다.',
        });
        return;
      }

      const movieCd = String(req.query.movieCd || '').trim();
      if (!movieCd) {
        res.status(400).json({
          error: '유효한 영화 대표코드(movieCd)를 입력해주세요.',
        });
        return;
      }

      const cached = movieCache.get(movieCd);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        res.json(cached.data);
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

      movieCache.set(movieCd, { timestamp: Date.now(), data });
      res.json(data);
    } catch (error) {
      console.error('Error fetching movie info:', error);
      res.status(500).json({
        error: '영화 상세정보를 불러오는 중 네트워크 오류가 발생했습니다.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Daily Movie Box Office server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

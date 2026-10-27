/* ===== 또미 공용 데이터 =====
   실제 공공데이터(소상공인시장진흥공단 상가(상권)정보, 상권업종 대분류 "음식")를 그대로 쓴다.
   가짜 가게·가짜 점수를 만들지 않는다. 없는 항목은 "아직 없음"으로 표시한다.

   전국 84만 곳을 한 파일에 담으면 100MB가 넘어 브라우저가 멈춘다. 그래서
   data/regions/ 아래에 시군구별로 쪼개 두고, 보고 있는 지역 파일만 불러온다.
     index.json      — 시도 → 시군구 목록, 개수, 중심좌표, 범위 (가벼움)
     <시군구코드>.json — 그 지역 가게 목록
*/
window.Ddomi = (function () {
  var idxCache = null, regionCache = {}, regionWait = {};

  function getJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  /* 전국 목차 — 어느 지역에 몇 곳이 있는지. 모든 화면이 이것부터 읽는다. */
  function index() {
    if (idxCache) return Promise.resolve(idxCache);
    return getJSON("data/regions/index.json").then(function (d) {
      d.sigunguAll = [];
      d.sido.forEach(function (s) {
        s.sigungu.forEach(function (g) { g.sido = s.name; g.sidoCode = s.code; d.sigunguAll.push(g); });
      });
      idxCache = d;
      return d;
    });
  }

  /* 한 시군구의 가게 목록. 저장은 짧은 키로 해 두고(용량), 화면에서 쓰는 긴 이름으로 풀어 준다. */
  function region(code) {
    if (regionCache[code]) return Promise.resolve(regionCache[code]);
    if (regionWait[code]) return regionWait[code];
    regionWait[code] = getJSON("data/regions/" + code + ".json").then(function (doc) {
      var m = doc.meta, pre = dedupe(m.prefix || "");
      var list = doc.items.map(function (r) {
        var full = pre ? pre + " " + r.ad : r.ad;
        return { id: r.id, name: r.nm, category: r.ct, dong: r.dn,
                 lat: r.y, lng: r.x, roadAddr: full, addr: full,
                 sido: m.sido, sigungu: m.sigungu, sigunguCd: m.code };
      });
      var b = m.bbox || [0, 0, 0, 0];
      var out = { meta: m, list: list,
                  bbox: { minLat: b[0], minLng: b[1], maxLat: b[2], maxLng: b[3] } };
      regionCache[code] = out; delete regionWait[code];
      return out;
    });
    return regionWait[code];
  }

  /* 세종처럼 시도명과 시군구명이 같은 곳은 "세종특별자치시 세종특별자치시"가 되므로 한 번만 남긴다. */
  function dedupe(s) {
    var seen = [], parts = s.split(" ");
    for (var i = 0; i < parts.length; i++) if (parts[i] && parts[i] !== parts[i - 1]) seen.push(parts[i]);
    return seen.join(" ");
  }

  /* 여러 지역을 한꺼번에 — 지도에서 화면 안에 걸친 시군구들을 불러올 때 */
  function regions(codes) {
    return Promise.all(codes.map(region));
  }

  /* 위경도 → 캔버스 좌표 (여백 8%) */
  function project(d, p, w, h) {
    var b = d.bbox, pad = 0.08;
    var x = (p.lng - b.minLng) / (b.maxLng - b.minLng);
    var y = 1 - (p.lat - b.minLat) / (b.maxLat - b.minLat);
    return [ (pad + x * (1 - pad * 2)) * w, (pad + y * (1 - pad * 2)) * h ];
  }

  /* 미니맵 — 외부 지도 라이브러리 없이 점만 찍는다(가볍고 오프라인에서도 동작) */
  function drawMap(canvas, d, opts) {
    opts = opts || {};
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = opts.bg || "#FAF4E4";
    ctx.fillRect(0, 0, w, h);

    var dim = opts.dim || "#E6D9BC";
    var hot = opts.hot || "#F47920";
    var match = opts.match || null;   // function(place) -> true 면 강조
    var points = [];

    d.list.forEach(function (p) {
      var xy = project(d, p, w, h);
      var on = match ? match(p) : true;
      ctx.beginPath();
      ctx.arc(xy[0], xy[1], on ? 2.6 : 1.6, 0, Math.PI * 2);
      ctx.fillStyle = on ? hot : dim;
      ctx.globalAlpha = on ? 0.92 : 0.5;
      ctx.fill();
      if (on) points.push({ p: p, x: xy[0], y: xy[1] });
    });
    ctx.globalAlpha = 1;
    return points;
  }

  function fmt(n) { return (n || 0).toLocaleString("ko-KR"); }

  return { index: index, region: region, regions: regions,
           drawMap: drawMap, project: project, fmt: fmt };
})();

/* ═══════════════════════════════════════════════════
   또미 — 가게 상세 공용 내용
   지도와 "또미가 골라줘"가 같은 상세를 보여 준다. 두 곳에 같은 글을 두면
   한쪽만 고쳐져 말이 갈라지므로, 문장도 여기서만 쓴다.

   원칙 (00_brand_guide / CLAUDE.md):
     없는 데이터를 추정으로 채우지 않는다. 없으면 "—"로 두고 왜 없는지 적는다.
     지금 공공데이터가 주는 것은 이름·업종·주소·행정동·좌표가 전부다.
     전화·영업시간·사진·메뉴는 아예 없으므로 지어내지 않는다.
   ═══════════════════════════════════════════════════ */
window.DdomiPlace = (function () {

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function addr(p) { return p.roadAddr || p.addr || ""; }

  /* 걸어서 몇 분 — 분속 67m(시속 4km)로 잡는다. 추정임을 글에서 밝힌다. */
  function walkMin(m) { return Math.max(1, Math.round(m / 67)); }

  /* 상세 본문. opts 로 화면마다 다른 부분만 끼운다.
       head    윗줄 작은 글 (예: "점심 후보 · 12:00 – 13:30")
       reason  "왜 이 집이 떴는가" 문단 (골라줘에서만)
       walk    {label, dist} 앞 칸에서의 거리 (골라줘에서만)
       similar 같은 동네 비슷한 집 배열 (지도에서만)
       meLabel 내 위치에서의 거리 문자열 (지도에서만) */
  function detail(p, opts) {
    opts = opts || {};
    var a = addr(p), q = encodeURIComponent(p.name + " " + a);
    var h = [];

    if (opts.head) h.push('<p class="phead">' + esc(opts.head) + '</p>');
    h.push('<h2 class="dnm">' + esc(p.name) + '</h2>');
    h.push('<p class="dsub">' + esc(p.category) + ' · ' +
           esc((p.sigungu || "") + " " + (p.dong || "")).trim() +
           (opts.meLabel ? ' · ' + esc(opts.meLabel) : '') + '</p>');

    h.push('<div class="score"><span class="v">—</span>' +
           '<span class="k"><b>또미 미식점수</b>방문 평가가 한 건도 없어 점수를 낼 수 없습니다. ' +
           '표본이 10~15회 쌓이기 전에는 순위를 바꾸지 않습니다.</span></div>');

    h.push('<p class="lv">점수를 떠받치는 세 가지</p>');

    h.push('<div class="layer"><div class="lh"><span class="ln">버틴 시간</span><span class="lvv">—</span></div>' +
           '<p class="lb">인허가일부터 지금까지 영업한 기간. 광고로 살 수 없는 신호입니다. ' +
           '<b>아직 붙지 않은 데이터입니다.</b></p></div>');

    h.push('<div class="layer alt"><div class="lh"><span class="ln">광고 노출도</span><span class="lvv">—</span></div>' +
           '<p class="lb">검색 결과에서 협찬·광고 표기가 붙은 글의 비율. 알려진 정도이지 맛의 평가가 아닙니다. ' +
           '<b>아직 집계하지 않았습니다.</b></p></div>');

    h.push('<div class="layer"><div class="lh"><span class="ln">방문 평가</span><span class="lvv">0건</span></div>' +
           '<p class="lb">실제로 다녀온 사람의 평가. 네 단계 검증을 거쳐 반영됩니다. ' +
           '<b>씨앗 미식가 모집 전이라 0건입니다.</b></p>' +
           '<div class="bar"><i style="--w:0%"></i></div></div>');

    h.push('<p class="pnote">세 가지를 한 숫자로 합치지 않습니다. 따로 보여주고 판단은 맡깁니다.</p>');

    if (opts.reason) {
      h.push('<p class="lv">왜 이 집이 떴는가</p>');
      h.push('<div class="layer"><p class="lb" style="margin:0">' + esc(opts.reason) + '</p></div>');
    }

    h.push('<p class="lv">기본 정보</p><dl style="margin:0">');
    if (opts.walk) {
      h.push('<div class="kv"><dt>' + esc(opts.walk.label) + '</dt><dd>' +
             (opts.walk.dist ? '도보 약 ' + walkMin(opts.walk.dist) + '분 · ' +
                               Math.round(opts.walk.dist) + 'm' : '첫 칸') + '</dd></div>');
    }
    h.push('<div class="kv"><dt>주소</dt><dd>' + esc(a || "—") + '</dd></div>');
    h.push('<div class="kv"><dt>업종</dt><dd>' + esc(p.category) + '</dd></div>');
    h.push('<div class="kv"><dt>좌표</dt><dd>' + p.lat.toFixed(5) + ', ' + p.lng.toFixed(5) + '</dd></div>');
    h.push('<div class="kv"><dt>영업시간</dt><dd>미확인</dd></div>');
    h.push('<div class="kv"><dt>전화</dt><dd>미확인</dd></div>');
    h.push('<div class="kv"><dt>출처</dt><dd>소상공인시장진흥공단 상가업소정보</dd></div>');
    h.push('</dl>');
    h.push('<p class="pnote">영업시간과 전화번호는 공공데이터에 없어 또미도 아직 가지고 있지 않습니다. ' +
           '추정해 채우지 않습니다.</p>');

    h.push('<p class="lv">가는 길</p><div class="pgo">' +
           '<a class="btn line sm" target="_blank" rel="noopener noreferrer" ' +
           'href="https://map.kakao.com/link/to/' + encodeURIComponent(p.name) + ',' +
           p.lat + ',' + p.lng + '">카카오맵 길찾기</a>' +
           '<a class="btn line sm" target="_blank" rel="noopener noreferrer" ' +
           'href="https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng +
           '">구글 지도 길찾기</a>' +
           '<button class="btn quiet sm" type="button" data-copy="' + esc(a) + '">주소 복사</button>' +
           '</div>');

    if (opts.similar && opts.similar.length) {
      h.push('<p class="lv">같은 동네, 같은 업종</p>');
      opts.similar.forEach(function (s, i) {
        h.push('<button class="simi' + (i % 2 ? ' alt' : '') + '" type="button" data-sim="' + esc(s.id) + '">' +
               '<b>' + esc(s.name) + '</b><span>' + esc(s.dong) + ' · 평가 0건</span></button>');
      });
      h.push('<p class="pnote">아직 점수가 없으니 순서는 거리순입니다. 어느 집이 낫다는 뜻이 아닙니다.</p>');
    }

    h.push('<p class="lv">이 집, 가 보셨나요</p>' +
           '<div class="layer"><p class="lb" style="margin:0 0 11px">첫 평가를 남길 씨앗 미식가를 찾습니다. ' +
           '평가가 쌓이기 전까지 이 집의 점수는 비어 있습니다.</p>' +
           '<a class="btn accent sm" href="reviewer.html?place=' + encodeURIComponent(p.name) +
           '">미식가 신청하기</a></div>');

    return h.join("");
  }

  /* 주소 복사 버튼과 비슷한 집 버튼을 묶는다. onSim 은 지도에서만 넘긴다. */
  function bind(root, onSim) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-copy]"), function (b) {
      b.onclick = function () {
        var t = b.getAttribute("data-copy");
        var done = function () { b.textContent = "복사했습니다"; setTimeout(function () { b.textContent = "주소 복사"; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(t).then(done, function () { b.textContent = "복사하지 못했습니다"; });
        } else { b.textContent = "복사하지 못했습니다"; }
      };
    });
    if (onSim) {
      Array.prototype.forEach.call(root.querySelectorAll("[data-sim]"), function (b) {
        b.onclick = function () { onSim(b.getAttribute("data-sim")); };
      });
    }
  }

  return { detail: detail, bind: bind, walkMin: walkMin, esc: esc };
})();

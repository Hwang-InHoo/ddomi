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

    /* 주소는 한 줄로만 남긴다. "기본 정보" 표를 걷어내면서 주소까지 사라지면
       어디 있는 집인지 알 수 없게 되므로 제목 바로 밑으로 올렸다. */
    if (a) h.push('<p class="daddr">' + esc(a) + '</p>');
    if (opts.walk) {
      h.push('<p class="daddr">' + esc(opts.walk.label) + ' ' +
             (opts.walk.dist ? '도보 약 ' + walkMin(opts.walk.dist) + '분 · ' +
                               Math.round(opts.walk.dist) + 'm' : '첫 칸') + '</p>');
    }

    /* 점수와 방문 횟수. 둘 다 비어 있는 것이 지금은 정상이고, 비어 있다는 사실
       자체가 정보다 — 없는 숫자를 지어내지 않는다. */
    h.push('<div class="score"><span class="v">—</span>' +
           '<span class="k"><b>또미 미식점수</b>방문 평가가 한 건도 없어 점수를 낼 수 없습니다. ' +
           '표본이 10~15회 쌓이기 전에는 순위를 바꾸지 않습니다.</span></div>');

    h.push('<div class="visit"><span class="vk">방문 평가</span>' +
           '<b class="vv">' + (opts.visits == null ? 0 : opts.visits) + '건</b></div>');

    if (opts.reason) {
      h.push('<p class="lv">왜 이 집이 떴는가</p>');
      h.push('<div class="layer"><p class="lb" style="margin:0">' + esc(opts.reason) + '</p></div>');
    }

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

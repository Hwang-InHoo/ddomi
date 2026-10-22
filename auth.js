/* ===== 또미 회원 공용 스크립트 =====
   - Supabase Auth(구글 + 이메일/비밀번호)를 감싼 얇은 유틸
   - 관리자 판정은 서버(ddomi_profiles.is_admin)에서만 내려온다. 이 파일에 관리자 이메일을 적지 않는다.
*/
(function (global) {
  var CFG = global.DDOMI_CONFIG || {};
  var client = null;

  function sb() {
    if (client) return client;
    if (!global.supabase || !CFG.SUPABASE_URL || !CFG.SUPABASE_KEY) return null;
    client = global.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return client;
  }

  /* 아이디 규칙 — DB의 check 제약과 반드시 같아야 한다 */
  var USERNAME_RE = /^[a-z0-9_]{3,20}$/;

  function validateUsername(v) {
    if (!v) return "아이디를 입력해 주세요.";
    if (!USERNAME_RE.test(v)) return "아이디는 영문 소문자·숫자·밑줄(_) 3~20자입니다.";
    return null;
  }

  function validatePassword(v) {
    if (!v || v.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
    if (!/[a-zA-Z]/.test(v) || !/[0-9]/.test(v)) return "비밀번호에 영문과 숫자를 모두 넣어 주세요.";
    return null;
  }

  /* 아이디 중복 확인 — 서버 함수가 true/false만 돌려준다(이메일 노출 없음) */
  function usernameAvailable(username) {
    var c = sb();
    if (!c) return Promise.resolve(null);
    return c.rpc("ddomi_username_available", { p_username: username })
      .then(function (r) { return r.error ? null : r.data; });
  }

  function getSession() {
    var c = sb();
    if (!c) return Promise.resolve(null);
    return c.auth.getSession().then(function (r) { return r.data ? r.data.session : null; });
  }

  /* 로그인 사용자 + 프로필(아이디·관리자여부)을 함께 반환 */
  function getMe() {
    var c = sb();
    if (!c) return Promise.resolve(null);
    return c.auth.getUser().then(function (r) {
      var user = r.data ? r.data.user : null;
      if (!user) return null;
      return c.from("ddomi_profiles").select("username,is_admin").eq("id", user.id).maybeSingle()
        .then(function (p) {
          return {
            user: user,
            username: p.data ? p.data.username : null,
            isAdmin: !!(p.data && p.data.is_admin),
            hasPassword: !!(user.identities || []).some(function (i) { return i.provider === "email"; }),
            hasGoogle: !!(user.identities || []).some(function (i) { return i.provider === "google"; })
          };
        });
    });
  }

  function signInWithGoogle(redirectPath) {
    var c = sb();
    if (!c) return Promise.reject(new Error("설정이 아직 없습니다."));
    return c.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: new URL(redirectPath || "account.html", global.location.href).href }
    });
  }

  function signUpWithEmail(email, password, username) {
    var c = sb();
    if (!c) return Promise.reject(new Error("설정이 아직 없습니다."));
    return c.auth.signUp({
      email: email,
      password: password,
      options: { data: { username: username } }
    });
  }

  function signInWithEmail(email, password) {
    return sb().auth.signInWithPassword({ email: email, password: password });
  }

  /* 아이디로 로그인 — 아이디→이메일 변환을 서버(Edge Function)에서 처리해 이메일이 새지 않게 한다 */
  function signInWithUsername(username, password) {
    var c = sb();
    if (!c) return Promise.reject(new Error("설정이 아직 없습니다."));
    return fetch(CFG.SUPABASE_URL + "/functions/v1/login-username", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": CFG.SUPABASE_KEY },
      body: JSON.stringify({ username: username, password: password })
    }).then(function (res) {
      return res.json().then(function (body) {
        if (!res.ok) throw new Error(body && body.error ? body.error : "로그인에 실패했습니다.");
        return c.auth.setSession({
          access_token: body.access_token,
          refresh_token: body.refresh_token
        });
      });
    });
  }

  function signOut() {
    var c = sb();
    if (!c) return Promise.resolve();
    return c.auth.signOut();
  }

  /* 내비 오른쪽에 로그인 상태를 그린다.
     비관리자에게는 관리자 메뉴를 아예 그리지 않는다. */
  function renderNavState(slotId) {
    var slot = document.getElementById(slotId || "navauth");
    if (!slot) return Promise.resolve(null);
    return getMe().then(function (me) {
      if (!me) {
        slot.innerHTML = '<a class="btn ghost" href="login.html">로그인</a>' +
                         '<a class="btn pri" href="signup.html" style="margin-left:8px">가입</a>';
        return null;
      }
      var adminLink = me.isAdmin
        ? '<a class="btn ghost" href="admin.html" style="margin-right:8px">관리자</a>' : '';
      slot.innerHTML =
        adminLink +
        '<span class="who">' + (me.username ? '<b>' + me.username + '</b>' : '') +
        (me.isAdmin ? '<span class="adm-badge">관리자</span>' : '') + '</span>' +
        '<button class="btn ghost" id="navlogout" style="margin-left:12px">로그아웃</button>';
      var b = document.getElementById("navlogout");
      if (b) b.addEventListener("click", function () {
        signOut().then(function () { global.location.href = "index.html"; });
      });
      return me;
    });
  }

  /* 관리자 전용 페이지 가드 — 아닌 사람에게는 내용을 그리지 않는다.
     (정적 사이트라 소스 자체는 볼 수 있다. 비밀 데이터를 여기에 두지 않는다.) */
  function requireAdmin(contentId, gateId) {
    var content = document.getElementById(contentId);
    var gate = document.getElementById(gateId);
    return getMe().then(function (me) {
      if (me && me.isAdmin) {
        if (content) content.hidden = false;
        if (gate) gate.hidden = true;
        return me;
      }
      if (content) content.remove();
      if (gate) {
        gate.hidden = false;
        gate.innerHTML = me
          ? '<div class="card"><h1 class="t">관리자 전용 화면입니다</h1>' +
            '<p class="sub">이 계정에는 관리자 권한이 없습니다. 권한이 필요하면 운영자에게 문의해 주세요.</p>' +
            '<a class="btn pri" href="index.html">홈으로</a></div>'
          : '<div class="card"><h1 class="t">로그인이 필요합니다</h1>' +
            '<p class="sub">관리자 전용 화면입니다. 로그인 후 다시 시도해 주세요.</p>' +
            '<a class="btn pri" href="login.html">로그인</a></div>';
      }
      return null;
    });
  }

  /* 구글 버튼 — 연동 전에는 "준비 중"으로만 표시하고 아무 동작도 하지 않는다 */
  function wireGoogleButton(btnId, msgId, redirectPath) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    if (!CFG.GOOGLE_ENABLED) {
      btn.disabled = true;
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">' +
        '<path fill="#4285F4" d="M45 24c0-1.6-.1-2.7-.4-3.9H24v7.1h12c-.2 1.9-1.5 4.7-4.3 6.6l6.6 5.1C42.2 35.3 45 30.1 45 24z"/>' +
        '<path fill="#34A853" d="M24 46c5.8 0 10.7-1.9 14.3-5.2l-6.6-5.1c-1.8 1.2-4.2 2.1-7.7 2.1-5.9 0-10.9-3.9-12.7-9.2l-6.9 5.3C7.9 41 15.4 46 24 46z"/>' +
        '<path fill="#FBBC05" d="M11.3 28.6c-.5-1.4-.7-2.9-.7-4.6s.3-3.2.7-4.6l-6.9-5.3C2.9 17 2 20.4 2 24s.9 7 2.4 9.9l6.9-5.3z"/>' +
        '<path fill="#EA4335" d="M24 10.2c3.3 0 5.6 1.4 6.9 2.6l5.8-5.7C33.1 4 28.8 2 24 2 15.4 2 7.9 7 4.4 14.1l6.9 5.3C13.1 14.1 18.1 10.2 24 10.2z"/></svg>' +
        '구글로 계속하기 <span class="soon">준비 중</span>';
      btn.title = "구글 연동은 아직 설정 전입니다.";
      return;
    }
    btn.addEventListener("click", function () {
      btn.disabled = true;
      signInWithGoogle(redirectPath).catch(function (e) {
        btn.disabled = false;
        showMsg(msgId, "err", "구글 로그인을 시작하지 못했습니다: " + (e.message || e));
      });
    });
  }

  function showMsg(id, kind, text) {
    var el = document.getElementById(id);
    if (!el) return;
    el.className = "msg show " + kind;
    el.textContent = text;
  }
  function hideMsg(id) {
    var el = document.getElementById(id);
    if (el) el.className = "msg";
  }

  global.DdomiAuth = {
    client: sb,
    validateUsername: validateUsername,
    validatePassword: validatePassword,
    usernameAvailable: usernameAvailable,
    getSession: getSession,
    getMe: getMe,
    signUpWithEmail: signUpWithEmail,
    signInWithEmail: signInWithEmail,
    signInWithUsername: signInWithUsername,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut,
    renderNavState: renderNavState,
    requireAdmin: requireAdmin,
    wireGoogleButton: wireGoogleButton,
    showMsg: showMsg,
    hideMsg: hideMsg
  };
})(window);

# -*- coding: utf-8 -*-
"""data/regions/*.json 의 음식점 84만 곳을 Supabase 의 ddomi_places 로 올린다.

왜 이 스크립트가 필요한가
  표시에 쓰는 자료는 지금도 시군구 파일로 잘 돌아간다. 다만 "전국에서 가게 이름으로
  찾기"는 보고 있지 않은 지역까지 뒤져야 해서, 브라우저가 123MB를 다 받지 않는 한
  불가능하다. 그래서 이름·업종·좌표만 추려 DB에 한 번 올려 두고, 검색만 서버에 맡긴다.

왜 사람이 직접 실행하는가
  쓰기 권한이 있는 service_role 키가 필요하다. 이 프로젝트 규칙대로 키는 사람이
  콘솔에서 발급해 .env 에 두고, 스크립트가 그 파일을 직접 읽는다 —
  키를 인자나 프롬프트로 넘기지 않으므로 명령 이력에도 남지 않는다.

쓰는 법
  1) https://supabase.com/dashboard/project/wwmpszugglbpypsdaxsa/settings/api-keys
     에서 service_role(secret) 키를 복사
  2) ddomi-live/.env 에 한 줄:  SUPABASE_SERVICE_KEY=<복사한 키>
     (.env 는 .gitignore 에 등록돼 있어 커밋되지 않는다)
  3) python -I tools/upload_places.py

  이미 들어있는데 다시 올려야 하면 --force 를 붙인다 (기존 행을 먼저 비운다).
"""
import io, json, glob, os, sys, time, urllib.request, urllib.error

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGIONS = os.path.join(HERE, 'data', 'regions')
TABLE = 'ddomi_places'
BATCH = 5000
FORCE = '--force' in sys.argv


def env():
    """.env 를 읽는다. 값은 이 함수 밖으로 나가지 않고 헤더에만 쓰인다."""
    path = os.path.join(HERE, '.env')
    if not os.path.exists(path):
        sys.exit('.env 가 없습니다. ' + path + ' 에 SUPABASE_SERVICE_KEY=... 한 줄을 넣어 주세요.')
    out = {}
    # utf-8-sig: 메모장이나 PowerShell이 저장하면 파일 맨 앞에 보이지 않는 표식(BOM)이
    # 붙는 일이 있다. 그대로 읽으면 첫 줄 이름이 어긋나 키를 못 찾는다.
    for line in io.open(path, encoding='utf-8-sig'):
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        out[k.strip()] = v.strip().strip('"').strip("'")
    key = out.get('SUPABASE_SERVICE_KEY')
    if not key:
        sys.exit('.env 에 SUPABASE_SERVICE_KEY 가 없습니다.')
    url = out.get('SUPABASE_URL') or 'https://wwmpszugglbpypsdaxsa.supabase.co'
    return url.rstrip('/'), key


def call(url, key, method, path, body=None, extra=None):
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(url + '/rest/v1/' + path, data=data, method=method)
    req.add_header('apikey', key)
    req.add_header('Authorization', 'Bearer ' + key)
    req.add_header('Content-Type', 'application/json')
    for k, v in (extra or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.status, r.headers, r.read()
    except urllib.error.HTTPError as e:
        sys.exit('\n요청 실패 %s %s\n%s' % (e.code, path, e.read().decode('utf-8', 'replace')[:800]))


def count(url, key):
    st, hd, _ = call(url, key, 'GET', TABLE + '?select=id&limit=1',
                     extra={'Prefer': 'count=exact', 'Range': '0-0'})
    rng = hd.get('Content-Range') or '/0'
    return int(rng.split('/')[-1] or 0)


def rows():
    """시군구 파일을 하나씩 열어 올릴 행으로 바꾼다. 123MB를 한꺼번에 메모리에 올리지 않는다."""
    for path in sorted(glob.glob(os.path.join(REGIONS, '*.json'))):
        base = os.path.basename(path)
        if not base[:5].isdigit():
            continue                      # index.json, dots.json, areas.json
        doc = json.load(io.open(path, encoding='utf-8'))
        code = doc['meta']['code']
        for r in doc['items']:
            yield {'id': r['id'], 'nm': r['nm'], 'ct': r['ct'],
                   'dn': r.get('dn'), 'ad': r.get('ad'),
                   'rg': code, 'y': r['y'], 'x': r['x']}


def main():
    url, key = env()
    have = count(url, key)
    if have and not FORCE:
        sys.exit('이미 %s 행이 들어 있습니다. 다시 올리려면 --force 를 붙이세요.' % format(have, ','))
    if have and FORCE:
        print('기존 %s 행을 비웁니다...' % format(have, ','))
        call(url, key, 'DELETE', TABLE + '?id=not.is.null', extra={'Prefer': 'return=minimal'})

    sent, buf, t0 = 0, [], time.time()
    for row in rows():
        buf.append(row)
        if len(buf) >= BATCH:
            call(url, key, 'POST', TABLE, buf, {'Prefer': 'return=minimal'})
            sent += len(buf); buf = []
            el = time.time() - t0
            sys.stdout.write('\r올린 행 %s · %.0f초 · 초당 %s행   ' %
                             (format(sent, ','), el, format(int(sent / max(el, 1)), ',')))
            sys.stdout.flush()
    if buf:
        call(url, key, 'POST', TABLE, buf, {'Prefer': 'return=minimal'})
        sent += len(buf)

    print('\n끝. 올린 행 %s · %.0f초' % (format(sent, ','), time.time() - t0))
    print('DB 확인 행수: %s' % format(count(url, key), ','))


if __name__ == '__main__':
    main()

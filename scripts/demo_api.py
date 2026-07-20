"""Deterministic, provider-isolated API used only for the public walkthrough.

This process never imports connector code, reads provider credentials, or sends network
requests. It exists so the browser demo can exercise the real web application safely.
"""

from copy import deepcopy
from datetime import datetime, timezone
from threading import Lock
from time import monotonic

import uvicorn
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware


TOKEN = 'smcc-demo-session'
NOW = '2026-07-20T10:00:00Z'
lock = Lock()

ACCOUNTS = [
    {
        'id': 1,
        'platform': 'linkedin',
        'display_name': 'Northstar Studio',
        'external_account_id': 'demo-linkedin-01',
        'expires_at': None,
        'scopes': 'openid profile w_member_social',
        'meta_json': {'source': 'synthetic_demo'},
        'capabilities': {'supports_image': False, 'supports_link': True},
        'updated_at': NOW,
    },
    {
        'id': 2,
        'platform': 'x',
        'display_name': 'Northstar Updates',
        'external_account_id': 'demo-x-01',
        'expires_at': None,
        'scopes': 'tweet.write users.read',
        'meta_json': {'source': 'synthetic_demo'},
        'capabilities': {'supports_image': False, 'supports_link': True},
        'updated_at': NOW,
    },
    {
        'id': 3,
        'platform': 'facebook',
        'display_name': 'Northstar Community',
        'external_account_id': 'demo-facebook-page-01',
        'expires_at': None,
        'scopes': 'pages_manage_posts pages_read_engagement',
        'meta_json': {'source': 'synthetic_demo'},
        'capabilities': {'supports_image': False, 'supports_link': True},
        'updated_at': NOW,
    },
]

BASE_POSTS = [
    {
        'id': 102,
        'text': 'A practical look at our July product update.',
        'link_url': 'https://example.com/july-update',
        'media_url': None,
        'created_at': '2026-07-18T09:30:00Z',
        'targets': [
            {'id': 1021, 'oauth_account_id': 1, 'platform': 'linkedin', 'status': 'success', 'error_code': None, 'error_message': None, 'external_post_id': 'demo_linkedin_102', 'attempts': 1, 'updated_at': NOW},
            {'id': 1022, 'oauth_account_id': 2, 'platform': 'x', 'status': 'success', 'error_code': None, 'error_message': None, 'external_post_id': 'demo_x_102', 'attempts': 1, 'updated_at': NOW},
        ],
    },
    {
        'id': 101,
        'text': 'Behind the scenes: how our team handles provider retries.',
        'link_url': None,
        'media_url': None,
        'created_at': '2026-07-16T14:15:00Z',
        'targets': [
            {'id': 1011, 'oauth_account_id': 3, 'platform': 'facebook', 'status': 'success', 'error_code': None, 'error_message': None, 'external_post_id': 'demo_facebook_101', 'attempts': 2, 'updated_at': NOW},
        ],
    },
]

state = {'posts': deepcopy(BASE_POSTS), 'created_at_monotonic': None}


def reset_state() -> None:
    state['posts'] = deepcopy(BASE_POSTS)
    state['created_at_monotonic'] = None


def require_demo_auth(authorization: str | None) -> None:
    if authorization != f'Bearer {TOKEN}':
        raise HTTPException(status_code=401, detail='Demo session required')


app = FastAPI(title='SMCC Safe Demo API', version='1.0.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://127.0.0.1:3100', 'http://localhost:3100'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health')
def health():
    return {'status': 'ok', 'mode': 'synthetic-demo', 'providers_contacted': False}


@app.post('/api/v1/auth/login')
@app.post('/api/v1/auth/signup')
def authenticate():
    with lock:
        reset_state()
    return {'access_token': TOKEN, 'token_type': 'bearer'}


@app.get('/api/v1/auth/me')
def me(authorization: str | None = Header(default=None)):
    require_demo_auth(authorization)
    return {'id': 9001, 'email': 'recruiter@example.com', 'created_at': NOW}


@app.get('/api/v1/accounts')
def accounts(authorization: str | None = Header(default=None)):
    require_demo_auth(authorization)
    return ACCOUNTS


@app.delete('/api/v1/accounts/{account_id}', status_code=409)
def disconnect_demo_account(account_id: int, authorization: str | None = Header(default=None)):
    require_demo_auth(authorization)
    raise HTTPException(status_code=409, detail=f'Synthetic account {account_id} is locked for this walkthrough')


@app.get('/api/v1/oauth/{platform}/start', status_code=409)
def oauth_start(platform: str, authorization: str | None = Header(default=None)):
    require_demo_auth(authorization)
    raise HTTPException(status_code=409, detail=f'{platform} OAuth is disabled in the safe demo; no provider was contacted')


@app.get('/api/v1/dashboard')
def dashboard(authorization: str | None = Header(default=None)):
    require_demo_auth(authorization)
    with lock:
        recent = deepcopy(state['posts'][:10])
    return {
        'accounts': [
            {'id': account['id'], 'platform': account['platform'], 'display_name': account['display_name'], 'token_health': 'ok'}
            for account in ACCOUNTS
        ],
        'recent_posts': recent,
    }


@app.post('/api/v1/posts')
async def create_post(request: Request, authorization: str | None = Header(default=None)):
    require_demo_auth(authorization)
    payload = await request.json()
    target_ids = [account['id'] for account in ACCOUNTS] if payload.get('post_to_all') else payload.get('target_account_ids', [])
    targets = [account for account in ACCOUNTS if account['id'] in target_ids]
    if not targets:
        raise HTTPException(status_code=400, detail='No connected target accounts found')
    post = {
        'id': 103,
        'text': payload.get('text', '').strip(),
        'link_url': payload.get('link_url'),
        'media_url': payload.get('media_url'),
        'created_at': datetime.now(timezone.utc).isoformat(),
        'targets': [
            {
                'id': 1030 + account['id'],
                'oauth_account_id': account['id'],
                'platform': account['platform'],
                'status': 'queued',
                'error_code': None,
                'error_message': None,
                'external_post_id': None,
                'attempts': 0,
                'updated_at': NOW,
            }
            for account in targets
        ],
    }
    with lock:
        state['posts'] = [post] + [item for item in state['posts'] if item['id'] != 103]
        state['created_at_monotonic'] = monotonic()
    return post


@app.get('/api/v1/posts')
def list_posts(authorization: str | None = Header(default=None)):
    require_demo_auth(authorization)
    with lock:
        for post in state['posts']:
            if post['id'] != 103:
                continue
            elapsed = monotonic() - (state['created_at_monotonic'] or monotonic())
            for target in post['targets']:
                if elapsed < 2.5:
                    target['status'] = 'publishing'
                    target['attempts'] = 1
                else:
                    target['status'] = 'success'
                    target['external_post_id'] = f"demo_{target['platform']}_103"
            break
        return deepcopy(state['posts'])


@app.get('/api/v1/posts/{post_id}')
def get_post(post_id: int, authorization: str | None = Header(default=None)):
    require_demo_auth(authorization)
    with lock:
        post = next((item for item in state['posts'] if item['id'] == post_id), None)
        if not post:
            raise HTTPException(status_code=404, detail='Post not found')
        return deepcopy(post)


@app.get('/api/v1/analytics/daily-posts')
def daily_posts(authorization: str | None = Header(default=None)):
    require_demo_auth(authorization)
    return [
        {'day': '2026-07-14', 'count': 2},
        {'day': '2026-07-15', 'count': 3},
        {'day': '2026-07-16', 'count': 2},
        {'day': '2026-07-17', 'count': 4},
        {'day': '2026-07-18', 'count': 3},
        {'day': '2026-07-19', 'count': 5},
        {'day': '2026-07-20', 'count': 3},
    ]


@app.get('/api/v1/analytics/follower-deltas')
def follower_deltas(authorization: str | None = Header(default=None)):
    require_demo_auth(authorization)
    points = [
        {'snapshot_at': '2026-07-16', 'delta': 0},
        {'snapshot_at': '2026-07-17', 'delta': 6},
        {'snapshot_at': '2026-07-18', 'delta': -2},
        {'snapshot_at': '2026-07-19', 'delta': 8},
        {'snapshot_at': '2026-07-20', 'delta': 4},
    ]
    return [
        {'oauth_account_id': account['id'], 'platform': account['platform'], 'display_name': account['display_name'], 'points': points}
        for account in ACCOUNTS
    ]


@app.get('/api/v1/analytics/unfollowers-availability')
def unfollower_availability(authorization: str | None = Header(default=None)):
    require_demo_auth(authorization)
    return [
        {'oauth_account_id': account['id'], 'platform': account['platform'], 'available': False, 'note': 'Not available on this platform/API'}
        for account in ACCOUNTS
    ]


@app.post('/api/v1/analytics/snapshot')
def snapshot(authorization: str | None = Header(default=None)):
    require_demo_auth(authorization)
    return {'status': 'ok', 'mode': 'synthetic-demo', 'providers_contacted': False}


if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8011, log_level='warning')

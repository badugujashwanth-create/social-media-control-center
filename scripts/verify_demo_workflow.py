"""Fail-fast verification for the isolated walkthrough API."""

import time

import httpx


BASE = 'http://127.0.0.1:8011'


def main():
    last_error = None
    for _attempt in range(30):
        try:
            response = httpx.get(f'{BASE}/health', timeout=2)
            if response.status_code == 200:
                break
        except httpx.HTTPError as exc:
            last_error = exc
        time.sleep(1)
    else:
        raise RuntimeError('Safe demo API did not become healthy') from last_error

    with httpx.Client(base_url=BASE, timeout=5) as client:
        health = client.get('/health')
        health.raise_for_status()
        assert health.json()['providers_contacted'] is False

        login = client.post('/api/v1/auth/login', json={'email': 'recruiter@example.com', 'password': 'demo-pass-2026'})
        login.raise_for_status()
        headers = {'Authorization': f"Bearer {login.json()['access_token']}"}

        accounts = client.get('/api/v1/accounts', headers=headers)
        accounts.raise_for_status()
        assert len(accounts.json()) == 3

        created = client.post(
            '/api/v1/posts',
            headers=headers,
            json={
                'text': 'Northstar release: deterministic verifier.',
                'link_url': 'https://example.com/northstar-release',
                'post_to_all': True,
                'target_account_ids': [],
            },
        )
        created.raise_for_status()
        assert {target['status'] for target in created.json()['targets']} == {'queued'}
        time.sleep(2.7)
        posts = client.get('/api/v1/posts', headers=headers)
        posts.raise_for_status()
        assert {target['status'] for target in posts.json()[0]['targets']} == {'success'}

        analytics = client.get('/api/v1/analytics/follower-deltas', headers=headers)
        analytics.raise_for_status()
        assert len(analytics.json()) == 3

        oauth = client.get('/api/v1/oauth/linkedin/start', headers=headers)
        assert oauth.status_code == 409
        assert 'no provider was contacted' in oauth.json()['detail']

    print('verified: synthetic login -> accounts -> queued publish -> provider results -> analytics; external OAuth blocked')


if __name__ == '__main__':
    main()

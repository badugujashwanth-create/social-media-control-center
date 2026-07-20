import importlib.util
from pathlib import Path

from fastapi.testclient import TestClient


DEMO_API_PATH = Path(__file__).parents[3] / 'scripts' / 'demo_api.py'
spec = importlib.util.spec_from_file_location('smcc_demo_api', DEMO_API_PATH)
assert spec and spec.loader
demo_api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(demo_api)


def client_and_headers():
    client = TestClient(demo_api.app)
    login = client.post('/api/v1/auth/login', json={'email': 'recruiter@example.com', 'password': 'demo-pass-2026'})
    assert login.status_code == 200
    return client, {'Authorization': f"Bearer {login.json()['access_token']}"}


def test_demo_health_declares_provider_isolation():
    response = TestClient(demo_api.app).get('/health')
    assert response.json() == {'status': 'ok', 'mode': 'synthetic-demo', 'providers_contacted': False}


def test_demo_full_publish_progression_is_deterministic():
    client, headers = client_and_headers()
    accounts = client.get('/api/v1/accounts', headers=headers).json()
    created = client.post(
        '/api/v1/posts',
        headers=headers,
        json={'text': 'Demo launch update', 'post_to_all': True, 'target_account_ids': []},
    )
    assert created.status_code == 200
    assert len(created.json()['targets']) == len(accounts) == 3
    first_poll = client.get('/api/v1/posts', headers=headers).json()[0]
    assert {target['status'] for target in first_poll['targets']} == {'publishing'}
    with demo_api.lock:
        demo_api.state['created_at_monotonic'] = demo_api.monotonic() - 3
    second_poll = client.get('/api/v1/posts', headers=headers).json()[0]
    assert {target['status'] for target in second_poll['targets']} == {'success'}
    assert all(target['external_post_id'].startswith('demo_') for target in second_poll['targets'])


def test_demo_oauth_is_explicitly_blocked():
    client, headers = client_and_headers()
    response = client.get('/api/v1/oauth/linkedin/start', headers=headers)
    assert response.status_code == 409
    assert 'no provider was contacted' in response.json()['detail']


def test_demo_requires_its_bounded_session():
    response = TestClient(demo_api.app).get('/api/v1/accounts')
    assert response.status_code == 401

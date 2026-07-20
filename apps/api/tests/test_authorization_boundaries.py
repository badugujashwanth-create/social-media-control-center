from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.db import Base, get_db
from app.main import app
from app.routes import posts as posts_routes


class DummyQueue:
    def enqueue(self, *_args, **_kwargs):
        return {'queued': True}


def test_users_cannot_publish_to_disconnect_or_read_another_users_resources(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path / 'authorization.db'}")
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(engine)

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    monkeypatch.setattr(posts_routes, 'publish_queue', DummyQueue())
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    try:
        first = client.post('/api/v1/auth/signup', json={'email': 'first@example.com', 'password': 'pass1234'}).json()['access_token']
        second = client.post('/api/v1/auth/signup', json={'email': 'second@example.com', 'password': 'pass1234'}).json()['access_token']
        first_headers = {'Authorization': f'Bearer {first}'}
        second_headers = {'Authorization': f'Bearer {second}'}

        account = client.post(
            '/api/v1/accounts/dev',
            headers=second_headers,
            json={'platform': 'x', 'display_name': 'Second user account', 'external_account_id': 'second-x', 'access_token': 'synthetic-token'},
        ).json()

        forbidden_target = client.post(
            '/api/v1/posts',
            headers=first_headers,
            json={'text': 'must not publish', 'post_to_all': False, 'target_account_ids': [account['id']]},
        )
        assert forbidden_target.status_code == 400

        owned_post = client.post(
            '/api/v1/posts',
            headers=second_headers,
            json={'text': 'owned by second user', 'post_to_all': False, 'target_account_ids': [account['id']]},
        )
        assert owned_post.status_code == 200
        post_id = owned_post.json()['id']

        assert client.get(f'/api/v1/posts/{post_id}', headers=first_headers).status_code == 404
        assert client.delete(f"/api/v1/accounts/{account['id']}", headers=first_headers).status_code == 404
        assert client.get(f'/api/v1/posts/{post_id}', headers=second_headers).status_code == 200
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(engine)
        engine.dispose()

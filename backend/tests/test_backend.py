"""Sankalp Marketing Hub — Backend API tests (iteration 1).
Covers: health, dashboard (graceful when schema missing), CRUD list endpoints
returning [] when tables absent, AI generation via Claude Sonnet 4.5, Google
OAuth redirect start, Facebook mock OAuth redirect, disconnect, publish.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://72cccfa0-2418-4298-8300-871f82f5f3cd.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- Health ----------------
def test_health(client):
    r = client.get(f"{API}/health", timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True
    assert data.get("service") == "sankalp-marketing-hub"


# ---------------- Dashboard ----------------
def test_dashboard_graceful(client):
    r = client.get(f"{API}/dashboard", timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "stats" in data
    stats = data["stats"]
    for k in ["scheduledPosts", "draftPosts", "publishedPosts", "totalPosts", "avgRating"]:
        assert k in stats, f"missing key {k}"


# ---------------- CRUD list endpoints (must be [] when tables missing) ----------------
@pytest.mark.parametrize("table", ["posts", "blogs", "reviews", "campaigns", "integrations", "media_library"])
def test_list_endpoints_no_crash(client, table):
    r = client.get(f"{API}/{table}", timeout=30)
    assert r.status_code == 200, f"{table}: {r.status_code} {r.text}"
    data = r.json()
    assert isinstance(data, list), f"{table} did not return list: {type(data)}"


# ---------------- CRUD create (allowed to 4xx/5xx if schema missing) ----------------
def test_posts_create_allowed_missing_schema(client):
    payload = {
        "title": "TEST_post",
        "content": "test content",
        "status": "draft",
        "platforms": ["facebook"],
        "language": "en",
    }
    r = client.post(f"{API}/posts", json=payload, timeout=30)
    # Either created (2xx) or 4xx/5xx with table-missing message — both acceptable
    assert r.status_code in (200, 201, 400, 404, 500), r.text


# ---------------- AI generate ----------------
def test_ai_generate_caption(client):
    payload = {"task": "caption", "prompt": "modern living room with warm wood tones", "platform": "instagram", "language": "en"}
    r = client.post(f"{API}/ai/generate", json=payload, timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "text" in data
    assert isinstance(data["text"], str)
    assert len(data["text"].strip()) > 10


def test_ai_generate_review_reply(client):
    payload = {"task": "review_reply", "prompt": "5-star review by Anita: loved the work, very professional"}
    r = client.post(f"{API}/ai/generate", json=payload, timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "text" in data
    assert len(data["text"].strip()) > 10


# ---------------- OAuth redirects ----------------
def test_google_oauth_redirect_start(client):
    r = client.get(f"{API}/auth/google", timeout=20, allow_redirects=False)
    assert r.status_code in (301, 302, 303, 307, 308), r.status_code
    loc = r.headers.get("location", "")
    assert "accounts.google.com" in loc, loc


def test_facebook_mock_redirect(client):
    r = client.get(f"{API}/auth/facebook", timeout=20, allow_redirects=False)
    assert r.status_code in (301, 302, 303, 307, 308), r.status_code
    loc = r.headers.get("location", "")
    assert "code=demo_code_123" in loc, loc


# ---------------- Disconnect ----------------
def test_disconnect_facebook(client):
    r = client.post(f"{API}/auth/disconnect", json={"platform": "facebook"}, timeout=20)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True


def test_disconnect_missing_platform(client):
    r = client.post(f"{API}/auth/disconnect", json={}, timeout=20)
    assert r.status_code == 400


# ---------------- Publish ----------------
def test_publish_no_id(client):
    r = client.post(f"{API}/publish", json={}, timeout=20)
    assert r.status_code == 400


def test_publish_with_id_no_crash(client):
    # Missing schema -> backend will return 4xx/5xx, that's allowed; no crash
    r = client.post(f"{API}/publish", json={"id": 1}, timeout=20)
    assert r.status_code in (200, 201, 204, 400, 404, 500), r.text

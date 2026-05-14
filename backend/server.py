"""Sankalp Marketing Hub — FastAPI backend
Acts as a thin API layer over Supabase (REST) + AI helpers via emergentintegrations.
All routes are exposed under /api/* to match Kubernetes ingress routing.
"""
from dotenv import load_dotenv
load_dotenv()

import os
import json
import asyncio
from typing import Any, Optional, List, Dict
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse, RedirectResponse
from pydantic import BaseModel

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

SUPABASE_REST = f"{SUPABASE_URL}/rest/v1"
SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
}

app = FastAPI(title="Sankalp Marketing Hub API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------
async def sb_request(method: str, path: str, *, params: dict = None, json_body: Any = None, prefer: str = None):
    headers = dict(SUPABASE_HEADERS)
    if prefer:
        headers["Prefer"] = prefer
    url = f"{SUPABASE_REST}{path}"
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.request(method, url, headers=headers, params=params, json=json_body)
    if resp.status_code >= 400:
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text
        raise HTTPException(status_code=resp.status_code, detail=detail)
    if resp.status_code == 204 or not resp.content:
        return None
    try:
        return resp.json()
    except Exception:
        return resp.text


async def sb_select(table: str, params: dict = None) -> List[dict]:
    try:
        res = await sb_request("GET", f"/{table}", params=params or {})
        return res or []
    except HTTPException as e:
        # Table missing — return empty so UI stays graceful until schema is run
        detail = e.detail
        msg = (detail.get("message") if isinstance(detail, dict) else str(detail)) or ""
        if "schema cache" in msg or "does not exist" in msg or "PGRST205" in msg:
            return []
        raise


async def sb_insert(table: str, data: dict) -> dict:
    res = await sb_request("POST", f"/{table}", json_body=data, prefer="return=representation")
    return res[0] if isinstance(res, list) and res else res


async def sb_update(table: str, filt: dict, data: dict) -> dict:
    res = await sb_request("PATCH", f"/{table}", params=filt, json_body=data, prefer="return=representation")
    return res[0] if isinstance(res, list) and res else res


async def sb_delete(table: str, filt: dict) -> None:
    await sb_request("DELETE", f"/{table}", params=filt, prefer="return=minimal")


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    return {"ok": True, "service": "sankalp-marketing-hub", "ts": datetime.now(timezone.utc).isoformat()}


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
@app.get("/api/dashboard")
async def dashboard():
    try:
        posts = await sb_select("posts", {"select": "id,status,scheduled_at,created_at,platforms,title,content,media_urls"})
        blogs = await sb_select("blogs", {"select": "id,status,title,created_at"})
        reviews = await sb_select("reviews", {"select": "id,sentiment,status,rating,created_at"})
        campaigns = await sb_select("campaigns", {"select": "id,status,name,created_at"})
    except HTTPException as e:
        # Tables may not exist yet
        return {
            "stats": {
                "scheduledPosts": 0, "draftPosts": 0, "publishedPosts": 0,
                "draftBlogs": 0, "publishedBlogs": 0,
                "pendingReviews": 0, "positiveReviews": 0, "negativeReviews": 0,
                "activeCampaigns": 0, "totalPosts": 0, "totalBlogs": 0,
                "avgRating": 0,
            },
            "recentPosts": [], "upcomingPosts": [], "recentReviews": [],
            "needs_schema": True,
            "schema_error": str(e.detail) if isinstance(e.detail, str) else "Run the schema SQL in Supabase.",
        }

    def by_status(items, key="status"):
        c = {}
        for it in items:
            v = it.get(key) or "unknown"
            c[v] = c.get(v, 0) + 1
        return c

    p_counts = by_status(posts)
    b_counts = by_status(blogs)
    r_counts = by_status(reviews)
    s_counts = by_status(reviews, "sentiment")
    c_counts = by_status(campaigns)

    ratings = [r.get("rating") for r in reviews if r.get("rating")]
    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0

    now_iso = datetime.now(timezone.utc).isoformat()
    upcoming = [p for p in posts if p.get("status") == "scheduled" and (p.get("scheduled_at") or "") >= now_iso]
    upcoming.sort(key=lambda p: p.get("scheduled_at") or "")
    recent_posts = sorted(posts, key=lambda p: p.get("created_at") or "", reverse=True)[:5]
    recent_reviews = sorted(reviews, key=lambda r: r.get("created_at") or "", reverse=True)[:5]

    return {
        "stats": {
            "scheduledPosts": p_counts.get("scheduled", 0),
            "draftPosts": p_counts.get("draft", 0),
            "publishedPosts": p_counts.get("published", 0),
            "draftBlogs": b_counts.get("draft", 0),
            "publishedBlogs": b_counts.get("published", 0),
            "pendingReviews": r_counts.get("pending", 0),
            "positiveReviews": s_counts.get("positive", 0),
            "negativeReviews": s_counts.get("negative", 0),
            "neutralReviews": s_counts.get("neutral", 0),
            "activeCampaigns": c_counts.get("active", 0),
            "totalPosts": len(posts),
            "totalBlogs": len(blogs),
            "totalReviews": len(reviews),
            "avgRating": avg_rating,
        },
        "recentPosts": recent_posts,
        "upcomingPosts": upcoming[:6],
        "recentReviews": recent_reviews,
    }


# ---------------------------------------------------------------------------
# Generic CRUD factory
# ---------------------------------------------------------------------------
def make_crud(table: str, default_order: str = "created_at.desc", filter_fields: List[str] = None):
    filter_fields = filter_fields or []

    @app.get(f"/api/{table}")
    async def list_items(request: Request):
        params = {"select": "*", "order": default_order}
        for f in filter_fields:
            v = request.query_params.get(f)
            if v:
                params[f] = f"eq.{v}"
        return await sb_select(table, params)

    @app.post(f"/api/{table}")
    async def create_item(payload: Dict[str, Any]):
        if "created_at" not in payload:
            payload["created_at"] = datetime.now(timezone.utc).isoformat()
        return await sb_insert(table, payload)

    @app.put(f"/api/{table}")
    async def update_item(payload: Dict[str, Any]):
        item_id = payload.pop("id", None)
        if item_id is None:
            raise HTTPException(400, "id required")
        return await sb_update(table, {"id": f"eq.{item_id}"}, payload)

    @app.delete(f"/api/{table}")
    async def delete_item(payload: Dict[str, Any]):
        item_id = payload.get("id")
        if item_id is None:
            raise HTTPException(400, "id required")
        await sb_delete(table, {"id": f"eq.{item_id}"})
        return {"ok": True}

    return list_items, create_item, update_item, delete_item


make_crud("posts", "scheduled_at.asc.nullslast", ["status"])
make_crud("blogs", "created_at.desc", ["status"])
make_crud("reviews", "created_at.desc", ["sentiment", "status"])
make_crud("campaigns", "created_at.desc", ["status"])
make_crud("integrations", "platform.asc", ["platform"])
make_crud("media_library", "created_at.desc", ["folder"])


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------
@app.get("/api/analytics")
async def analytics_get(days: int = 30, metric_type: Optional[str] = None):
    params = {"select": "*", "order": "date.asc"}
    if metric_type:
        params["metric_type"] = f"eq.{metric_type}"
    try:
        return await sb_select("analytics", params)
    except HTTPException:
        return []


@app.post("/api/analytics")
async def analytics_post(payload: Dict[str, Any]):
    payload.setdefault("created_at", datetime.now(timezone.utc).isoformat())
    return await sb_insert("analytics", payload)


# ---------------------------------------------------------------------------
# Auth — Google OAuth (popup flow)
# ---------------------------------------------------------------------------
@app.get("/api/auth/google")
async def google_oauth(request: Request, code: Optional[str] = None, platform: str = "google"):
    host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    proto = request.headers.get("x-forwarded-proto", "https")
    redirect_uri = f"{proto}://{host}/api/auth/google"

    if not code:
        # Start flow
        scope_youtube = "openid email profile https://www.googleapis.com/auth/youtube.readonly"
        scope_business = "openid email profile https://www.googleapis.com/auth/business.manage"
        scope = scope_youtube if platform == "youtube" else scope_business
        url = (
            "https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}"
            f"&response_type=code&access_type=offline&prompt=consent"
            f"&state={platform}&scope={scope.replace(' ', '%20')}"
        )
        return RedirectResponse(url)

    # Exchange code -> token
    async with httpx.AsyncClient(timeout=20.0) as client:
        token_resp = await client.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        })
        tokens = token_resp.json()
        if "access_token" not in tokens:
            return JSONResponse(tokens, status_code=400)
        prof_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        profile = prof_resp.json()

    state_platform = request.query_params.get("state", "google")
    # Upsert into integrations
    try:
        existing = await sb_select("integrations", {"select": "id", "platform": f"eq.{state_platform}"})
        payload = {
            "is_connected": True,
            "access_token": tokens.get("access_token"),
            "refresh_token": tokens.get("refresh_token"),
            "account_id": profile.get("id"),
            "account_name": profile.get("name") or profile.get("email"),
            "metadata": {"email": profile.get("email"), "picture": profile.get("picture")},
        }
        if existing:
            await sb_update("integrations", {"id": f"eq.{existing[0]['id']}"}, payload)
        else:
            payload["platform"] = state_platform
            payload["created_at"] = datetime.now(timezone.utc).isoformat()
            await sb_insert("integrations", payload)
    except Exception as e:
        print("Integration upsert failed:", e)

    html = f"""
    <!doctype html><html><body style="font-family:system-ui;background:#0A0F1A;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
      <div style="text-align:center">
        <div style="width:64px;height:64px;border-radius:50%;background:#F47B20;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px">✓</div>
        <h2 style="margin:0 0 8px">Connected!</h2>
        <p style="opacity:.6;margin:0">{state_platform.title()} linked successfully</p>
      </div>
      <script>
        if (window.opener) {{
          window.opener.postMessage({{type:'oauth-success',platform:{json.dumps(state_platform)},account:{json.dumps(profile.get('name') or profile.get('email'))}}}, '*');
        }}
        setTimeout(()=>window.close(), 1200);
      </script>
    </body></html>
    """
    return HTMLResponse(html)


@app.get("/api/auth/facebook")
async def facebook_mock_oauth(request: Request, code: Optional[str] = None):
    """Mock Facebook + Instagram OAuth for demo until business verification is done."""
    host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    proto = request.headers.get("x-forwarded-proto", "https")
    if not code:
        return RedirectResponse(f"{proto}://{host}/api/auth/facebook?code=demo_code_123")

    mock = {
        "facebook": {"is_connected": True, "access_token": "EAAB_mock_token", "account_id": "fb_123456789", "account_name": "Sankalp Interior Solution"},
        "instagram": {"is_connected": True, "access_token": "EAAB_mock_token", "account_id": "ig_123456789", "account_name": "@sankalpinterior"},
    }
    for platform, payload in mock.items():
        try:
            existing = await sb_select("integrations", {"select": "id", "platform": f"eq.{platform}"})
            if existing:
                await sb_update("integrations", {"id": f"eq.{existing[0]['id']}"}, payload)
            else:
                payload = {**payload, "platform": platform, "created_at": datetime.now(timezone.utc).isoformat()}
                await sb_insert("integrations", payload)
        except Exception as e:
            print("Mock FB integration failed:", e)

    html = """
    <!doctype html><html><body style="font-family:system-ui;background:#0A0F1A;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
      <div style="text-align:center">
        <div style="width:64px;height:64px;border-radius:50%;background:#F47B20;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px">✓</div>
        <h2 style="margin:0 0 8px">Connected!</h2>
        <p style="opacity:.6;margin:0">Facebook &amp; Instagram linked</p>
      </div>
      <script>
        if (window.opener) {
          window.opener.postMessage({type:'oauth-success',platform:'facebook',account:'Sankalp Interior Solution'}, '*');
        }
        setTimeout(()=>window.close(), 1200);
      </script>
    </body></html>
    """
    return HTMLResponse(html)


@app.post("/api/auth/disconnect")
async def disconnect_platform(payload: Dict[str, Any]):
    platform = payload.get("platform")
    if not platform:
        raise HTTPException(400, "platform required")
    targets = [platform]
    if platform == "facebook":
        targets.append("instagram")
    for p in targets:
        try:
            await sb_update("integrations", {"platform": f"eq.{p}"}, {
                "is_connected": False, "access_token": None, "refresh_token": None,
                "account_id": None, "account_name": None,
            })
        except Exception:
            pass
    return {"ok": True, "platform": platform}


# ---------------------------------------------------------------------------
# Mock publishing endpoint (used by scheduler to "publish now")
# ---------------------------------------------------------------------------
@app.post("/api/publish")
async def publish_now(payload: Dict[str, Any]):
    post_id = payload.get("id")
    if not post_id:
        raise HTTPException(400, "id required")
    return await sb_update("posts", {"id": f"eq.{post_id}"}, {
        "status": "published",
        "published_at": datetime.now(timezone.utc).isoformat(),
    })


# ---------------------------------------------------------------------------
# AI Assistance (Claude Sonnet 4.5 via emergentintegrations)
# ---------------------------------------------------------------------------
class AIPayload(BaseModel):
    task: str  # caption | hashtags | ad_copy | seo_blog | review_reply | command
    prompt: str
    platform: Optional[str] = None
    tone: Optional[str] = "warm-premium"
    language: Optional[str] = "en"
    context: Optional[Dict[str, Any]] = None


TASK_SYSTEM_PROMPTS = {
    "caption": "You are a senior social-media copywriter for Sankalp Interior Solution, a premium interior-design firm. Write a short, scroll-stopping social caption that's elegant, warm, and architectural in feel. Avoid emojis unless explicitly requested. Match the platform's tone.",
    "hashtags": "Generate 10-15 high-relevance hashtags for Sankalp Interior Solution. Mix broad and niche. Return as a single space-separated line, each starting with #.",
    "ad_copy": "Write conversion-focused ad copy for an interior design firm. Provide: a hook (max 6 words), 2 sentences of body, and a strong CTA. Premium, no clichés.",
    "seo_blog": "Write a 600-800 word SEO blog for an interior-design firm. Include H2/H3 markdown headings, a short intro, 3-5 sections, and a closing CTA. Natural keyword usage. Return markdown only.",
    "review_reply": "Draft a thoughtful, warm reply to a customer review for Sankalp Interior Solution. 2-3 sentences. Acknowledge specifics, stay professional. No emojis.",
    "command": "You are Sankalp Marketing Hub's AI command assistant. Given the user's natural-language request, respond with a concise structured plan (markdown bullets) describing what content/campaign you'd create and the recommended platforms.",
}


@app.post("/api/ai/generate")
async def ai_generate(p: AIPayload):
    sys_prompt = TASK_SYSTEM_PROMPTS.get(p.task, TASK_SYSTEM_PROMPTS["command"])
    if p.platform:
        sys_prompt += f"\nTarget platform: {p.platform}."
    if p.language and p.language != "en":
        lang_map = {"bn": "Bengali (বাংলা)", "hi": "Hindi (हिन्दी)"}
        sys_prompt += f"\nWrite the response in {lang_map.get(p.language, p.language)}."

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception as e:
        raise HTTPException(500, f"emergentintegrations not available: {e}")

    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "EMERGENT_LLM_KEY missing")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"sankalp-{p.task}-{datetime.now().timestamp()}",
        system_message=sys_prompt,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    try:
        text = await chat.send_message(UserMessage(text=p.prompt))
    except Exception as e:
        raise HTTPException(502, f"LLM error: {e}")
    return {"text": text, "task": p.task, "platform": p.platform, "language": p.language}


# ---------------------------------------------------------------------------
# Media upload (proxy to Supabase storage if configured, else returns data URL)
# ---------------------------------------------------------------------------
@app.post("/api/upload")
async def upload_media(file: UploadFile = File(...), folder: str = Form("default")):
    import base64
    content = await file.read()
    b64 = base64.b64encode(content).decode()
    data_url = f"data:{file.content_type};base64,{b64}"
    record = {
        "filename": file.filename,
        "url": data_url,
        "folder": folder,
        "mime_type": file.content_type,
        "size_bytes": len(content),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        saved = await sb_insert("media_library", record)
        return saved
    except Exception:
        return record

# Deployment Plan

## Stack Summary

- **Frontend:** React SPA (Vite), PWA-enabled → static files
- **Backend:** Node.js/Express, TypeScript
- **Database:** MongoDB Atlas (already configured, free M0 tier)
- **AI:** Pluggable providers (Anthropic, OpenAI, Google, AWS Bedrock, Local/Ollama)
- **Current state:** No Docker, no CI/CD, no deployment config

---

## Recommended: Railway + Vercel (~$5/mo)

| Layer | Service | Cost |
| ------- | --------- | ------ |
| Frontend | Vercel (free tier) | $0/mo |
| Backend | Railway (hobby plan) | $5/mo |
| Database | MongoDB Atlas M0 | $0/mo |
| **Total** | | **~$5/mo** |

**Why this:** Fastest to deploy (hours, not days), near-zero ops overhead, auto-deploys on git push to `main`. No cold starts unlike Render free tier (which sleeps after 15 min idle).

### Steps to deploy

1. Push repo to GitHub
2. **Railway:** Create project → Deploy from GitHub → select `backend/` → add env vars in dashboard
3. **Vercel:** Import repo → set root directory to `frontend/` → add `VITE_API_BASE_URL` (your Railway URL) → deploy
4. **MongoDB Atlas:** Whitelist Railway outbound IPs (or use `0.0.0.0/0` to start)
5. **CORS:** Update backend `CLIENT_ORIGIN` env var to your Vercel production domain

### AI API keys on Render/Railway

Set them as environment variables in the platform dashboard — same names as your `.env` file. They get injected at runtime. Never commit `.env` to git.

---

## Alternative: Render Free Tier (~$0/mo)

- Backend sleeps after 15 min idle → ~50s cold start on first request
- Workable for personal use, rough for real users

---

## AWS + Terraform Option (~$8-30/mo)

### Architecture

```text
Users → CloudFront → S3 (frontend static files)
                  → App Runner or ECS Fargate (backend container)
                        → MongoDB Atlas
```

### Cost Breakdown

| Service | Cost |
| --------- | ------ |
| S3 + CloudFront | ~$1-2/mo |
| App Runner (recommended) | ~$5-10/mo |
| ECS Fargate 0.25vCPU/0.5GB | ~$10-12/mo |
| ALB (avoid — use App Runner instead) | ~$16/mo |
| ECR (container registry) | ~$0.50/mo |
| MongoDB Atlas M0 | $0 |
| **Total (App Runner path)** | **~$8-14/mo** |
| **Total (ECS + ALB path)** | **~$28-30/mo** |

> The ALB costs ~$16/mo just to exist. Use App Runner to avoid it.

### Terraform Scope (200-400 lines)

`vpc.tf`, `ecr.tf`, `apprunner.tf` or `ecs.tf`, `cloudfront.tf`, `s3.tf`, `iam.tf`, `secrets.tf`

### What needs to be built first

- Dockerfiles for backend (none exist yet)
- GitHub Actions pipeline: build image → push to ECR → deploy
- ~2-4 days of setup effort

### When to choose AWS

- Resume/portfolio value
- Expecting significant user growth
- Need compliance (SOC2, HIPAA, etc.)

---

## Comparison

| | Railway + Vercel | AWS + Terraform |
| -- | -- | -- |
| **Cost** | ~$5/mo | ~$8-30/mo |
| **Setup time** | 1-2 hours | 2-4 days |
| **Ops overhead** | Near zero | Moderate |
| **Scale ceiling** | Medium | Very high |
| **Compliance** | No | Yes |

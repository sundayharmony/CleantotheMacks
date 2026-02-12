#!/usr/bin/env bash
# Simple, non-interactive script you can copy/paste and run.
# Purpose: check DNS + HTTP + Vercel project deployments/domains for the
# project prj_uZzxdLYVXNn34aXKZz9FzuliPBVw and domain cleantothemacks.com.
#
# Safe default: only performs checks and prints recommended actions.
# To actually make changes (add domain / merge branch & push), set:
#   export VERCEL_TOKEN="..." && export APPLY=1
#
# Requirements: curl, jq, dig (bind-tools), git (if APPLY=1).
# Run from anywhere (doesn't modify repo unless APPLY=1).
set -euo pipefail

PROJECT_ID="prj_uZzxdLYVXNn34aXKZz9FzuliPBVw"
DOMAIN_ROOT="cleantothemacks.com"
WWW_DOMAIN="www.cleantothemacks.com"
PROD_BRANCH="main"
FIX_BRANCH="fix/ui-loading-issues"

VERCEL_TOKEN="${VERCEL_TOKEN:-}"
APPLY="${APPLY:-0}"   # set to 1 to actually apply changes

info(){ printf "\n[INFO] %s\n" "$1"; }
ok(){ printf "[OK] %s\n" "$1"; }
warn(){ printf "[WARN] %s\n" "$1"; }
err(){ printf "[ERR] %s\n" "$1"; }

# DNS checks
info "Checking DNS records..."
A_ROOT=$(dig +short A "${DOMAIN_ROOT}" 2>/dev/null || true)
CNAME_WWW=$(dig +short CNAME "${WWW_DOMAIN}" 2>/dev/null || true)
printf "  A %s -> %s\n" "${DOMAIN_ROOT}" "${A_ROOT:-<none>}"
printf "  CNAME %s -> %s\n" "${WWW_DOMAIN}" "${CNAME_WWW:-<none>}"

if echo "${A_ROOT}" | grep -q "76.76.21.21"; then
  ok "Root A -> 76.76.21.21 (Vercel)"
else
  warn "Root A does NOT point to Vercel (expected 76.76.21.21). Update at your DNS provider."
fi

if echo "${CNAME_WWW}" | grep -qi "vercel-dns.com"; then
  ok "www CNAME -> cname.vercel-dns.com (Vercel)"
else
  warn "www CNAME does NOT point to Vercel (expected cname.vercel-dns.com). Update at your DNS provider."
fi

# HTTP checks
info "Quick HTTP check (may time out if DNS/SSL not ready)..."
echo "  HEAD https://${DOMAIN_ROOT}"
curl -I -sS --max-time 10 "https://${DOMAIN_ROOT}" | sed -n '1,6p' || echo "  <no response>"
echo
echo "  HEAD https://${WWW_DOMAIN}"
curl -I -sS --max-time 10 "https://${WWW_DOMAIN}" | sed -n '1,6p' || echo "  <no response>"

# Vercel API helpers (if token provided)
ve_api(){
  if [ -z "$VERCEL_TOKEN" ]; then
    err "VERCEL_TOKEN not set — skipping Vercel API checks. Set VERCEL_TOKEN to enable."
    return 2
  fi
  method=$1; path=$2; shift 2
  curl -sS -H "Authorization: Bearer ${VERCEL_TOKEN}" -H "Content-Type: application/json" -X "${method}" "https://api.vercel.com${path}" "$@"
}

if [ -n "$VERCEL_TOKEN" ]; then
  info "Querying Vercel API for project domains + recent deployments..."
  echo "  Domains attached to project:"
  ve_api GET "/v1/projects/${PROJECT_ID}/domains" | jq -r '.domains[]? | "    - \(.name) (verified: \(.verified))"' || echo "    <none or API error>"

  echo
  echo "  Recent deployments (limit 5):"
  ve_api GET "/v6/deployments?projectId=${PROJECT_ID}&limit=5" | jq -r '.deployments[]? | "    - id:\(.uid) url:\(.url) readyState:\(.readyState) created:\(.created)"' || echo "    <none or API error>"

  # show link to latest deployment logs in Vercel UI (if any)
  latest=$(ve_api GET "/v6/deployments?projectId=${PROJECT_ID}&limit=1" | jq -r '.deployments[0].uid // empty')
  if [ -n "$latest" ]; then
    ok "Latest deployment uid: ${latest}"
    printf "  Vercel UI logs: https://vercel.com/dashboard/project/%s/deployments/%s\n" "${PROJECT_ID}" "${latest}"
  fi

  # check if domain is attached to project
  attached=$(ve_api GET "/v1/projects/${PROJECT_ID}/domains" | jq -r '.domains[]?.name' | grep -x "${DOMAIN_ROOT}" || true)
  if [ -n "$attached" ]; then
    ok "Domain ${DOMAIN_ROOT} is attached to this Vercel project."
  else
    warn "Domain ${DOMAIN_ROOT} is NOT attached to this Vercel project."
    if [ "${APPLY}" = "1" ]; then
      info "Attempting to add domain ${DOMAIN_ROOT} to project ${PROJECT_ID}..."
      ve_api POST "/v1/projects/${PROJECT_ID}/domains" -d "{\"name\":\"${DOMAIN_ROOT}\"}" | jq -C . || warn "Add domain API call failed."
      ok "Requested domain add. Check Vercel dashboard to verify ownership and DNS instructions."
    else
      echo "  To add domain automatically re-run with: export VERCEL_TOKEN=...; export APPLY=1; ./cursor-vercel-check.sh"
    fi
  fi
else
  warn "VERCEL_TOKEN not provided; skipping Vercel API checks. Provide VERCEL_TOKEN to enable."
fi

# Optionally merge fix branch into prod and push (non-interactive if APPLY=1)
if [ "${APPLY}" = "1" ]; then
  if ! command -v git >/dev/null 2>&1; then
    err "git not available; cannot perform merge/push"
  else
    info "Attempting non-interactive merge of ${FIX_BRANCH} -> ${PROD_BRANCH} and push to origin."
    git fetch origin "${FIX_BRANCH}" "${PROD_BRANCH}" || true
    # create a temporary local branch to avoid modifying user's current HEAD
    TMP_BRANCH="tmp-merge-$(date +%s)"
    git checkout -b "${TMP_BRANCH}" "origin/${PROD_BRANCH}" || { err "failed to checkout ${PROD_BRANCH}"; exit 1; }
    git merge --no-ff --no-edit "origin/${FIX_BRANCH}" || { err "Merge had conflicts; aborting. Please merge manually."; git merge --abort || true; git checkout -; git branch -D "${TMP_BRANCH}" || true; exit 1; }
    git push origin "${TMP_BRANCH}:${PROD_BRANCH}" || { err "Push failed (check permissions)."; git checkout -; git branch -D "${TMP_BRANCH}" || true; exit 1; }
    ok "Pushed merged ${FIX_BRANCH} into ${PROD_BRANCH} on origin (via temporary branch). Vercel should start a deployment."
    git checkout -; git branch -D "${TMP_BRANCH}" || true
  fi
else
  info "Not performing merge/push. To merge & push automatically set APPLY=1 and run again."
fi

info "Done. Next recommended steps:"
echo " - If DNS didn't point to Vercel, update your registrar: A @ -> 76.76.21.21 ; CNAME www -> cname.vercel-dns.com"
echo " - If using Cloudflare, set DNS records to 'DNS only' (gray cloud) so Vercel can issue certs."
echo " - If Vercel build failed previously, push fixes to the branch used for production and monitor Deployments in Vercel dashboard."

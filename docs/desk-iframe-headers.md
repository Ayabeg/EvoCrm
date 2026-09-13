# Desk iframe stay-on-host

EvoDesk is framed at `/inbox` on the CRM host. Operators must stay on `evocrmapp.com` / `crm.evotechly.com` — never eject to `desk.evotechly.com`.

Laravel cannot set headers on the desk vhost. Chatwoot’s default `X-Frame-Options: SAMEORIGIN` and a missing `frame-ancestors` list are why the inbox historically ejected or fell back to the native CRM desk.

## Laravel (this repo)

`App\Http\Middleware\EmbedSecurityHeaders` sets:

```
Content-Security-Policy: frame-ancestors 'self' https://evocrmapp.com https://www.evocrmapp.com https://crm.evotechly.com; frame-src 'self' https://desk.evotechly.com …
```

`X-Frame-Options` is not sent (and is removed if something else set `DENY` / `SAMEORIGIN`).

Optional extras: `EVOSALES_FRAME_ANCESTORS` and `EVOSALES_FRAME_SRC` (comma-separated origins) in `config/evosales.php` → `embed`.

## Contabo nginx (desk.evotechly.com)

Apply this on the **desk** server. Do not rewrite EvoDesk. If a previous snippet is commented out, uncomment and use this exact block:

```nginx
# desk.evotechly.com — allow CRM hosts to iframe EvoDesk at /inbox
add_header Content-Security-Policy "frame-ancestors https://evocrmapp.com https://www.evocrmapp.com https://crm.evotechly.com;" always;

# Chatwoot default X-Frame-Options: SAMEORIGIN ejects the embed. Clear it.
more_clear_headers X-Frame-Options;
```

If `headers-more-nginx-module` is unavailable, override instead of clearing:

```nginx
add_header X-Frame-Options "" always;
```

Reload nginx after the change. Confirm from the CRM host:

```bash
curl -sI https://desk.evotechly.com | grep -iE 'content-security-policy|x-frame-options'
```

`frame-ancestors` must list the CRM hosts. `X-Frame-Options` must not be `DENY` or `SAMEORIGIN`.

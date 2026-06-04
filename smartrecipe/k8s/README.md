# SmartRecipe na k3s

Manifesty Kustomize dla stosu: **PostgreSQL** + **backend** (NestJS) + **frontend** (nginx/Vite) + **Ingress** (Traefik, domyślnie w k3s).

## Wymagania

- k3s (lub Kubernetes) z działającym `kubectl`
- Obrazy w GHCR z workflowów `backend-docker.yml` / `frontend-docker.yml` (albo lokalny build + `ctr images import` na węźle k3s)
- Frontend zbudowany z poprawnym **`VITE_API_URL`** (adres API widoczny z przeglądarki użytkownika)

## Struktura

```
k8s/
├── kustomization.yaml      # baza (produkcja: NODE_ENV=production)
├── namespace.yaml
├── configmap.yaml
├── secret.example.yaml     # szablon - nie commituj prawdziwych haseł
├── postgres/
├── backend/
├── frontend/
├── ingress.yaml            # smartrecipe.local + api.smartrecipe.local
└── overlays/
    ├── bootstrap/          # pierwsze wdrożenie: synchronize schematu DB
    └── tls/                # opcjonalnie: Ingress + cert-manager
```

## 1. Obrazy kontenerów

W `kustomization.yaml` zamień placeholdery:

```yaml
newName: ghcr.io/TWOJ_ORG/pk-io-2026/smartrecipe-backend
newName: ghcr.io/TWOJ_ORG/pk-io-2026/smartrecipe-frontend
```

Tag `latest` po ostatnim pushu na `main`, albo konkretny `main-<sha>`.

**Frontend:** API URL musi być znane przy buildzie obrazu. Przykład dla domen z Ingress:

```bash
# w GitHub: Settings → Variables → VITE_API_URL = http://api.smartrecipe.local
# albo lokalnie:
docker build -f smartrecipe/frontend/Dockerfile \
  --build-arg VITE_API_URL=http://api.smartrecipe.local \
  -t ghcr.io/ORG/REPO/smartrecipe-frontend:latest \
  smartrecipe/frontend
```

Jeśli pakiety GHCR są **prywatne**, utwórz pull secret i dodaj do Deploymentów:

```bash
kubectl create secret docker-registry ghcr-cred \
  -n smartrecipe \
  --docker-server=ghcr.io \
  --docker-username=GITHUB_USER \
  --docker-password=GITHUB_TOKEN

kubectl patch deployment smartrecipe-backend -n smartrecipe \
  -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"ghcr-cred"}]}}}}'
# to samo dla smartrecipe-frontend
```

## 2. Sekrety

```bash
kubectl create namespace smartrecipe --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic smartrecipe-secrets -n smartrecipe \
  --from-literal=DB_PASS='silne-haslo-db' \
  --from-literal=JWT_SECRET='min-32-znaki-losowe-jwt-access' \
  --from-literal=JWT_REFRESH_SECRET='min-32-znaki-losowe-jwt-refresh' \
  --from-literal=NUTRITION_API_KEY='' \
  --from-literal=DEEPL_API_KEY='' \
  --from-literal=RECIPE_API_KEY=''
```

`DB_USER` / `DB_NAME` są w ConfigMap (`smartrecipe-config`) i muszą zgadzać się z Postgres.

## 3. Pierwsze wdrożenie (pusta baza)

Backend w `NODE_ENV=production` **nie** uruchamia `synchronize` TypeORM. Na pierwszy raz użyj overlay **bootstrap**:

```bash
cd smartrecipe/k8s
kubectl apply -k overlays/bootstrap
```

Poczekaj aż backend wstanie (schemat utworzy się automatycznie). Sprawdź:

```bash
kubectl get pods -n smartrecipe
kubectl logs -n smartrecipe deploy/smartrecipe-backend
```

Potem przełącz na tryb produkcyjny (bez synchronize):

```bash
kubectl apply -k .
```

## 4. Wdrożenie standardowe (po inicjalizacji DB)

```bash
cd smartrecipe/k8s
kubectl apply -k .
```

## 5. DNS / Ingress

Domyślne hosty w `ingress.yaml`:

| Host                    | Serwis        |
| ----------------------- | ------------- |
| `smartrecipe.local`     | frontend :80  |
| `api.smartrecipe.local` | backend :3000 |

Na maszynie z przeglądarką (IP węzła k3s):

```text
# /etc/hosts
<IP_K3S>  smartrecipe.local api.smartrecipe.local
```

Sprawdź Traefik / Ingress:

```bash
kubectl get ingress -n smartrecipe
curl -sI http://api.smartrecipe.local/recipes
```

Swagger: `http://api.smartrecipe.local/api`

## 6. TLS (opcjonalnie)

Overlay `overlays/tls` zakłada **cert-manager** i issuer `letsencrypt-prod`. Edytuj hosty w `overlays/tls/ingress-tls.yaml`, potem:

```bash
kubectl apply -k overlays/tls
```

Przebuduj frontend z `VITE_API_URL=https://api.smartrecipe.example.com`.

## 7. Przydatne komendy

```bash
kubectl get all -n smartrecipe
kubectl logs -n smartrecipe -f deploy/smartrecipe-backend
kubectl logs -n smartrecipe -f deploy/smartrecipe-frontend
kubectl port-forward -n smartrecipe svc/smartrecipe-backend 3000:3000
kubectl port-forward -n smartrecipe svc/smartrecipe-postgres 5432:5432
```

Usunięcie:

```bash
kubectl delete -k .   # z katalogu k8s
# PVC Postgres zostaje, dopóki nie usuniesz PVC ręcznie
```

## Diagram w klastrze

```text
Internet / LAN
    │
    ▼
[ Ingress Traefik ]
    ├─ smartrecipe.local  → Service smartrecipe-frontend:80  → nginx (SPA)
    └─ api.smartrecipe.local → Service smartrecipe-backend:3000 → NestJS
                                        │
                                        ▼
                              Service smartrecipe-postgres:5432
                              (StatefulSet + PVC 5Gi)
```

## Powiązane pliki w repo

- `smartrecipe/docker-compose.yml` - Postgres tylko do dev lokalnego
- `smartrecipe/backend/Dockerfile`, `smartrecipe/frontend/Dockerfile`
- `.github/workflows/backend-docker.yml`, `frontend-docker.yml`

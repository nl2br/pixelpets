# 📘 PixelPets — Learnings Log

Ce document récapitule les apprentissages faits autour de **Docker**, **Node.js**, **Vue 3**, et l’intégration d’une **IA locale** via Ollama dans le projet PixelPets.

---

## 1. Installation de Docker

- **Ajout du dépôt officiel Docker** :  
  Ajout des clés GPG + repo APT dans `/etc/apt/sources.list.d/docker.list`.

- **Installation** :
  ```bash
  sudo apt update
  sudo apt install docker-ce docker-ce-cli containerd.io
  ```

- **Vérification** :
  ```bash
  docker --version
  docker run --rm hello-world
  ```

- **Permissions utilisateur** (éviter `sudo`) :
  ```bash
  sudo usermod -aG docker $USER
  newgrp docker
  groups
  ```

---

## 2. Commandes Docker de base

- **Lister les conteneurs actifs** :
  ```bash
  docker ps
  ```
- **Lister tous les conteneurs (y compris stoppés)** :
  ```bash
  docker ps -a
  ```
- **Afficher les logs d’un conteneur** :
  ```bash
  docker logs <container>
  ```
- **Suivre les logs en direct** :
  ```bash
  docker logs -f <container>
  ```
- **Entrer dans un conteneur** :
  ```bash
  docker exec -it <container> sh
  ```

---

## 3. Docker Compose

### Lancer / arrêter
```bash
docker compose -f docker-compose.gw.dev.yml up -d
docker compose -f docker-compose.gw.dev.yml down
```

### Voir l’état
```bash
docker compose -f docker-compose.gw.dev.yml ps
```

### Logs live (tous services)
```bash
docker compose -f docker-compose.gw.dev.yml logs -f
```

### Logs d’un service particulier
```bash
docker compose -f docker-compose.gw.dev.yml logs -f gateway
```

---

## 4. Services créés

### 4.1 pets-service
- **Backend Node/Express** simple avec un CRUD en mémoire (`GET /pets`, `POST /pets`).
- Ajout ultérieur d’une persistance via MariaDB.
- Exemple création :
  ```bash
  curl -sS -X POST http://localhost:4001/pets     -H 'Content-Type: application/json'     -d '{"name":"Axel","species":"axolotl"}'
  ```

### 4.2 mariadb
- Service MariaDB avec volume persistant :
  ```yaml
  mariadb:
    image: mariadb:11
    env_file: .env
    volumes:
      - dbdata:/var/lib/mysql
  ```
- Vérification dans le conteneur :
  ```bash
  docker compose -f docker-compose.gw.dev.yml exec mariadb     sh -lc 'mariadb -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1" "$MYSQL_DATABASE"'
  ```

### 4.3 api-gateway
- Sert d’unique point d’entrée (`http://localhost:4000/api/...`).
- Utilise `http-proxy` pour router :
  - `/api/pets` → pets-service
  - `/api/ai/...` → ai-service
- **Erreur évitée** : ne pas utiliser `express.json()` sur les routes proxifiées (sinon corps consommé).
- Logs d’entrée ajoutés :
  ```
  [GW-IN][PETS] POST /api/pets
  [GW-IN][AI] POST /api/ai/talk
  ```

### 4.4 ollama + ai-service
- **Ollama** : runtime de modèles LLM locaux.
- **ai-service** : microservice Node qui interroge Ollama.
- Routes exposées :
  - `GET /ai/health`
  - `GET /ai/suggest-name?species=axolotl`
  - `POST /ai/talk` avec JSON `{ species, mood, name, message }`

Exemple :
```bash
curl -sS "http://localhost:4002/ai/suggest-name?species=renard"
curl -sS -X POST http://localhost:4002/ai/talk   -H 'Content-Type: application/json'   -d '{"species":"renard","mood":"joueur","name":"Mochi","message":"Tu veux jouer ?"}'
```

### 4.5 frontend
- App Vue 3 + Vite (port 5173).
- **Best practice** : utiliser Vite proxy (`/api` → `gateway:3000`).
- Exemple `vite.config.js` :
  ```js
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://gateway:3000',
        changeOrigin: true,
        proxyTimeout: 120000,
        timeout: 120000
      }
    }
  }
  ```
- Front permet de :
  - Créer un pet.
  - Lister les pets.
  - Demander un nom suggéré via IA.
  - Parler avec un pet via IA.

---

## 5. Pièges rencontrés & solutions

- **`docker ps` permission denied** → ajouter user au groupe `docker`.
- **MariaDB en attente longue** → laisser initialiser, ou reset avec `docker compose down -v`.
- **Proxy bug POST** → causé par `express.json()` dans le gateway → corrigé en mettant le body-parser après les routes proxy.
- **Timeout IA (socket hang up)** → fixé avec `proxyTimeout` augmenté (120s) et warm-up du modèle.
- **304 Not Modified** → comportement normal (cache navigateur).

---

## 6. Outils & bonus

- **Neovim** : installé pour éditer le projet directement dans les conteneurs/WSL.
- **curl** : outil pour tester les APIs.
- **jq** : affichage JSON lisible (`sudo apt install jq`).

---

## 7. Commandes pratiques résumées

- Rebuild d’un service :
  ```bash
  docker compose -f docker-compose.gw.dev.yml up -d --build pets
  ```

- Suivre logs gateway + pets en parallèle :
  ```bash
  docker compose -f docker-compose.gw.dev.yml logs -f gateway pets
  ```

- Tester API depuis l’hôte :
  ```bash
  curl -sS http://localhost:4000/api/pets
  ```

---

## 8. Debug avancé

- Voir config complète d’un compose :
  ```bash
  docker compose -f docker-compose.gw.dev.yml config
  ```

- Tester réseau interne depuis un service :
  ```bash
  docker compose -f docker-compose.gw.dev.yml exec gateway sh -lc "curl -s pets:3000/health"
  ```

- Vérifier ports exposés sur l’hôte :
  ```bash
  ss -ltnp | grep :4002
  ss -ltnp | grep :4000
  ```

- Réinitialiser (conteneurs + volumes + images) :
  ```bash
  docker compose -f docker-compose.gw.dev.yml down -v --rmi all
  ```

- Exécuter une commande shell dans un conteneur :
  ```bash
  docker compose -f docker-compose.gw.dev.yml exec pets sh
  ```

- Vérifier variables d’environnement dans un service :
  ```bash
  docker compose -f docker-compose.gw.dev.yml exec pets sh -lc "env | grep DB_"
  ```

---

# ✅ Ce que j’ai appris

1. Utiliser Docker et Docker Compose pour orchestrer plusieurs services.  
2. Gérer un workflow dev avec hot-reload Node et Vue dans des conteneurs.  
3. Construire un API Gateway avec `http-proxy`, comprendre le routage.  
4. Comprendre pourquoi **ne pas mettre de body-parser** devant un proxy.  
5. Connecter un backend Node à une base MariaDB.  
6. Intégrer une IA locale (Ollama + modèle léger) via un microservice dédié.  
7. Configurer Vite proxy pour un front Vue 3 → API unique.  
8. Lire et analyser les logs Docker en live pour débugger les flux réseau.  

---

👉 Étapes suivantes possibles :
- Étendre le CRUD pets-service avec `PUT` / `DELETE`.  
- Connecter pets-service à MariaDB (persistance réelle).  
- Préparer un Dockerfile prod pour le front (build Vite + Nginx).  
- Porter la stack sur Kubernetes (Deployments, Services, Ingress).  

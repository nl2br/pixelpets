dev:		docker compose -f docker-compose.dev.yml up
dev-down:	docker compose -f docker-compose.dev.yml down
prod:		docker compose up --build -d
prod-down:	docker compose down
logs:		docker compose logs -f pets
ps:		docker compose ps


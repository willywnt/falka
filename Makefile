.PHONY: infra-up infra-down infra-reset infra-wait dev build setup

infra-up:
	pnpm infra:up

infra-down:
	pnpm infra:down

infra-reset:
	pnpm infra:reset -- --yes

infra-wait:
	pnpm infra:wait

setup:
	pnpm setup

dev:
	pnpm dev

build:
	pnpm build

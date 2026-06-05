.PHONY: help dev tauri build desktop lint install clean

.DEFAULT_GOAL := help

help:
	@echo "Whale Play - Available Make Command"
	@echo "==================================="
	@echo "make install     Install pnpm packages and fetch cargo packages"
	@echo ""
	@echo "Develop:"
	@echo " make dev        Open Web Pages"
	@echo " make tauri      Open Tauri Pages"
	@echo " make lint       Use eslint check react code"
	@echo ""
	@echo "Build:"
	@echo " make build      Build React dist"
	@echo " make desktop    Build Tauri exe"
	@echo ""
	@echo "make clean       clean ALL deps of this project"

dev:
	pnpm dev

tauri:
	pnpm tauri dev


build:
	pnpm build && cd apps/desktop/src-tauri && cargo check

desktop:
	pnpm build:desktop


lint:
	pnpm lint:fix && cd apps/desktop/src-tauri && cargo fmt

lint-tauri:
	cd apps/desktop/src-tauri && cargo fmt


install:
	pnpm i && cd apps/desktop/src-tauri && cargo fetch

clean:
	pnpm clean && cd apps/desktop/src-tauri && cargo clean

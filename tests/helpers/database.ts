import { afterEach, beforeEach } from "vitest";

type Cleanup = () => Promise<unknown>;

const cleanups: Cleanup[] = [];

export function registerDatabaseCleanup(cleanup: Cleanup): void {
  cleanups.push(cleanup);
}

beforeEach(() => {
  cleanups.length = 0;
});

afterEach(async () => {
  const currentCleanups = cleanups.splice(0).reverse();

  for (const cleanup of currentCleanups) {
    try {
      await cleanup();
    } catch (error) {
      console.error("Falha ao limpar dados registrados pelo teste", error);
    }
  }
});

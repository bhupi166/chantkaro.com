// Node has no `caches` global (that's a Workers-runtime/Service-Worker API),
// so tests that exercise src/index.ts's edge-cache path need a minimal
// in-memory stand-in. Keyed loosely by method+URL, which is all this
// Worker's GET-only cache usage needs.
class FakeCache {
  store = new Map<string, Response>();

  private key(request: Request): string {
    return `${request.method}:${request.url}`;
  }

  async match(request: Request): Promise<Response | undefined> {
    const hit = this.store.get(this.key(request));
    return hit ? hit.clone() : undefined;
  }

  async put(request: Request, response: Response): Promise<void> {
    this.store.set(this.key(request), response.clone());
  }

  async delete(request: Request): Promise<boolean> {
    return this.store.delete(this.key(request));
  }
}

const fakeDefaultCache = new FakeCache();
(globalThis as unknown as { caches: { default: FakeCache } }).caches = { default: fakeDefaultCache };

/** Call between tests so a cached response from one test never leaks into the next. */
export function resetFakeEdgeCache(): void {
  fakeDefaultCache.store.clear();
}

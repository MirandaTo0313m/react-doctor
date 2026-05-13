// HACK: only flag env vars whose name matches a secret keyword. A loader
// reading process.env.DATABASE_URL or process.env.PORT is fine; what's not
// fine is process.env.STRIPE_SECRET or process.env.NEXT_PUBLIC_API_KEY (the
// latter being a misconfigured public-prefixed key).

export interface ServerFnChainInfo {
  isServerFnChain: boolean;
  specifiedMethod: string | null;
  hasInputValidator: boolean;
}

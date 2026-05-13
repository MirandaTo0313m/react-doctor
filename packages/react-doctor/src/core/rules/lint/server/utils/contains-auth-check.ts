import type { EsTreeNode } from "../../utils/index.js";
import { AUTH_FUNCTION_NAMES } from "../../constants.js";
import { isNodeOfType } from "../../utils/index.js";
import { walkAst } from "../../utils/index.js";

// HACK: route handlers run on every request - reading static assets via
// `fs.readFileSync('./fonts/...')` or `fetch(new URL('./fonts/...',
// import.meta.url))` re-reads the same file from disk per request. We
// catch BOTH App Router (`export async function GET/POST/...` in
// `app/.../route.ts`) and Pages Router (`export default async function
// handler(req, res)` in `pages/api/...`).

// HACK: in async route handlers and Server Components, two consecutive
// `await fetch()` (or any awaited calls) where the second one doesn't
// reference the first's binding is a textbook waterfall - the second
// fetch waits for the first to land before even starting, doubling
// latency. Wrap independent awaits in `Promise.all([…])` so they race.
//
// Heuristic: scan async function bodies for two consecutive
// VariableDeclaration statements whose init is `await something(...)`,
// where the second's initializer reads no identifier introduced by the
// first declaration. We require both declarations to be at the top
// level of the same block to keep precision high.

export const containsAuthCheck = (statements: EsTreeNode[]): boolean => {
  let foundAuthCall = false;
  for (const statement of statements) {
    walkAst(statement, (child: EsTreeNode) => {
      if (foundAuthCall) return;
      let callNode: EsTreeNode | null = null;
      if (isNodeOfType(child, "CallExpression")) {
        callNode = child;
      } else if (
        isNodeOfType(child, "AwaitExpression") &&
        isNodeOfType(child.argument, "CallExpression")
      ) {
        callNode = child.argument;
      }

      if (isNodeOfType(callNode?.callee, "Identifier")) {
        const calleeName: string = callNode.callee.name;
        if (
          AUTH_FUNCTION_NAMES.has(calleeName) ||
          /^(?:check|require|ensure|assert|verify|guard|protect|validate).*(?:auth|access|session|admin|permission|role)/i.test(
            calleeName,
          )
        ) {
          foundAuthCall = true;
        }
      }
    });
  }
  return foundAuthCall;
};

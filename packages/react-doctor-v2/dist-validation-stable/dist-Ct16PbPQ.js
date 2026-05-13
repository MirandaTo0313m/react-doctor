import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  copyFile,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  readlink,
  realpath,
  rename,
  rm,
  stat,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { homedir, platform, tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp$1 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (
  mod || (cb((mod = { exports: {} }).exports, mod), (cb = null)), mod.exports
);
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function")
    for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
      key = keys[i];
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp$1(to, key, {
          get: ((k) => from[k]).bind(null, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
    }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    isNodeMode || !mod || !mod.__esModule
      ? __defProp$1(target, "default", {
          value: mod,
          enumerable: true,
        })
      : target,
    mod,
  )
);
var __require = /* @__PURE__ */ createRequire(import.meta.url);
//#endregion
//#region ../../node_modules/.pnpm/agent-install@0.0.5/node_modules/agent-install/dist/chunk-pbuEa-1d.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
  let target = {};
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
    });
  if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
  return target;
};
//#endregion
//#region ../../node_modules/.pnpm/agent-install@0.0.5/node_modules/agent-install/dist/to-error-message-Bg0SEUet.js
const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const toErrorMessage = (error, fallback = "Unknown error") =>
  error instanceof Error ? error.message : fallback;
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/identity.js
var require_identity = /* @__PURE__ */ __commonJSMin((exports) => {
  const ALIAS = Symbol.for("yaml.alias");
  const DOC = Symbol.for("yaml.document");
  const MAP = Symbol.for("yaml.map");
  const PAIR = Symbol.for("yaml.pair");
  const SCALAR = Symbol.for("yaml.scalar");
  const SEQ = Symbol.for("yaml.seq");
  const NODE_TYPE = Symbol.for("yaml.node.type");
  const isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
  const isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
  const isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
  const isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
  const isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
  const isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
  function isCollection(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case MAP:
        case SEQ:
          return true;
      }
    return false;
  }
  function isNode(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case ALIAS:
        case MAP:
        case SCALAR:
        case SEQ:
          return true;
      }
    return false;
  }
  const hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
  exports.ALIAS = ALIAS;
  exports.DOC = DOC;
  exports.MAP = MAP;
  exports.NODE_TYPE = NODE_TYPE;
  exports.PAIR = PAIR;
  exports.SCALAR = SCALAR;
  exports.SEQ = SEQ;
  exports.hasAnchor = hasAnchor;
  exports.isAlias = isAlias;
  exports.isCollection = isCollection;
  exports.isDocument = isDocument;
  exports.isMap = isMap;
  exports.isNode = isNode;
  exports.isPair = isPair;
  exports.isScalar = isScalar;
  exports.isSeq = isSeq;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/visit.js
var require_visit = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  const BREAK = Symbol("break visit");
  const SKIP = Symbol("skip children");
  const REMOVE = Symbol("remove node");
  /**
   * Apply a visitor to an AST node or document.
   *
   * Walks through the tree (depth-first) starting from `node`, calling a
   * `visitor` function with three arguments:
   *   - `key`: For sequence values and map `Pair`, the node's index in the
   *     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
   *     `null` for the root node.
   *   - `node`: The current node.
   *   - `path`: The ancestry of the current node.
   *
   * The return value of the visitor may be used to control the traversal:
   *   - `undefined` (default): Do nothing and continue
   *   - `visit.SKIP`: Do not visit the children of this node, continue with next
   *     sibling
   *   - `visit.BREAK`: Terminate traversal completely
   *   - `visit.REMOVE`: Remove the current node, then continue with the next one
   *   - `Node`: Replace the current node, then continue by visiting it
   *   - `number`: While iterating the items of a sequence or map, set the index
   *     of the next step. This is useful especially if the index of the current
   *     node has changed.
   *
   * If `visitor` is a single function, it will be called with all values
   * encountered in the tree, including e.g. `null` values. Alternatively,
   * separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
   * `Alias` and `Scalar` node. To define the same visitor function for more than
   * one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
   * and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
   * specific defined one will be used for each node.
   */
  function visit(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      if (visit_(null, node.contents, visitor_, Object.freeze([node])) === REMOVE)
        node.contents = null;
    } else visit_(null, node, visitor_, Object.freeze([]));
  }
  /** Terminate visit traversal completely */
  visit.BREAK = BREAK;
  /** Do not visit the children of the current node */
  visit.SKIP = SKIP;
  /** Remove the current node */
  visit.REMOVE = REMOVE;
  function visit_(key, node, visitor, path) {
    const ctrl = callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visit_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0; i < node.items.length; ++i) {
          const ci = visit_(i, node.items[i], visitor, path);
          if (typeof ci === "number") i = ci - 1;
          else if (ci === BREAK) return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = visit_("key", node.key, visitor, path);
        if (ck === BREAK) return BREAK;
        else if (ck === REMOVE) node.key = null;
        const cv = visit_("value", node.value, visitor, path);
        if (cv === BREAK) return BREAK;
        else if (cv === REMOVE) node.value = null;
      }
    }
    return ctrl;
  }
  /**
   * Apply an async visitor to an AST node or document.
   *
   * Walks through the tree (depth-first) starting from `node`, calling a
   * `visitor` function with three arguments:
   *   - `key`: For sequence values and map `Pair`, the node's index in the
   *     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
   *     `null` for the root node.
   *   - `node`: The current node.
   *   - `path`: The ancestry of the current node.
   *
   * The return value of the visitor may be used to control the traversal:
   *   - `Promise`: Must resolve to one of the following values
   *   - `undefined` (default): Do nothing and continue
   *   - `visit.SKIP`: Do not visit the children of this node, continue with next
   *     sibling
   *   - `visit.BREAK`: Terminate traversal completely
   *   - `visit.REMOVE`: Remove the current node, then continue with the next one
   *   - `Node`: Replace the current node, then continue by visiting it
   *   - `number`: While iterating the items of a sequence or map, set the index
   *     of the next step. This is useful especially if the index of the current
   *     node has changed.
   *
   * If `visitor` is a single function, it will be called with all values
   * encountered in the tree, including e.g. `null` values. Alternatively,
   * separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
   * `Alias` and `Scalar` node. To define the same visitor function for more than
   * one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
   * and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
   * specific defined one will be used for each node.
   */
  async function visitAsync(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      if ((await visitAsync_(null, node.contents, visitor_, Object.freeze([node]))) === REMOVE)
        node.contents = null;
    } else await visitAsync_(null, node, visitor_, Object.freeze([]));
  }
  /** Terminate visit traversal completely */
  visitAsync.BREAK = BREAK;
  /** Do not visit the children of the current node */
  visitAsync.SKIP = SKIP;
  /** Remove the current node */
  visitAsync.REMOVE = REMOVE;
  async function visitAsync_(key, node, visitor, path) {
    const ctrl = await callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visitAsync_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0; i < node.items.length; ++i) {
          const ci = await visitAsync_(i, node.items[i], visitor, path);
          if (typeof ci === "number") i = ci - 1;
          else if (ci === BREAK) return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = await visitAsync_("key", node.key, visitor, path);
        if (ck === BREAK) return BREAK;
        else if (ck === REMOVE) node.key = null;
        const cv = await visitAsync_("value", node.value, visitor, path);
        if (cv === BREAK) return BREAK;
        else if (cv === REMOVE) node.value = null;
      }
    }
    return ctrl;
  }
  function initVisitor(visitor) {
    if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value))
      return Object.assign(
        {
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node,
        },
        visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value,
        },
        visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection,
        },
        visitor,
      );
    return visitor;
  }
  function callVisitor(key, node, visitor, path) {
    if (typeof visitor === "function") return visitor(key, node, path);
    if (identity.isMap(node)) return visitor.Map?.(key, node, path);
    if (identity.isSeq(node)) return visitor.Seq?.(key, node, path);
    if (identity.isPair(node)) return visitor.Pair?.(key, node, path);
    if (identity.isScalar(node)) return visitor.Scalar?.(key, node, path);
    if (identity.isAlias(node)) return visitor.Alias?.(key, node, path);
  }
  function replaceNode(key, path, node) {
    const parent = path[path.length - 1];
    if (identity.isCollection(parent)) parent.items[key] = node;
    else if (identity.isPair(parent))
      if (key === "key") parent.key = node;
      else parent.value = node;
    else if (identity.isDocument(parent)) parent.contents = node;
    else {
      const pt = identity.isAlias(parent) ? "alias" : "scalar";
      throw new Error(`Cannot replace node with ${pt} parent`);
    }
  }
  exports.visit = visit;
  exports.visitAsync = visitAsync;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/directives.js
var require_directives = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var visit = require_visit();
  const escapeChars = {
    "!": "%21",
    ",": "%2C",
    "[": "%5B",
    "]": "%5D",
    "{": "%7B",
    "}": "%7D",
  };
  const escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
  var Directives = class Directives {
    constructor(yaml, tags) {
      /**
       * The directives-end/doc-start marker `---`. If `null`, a marker may still be
       * included in the document's stringified representation.
       */
      this.docStart = null;
      /** The doc-end marker `...`.  */
      this.docEnd = false;
      this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
      this.tags = Object.assign({}, Directives.defaultTags, tags);
    }
    clone() {
      const copy = new Directives(this.yaml, this.tags);
      copy.docStart = this.docStart;
      return copy;
    }
    /**
     * During parsing, get a Directives instance for the current document and
     * update the stream state according to the current version's spec.
     */
    atDocument() {
      const res = new Directives(this.yaml, this.tags);
      switch (this.yaml.version) {
        case "1.1":
          this.atNextDocument = true;
          break;
        case "1.2":
          this.atNextDocument = false;
          this.yaml = {
            explicit: Directives.defaultYaml.explicit,
            version: "1.2",
          };
          this.tags = Object.assign({}, Directives.defaultTags);
          break;
      }
      return res;
    }
    /**
     * @param onError - May be called even if the action was successful
     * @returns `true` on success
     */
    add(line, onError) {
      if (this.atNextDocument) {
        this.yaml = {
          explicit: Directives.defaultYaml.explicit,
          version: "1.1",
        };
        this.tags = Object.assign({}, Directives.defaultTags);
        this.atNextDocument = false;
      }
      const parts = line.trim().split(/[ \t]+/);
      const name = parts.shift();
      switch (name) {
        case "%TAG": {
          if (parts.length !== 2) {
            onError(0, "%TAG directive should contain exactly two parts");
            if (parts.length < 2) return false;
          }
          const [handle, prefix] = parts;
          this.tags[handle] = prefix;
          return true;
        }
        case "%YAML": {
          this.yaml.explicit = true;
          if (parts.length !== 1) {
            onError(0, "%YAML directive should contain exactly one part");
            return false;
          }
          const [version] = parts;
          if (version === "1.1" || version === "1.2") {
            this.yaml.version = version;
            return true;
          } else {
            const isValid = /^\d+\.\d+$/.test(version);
            onError(6, `Unsupported YAML version ${version}`, isValid);
            return false;
          }
        }
        default:
          onError(0, `Unknown directive ${name}`, true);
          return false;
      }
    }
    /**
     * Resolves a tag, matching handles to those defined in %TAG directives.
     *
     * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
     *   `'!local'` tag, or `null` if unresolvable.
     */
    tagName(source, onError) {
      if (source === "!") return "!";
      if (source[0] !== "!") {
        onError(`Not a valid tag: ${source}`);
        return null;
      }
      if (source[1] === "<") {
        const verbatim = source.slice(2, -1);
        if (verbatim === "!" || verbatim === "!!") {
          onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
          return null;
        }
        if (source[source.length - 1] !== ">") onError("Verbatim tags must end with a >");
        return verbatim;
      }
      const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
      if (!suffix) onError(`The ${source} tag has no suffix`);
      const prefix = this.tags[handle];
      if (prefix)
        try {
          return prefix + decodeURIComponent(suffix);
        } catch (error) {
          onError(String(error));
          return null;
        }
      if (handle === "!") return source;
      onError(`Could not resolve tag: ${source}`);
      return null;
    }
    /**
     * Given a fully resolved tag, returns its printable string form,
     * taking into account current tag prefixes and defaults.
     */
    tagString(tag) {
      for (const [handle, prefix] of Object.entries(this.tags))
        if (tag.startsWith(prefix)) return handle + escapeTagName(tag.substring(prefix.length));
      return tag[0] === "!" ? tag : `!<${tag}>`;
    }
    toString(doc) {
      const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
      const tagEntries = Object.entries(this.tags);
      let tagNames;
      if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
        const tags = {};
        visit.visit(doc.contents, (_key, node) => {
          if (identity.isNode(node) && node.tag) tags[node.tag] = true;
        });
        tagNames = Object.keys(tags);
      } else tagNames = [];
      for (const [handle, prefix] of tagEntries) {
        if (handle === "!!" && prefix === "tag:yaml.org,2002:") continue;
        if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
          lines.push(`%TAG ${handle} ${prefix}`);
      }
      return lines.join("\n");
    }
  };
  Directives.defaultYaml = {
    explicit: false,
    version: "1.2",
  };
  Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
  exports.Directives = Directives;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/anchors.js
var require_anchors = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var visit = require_visit();
  /**
   * Verify that the input string is a valid anchor.
   *
   * Will throw on errors.
   */
  function anchorIsValid(anchor) {
    if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
      const msg = `Anchor must not contain whitespace or control characters: ${JSON.stringify(anchor)}`;
      throw new Error(msg);
    }
    return true;
  }
  function anchorNames(root) {
    const anchors = /* @__PURE__ */ new Set();
    visit.visit(root, {
      Value(_key, node) {
        if (node.anchor) anchors.add(node.anchor);
      },
    });
    return anchors;
  }
  /** Find a new anchor name with the given `prefix` and a one-indexed suffix. */
  function findNewAnchor(prefix, exclude) {
    for (let i = 1; ; ++i) {
      const name = `${prefix}${i}`;
      if (!exclude.has(name)) return name;
    }
  }
  function createNodeAnchors(doc, prefix) {
    const aliasObjects = [];
    const sourceObjects = /* @__PURE__ */ new Map();
    let prevAnchors = null;
    return {
      onAnchor: (source) => {
        aliasObjects.push(source);
        prevAnchors ?? (prevAnchors = anchorNames(doc));
        const anchor = findNewAnchor(prefix, prevAnchors);
        prevAnchors.add(anchor);
        return anchor;
      },
      /**
       * With circular references, the source node is only resolved after all
       * of its child nodes are. This is why anchors are set only after all of
       * the nodes have been created.
       */
      setAnchors: () => {
        for (const source of aliasObjects) {
          const ref = sourceObjects.get(source);
          if (
            typeof ref === "object" &&
            ref.anchor &&
            (identity.isScalar(ref.node) || identity.isCollection(ref.node))
          )
            ref.node.anchor = ref.anchor;
          else {
            const error = /* @__PURE__ */ new Error(
              "Failed to resolve repeated object (this should not happen)",
            );
            error.source = source;
            throw error;
          }
        }
      },
      sourceObjects,
    };
  }
  exports.anchorIsValid = anchorIsValid;
  exports.anchorNames = anchorNames;
  exports.createNodeAnchors = createNodeAnchors;
  exports.findNewAnchor = findNewAnchor;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = /* @__PURE__ */ __commonJSMin((exports) => {
  /**
   * Applies the JSON.parse reviver algorithm as defined in the ECMA-262 spec,
   * in section 24.5.1.1 "Runtime Semantics: InternalizeJSONProperty" of the
   * 2021 edition: https://tc39.es/ecma262/#sec-json.parse
   *
   * Includes extensions for handling Map and Set objects.
   */
  function applyReviver(reviver, obj, key, val) {
    if (val && typeof val === "object")
      if (Array.isArray(val))
        for (let i = 0, len = val.length; i < len; ++i) {
          const v0 = val[i];
          const v1 = applyReviver(reviver, val, String(i), v0);
          if (v1 === void 0) delete val[i];
          else if (v1 !== v0) val[i] = v1;
        }
      else if (val instanceof Map)
        for (const k of Array.from(val.keys())) {
          const v0 = val.get(k);
          const v1 = applyReviver(reviver, val, k, v0);
          if (v1 === void 0) val.delete(k);
          else if (v1 !== v0) val.set(k, v1);
        }
      else if (val instanceof Set)
        for (const v0 of Array.from(val)) {
          const v1 = applyReviver(reviver, val, v0, v0);
          if (v1 === void 0) val.delete(v0);
          else if (v1 !== v0) {
            val.delete(v0);
            val.add(v1);
          }
        }
      else
        for (const [k, v0] of Object.entries(val)) {
          const v1 = applyReviver(reviver, val, k, v0);
          if (v1 === void 0) delete val[k];
          else if (v1 !== v0) val[k] = v1;
        }
    return reviver.call(obj, key, val);
  }
  exports.applyReviver = applyReviver;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/toJS.js
var require_toJS = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  /**
   * Recursively convert any node or its contents to native JavaScript
   *
   * @param value - The input value
   * @param arg - If `value` defines a `toJSON()` method, use this
   *   as its first argument
   * @param ctx - Conversion context, originally set in Document#toJS(). If
   *   `{ keep: true }` is not set, output should be suitable for JSON
   *   stringification.
   */
  function toJS(value, arg, ctx) {
    if (Array.isArray(value)) return value.map((v, i) => toJS(v, String(i), ctx));
    if (value && typeof value.toJSON === "function") {
      if (!ctx || !identity.hasAnchor(value)) return value.toJSON(arg, ctx);
      const data = {
        aliasCount: 0,
        count: 1,
        res: void 0,
      };
      ctx.anchors.set(value, data);
      ctx.onCreate = (res) => {
        data.res = res;
        delete ctx.onCreate;
      };
      const res = value.toJSON(arg, ctx);
      if (ctx.onCreate) ctx.onCreate(res);
      return res;
    }
    if (typeof value === "bigint" && !ctx?.keep) return Number(value);
    return value;
  }
  exports.toJS = toJS;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Node.js
var require_Node = /* @__PURE__ */ __commonJSMin((exports) => {
  var applyReviver = require_applyReviver();
  var identity = require_identity();
  var toJS = require_toJS();
  var NodeBase = class {
    constructor(type) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: type });
    }
    /** Create a copy of this node.  */
    clone() {
      const copy = Object.create(
        Object.getPrototypeOf(this),
        Object.getOwnPropertyDescriptors(this),
      );
      if (this.range) copy.range = this.range.slice();
      return copy;
    }
    /** A plain JavaScript representation of this node. */
    toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      if (!identity.isDocument(doc)) throw new TypeError("A document argument is required");
      const ctx = {
        anchors: /* @__PURE__ */ new Map(),
        doc,
        keep: true,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100,
      };
      const res = toJS.toJS(this, "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res } of ctx.anchors.values()) onAnchor(res, count);
      return typeof reviver === "function"
        ? applyReviver.applyReviver(reviver, { "": res }, "", res)
        : res;
    }
  };
  exports.NodeBase = NodeBase;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Alias.js
var require_Alias = /* @__PURE__ */ __commonJSMin((exports) => {
  var anchors = require_anchors();
  var visit = require_visit();
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();
  var Alias = class extends Node.NodeBase {
    constructor(source) {
      super(identity.ALIAS);
      this.source = source;
      Object.defineProperty(this, "tag", {
        set() {
          throw new Error("Alias nodes cannot have tags");
        },
      });
    }
    /**
     * Resolve the value of this alias within `doc`, finding the last
     * instance of the `source` anchor before this node.
     */
    resolve(doc, ctx) {
      let nodes;
      if (ctx?.aliasResolveCache) nodes = ctx.aliasResolveCache;
      else {
        nodes = [];
        visit.visit(doc, {
          Node: (_key, node) => {
            if (identity.isAlias(node) || identity.hasAnchor(node)) nodes.push(node);
          },
        });
        if (ctx) ctx.aliasResolveCache = nodes;
      }
      let found = void 0;
      for (const node of nodes) {
        if (node === this) break;
        if (node.anchor === this.source) found = node;
      }
      return found;
    }
    toJSON(_arg, ctx) {
      if (!ctx) return { source: this.source };
      const { anchors, doc, maxAliasCount } = ctx;
      const source = this.resolve(doc, ctx);
      if (!source) {
        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new ReferenceError(msg);
      }
      let data = anchors.get(source);
      if (!data) {
        toJS.toJS(source, null, ctx);
        data = anchors.get(source);
      }
      /* istanbul ignore if */
      if (data?.res === void 0)
        throw new ReferenceError("This should not happen: Alias anchor was not resolved?");
      if (maxAliasCount >= 0) {
        data.count += 1;
        if (data.aliasCount === 0) data.aliasCount = getAliasCount(doc, source, anchors);
        if (data.count * data.aliasCount > maxAliasCount)
          throw new ReferenceError("Excessive alias count indicates a resource exhaustion attack");
      }
      return data.res;
    }
    toString(ctx, _onComment, _onChompKeep) {
      const src = `*${this.source}`;
      if (ctx) {
        anchors.anchorIsValid(this.source);
        if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new Error(msg);
        }
        if (ctx.implicitKey) return `${src} `;
      }
      return src;
    }
  };
  function getAliasCount(doc, node, anchors) {
    if (identity.isAlias(node)) {
      const source = node.resolve(doc);
      const anchor = anchors && source && anchors.get(source);
      return anchor ? anchor.count * anchor.aliasCount : 0;
    } else if (identity.isCollection(node)) {
      let count = 0;
      for (const item of node.items) {
        const c = getAliasCount(doc, item, anchors);
        if (c > count) count = c;
      }
      return count;
    } else if (identity.isPair(node)) {
      const kc = getAliasCount(doc, node.key, anchors);
      const vc = getAliasCount(doc, node.value, anchors);
      return Math.max(kc, vc);
    }
    return 1;
  }
  exports.Alias = Alias;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();
  const isScalarValue = (value) =>
    !value || (typeof value !== "function" && typeof value !== "object");
  var Scalar = class extends Node.NodeBase {
    constructor(value) {
      super(identity.SCALAR);
      this.value = value;
    }
    toJSON(arg, ctx) {
      return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
    }
    toString() {
      return String(this.value);
    }
  };
  Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
  Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
  Scalar.PLAIN = "PLAIN";
  Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
  Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
  exports.Scalar = Scalar;
  exports.isScalarValue = isScalarValue;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/createNode.js
var require_createNode = /* @__PURE__ */ __commonJSMin((exports) => {
  var Alias = require_Alias();
  var identity = require_identity();
  var Scalar = require_Scalar();
  const defaultTagPrefix = "tag:yaml.org,2002:";
  function findTagObject(value, tagName, tags) {
    if (tagName) {
      const match = tags.filter((t) => t.tag === tagName);
      const tagObj = match.find((t) => !t.format) ?? match[0];
      if (!tagObj) throw new Error(`Tag ${tagName} not found`);
      return tagObj;
    }
    return tags.find((t) => t.identify?.(value) && !t.format);
  }
  function createNode(value, tagName, ctx) {
    if (identity.isDocument(value)) value = value.contents;
    if (identity.isNode(value)) return value;
    if (identity.isPair(value)) {
      const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
      map.items.push(value);
      return map;
    }
    if (
      value instanceof String ||
      value instanceof Number ||
      value instanceof Boolean ||
      (typeof BigInt !== "undefined" && value instanceof BigInt)
    )
      value = value.valueOf();
    const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
    let ref = void 0;
    if (aliasDuplicateObjects && value && typeof value === "object") {
      ref = sourceObjects.get(value);
      if (ref) {
        ref.anchor ?? (ref.anchor = onAnchor(value));
        return new Alias.Alias(ref.anchor);
      } else {
        ref = {
          anchor: null,
          node: null,
        };
        sourceObjects.set(value, ref);
      }
    }
    if (tagName?.startsWith("!!")) tagName = defaultTagPrefix + tagName.slice(2);
    let tagObj = findTagObject(value, tagName, schema.tags);
    if (!tagObj) {
      if (value && typeof value.toJSON === "function") value = value.toJSON();
      if (!value || typeof value !== "object") {
        const node = new Scalar.Scalar(value);
        if (ref) ref.node = node;
        return node;
      }
      tagObj =
        value instanceof Map
          ? schema[identity.MAP]
          : Symbol.iterator in Object(value)
            ? schema[identity.SEQ]
            : schema[identity.MAP];
    }
    if (onTagObj) {
      onTagObj(tagObj);
      delete ctx.onTagObj;
    }
    const node = tagObj?.createNode
      ? tagObj.createNode(ctx.schema, value, ctx)
      : typeof tagObj?.nodeClass?.from === "function"
        ? tagObj.nodeClass.from(ctx.schema, value, ctx)
        : new Scalar.Scalar(value);
    if (tagName) node.tag = tagName;
    else if (!tagObj.default) node.tag = tagObj.tag;
    if (ref) ref.node = node;
    return node;
  }
  exports.createNode = createNode;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Collection.js
var require_Collection = /* @__PURE__ */ __commonJSMin((exports) => {
  var createNode = require_createNode();
  var identity = require_identity();
  var Node = require_Node();
  function collectionFromPath(schema, path, value) {
    let v = value;
    for (let i = path.length - 1; i >= 0; --i) {
      const k = path[i];
      if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
        const a = [];
        a[k] = v;
        v = a;
      } else v = new Map([[k, v]]);
    }
    return createNode.createNode(v, void 0, {
      aliasDuplicateObjects: false,
      keepUndefined: false,
      onAnchor: () => {
        throw new Error("This should not happen, please report a bug.");
      },
      schema,
      sourceObjects: /* @__PURE__ */ new Map(),
    });
  }
  const isEmptyPath = (path) =>
    path == null || (typeof path === "object" && !!path[Symbol.iterator]().next().done);
  var Collection = class extends Node.NodeBase {
    constructor(type, schema) {
      super(type);
      Object.defineProperty(this, "schema", {
        value: schema,
        configurable: true,
        enumerable: false,
        writable: true,
      });
    }
    /**
     * Create a copy of this collection.
     *
     * @param schema - If defined, overwrites the original's schema
     */
    clone(schema) {
      const copy = Object.create(
        Object.getPrototypeOf(this),
        Object.getOwnPropertyDescriptors(this),
      );
      if (schema) copy.schema = schema;
      copy.items = copy.items.map((it) =>
        identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it,
      );
      if (this.range) copy.range = this.range.slice();
      return copy;
    }
    /**
     * Adds a value to the collection. For `!!map` and `!!omap` the value must
     * be a Pair instance or a `{ key, value }` object, which may not have a key
     * that already exists in the map.
     */
    addIn(path, value) {
      if (isEmptyPath(path)) this.add(value);
      else {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (identity.isCollection(node)) node.addIn(rest, value);
        else if (node === void 0 && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
    /**
     * Removes a value from the collection.
     * @returns `true` if the item was found and removed.
     */
    deleteIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0) return this.delete(key);
      const node = this.get(key, true);
      if (identity.isCollection(node)) return node.deleteIn(rest);
      else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
    /**
     * Returns item at `key`, or `undefined` if not found. By default unwraps
     * scalar values from their surrounding node; to disable set `keepScalar` to
     * `true` (collections are always returned intact).
     */
    getIn(path, keepScalar) {
      const [key, ...rest] = path;
      const node = this.get(key, true);
      if (rest.length === 0) return !keepScalar && identity.isScalar(node) ? node.value : node;
      else return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
    }
    hasAllNullValues(allowScalar) {
      return this.items.every((node) => {
        if (!identity.isPair(node)) return false;
        const n = node.value;
        return (
          n == null ||
          (allowScalar &&
            identity.isScalar(n) &&
            n.value == null &&
            !n.commentBefore &&
            !n.comment &&
            !n.tag)
        );
      });
    }
    /**
     * Checks if the collection includes a value with the key `key`.
     */
    hasIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0) return this.has(key);
      const node = this.get(key, true);
      return identity.isCollection(node) ? node.hasIn(rest) : false;
    }
    /**
     * Sets a value in this collection. For `!!set`, `value` needs to be a
     * boolean to add/remove the item from the set.
     */
    setIn(path, value) {
      const [key, ...rest] = path;
      if (rest.length === 0) this.set(key, value);
      else {
        const node = this.get(key, true);
        if (identity.isCollection(node)) node.setIn(rest, value);
        else if (node === void 0 && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
  };
  exports.Collection = Collection;
  exports.collectionFromPath = collectionFromPath;
  exports.isEmptyPath = isEmptyPath;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = /* @__PURE__ */ __commonJSMin((exports) => {
  /**
   * Stringifies a comment.
   *
   * Empty comment lines are left empty,
   * lines consisting of a single space are replaced by `#`,
   * and all other lines are prefixed with a `#`.
   */
  const stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
  function indentComment(comment, indent) {
    if (/^\n+$/.test(comment)) return comment.substring(1);
    return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
  }
  const lineComment = (str, indent, comment) =>
    str.endsWith("\n")
      ? indentComment(comment, indent)
      : comment.includes("\n")
        ? "\n" + indentComment(comment, indent)
        : (str.endsWith(" ") ? "" : " ") + comment;
  exports.indentComment = indentComment;
  exports.lineComment = lineComment;
  exports.stringifyComment = stringifyComment;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = /* @__PURE__ */ __commonJSMin((exports) => {
  const FOLD_FLOW = "flow";
  const FOLD_BLOCK = "block";
  const FOLD_QUOTED = "quoted";
  /**
   * Tries to keep input at up to `lineWidth` characters, splitting only on spaces
   * not followed by newlines or spaces unless `mode` is `'quoted'`. Lines are
   * terminated with `\n` and started with `indent`.
   */
  function foldFlowLines(
    text,
    indent,
    mode = "flow",
    { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {},
  ) {
    if (!lineWidth || lineWidth < 0) return text;
    if (lineWidth < minContentWidth) minContentWidth = 0;
    const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
    if (text.length <= endStep) return text;
    const folds = [];
    const escapedFolds = {};
    let end = lineWidth - indent.length;
    if (typeof indentAtStart === "number")
      if (indentAtStart > lineWidth - Math.max(2, minContentWidth)) folds.push(0);
      else end = lineWidth - indentAtStart;
    let split = void 0;
    let prev = void 0;
    let overflow = false;
    let i = -1;
    let escStart = -1;
    let escEnd = -1;
    if (mode === FOLD_BLOCK) {
      i = consumeMoreIndentedLines(text, i, indent.length);
      if (i !== -1) end = i + endStep;
    }
    for (let ch; (ch = text[(i += 1)]); ) {
      if (mode === FOLD_QUOTED && ch === "\\") {
        escStart = i;
        switch (text[i + 1]) {
          case "x":
            i += 3;
            break;
          case "u":
            i += 5;
            break;
          case "U":
            i += 9;
            break;
          default:
            i += 1;
        }
        escEnd = i;
      }
      if (ch === "\n") {
        if (mode === FOLD_BLOCK) i = consumeMoreIndentedLines(text, i, indent.length);
        end = i + indent.length + endStep;
        split = void 0;
      } else {
        if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
          const next = text[i + 1];
          if (next && next !== " " && next !== "\n" && next !== "	") split = i;
        }
        if (i >= end)
          if (split) {
            folds.push(split);
            end = split + endStep;
            split = void 0;
          } else if (mode === FOLD_QUOTED) {
            while (prev === " " || prev === "	") {
              prev = ch;
              ch = text[(i += 1)];
              overflow = true;
            }
            const j = i > escEnd + 1 ? i - 2 : escStart - 1;
            if (escapedFolds[j]) return text;
            folds.push(j);
            escapedFolds[j] = true;
            end = j + endStep;
            split = void 0;
          } else overflow = true;
      }
      prev = ch;
    }
    if (overflow && onOverflow) onOverflow();
    if (folds.length === 0) return text;
    if (onFold) onFold();
    let res = text.slice(0, folds[0]);
    for (let i = 0; i < folds.length; ++i) {
      const fold = folds[i];
      const end = folds[i + 1] || text.length;
      if (fold === 0) res = `\n${indent}${text.slice(0, end)}`;
      else {
        if (mode === FOLD_QUOTED && escapedFolds[fold]) res += `${text[fold]}\\`;
        res += `\n${indent}${text.slice(fold + 1, end)}`;
      }
    }
    return res;
  }
  /**
   * Presumes `i + 1` is at the start of a line
   * @returns index of last newline in more-indented block
   */
  function consumeMoreIndentedLines(text, i, indent) {
    let end = i;
    let start = i + 1;
    let ch = text[start];
    while (ch === " " || ch === "	")
      if (i < start + indent) ch = text[++i];
      else {
        do ch = text[++i];
        while (ch && ch !== "\n");
        end = i;
        start = i + 1;
        ch = text[start];
      }
    return end;
  }
  exports.FOLD_BLOCK = FOLD_BLOCK;
  exports.FOLD_FLOW = FOLD_FLOW;
  exports.FOLD_QUOTED = FOLD_QUOTED;
  exports.foldFlowLines = foldFlowLines;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = /* @__PURE__ */ __commonJSMin((exports) => {
  var Scalar = require_Scalar();
  var foldFlowLines = require_foldFlowLines();
  const getFoldOptions = (ctx, isBlock) => ({
    indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
    lineWidth: ctx.options.lineWidth,
    minContentWidth: ctx.options.minContentWidth,
  });
  const containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
  function lineLengthOverLimit(str, lineWidth, indentLength) {
    if (!lineWidth || lineWidth < 0) return false;
    const limit = lineWidth - indentLength;
    const strLen = str.length;
    if (strLen <= limit) return false;
    for (let i = 0, start = 0; i < strLen; ++i)
      if (str[i] === "\n") {
        if (i - start > limit) return true;
        start = i + 1;
        if (strLen - start <= limit) return false;
      }
    return true;
  }
  function doubleQuotedString(value, ctx) {
    const json = JSON.stringify(value);
    if (ctx.options.doubleQuotedAsJSON) return json;
    const { implicitKey } = ctx;
    const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    let str = "";
    let start = 0;
    for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
      if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
        str += json.slice(start, i) + "\\ ";
        i += 1;
        start = i;
        ch = "\\";
      }
      if (ch === "\\")
        switch (json[i + 1]) {
          case "u":
            {
              str += json.slice(start, i);
              const code = json.substr(i + 2, 4);
              switch (code) {
                case "0000":
                  str += "\\0";
                  break;
                case "0007":
                  str += "\\a";
                  break;
                case "000b":
                  str += "\\v";
                  break;
                case "001b":
                  str += "\\e";
                  break;
                case "0085":
                  str += "\\N";
                  break;
                case "00a0":
                  str += "\\_";
                  break;
                case "2028":
                  str += "\\L";
                  break;
                case "2029":
                  str += "\\P";
                  break;
                default:
                  if (code.substr(0, 2) === "00") str += "\\x" + code.substr(2);
                  else str += json.substr(i, 6);
              }
              i += 5;
              start = i + 1;
            }
            break;
          case "n":
            if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) i += 1;
            else {
              str += json.slice(start, i) + "\n\n";
              while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                str += "\n";
                i += 2;
              }
              str += indent;
              if (json[i + 2] === " ") str += "\\";
              i += 1;
              start = i + 1;
            }
            break;
          default:
            i += 1;
        }
    }
    str = start ? str + json.slice(start) : json;
    return implicitKey
      ? str
      : foldFlowLines.foldFlowLines(
          str,
          indent,
          foldFlowLines.FOLD_QUOTED,
          getFoldOptions(ctx, false),
        );
  }
  function singleQuotedString(value, ctx) {
    if (
      ctx.options.singleQuote === false ||
      (ctx.implicitKey && value.includes("\n")) ||
      /[ \t]\n|\n[ \t]/.test(value)
    )
      return doubleQuotedString(value, ctx);
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&\n${indent}`) + "'";
    return ctx.implicitKey
      ? res
      : foldFlowLines.foldFlowLines(
          res,
          indent,
          foldFlowLines.FOLD_FLOW,
          getFoldOptions(ctx, false),
        );
  }
  function quotedString(value, ctx) {
    const { singleQuote } = ctx.options;
    let qs;
    if (singleQuote === false) qs = doubleQuotedString;
    else {
      const hasDouble = value.includes('"');
      const hasSingle = value.includes("'");
      if (hasDouble && !hasSingle) qs = singleQuotedString;
      else if (hasSingle && !hasDouble) qs = doubleQuotedString;
      else qs = singleQuote ? singleQuotedString : doubleQuotedString;
    }
    return qs(value, ctx);
  }
  let blockEndNewlines;
  try {
    blockEndNewlines = /* @__PURE__ */ new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
  } catch {
    blockEndNewlines = /\n+(?!\n|$)/g;
  }
  function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
    const { blockQuote, commentString, lineWidth } = ctx.options;
    if (!blockQuote || /\n[\t ]+$/.test(value)) return quotedString(value, ctx);
    const indent =
      ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
    const literal =
      blockQuote === "literal"
        ? true
        : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED
          ? false
          : type === Scalar.Scalar.BLOCK_LITERAL
            ? true
            : !lineLengthOverLimit(value, lineWidth, indent.length);
    if (!value) return literal ? "|\n" : ">\n";
    let chomp;
    let endStart;
    for (endStart = value.length; endStart > 0; --endStart) {
      const ch = value[endStart - 1];
      if (ch !== "\n" && ch !== "	" && ch !== " ") break;
    }
    let end = value.substring(endStart);
    const endNlPos = end.indexOf("\n");
    if (endNlPos === -1) chomp = "-";
    else if (value === end || endNlPos !== end.length - 1) {
      chomp = "+";
      if (onChompKeep) onChompKeep();
    } else chomp = "";
    if (end) {
      value = value.slice(0, -end.length);
      if (end[end.length - 1] === "\n") end = end.slice(0, -1);
      end = end.replace(blockEndNewlines, `$&${indent}`);
    }
    let startWithSpace = false;
    let startEnd;
    let startNlPos = -1;
    for (startEnd = 0; startEnd < value.length; ++startEnd) {
      const ch = value[startEnd];
      if (ch === " ") startWithSpace = true;
      else if (ch === "\n") startNlPos = startEnd;
      else break;
    }
    let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
    if (start) {
      value = value.substring(start.length);
      start = start.replace(/\n+/g, `$&${indent}`);
    }
    let header = (startWithSpace ? (indent ? "2" : "1") : "") + chomp;
    if (comment) {
      header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
      if (onComment) onComment();
    }
    if (!literal) {
      const foldedValue = value
        .replace(/\n+/g, "\n$&")
        .replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2")
        .replace(/\n+/g, `$&${indent}`);
      let literalFallback = false;
      const foldOptions = getFoldOptions(ctx, true);
      if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED)
        foldOptions.onOverflow = () => {
          literalFallback = true;
        };
      const body = foldFlowLines.foldFlowLines(
        `${start}${foldedValue}${end}`,
        indent,
        foldFlowLines.FOLD_BLOCK,
        foldOptions,
      );
      if (!literalFallback) return `>${header}\n${indent}${body}`;
    }
    value = value.replace(/\n+/g, `$&${indent}`);
    return `|${header}\n${indent}${start}${value}${end}`;
  }
  function plainString(item, ctx, onComment, onChompKeep) {
    const { type, value } = item;
    const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
    if ((implicitKey && value.includes("\n")) || (inFlow && /[[\]{},]/.test(value)))
      return quotedString(value, ctx);
    if (
      /^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(
        value,
      )
    )
      return implicitKey || inFlow || !value.includes("\n")
        ? quotedString(value, ctx)
        : blockString(item, ctx, onComment, onChompKeep);
    if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n"))
      return blockString(item, ctx, onComment, onChompKeep);
    if (containsDocumentMarker(value)) {
      if (indent === "") {
        ctx.forceBlockIndent = true;
        return blockString(item, ctx, onComment, onChompKeep);
      } else if (implicitKey && indent === indentStep) return quotedString(value, ctx);
    }
    const str = value.replace(/\n+/g, `$&\n${indent}`);
    if (actualString) {
      const test = (tag) =>
        tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
      const { compat, tags } = ctx.doc.schema;
      if (tags.some(test) || compat?.some(test)) return quotedString(value, ctx);
    }
    return implicitKey
      ? str
      : foldFlowLines.foldFlowLines(
          str,
          indent,
          foldFlowLines.FOLD_FLOW,
          getFoldOptions(ctx, false),
        );
  }
  function stringifyString(item, ctx, onComment, onChompKeep) {
    const { implicitKey, inFlow } = ctx;
    const ss =
      typeof item.value === "string"
        ? item
        : Object.assign({}, item, { value: String(item.value) });
    let { type } = item;
    if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
      if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
        type = Scalar.Scalar.QUOTE_DOUBLE;
    }
    const _stringify = (_type) => {
      switch (_type) {
        case Scalar.Scalar.BLOCK_FOLDED:
        case Scalar.Scalar.BLOCK_LITERAL:
          return implicitKey || inFlow
            ? quotedString(ss.value, ctx)
            : blockString(ss, ctx, onComment, onChompKeep);
        case Scalar.Scalar.QUOTE_DOUBLE:
          return doubleQuotedString(ss.value, ctx);
        case Scalar.Scalar.QUOTE_SINGLE:
          return singleQuotedString(ss.value, ctx);
        case Scalar.Scalar.PLAIN:
          return plainString(ss, ctx, onComment, onChompKeep);
        default:
          return null;
      }
    };
    let res = _stringify(type);
    if (res === null) {
      const { defaultKeyType, defaultStringType } = ctx.options;
      const t = (implicitKey && defaultKeyType) || defaultStringType;
      res = _stringify(t);
      if (res === null) throw new Error(`Unsupported default string type ${t}`);
    }
    return res;
  }
  exports.stringifyString = stringifyString;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringify.js
var require_stringify$1 = /* @__PURE__ */ __commonJSMin((exports) => {
  var anchors = require_anchors();
  var identity = require_identity();
  var stringifyComment = require_stringifyComment();
  var stringifyString = require_stringifyString();
  function createStringifyContext(doc, options) {
    const opt = Object.assign(
      {
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true,
      },
      doc.schema.toStringOptions,
      options,
    );
    let inFlow;
    switch (opt.collectionStyle) {
      case "block":
        inFlow = false;
        break;
      case "flow":
        inFlow = true;
        break;
      default:
        inFlow = null;
    }
    return {
      anchors: /* @__PURE__ */ new Set(),
      doc,
      flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
      indent: "",
      indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
      inFlow,
      options: opt,
    };
  }
  function getTagObject(tags, item) {
    if (item.tag) {
      const match = tags.filter((t) => t.tag === item.tag);
      if (match.length > 0) return match.find((t) => t.format === item.format) ?? match[0];
    }
    let tagObj = void 0;
    let obj;
    if (identity.isScalar(item)) {
      obj = item.value;
      let match = tags.filter((t) => t.identify?.(obj));
      if (match.length > 1) {
        const testMatch = match.filter((t) => t.test);
        if (testMatch.length > 0) match = testMatch;
      }
      tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
    } else {
      obj = item;
      tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
    }
    if (!tagObj) {
      const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
      throw new Error(`Tag not resolved for ${name} value`);
    }
    return tagObj;
  }
  function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
    if (!doc.directives) return "";
    const props = [];
    const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
    if (anchor && anchors.anchorIsValid(anchor)) {
      anchors$1.add(anchor);
      props.push(`&${anchor}`);
    }
    const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
    if (tag) props.push(doc.directives.tagString(tag));
    return props.join(" ");
  }
  function stringify(item, ctx, onComment, onChompKeep) {
    if (identity.isPair(item)) return item.toString(ctx, onComment, onChompKeep);
    if (identity.isAlias(item)) {
      if (ctx.doc.directives) return item.toString(ctx);
      if (ctx.resolvedAliases?.has(item))
        throw new TypeError(`Cannot stringify circular structure without alias nodes`);
      else {
        if (ctx.resolvedAliases) ctx.resolvedAliases.add(item);
        else ctx.resolvedAliases = new Set([item]);
        item = item.resolve(ctx.doc);
      }
    }
    let tagObj = void 0;
    const node = identity.isNode(item)
      ? item
      : ctx.doc.createNode(item, { onTagObj: (o) => (tagObj = o) });
    tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
    const props = stringifyProps(node, tagObj, ctx);
    if (props.length > 0) ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
    const str =
      typeof tagObj.stringify === "function"
        ? tagObj.stringify(node, ctx, onComment, onChompKeep)
        : identity.isScalar(node)
          ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep)
          : node.toString(ctx, onComment, onChompKeep);
    if (!props) return str;
    return identity.isScalar(node) || str[0] === "{" || str[0] === "["
      ? `${props} ${str}`
      : `${props}\n${ctx.indent}${str}`;
  }
  exports.createStringifyContext = createStringifyContext;
  exports.stringify = stringify;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var stringify = require_stringify$1();
  var stringifyComment = require_stringifyComment();
  function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
    const {
      allNullValues,
      doc,
      indent,
      indentStep,
      options: { commentString, indentSeq, simpleKeys },
    } = ctx;
    let keyComment = (identity.isNode(key) && key.comment) || null;
    if (simpleKeys) {
      if (keyComment) throw new Error("With simple keys, key nodes cannot have comments");
      if (identity.isCollection(key) || (!identity.isNode(key) && typeof key === "object"))
        throw new Error("With simple keys, collection cannot be used as a key value");
    }
    let explicitKey =
      !simpleKeys &&
      (!key ||
        (keyComment && value == null && !ctx.inFlow) ||
        identity.isCollection(key) ||
        (identity.isScalar(key)
          ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL
          : typeof key === "object"));
    ctx = Object.assign({}, ctx, {
      allNullValues: false,
      implicitKey: !explicitKey && (simpleKeys || !allNullValues),
      indent: indent + indentStep,
    });
    let keyCommentDone = false;
    let chompKeep = false;
    let str = stringify.stringify(
      key,
      ctx,
      () => (keyCommentDone = true),
      () => (chompKeep = true),
    );
    if (!explicitKey && !ctx.inFlow && str.length > 1024) {
      if (simpleKeys)
        throw new Error(
          "With simple keys, single line scalar must not span more than 1024 characters",
        );
      explicitKey = true;
    }
    if (ctx.inFlow) {
      if (allNullValues || value == null) {
        if (keyCommentDone && onComment) onComment();
        return str === "" ? "?" : explicitKey ? `? ${str}` : str;
      }
    } else if ((allNullValues && !simpleKeys) || (value == null && explicitKey)) {
      str = `? ${str}`;
      if (keyComment && !keyCommentDone)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      else if (chompKeep && onChompKeep) onChompKeep();
      return str;
    }
    if (keyCommentDone) keyComment = null;
    if (explicitKey) {
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      str = `? ${str}\n${indent}:`;
    } else {
      str = `${str}:`;
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
    }
    let vsb, vcb, valueComment;
    if (identity.isNode(value)) {
      vsb = !!value.spaceBefore;
      vcb = value.commentBefore;
      valueComment = value.comment;
    } else {
      vsb = false;
      vcb = null;
      valueComment = null;
      if (value && typeof value === "object") value = doc.createNode(value);
    }
    ctx.implicitKey = false;
    if (!explicitKey && !keyComment && identity.isScalar(value)) ctx.indentAtStart = str.length + 1;
    chompKeep = false;
    if (
      !indentSeq &&
      indentStep.length >= 2 &&
      !ctx.inFlow &&
      !explicitKey &&
      identity.isSeq(value) &&
      !value.flow &&
      !value.tag &&
      !value.anchor
    )
      ctx.indent = ctx.indent.substring(2);
    let valueCommentDone = false;
    const valueStr = stringify.stringify(
      value,
      ctx,
      () => (valueCommentDone = true),
      () => (chompKeep = true),
    );
    let ws = " ";
    if (keyComment || vsb || vcb) {
      ws = vsb ? "\n" : "";
      if (vcb) {
        const cs = commentString(vcb);
        ws += `\n${stringifyComment.indentComment(cs, ctx.indent)}`;
      }
      if (valueStr === "" && !ctx.inFlow) {
        if (ws === "\n" && valueComment) ws = "\n\n";
      } else ws += `\n${ctx.indent}`;
    } else if (!explicitKey && identity.isCollection(value)) {
      const vs0 = valueStr[0];
      const nl0 = valueStr.indexOf("\n");
      const hasNewline = nl0 !== -1;
      const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
      if (hasNewline || !flow) {
        let hasPropsLine = false;
        if (hasNewline && (vs0 === "&" || vs0 === "!")) {
          let sp0 = valueStr.indexOf(" ");
          if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!")
            sp0 = valueStr.indexOf(" ", sp0 + 1);
          if (sp0 === -1 || nl0 < sp0) hasPropsLine = true;
        }
        if (!hasPropsLine) ws = `\n${ctx.indent}`;
      }
    } else if (valueStr === "" || valueStr[0] === "\n") ws = "";
    str += ws + valueStr;
    if (ctx.inFlow) {
      if (valueCommentDone && onComment) onComment();
    } else if (valueComment && !valueCommentDone)
      str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
    else if (chompKeep && onChompKeep) onChompKeep();
    return str;
  }
  exports.stringifyPair = stringifyPair;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/log.js
var require_log = /* @__PURE__ */ __commonJSMin((exports) => {
  var node_process$2 = __require("process");
  function debug(logLevel, ...messages) {
    if (logLevel === "debug") console.log(...messages);
  }
  function warn(logLevel, warning) {
    if (logLevel === "debug" || logLevel === "warn")
      if (typeof node_process$2.emitWarning === "function") node_process$2.emitWarning(warning);
      else console.warn(warning);
  }
  exports.debug = debug;
  exports.warn = warn;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  const MERGE_KEY = "<<";
  const merge = {
    identify: (value) =>
      value === MERGE_KEY || (typeof value === "symbol" && value.description === MERGE_KEY),
    default: "key",
    tag: "tag:yaml.org,2002:merge",
    test: /^<<$/,
    resolve: () =>
      Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), { addToJSMap: addMergeToJSMap }),
    stringify: () => MERGE_KEY,
  };
  const isMergeKey = (ctx, key) =>
    (merge.identify(key) ||
      (identity.isScalar(key) &&
        (!key.type || key.type === Scalar.Scalar.PLAIN) &&
        merge.identify(key.value))) &&
    ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
  function addMergeToJSMap(ctx, map, value) {
    value = ctx && identity.isAlias(value) ? value.resolve(ctx.doc) : value;
    if (identity.isSeq(value)) for (const it of value.items) mergeValue(ctx, map, it);
    else if (Array.isArray(value)) for (const it of value) mergeValue(ctx, map, it);
    else mergeValue(ctx, map, value);
  }
  function mergeValue(ctx, map, value) {
    const source = ctx && identity.isAlias(value) ? value.resolve(ctx.doc) : value;
    if (!identity.isMap(source)) throw new Error("Merge sources must be maps or map aliases");
    const srcMap = source.toJSON(null, ctx, Map);
    for (const [key, value] of srcMap)
      if (map instanceof Map) {
        if (!map.has(key)) map.set(key, value);
      } else if (map instanceof Set) map.add(key);
      else if (!Object.prototype.hasOwnProperty.call(map, key))
        Object.defineProperty(map, key, {
          value,
          writable: true,
          enumerable: true,
          configurable: true,
        });
    return map;
  }
  exports.addMergeToJSMap = addMergeToJSMap;
  exports.isMergeKey = isMergeKey;
  exports.merge = merge;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = /* @__PURE__ */ __commonJSMin((exports) => {
  var log = require_log();
  var merge = require_merge();
  var stringify = require_stringify$1();
  var identity = require_identity();
  var toJS = require_toJS();
  function addPairToJSMap(ctx, map, { key, value }) {
    if (identity.isNode(key) && key.addToJSMap) key.addToJSMap(ctx, map, value);
    else if (merge.isMergeKey(ctx, key)) merge.addMergeToJSMap(ctx, map, value);
    else {
      const jsKey = toJS.toJS(key, "", ctx);
      if (map instanceof Map) map.set(jsKey, toJS.toJS(value, jsKey, ctx));
      else if (map instanceof Set) map.add(jsKey);
      else {
        const stringKey = stringifyKey(key, jsKey, ctx);
        const jsValue = toJS.toJS(value, stringKey, ctx);
        if (stringKey in map)
          Object.defineProperty(map, stringKey, {
            value: jsValue,
            writable: true,
            enumerable: true,
            configurable: true,
          });
        else map[stringKey] = jsValue;
      }
    }
    return map;
  }
  function stringifyKey(key, jsKey, ctx) {
    if (jsKey === null) return "";
    if (typeof jsKey !== "object") return String(jsKey);
    if (identity.isNode(key) && ctx?.doc) {
      const strCtx = stringify.createStringifyContext(ctx.doc, {});
      strCtx.anchors = /* @__PURE__ */ new Set();
      for (const node of ctx.anchors.keys()) strCtx.anchors.add(node.anchor);
      strCtx.inFlow = true;
      strCtx.inStringifyKey = true;
      const strKey = key.toString(strCtx);
      if (!ctx.mapKeyWarned) {
        let jsonStr = JSON.stringify(strKey);
        if (jsonStr.length > 40) jsonStr = jsonStr.substring(0, 36) + '..."';
        log.warn(
          ctx.doc.options.logLevel,
          `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`,
        );
        ctx.mapKeyWarned = true;
      }
      return strKey;
    }
    return JSON.stringify(jsKey);
  }
  exports.addPairToJSMap = addPairToJSMap;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/Pair.js
var require_Pair = /* @__PURE__ */ __commonJSMin((exports) => {
  var createNode = require_createNode();
  var stringifyPair = require_stringifyPair();
  var addPairToJSMap = require_addPairToJSMap();
  var identity = require_identity();
  function createPair(key, value, ctx) {
    return new Pair(
      createNode.createNode(key, void 0, ctx),
      createNode.createNode(value, void 0, ctx),
    );
  }
  var Pair = class Pair {
    constructor(key, value = null) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
      this.key = key;
      this.value = value;
    }
    clone(schema) {
      let { key, value } = this;
      if (identity.isNode(key)) key = key.clone(schema);
      if (identity.isNode(value)) value = value.clone(schema);
      return new Pair(key, value);
    }
    toJSON(_, ctx) {
      const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
      return addPairToJSMap.addPairToJSMap(ctx, pair, this);
    }
    toString(ctx, onComment, onChompKeep) {
      return ctx?.doc
        ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep)
        : JSON.stringify(this);
    }
  };
  exports.Pair = Pair;
  exports.createPair = createPair;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var stringify = require_stringify$1();
  var stringifyComment = require_stringifyComment();
  function stringifyCollection(collection, ctx, options) {
    return ((ctx.inFlow ?? collection.flow) ? stringifyFlowCollection : stringifyBlockCollection)(
      collection,
      ctx,
      options,
    );
  }
  function stringifyBlockCollection(
    { comment, items },
    ctx,
    { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment },
  ) {
    const {
      indent,
      options: { commentString },
    } = ctx;
    const itemCtx = Object.assign({}, ctx, {
      indent: itemIndent,
      type: null,
    });
    let chompKeep = false;
    const lines = [];
    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      let comment = null;
      if (identity.isNode(item)) {
        if (!chompKeep && item.spaceBefore) lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
        if (item.comment) comment = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (!chompKeep && ik.spaceBefore) lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
        }
      }
      chompKeep = false;
      let str = stringify.stringify(
        item,
        itemCtx,
        () => (comment = null),
        () => (chompKeep = true),
      );
      if (comment) str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
      if (chompKeep && comment) chompKeep = false;
      lines.push(blockItemPrefix + str);
    }
    let str;
    if (lines.length === 0) str = flowChars.start + flowChars.end;
    else {
      str = lines[0];
      for (let i = 1; i < lines.length; ++i) {
        const line = lines[i];
        str += line ? `\n${indent}${line}` : "\n";
      }
    }
    if (comment) {
      str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
      if (onComment) onComment();
    } else if (chompKeep && onChompKeep) onChompKeep();
    return str;
  }
  function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
    const {
      indent,
      indentStep,
      flowCollectionPadding: fcPadding,
      options: { commentString },
    } = ctx;
    itemIndent += indentStep;
    const itemCtx = Object.assign({}, ctx, {
      indent: itemIndent,
      inFlow: true,
      type: null,
    });
    let reqNewline = false;
    let linesAtValue = 0;
    const lines = [];
    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      let comment = null;
      if (identity.isNode(item)) {
        if (item.spaceBefore) lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, false);
        if (item.comment) comment = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (ik.spaceBefore) lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, false);
          if (ik.comment) reqNewline = true;
        }
        const iv = identity.isNode(item.value) ? item.value : null;
        if (iv) {
          if (iv.comment) comment = iv.comment;
          if (iv.commentBefore) reqNewline = true;
        } else if (item.value == null && ik?.comment) comment = ik.comment;
      }
      if (comment) reqNewline = true;
      let str = stringify.stringify(item, itemCtx, () => (comment = null));
      reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
      if (i < items.length - 1) str += ",";
      else if (ctx.options.trailingComma) {
        if (ctx.options.lineWidth > 0)
          reqNewline ||
            (reqNewline =
              lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) >
              ctx.options.lineWidth);
        if (reqNewline) str += ",";
      }
      if (comment) str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
      lines.push(str);
      linesAtValue = lines.length;
    }
    const { start, end } = flowChars;
    if (lines.length === 0) return start + end;
    else {
      if (!reqNewline) {
        const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
        reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
      }
      if (reqNewline) {
        let str = start;
        for (const line of lines) str += line ? `\n${indentStep}${indent}${line}` : "\n";
        return `${str}\n${indent}${end}`;
      } else return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
    }
  }
  function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
    if (comment && chompKeep) comment = comment.replace(/^\n+/, "");
    if (comment) {
      const ic = stringifyComment.indentComment(commentString(comment), indent);
      lines.push(ic.trimStart());
    }
  }
  exports.stringifyCollection = stringifyCollection;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = /* @__PURE__ */ __commonJSMin((exports) => {
  var stringifyCollection = require_stringifyCollection();
  var addPairToJSMap = require_addPairToJSMap();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  function findPair(items, key) {
    const k = identity.isScalar(key) ? key.value : key;
    for (const it of items)
      if (identity.isPair(it)) {
        if (it.key === key || it.key === k) return it;
        if (identity.isScalar(it.key) && it.key.value === k) return it;
      }
  }
  var YAMLMap = class extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:map";
    }
    constructor(schema) {
      super(identity.MAP, schema);
      this.items = [];
    }
    /**
     * A generic collection parsing method that can be extended
     * to other node classes that inherit from YAMLMap
     */
    static from(schema, obj, ctx) {
      const { keepUndefined, replacer } = ctx;
      const map = new this(schema);
      const add = (key, value) => {
        if (typeof replacer === "function") value = replacer.call(obj, key, value);
        else if (Array.isArray(replacer) && !replacer.includes(key)) return;
        if (value !== void 0 || keepUndefined) map.items.push(Pair.createPair(key, value, ctx));
      };
      if (obj instanceof Map) for (const [key, value] of obj) add(key, value);
      else if (obj && typeof obj === "object")
        for (const key of Object.keys(obj)) add(key, obj[key]);
      if (typeof schema.sortMapEntries === "function") map.items.sort(schema.sortMapEntries);
      return map;
    }
    /**
     * Adds a value to the collection.
     *
     * @param overwrite - If not set `true`, using a key that is already in the
     *   collection will throw. Otherwise, overwrites the previous value.
     */
    add(pair, overwrite) {
      let _pair;
      if (identity.isPair(pair)) _pair = pair;
      else if (!pair || typeof pair !== "object" || !("key" in pair))
        _pair = new Pair.Pair(pair, pair?.value);
      else _pair = new Pair.Pair(pair.key, pair.value);
      const prev = findPair(this.items, _pair.key);
      const sortEntries = this.schema?.sortMapEntries;
      if (prev) {
        if (!overwrite) throw new Error(`Key ${_pair.key} already set`);
        if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
          prev.value.value = _pair.value;
        else prev.value = _pair.value;
      } else if (sortEntries) {
        const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
        if (i === -1) this.items.push(_pair);
        else this.items.splice(i, 0, _pair);
      } else this.items.push(_pair);
    }
    delete(key) {
      const it = findPair(this.items, key);
      if (!it) return false;
      return this.items.splice(this.items.indexOf(it), 1).length > 0;
    }
    get(key, keepScalar) {
      const node = findPair(this.items, key)?.value;
      return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
    }
    has(key) {
      return !!findPair(this.items, key);
    }
    set(key, value) {
      this.add(new Pair.Pair(key, value), true);
    }
    /**
     * @param ctx - Conversion context, originally set in Document#toJS()
     * @param {Class} Type - If set, forces the returned collection type
     * @returns Instance of Type, Map, or Object
     */
    toJSON(_, ctx, Type) {
      const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
      if (ctx?.onCreate) ctx.onCreate(map);
      for (const item of this.items) addPairToJSMap.addPairToJSMap(ctx, map, item);
      return map;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx) return JSON.stringify(this);
      for (const item of this.items)
        if (!identity.isPair(item))
          throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
      if (!ctx.allNullValues && this.hasAllNullValues(false))
        ctx = Object.assign({}, ctx, { allNullValues: true });
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "",
        flowChars: {
          start: "{",
          end: "}",
        },
        itemIndent: ctx.indent || "",
        onChompKeep,
        onComment,
      });
    }
  };
  exports.YAMLMap = YAMLMap;
  exports.findPair = findPair;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/common/map.js
var require_map = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var YAMLMap = require_YAMLMap();
  exports.map = {
    collection: "map",
    default: true,
    nodeClass: YAMLMap.YAMLMap,
    tag: "tag:yaml.org,2002:map",
    resolve(map, onError) {
      if (!identity.isMap(map)) onError("Expected a mapping for this tag");
      return map;
    },
    createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx),
  };
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = /* @__PURE__ */ __commonJSMin((exports) => {
  var createNode = require_createNode();
  var stringifyCollection = require_stringifyCollection();
  var Collection = require_Collection();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var toJS = require_toJS();
  var YAMLSeq = class extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:seq";
    }
    constructor(schema) {
      super(identity.SEQ, schema);
      this.items = [];
    }
    add(value) {
      this.items.push(value);
    }
    /**
     * Removes a value from the collection.
     *
     * `key` must contain a representation of an integer for this to succeed.
     * It may be wrapped in a `Scalar`.
     *
     * @returns `true` if the item was found and removed.
     */
    delete(key) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number") return false;
      return this.items.splice(idx, 1).length > 0;
    }
    get(key, keepScalar) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number") return void 0;
      const it = this.items[idx];
      return !keepScalar && identity.isScalar(it) ? it.value : it;
    }
    /**
     * Checks if the collection includes a value with the key `key`.
     *
     * `key` must contain a representation of an integer for this to succeed.
     * It may be wrapped in a `Scalar`.
     */
    has(key) {
      const idx = asItemIndex(key);
      return typeof idx === "number" && idx < this.items.length;
    }
    /**
     * Sets a value in this collection. For `!!set`, `value` needs to be a
     * boolean to add/remove the item from the set.
     *
     * If `key` does not contain a representation of an integer, this will throw.
     * It may be wrapped in a `Scalar`.
     */
    set(key, value) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number") throw new Error(`Expected a valid index, not ${key}.`);
      const prev = this.items[idx];
      if (identity.isScalar(prev) && Scalar.isScalarValue(value)) prev.value = value;
      else this.items[idx] = value;
    }
    toJSON(_, ctx) {
      const seq = [];
      if (ctx?.onCreate) ctx.onCreate(seq);
      let i = 0;
      for (const item of this.items) seq.push(toJS.toJS(item, String(i++), ctx));
      return seq;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx) return JSON.stringify(this);
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "- ",
        flowChars: {
          start: "[",
          end: "]",
        },
        itemIndent: (ctx.indent || "") + "  ",
        onChompKeep,
        onComment,
      });
    }
    static from(schema, obj, ctx) {
      const { replacer } = ctx;
      const seq = new this(schema);
      if (obj && Symbol.iterator in Object(obj)) {
        let i = 0;
        for (let it of obj) {
          if (typeof replacer === "function") {
            const key = obj instanceof Set ? it : String(i++);
            it = replacer.call(obj, key, it);
          }
          seq.items.push(createNode.createNode(it, void 0, ctx));
        }
      }
      return seq;
    }
  };
  function asItemIndex(key) {
    let idx = identity.isScalar(key) ? key.value : key;
    if (idx && typeof idx === "string") idx = Number(idx);
    return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
  }
  exports.YAMLSeq = YAMLSeq;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/common/seq.js
var require_seq = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var YAMLSeq = require_YAMLSeq();
  exports.seq = {
    collection: "seq",
    default: true,
    nodeClass: YAMLSeq.YAMLSeq,
    tag: "tag:yaml.org,2002:seq",
    resolve(seq, onError) {
      if (!identity.isSeq(seq)) onError("Expected a sequence for this tag");
      return seq;
    },
    createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx),
  };
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/common/string.js
var require_string = /* @__PURE__ */ __commonJSMin((exports) => {
  var stringifyString = require_stringifyString();
  exports.string = {
    identify: (value) => typeof value === "string",
    default: true,
    tag: "tag:yaml.org,2002:str",
    resolve: (str) => str,
    stringify(item, ctx, onComment, onChompKeep) {
      ctx = Object.assign({ actualString: true }, ctx);
      return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
    },
  };
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/common/null.js
var require_null = /* @__PURE__ */ __commonJSMin((exports) => {
  var Scalar = require_Scalar();
  const nullTag = {
    identify: (value) => value == null,
    createNode: () => new Scalar.Scalar(null),
    default: true,
    tag: "tag:yaml.org,2002:null",
    test: /^(?:~|[Nn]ull|NULL)?$/,
    resolve: () => new Scalar.Scalar(null),
    stringify: ({ source }, ctx) =>
      typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr,
  };
  exports.nullTag = nullTag;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/core/bool.js
var require_bool$1 = /* @__PURE__ */ __commonJSMin((exports) => {
  var Scalar = require_Scalar();
  const boolTag = {
    identify: (value) => typeof value === "boolean",
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
    resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
    stringify({ source, value }, ctx) {
      if (source && boolTag.test.test(source)) {
        if (value === (source[0] === "t" || source[0] === "T")) return source;
      }
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    },
  };
  exports.boolTag = boolTag;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = /* @__PURE__ */ __commonJSMin((exports) => {
  function stringifyNumber({ format, minFractionDigits, tag, value }) {
    if (typeof value === "bigint") return String(value);
    const num = typeof value === "number" ? value : Number(value);
    if (!isFinite(num)) return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
    let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
    if (
      !format &&
      minFractionDigits &&
      (!tag || tag === "tag:yaml.org,2002:float") &&
      /^\d/.test(n)
    ) {
      let i = n.indexOf(".");
      if (i < 0) {
        i = n.length;
        n += ".";
      }
      let d = minFractionDigits - (n.length - i - 1);
      while (d-- > 0) n += "0";
    }
    return n;
  }
  exports.stringifyNumber = stringifyNumber;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/core/float.js
var require_float$1 = /* @__PURE__ */ __commonJSMin((exports) => {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  const floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) =>
      str.slice(-3).toLowerCase() === "nan"
        ? NaN
        : str[0] === "-"
          ? Number.NEGATIVE_INFINITY
          : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber,
  };
  const floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    },
  };
  exports.float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str));
      const dot = str.indexOf(".");
      if (dot !== -1 && str[str.length - 1] === "0") node.minFractionDigits = str.length - dot - 1;
      return node;
    },
    stringify: stringifyNumber.stringifyNumber,
  };
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/core/int.js
var require_int$1 = /* @__PURE__ */ __commonJSMin((exports) => {
  var stringifyNumber = require_stringifyNumber();
  const intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  const intResolve = (str, offset, radix, { intAsBigInt }) =>
    intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value) && value >= 0) return prefix + value.toString(radix);
    return stringifyNumber.stringifyNumber(node);
  }
  const intOct = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^0o[0-7]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
    stringify: (node) => intStringify(node, 8, "0o"),
  };
  const int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber,
  };
  const intHex = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^0x[0-9a-fA-F]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x"),
  };
  exports.int = int;
  exports.intHex = intHex;
  exports.intOct = intOct;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/core/schema.js
var require_schema$2 = /* @__PURE__ */ __commonJSMin((exports) => {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool$1();
  var float = require_float$1();
  var int = require_int$1();
  exports.schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.boolTag,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float,
  ];
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/json/schema.js
var require_schema$1 = /* @__PURE__ */ __commonJSMin((exports) => {
  var Scalar = require_Scalar();
  var map = require_map();
  var seq = require_seq();
  function intIdentify(value) {
    return typeof value === "bigint" || Number.isInteger(value);
  }
  const stringifyJSON = ({ value }) => JSON.stringify(value);
  const jsonScalars = [
    {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify: stringifyJSON,
    },
    {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^null$/,
      resolve: () => null,
      stringify: stringifyJSON,
    },
    {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^true$|^false$/,
      resolve: (str) => str === "true",
      stringify: stringifyJSON,
    },
    {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^-?(?:0|[1-9][0-9]*)$/,
      resolve: (str, _onError, { intAsBigInt }) => (intAsBigInt ? BigInt(str) : parseInt(str, 10)),
      stringify: ({ value }) => (intIdentify(value) ? value.toString() : JSON.stringify(value)),
    },
    {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
      resolve: (str) => parseFloat(str),
      stringify: stringifyJSON,
    },
  ];
  exports.schema = [map.map, seq.seq].concat(jsonScalars, {
    default: true,
    tag: "",
    test: /^/,
    resolve(str, onError) {
      onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
      return str;
    },
  });
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = /* @__PURE__ */ __commonJSMin((exports) => {
  var node_buffer = __require("buffer");
  var Scalar = require_Scalar();
  var stringifyString = require_stringifyString();
  exports.binary = {
    identify: (value) => value instanceof Uint8Array,
    default: false,
    tag: "tag:yaml.org,2002:binary",
    /**
     * Returns a Buffer in node and an Uint8Array in browsers
     *
     * To use the resulting buffer as an image, you'll want to do something like:
     *
     *   const blob = new Blob([buffer], { type: 'image/jpeg' })
     *   document.querySelector('#photo').src = URL.createObjectURL(blob)
     */
    resolve(src, onError) {
      if (typeof node_buffer.Buffer === "function") return node_buffer.Buffer.from(src, "base64");
      else if (typeof atob === "function") {
        const str = atob(src.replace(/[\n\r]/g, ""));
        const buffer = new Uint8Array(str.length);
        for (let i = 0; i < str.length; ++i) buffer[i] = str.charCodeAt(i);
        return buffer;
      } else {
        onError(
          "This environment does not support reading binary tags; either Buffer or atob is required",
        );
        return src;
      }
    },
    stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
      if (!value) return "";
      const buf = value;
      let str;
      if (typeof node_buffer.Buffer === "function")
        str =
          buf instanceof node_buffer.Buffer
            ? buf.toString("base64")
            : node_buffer.Buffer.from(buf.buffer).toString("base64");
      else if (typeof btoa === "function") {
        let s = "";
        for (let i = 0; i < buf.length; ++i) s += String.fromCharCode(buf[i]);
        str = btoa(s);
      } else
        throw new Error(
          "This environment does not support writing binary tags; either Buffer or btoa is required",
        );
      type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        const lineWidth = Math.max(
          ctx.options.lineWidth - ctx.indent.length,
          ctx.options.minContentWidth,
        );
        const n = Math.ceil(str.length / lineWidth);
        const lines = new Array(n);
        for (let i = 0, o = 0; i < n; ++i, o += lineWidth) lines[i] = str.substr(o, lineWidth);
        str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
      }
      return stringifyString.stringifyString(
        {
          comment,
          type,
          value: str,
        },
        ctx,
        onComment,
        onChompKeep,
      );
    },
  };
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  var YAMLSeq = require_YAMLSeq();
  function resolvePairs(seq, onError) {
    if (identity.isSeq(seq))
      for (let i = 0; i < seq.items.length; ++i) {
        let item = seq.items[i];
        if (identity.isPair(item)) continue;
        else if (identity.isMap(item)) {
          if (item.items.length > 1) onError("Each pair must have its own sequence indicator");
          const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
          if (item.commentBefore)
            pair.key.commentBefore = pair.key.commentBefore
              ? `${item.commentBefore}\n${pair.key.commentBefore}`
              : item.commentBefore;
          if (item.comment) {
            const cn = pair.value ?? pair.key;
            cn.comment = cn.comment ? `${item.comment}\n${cn.comment}` : item.comment;
          }
          item = pair;
        }
        seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
      }
    else onError("Expected a sequence for this tag");
    return seq;
  }
  function createPairs(schema, iterable, ctx) {
    const { replacer } = ctx;
    const pairs = new YAMLSeq.YAMLSeq(schema);
    pairs.tag = "tag:yaml.org,2002:pairs";
    let i = 0;
    if (iterable && Symbol.iterator in Object(iterable))
      for (let it of iterable) {
        if (typeof replacer === "function") it = replacer.call(iterable, String(i++), it);
        let key, value;
        if (Array.isArray(it))
          if (it.length === 2) {
            key = it[0];
            value = it[1];
          } else throw new TypeError(`Expected [key, value] tuple: ${it}`);
        else if (it && it instanceof Object) {
          const keys = Object.keys(it);
          if (keys.length === 1) {
            key = keys[0];
            value = it[key];
          } else throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
        } else key = it;
        pairs.items.push(Pair.createPair(key, value, ctx));
      }
    return pairs;
  }
  const pairs = {
    collection: "seq",
    default: false,
    tag: "tag:yaml.org,2002:pairs",
    resolve: resolvePairs,
    createNode: createPairs,
  };
  exports.createPairs = createPairs;
  exports.pairs = pairs;
  exports.resolvePairs = resolvePairs;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var toJS = require_toJS();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var pairs = require_pairs();
  var YAMLOMap = class YAMLOMap extends YAMLSeq.YAMLSeq {
    constructor() {
      super();
      this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
      this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
      this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
      this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
      this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
      this.tag = YAMLOMap.tag;
    }
    /**
     * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
     * but TypeScript won't allow widening the signature of a child method.
     */
    toJSON(_, ctx) {
      if (!ctx) return super.toJSON(_);
      const map = /* @__PURE__ */ new Map();
      if (ctx?.onCreate) ctx.onCreate(map);
      for (const pair of this.items) {
        let key, value;
        if (identity.isPair(pair)) {
          key = toJS.toJS(pair.key, "", ctx);
          value = toJS.toJS(pair.value, key, ctx);
        } else key = toJS.toJS(pair, "", ctx);
        if (map.has(key)) throw new Error("Ordered maps must not include duplicate keys");
        map.set(key, value);
      }
      return map;
    }
    static from(schema, iterable, ctx) {
      const pairs$1 = pairs.createPairs(schema, iterable, ctx);
      const omap = new this();
      omap.items = pairs$1.items;
      return omap;
    }
  };
  YAMLOMap.tag = "tag:yaml.org,2002:omap";
  const omap = {
    collection: "seq",
    identify: (value) => value instanceof Map,
    nodeClass: YAMLOMap,
    default: false,
    tag: "tag:yaml.org,2002:omap",
    resolve(seq, onError) {
      const pairs$1 = pairs.resolvePairs(seq, onError);
      const seenKeys = [];
      for (const { key } of pairs$1.items)
        if (identity.isScalar(key))
          if (seenKeys.includes(key.value))
            onError(`Ordered maps must not include duplicate keys: ${key.value}`);
          else seenKeys.push(key.value);
      return Object.assign(new YAMLOMap(), pairs$1);
    },
    createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx),
  };
  exports.YAMLOMap = YAMLOMap;
  exports.omap = omap;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool = /* @__PURE__ */ __commonJSMin((exports) => {
  var Scalar = require_Scalar();
  function boolStringify({ value, source }, ctx) {
    if (source && (value ? trueTag : falseTag).test.test(source)) return source;
    return value ? ctx.options.trueStr : ctx.options.falseStr;
  }
  const trueTag = {
    identify: (value) => value === true,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
    resolve: () => new Scalar.Scalar(true),
    stringify: boolStringify,
  };
  const falseTag = {
    identify: (value) => value === false,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
    resolve: () => new Scalar.Scalar(false),
    stringify: boolStringify,
  };
  exports.falseTag = falseTag;
  exports.trueTag = trueTag;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float = /* @__PURE__ */ __commonJSMin((exports) => {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  const floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) =>
      str.slice(-3).toLowerCase() === "nan"
        ? NaN
        : str[0] === "-"
          ? Number.NEGATIVE_INFINITY
          : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber,
  };
  const floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str.replace(/_/g, "")),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    },
  };
  exports.float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
      const dot = str.indexOf(".");
      if (dot !== -1) {
        const f = str.substring(dot + 1).replace(/_/g, "");
        if (f[f.length - 1] === "0") node.minFractionDigits = f.length;
      }
      return node;
    },
    stringify: stringifyNumber.stringifyNumber,
  };
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int = /* @__PURE__ */ __commonJSMin((exports) => {
  var stringifyNumber = require_stringifyNumber();
  const intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  function intResolve(str, offset, radix, { intAsBigInt }) {
    const sign = str[0];
    if (sign === "-" || sign === "+") offset += 1;
    str = str.substring(offset).replace(/_/g, "");
    if (intAsBigInt) {
      switch (radix) {
        case 2:
          str = `0b${str}`;
          break;
        case 8:
          str = `0o${str}`;
          break;
        case 16:
          str = `0x${str}`;
          break;
      }
      const n = BigInt(str);
      return sign === "-" ? BigInt(-1) * n : n;
    }
    const n = parseInt(str, radix);
    return sign === "-" ? -1 * n : n;
  }
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value)) {
      const str = value.toString(radix);
      return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
    }
    return stringifyNumber.stringifyNumber(node);
  }
  const intBin = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "BIN",
    test: /^[-+]?0b[0-1_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
    stringify: (node) => intStringify(node, 2, "0b"),
  };
  const intOct = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^[-+]?0[0-7_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
    stringify: (node) => intStringify(node, 8, "0"),
  };
  const int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9][0-9_]*$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber,
  };
  const intHex = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^[-+]?0x[0-9a-fA-F_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x"),
  };
  exports.int = int;
  exports.intBin = intBin;
  exports.intHex = intHex;
  exports.intOct = intOct;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var YAMLSet = class YAMLSet extends YAMLMap.YAMLMap {
    constructor(schema) {
      super(schema);
      this.tag = YAMLSet.tag;
    }
    add(key) {
      let pair;
      if (identity.isPair(key)) pair = key;
      else if (
        key &&
        typeof key === "object" &&
        "key" in key &&
        "value" in key &&
        key.value === null
      )
        pair = new Pair.Pair(key.key, null);
      else pair = new Pair.Pair(key, null);
      if (!YAMLMap.findPair(this.items, pair.key)) this.items.push(pair);
    }
    /**
     * If `keepPair` is `true`, returns the Pair matching `key`.
     * Otherwise, returns the value of that Pair's key.
     */
    get(key, keepPair) {
      const pair = YAMLMap.findPair(this.items, key);
      return !keepPair && identity.isPair(pair)
        ? identity.isScalar(pair.key)
          ? pair.key.value
          : pair.key
        : pair;
    }
    set(key, value) {
      if (typeof value !== "boolean")
        throw new Error(
          `Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`,
        );
      const prev = YAMLMap.findPair(this.items, key);
      if (prev && !value) this.items.splice(this.items.indexOf(prev), 1);
      else if (!prev && value) this.items.push(new Pair.Pair(key));
    }
    toJSON(_, ctx) {
      return super.toJSON(_, ctx, Set);
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx) return JSON.stringify(this);
      if (this.hasAllNullValues(true))
        return super.toString(
          Object.assign({}, ctx, { allNullValues: true }),
          onComment,
          onChompKeep,
        );
      else throw new Error("Set items must all have null values");
    }
    static from(schema, iterable, ctx) {
      const { replacer } = ctx;
      const set = new this(schema);
      if (iterable && Symbol.iterator in Object(iterable))
        for (let value of iterable) {
          if (typeof replacer === "function") value = replacer.call(iterable, value, value);
          set.items.push(Pair.createPair(value, null, ctx));
        }
      return set;
    }
  };
  YAMLSet.tag = "tag:yaml.org,2002:set";
  const set = {
    collection: "map",
    identify: (value) => value instanceof Set,
    nodeClass: YAMLSet,
    default: false,
    tag: "tag:yaml.org,2002:set",
    createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
    resolve(map, onError) {
      if (identity.isMap(map))
        if (map.hasAllNullValues(true)) return Object.assign(new YAMLSet(), map);
        else onError("Set items must all have null values");
      else onError("Expected a mapping for this tag");
      return map;
    },
  };
  exports.YAMLSet = YAMLSet;
  exports.set = set;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = /* @__PURE__ */ __commonJSMin((exports) => {
  var stringifyNumber = require_stringifyNumber();
  /** Internal types handle bigint as number, because TS can't figure it out. */
  function parseSexagesimal(str, asBigInt) {
    const sign = str[0];
    const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
    const num = (n) => (asBigInt ? BigInt(n) : Number(n));
    const res = parts
      .replace(/_/g, "")
      .split(":")
      .reduce((res, p) => res * num(60) + num(p), num(0));
    return sign === "-" ? num(-1) * res : res;
  }
  /**
   * hhhh:mm:ss.sss
   *
   * Internal types handle bigint as number, because TS can't figure it out.
   */
  function stringifySexagesimal(node) {
    let { value } = node;
    let num = (n) => n;
    if (typeof value === "bigint") num = (n) => BigInt(n);
    else if (isNaN(value) || !isFinite(value)) return stringifyNumber.stringifyNumber(node);
    let sign = "";
    if (value < 0) {
      sign = "-";
      value *= num(-1);
    }
    const _60 = num(60);
    const parts = [value % _60];
    if (value < 60) parts.unshift(0);
    else {
      value = (value - parts[0]) / _60;
      parts.unshift(value % _60);
      if (value >= 60) {
        value = (value - parts[0]) / _60;
        parts.unshift(value);
      }
    }
    return (
      sign +
      parts
        .map((n) => String(n).padStart(2, "0"))
        .join(":")
        .replace(/000000\d*$/, "")
    );
  }
  const intTime = {
    identify: (value) => typeof value === "bigint" || Number.isInteger(value),
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
    resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
    stringify: stringifySexagesimal,
  };
  const floatTime = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
    resolve: (str) => parseSexagesimal(str, false),
    stringify: stringifySexagesimal,
  };
  const timestamp = {
    identify: (value) => value instanceof Date,
    default: true,
    tag: "tag:yaml.org,2002:timestamp",
    test: RegExp(
      "^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$",
    ),
    resolve(str) {
      const match = str.match(timestamp.test);
      if (!match) throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
      const [, year, month, day, hour, minute, second] = match.map(Number);
      const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
      let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
      const tz = match[8];
      if (tz && tz !== "Z") {
        let d = parseSexagesimal(tz, false);
        if (Math.abs(d) < 30) d *= 60;
        date -= 6e4 * d;
      }
      return new Date(date);
    },
    stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? "",
  };
  exports.floatTime = floatTime;
  exports.intTime = intTime;
  exports.timestamp = timestamp;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema = /* @__PURE__ */ __commonJSMin((exports) => {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var binary = require_binary();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var set = require_set();
  var timestamp = require_timestamp();
  exports.schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.trueTag,
    bool.falseTag,
    int.intBin,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float,
    binary.binary,
    merge.merge,
    omap.omap,
    pairs.pairs,
    set.set,
    timestamp.intTime,
    timestamp.floatTime,
    timestamp.timestamp,
  ];
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/tags.js
var require_tags = /* @__PURE__ */ __commonJSMin((exports) => {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool$1();
  var float = require_float$1();
  var int = require_int$1();
  var schema = require_schema$2();
  var schema$1 = require_schema$1();
  var binary = require_binary();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var schema$2 = require_schema();
  var set = require_set();
  var timestamp = require_timestamp();
  const schemas = new Map([
    ["core", schema.schema],
    ["failsafe", [map.map, seq.seq, string.string]],
    ["json", schema$1.schema],
    ["yaml11", schema$2.schema],
    ["yaml-1.1", schema$2.schema],
  ]);
  const tagsByName = {
    binary: binary.binary,
    bool: bool.boolTag,
    float: float.float,
    floatExp: float.floatExp,
    floatNaN: float.floatNaN,
    floatTime: timestamp.floatTime,
    int: int.int,
    intHex: int.intHex,
    intOct: int.intOct,
    intTime: timestamp.intTime,
    map: map.map,
    merge: merge.merge,
    null: _null.nullTag,
    omap: omap.omap,
    pairs: pairs.pairs,
    seq: seq.seq,
    set: set.set,
    timestamp: timestamp.timestamp,
  };
  const coreKnownTags = {
    "tag:yaml.org,2002:binary": binary.binary,
    "tag:yaml.org,2002:merge": merge.merge,
    "tag:yaml.org,2002:omap": omap.omap,
    "tag:yaml.org,2002:pairs": pairs.pairs,
    "tag:yaml.org,2002:set": set.set,
    "tag:yaml.org,2002:timestamp": timestamp.timestamp,
  };
  function getTags(customTags, schemaName, addMergeTag) {
    const schemaTags = schemas.get(schemaName);
    if (schemaTags && !customTags)
      return addMergeTag && !schemaTags.includes(merge.merge)
        ? schemaTags.concat(merge.merge)
        : schemaTags.slice();
    let tags = schemaTags;
    if (!tags)
      if (Array.isArray(customTags)) tags = [];
      else {
        const keys = Array.from(schemas.keys())
          .filter((key) => key !== "yaml11")
          .map((key) => JSON.stringify(key))
          .join(", ");
        throw new Error(
          `Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`,
        );
      }
    if (Array.isArray(customTags)) for (const tag of customTags) tags = tags.concat(tag);
    else if (typeof customTags === "function") tags = customTags(tags.slice());
    if (addMergeTag) tags = tags.concat(merge.merge);
    return tags.reduce((tags, tag) => {
      const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
      if (!tagObj) {
        const tagName = JSON.stringify(tag);
        const keys = Object.keys(tagsByName)
          .map((key) => JSON.stringify(key))
          .join(", ");
        throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
      }
      if (!tags.includes(tagObj)) tags.push(tagObj);
      return tags;
    }, []);
  }
  exports.coreKnownTags = coreKnownTags;
  exports.getTags = getTags;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/schema/Schema.js
var require_Schema = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var map = require_map();
  var seq = require_seq();
  var string = require_string();
  var tags = require_tags();
  const sortMapEntriesByKey = (a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  exports.Schema = class Schema {
    constructor({
      compat,
      customTags,
      merge,
      resolveKnownTags,
      schema,
      sortMapEntries,
      toStringDefaults,
    }) {
      this.compat = Array.isArray(compat)
        ? tags.getTags(compat, "compat")
        : compat
          ? tags.getTags(null, compat)
          : null;
      this.name = (typeof schema === "string" && schema) || "core";
      this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
      this.tags = tags.getTags(customTags, this.name, merge);
      this.toStringOptions = toStringDefaults ?? null;
      Object.defineProperty(this, identity.MAP, { value: map.map });
      Object.defineProperty(this, identity.SCALAR, { value: string.string });
      Object.defineProperty(this, identity.SEQ, { value: seq.seq });
      this.sortMapEntries =
        typeof sortMapEntries === "function"
          ? sortMapEntries
          : sortMapEntries === true
            ? sortMapEntriesByKey
            : null;
    }
    clone() {
      const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
      copy.tags = this.tags.slice();
      return copy;
    }
  };
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var stringify = require_stringify$1();
  var stringifyComment = require_stringifyComment();
  function stringifyDocument(doc, options) {
    const lines = [];
    let hasDirectives = options.directives === true;
    if (options.directives !== false && doc.directives) {
      const dir = doc.directives.toString(doc);
      if (dir) {
        lines.push(dir);
        hasDirectives = true;
      } else if (doc.directives.docStart) hasDirectives = true;
    }
    if (hasDirectives) lines.push("---");
    const ctx = stringify.createStringifyContext(doc, options);
    const { commentString } = ctx.options;
    if (doc.commentBefore) {
      if (lines.length !== 1) lines.unshift("");
      const cs = commentString(doc.commentBefore);
      lines.unshift(stringifyComment.indentComment(cs, ""));
    }
    let chompKeep = false;
    let contentComment = null;
    if (doc.contents) {
      if (identity.isNode(doc.contents)) {
        if (doc.contents.spaceBefore && hasDirectives) lines.push("");
        if (doc.contents.commentBefore) {
          const cs = commentString(doc.contents.commentBefore);
          lines.push(stringifyComment.indentComment(cs, ""));
        }
        ctx.forceBlockIndent = !!doc.comment;
        contentComment = doc.contents.comment;
      }
      const onChompKeep = contentComment ? void 0 : () => (chompKeep = true);
      let body = stringify.stringify(doc.contents, ctx, () => (contentComment = null), onChompKeep);
      if (contentComment)
        body += stringifyComment.lineComment(body, "", commentString(contentComment));
      if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---")
        lines[lines.length - 1] = `--- ${body}`;
      else lines.push(body);
    } else lines.push(stringify.stringify(doc.contents, ctx));
    if (doc.directives?.docEnd)
      if (doc.comment) {
        const cs = commentString(doc.comment);
        if (cs.includes("\n")) {
          lines.push("...");
          lines.push(stringifyComment.indentComment(cs, ""));
        } else lines.push(`... ${cs}`);
      } else lines.push("...");
    else {
      let dc = doc.comment;
      if (dc && chompKeep) dc = dc.replace(/^\n+/, "");
      if (dc) {
        if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "") lines.push("");
        lines.push(stringifyComment.indentComment(commentString(dc), ""));
      }
    }
    return lines.join("\n") + "\n";
  }
  exports.stringifyDocument = stringifyDocument;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/doc/Document.js
var require_Document = /* @__PURE__ */ __commonJSMin((exports) => {
  var Alias = require_Alias();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var toJS = require_toJS();
  var Schema = require_Schema();
  var stringifyDocument = require_stringifyDocument();
  var anchors = require_anchors();
  var applyReviver = require_applyReviver();
  var createNode = require_createNode();
  var directives = require_directives();
  var Document = class Document {
    constructor(value, replacer, options) {
      /** A comment before this Document */
      this.commentBefore = null;
      /** A comment immediately after this Document */
      this.comment = null;
      /** Errors encountered during parsing. */
      this.errors = [];
      /** Warnings encountered during parsing. */
      this.warnings = [];
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) _replacer = replacer;
      else if (options === void 0 && replacer) {
        options = replacer;
        replacer = void 0;
      }
      const opt = Object.assign(
        {
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2",
        },
        options,
      );
      this.options = opt;
      let { version } = opt;
      if (options?._directives) {
        this.directives = options._directives.atDocument();
        if (this.directives.yaml.explicit) version = this.directives.yaml.version;
      } else this.directives = new directives.Directives({ version });
      this.setSchema(version, options);
      this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
    }
    /**
     * Create a deep copy of this Document and its contents.
     *
     * Custom Node values that inherit from `Object` still refer to their original instances.
     */
    clone() {
      const copy = Object.create(Document.prototype, {
        [identity.NODE_TYPE]: { value: identity.DOC },
      });
      copy.commentBefore = this.commentBefore;
      copy.comment = this.comment;
      copy.errors = this.errors.slice();
      copy.warnings = this.warnings.slice();
      copy.options = Object.assign({}, this.options);
      if (this.directives) copy.directives = this.directives.clone();
      copy.schema = this.schema.clone();
      copy.contents = identity.isNode(this.contents)
        ? this.contents.clone(copy.schema)
        : this.contents;
      if (this.range) copy.range = this.range.slice();
      return copy;
    }
    /** Adds a value to the document. */
    add(value) {
      if (assertCollection(this.contents)) this.contents.add(value);
    }
    /** Adds a value to the document. */
    addIn(path, value) {
      if (assertCollection(this.contents)) this.contents.addIn(path, value);
    }
    /**
     * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
     *
     * If `node` already has an anchor, `name` is ignored.
     * Otherwise, the `node.anchor` value will be set to `name`,
     * or if an anchor with that name is already present in the document,
     * `name` will be used as a prefix for a new unique anchor.
     * If `name` is undefined, the generated anchor will use 'a' as a prefix.
     */
    createAlias(node, name) {
      if (!node.anchor) {
        const prev = anchors.anchorNames(this);
        node.anchor = !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
      }
      return new Alias.Alias(node.anchor);
    }
    createNode(value, replacer, options) {
      let _replacer = void 0;
      if (typeof replacer === "function") {
        value = replacer.call({ "": value }, "", value);
        _replacer = replacer;
      } else if (Array.isArray(replacer)) {
        const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
        const asStr = replacer.filter(keyToStr).map(String);
        if (asStr.length > 0) replacer = replacer.concat(asStr);
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
        replacer = void 0;
      }
      const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } =
        options ?? {};
      const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
        this,
        anchorPrefix || "a",
      );
      const ctx = {
        aliasDuplicateObjects: aliasDuplicateObjects ?? true,
        keepUndefined: keepUndefined ?? false,
        onAnchor,
        onTagObj,
        replacer: _replacer,
        schema: this.schema,
        sourceObjects,
      };
      const node = createNode.createNode(value, tag, ctx);
      if (flow && identity.isCollection(node)) node.flow = true;
      setAnchors();
      return node;
    }
    /**
     * Convert a key and a value into a `Pair` using the current schema,
     * recursively wrapping all values as `Scalar` or `Collection` nodes.
     */
    createPair(key, value, options = {}) {
      const k = this.createNode(key, null, options);
      const v = this.createNode(value, null, options);
      return new Pair.Pair(k, v);
    }
    /**
     * Removes a value from the document.
     * @returns `true` if the item was found and removed.
     */
    delete(key) {
      return assertCollection(this.contents) ? this.contents.delete(key) : false;
    }
    /**
     * Removes a value from the document.
     * @returns `true` if the item was found and removed.
     */
    deleteIn(path) {
      if (Collection.isEmptyPath(path)) {
        if (this.contents == null) return false;
        this.contents = null;
        return true;
      }
      return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
    }
    /**
     * Returns item at `key`, or `undefined` if not found. By default unwraps
     * scalar values from their surrounding node; to disable set `keepScalar` to
     * `true` (collections are always returned intact).
     */
    get(key, keepScalar) {
      return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
    }
    /**
     * Returns item at `path`, or `undefined` if not found. By default unwraps
     * scalar values from their surrounding node; to disable set `keepScalar` to
     * `true` (collections are always returned intact).
     */
    getIn(path, keepScalar) {
      if (Collection.isEmptyPath(path))
        return !keepScalar && identity.isScalar(this.contents)
          ? this.contents.value
          : this.contents;
      return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
    }
    /**
     * Checks if the document includes a value with the key `key`.
     */
    has(key) {
      return identity.isCollection(this.contents) ? this.contents.has(key) : false;
    }
    /**
     * Checks if the document includes a value at `path`.
     */
    hasIn(path) {
      if (Collection.isEmptyPath(path)) return this.contents !== void 0;
      return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
    }
    /**
     * Sets a value in this document. For `!!set`, `value` needs to be a
     * boolean to add/remove the item from the set.
     */
    set(key, value) {
      if (this.contents == null)
        this.contents = Collection.collectionFromPath(this.schema, [key], value);
      else if (assertCollection(this.contents)) this.contents.set(key, value);
    }
    /**
     * Sets a value in this document. For `!!set`, `value` needs to be a
     * boolean to add/remove the item from the set.
     */
    setIn(path, value) {
      if (Collection.isEmptyPath(path)) this.contents = value;
      else if (this.contents == null)
        this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
      else if (assertCollection(this.contents)) this.contents.setIn(path, value);
    }
    /**
     * Change the YAML version and schema used by the document.
     * A `null` version disables support for directives, explicit tags, anchors, and aliases.
     * It also requires the `schema` option to be given as a `Schema` instance value.
     *
     * Overrides all previously set schema options.
     */
    setSchema(version, options = {}) {
      if (typeof version === "number") version = String(version);
      let opt;
      switch (version) {
        case "1.1":
          if (this.directives) this.directives.yaml.version = "1.1";
          else this.directives = new directives.Directives({ version: "1.1" });
          opt = {
            resolveKnownTags: false,
            schema: "yaml-1.1",
          };
          break;
        case "1.2":
        case "next":
          if (this.directives) this.directives.yaml.version = version;
          else this.directives = new directives.Directives({ version });
          opt = {
            resolveKnownTags: true,
            schema: "core",
          };
          break;
        case null:
          if (this.directives) delete this.directives;
          opt = null;
          break;
        default: {
          const sv = JSON.stringify(version);
          throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
        }
      }
      if (options.schema instanceof Object) this.schema = options.schema;
      else if (opt) this.schema = new Schema.Schema(Object.assign(opt, options));
      else throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
    }
    toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      const ctx = {
        anchors: /* @__PURE__ */ new Map(),
        doc: this,
        keep: !json,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100,
      };
      const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res } of ctx.anchors.values()) onAnchor(res, count);
      return typeof reviver === "function"
        ? applyReviver.applyReviver(reviver, { "": res }, "", res)
        : res;
    }
    /**
     * A JSON representation of the document `contents`.
     *
     * @param jsonArg Used by `JSON.stringify` to indicate the array index or
     *   property name.
     */
    toJSON(jsonArg, onAnchor) {
      return this.toJS({
        json: true,
        jsonArg,
        mapAsMap: false,
        onAnchor,
      });
    }
    /** A YAML representation of the document. */
    toString(options = {}) {
      if (this.errors.length > 0) throw new Error("Document with errors cannot be stringified");
      if (
        "indent" in options &&
        (!Number.isInteger(options.indent) || Number(options.indent) <= 0)
      ) {
        const s = JSON.stringify(options.indent);
        throw new Error(`"indent" option must be a positive integer, not ${s}`);
      }
      return stringifyDocument.stringifyDocument(this, options);
    }
  };
  function assertCollection(contents) {
    if (identity.isCollection(contents)) return true;
    throw new Error("Expected a YAML collection as document contents");
  }
  exports.Document = Document;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/errors.js
var require_errors = /* @__PURE__ */ __commonJSMin((exports) => {
  var YAMLError = class extends Error {
    constructor(name, pos, code, message) {
      super();
      this.name = name;
      this.code = code;
      this.message = message;
      this.pos = pos;
    }
  };
  var YAMLParseError = class extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLParseError", pos, code, message);
    }
  };
  var YAMLWarning = class extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLWarning", pos, code, message);
    }
  };
  const prettifyError = (src, lc) => (error) => {
    if (error.pos[0] === -1) return;
    error.linePos = error.pos.map((pos) => lc.linePos(pos));
    const { line, col } = error.linePos[0];
    error.message += ` at line ${line}, column ${col}`;
    let ci = col - 1;
    let lineStr = src
      .substring(lc.lineStarts[line - 1], lc.lineStarts[line])
      .replace(/[\n\r]+$/, "");
    if (ci >= 60 && lineStr.length > 80) {
      const trimStart = Math.min(ci - 39, lineStr.length - 79);
      lineStr = "…" + lineStr.substring(trimStart);
      ci -= trimStart - 1;
    }
    if (lineStr.length > 80) lineStr = lineStr.substring(0, 79) + "…";
    if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
      let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
      if (prev.length > 80) prev = prev.substring(0, 79) + "…\n";
      lineStr = prev + lineStr;
    }
    if (/[^ ]/.test(lineStr)) {
      let count = 1;
      const end = error.linePos[1];
      if (end?.line === line && end.col > col)
        count = Math.max(1, Math.min(end.col - col, 80 - ci));
      const pointer = " ".repeat(ci) + "^".repeat(count);
      error.message += `:\n\n${lineStr}\n${pointer}\n`;
    }
  };
  exports.YAMLError = YAMLError;
  exports.YAMLParseError = YAMLParseError;
  exports.YAMLWarning = YAMLWarning;
  exports.prettifyError = prettifyError;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = /* @__PURE__ */ __commonJSMin((exports) => {
  function resolveProps(
    tokens,
    { flow, indicator, next, offset, onError, parentIndent, startOnNewline },
  ) {
    let spaceBefore = false;
    let atNewline = startOnNewline;
    let hasSpace = startOnNewline;
    let comment = "";
    let commentSep = "";
    let hasNewline = false;
    let reqSpace = false;
    let tab = null;
    let anchor = null;
    let tag = null;
    let newlineAfterProp = null;
    let comma = null;
    let found = null;
    let start = null;
    for (const token of tokens) {
      if (reqSpace) {
        if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
          onError(
            token.offset,
            "MISSING_CHAR",
            "Tags and anchors must be separated from the next token by white space",
          );
        reqSpace = false;
      }
      if (tab) {
        if (atNewline && token.type !== "comment" && token.type !== "newline")
          onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
        tab = null;
      }
      switch (token.type) {
        case "space":
          if (
            !flow &&
            (indicator !== "doc-start" || next?.type !== "flow-collection") &&
            token.source.includes("	")
          )
            tab = token;
          hasSpace = true;
          break;
        case "comment": {
          if (!hasSpace)
            onError(
              token,
              "MISSING_CHAR",
              "Comments must be separated from other tokens by white space characters",
            );
          const cb = token.source.substring(1) || " ";
          if (!comment) comment = cb;
          else comment += commentSep + cb;
          commentSep = "";
          atNewline = false;
          break;
        }
        case "newline":
          if (atNewline) {
            if (comment) comment += token.source;
            else if (!found || indicator !== "seq-item-ind") spaceBefore = true;
          } else commentSep += token.source;
          atNewline = true;
          hasNewline = true;
          if (anchor || tag) newlineAfterProp = token;
          hasSpace = true;
          break;
        case "anchor":
          if (anchor) onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
          if (token.source.endsWith(":"))
            onError(
              token.offset + token.source.length - 1,
              "BAD_ALIAS",
              "Anchor ending in : is ambiguous",
              true,
            );
          anchor = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        case "tag":
          if (tag) onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
          tag = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        case indicator:
          if (anchor || tag)
            onError(
              token,
              "BAD_PROP_ORDER",
              `Anchors and tags must be after the ${token.source} indicator`,
            );
          if (found)
            onError(
              token,
              "UNEXPECTED_TOKEN",
              `Unexpected ${token.source} in ${flow ?? "collection"}`,
            );
          found = token;
          atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
          hasSpace = false;
          break;
        case "comma":
          if (flow) {
            if (comma) onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
            comma = token;
            atNewline = false;
            hasSpace = false;
            break;
          }
        default:
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
          atNewline = false;
          hasSpace = false;
      }
    }
    const last = tokens[tokens.length - 1];
    const end = last ? last.offset + last.source.length : offset;
    if (
      reqSpace &&
      next &&
      next.type !== "space" &&
      next.type !== "newline" &&
      next.type !== "comma" &&
      (next.type !== "scalar" || next.source !== "")
    )
      onError(
        next.offset,
        "MISSING_CHAR",
        "Tags and anchors must be separated from the next token by white space",
      );
    if (
      tab &&
      ((atNewline && tab.indent <= parentIndent) ||
        next?.type === "block-map" ||
        next?.type === "block-seq")
    )
      onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
    return {
      comma,
      found,
      spaceBefore,
      comment,
      hasNewline,
      anchor,
      tag,
      newlineAfterProp,
      end,
      start: start ?? end,
    };
  }
  exports.resolveProps = resolveProps;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = /* @__PURE__ */ __commonJSMin((exports) => {
  function containsNewline(key) {
    if (!key) return null;
    switch (key.type) {
      case "alias":
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        if (key.source.includes("\n")) return true;
        if (key.end) {
          for (const st of key.end) if (st.type === "newline") return true;
        }
        return false;
      case "flow-collection":
        for (const it of key.items) {
          for (const st of it.start) if (st.type === "newline") return true;
          if (it.sep) {
            for (const st of it.sep) if (st.type === "newline") return true;
          }
          if (containsNewline(it.key) || containsNewline(it.value)) return true;
        }
        return false;
      default:
        return true;
    }
  }
  exports.containsNewline = containsNewline;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = /* @__PURE__ */ __commonJSMin((exports) => {
  var utilContainsNewline = require_util_contains_newline();
  function flowIndentCheck(indent, fc, onError) {
    if (fc?.type === "flow-collection") {
      const end = fc.end[0];
      if (
        end.indent === indent &&
        (end.source === "]" || end.source === "}") &&
        utilContainsNewline.containsNewline(fc)
      )
        onError(end, "BAD_INDENT", "Flow end indicator should be more indented than parent", true);
    }
  }
  exports.flowIndentCheck = flowIndentCheck;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  function mapIncludes(ctx, items, search) {
    const { uniqueKeys } = ctx.options;
    if (uniqueKeys === false) return false;
    const isEqual =
      typeof uniqueKeys === "function"
        ? uniqueKeys
        : (a, b) =>
            a === b || (identity.isScalar(a) && identity.isScalar(b) && a.value === b.value);
    return items.some((pair) => isEqual(pair.key, search));
  }
  exports.mapIncludes = mapIncludes;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = /* @__PURE__ */ __commonJSMin((exports) => {
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  var utilMapIncludes = require_util_map_includes();
  const startColMsg = "All mapping items must start at the same column";
  function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
    const map = new (tag?.nodeClass ?? YAMLMap.YAMLMap)(ctx.schema);
    if (ctx.atRoot) ctx.atRoot = false;
    let offset = bm.offset;
    let commentEnd = null;
    for (const collItem of bm.items) {
      const { start, key, sep, value } = collItem;
      const keyProps = resolveProps.resolveProps(start, {
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: bm.indent,
        startOnNewline: true,
      });
      const implicitKey = !keyProps.found;
      if (implicitKey) {
        if (key) {
          if (key.type === "block-seq")
            onError(
              offset,
              "BLOCK_AS_IMPLICIT_KEY",
              "A block sequence may not be used as an implicit map key",
            );
          else if ("indent" in key && key.indent !== bm.indent)
            onError(offset, "BAD_INDENT", startColMsg);
        }
        if (!keyProps.anchor && !keyProps.tag && !sep) {
          commentEnd = keyProps.end;
          if (keyProps.comment)
            if (map.comment) map.comment += "\n" + keyProps.comment;
            else map.comment = keyProps.comment;
          continue;
        }
        if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key))
          onError(
            key ?? start[start.length - 1],
            "MULTILINE_IMPLICIT_KEY",
            "Implicit keys need to be on a single line",
          );
      } else if (keyProps.found?.indent !== bm.indent) onError(offset, "BAD_INDENT", startColMsg);
      ctx.atKey = true;
      const keyStart = keyProps.end;
      const keyNode = key
        ? composeNode(ctx, key, keyProps, onError)
        : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
      if (ctx.schema.compat) utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
      ctx.atKey = false;
      if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
        onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
      const valueProps = resolveProps.resolveProps(sep ?? [], {
        indicator: "map-value-ind",
        next: value,
        offset: keyNode.range[2],
        onError,
        parentIndent: bm.indent,
        startOnNewline: !key || key.type === "block-scalar",
      });
      offset = valueProps.end;
      if (valueProps.found) {
        if (implicitKey) {
          if (value?.type === "block-map" && !valueProps.hasNewline)
            onError(
              offset,
              "BLOCK_AS_IMPLICIT_KEY",
              "Nested mappings are not allowed in compact mappings",
            );
          if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
            onError(
              keyNode.range,
              "KEY_OVER_1024_CHARS",
              "The : indicator must be at most 1024 chars after the start of an implicit block mapping key",
            );
        }
        const valueNode = value
          ? composeNode(ctx, value, valueProps, onError)
          : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
        if (ctx.schema.compat) utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
        offset = valueNode.range[2];
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
        map.items.push(pair);
      } else {
        if (implicitKey)
          onError(
            keyNode.range,
            "MISSING_CHAR",
            "Implicit map keys need to be followed by map values",
          );
        if (valueProps.comment)
          if (keyNode.comment) keyNode.comment += "\n" + valueProps.comment;
          else keyNode.comment = valueProps.comment;
        const pair = new Pair.Pair(keyNode);
        if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
        map.items.push(pair);
      }
    }
    if (commentEnd && commentEnd < offset)
      onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
    map.range = [bm.offset, offset, commentEnd ?? offset];
    return map;
  }
  exports.resolveBlockMap = resolveBlockMap;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = /* @__PURE__ */ __commonJSMin((exports) => {
  var YAMLSeq = require_YAMLSeq();
  var resolveProps = require_resolve_props();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
    const seq = new (tag?.nodeClass ?? YAMLSeq.YAMLSeq)(ctx.schema);
    if (ctx.atRoot) ctx.atRoot = false;
    if (ctx.atKey) ctx.atKey = false;
    let offset = bs.offset;
    let commentEnd = null;
    for (const { start, value } of bs.items) {
      const props = resolveProps.resolveProps(start, {
        indicator: "seq-item-ind",
        next: value,
        offset,
        onError,
        parentIndent: bs.indent,
        startOnNewline: true,
      });
      if (!props.found)
        if (props.anchor || props.tag || value)
          if (value?.type === "block-seq")
            onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
          else onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
        else {
          commentEnd = props.end;
          if (props.comment) seq.comment = props.comment;
          continue;
        }
      const node = value
        ? composeNode(ctx, value, props, onError)
        : composeEmptyNode(ctx, props.end, start, null, props, onError);
      if (ctx.schema.compat) utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
      offset = node.range[2];
      seq.items.push(node);
    }
    seq.range = [bs.offset, offset, commentEnd ?? offset];
    return seq;
  }
  exports.resolveBlockSeq = resolveBlockSeq;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = /* @__PURE__ */ __commonJSMin((exports) => {
  function resolveEnd(end, offset, reqSpace, onError) {
    let comment = "";
    if (end) {
      let hasSpace = false;
      let sep = "";
      for (const token of end) {
        const { source, type } = token;
        switch (type) {
          case "space":
            hasSpace = true;
            break;
          case "comment": {
            if (reqSpace && !hasSpace)
              onError(
                token,
                "MISSING_CHAR",
                "Comments must be separated from other tokens by white space characters",
              );
            const cb = source.substring(1) || " ";
            if (!comment) comment = cb;
            else comment += sep + cb;
            sep = "";
            break;
          }
          case "newline":
            if (comment) sep += source;
            hasSpace = true;
            break;
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
        }
        offset += source.length;
      }
    }
    return {
      comment,
      offset,
    };
  }
  exports.resolveEnd = resolveEnd;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilMapIncludes = require_util_map_includes();
  const blockMsg = "Block collections are not allowed within flow collections";
  const isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
  function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
    const isMap = fc.start.source === "{";
    const fcName = isMap ? "flow map" : "flow sequence";
    const coll = new (tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq))(ctx.schema);
    coll.flow = true;
    const atRoot = ctx.atRoot;
    if (atRoot) ctx.atRoot = false;
    if (ctx.atKey) ctx.atKey = false;
    let offset = fc.offset + fc.start.source.length;
    for (let i = 0; i < fc.items.length; ++i) {
      const collItem = fc.items[i];
      const { start, key, sep, value } = collItem;
      const props = resolveProps.resolveProps(start, {
        flow: fcName,
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: fc.indent,
        startOnNewline: false,
      });
      if (!props.found) {
        if (!props.anchor && !props.tag && !sep && !value) {
          if (i === 0 && props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
          else if (i < fc.items.length - 1)
            onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
          if (props.comment)
            if (coll.comment) coll.comment += "\n" + props.comment;
            else coll.comment = props.comment;
          offset = props.end;
          continue;
        }
        if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
          onError(
            key,
            "MULTILINE_IMPLICIT_KEY",
            "Implicit keys of flow sequence pairs need to be on a single line",
          );
      }
      if (i === 0) {
        if (props.comma) onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
      } else {
        if (!props.comma) onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
        if (props.comment) {
          let prevItemComment = "";
          loop: for (const st of start)
            switch (st.type) {
              case "comma":
              case "space":
                break;
              case "comment":
                prevItemComment = st.source.substring(1);
                break loop;
              default:
                break loop;
            }
          if (prevItemComment) {
            let prev = coll.items[coll.items.length - 1];
            if (identity.isPair(prev)) prev = prev.value ?? prev.key;
            if (prev.comment) prev.comment += "\n" + prevItemComment;
            else prev.comment = prevItemComment;
            props.comment = props.comment.substring(prevItemComment.length + 1);
          }
        }
      }
      if (!isMap && !sep && !props.found) {
        const valueNode = value
          ? composeNode(ctx, value, props, onError)
          : composeEmptyNode(ctx, props.end, sep, null, props, onError);
        coll.items.push(valueNode);
        offset = valueNode.range[2];
        if (isBlock(value)) onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
      } else {
        ctx.atKey = true;
        const keyStart = props.end;
        const keyNode = key
          ? composeNode(ctx, key, props, onError)
          : composeEmptyNode(ctx, keyStart, start, null, props, onError);
        if (isBlock(key)) onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
        ctx.atKey = false;
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          flow: fcName,
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: fc.indent,
          startOnNewline: false,
        });
        if (valueProps.found) {
          if (!isMap && !props.found && ctx.options.strict) {
            if (sep)
              for (const st of sep) {
                if (st === valueProps.found) break;
                if (st.type === "newline") {
                  onError(
                    st,
                    "MULTILINE_IMPLICIT_KEY",
                    "Implicit keys of flow sequence pairs need to be on a single line",
                  );
                  break;
                }
              }
            if (props.start < valueProps.found.offset - 1024)
              onError(
                valueProps.found,
                "KEY_OVER_1024_CHARS",
                "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key",
              );
          }
        } else if (value)
          if ("source" in value && value.source?.[0] === ":")
            onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
          else onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
        const valueNode = value
          ? composeNode(ctx, value, valueProps, onError)
          : valueProps.found
            ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError)
            : null;
        if (valueNode) {
          if (isBlock(value)) onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else if (valueProps.comment)
          if (keyNode.comment) keyNode.comment += "\n" + valueProps.comment;
          else keyNode.comment = valueProps.comment;
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens) pair.srcToken = collItem;
        if (isMap) {
          const map = coll;
          if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
            onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
          map.items.push(pair);
        } else {
          const map = new YAMLMap.YAMLMap(ctx.schema);
          map.flow = true;
          map.items.push(pair);
          const endRange = (valueNode ?? keyNode).range;
          map.range = [keyNode.range[0], endRange[1], endRange[2]];
          coll.items.push(map);
        }
        offset = valueNode ? valueNode.range[2] : valueProps.end;
      }
    }
    const expectedEnd = isMap ? "}" : "]";
    const [ce, ...ee] = fc.end;
    let cePos = offset;
    if (ce?.source === expectedEnd) cePos = ce.offset + ce.source.length;
    else {
      const name = fcName[0].toUpperCase() + fcName.substring(1);
      const msg = atRoot
        ? `${name} must end with a ${expectedEnd}`
        : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
      onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
      if (ce && ce.source.length !== 1) ee.unshift(ce);
    }
    if (ee.length > 0) {
      const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
      if (end.comment)
        if (coll.comment) coll.comment += "\n" + end.comment;
        else coll.comment = end.comment;
      coll.range = [fc.offset, cePos, end.offset];
    } else coll.range = [fc.offset, cePos, cePos];
    return coll;
  }
  exports.resolveFlowCollection = resolveFlowCollection;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveBlockMap = require_resolve_block_map();
  var resolveBlockSeq = require_resolve_block_seq();
  var resolveFlowCollection = require_resolve_flow_collection();
  function resolveCollection(CN, ctx, token, onError, tagName, tag) {
    const coll =
      token.type === "block-map"
        ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag)
        : token.type === "block-seq"
          ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag)
          : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
    const Coll = coll.constructor;
    if (tagName === "!" || tagName === Coll.tagName) {
      coll.tag = Coll.tagName;
      return coll;
    }
    if (tagName) coll.tag = tagName;
    return coll;
  }
  function composeCollection(CN, ctx, token, props, onError) {
    const tagToken = props.tag;
    const tagName = !tagToken
      ? null
      : ctx.directives.tagName(tagToken.source, (msg) =>
          onError(tagToken, "TAG_RESOLVE_FAILED", msg),
        );
    if (token.type === "block-seq") {
      const { anchor, newlineAfterProp: nl } = props;
      const lastProp =
        anchor && tagToken
          ? anchor.offset > tagToken.offset
            ? anchor
            : tagToken
          : (anchor ?? tagToken);
      if (lastProp && (!nl || nl.offset < lastProp.offset))
        onError(lastProp, "MISSING_CHAR", "Missing newline after block sequence props");
    }
    const expType =
      token.type === "block-map"
        ? "map"
        : token.type === "block-seq"
          ? "seq"
          : token.start.source === "{"
            ? "map"
            : "seq";
    if (
      !tagToken ||
      !tagName ||
      tagName === "!" ||
      (tagName === YAMLMap.YAMLMap.tagName && expType === "map") ||
      (tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq")
    )
      return resolveCollection(CN, ctx, token, onError, tagName);
    let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
    if (!tag) {
      const kt = ctx.schema.knownTags[tagName];
      if (kt?.collection === expType) {
        ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
        tag = kt;
      } else {
        if (kt)
          onError(
            tagToken,
            "BAD_COLLECTION_TYPE",
            `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`,
            true,
          );
        else onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
    }
    const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
    const res =
      tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ??
      coll;
    const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
    node.range = coll.range;
    node.tag = tagName;
    if (tag?.format) node.format = tag.format;
    return node;
  }
  exports.composeCollection = composeCollection;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = /* @__PURE__ */ __commonJSMin((exports) => {
  var Scalar = require_Scalar();
  function resolveBlockScalar(ctx, scalar, onError) {
    const start = scalar.offset;
    const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
    if (!header)
      return {
        value: "",
        type: null,
        comment: "",
        range: [start, start, start],
      };
    const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
    const lines = scalar.source ? splitLines(scalar.source) : [];
    let chompStart = lines.length;
    for (let i = lines.length - 1; i >= 0; --i) {
      const content = lines[i][1];
      if (content === "" || content === "\r") chompStart = i;
      else break;
    }
    if (chompStart === 0) {
      const value =
        header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
      let end = start + header.length;
      if (scalar.source) end += scalar.source.length;
      return {
        value,
        type,
        comment: header.comment,
        range: [start, end, end],
      };
    }
    let trimIndent = scalar.indent + header.indent;
    let offset = scalar.offset + header.length;
    let contentStart = 0;
    for (let i = 0; i < chompStart; ++i) {
      const [indent, content] = lines[i];
      if (content === "" || content === "\r") {
        if (header.indent === 0 && indent.length > trimIndent) trimIndent = indent.length;
      } else {
        if (indent.length < trimIndent)
          onError(
            offset + indent.length,
            "MISSING_CHAR",
            "Block scalars with more-indented leading empty lines must use an explicit indentation indicator",
          );
        if (header.indent === 0) trimIndent = indent.length;
        contentStart = i;
        if (trimIndent === 0 && !ctx.atRoot)
          onError(offset, "BAD_INDENT", "Block scalar values in collections must be indented");
        break;
      }
      offset += indent.length + content.length + 1;
    }
    for (let i = lines.length - 1; i >= chompStart; --i)
      if (lines[i][0].length > trimIndent) chompStart = i + 1;
    let value = "";
    let sep = "";
    let prevMoreIndented = false;
    for (let i = 0; i < contentStart; ++i) value += lines[i][0].slice(trimIndent) + "\n";
    for (let i = contentStart; i < chompStart; ++i) {
      let [indent, content] = lines[i];
      offset += indent.length + content.length + 1;
      const crlf = content[content.length - 1] === "\r";
      if (crlf) content = content.slice(0, -1);
      /* istanbul ignore if already caught in lexer */
      if (content && indent.length < trimIndent) {
        const message = `Block scalar lines must not be less indented than their ${header.indent ? "explicit indentation indicator" : "first line"}`;
        onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
        indent = "";
      }
      if (type === Scalar.Scalar.BLOCK_LITERAL) {
        value += sep + indent.slice(trimIndent) + content;
        sep = "\n";
      } else if (indent.length > trimIndent || content[0] === "	") {
        if (sep === " ") sep = "\n";
        else if (!prevMoreIndented && sep === "\n") sep = "\n\n";
        value += sep + indent.slice(trimIndent) + content;
        sep = "\n";
        prevMoreIndented = true;
      } else if (content === "")
        if (sep === "\n") value += "\n";
        else sep = "\n";
      else {
        value += sep + content;
        sep = " ";
        prevMoreIndented = false;
      }
    }
    switch (header.chomp) {
      case "-":
        break;
      case "+":
        for (let i = chompStart; i < lines.length; ++i)
          value += "\n" + lines[i][0].slice(trimIndent);
        if (value[value.length - 1] !== "\n") value += "\n";
        break;
      default:
        value += "\n";
    }
    const end = start + header.length + scalar.source.length;
    return {
      value,
      type,
      comment: header.comment,
      range: [start, end, end],
    };
  }
  function parseBlockScalarHeader({ offset, props }, strict, onError) {
    /* istanbul ignore if should not happen */
    if (props[0].type !== "block-scalar-header") {
      onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
      return null;
    }
    const { source } = props[0];
    const mode = source[0];
    let indent = 0;
    let chomp = "";
    let error = -1;
    for (let i = 1; i < source.length; ++i) {
      const ch = source[i];
      if (!chomp && (ch === "-" || ch === "+")) chomp = ch;
      else {
        const n = Number(ch);
        if (!indent && n) indent = n;
        else if (error === -1) error = offset + i;
      }
    }
    if (error !== -1)
      onError(
        error,
        "UNEXPECTED_TOKEN",
        `Block scalar header includes extra characters: ${source}`,
      );
    let hasSpace = false;
    let comment = "";
    let length = source.length;
    for (let i = 1; i < props.length; ++i) {
      const token = props[i];
      switch (token.type) {
        case "space":
          hasSpace = true;
        case "newline":
          length += token.source.length;
          break;
        case "comment":
          if (strict && !hasSpace)
            onError(
              token,
              "MISSING_CHAR",
              "Comments must be separated from other tokens by white space characters",
            );
          length += token.source.length;
          comment = token.source.substring(1);
          break;
        case "error":
          onError(token, "UNEXPECTED_TOKEN", token.message);
          length += token.source.length;
          break;
        /* istanbul ignore next should not happen */
        default: {
          onError(
            token,
            "UNEXPECTED_TOKEN",
            `Unexpected token in block scalar header: ${token.type}`,
          );
          const ts = token.source;
          if (ts && typeof ts === "string") length += ts.length;
        }
      }
    }
    return {
      mode,
      indent,
      chomp,
      comment,
      length,
    };
  }
  /** @returns Array of lines split up as `[indent, content]` */
  function splitLines(source) {
    const split = source.split(/\n( *)/);
    const first = split[0];
    const m = first.match(/^( *)/);
    const lines = [m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first]];
    for (let i = 1; i < split.length; i += 2) lines.push([split[i], split[i + 1]]);
    return lines;
  }
  exports.resolveBlockScalar = resolveBlockScalar;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = /* @__PURE__ */ __commonJSMin((exports) => {
  var Scalar = require_Scalar();
  var resolveEnd = require_resolve_end();
  function resolveFlowScalar(scalar, strict, onError) {
    const { offset, type, source, end } = scalar;
    let _type;
    let value;
    const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
    switch (type) {
      case "scalar":
        _type = Scalar.Scalar.PLAIN;
        value = plainValue(source, _onError);
        break;
      case "single-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_SINGLE;
        value = singleQuotedValue(source, _onError);
        break;
      case "double-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_DOUBLE;
        value = doubleQuotedValue(source, _onError);
        break;
      /* istanbul ignore next should not happen */
      default:
        onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
        return {
          value: "",
          type: null,
          comment: "",
          range: [offset, offset + source.length, offset + source.length],
        };
    }
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
    return {
      value,
      type: _type,
      comment: re.comment,
      range: [offset, valueEnd, re.offset],
    };
  }
  function plainValue(source, onError) {
    let badChar = "";
    switch (source[0]) {
      /* istanbul ignore next should not happen */
      case "	":
        badChar = "a tab character";
        break;
      case ",":
        badChar = "flow indicator character ,";
        break;
      case "%":
        badChar = "directive indicator character %";
        break;
      case "|":
      case ">":
        badChar = `block scalar indicator ${source[0]}`;
        break;
      case "@":
      case "`":
        badChar = `reserved character ${source[0]}`;
        break;
    }
    if (badChar) onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
    return foldLines(source);
  }
  function singleQuotedValue(source, onError) {
    if (source[source.length - 1] !== "'" || source.length === 1)
      onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
    return foldLines(source.slice(1, -1)).replace(/''/g, "'");
  }
  function foldLines(source) {
    /**
     * The negative lookbehind here and in the `re` RegExp is to
     * prevent causing a polynomial search time in certain cases.
     *
     * The try-catch is for Safari, which doesn't support this yet:
     * https://caniuse.com/js-regexp-lookbehind
     */
    let first, line;
    try {
      first = /* @__PURE__ */ new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
      line = /* @__PURE__ */ new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
    } catch {
      first = /(.*?)[ \t]*\r?\n/sy;
      line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
    }
    let match = first.exec(source);
    if (!match) return source;
    let res = match[1];
    let sep = " ";
    let pos = first.lastIndex;
    line.lastIndex = pos;
    while ((match = line.exec(source))) {
      if (match[1] === "")
        if (sep === "\n") res += sep;
        else sep = "\n";
      else {
        res += sep + match[1];
        sep = " ";
      }
      pos = line.lastIndex;
    }
    const last = /[ \t]*(.*)/sy;
    last.lastIndex = pos;
    match = last.exec(source);
    return res + sep + (match?.[1] ?? "");
  }
  function doubleQuotedValue(source, onError) {
    let res = "";
    for (let i = 1; i < source.length - 1; ++i) {
      const ch = source[i];
      if (ch === "\r" && source[i + 1] === "\n") continue;
      if (ch === "\n") {
        const { fold, offset } = foldNewline(source, i);
        res += fold;
        i = offset;
      } else if (ch === "\\") {
        let next = source[++i];
        const cc = escapeCodes[next];
        if (cc) res += cc;
        else if (next === "\n") {
          next = source[i + 1];
          while (next === " " || next === "	") next = source[++i + 1];
        } else if (next === "\r" && source[i + 1] === "\n") {
          next = source[++i + 1];
          while (next === " " || next === "	") next = source[++i + 1];
        } else if (next === "x" || next === "u" || next === "U") {
          const length = {
            x: 2,
            u: 4,
            U: 8,
          }[next];
          res += parseCharCode(source, i + 1, length, onError);
          i += length;
        } else {
          const raw = source.substr(i - 1, 2);
          onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
          res += raw;
        }
      } else if (ch === " " || ch === "	") {
        const wsStart = i;
        let next = source[i + 1];
        while (next === " " || next === "	") next = source[++i + 1];
        if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
          res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
      } else res += ch;
    }
    if (source[source.length - 1] !== '"' || source.length === 1)
      onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
    return res;
  }
  /**
   * Fold a single newline into a space, multiple newlines to N - 1 newlines.
   * Presumes `source[offset] === '\n'`
   */
  function foldNewline(source, offset) {
    let fold = "";
    let ch = source[offset + 1];
    while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[offset + 2] !== "\n") break;
      if (ch === "\n") fold += "\n";
      offset += 1;
      ch = source[offset + 1];
    }
    if (!fold) fold = " ";
    return {
      fold,
      offset,
    };
  }
  const escapeCodes = {
    0: "\0",
    a: "\x07",
    b: "\b",
    e: "\x1B",
    f: "\f",
    n: "\n",
    r: "\r",
    t: "	",
    v: "\v",
    N: "",
    _: "\xA0",
    L: "\u2028",
    P: "\u2029",
    " ": " ",
    '"': '"',
    "/": "/",
    "\\": "\\",
    "	": "	",
  };
  function parseCharCode(source, offset, length, onError) {
    const cc = source.substr(offset, length);
    const code = cc.length === length && /^[0-9a-fA-F]+$/.test(cc) ? parseInt(cc, 16) : NaN;
    if (isNaN(code)) {
      const raw = source.substr(offset - 2, length + 2);
      onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
      return raw;
    }
    return String.fromCodePoint(code);
  }
  exports.resolveFlowScalar = resolveFlowScalar;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = /* @__PURE__ */ __commonJSMin((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  function composeScalar(ctx, token, tagToken, onError) {
    const { value, type, comment, range } =
      token.type === "block-scalar"
        ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError)
        : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
    const tagName = tagToken
      ? ctx.directives.tagName(tagToken.source, (msg) =>
          onError(tagToken, "TAG_RESOLVE_FAILED", msg),
        )
      : null;
    let tag;
    if (ctx.options.stringKeys && ctx.atKey) tag = ctx.schema[identity.SCALAR];
    else if (tagName) tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
    else if (token.type === "scalar") tag = findScalarTagByTest(ctx, value, token, onError);
    else tag = ctx.schema[identity.SCALAR];
    let scalar;
    try {
      const res = tag.resolve(
        value,
        (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg),
        ctx.options,
      );
      scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
      scalar = new Scalar.Scalar(value);
    }
    scalar.range = range;
    scalar.source = value;
    if (type) scalar.type = type;
    if (tagName) scalar.tag = tagName;
    if (tag.format) scalar.format = tag.format;
    if (comment) scalar.comment = comment;
    return scalar;
  }
  function findScalarTagByName(schema, value, tagName, tagToken, onError) {
    if (tagName === "!") return schema[identity.SCALAR];
    const matchWithTest = [];
    for (const tag of schema.tags)
      if (!tag.collection && tag.tag === tagName)
        if (tag.default && tag.test) matchWithTest.push(tag);
        else return tag;
    for (const tag of matchWithTest) if (tag.test?.test(value)) return tag;
    const kt = schema.knownTags[tagName];
    if (kt && !kt.collection) {
      schema.tags.push(
        Object.assign({}, kt, {
          default: false,
          test: void 0,
        }),
      );
      return kt;
    }
    onError(
      tagToken,
      "TAG_RESOLVE_FAILED",
      `Unresolved tag: ${tagName}`,
      tagName !== "tag:yaml.org,2002:str",
    );
    return schema[identity.SCALAR];
  }
  function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
    const tag =
      schema.tags.find(
        (tag) =>
          (tag.default === true || (atKey && tag.default === "key")) && tag.test?.test(value),
      ) || schema[identity.SCALAR];
    if (schema.compat) {
      const compat =
        schema.compat.find((tag) => tag.default && tag.test?.test(value)) ??
        schema[identity.SCALAR];
      if (tag.tag !== compat.tag)
        onError(
          token,
          "TAG_RESOLVE_FAILED",
          `Value may be parsed as either ${directives.tagString(tag.tag)} or ${directives.tagString(compat.tag)}`,
          true,
        );
    }
    return tag;
  }
  exports.composeScalar = composeScalar;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = /* @__PURE__ */ __commonJSMin((exports) => {
  function emptyScalarPosition(offset, before, pos) {
    if (before) {
      pos ?? (pos = before.length);
      for (let i = pos - 1; i >= 0; --i) {
        let st = before[i];
        switch (st.type) {
          case "space":
          case "comment":
          case "newline":
            offset -= st.source.length;
            continue;
        }
        st = before[++i];
        while (st?.type === "space") {
          offset += st.source.length;
          st = before[++i];
        }
        break;
      }
    }
    return offset;
  }
  exports.emptyScalarPosition = emptyScalarPosition;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = /* @__PURE__ */ __commonJSMin((exports) => {
  var Alias = require_Alias();
  var identity = require_identity();
  var composeCollection = require_compose_collection();
  var composeScalar = require_compose_scalar();
  var resolveEnd = require_resolve_end();
  var utilEmptyScalarPosition = require_util_empty_scalar_position();
  const CN = {
    composeNode,
    composeEmptyNode,
  };
  function composeNode(ctx, token, props, onError) {
    const atKey = ctx.atKey;
    const { spaceBefore, comment, anchor, tag } = props;
    let node;
    let isSrcToken = true;
    switch (token.type) {
      case "alias":
        node = composeAlias(ctx, token, onError);
        if (anchor || tag)
          onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
        break;
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "block-scalar":
        node = composeScalar.composeScalar(ctx, token, tag, onError);
        if (anchor) node.anchor = anchor.source.substring(1);
        break;
      case "block-map":
      case "block-seq":
      case "flow-collection":
        try {
          node = composeCollection.composeCollection(CN, ctx, token, props, onError);
          if (anchor) node.anchor = anchor.source.substring(1);
        } catch (error) {
          onError(
            token,
            "RESOURCE_EXHAUSTION",
            error instanceof Error ? error.message : String(error),
          );
        }
        break;
      default:
        onError(
          token,
          "UNEXPECTED_TOKEN",
          token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`,
        );
        isSrcToken = false;
    }
    node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
    if (anchor && node.anchor === "")
      onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    if (
      atKey &&
      ctx.options.stringKeys &&
      (!identity.isScalar(node) ||
        typeof node.value !== "string" ||
        (node.tag && node.tag !== "tag:yaml.org,2002:str"))
    )
      onError(tag ?? token, "NON_STRING_KEY", "With stringKeys, all keys must be strings");
    if (spaceBefore) node.spaceBefore = true;
    if (comment)
      if (token.type === "scalar" && token.source === "") node.comment = comment;
      else node.commentBefore = comment;
    if (ctx.options.keepSourceTokens && isSrcToken) node.srcToken = token;
    return node;
  }
  function composeEmptyNode(
    ctx,
    offset,
    before,
    pos,
    { spaceBefore, comment, anchor, tag, end },
    onError,
  ) {
    const token = {
      type: "scalar",
      offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
      indent: -1,
      source: "",
    };
    const node = composeScalar.composeScalar(ctx, token, tag, onError);
    if (anchor) {
      node.anchor = anchor.source.substring(1);
      if (node.anchor === "") onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    }
    if (spaceBefore) node.spaceBefore = true;
    if (comment) {
      node.comment = comment;
      node.range[2] = end;
    }
    return node;
  }
  function composeAlias({ options }, { offset, source, end }, onError) {
    const alias = new Alias.Alias(source.substring(1));
    if (alias.source === "") onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
    if (alias.source.endsWith(":"))
      onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
    alias.range = [offset, valueEnd, re.offset];
    if (re.comment) alias.comment = re.comment;
    return alias;
  }
  exports.composeEmptyNode = composeEmptyNode;
  exports.composeNode = composeNode;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = /* @__PURE__ */ __commonJSMin((exports) => {
  var Document = require_Document();
  var composeNode = require_compose_node();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  function composeDoc(options, directives, { offset, start, value, end }, onError) {
    const opts = Object.assign({ _directives: directives }, options);
    const doc = new Document.Document(void 0, opts);
    const ctx = {
      atKey: false,
      atRoot: true,
      directives: doc.directives,
      options: doc.options,
      schema: doc.schema,
    };
    const props = resolveProps.resolveProps(start, {
      indicator: "doc-start",
      next: value ?? end?.[0],
      offset,
      onError,
      parentIndent: 0,
      startOnNewline: true,
    });
    if (props.found) {
      doc.directives.docStart = true;
      if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
        onError(
          props.end,
          "MISSING_CHAR",
          "Block collection cannot start on same line with directives-end marker",
        );
    }
    doc.contents = value
      ? composeNode.composeNode(ctx, value, props, onError)
      : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
    const contentEnd = doc.contents.range[2];
    const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
    if (re.comment) doc.comment = re.comment;
    doc.range = [offset, contentEnd, re.offset];
    return doc;
  }
  exports.composeDoc = composeDoc;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/compose/composer.js
var require_composer = /* @__PURE__ */ __commonJSMin((exports) => {
  var node_process$1 = __require("process");
  var directives = require_directives();
  var Document = require_Document();
  var errors = require_errors();
  var identity = require_identity();
  var composeDoc = require_compose_doc();
  var resolveEnd = require_resolve_end();
  function getErrorPos(src) {
    if (typeof src === "number") return [src, src + 1];
    if (Array.isArray(src)) return src.length === 2 ? src : [src[0], src[1]];
    const { offset, source } = src;
    return [offset, offset + (typeof source === "string" ? source.length : 1)];
  }
  function parsePrelude(prelude) {
    let comment = "";
    let atComment = false;
    let afterEmptyLine = false;
    for (let i = 0; i < prelude.length; ++i) {
      const source = prelude[i];
      switch (source[0]) {
        case "#":
          comment +=
            (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
          atComment = true;
          afterEmptyLine = false;
          break;
        case "%":
          if (prelude[i + 1]?.[0] !== "#") i += 1;
          atComment = false;
          break;
        default:
          if (!atComment) afterEmptyLine = true;
          atComment = false;
      }
    }
    return {
      comment,
      afterEmptyLine,
    };
  }
  /**
   * Compose a stream of CST nodes into a stream of YAML Documents.
   *
   * ```ts
   * import { Composer, Parser } from 'yaml'
   *
   * const src: string = ...
   * const tokens = new Parser().parse(src)
   * const docs = new Composer().compose(tokens)
   * ```
   */
  var Composer = class {
    constructor(options = {}) {
      this.doc = null;
      this.atDirectives = false;
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
      this.onError = (source, code, message, warning) => {
        const pos = getErrorPos(source);
        if (warning) this.warnings.push(new errors.YAMLWarning(pos, code, message));
        else this.errors.push(new errors.YAMLParseError(pos, code, message));
      };
      this.directives = new directives.Directives({ version: options.version || "1.2" });
      this.options = options;
    }
    decorate(doc, afterDoc) {
      const { comment, afterEmptyLine } = parsePrelude(this.prelude);
      if (comment) {
        const dc = doc.contents;
        if (afterDoc) doc.comment = doc.comment ? `${doc.comment}\n${comment}` : comment;
        else if (afterEmptyLine || doc.directives.docStart || !dc) doc.commentBefore = comment;
        else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
          let it = dc.items[0];
          if (identity.isPair(it)) it = it.key;
          const cb = it.commentBefore;
          it.commentBefore = cb ? `${comment}\n${cb}` : comment;
        } else {
          const cb = dc.commentBefore;
          dc.commentBefore = cb ? `${comment}\n${cb}` : comment;
        }
      }
      if (afterDoc) {
        Array.prototype.push.apply(doc.errors, this.errors);
        Array.prototype.push.apply(doc.warnings, this.warnings);
      } else {
        doc.errors = this.errors;
        doc.warnings = this.warnings;
      }
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
    }
    /**
     * Current stream status information.
     *
     * Mostly useful at the end of input for an empty stream.
     */
    streamInfo() {
      return {
        comment: parsePrelude(this.prelude).comment,
        directives: this.directives,
        errors: this.errors,
        warnings: this.warnings,
      };
    }
    /**
     * Compose tokens into documents.
     *
     * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
     * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
     */
    *compose(tokens, forceDoc = false, endOffset = -1) {
      for (const token of tokens) yield* this.next(token);
      yield* this.end(forceDoc, endOffset);
    }
    /** Advance the composer by one CST token. */
    *next(token) {
      if (node_process$1.env.LOG_STREAM) console.dir(token, { depth: null });
      switch (token.type) {
        case "directive":
          this.directives.add(token.source, (offset, message, warning) => {
            const pos = getErrorPos(token);
            pos[0] += offset;
            this.onError(pos, "BAD_DIRECTIVE", message, warning);
          });
          this.prelude.push(token.source);
          this.atDirectives = true;
          break;
        case "document": {
          const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
          if (this.atDirectives && !doc.directives.docStart)
            this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
          this.decorate(doc, false);
          if (this.doc) yield this.doc;
          this.doc = doc;
          this.atDirectives = false;
          break;
        }
        case "byte-order-mark":
        case "space":
          break;
        case "comment":
        case "newline":
          this.prelude.push(token.source);
          break;
        case "error": {
          const msg = token.source
            ? `${token.message}: ${JSON.stringify(token.source)}`
            : token.message;
          const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
          if (this.atDirectives || !this.doc) this.errors.push(error);
          else this.doc.errors.push(error);
          break;
        }
        case "doc-end": {
          if (!this.doc) {
            this.errors.push(
              new errors.YAMLParseError(
                getErrorPos(token),
                "UNEXPECTED_TOKEN",
                "Unexpected doc-end without preceding document",
              ),
            );
            break;
          }
          this.doc.directives.docEnd = true;
          const end = resolveEnd.resolveEnd(
            token.end,
            token.offset + token.source.length,
            this.doc.options.strict,
            this.onError,
          );
          this.decorate(this.doc, true);
          if (end.comment) {
            const dc = this.doc.comment;
            this.doc.comment = dc ? `${dc}\n${end.comment}` : end.comment;
          }
          this.doc.range[2] = end.offset;
          break;
        }
        default:
          this.errors.push(
            new errors.YAMLParseError(
              getErrorPos(token),
              "UNEXPECTED_TOKEN",
              `Unsupported token ${token.type}`,
            ),
          );
      }
    }
    /**
     * Call at end of input to yield any remaining document.
     *
     * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
     * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
     */
    *end(forceDoc = false, endOffset = -1) {
      if (this.doc) {
        this.decorate(this.doc, true);
        yield this.doc;
        this.doc = null;
      } else if (forceDoc) {
        const opts = Object.assign({ _directives: this.directives }, this.options);
        const doc = new Document.Document(void 0, opts);
        if (this.atDirectives)
          this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
        doc.range = [0, endOffset, endOffset];
        this.decorate(doc, false);
        yield doc;
      }
    }
  };
  exports.Composer = Composer;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = /* @__PURE__ */ __commonJSMin((exports) => {
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  var errors = require_errors();
  var stringifyString = require_stringifyString();
  function resolveAsScalar(token, strict = true, onError) {
    if (token) {
      const _onError = (pos, code, message) => {
        const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
        if (onError) onError(offset, code, message);
        else throw new errors.YAMLParseError([offset, offset + 1], code, message);
      };
      switch (token.type) {
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
        case "block-scalar":
          return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
      }
    }
    return null;
  }
  /**
   * Create a new scalar token with `value`
   *
   * Values that represent an actual string but may be parsed as a different type should use a `type` other than `'PLAIN'`,
   * as this function does not support any schema operations and won't check for such conflicts.
   *
   * @param value The string representation of the value, which will have its content properly indented.
   * @param context.end Comments and whitespace after the end of the value, or after the block scalar header. If undefined, a newline will be added.
   * @param context.implicitKey Being within an implicit key may affect the resolved type of the token's value.
   * @param context.indent The indent level of the token.
   * @param context.inFlow Is this scalar within a flow collection? This may affect the resolved type of the token's value.
   * @param context.offset The offset position of the token.
   * @param context.type The preferred type of the scalar token. If undefined, the previous type of the `token` will be used, defaulting to `'PLAIN'`.
   */
  function createScalarToken(value, context) {
    const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
    const source = stringifyString.stringifyString(
      {
        type,
        value,
      },
      {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: {
          blockQuote: true,
          lineWidth: -1,
        },
      },
    );
    const end = context.end ?? [
      {
        type: "newline",
        offset: -1,
        indent,
        source: "\n",
      },
    ];
    switch (source[0]) {
      case "|":
      case ">": {
        const he = source.indexOf("\n");
        const head = source.substring(0, he);
        const body = source.substring(he + 1) + "\n";
        const props = [
          {
            type: "block-scalar-header",
            offset,
            indent,
            source: head,
          },
        ];
        if (!addEndtoBlockProps(props, end))
          props.push({
            type: "newline",
            offset: -1,
            indent,
            source: "\n",
          });
        return {
          type: "block-scalar",
          offset,
          indent,
          props,
          source: body,
        };
      }
      case '"':
        return {
          type: "double-quoted-scalar",
          offset,
          indent,
          source,
          end,
        };
      case "'":
        return {
          type: "single-quoted-scalar",
          offset,
          indent,
          source,
          end,
        };
      default:
        return {
          type: "scalar",
          offset,
          indent,
          source,
          end,
        };
    }
  }
  /**
   * Set the value of `token` to the given string `value`, overwriting any previous contents and type that it may have.
   *
   * Best efforts are made to retain any comments previously associated with the `token`,
   * though all contents within a collection's `items` will be overwritten.
   *
   * Values that represent an actual string but may be parsed as a different type should use a `type` other than `'PLAIN'`,
   * as this function does not support any schema operations and won't check for such conflicts.
   *
   * @param token Any token. If it does not include an `indent` value, the value will be stringified as if it were an implicit key.
   * @param value The string representation of the value, which will have its content properly indented.
   * @param context.afterKey In most cases, values after a key should have an additional level of indentation.
   * @param context.implicitKey Being within an implicit key may affect the resolved type of the token's value.
   * @param context.inFlow Being within a flow collection may affect the resolved type of the token's value.
   * @param context.type The preferred type of the scalar token. If undefined, the previous type of the `token` will be used, defaulting to `'PLAIN'`.
   */
  function setScalarValue(token, value, context = {}) {
    let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
    let indent = "indent" in token ? token.indent : null;
    if (afterKey && typeof indent === "number") indent += 2;
    if (!type)
      switch (token.type) {
        case "single-quoted-scalar":
          type = "QUOTE_SINGLE";
          break;
        case "double-quoted-scalar":
          type = "QUOTE_DOUBLE";
          break;
        case "block-scalar": {
          const header = token.props[0];
          if (header.type !== "block-scalar-header") throw new Error("Invalid block scalar header");
          type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
          break;
        }
        default:
          type = "PLAIN";
      }
    const source = stringifyString.stringifyString(
      {
        type,
        value,
      },
      {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: {
          blockQuote: true,
          lineWidth: -1,
        },
      },
    );
    switch (source[0]) {
      case "|":
      case ">":
        setBlockScalarValue(token, source);
        break;
      case '"':
        setFlowScalarValue(token, source, "double-quoted-scalar");
        break;
      case "'":
        setFlowScalarValue(token, source, "single-quoted-scalar");
        break;
      default:
        setFlowScalarValue(token, source, "scalar");
    }
  }
  function setBlockScalarValue(token, source) {
    const he = source.indexOf("\n");
    const head = source.substring(0, he);
    const body = source.substring(he + 1) + "\n";
    if (token.type === "block-scalar") {
      const header = token.props[0];
      if (header.type !== "block-scalar-header") throw new Error("Invalid block scalar header");
      header.source = head;
      token.source = body;
    } else {
      const { offset } = token;
      const indent = "indent" in token ? token.indent : -1;
      const props = [
        {
          type: "block-scalar-header",
          offset,
          indent,
          source: head,
        },
      ];
      if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
        props.push({
          type: "newline",
          offset: -1,
          indent,
          source: "\n",
        });
      for (const key of Object.keys(token))
        if (key !== "type" && key !== "offset") delete token[key];
      Object.assign(token, {
        type: "block-scalar",
        indent,
        props,
        source: body,
      });
    }
  }
  /** @returns `true` if last token is a newline */
  function addEndtoBlockProps(props, end) {
    if (end)
      for (const st of end)
        switch (st.type) {
          case "space":
          case "comment":
            props.push(st);
            break;
          case "newline":
            props.push(st);
            return true;
        }
    return false;
  }
  function setFlowScalarValue(token, source, type) {
    switch (token.type) {
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        token.type = type;
        token.source = source;
        break;
      case "block-scalar": {
        const end = token.props.slice(1);
        let oa = source.length;
        if (token.props[0].type === "block-scalar-header") oa -= token.props[0].source.length;
        for (const tok of end) tok.offset += oa;
        delete token.props;
        Object.assign(token, {
          type,
          source,
          end,
        });
        break;
      }
      case "block-map":
      case "block-seq": {
        const nl = {
          type: "newline",
          offset: token.offset + source.length,
          indent: token.indent,
          source: "\n",
        };
        delete token.items;
        Object.assign(token, {
          type,
          source,
          end: [nl],
        });
        break;
      }
      default: {
        const indent = "indent" in token ? token.indent : -1;
        const end =
          "end" in token && Array.isArray(token.end)
            ? token.end.filter(
                (st) => st.type === "space" || st.type === "comment" || st.type === "newline",
              )
            : [];
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset") delete token[key];
        Object.assign(token, {
          type,
          indent,
          source,
          end,
        });
      }
    }
  }
  exports.createScalarToken = createScalarToken;
  exports.resolveAsScalar = resolveAsScalar;
  exports.setScalarValue = setScalarValue;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = /* @__PURE__ */ __commonJSMin((exports) => {
  /**
   * Stringify a CST document, token, or collection item
   *
   * Fair warning: This applies no validation whatsoever, and
   * simply concatenates the sources in their logical order.
   */
  const stringify = (cst) => ("type" in cst ? stringifyToken(cst) : stringifyItem(cst));
  function stringifyToken(token) {
    switch (token.type) {
      case "block-scalar": {
        let res = "";
        for (const tok of token.props) res += stringifyToken(tok);
        return res + token.source;
      }
      case "block-map":
      case "block-seq": {
        let res = "";
        for (const item of token.items) res += stringifyItem(item);
        return res;
      }
      case "flow-collection": {
        let res = token.start.source;
        for (const item of token.items) res += stringifyItem(item);
        for (const st of token.end) res += st.source;
        return res;
      }
      case "document": {
        let res = stringifyItem(token);
        if (token.end) for (const st of token.end) res += st.source;
        return res;
      }
      default: {
        let res = token.source;
        if ("end" in token && token.end) for (const st of token.end) res += st.source;
        return res;
      }
    }
  }
  function stringifyItem({ start, key, sep, value }) {
    let res = "";
    for (const st of start) res += st.source;
    if (key) res += stringifyToken(key);
    if (sep) for (const st of sep) res += st.source;
    if (value) res += stringifyToken(value);
    return res;
  }
  exports.stringify = stringify;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = /* @__PURE__ */ __commonJSMin((exports) => {
  const BREAK = Symbol("break visit");
  const SKIP = Symbol("skip children");
  const REMOVE = Symbol("remove item");
  /**
   * Apply a visitor to a CST document or item.
   *
   * Walks through the tree (depth-first) starting from the root, calling a
   * `visitor` function with two arguments when entering each item:
   *   - `item`: The current item, which included the following members:
   *     - `start: SourceToken[]` – Source tokens before the key or value,
   *       possibly including its anchor or tag.
   *     - `key?: Token | null` – Set for pair values. May then be `null`, if
   *       the key before the `:` separator is empty.
   *     - `sep?: SourceToken[]` – Source tokens between the key and the value,
   *       which should include the `:` map value indicator if `value` is set.
   *     - `value?: Token` – The value of a sequence item, or of a map pair.
   *   - `path`: The steps from the root to the current node, as an array of
   *     `['key' | 'value', number]` tuples.
   *
   * The return value of the visitor may be used to control the traversal:
   *   - `undefined` (default): Do nothing and continue
   *   - `visit.SKIP`: Do not visit the children of this token, continue with
   *      next sibling
   *   - `visit.BREAK`: Terminate traversal completely
   *   - `visit.REMOVE`: Remove the current item, then continue with the next one
   *   - `number`: Set the index of the next step. This is useful especially if
   *     the index of the current token has changed.
   *   - `function`: Define the next visitor for this item. After the original
   *     visitor is called on item entry, next visitors are called after handling
   *     a non-empty `key` and when exiting the item.
   */
  function visit(cst, visitor) {
    if ("type" in cst && cst.type === "document")
      cst = {
        start: cst.start,
        value: cst.value,
      };
    _visit(Object.freeze([]), cst, visitor);
  }
  /** Terminate visit traversal completely */
  visit.BREAK = BREAK;
  /** Do not visit the children of the current item */
  visit.SKIP = SKIP;
  /** Remove the current item */
  visit.REMOVE = REMOVE;
  /** Find the item at `path` from `cst` as the root */
  visit.itemAtPath = (cst, path) => {
    let item = cst;
    for (const [field, index] of path) {
      const tok = item?.[field];
      if (tok && "items" in tok) item = tok.items[index];
      else return void 0;
    }
    return item;
  };
  /**
   * Get the immediate parent collection of the item at `path` from `cst` as the root.
   *
   * Throws an error if the collection is not found, which should never happen if the item itself exists.
   */
  visit.parentCollection = (cst, path) => {
    const parent = visit.itemAtPath(cst, path.slice(0, -1));
    const field = path[path.length - 1][0];
    const coll = parent?.[field];
    if (coll && "items" in coll) return coll;
    throw new Error("Parent collection not found");
  };
  function _visit(path, item, visitor) {
    let ctrl = visitor(item, path);
    if (typeof ctrl === "symbol") return ctrl;
    for (const field of ["key", "value"]) {
      const token = item[field];
      if (token && "items" in token) {
        for (let i = 0; i < token.items.length; ++i) {
          const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
          if (typeof ci === "number") i = ci - 1;
          else if (ci === BREAK) return BREAK;
          else if (ci === REMOVE) {
            token.items.splice(i, 1);
            i -= 1;
          }
        }
        if (typeof ctrl === "function" && field === "key") ctrl = ctrl(item, path);
      }
    }
    return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
  }
  exports.visit = visit;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/cst.js
var require_cst = /* @__PURE__ */ __commonJSMin((exports) => {
  var cstScalar = require_cst_scalar();
  var cstStringify = require_cst_stringify();
  var cstVisit = require_cst_visit();
  /** The byte order mark */
  const BOM = "﻿";
  /** Start of doc-mode */
  const DOCUMENT = "";
  /** Unexpected end of flow-mode */
  const FLOW_END = "";
  /** Next token is a scalar value */
  const SCALAR = "";
  /** @returns `true` if `token` is a flow or block collection */
  const isCollection = (token) => !!token && "items" in token;
  /** @returns `true` if `token` is a flow or block scalar; not an alias */
  const isScalar = (token) =>
    !!token &&
    (token.type === "scalar" ||
      token.type === "single-quoted-scalar" ||
      token.type === "double-quoted-scalar" ||
      token.type === "block-scalar");
  /* istanbul ignore next */
  /** Get a printable representation of a lexer token */
  function prettyToken(token) {
    switch (token) {
      case BOM:
        return "<BOM>";
      case DOCUMENT:
        return "<DOC>";
      case FLOW_END:
        return "<FLOW_END>";
      case SCALAR:
        return "<SCALAR>";
      default:
        return JSON.stringify(token);
    }
  }
  /** Identify the type of a lexer token. May return `null` for unknown tokens. */
  function tokenType(source) {
    switch (source) {
      case BOM:
        return "byte-order-mark";
      case DOCUMENT:
        return "doc-mode";
      case FLOW_END:
        return "flow-error-end";
      case SCALAR:
        return "scalar";
      case "---":
        return "doc-start";
      case "...":
        return "doc-end";
      case "":
      case "\n":
      case "\r\n":
        return "newline";
      case "-":
        return "seq-item-ind";
      case "?":
        return "explicit-key-ind";
      case ":":
        return "map-value-ind";
      case "{":
        return "flow-map-start";
      case "}":
        return "flow-map-end";
      case "[":
        return "flow-seq-start";
      case "]":
        return "flow-seq-end";
      case ",":
        return "comma";
    }
    switch (source[0]) {
      case " ":
      case "	":
        return "space";
      case "#":
        return "comment";
      case "%":
        return "directive-line";
      case "*":
        return "alias";
      case "&":
        return "anchor";
      case "!":
        return "tag";
      case "'":
        return "single-quoted-scalar";
      case '"':
        return "double-quoted-scalar";
      case "|":
      case ">":
        return "block-scalar-header";
    }
    return null;
  }
  exports.createScalarToken = cstScalar.createScalarToken;
  exports.resolveAsScalar = cstScalar.resolveAsScalar;
  exports.setScalarValue = cstScalar.setScalarValue;
  exports.stringify = cstStringify.stringify;
  exports.visit = cstVisit.visit;
  exports.BOM = BOM;
  exports.DOCUMENT = DOCUMENT;
  exports.FLOW_END = FLOW_END;
  exports.SCALAR = SCALAR;
  exports.isCollection = isCollection;
  exports.isScalar = isScalar;
  exports.prettyToken = prettyToken;
  exports.tokenType = tokenType;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/lexer.js
var require_lexer = /* @__PURE__ */ __commonJSMin((exports) => {
  var cst = require_cst();
  function isEmpty(ch) {
    switch (ch) {
      case void 0:
      case " ":
      case "\n":
      case "\r":
      case "	":
        return true;
      default:
        return false;
    }
  }
  const hexDigits = /* @__PURE__ */ new Set("0123456789ABCDEFabcdef");
  const tagChars = /* @__PURE__ */ new Set(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()",
  );
  const flowIndicatorChars = /* @__PURE__ */ new Set(",[]{}");
  const invalidAnchorChars = /* @__PURE__ */ new Set(" ,[]{}\n\r	");
  const isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
  /**
   * Splits an input string into lexical tokens, i.e. smaller strings that are
   * easily identifiable by `tokens.tokenType()`.
   *
   * Lexing starts always in a "stream" context. Incomplete input may be buffered
   * until a complete token can be emitted.
   *
   * In addition to slices of the original input, the following control characters
   * may also be emitted:
   *
   * - `\x02` (Start of Text): A document starts with the next token
   * - `\x18` (Cancel): Unexpected end of flow-mode (indicates an error)
   * - `\x1f` (Unit Separator): Next token is a scalar value
   * - `\u{FEFF}` (Byte order mark): Emitted separately outside documents
   */
  var Lexer = class {
    constructor() {
      /**
       * Flag indicating whether the end of the current buffer marks the end of
       * all input
       */
      this.atEnd = false;
      /**
       * Explicit indent set in block scalar header, as an offset from the current
       * minimum indent, so e.g. set to 1 from a header `|2+`. Set to -1 if not
       * explicitly set.
       */
      this.blockScalarIndent = -1;
      /**
       * Block scalars that include a + (keep) chomping indicator in their header
       * include trailing empty lines, which are otherwise excluded from the
       * scalar's contents.
       */
      this.blockScalarKeep = false;
      /** Current input */
      this.buffer = "";
      /**
       * Flag noting whether the map value indicator : can immediately follow this
       * node within a flow context.
       */
      this.flowKey = false;
      /** Count of surrounding flow collection levels. */
      this.flowLevel = 0;
      /**
       * Minimum level of indentation required for next lines to be parsed as a
       * part of the current scalar value.
       */
      this.indentNext = 0;
      /** Indentation level of the current line. */
      this.indentValue = 0;
      /** Position of the next \n character. */
      this.lineEndPos = null;
      /** Stores the state of the lexer if reaching the end of incpomplete input */
      this.next = null;
      /** A pointer to `buffer`; the current position of the lexer. */
      this.pos = 0;
    }
    /**
     * Generate YAML tokens from the `source` string. If `incomplete`,
     * a part of the last line may be left as a buffer for the next call.
     *
     * @returns A generator of lexical tokens
     */
    *lex(source, incomplete = false) {
      if (source) {
        if (typeof source !== "string") throw TypeError("source is not a string");
        this.buffer = this.buffer ? this.buffer + source : source;
        this.lineEndPos = null;
      }
      this.atEnd = !incomplete;
      let next = this.next ?? "stream";
      while (next && (incomplete || this.hasChars(1))) next = yield* this.parseNext(next);
    }
    atLineEnd() {
      let i = this.pos;
      let ch = this.buffer[i];
      while (ch === " " || ch === "	") ch = this.buffer[++i];
      if (!ch || ch === "#" || ch === "\n") return true;
      if (ch === "\r") return this.buffer[i + 1] === "\n";
      return false;
    }
    charAt(n) {
      return this.buffer[this.pos + n];
    }
    continueScalar(offset) {
      let ch = this.buffer[offset];
      if (this.indentNext > 0) {
        let indent = 0;
        while (ch === " ") ch = this.buffer[++indent + offset];
        if (ch === "\r") {
          const next = this.buffer[indent + offset + 1];
          if (next === "\n" || (!next && !this.atEnd)) return offset + indent + 1;
        }
        return ch === "\n" || indent >= this.indentNext || (!ch && !this.atEnd)
          ? offset + indent
          : -1;
      }
      if (ch === "-" || ch === ".") {
        const dt = this.buffer.substr(offset, 3);
        if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3])) return -1;
      }
      return offset;
    }
    getLine() {
      let end = this.lineEndPos;
      if (typeof end !== "number" || (end !== -1 && end < this.pos)) {
        end = this.buffer.indexOf("\n", this.pos);
        this.lineEndPos = end;
      }
      if (end === -1) return this.atEnd ? this.buffer.substring(this.pos) : null;
      if (this.buffer[end - 1] === "\r") end -= 1;
      return this.buffer.substring(this.pos, end);
    }
    hasChars(n) {
      return this.pos + n <= this.buffer.length;
    }
    setNext(state) {
      this.buffer = this.buffer.substring(this.pos);
      this.pos = 0;
      this.lineEndPos = null;
      this.next = state;
      return null;
    }
    peek(n) {
      return this.buffer.substr(this.pos, n);
    }
    *parseNext(next) {
      switch (next) {
        case "stream":
          return yield* this.parseStream();
        case "line-start":
          return yield* this.parseLineStart();
        case "block-start":
          return yield* this.parseBlockStart();
        case "doc":
          return yield* this.parseDocument();
        case "flow":
          return yield* this.parseFlowCollection();
        case "quoted-scalar":
          return yield* this.parseQuotedScalar();
        case "block-scalar":
          return yield* this.parseBlockScalar();
        case "plain-scalar":
          return yield* this.parsePlainScalar();
      }
    }
    *parseStream() {
      let line = this.getLine();
      if (line === null) return this.setNext("stream");
      if (line[0] === cst.BOM) {
        yield* this.pushCount(1);
        line = line.substring(1);
      }
      if (line[0] === "%") {
        let dirEnd = line.length;
        let cs = line.indexOf("#");
        while (cs !== -1) {
          const ch = line[cs - 1];
          if (ch === " " || ch === "	") {
            dirEnd = cs - 1;
            break;
          } else cs = line.indexOf("#", cs + 1);
        }
        while (true) {
          const ch = line[dirEnd - 1];
          if (ch === " " || ch === "	") dirEnd -= 1;
          else break;
        }
        const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
        yield* this.pushCount(line.length - n);
        this.pushNewline();
        return "stream";
      }
      if (this.atLineEnd()) {
        const sp = yield* this.pushSpaces(true);
        yield* this.pushCount(line.length - sp);
        yield* this.pushNewline();
        return "stream";
      }
      yield cst.DOCUMENT;
      return yield* this.parseLineStart();
    }
    *parseLineStart() {
      const ch = this.charAt(0);
      if (!ch && !this.atEnd) return this.setNext("line-start");
      if (ch === "-" || ch === ".") {
        if (!this.atEnd && !this.hasChars(4)) return this.setNext("line-start");
        const s = this.peek(3);
        if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
          yield* this.pushCount(3);
          this.indentValue = 0;
          this.indentNext = 0;
          return s === "---" ? "doc" : "stream";
        }
      }
      this.indentValue = yield* this.pushSpaces(false);
      if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
        this.indentNext = this.indentValue;
      return yield* this.parseBlockStart();
    }
    *parseBlockStart() {
      const [ch0, ch1] = this.peek(2);
      if (!ch1 && !this.atEnd) return this.setNext("block-start");
      if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
        const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
        this.indentNext = this.indentValue + 1;
        this.indentValue += n;
        return yield* this.parseBlockStart();
      }
      return "doc";
    }
    *parseDocument() {
      yield* this.pushSpaces(true);
      const line = this.getLine();
      if (line === null) return this.setNext("doc");
      let n = yield* this.pushIndicators();
      switch (line[n]) {
        case "#":
          yield* this.pushCount(line.length - n);
        case void 0:
          yield* this.pushNewline();
          return yield* this.parseLineStart();
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel = 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          return "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "doc";
        case '"':
        case "'":
          return yield* this.parseQuotedScalar();
        case "|":
        case ">":
          n += yield* this.parseBlockScalarHeader();
          n += yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - n);
          yield* this.pushNewline();
          return yield* this.parseBlockScalar();
        default:
          return yield* this.parsePlainScalar();
      }
    }
    *parseFlowCollection() {
      let nl, sp;
      let indent = -1;
      do {
        nl = yield* this.pushNewline();
        if (nl > 0) {
          sp = yield* this.pushSpaces(false);
          this.indentValue = indent = sp;
        } else sp = 0;
        sp += yield* this.pushSpaces(true);
      } while (nl + sp > 0);
      const line = this.getLine();
      if (line === null) return this.setNext("flow");
      if (
        (indent !== -1 && indent < this.indentNext && line[0] !== "#") ||
        (indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3]))
      ) {
        if (
          !(
            indent === this.indentNext - 1 &&
            this.flowLevel === 1 &&
            (line[0] === "]" || line[0] === "}")
          )
        ) {
          this.flowLevel = 0;
          yield cst.FLOW_END;
          return yield* this.parseLineStart();
        }
      }
      let n = 0;
      while (line[n] === ",") {
        n += yield* this.pushCount(1);
        n += yield* this.pushSpaces(true);
        this.flowKey = false;
      }
      n += yield* this.pushIndicators();
      switch (line[n]) {
        case void 0:
          return "flow";
        case "#":
          yield* this.pushCount(line.length - n);
          return "flow";
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel += 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          this.flowKey = true;
          this.flowLevel -= 1;
          return this.flowLevel ? "flow" : "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "flow";
        case '"':
        case "'":
          this.flowKey = true;
          return yield* this.parseQuotedScalar();
        case ":": {
          const next = this.charAt(1);
          if (this.flowKey || isEmpty(next) || next === ",") {
            this.flowKey = false;
            yield* this.pushCount(1);
            yield* this.pushSpaces(true);
            return "flow";
          }
        }
        default:
          this.flowKey = false;
          return yield* this.parsePlainScalar();
      }
    }
    *parseQuotedScalar() {
      const quote = this.charAt(0);
      let end = this.buffer.indexOf(quote, this.pos + 1);
      if (quote === "'")
        while (end !== -1 && this.buffer[end + 1] === "'") end = this.buffer.indexOf("'", end + 2);
      else
        while (end !== -1) {
          let n = 0;
          while (this.buffer[end - 1 - n] === "\\") n += 1;
          if (n % 2 === 0) break;
          end = this.buffer.indexOf('"', end + 1);
        }
      const qb = this.buffer.substring(0, end);
      let nl = qb.indexOf("\n", this.pos);
      if (nl !== -1) {
        while (nl !== -1) {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1) break;
          nl = qb.indexOf("\n", cs);
        }
        if (nl !== -1) end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
      }
      if (end === -1) {
        if (!this.atEnd) return this.setNext("quoted-scalar");
        end = this.buffer.length;
      }
      yield* this.pushToIndex(end + 1, false);
      return this.flowLevel ? "flow" : "doc";
    }
    *parseBlockScalarHeader() {
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      let i = this.pos;
      while (true) {
        const ch = this.buffer[++i];
        if (ch === "+") this.blockScalarKeep = true;
        else if (ch > "0" && ch <= "9") this.blockScalarIndent = Number(ch) - 1;
        else if (ch !== "-") break;
      }
      return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
    }
    *parseBlockScalar() {
      let nl = this.pos - 1;
      let indent = 0;
      let ch;
      loop: for (let i = this.pos; (ch = this.buffer[i]); ++i)
        switch (ch) {
          case " ":
            indent += 1;
            break;
          case "\n":
            nl = i;
            indent = 0;
            break;
          case "\r": {
            const next = this.buffer[i + 1];
            if (!next && !this.atEnd) return this.setNext("block-scalar");
            if (next === "\n") break;
          }
          default:
            break loop;
        }
      if (!ch && !this.atEnd) return this.setNext("block-scalar");
      if (indent >= this.indentNext) {
        if (this.blockScalarIndent === -1) this.indentNext = indent;
        else
          this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
        do {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1) break;
          nl = this.buffer.indexOf("\n", cs);
        } while (nl !== -1);
        if (nl === -1) {
          if (!this.atEnd) return this.setNext("block-scalar");
          nl = this.buffer.length;
        }
      }
      let i = nl + 1;
      ch = this.buffer[i];
      while (ch === " ") ch = this.buffer[++i];
      if (ch === "	") {
        while (ch === "	" || ch === " " || ch === "\r" || ch === "\n") ch = this.buffer[++i];
        nl = i - 1;
      } else if (!this.blockScalarKeep)
        do {
          let i = nl - 1;
          let ch = this.buffer[i];
          if (ch === "\r") ch = this.buffer[--i];
          const lastChar = i;
          while (ch === " ") ch = this.buffer[--i];
          if (ch === "\n" && i >= this.pos && i + 1 + indent > lastChar) nl = i;
          else break;
        } while (true);
      yield cst.SCALAR;
      yield* this.pushToIndex(nl + 1, true);
      return yield* this.parseLineStart();
    }
    *parsePlainScalar() {
      const inFlow = this.flowLevel > 0;
      let end = this.pos - 1;
      let i = this.pos - 1;
      let ch;
      while ((ch = this.buffer[++i]))
        if (ch === ":") {
          const next = this.buffer[i + 1];
          if (isEmpty(next) || (inFlow && flowIndicatorChars.has(next))) break;
          end = i;
        } else if (isEmpty(ch)) {
          let next = this.buffer[i + 1];
          if (ch === "\r")
            if (next === "\n") {
              i += 1;
              ch = "\n";
              next = this.buffer[i + 1];
            } else end = i;
          if (next === "#" || (inFlow && flowIndicatorChars.has(next))) break;
          if (ch === "\n") {
            const cs = this.continueScalar(i + 1);
            if (cs === -1) break;
            i = Math.max(i, cs - 2);
          }
        } else {
          if (inFlow && flowIndicatorChars.has(ch)) break;
          end = i;
        }
      if (!ch && !this.atEnd) return this.setNext("plain-scalar");
      yield cst.SCALAR;
      yield* this.pushToIndex(end + 1, true);
      return inFlow ? "flow" : "doc";
    }
    *pushCount(n) {
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos += n;
        return n;
      }
      return 0;
    }
    *pushToIndex(i, allowEmpty) {
      const s = this.buffer.slice(this.pos, i);
      if (s) {
        yield s;
        this.pos += s.length;
        return s.length;
      } else if (allowEmpty) yield "";
      return 0;
    }
    *pushIndicators() {
      switch (this.charAt(0)) {
        case "!":
          return (
            (yield* this.pushTag()) +
            (yield* this.pushSpaces(true)) +
            (yield* this.pushIndicators())
          );
        case "&":
          return (
            (yield* this.pushUntil(isNotAnchorChar)) +
            (yield* this.pushSpaces(true)) +
            (yield* this.pushIndicators())
          );
        case "-":
        case "?":
        case ":": {
          const inFlow = this.flowLevel > 0;
          const ch1 = this.charAt(1);
          if (isEmpty(ch1) || (inFlow && flowIndicatorChars.has(ch1))) {
            if (!inFlow) this.indentNext = this.indentValue + 1;
            else if (this.flowKey) this.flowKey = false;
            return (
              (yield* this.pushCount(1)) +
              (yield* this.pushSpaces(true)) +
              (yield* this.pushIndicators())
            );
          }
        }
      }
      return 0;
    }
    *pushTag() {
      if (this.charAt(1) === "<") {
        let i = this.pos + 2;
        let ch = this.buffer[i];
        while (!isEmpty(ch) && ch !== ">") ch = this.buffer[++i];
        return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
      } else {
        let i = this.pos + 1;
        let ch = this.buffer[i];
        while (ch)
          if (tagChars.has(ch)) ch = this.buffer[++i];
          else if (
            ch === "%" &&
            hexDigits.has(this.buffer[i + 1]) &&
            hexDigits.has(this.buffer[i + 2])
          )
            ch = this.buffer[(i += 3)];
          else break;
        return yield* this.pushToIndex(i, false);
      }
    }
    *pushNewline() {
      const ch = this.buffer[this.pos];
      if (ch === "\n") return yield* this.pushCount(1);
      else if (ch === "\r" && this.charAt(1) === "\n") return yield* this.pushCount(2);
      else return 0;
    }
    *pushSpaces(allowTabs) {
      let i = this.pos - 1;
      let ch;
      do ch = this.buffer[++i];
      while (ch === " " || (allowTabs && ch === "	"));
      const n = i - this.pos;
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos = i;
      }
      return n;
    }
    *pushUntil(test) {
      let i = this.pos;
      let ch = this.buffer[i];
      while (!test(ch)) ch = this.buffer[++i];
      return yield* this.pushToIndex(i, false);
    }
  };
  exports.Lexer = Lexer;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = /* @__PURE__ */ __commonJSMin((exports) => {
  /**
   * Tracks newlines during parsing in order to provide an efficient API for
   * determining the one-indexed `{ line, col }` position for any offset
   * within the input.
   */
  var LineCounter = class {
    constructor() {
      this.lineStarts = [];
      /**
       * Should be called in ascending order. Otherwise, call
       * `lineCounter.lineStarts.sort()` before calling `linePos()`.
       */
      this.addNewLine = (offset) => this.lineStarts.push(offset);
      /**
       * Performs a binary search and returns the 1-indexed { line, col }
       * position of `offset`. If `line === 0`, `addNewLine` has never been
       * called or `offset` is before the first known newline.
       */
      this.linePos = (offset) => {
        let low = 0;
        let high = this.lineStarts.length;
        while (low < high) {
          const mid = (low + high) >> 1;
          if (this.lineStarts[mid] < offset) low = mid + 1;
          else high = mid;
        }
        if (this.lineStarts[low] === offset)
          return {
            line: low + 1,
            col: 1,
          };
        if (low === 0)
          return {
            line: 0,
            col: offset,
          };
        const start = this.lineStarts[low - 1];
        return {
          line: low,
          col: offset - start + 1,
        };
      };
    }
  };
  exports.LineCounter = LineCounter;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/parse/parser.js
var require_parser$1 = /* @__PURE__ */ __commonJSMin((exports) => {
  var node_process = __require("process");
  var cst = require_cst();
  var lexer = require_lexer();
  function includesToken(list, type) {
    for (let i = 0; i < list.length; ++i) if (list[i].type === type) return true;
    return false;
  }
  function findNonEmptyIndex(list) {
    for (let i = 0; i < list.length; ++i)
      switch (list[i].type) {
        case "space":
        case "comment":
        case "newline":
          break;
        default:
          return i;
      }
    return -1;
  }
  function isFlowToken(token) {
    switch (token?.type) {
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "flow-collection":
        return true;
      default:
        return false;
    }
  }
  function getPrevProps(parent) {
    switch (parent.type) {
      case "document":
        return parent.start;
      case "block-map": {
        const it = parent.items[parent.items.length - 1];
        return it.sep ?? it.start;
      }
      case "block-seq":
        return parent.items[parent.items.length - 1].start;
      /* istanbul ignore next should not happen */
      default:
        return [];
    }
  }
  /** Note: May modify input array */
  function getFirstKeyStartProps(prev) {
    if (prev.length === 0) return [];
    let i = prev.length;
    loop: while (--i >= 0)
      switch (prev[i].type) {
        case "doc-start":
        case "explicit-key-ind":
        case "map-value-ind":
        case "seq-item-ind":
        case "newline":
          break loop;
      }
    while (prev[++i]?.type === "space");
    return prev.splice(i, prev.length);
  }
  function fixFlowSeqItems(fc) {
    if (fc.start.type === "flow-seq-start") {
      for (const it of fc.items)
        if (
          it.sep &&
          !it.value &&
          !includesToken(it.start, "explicit-key-ind") &&
          !includesToken(it.sep, "map-value-ind")
        ) {
          if (it.key) it.value = it.key;
          delete it.key;
          if (isFlowToken(it.value))
            if (it.value.end) Array.prototype.push.apply(it.value.end, it.sep);
            else it.value.end = it.sep;
          else Array.prototype.push.apply(it.start, it.sep);
          delete it.sep;
        }
    }
  }
  /**
   * A YAML concrete syntax tree (CST) parser
   *
   * ```ts
   * const src: string = ...
   * for (const token of new Parser().parse(src)) {
   *   // token: Token
   * }
   * ```
   *
   * To use the parser with a user-provided lexer:
   *
   * ```ts
   * function* parse(source: string, lexer: Lexer) {
   *   const parser = new Parser()
   *   for (const lexeme of lexer.lex(source))
   *     yield* parser.next(lexeme)
   *   yield* parser.end()
   * }
   *
   * const src: string = ...
   * const lexer = new Lexer()
   * for (const token of parse(src, lexer)) {
   *   // token: Token
   * }
   * ```
   */
  var Parser = class {
    /**
     * @param onNewLine - If defined, called separately with the start position of
     *   each new line (in `parse()`, including the start of input).
     */
    constructor(onNewLine) {
      /** If true, space and sequence indicators count as indentation */
      this.atNewLine = true;
      /** If true, next token is a scalar value */
      this.atScalar = false;
      /** Current indentation level */
      this.indent = 0;
      /** Current offset since the start of parsing */
      this.offset = 0;
      /** On the same line with a block map key */
      this.onKeyLine = false;
      /** Top indicates the node that's currently being built */
      this.stack = [];
      /** The source of the current token, set in parse() */
      this.source = "";
      /** The type of the current token, set in parse() */
      this.type = "";
      this.lexer = new lexer.Lexer();
      this.onNewLine = onNewLine;
    }
    /**
     * Parse `source` as a YAML stream.
     * If `incomplete`, a part of the last line may be left as a buffer for the next call.
     *
     * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
     *
     * @returns A generator of tokens representing each directive, document, and other structure.
     */
    *parse(source, incomplete = false) {
      if (this.onNewLine && this.offset === 0) this.onNewLine(0);
      for (const lexeme of this.lexer.lex(source, incomplete)) yield* this.next(lexeme);
      if (!incomplete) yield* this.end();
    }
    /**
     * Advance the parser by the `source` of one lexical token.
     */
    *next(source) {
      this.source = source;
      if (node_process.env.LOG_TOKENS) console.log("|", cst.prettyToken(source));
      if (this.atScalar) {
        this.atScalar = false;
        yield* this.step();
        this.offset += source.length;
        return;
      }
      const type = cst.tokenType(source);
      if (!type) {
        const message = `Not a YAML token: ${source}`;
        yield* this.pop({
          type: "error",
          offset: this.offset,
          message,
          source,
        });
        this.offset += source.length;
      } else if (type === "scalar") {
        this.atNewLine = false;
        this.atScalar = true;
        this.type = "scalar";
      } else {
        this.type = type;
        yield* this.step();
        switch (type) {
          case "newline":
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) this.onNewLine(this.offset + source.length);
            break;
          case "space":
            if (this.atNewLine && source[0] === " ") this.indent += source.length;
            break;
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
            if (this.atNewLine) this.indent += source.length;
            break;
          case "doc-mode":
          case "flow-error-end":
            return;
          default:
            this.atNewLine = false;
        }
        this.offset += source.length;
      }
    }
    /** Call at end of input to push out any remaining constructions */
    *end() {
      while (this.stack.length > 0) yield* this.pop();
    }
    get sourceToken() {
      return {
        type: this.type,
        offset: this.offset,
        indent: this.indent,
        source: this.source,
      };
    }
    *step() {
      const top = this.peek(1);
      if (this.type === "doc-end" && top?.type !== "doc-end") {
        while (this.stack.length > 0) yield* this.pop();
        this.stack.push({
          type: "doc-end",
          offset: this.offset,
          source: this.source,
        });
        return;
      }
      if (!top) return yield* this.stream();
      switch (top.type) {
        case "document":
          return yield* this.document(top);
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return yield* this.scalar(top);
        case "block-scalar":
          return yield* this.blockScalar(top);
        case "block-map":
          return yield* this.blockMap(top);
        case "block-seq":
          return yield* this.blockSequence(top);
        case "flow-collection":
          return yield* this.flowCollection(top);
        case "doc-end":
          return yield* this.documentEnd(top);
      }
      /* istanbul ignore next should not happen */
      yield* this.pop();
    }
    peek(n) {
      return this.stack[this.stack.length - n];
    }
    *pop(error) {
      const token = error ?? this.stack.pop();
      /* istanbul ignore if should not happen */
      if (!token)
        yield {
          type: "error",
          offset: this.offset,
          source: "",
          message: "Tried to pop an empty stack",
        };
      else if (this.stack.length === 0) yield token;
      else {
        const top = this.peek(1);
        if (token.type === "block-scalar") token.indent = "indent" in top ? top.indent : 0;
        else if (token.type === "flow-collection" && top.type === "document") token.indent = 0;
        if (token.type === "flow-collection") fixFlowSeqItems(token);
        switch (top.type) {
          case "document":
            top.value = token;
            break;
          case "block-scalar":
            top.props.push(token);
            break;
          case "block-map": {
            const it = top.items[top.items.length - 1];
            if (it.value) {
              top.items.push({
                start: [],
                key: token,
                sep: [],
              });
              this.onKeyLine = true;
              return;
            } else if (it.sep) it.value = token;
            else {
              Object.assign(it, {
                key: token,
                sep: [],
              });
              this.onKeyLine = !it.explicitKey;
              return;
            }
            break;
          }
          case "block-seq": {
            const it = top.items[top.items.length - 1];
            if (it.value)
              top.items.push({
                start: [],
                value: token,
              });
            else it.value = token;
            break;
          }
          case "flow-collection": {
            const it = top.items[top.items.length - 1];
            if (!it || it.value)
              top.items.push({
                start: [],
                key: token,
                sep: [],
              });
            else if (it.sep) it.value = token;
            else
              Object.assign(it, {
                key: token,
                sep: [],
              });
            return;
          }
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.pop(token);
        }
        if (
          (top.type === "document" || top.type === "block-map" || top.type === "block-seq") &&
          (token.type === "block-map" || token.type === "block-seq")
        ) {
          const last = token.items[token.items.length - 1];
          if (
            last &&
            !last.sep &&
            !last.value &&
            last.start.length > 0 &&
            findNonEmptyIndex(last.start) === -1 &&
            (token.indent === 0 ||
              last.start.every((st) => st.type !== "comment" || st.indent < token.indent))
          ) {
            if (top.type === "document") top.end = last.start;
            else top.items.push({ start: last.start });
            token.items.splice(-1, 1);
          }
        }
      }
    }
    *stream() {
      switch (this.type) {
        case "directive-line":
          yield {
            type: "directive",
            offset: this.offset,
            source: this.source,
          };
          return;
        case "byte-order-mark":
        case "space":
        case "comment":
        case "newline":
          yield this.sourceToken;
          return;
        case "doc-mode":
        case "doc-start": {
          const doc = {
            type: "document",
            offset: this.offset,
            start: [],
          };
          if (this.type === "doc-start") doc.start.push(this.sourceToken);
          this.stack.push(doc);
          return;
        }
      }
      yield {
        type: "error",
        offset: this.offset,
        message: `Unexpected ${this.type} token in YAML stream`,
        source: this.source,
      };
    }
    *document(doc) {
      if (doc.value) return yield* this.lineEnd(doc);
      switch (this.type) {
        case "doc-start":
          if (findNonEmptyIndex(doc.start) !== -1) {
            yield* this.pop();
            yield* this.step();
          } else doc.start.push(this.sourceToken);
          return;
        case "anchor":
        case "tag":
        case "space":
        case "comment":
        case "newline":
          doc.start.push(this.sourceToken);
          return;
      }
      const bv = this.startBlockValue(doc);
      if (bv) this.stack.push(bv);
      else
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML document`,
          source: this.source,
        };
    }
    *scalar(scalar) {
      if (this.type === "map-value-ind") {
        const start = getFirstKeyStartProps(getPrevProps(this.peek(2)));
        let sep;
        if (scalar.end) {
          sep = scalar.end;
          sep.push(this.sourceToken);
          delete scalar.end;
        } else sep = [this.sourceToken];
        const map = {
          type: "block-map",
          offset: scalar.offset,
          indent: scalar.indent,
          items: [
            {
              start,
              key: scalar,
              sep,
            },
          ],
        };
        this.onKeyLine = true;
        this.stack[this.stack.length - 1] = map;
      } else yield* this.lineEnd(scalar);
    }
    *blockScalar(scalar) {
      switch (this.type) {
        case "space":
        case "comment":
        case "newline":
          scalar.props.push(this.sourceToken);
          return;
        case "scalar":
          scalar.source = this.source;
          this.atNewLine = true;
          this.indent = 0;
          if (this.onNewLine) {
            let nl = this.source.indexOf("\n") + 1;
            while (nl !== 0) {
              this.onNewLine(this.offset + nl);
              nl = this.source.indexOf("\n", nl) + 1;
            }
          }
          yield* this.pop();
          break;
        /* istanbul ignore next should not happen */
        default:
          yield* this.pop();
          yield* this.step();
      }
    }
    *blockMap(map) {
      const it = map.items[map.items.length - 1];
      switch (this.type) {
        case "newline":
          this.onKeyLine = false;
          if (it.value) {
            const end = "end" in it.value ? it.value.end : void 0;
            if ((Array.isArray(end) ? end[end.length - 1] : void 0)?.type === "comment")
              end?.push(this.sourceToken);
            else map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) it.sep.push(this.sourceToken);
          else it.start.push(this.sourceToken);
          return;
        case "space":
        case "comment":
          if (it.value) map.items.push({ start: [this.sourceToken] });
          else if (it.sep) it.sep.push(this.sourceToken);
          else {
            if (this.atIndentedComment(it.start, map.indent)) {
              const end = map.items[map.items.length - 2]?.value?.end;
              if (Array.isArray(end)) {
                Array.prototype.push.apply(end, it.start);
                end.push(this.sourceToken);
                map.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
      }
      if (this.indent >= map.indent) {
        const atMapIndent = !this.onKeyLine && this.indent === map.indent;
        const atNextItem =
          atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
        let start = [];
        if (atNextItem && it.sep && !it.value) {
          const nl = [];
          for (let i = 0; i < it.sep.length; ++i) {
            const st = it.sep[i];
            switch (st.type) {
              case "newline":
                nl.push(i);
                break;
              case "space":
                break;
              case "comment":
                if (st.indent > map.indent) nl.length = 0;
                break;
              default:
                nl.length = 0;
            }
          }
          if (nl.length >= 2) start = it.sep.splice(nl[1]);
        }
        switch (this.type) {
          case "anchor":
          case "tag":
            if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start });
              this.onKeyLine = true;
            } else if (it.sep) it.sep.push(this.sourceToken);
            else it.start.push(this.sourceToken);
            return;
          case "explicit-key-ind":
            if (!it.sep && !it.explicitKey) {
              it.start.push(this.sourceToken);
              it.explicitKey = true;
            } else if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({
                start,
                explicitKey: true,
              });
            } else
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [
                  {
                    start: [this.sourceToken],
                    explicitKey: true,
                  },
                ],
              });
            this.onKeyLine = true;
            return;
          case "map-value-ind":
            if (it.explicitKey)
              if (!it.sep)
                if (includesToken(it.start, "newline"))
                  Object.assign(it, {
                    key: null,
                    sep: [this.sourceToken],
                  });
                else {
                  const start = getFirstKeyStartProps(it.start);
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [
                      {
                        start,
                        key: null,
                        sep: [this.sourceToken],
                      },
                    ],
                  });
                }
              else if (it.value)
                map.items.push({
                  start: [],
                  key: null,
                  sep: [this.sourceToken],
                });
              else if (includesToken(it.sep, "map-value-ind"))
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [
                    {
                      start,
                      key: null,
                      sep: [this.sourceToken],
                    },
                  ],
                });
              else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                const start = getFirstKeyStartProps(it.start);
                const key = it.key;
                const sep = it.sep;
                sep.push(this.sourceToken);
                delete it.key;
                delete it.sep;
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [
                    {
                      start,
                      key,
                      sep,
                    },
                  ],
                });
              } else if (start.length > 0) it.sep = it.sep.concat(start, this.sourceToken);
              else it.sep.push(this.sourceToken);
            else if (!it.sep)
              Object.assign(it, {
                key: null,
                sep: [this.sourceToken],
              });
            else if (it.value || atNextItem)
              map.items.push({
                start,
                key: null,
                sep: [this.sourceToken],
              });
            else if (includesToken(it.sep, "map-value-ind"))
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [
                  {
                    start: [],
                    key: null,
                    sep: [this.sourceToken],
                  },
                ],
              });
            else it.sep.push(this.sourceToken);
            this.onKeyLine = true;
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (atNextItem || it.value) {
              map.items.push({
                start,
                key: fs,
                sep: [],
              });
              this.onKeyLine = true;
            } else if (it.sep) this.stack.push(fs);
            else {
              Object.assign(it, {
                key: fs,
                sep: [],
              });
              this.onKeyLine = true;
            }
            return;
          }
          default: {
            const bv = this.startBlockValue(map);
            if (bv) {
              if (bv.type === "block-seq") {
                if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                  yield* this.pop({
                    type: "error",
                    offset: this.offset,
                    message: "Unexpected block-seq-ind on same line with key",
                    source: this.source,
                  });
                  return;
                }
              } else if (atMapIndent) map.items.push({ start });
              this.stack.push(bv);
              return;
            }
          }
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *blockSequence(seq) {
      const it = seq.items[seq.items.length - 1];
      switch (this.type) {
        case "newline":
          if (it.value) {
            const end = "end" in it.value ? it.value.end : void 0;
            if ((Array.isArray(end) ? end[end.length - 1] : void 0)?.type === "comment")
              end?.push(this.sourceToken);
            else seq.items.push({ start: [this.sourceToken] });
          } else it.start.push(this.sourceToken);
          return;
        case "space":
        case "comment":
          if (it.value) seq.items.push({ start: [this.sourceToken] });
          else {
            if (this.atIndentedComment(it.start, seq.indent)) {
              const end = seq.items[seq.items.length - 2]?.value?.end;
              if (Array.isArray(end)) {
                Array.prototype.push.apply(end, it.start);
                end.push(this.sourceToken);
                seq.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
        case "anchor":
        case "tag":
          if (it.value || this.indent <= seq.indent) break;
          it.start.push(this.sourceToken);
          return;
        case "seq-item-ind":
          if (this.indent !== seq.indent) break;
          if (it.value || includesToken(it.start, "seq-item-ind"))
            seq.items.push({ start: [this.sourceToken] });
          else it.start.push(this.sourceToken);
          return;
      }
      if (this.indent > seq.indent) {
        const bv = this.startBlockValue(seq);
        if (bv) {
          this.stack.push(bv);
          return;
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *flowCollection(fc) {
      const it = fc.items[fc.items.length - 1];
      if (this.type === "flow-error-end") {
        let top;
        do {
          yield* this.pop();
          top = this.peek(1);
        } while (top?.type === "flow-collection");
      } else if (fc.end.length === 0) {
        switch (this.type) {
          case "comma":
          case "explicit-key-ind":
            if (!it || it.sep) fc.items.push({ start: [this.sourceToken] });
            else it.start.push(this.sourceToken);
            return;
          case "map-value-ind":
            if (!it || it.value)
              fc.items.push({
                start: [],
                key: null,
                sep: [this.sourceToken],
              });
            else if (it.sep) it.sep.push(this.sourceToken);
            else
              Object.assign(it, {
                key: null,
                sep: [this.sourceToken],
              });
            return;
          case "space":
          case "comment":
          case "newline":
          case "anchor":
          case "tag":
            if (!it || it.value) fc.items.push({ start: [this.sourceToken] });
            else if (it.sep) it.sep.push(this.sourceToken);
            else it.start.push(this.sourceToken);
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (!it || it.value)
              fc.items.push({
                start: [],
                key: fs,
                sep: [],
              });
            else if (it.sep) this.stack.push(fs);
            else
              Object.assign(it, {
                key: fs,
                sep: [],
              });
            return;
          }
          case "flow-map-end":
          case "flow-seq-end":
            fc.end.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(fc);
        /* istanbul ignore else should not happen */
        if (bv) this.stack.push(bv);
        else {
          yield* this.pop();
          yield* this.step();
        }
      } else {
        const parent = this.peek(2);
        if (
          parent.type === "block-map" &&
          ((this.type === "map-value-ind" && parent.indent === fc.indent) ||
            (this.type === "newline" && !parent.items[parent.items.length - 1].sep))
        ) {
          yield* this.pop();
          yield* this.step();
        } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
          const start = getFirstKeyStartProps(getPrevProps(parent));
          fixFlowSeqItems(fc);
          const sep = fc.end.splice(1, fc.end.length);
          sep.push(this.sourceToken);
          const map = {
            type: "block-map",
            offset: fc.offset,
            indent: fc.indent,
            items: [
              {
                start,
                key: fc,
                sep,
              },
            ],
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else yield* this.lineEnd(fc);
      }
    }
    flowScalar(type) {
      if (this.onNewLine) {
        let nl = this.source.indexOf("\n") + 1;
        while (nl !== 0) {
          this.onNewLine(this.offset + nl);
          nl = this.source.indexOf("\n", nl) + 1;
        }
      }
      return {
        type,
        offset: this.offset,
        indent: this.indent,
        source: this.source,
      };
    }
    startBlockValue(parent) {
      switch (this.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return this.flowScalar(this.type);
        case "block-scalar-header":
          return {
            type: "block-scalar",
            offset: this.offset,
            indent: this.indent,
            props: [this.sourceToken],
            source: "",
          };
        case "flow-map-start":
        case "flow-seq-start":
          return {
            type: "flow-collection",
            offset: this.offset,
            indent: this.indent,
            start: this.sourceToken,
            items: [],
            end: [],
          };
        case "seq-item-ind":
          return {
            type: "block-seq",
            offset: this.offset,
            indent: this.indent,
            items: [{ start: [this.sourceToken] }],
          };
        case "explicit-key-ind": {
          this.onKeyLine = true;
          const start = getFirstKeyStartProps(getPrevProps(parent));
          start.push(this.sourceToken);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [
              {
                start,
                explicitKey: true,
              },
            ],
          };
        }
        case "map-value-ind": {
          this.onKeyLine = true;
          const start = getFirstKeyStartProps(getPrevProps(parent));
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [
              {
                start,
                key: null,
                sep: [this.sourceToken],
              },
            ],
          };
        }
      }
      return null;
    }
    atIndentedComment(start, indent) {
      if (this.type !== "comment") return false;
      if (this.indent <= indent) return false;
      return start.every((st) => st.type === "newline" || st.type === "space");
    }
    *documentEnd(docEnd) {
      if (this.type !== "doc-mode") {
        if (docEnd.end) docEnd.end.push(this.sourceToken);
        else docEnd.end = [this.sourceToken];
        if (this.type === "newline") yield* this.pop();
      }
    }
    *lineEnd(token) {
      switch (this.type) {
        case "comma":
        case "doc-start":
        case "doc-end":
        case "flow-seq-end":
        case "flow-map-end":
        case "map-value-ind":
          yield* this.pop();
          yield* this.step();
          break;
        case "newline":
          this.onKeyLine = false;
        default:
          if (token.end) token.end.push(this.sourceToken);
          else token.end = [this.sourceToken];
          if (this.type === "newline") yield* this.pop();
      }
    }
  };
  exports.Parser = Parser;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/public-api.js
var require_public_api = /* @__PURE__ */ __commonJSMin((exports) => {
  var composer = require_composer();
  var Document = require_Document();
  var errors = require_errors();
  var log = require_log();
  var identity = require_identity();
  var lineCounter = require_line_counter();
  var parser = require_parser$1();
  function parseOptions(options) {
    const prettyErrors = options.prettyErrors !== false;
    return {
      lineCounter: options.lineCounter || (prettyErrors && new lineCounter.LineCounter()) || null,
      prettyErrors,
    };
  }
  /**
   * Parse the input as a stream of YAML documents.
   *
   * Documents should be separated from each other by `...` or `---` marker lines.
   *
   * @returns If an empty `docs` array is returned, it will be of type
   *   EmptyStream and contain additional stream information. In
   *   TypeScript, you should use `'empty' in docs` as a type guard for it.
   */
  function parseAllDocuments(source, options = {}) {
    const { lineCounter, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter?.addNewLine);
    const composer$1 = new composer.Composer(options);
    const docs = Array.from(composer$1.compose(parser$1.parse(source)));
    if (prettyErrors && lineCounter)
      for (const doc of docs) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter));
      }
    if (docs.length > 0) return docs;
    return Object.assign([], { empty: true }, composer$1.streamInfo());
  }
  /** Parse an input string into a single YAML.Document */
  function parseDocument(source, options = {}) {
    const { lineCounter, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter?.addNewLine);
    const composer$1 = new composer.Composer(options);
    let doc = null;
    for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length))
      if (!doc) doc = _doc;
      else if (doc.options.logLevel !== "silent") {
        doc.errors.push(
          new errors.YAMLParseError(
            _doc.range.slice(0, 2),
            "MULTIPLE_DOCS",
            "Source contains multiple documents; please use YAML.parseAllDocuments()",
          ),
        );
        break;
      }
    if (prettyErrors && lineCounter) {
      doc.errors.forEach(errors.prettifyError(source, lineCounter));
      doc.warnings.forEach(errors.prettifyError(source, lineCounter));
    }
    return doc;
  }
  function parse(src, reviver, options) {
    let _reviver = void 0;
    if (typeof reviver === "function") _reviver = reviver;
    else if (options === void 0 && reviver && typeof reviver === "object") options = reviver;
    const doc = parseDocument(src, options);
    if (!doc) return null;
    doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
    if (doc.errors.length > 0)
      if (doc.options.logLevel !== "silent") throw doc.errors[0];
      else doc.errors = [];
    return doc.toJS(Object.assign({ reviver: _reviver }, options));
  }
  function stringify(value, replacer, options) {
    let _replacer = null;
    if (typeof replacer === "function" || Array.isArray(replacer)) _replacer = replacer;
    else if (options === void 0 && replacer) options = replacer;
    if (typeof options === "string") options = options.length;
    if (typeof options === "number") {
      const indent = Math.round(options);
      options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
    }
    if (value === void 0) {
      const { keepUndefined } = options ?? replacer ?? {};
      if (!keepUndefined) return void 0;
    }
    if (identity.isDocument(value) && !_replacer) return value.toString(options);
    return new Document.Document(value, _replacer, options).toString(options);
  }
  exports.parse = parse;
  exports.parseAllDocuments = parseAllDocuments;
  exports.parseDocument = parseDocument;
  exports.stringify = stringify;
});
//#endregion
//#region ../../node_modules/.pnpm/yaml@2.8.3/node_modules/yaml/dist/index.js
var require_dist = /* @__PURE__ */ __commonJSMin((exports) => {
  var composer = require_composer();
  var Document = require_Document();
  var Schema = require_Schema();
  var errors = require_errors();
  var Alias = require_Alias();
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var cst = require_cst();
  var lexer = require_lexer();
  var lineCounter = require_line_counter();
  var parser = require_parser$1();
  var publicApi = require_public_api();
  var visit = require_visit();
  exports.Composer = composer.Composer;
  exports.Document = Document.Document;
  exports.Schema = Schema.Schema;
  exports.YAMLError = errors.YAMLError;
  exports.YAMLParseError = errors.YAMLParseError;
  exports.YAMLWarning = errors.YAMLWarning;
  exports.Alias = Alias.Alias;
  exports.isAlias = identity.isAlias;
  exports.isCollection = identity.isCollection;
  exports.isDocument = identity.isDocument;
  exports.isMap = identity.isMap;
  exports.isNode = identity.isNode;
  exports.isPair = identity.isPair;
  exports.isScalar = identity.isScalar;
  exports.isSeq = identity.isSeq;
  exports.Pair = Pair.Pair;
  exports.Scalar = Scalar.Scalar;
  exports.YAMLMap = YAMLMap.YAMLMap;
  exports.YAMLSeq = YAMLSeq.YAMLSeq;
  exports.Lexer = lexer.Lexer;
  exports.LineCounter = lineCounter.LineCounter;
  exports.Parser = parser.Parser;
  exports.parse = publicApi.parse;
  exports.parseAllDocuments = publicApi.parseAllDocuments;
  exports.parseDocument = publicApi.parseDocument;
  exports.stringify = publicApi.stringify;
  exports.visit = visit.visit;
  exports.visitAsync = visit.visitAsync;
});
//#endregion
//#region ../../node_modules/.pnpm/agent-install@0.0.5/node_modules/agent-install/dist/skill-DRd1jW7a.js
var import_dist = require_dist();
const xdgConfigHome = () => {
  const explicit = process.env.XDG_CONFIG_HOME?.trim();
  if (explicit) return explicit;
  if (platform() === "win32") {
    const localAppData = process.env.LOCALAPPDATA?.trim();
    if (localAppData) return localAppData;
  }
  return join(homedir(), ".config");
};
const CANONICAL_SKILLS_DIR = ".agents/skills";
const SKILL_MANIFEST_FILE = "SKILL.md";
const DEFAULT_CLONE_TIMEOUT_MS = 3e5;
const DEFAULT_FETCH_TIMEOUT_MS = 3e4;
const MS_PER_SECOND = 1e3;
const SKIP_DISCOVERY_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "__pycache__",
  "coverage",
  ".next",
  ".turbo",
]);
const COPY_EXCLUDE_FILES = new Set(["metadata.json"]);
const COPY_EXCLUDE_DIRS = new Set([".git", "__pycache__", "__pypackages__"]);
const WELL_KNOWN_INDEX_FILE = "index.json";
const WELL_KNOWN_PATHS = [".well-known/agent-skills", ".well-known/skills"];
const home$1 = homedir();
const configHome = xdgConfigHome();
const codexHome = process.env.CODEX_HOME?.trim() || join(home$1, ".codex");
const claudeHome = process.env.CLAUDE_CONFIG_DIR?.trim() || join(home$1, ".claude");
const vibeHome = process.env.VIBE_HOME?.trim() || join(home$1, ".vibe");
const resolveOpenClawGlobalSkillsDir = () => {
  if (existsSync(join(home$1, ".openclaw"))) return join(home$1, ".openclaw/skills");
  if (existsSync(join(home$1, ".clawdbot"))) return join(home$1, ".clawdbot/skills");
  if (existsSync(join(home$1, ".moltbot"))) return join(home$1, ".moltbot/skills");
  return join(home$1, ".openclaw/skills");
};
const detectOpenClaw = () =>
  existsSync(join(home$1, ".openclaw")) ||
  existsSync(join(home$1, ".clawdbot")) ||
  existsSync(join(home$1, ".moltbot"));
const skillAgents = {
  adal: {
    name: "adal",
    displayName: "AdaL",
    skillsDir: ".adal/skills",
    globalSkillsDir: join(home$1, ".adal/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".adal")),
  },
  "aider-desk": {
    name: "aider-desk",
    displayName: "AiderDesk",
    skillsDir: ".aider-desk/skills",
    globalSkillsDir: join(home$1, ".aider-desk/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".aider-desk")),
  },
  amp: {
    name: "amp",
    displayName: "Amp",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(configHome, "agents/skills"),
    detectInstalled: async () => existsSync(join(configHome, "amp")),
    isUniversal: true,
  },
  antigravity: {
    name: "antigravity",
    displayName: "Antigravity",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(home$1, ".gemini/antigravity/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".gemini/antigravity")),
    isUniversal: true,
  },
  augment: {
    name: "augment",
    displayName: "Augment",
    skillsDir: ".augment/skills",
    globalSkillsDir: join(home$1, ".augment/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".augment")),
  },
  bob: {
    name: "bob",
    displayName: "IBM Bob",
    skillsDir: ".bob/skills",
    globalSkillsDir: join(home$1, ".bob/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".bob")),
  },
  "claude-code": {
    name: "claude-code",
    displayName: "Claude Code",
    skillsDir: ".claude/skills",
    globalSkillsDir: join(claudeHome, "skills"),
    detectInstalled: async () => existsSync(claudeHome),
  },
  cline: {
    name: "cline",
    displayName: "Cline",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(home$1, ".agents/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".cline")),
    isUniversal: true,
  },
  "codearts-agent": {
    name: "codearts-agent",
    displayName: "CodeArts Agent",
    skillsDir: ".codeartsdoer/skills",
    globalSkillsDir: join(home$1, ".codeartsdoer/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".codeartsdoer")),
  },
  codebuddy: {
    name: "codebuddy",
    displayName: "CodeBuddy",
    skillsDir: ".codebuddy/skills",
    globalSkillsDir: join(home$1, ".codebuddy/skills"),
    detectInstalled: async () =>
      existsSync(join(process.cwd(), ".codebuddy")) || existsSync(join(home$1, ".codebuddy")),
  },
  codemaker: {
    name: "codemaker",
    displayName: "Codemaker",
    skillsDir: ".codemaker/skills",
    globalSkillsDir: join(home$1, ".codemaker/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".codemaker")),
  },
  codestudio: {
    name: "codestudio",
    displayName: "Code Studio",
    skillsDir: ".codestudio/skills",
    globalSkillsDir: join(home$1, ".codestudio/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".codestudio")),
  },
  codex: {
    name: "codex",
    displayName: "Codex",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(codexHome, "skills"),
    detectInstalled: async () => existsSync(codexHome) || existsSync("/etc/codex"),
    isUniversal: true,
  },
  "command-code": {
    name: "command-code",
    displayName: "Command Code",
    skillsDir: ".commandcode/skills",
    globalSkillsDir: join(home$1, ".commandcode/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".commandcode")),
  },
  continue: {
    name: "continue",
    displayName: "Continue",
    skillsDir: ".continue/skills",
    globalSkillsDir: join(home$1, ".continue/skills"),
    detectInstalled: async () =>
      existsSync(join(process.cwd(), ".continue")) || existsSync(join(home$1, ".continue")),
  },
  cortex: {
    name: "cortex",
    displayName: "Cortex Code",
    skillsDir: ".cortex/skills",
    globalSkillsDir: join(home$1, ".snowflake/cortex/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".snowflake/cortex")),
  },
  crush: {
    name: "crush",
    displayName: "Crush",
    skillsDir: ".crush/skills",
    globalSkillsDir: join(configHome, "crush/skills"),
    detectInstalled: async () => existsSync(join(configHome, "crush")),
  },
  cursor: {
    name: "cursor",
    displayName: "Cursor",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(home$1, ".cursor/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".cursor")),
    isUniversal: true,
  },
  deepagents: {
    name: "deepagents",
    displayName: "Deep Agents",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(home$1, ".deepagents/agent/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".deepagents")),
    isUniversal: true,
  },
  devin: {
    name: "devin",
    displayName: "Devin",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(configHome, "devin/skills"),
    detectInstalled: async () => existsSync(join(configHome, "devin")),
    isUniversal: true,
  },
  dexto: {
    name: "dexto",
    displayName: "Dexto",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(home$1, ".agents/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".dexto")),
    isUniversal: true,
  },
  droid: {
    name: "droid",
    displayName: "Factory Droid",
    skillsDir: ".factory/skills",
    globalSkillsDir: join(home$1, ".factory/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".factory")),
  },
  firebender: {
    name: "firebender",
    displayName: "Firebender",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(home$1, ".firebender/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".firebender")),
    isUniversal: true,
  },
  forgecode: {
    name: "forgecode",
    displayName: "ForgeCode",
    skillsDir: ".forge/skills",
    globalSkillsDir: join(home$1, ".forge/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".forge")),
  },
  "gemini-cli": {
    name: "gemini-cli",
    displayName: "Gemini CLI",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(home$1, ".gemini/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".gemini")),
    isUniversal: true,
  },
  "github-copilot": {
    name: "github-copilot",
    displayName: "GitHub Copilot",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(home$1, ".copilot/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".copilot")),
    isUniversal: true,
  },
  goose: {
    name: "goose",
    displayName: "Goose",
    skillsDir: ".goose/skills",
    globalSkillsDir: join(configHome, "goose/skills"),
    detectInstalled: async () => existsSync(join(configHome, "goose")),
  },
  "iflow-cli": {
    name: "iflow-cli",
    displayName: "iFlow CLI",
    skillsDir: ".iflow/skills",
    globalSkillsDir: join(home$1, ".iflow/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".iflow")),
  },
  junie: {
    name: "junie",
    displayName: "Junie",
    skillsDir: ".junie/skills",
    globalSkillsDir: join(home$1, ".junie/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".junie")),
  },
  kilo: {
    name: "kilo",
    displayName: "Kilo Code",
    skillsDir: ".kilocode/skills",
    globalSkillsDir: join(home$1, ".kilocode/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".kilocode")),
  },
  "kimi-cli": {
    name: "kimi-cli",
    displayName: "Kimi Code CLI",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(configHome, "agents/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".kimi")),
    isUniversal: true,
  },
  "kiro-cli": {
    name: "kiro-cli",
    displayName: "Kiro CLI",
    skillsDir: ".kiro/skills",
    globalSkillsDir: join(home$1, ".kiro/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".kiro")),
  },
  kode: {
    name: "kode",
    displayName: "Kode",
    skillsDir: ".kode/skills",
    globalSkillsDir: join(home$1, ".kode/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".kode")),
  },
  mcpjam: {
    name: "mcpjam",
    displayName: "MCPJam",
    skillsDir: ".mcpjam/skills",
    globalSkillsDir: join(home$1, ".mcpjam/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".mcpjam")),
  },
  "mistral-vibe": {
    name: "mistral-vibe",
    displayName: "Mistral Vibe",
    skillsDir: ".vibe/skills",
    globalSkillsDir: join(vibeHome, "skills"),
    detectInstalled: async () => existsSync(vibeHome),
  },
  mux: {
    name: "mux",
    displayName: "Mux",
    skillsDir: ".mux/skills",
    globalSkillsDir: join(home$1, ".mux/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".mux")),
  },
  neovate: {
    name: "neovate",
    displayName: "Neovate",
    skillsDir: ".neovate/skills",
    globalSkillsDir: join(home$1, ".neovate/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".neovate")),
  },
  openclaw: {
    name: "openclaw",
    displayName: "OpenClaw",
    skillsDir: "skills",
    globalSkillsDir: resolveOpenClawGlobalSkillsDir(),
    detectInstalled: async () => detectOpenClaw(),
  },
  opencode: {
    name: "opencode",
    displayName: "OpenCode",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(configHome, "opencode/skills"),
    detectInstalled: async () => existsSync(join(configHome, "opencode")),
    isUniversal: true,
  },
  openhands: {
    name: "openhands",
    displayName: "OpenHands",
    skillsDir: ".openhands/skills",
    globalSkillsDir: join(home$1, ".openhands/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".openhands")),
  },
  pi: {
    name: "pi",
    displayName: "Pi",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(home$1, ".pi/agent/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".pi")),
    isUniversal: true,
  },
  pochi: {
    name: "pochi",
    displayName: "Pochi",
    skillsDir: ".pochi/skills",
    globalSkillsDir: join(home$1, ".pochi/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".pochi")),
  },
  qoder: {
    name: "qoder",
    displayName: "Qoder",
    skillsDir: ".qoder/skills",
    globalSkillsDir: join(home$1, ".qoder/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".qoder")),
  },
  "qwen-code": {
    name: "qwen-code",
    displayName: "Qwen Code",
    skillsDir: ".qwen/skills",
    globalSkillsDir: join(home$1, ".qwen/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".qwen")),
  },
  replit: {
    name: "replit",
    displayName: "Replit",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(configHome, "agents/skills"),
    detectInstalled: async () => existsSync(join(process.cwd(), ".replit")),
    isUniversal: true,
  },
  roo: {
    name: "roo",
    displayName: "Roo Code",
    skillsDir: ".roo/skills",
    globalSkillsDir: join(home$1, ".roo/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".roo")),
  },
  rovodev: {
    name: "rovodev",
    displayName: "Rovo Dev",
    skillsDir: ".rovodev/skills",
    globalSkillsDir: join(home$1, ".rovodev/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".rovodev")),
  },
  "tabnine-cli": {
    name: "tabnine-cli",
    displayName: "Tabnine CLI",
    skillsDir: ".tabnine/agent/skills",
    globalSkillsDir: join(home$1, ".tabnine/agent/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".tabnine")),
  },
  trae: {
    name: "trae",
    displayName: "Trae",
    skillsDir: ".trae/skills",
    globalSkillsDir: join(home$1, ".trae/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".trae")),
  },
  "trae-cn": {
    name: "trae-cn",
    displayName: "Trae CN",
    skillsDir: ".trae/skills",
    globalSkillsDir: join(home$1, ".trae-cn/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".trae-cn")),
  },
  universal: {
    name: "universal",
    displayName: "Universal",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(home$1, ".agents/skills"),
    detectInstalled: async () => false,
    isUniversal: true,
  },
  warp: {
    name: "warp",
    displayName: "Warp",
    skillsDir: CANONICAL_SKILLS_DIR,
    globalSkillsDir: join(home$1, ".agents/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".warp")),
    isUniversal: true,
  },
  windsurf: {
    name: "windsurf",
    displayName: "Windsurf",
    skillsDir: ".windsurf/skills",
    globalSkillsDir: join(home$1, ".codeium/windsurf/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".codeium/windsurf")),
  },
  zencoder: {
    name: "zencoder",
    displayName: "Zencoder",
    skillsDir: ".zencoder/skills",
    globalSkillsDir: join(home$1, ".zencoder/skills"),
    detectInstalled: async () => existsSync(join(home$1, ".zencoder")),
  },
};
const getSkillAgentConfig = (agentType) => skillAgents[agentType];
const isUniversalSkillAgent = (agentType) => Boolean(skillAgents[agentType].isUniversal);
const getSkillAgentDir = (agentType, options = {}) => {
  const agent = skillAgents[agentType];
  if (options.global ?? false) return agent.globalSkillsDir ?? join(home$1, agent.skillsDir);
  return join(options.cwd ?? process.cwd(), agent.skillsDir);
};
const agentConfigEntries = () => Object.values(skillAgents).map((config) => [config.name, config]);
const getSkillAgentTypes = () => agentConfigEntries().map(([name]) => name);
const isSkillAgentType = (value) => value in skillAgents;
const getUniversalSkillAgents = () =>
  agentConfigEntries()
    .filter(([name, config]) => config.isUniversal && name !== "universal")
    .map(([name]) => name);
const getNonUniversalSkillAgents = () =>
  agentConfigEntries()
    .filter(([, config]) => !config.isUniversal)
    .map(([name]) => name);
const detectInstalledSkillAgents = async () => {
  return (
    await Promise.all(
      Object.values(skillAgents).map(async (config) => ({
        name: config.name,
        installed: await config.detectInstalled(),
      })),
    )
  )
    .filter((entry) => entry.installed)
    .map((entry) => entry.name);
};
const parseFrontmatter = (raw) => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match)
    return {
      data: {},
      content: raw,
    };
  const parsed = (0, import_dist.parse)(match[1] ?? "");
  return {
    data: isPlainObject(parsed) ? parsed : {},
    content: match[2] ?? "",
  };
};
const sanitizeName = (name) => {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._]+/g, "-")
      .replace(/^[.-]+|[.-]+$/g, "")
      .substring(0, 255) || "unnamed-skill"
  );
};
const fetchSkillManifestFromUrl = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
    const content = await response.text();
    const { data } = parseFrontmatter(content);
    if (typeof data.name !== "string" || !data.name)
      throw new Error(`Fetched SKILL.md has no "name" in its frontmatter: ${url}`);
    const skillName = sanitizeName(data.name);
    const baseDir = await mkdtemp(join(tmpdir(), "agent-install-url-"));
    const skillDir = join(baseDir, skillName);
    await mkdir(dirname(join(skillDir, SKILL_MANIFEST_FILE)), { recursive: true });
    await writeFile(join(skillDir, SKILL_MANIFEST_FILE), content, "utf-8");
    return baseDir;
  } finally {
    clearTimeout(timer);
  }
};
const isPathSafe = (basePath, targetPath) => {
  const normalizedBase = normalize(resolve(basePath));
  const normalizedTarget = normalize(resolve(targetPath));
  return normalizedTarget.startsWith(normalizedBase + sep) || normalizedTarget === normalizedBase;
};
const stripTrailingSlash = (input) => (input.endsWith("/") ? input.slice(0, -1) : input);
const TEMP_PREFIX = "agent-install-well-known-";
const SKILL_NAME_PATTERN = /^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/;
var WellKnownTimeoutError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "WellKnownTimeoutError";
  }
};
const isValidWellKnownEntry = (value) => {
  if (!isPlainObject(value)) return false;
  if (typeof value.name !== "string" || !value.name) return false;
  if (typeof value.description !== "string" || !value.description) return false;
  if (!Array.isArray(value.files) || value.files.length === 0) return false;
  if (value.name.length > 1 && !SKILL_NAME_PATTERN.test(value.name)) return false;
  if (value.name.length === 1 && !/^[a-z0-9]$/.test(value.name)) return false;
  for (const file of value.files) {
    if (typeof file !== "string") return false;
    if (file.startsWith("/") || file.startsWith("\\") || file.includes("..")) return false;
  }
  return value.files.some((file) => typeof file === "string" && file.toLowerCase() === "skill.md");
};
const fetchOk = async (url) => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(DEFAULT_FETCH_TIMEOUT_MS) });
    return response.ok ? response : null;
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError")
      throw new WellKnownTimeoutError(`Request timed out: ${url}`);
    return null;
  }
};
const buildIndexCandidates = (inputUrl) => {
  const parsed = new URL(inputUrl);
  const basePath = stripTrailingSlash(parsed.pathname);
  const candidates = [];
  for (const wellKnownPath of WELL_KNOWN_PATHS) {
    candidates.push({
      indexUrl: `${parsed.protocol}//${parsed.host}${basePath}/${wellKnownPath}/${WELL_KNOWN_INDEX_FILE}`,
      baseUrl: `${parsed.protocol}//${parsed.host}${basePath}`,
      wellKnownPath,
    });
    if (basePath)
      candidates.push({
        indexUrl: `${parsed.protocol}//${parsed.host}/${wellKnownPath}/${WELL_KNOWN_INDEX_FILE}`,
        baseUrl: `${parsed.protocol}//${parsed.host}`,
        wellKnownPath,
      });
  }
  return candidates;
};
const extractRequestedSkillName = (inputUrl) => {
  try {
    const name = new URL(inputUrl).pathname.match(
      /\/.well-known\/(?:agent-skills|skills)\/([^/]+)\/?$/,
    )?.[1];
    return name && name !== "index.json" ? name : void 0;
  } catch {
    return;
  }
};
const validateIndexEntries = (payload) => {
  if (!isPlainObject(payload)) return null;
  const { skills } = payload;
  if (!Array.isArray(skills)) return null;
  if (!skills.every(isValidWellKnownEntry)) return null;
  return skills;
};
const resolveIndex = async (inputUrl) => {
  for (const candidate of buildIndexCandidates(inputUrl)) {
    const response = await fetchOk(candidate.indexUrl);
    if (!response) continue;
    let payload;
    try {
      payload = await response.json();
    } catch {
      continue;
    }
    const entries = validateIndexEntries(payload);
    if (!entries) continue;
    return {
      entries,
      baseUrl: candidate.baseUrl,
      wellKnownPath: candidate.wellKnownPath,
      requestedSkillName: extractRequestedSkillName(inputUrl),
    };
  }
  return null;
};
const writeSkillFiles = async (resolved, entry, rootDir) => {
  const skillDir = join(rootDir, sanitizeName(entry.name));
  await mkdir(skillDir, { recursive: true });
  const skillBaseUrl = `${stripTrailingSlash(resolved.baseUrl)}/${resolved.wellKnownPath}/${entry.name}`;
  let installedAny = false;
  await Promise.all(
    entry.files.map(async (relativePath) => {
      const targetPath = join(skillDir, relativePath);
      if (!isPathSafe(skillDir, targetPath)) return;
      const response = await fetchOk(`${skillBaseUrl}/${relativePath}`);
      if (!response) return;
      const content = await response.text();
      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, content, "utf-8");
      installedAny = true;
    }),
  );
  return installedAny;
};
const fetchWellKnownSkills = async (inputUrl) => {
  const resolved = await resolveIndex(inputUrl).catch((error) => {
    if (error instanceof WellKnownTimeoutError)
      throw new Error(
        `Timed out resolving well-known skills index at ${inputUrl}. Set the source's HTTP server to respond faster, or pass a local path.`,
      );
    throw error;
  });
  if (!resolved)
    throw new Error(
      `No /.well-known/agent-skills/index.json (or fallback /.well-known/skills/index.json) found at ${inputUrl}`,
    );
  const entries = resolved.requestedSkillName
    ? resolved.entries.filter((entry) => entry.name === resolved.requestedSkillName)
    : resolved.entries;
  if (entries.length === 0)
    throw new Error(
      resolved.requestedSkillName
        ? `Skill "${resolved.requestedSkillName}" not found in well-known index at ${inputUrl}`
        : `Well-known index at ${inputUrl} declares no skills`,
    );
  const baseDir = await mkdtemp(join(tmpdir(), TEMP_PREFIX));
  if (
    !(await Promise.all(entries.map((entry) => writeSkillFiles(resolved, entry, baseDir)))).some(
      Boolean,
    )
  )
    throw new Error(`Failed to fetch any skill files from well-known index at ${inputUrl}`);
  return baseDir;
};
const readJsonObjectIfExists = async (path) => {
  try {
    const content = await readFile(path, "utf-8");
    const parsed = JSON.parse(content);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
const MARKETPLACE_RELATIVE_PATH = ".claude-plugin/marketplace.json";
const PLUGIN_RELATIVE_PATH = ".claude-plugin/plugin.json";
const PLUGIN_SKILLS_SUBDIR = "skills";
const isClaudeRelativePath = (input) => typeof input === "string" && input.startsWith("./");
const stringValueOrEmpty = (input) => (typeof input === "string" ? input : "");
const resolvePluginRoot = (manifest) => {
  if (!isPlainObject(manifest.metadata)) return "";
  const rawPluginRoot = manifest.metadata.pluginRoot;
  if (rawPluginRoot === void 0) return "";
  return isClaudeRelativePath(rawPluginRoot) ? rawPluginRoot : null;
};
const collectPluginSkillSearchDirs = (basePath, pluginBase, rawSkills, searchDirs) => {
  if (!isPathSafe(basePath, pluginBase)) return;
  if (Array.isArray(rawSkills))
    for (const entry of rawSkills) {
      if (!isClaudeRelativePath(entry)) continue;
      const skillDir = dirname(join(pluginBase, entry));
      if (isPathSafe(basePath, skillDir)) searchDirs.push(skillDir);
    }
  searchDirs.push(join(pluginBase, PLUGIN_SKILLS_SUBDIR));
};
const collectPluginGroupings = (basePath, pluginBase, pluginName, rawSkills, groupings) => {
  if (!isPathSafe(basePath, pluginBase) || !Array.isArray(rawSkills)) return;
  for (const entry of rawSkills) {
    if (!isClaudeRelativePath(entry)) continue;
    const skillDir = join(pluginBase, entry);
    if (!isPathSafe(basePath, skillDir)) continue;
    groupings.set(resolve(skillDir), pluginName);
  }
};
const getPluginSkillPaths = async (basePath) => {
  const searchDirs = [];
  const marketplace = await readJsonObjectIfExists(join(basePath, MARKETPLACE_RELATIVE_PATH));
  if (marketplace) {
    const pluginRoot = resolvePluginRoot(marketplace);
    if (pluginRoot !== null && Array.isArray(marketplace.plugins))
      for (const plugin of marketplace.plugins) {
        if (!isPlainObject(plugin)) continue;
        if (plugin.source !== void 0 && !isClaudeRelativePath(plugin.source)) continue;
        collectPluginSkillSearchDirs(
          basePath,
          join(basePath, pluginRoot, stringValueOrEmpty(plugin.source)),
          plugin.skills,
          searchDirs,
        );
      }
  }
  const single = await readJsonObjectIfExists(join(basePath, PLUGIN_RELATIVE_PATH));
  if (single) collectPluginSkillSearchDirs(basePath, basePath, single.skills, searchDirs);
  return searchDirs;
};
const getPluginGroupings = async (basePath) => {
  const groupings = /* @__PURE__ */ new Map();
  const marketplace = await readJsonObjectIfExists(join(basePath, MARKETPLACE_RELATIVE_PATH));
  if (marketplace) {
    const pluginRoot = resolvePluginRoot(marketplace);
    if (pluginRoot !== null && Array.isArray(marketplace.plugins))
      for (const plugin of marketplace.plugins) {
        if (!isPlainObject(plugin)) continue;
        if (typeof plugin.name !== "string" || !plugin.name) continue;
        if (plugin.source !== void 0 && !isClaudeRelativePath(plugin.source)) continue;
        collectPluginGroupings(
          basePath,
          join(basePath, pluginRoot, stringValueOrEmpty(plugin.source)),
          plugin.name,
          plugin.skills,
          groupings,
        );
      }
  }
  const single = await readJsonObjectIfExists(join(basePath, PLUGIN_RELATIVE_PATH));
  if (single && typeof single.name === "string" && single.name)
    collectPluginGroupings(basePath, basePath, single.name, single.skills, groupings);
  return groupings;
};
const CLONE_TIMEOUT_ENV_VAR = "AGENT_INSTALL_CLONE_TIMEOUT_MS";
const LEGACY_CLONE_TIMEOUT_ENV_VAR = "SKILL_INSTALL_CLONE_TIMEOUT_MS";
const TEMP_CLONE_PREFIX = "agent-install-";
var GitCloneError = class extends Error {
  url;
  kind;
  constructor(message, url, kind = "unknown") {
    super(message);
    this.name = "GitCloneError";
    this.url = url;
    this.kind = kind;
  }
  get isTimeout() {
    return this.kind === "timeout";
  }
  get isAuthError() {
    return this.kind === "auth";
  }
};
const resolveCloneTimeoutMs = () => {
  const raw = process.env[CLONE_TIMEOUT_ENV_VAR] ?? process.env[LEGACY_CLONE_TIMEOUT_ENV_VAR];
  if (!raw) return DEFAULT_CLONE_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CLONE_TIMEOUT_MS;
};
const runGit = (args, timeoutMs) =>
  new Promise((resolvePromise) => {
    const child = spawn("git", args, {
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
        GIT_LFS_SKIP_SMUDGE: "1",
      },
    });
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({
        code: code ?? 1,
        stderr,
        timedOut,
      });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      stderr += err.message;
      resolvePromise({
        code: 1,
        stderr,
        timedOut,
      });
    });
  });
const AUTH_ERROR_MARKERS = [
  "Authentication failed",
  "could not read Username",
  "Permission denied",
  "Repository not found",
];
const isAuthErrorMessage = (stderr) => AUTH_ERROR_MARKERS.some((marker) => stderr.includes(marker));
const cloneRepo = async (url, ref) => {
  const tempDir = await mkdtemp(join(tmpdir(), TEMP_CLONE_PREFIX));
  const timeoutMs = resolveCloneTimeoutMs();
  const args = [
    "-c",
    "filter.lfs.required=false",
    "-c",
    "filter.lfs.smudge=",
    "-c",
    "filter.lfs.clean=",
    "-c",
    "filter.lfs.process=",
    "clone",
    "--depth",
    "1",
  ];
  if (ref) args.push("--branch", ref);
  args.push(url, tempDir);
  const { code, stderr, timedOut } = await runGit(args, timeoutMs);
  if (code === 0) return tempDir;
  await rm(tempDir, {
    recursive: true,
    force: true,
  }).catch(() => {});
  if (timedOut)
    throw new GitCloneError(
      [
        `Clone timed out after ${Math.round(timeoutMs / MS_PER_SECOND)}s. Common causes:`,
        `  - Large repository: raise the timeout with ${CLONE_TIMEOUT_ENV_VAR}=600000 (10m)`,
        `  - Slow network: retry, or clone manually and pass the local path to 'skill add'`,
        `  - Private repo without credentials:`,
        `      - For SSH: ssh-add -l (to check loaded keys)`,
        `      - For HTTPS: gh auth status (if using GitHub CLI)`,
      ].join("\n"),
      url,
      "timeout",
    );
  if (isAuthErrorMessage(stderr))
    throw new GitCloneError(
      [
        `Authentication failed for ${url}.`,
        `  - For private repos, ensure you have access`,
        `  - For SSH: check your keys with 'ssh -T git@github.com'`,
        `  - For HTTPS: run 'gh auth login' or configure git credentials`,
      ].join("\n"),
      url,
      "auth",
    );
  throw new GitCloneError(`Failed to clone ${url}: ${stderr.trim() || "unknown error"}`, url);
};
const cleanupTempDir = async (dir) => {
  const normalizedDir = normalize(resolve(dir));
  const normalizedTmpDir = normalize(resolve(tmpdir()));
  if (!normalizedDir.startsWith(normalizedTmpDir + sep) && normalizedDir !== normalizedTmpDir)
    throw new Error("Attempted to clean up directory outside of temp directory");
  await rm(dir, {
    recursive: true,
    force: true,
  });
};
const getCanonicalSkillsDir = (isGlobal, cwd) => {
  return join(isGlobal ? homedir() : cwd || process.cwd(), CANONICAL_SKILLS_DIR);
};
const getSkillAgentBaseDir = (agentType, isGlobal, cwd) => {
  if (isUniversalSkillAgent(agentType)) return getCanonicalSkillsDir(isGlobal, cwd);
  const agent = getSkillAgentConfig(agentType);
  const baseDir = isGlobal ? homedir() : cwd || process.cwd();
  if (isGlobal) return agent.globalSkillsDir ?? join(baseDir, agent.skillsDir);
  return join(baseDir, agent.skillsDir);
};
const cleanAndCreateDirectory = async (path) => {
  await rm(path, {
    recursive: true,
    force: true,
  }).catch(() => void 0);
  await mkdir(path, { recursive: true });
};
const resolveSymlinkTarget = (linkPath, linkTarget) => resolve(dirname(linkPath), linkTarget);
const resolveParentSymlinks = async (path) => {
  const resolved = resolve(path);
  const parentDir = dirname(resolved);
  const name = basename(resolved);
  try {
    return join(await realpath(parentDir), name);
  } catch {
    return resolved;
  }
};
const isPathInsideBase = (basePath, targetPath) => {
  const normalizedBase = resolve(basePath);
  const normalizedTarget = resolve(targetPath);
  return normalizedTarget === normalizedBase || normalizedTarget.startsWith(normalizedBase + sep);
};
const copyDirectory = async (src, dest, rootSrc = src) => {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  await Promise.all(
    entries
      .filter(
        (entry) =>
          !COPY_EXCLUDE_FILES.has(entry.name) &&
          !(entry.isDirectory() && COPY_EXCLUDE_DIRS.has(entry.name)),
      )
      .map(async (entry) => {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);
        if (entry.isSymbolicLink()) {
          const linkRealPath = await realpath(srcPath).catch(() => null);
          if (!linkRealPath || !isPathInsideBase(rootSrc, linkRealPath)) return;
          await cp(srcPath, destPath, {
            dereference: true,
            recursive: true,
          });
          return;
        }
        if (entry.isDirectory()) {
          await copyDirectory(srcPath, destPath, rootSrc);
          return;
        }
        await cp(srcPath, destPath, {
          dereference: false,
          recursive: true,
        });
      }),
  );
};
const isLoopError = (error) =>
  Boolean(error && typeof error === "object" && "code" in error && error.code === "ELOOP");
const createSymlink = async (target, linkPath) => {
  try {
    const resolvedTarget = resolve(target);
    const resolvedLinkPath = resolve(linkPath);
    const [realTarget, realLinkPath] = await Promise.all([
      realpath(resolvedTarget).catch(() => resolvedTarget),
      realpath(resolvedLinkPath).catch(() => resolvedLinkPath),
    ]);
    if (realTarget === realLinkPath) return true;
    const [realTargetWithParents, realLinkPathWithParents] = await Promise.all([
      resolveParentSymlinks(target),
      resolveParentSymlinks(linkPath),
    ]);
    if (realTargetWithParents === realLinkPathWithParents) return true;
    try {
      if ((await lstat(linkPath)).isSymbolicLink()) {
        if (resolveSymlinkTarget(linkPath, await readlink(linkPath)) === resolvedTarget)
          return true;
        await rm(linkPath);
      } else await rm(linkPath, { recursive: true });
    } catch (error) {
      if (isLoopError(error)) await rm(linkPath, { force: true }).catch(() => {});
    }
    const linkDir = dirname(linkPath);
    await mkdir(linkDir, { recursive: true });
    await symlink(
      relative(await resolveParentSymlinks(linkDir), target),
      linkPath,
      platform() === "win32" ? "junction" : void 0,
    );
    return true;
  } catch {
    return false;
  }
};
const installByCopy = async (skill, destination) => {
  await cleanAndCreateDirectory(destination);
  await copyDirectory(skill.path, destination);
  return {
    success: true,
    path: destination,
    mode: "copy",
  };
};
const installBySymlink = async (skill, agentType, canonicalDir, agentDir, isGlobal) => {
  await cleanAndCreateDirectory(canonicalDir);
  await copyDirectory(skill.path, canonicalDir);
  if (isGlobal && isUniversalSkillAgent(agentType))
    return {
      success: true,
      path: canonicalDir,
      canonicalPath: canonicalDir,
      mode: "symlink",
    };
  if (await createSymlink(canonicalDir, agentDir))
    return {
      success: true,
      path: agentDir,
      canonicalPath: canonicalDir,
      mode: "symlink",
    };
  await cleanAndCreateDirectory(agentDir);
  await copyDirectory(skill.path, agentDir);
  return {
    success: true,
    path: agentDir,
    canonicalPath: canonicalDir,
    mode: "symlink",
    symlinkFailed: true,
  };
};
const installSkillForAgent = async (skill, agentType, options = {}) => {
  const agent = skillAgents[agentType];
  const isGlobal = options.global ?? false;
  const cwd = options.cwd || process.cwd();
  const installMode = options.mode ?? "symlink";
  if (isGlobal && agent.globalSkillsDir === void 0)
    return {
      success: false,
      path: "",
      mode: installMode,
      error: `${agent.displayName} does not support global skill installation`,
    };
  const skillName = sanitizeName(skill.name || basename(skill.path));
  const canonicalBase = getCanonicalSkillsDir(isGlobal, cwd);
  const canonicalDir = join(canonicalBase, skillName);
  const agentBase = getSkillAgentBaseDir(agentType, isGlobal, cwd);
  const agentDir = join(agentBase, skillName);
  if (!isPathSafe(canonicalBase, canonicalDir) || !isPathSafe(agentBase, agentDir))
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: "Invalid skill name: potential path traversal detected",
    };
  try {
    return installMode === "copy"
      ? await installByCopy(skill, agentDir)
      : await installBySymlink(skill, agentType, canonicalDir, agentDir, isGlobal);
  } catch (error) {
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: toErrorMessage(error),
    };
  }
};
const isSkillInstalledForAgent = async (skillName, agentType, options = {}) => {
  return existsSync(
    join(
      getSkillAgentBaseDir(agentType, options.global ?? false, options.cwd || process.cwd()),
      sanitizeName(skillName),
    ),
  );
};
const OSC_RE = /\x1b\][\s\S]*?(?:\x07|\x1b\\)/g;
const DCS_PM_APC_RE = /\x1b[P^_][\s\S]*?(?:\x1b\\)/g;
const CSI_RE = /\x1b\[[\x30-\x3f]*[\x20-\x2f]*[\x40-\x7e]/g;
const SIMPLE_ESC_RE = /\x1b[\x20-\x7e]/g;
const C1_RE = /[\x80-\x9f]/g;
const CONTROL_RE = /[\x00-\x06\x07\x08\x0b\x0c\x0d-\x1a\x1c-\x1f\x7f]/g;
const stripTerminalEscapes = (input) =>
  input
    .replace(OSC_RE, "")
    .replace(DCS_PM_APC_RE, "")
    .replace(CSI_RE, "")
    .replace(SIMPLE_ESC_RE, "")
    .replace(C1_RE, "")
    .replace(CONTROL_RE, "");
const sanitizeMetadata = (input) =>
  stripTerminalEscapes(input)
    .replace(/[\r\n]+/g, " ")
    .trim();
const PRIORITY_RELATIVE_PATHS = [
  "",
  "skills",
  "skills/.curated",
  "skills/.experimental",
  "skills/.system",
  ".agents/skills",
  ".aider-desk/skills",
  ".augment/skills",
  ".bob/skills",
  ".claude/skills",
  ".cline/skills",
  ".codeartsdoer/skills",
  ".codebuddy/skills",
  ".codemaker/skills",
  ".codestudio/skills",
  ".codex/skills",
  ".commandcode/skills",
  ".continue/skills",
  ".cortex/skills",
  ".crush/skills",
  ".cursor/skills",
  ".factory/skills",
  ".forge/skills",
  ".gemini/skills",
  ".github/skills",
  ".goose/skills",
  ".iflow/skills",
  ".junie/skills",
  ".kilocode/skills",
  ".kiro/skills",
  ".kode/skills",
  ".mcpjam/skills",
  ".mux/skills",
  ".neovate/skills",
  ".openhands/skills",
  ".pi/skills",
  ".pochi/skills",
  ".qoder/skills",
  ".qwen/skills",
  ".roo/skills",
  ".rovodev/skills",
  ".tabnine/agent/skills",
  ".trae/skills",
  ".vibe/skills",
  ".windsurf/skills",
  ".zencoder/skills",
];
const hasSkillManifest = async (dir) => {
  try {
    return (await stat(join(dir, SKILL_MANIFEST_FILE))).isFile();
  } catch {
    return false;
  }
};
const parseSkillManifest = async (manifestPath) => {
  try {
    const content = await readFile(manifestPath, "utf-8");
    const { data } = parseFrontmatter(content);
    if (typeof data.name !== "string" || typeof data.description !== "string") return null;
    if (!data.name || !data.description) return null;
    const metadata = isPlainObject(data.metadata) ? data.metadata : void 0;
    return {
      name: sanitizeMetadata(data.name),
      description: sanitizeMetadata(data.description),
      path: dirname(manifestPath),
      rawContent: content,
      metadata,
    };
  } catch {
    return null;
  }
};
const findSkillDirs = async (dir, depth = 0) => {
  if (depth > 5) return [];
  try {
    const [hasManifest, entries] = await Promise.all([
      hasSkillManifest(dir),
      readdir(dir, { withFileTypes: true }).catch(() => []),
    ]);
    const currentDir = hasManifest ? [dir] : [];
    const subDirResults = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory() && !SKIP_DISCOVERY_DIRS.has(entry.name))
        .map((entry) => findSkillDirs(join(dir, entry.name), depth + 1)),
    );
    return [...currentDir, ...subDirResults.flat()];
  } catch {
    return [];
  }
};
const discoverSkills = async (basePath, subpath, options) => {
  if (subpath && !isPathSafe(basePath, join(basePath, subpath)))
    throw new Error(
      `Invalid subpath: "${subpath}" resolves outside the base directory. Subpath must not contain ".." segments that escape the base path.`,
    );
  const searchPath = subpath ? join(basePath, subpath) : basePath;
  const seenNames = /* @__PURE__ */ new Set();
  const results = [];
  const pluginGroupings = await getPluginGroupings(searchPath);
  const enhanceSkill = (skill) => {
    const pluginName = pluginGroupings.get(resolve(skill.path));
    return pluginName
      ? {
          ...skill,
          pluginName,
        }
      : skill;
  };
  const pluginExtraDirs = await getPluginSkillPaths(searchPath);
  if (await hasSkillManifest(searchPath)) {
    const skill = await parseSkillManifest(join(searchPath, SKILL_MANIFEST_FILE));
    if (skill) {
      results.push(enhanceSkill(skill));
      seenNames.add(skill.name);
      if (!options?.fullDepth) return results;
    }
  }
  const prioritySearchDirs = [
    ...PRIORITY_RELATIVE_PATHS.map((relative) =>
      relative ? join(searchPath, relative) : searchPath,
    ),
    ...pluginExtraDirs,
  ];
  for (const dir of prioritySearchDirs)
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const skillDir = join(dir, entry.name);
        if (!(await hasSkillManifest(skillDir))) continue;
        const skill = await parseSkillManifest(join(skillDir, SKILL_MANIFEST_FILE));
        if (skill && !seenNames.has(skill.name)) {
          results.push(enhanceSkill(skill));
          seenNames.add(skill.name);
        }
      }
    } catch {}
  if (results.length === 0 || options?.fullDepth) {
    const allSkillDirs = await findSkillDirs(searchPath);
    for (const skillDir of allSkillDirs) {
      const skill = await parseSkillManifest(join(skillDir, SKILL_MANIFEST_FILE));
      if (skill && !seenNames.has(skill.name)) {
        results.push(enhanceSkill(skill));
        seenNames.add(skill.name);
      }
    }
  }
  return results;
};
const getSkillDisplayName = (skill) => skill.name || basename(skill.path);
const filterSkillsByName = (skills, inputNames) => {
  const normalizedInputs = inputNames.map((inputName) => inputName.toLowerCase());
  return skills.filter((skill) => {
    const name = skill.name.toLowerCase();
    const displayName = getSkillDisplayName(skill).toLowerCase();
    return normalizedInputs.some((inputName) => inputName === name || inputName === displayName);
  });
};
const escapeRegex = (input) => input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sanitizeSubpath = (subpath) => {
  const segments = subpath.replace(/\\/g, "/").split("/");
  for (const segment of segments)
    if (segment === "..")
      throw new Error(
        `Unsafe subpath: "${subpath}" contains path traversal segments. Subpaths must not contain ".." components.`,
      );
  return subpath;
};
const HOST_CONFIGS = [
  {
    host: "github",
    domain: "github.com",
    prefix: "github:",
    treePrefix: "/tree/",
    anchorRepo: false,
  },
  {
    host: "gitlab",
    domain: "gitlab.com",
    prefix: "gitlab:",
    treePrefix: "/-/tree/",
    anchorRepo: true,
  },
];
const HOST_BY_NAME = new Map(HOST_CONFIGS.map((config) => [config.host, config]));
const HOST_BY_DOMAIN = new Map(HOST_CONFIGS.map((config) => [config.domain, config]));
const SSH_URL_PATTERN = /^git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?$/;
const isLocalPath = (input) =>
  isAbsolute(input) ||
  input.startsWith("./") ||
  input.startsWith("../") ||
  input === "." ||
  input === ".." ||
  /^[a-zA-Z]:[/\\]/.test(input);
const isShorthandCandidate = (input) =>
  !input.includes(":") && !input.startsWith(".") && !input.startsWith("/");
const buildHostedSource = ({ host, owner, repo, ref, subpath, skillFilter }) => {
  const config = HOST_BY_NAME.get(host);
  if (!config) throw new Error(`Unknown host: ${host}`);
  const cleanRepo = repo.replace(/\.git$/, "");
  const result = {
    type: host,
    url: `https://${config.domain}/${owner}/${cleanRepo}.git`,
  };
  if (ref) result.ref = ref;
  if (subpath) result.subpath = sanitizeSubpath(subpath);
  if (skillFilter) result.skillFilter = skillFilter;
  return result;
};
const buildHostUrlPatterns = (config) => {
  const domain = escapeRegex(config.domain);
  const treePrefix = escapeRegex(config.treePrefix);
  const repoPattern = config.anchorRepo
    ? `${domain}/([^/]+)/([^/]+?)(?:\\.git)?/?$`
    : `${domain}/([^/]+)/([^/]+)`;
  return {
    treeWithPath: new RegExp(`${domain}/([^/]+)/([^/]+)${treePrefix}([^/]+)/(.+)`),
    tree: new RegExp(`${domain}/([^/]+)/([^/]+)${treePrefix}([^/]+)$`),
    repo: new RegExp(repoPattern),
  };
};
const HOST_URL_PATTERNS = new Map(
  HOST_CONFIGS.map((config) => [config.host, buildHostUrlPatterns(config)]),
);
const decodeFragmentValue = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
const looksLikeGitSource = (input) => {
  if (input.startsWith("git@")) return true;
  if (HOST_CONFIGS.some((config) => input.startsWith(config.prefix))) return true;
  if (input.startsWith("http://") || input.startsWith("https://"))
    try {
      const parsed = new URL(input);
      const config = HOST_BY_DOMAIN.get(parsed.hostname);
      if (config) {
        const treePrefix = escapeRegex(config.treePrefix);
        return new RegExp(`^/[^/]+/[^/]+(?:\\.git)?(?:${treePrefix}[^/]+(?:/.*)?)?/?$`).test(
          parsed.pathname,
        );
      }
    } catch {
      return false;
    }
  if (/^https?:\/\/.+\.git(?:$|[/?])/i.test(input)) return true;
  return isShorthandCandidate(input) && /^([^/]+)\/([^/]+)(?:\/(.+)|@(.+))?$/.test(input);
};
const parseFragmentRef = (input) => {
  const hashIndex = input.indexOf("#");
  if (hashIndex < 0) return { inputWithoutFragment: input };
  const inputWithoutFragment = input.slice(0, hashIndex);
  const fragment = input.slice(hashIndex + 1);
  if (!fragment || !looksLikeGitSource(inputWithoutFragment))
    return { inputWithoutFragment: input };
  const atIndex = fragment.indexOf("@");
  if (atIndex === -1)
    return {
      inputWithoutFragment,
      ref: decodeFragmentValue(fragment),
    };
  const ref = fragment.slice(0, atIndex);
  const skillFilter = fragment.slice(atIndex + 1);
  return {
    inputWithoutFragment,
    ref: ref ? decodeFragmentValue(ref) : void 0,
    skillFilter: skillFilter ? decodeFragmentValue(skillFilter) : void 0,
  };
};
const isDirectSkillMdUrl = (input) =>
  /^https?:\/\//.test(input) && /\bSKILL\.md(?:$|\?|#)/i.test(input);
const EXCLUDED_WELL_KNOWN_HOSTS = new Set(["raw.githubusercontent.com"]);
const isWellKnownCandidate = (input) => {
  if (!/^https?:\/\//.test(input)) return false;
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    return false;
  }
  if (HOST_BY_DOMAIN.has(parsed.hostname)) return false;
  if (EXCLUDED_WELL_KNOWN_HOSTS.has(parsed.hostname)) return false;
  if (input.endsWith(".git")) return false;
  if (isDirectSkillMdUrl(input)) return false;
  return true;
};
const parseHostedShorthand = (rest, host, fragmentRef, fragmentSkillFilter) => {
  const atSkillMatch = rest.match(/^([^/]+)\/([^/@]+)@(.+)$/);
  if (atSkillMatch) {
    const [, owner, repo, skillFilter] = atSkillMatch;
    return buildHostedSource({
      host,
      owner,
      repo,
      ref: fragmentRef,
      skillFilter: fragmentSkillFilter ?? skillFilter,
    });
  }
  const shorthandMatch = rest.match(/^([^/]+)\/([^/]+)(?:\/(.+?))?\/?$/);
  if (shorthandMatch) {
    const [, owner, repo, subpath] = shorthandMatch;
    return buildHostedSource({
      host,
      owner,
      repo,
      ref: fragmentRef,
      subpath,
      skillFilter: fragmentSkillFilter,
    });
  }
  return null;
};
const isHostnameAuthoritative = (input, expectedHostname) => {
  if (!input.startsWith("http://") && !input.startsWith("https://")) return false;
  try {
    return new URL(input).hostname === expectedHostname;
  } catch {
    return false;
  }
};
const parseHostUrl = (input, host, fragmentRef) => {
  const config = HOST_BY_NAME.get(host);
  if (!config) return null;
  if (!isHostnameAuthoritative(input, config.domain)) return null;
  const patterns = HOST_URL_PATTERNS.get(host);
  if (!patterns) return null;
  const treeWithPathMatch = input.match(patterns.treeWithPath);
  if (treeWithPathMatch) {
    const [, owner, repo, ref, subpath] = treeWithPathMatch;
    return buildHostedSource({
      host,
      owner,
      repo,
      ref: ref || fragmentRef,
      subpath,
    });
  }
  const treeMatch = input.match(patterns.tree);
  if (treeMatch) {
    const [, owner, repo, ref] = treeMatch;
    return buildHostedSource({
      host,
      owner,
      repo,
      ref: ref || fragmentRef,
    });
  }
  const repoMatch = input.match(patterns.repo);
  if (repoMatch) {
    const [, owner, repo] = repoMatch;
    return buildHostedSource({
      host,
      owner,
      repo,
      ref: fragmentRef,
    });
  }
  return null;
};
const parseSshUrl = (input, fragmentRef, fragmentSkillFilter) => {
  const match = input.match(SSH_URL_PATTERN);
  if (!match) return null;
  const [, sshHost] = match;
  const result = {
    type: HOST_BY_DOMAIN.get(sshHost)?.host ?? "git",
    url: input,
  };
  if (fragmentRef) result.ref = fragmentRef;
  if (fragmentSkillFilter) result.skillFilter = fragmentSkillFilter;
  return result;
};
const parseSkillSource = (input) => {
  if (!input || input.trim().length === 0)
    throw new Error(
      "Invalid skill source: input is empty. Expected a local path, owner/repo shorthand, or URL.",
    );
  if (isLocalPath(input)) {
    const resolvedPath = resolve(input);
    return {
      type: "local",
      url: resolvedPath,
      localPath: resolvedPath,
    };
  }
  const {
    inputWithoutFragment,
    ref: fragmentRef,
    skillFilter: fragmentSkillFilter,
  } = parseFragmentRef(input);
  const normalized = inputWithoutFragment;
  for (const config of HOST_CONFIGS)
    if (normalized.startsWith(config.prefix)) {
      const result = parseHostedShorthand(
        normalized.slice(config.prefix.length),
        config.host,
        fragmentRef,
        fragmentSkillFilter,
      );
      if (result) return result;
    }
  if (normalized.startsWith("git@")) {
    const sshResult = parseSshUrl(normalized, fragmentRef, fragmentSkillFilter);
    if (sshResult) return sshResult;
  }
  for (const config of HOST_CONFIGS) {
    const result = parseHostUrl(normalized, config.host, fragmentRef);
    if (result) return result;
  }
  if (isDirectSkillMdUrl(normalized))
    return {
      type: "url",
      url: normalized,
    };
  if (isShorthandCandidate(normalized)) {
    const result = parseHostedShorthand(normalized, "github", fragmentRef, fragmentSkillFilter);
    if (result) return result;
  }
  if (isWellKnownCandidate(normalized)) {
    const wellKnownResult = {
      type: "well-known",
      url: normalized,
    };
    if (fragmentSkillFilter) wellKnownResult.skillFilter = fragmentSkillFilter;
    return wellKnownResult;
  }
  const result = {
    type: "git",
    url: normalized,
  };
  if (fragmentRef) result.ref = fragmentRef;
  return result;
};
const resolveSource = async (parsed) => {
  if (parsed.type === "local") {
    if (!parsed.localPath) throw new Error("Local source is missing a resolved path");
    return { basePath: parsed.localPath };
  }
  if (parsed.type === "url") {
    const baseDir = await fetchSkillManifestFromUrl(parsed.url);
    return {
      basePath: baseDir,
      cleanup: () => cleanupTempDir(baseDir),
    };
  }
  if (parsed.type === "well-known") {
    const baseDir = await fetchWellKnownSkills(parsed.url);
    return {
      basePath: baseDir,
      skillFilter: parsed.skillFilter,
      cleanup: () => cleanupTempDir(baseDir),
    };
  }
  const cloneDir = await cloneRepo(parsed.url, parsed.ref);
  return {
    basePath: cloneDir,
    subpath: parsed.subpath,
    skillFilter: parsed.skillFilter,
    cleanup: () => cleanupTempDir(cloneDir),
  };
};
const resolveTargetAgents = async (requested) => {
  if (requested && requested.length > 0) return requested;
  const installed = await detectInstalledSkillAgents();
  return installed.length > 0 ? installed : getUniversalSkillAgents();
};
const resolveSkillFilters = (explicit, fromSource) => {
  if (explicit && explicit.length > 0) return explicit;
  if (fromSource) return [fromSource];
};
const installSkillsFromSource = async (options) => {
  const resolved = await resolveSource(parseSkillSource(options.source));
  try {
    const filters = resolveSkillFilters(options.skills, resolved.skillFilter);
    const discovered = await discoverSkills(resolved.basePath, resolved.subpath);
    const skills = filters ? filterSkillsByName(discovered, filters) : discovered;
    if (skills.length === 0)
      return {
        installed: [],
        failed: [],
        skills: [],
      };
    const targetAgents = await resolveTargetAgents(options.agents);
    const installed = [];
    const failed = [];
    for (const skill of skills)
      for (const agent of targetAgents) {
        const result = await installSkillForAgent(skill, agent, {
          global: options.global,
          cwd: options.cwd,
          mode: options.mode,
        });
        if (result.success)
          installed.push({
            skill: skill.name,
            agent,
            path: result.path,
            canonicalPath: result.canonicalPath,
            mode: result.mode,
            symlinkFailed: result.symlinkFailed,
          });
        else
          failed.push({
            skill: skill.name,
            agent,
            error: result.error ?? "Unknown error",
          });
      }
    return {
      installed,
      failed,
      skills,
    };
  } finally {
    await resolved.cleanup?.().catch(() => {});
  }
};
var skill_exports = /* @__PURE__ */ __exportAll({
  CANONICAL_SKILLS_DIR: () => CANONICAL_SKILLS_DIR,
  GitCloneError: () => GitCloneError,
  SKILL_MANIFEST_FILE: () => SKILL_MANIFEST_FILE,
  add: () => installSkillsFromSource,
  cleanupTempDir: () => cleanupTempDir,
  cloneRepo: () => cloneRepo,
  detectInstalledSkillAgents: () => detectInstalledSkillAgents,
  discover: () => discoverSkills,
  discoverSkills: () => discoverSkills,
  fetchSkillManifestFromUrl: () => fetchSkillManifestFromUrl,
  fetchWellKnownSkills: () => fetchWellKnownSkills,
  filterSkillsByName: () => filterSkillsByName,
  getCanonicalSkillsDir: () => getCanonicalSkillsDir,
  getNonUniversalSkillAgents: () => getNonUniversalSkillAgents,
  getPluginGroupings: () => getPluginGroupings,
  getPluginSkillPaths: () => getPluginSkillPaths,
  getSkillAgentBaseDir: () => getSkillAgentBaseDir,
  getSkillAgentConfig: () => getSkillAgentConfig,
  getSkillAgentDir: () => getSkillAgentDir,
  getSkillAgentTypes: () => getSkillAgentTypes,
  getSkillDisplayName: () => getSkillDisplayName,
  getUniversalSkillAgents: () => getUniversalSkillAgents,
  install: () => installSkillsFromSource,
  installSkillForAgent: () => installSkillForAgent,
  installSkillsFromSource: () => installSkillsFromSource,
  isSkillAgentType: () => isSkillAgentType,
  isSkillInstalledForAgent: () => isSkillInstalledForAgent,
  isUniversalSkillAgent: () => isUniversalSkillAgent,
  parseFrontmatter: () => parseFrontmatter,
  parseSkillManifest: () => parseSkillManifest,
  parseSkillSource: () => parseSkillSource,
  parseSource: () => parseSkillSource,
  sanitizeMetadata: () => sanitizeMetadata,
  sanitizeName: () => sanitizeName,
  skillAgents: () => skillAgents,
});
//#endregion
//#region ../../node_modules/.pnpm/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/umd/main.js
var require_main = /* @__PURE__ */ __commonJSMin((exports, module) => {
  (function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
      var v = factory(__require, exports);
      if (v !== void 0) module.exports = v;
    } else if (typeof define === "function" && define.amd)
      define([
        "require",
        "exports",
        "./impl/format",
        "./impl/edit",
        "./impl/scanner",
        "./impl/parser",
      ], factory);
  })(function (require, exports$1) {
    "use strict";
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.applyEdits =
      exports$1.modify =
      exports$1.format =
      exports$1.printParseErrorCode =
      exports$1.ParseErrorCode =
      exports$1.stripComments =
      exports$1.visit =
      exports$1.getNodeValue =
      exports$1.getNodePath =
      exports$1.findNodeAtOffset =
      exports$1.findNodeAtLocation =
      exports$1.parseTree =
      exports$1.parse =
      exports$1.getLocation =
      exports$1.SyntaxKind =
      exports$1.ScanError =
      exports$1.createScanner =
        void 0;
    const formatter = require("./impl/format");
    const edit = require("./impl/edit");
    const scanner = require("./impl/scanner");
    const parser = require("./impl/parser");
    /**
     * Creates a JSON scanner on the given text.
     * If ignoreTrivia is set, whitespaces or comments are ignored.
     */
    exports$1.createScanner = scanner.createScanner;
    var ScanError;
    (function (ScanError) {
      ScanError[(ScanError["None"] = 0)] = "None";
      ScanError[(ScanError["UnexpectedEndOfComment"] = 1)] = "UnexpectedEndOfComment";
      ScanError[(ScanError["UnexpectedEndOfString"] = 2)] = "UnexpectedEndOfString";
      ScanError[(ScanError["UnexpectedEndOfNumber"] = 3)] = "UnexpectedEndOfNumber";
      ScanError[(ScanError["InvalidUnicode"] = 4)] = "InvalidUnicode";
      ScanError[(ScanError["InvalidEscapeCharacter"] = 5)] = "InvalidEscapeCharacter";
      ScanError[(ScanError["InvalidCharacter"] = 6)] = "InvalidCharacter";
    })(ScanError || (exports$1.ScanError = ScanError = {}));
    var SyntaxKind;
    (function (SyntaxKind) {
      SyntaxKind[(SyntaxKind["OpenBraceToken"] = 1)] = "OpenBraceToken";
      SyntaxKind[(SyntaxKind["CloseBraceToken"] = 2)] = "CloseBraceToken";
      SyntaxKind[(SyntaxKind["OpenBracketToken"] = 3)] = "OpenBracketToken";
      SyntaxKind[(SyntaxKind["CloseBracketToken"] = 4)] = "CloseBracketToken";
      SyntaxKind[(SyntaxKind["CommaToken"] = 5)] = "CommaToken";
      SyntaxKind[(SyntaxKind["ColonToken"] = 6)] = "ColonToken";
      SyntaxKind[(SyntaxKind["NullKeyword"] = 7)] = "NullKeyword";
      SyntaxKind[(SyntaxKind["TrueKeyword"] = 8)] = "TrueKeyword";
      SyntaxKind[(SyntaxKind["FalseKeyword"] = 9)] = "FalseKeyword";
      SyntaxKind[(SyntaxKind["StringLiteral"] = 10)] = "StringLiteral";
      SyntaxKind[(SyntaxKind["NumericLiteral"] = 11)] = "NumericLiteral";
      SyntaxKind[(SyntaxKind["LineCommentTrivia"] = 12)] = "LineCommentTrivia";
      SyntaxKind[(SyntaxKind["BlockCommentTrivia"] = 13)] = "BlockCommentTrivia";
      SyntaxKind[(SyntaxKind["LineBreakTrivia"] = 14)] = "LineBreakTrivia";
      SyntaxKind[(SyntaxKind["Trivia"] = 15)] = "Trivia";
      SyntaxKind[(SyntaxKind["Unknown"] = 16)] = "Unknown";
      SyntaxKind[(SyntaxKind["EOF"] = 17)] = "EOF";
    })(SyntaxKind || (exports$1.SyntaxKind = SyntaxKind = {}));
    /**
     * For a given offset, evaluate the location in the JSON document. Each segment in the location path is either a property name or an array index.
     */
    exports$1.getLocation = parser.getLocation;
    /**
     * Parses the given text and returns the object the JSON content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
     * Therefore, always check the errors list to find out if the input was valid.
     */
    exports$1.parse = parser.parse;
    /**
     * Parses the given text and returns a tree representation the JSON content. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
     */
    exports$1.parseTree = parser.parseTree;
    /**
     * Finds the node at the given path in a JSON DOM.
     */
    exports$1.findNodeAtLocation = parser.findNodeAtLocation;
    /**
     * Finds the innermost node at the given offset. If includeRightBound is set, also finds nodes that end at the given offset.
     */
    exports$1.findNodeAtOffset = parser.findNodeAtOffset;
    /**
     * Gets the JSON path of the given JSON DOM node
     */
    exports$1.getNodePath = parser.getNodePath;
    /**
     * Evaluates the JavaScript object of the given JSON DOM node
     */
    exports$1.getNodeValue = parser.getNodeValue;
    /**
     * Parses the given text and invokes the visitor functions for each object, array and literal reached.
     */
    exports$1.visit = parser.visit;
    /**
     * Takes JSON with JavaScript-style comments and remove
     * them. Optionally replaces every none-newline character
     * of comments with a replaceCharacter
     */
    exports$1.stripComments = parser.stripComments;
    var ParseErrorCode;
    (function (ParseErrorCode) {
      ParseErrorCode[(ParseErrorCode["InvalidSymbol"] = 1)] = "InvalidSymbol";
      ParseErrorCode[(ParseErrorCode["InvalidNumberFormat"] = 2)] = "InvalidNumberFormat";
      ParseErrorCode[(ParseErrorCode["PropertyNameExpected"] = 3)] = "PropertyNameExpected";
      ParseErrorCode[(ParseErrorCode["ValueExpected"] = 4)] = "ValueExpected";
      ParseErrorCode[(ParseErrorCode["ColonExpected"] = 5)] = "ColonExpected";
      ParseErrorCode[(ParseErrorCode["CommaExpected"] = 6)] = "CommaExpected";
      ParseErrorCode[(ParseErrorCode["CloseBraceExpected"] = 7)] = "CloseBraceExpected";
      ParseErrorCode[(ParseErrorCode["CloseBracketExpected"] = 8)] = "CloseBracketExpected";
      ParseErrorCode[(ParseErrorCode["EndOfFileExpected"] = 9)] = "EndOfFileExpected";
      ParseErrorCode[(ParseErrorCode["InvalidCommentToken"] = 10)] = "InvalidCommentToken";
      ParseErrorCode[(ParseErrorCode["UnexpectedEndOfComment"] = 11)] = "UnexpectedEndOfComment";
      ParseErrorCode[(ParseErrorCode["UnexpectedEndOfString"] = 12)] = "UnexpectedEndOfString";
      ParseErrorCode[(ParseErrorCode["UnexpectedEndOfNumber"] = 13)] = "UnexpectedEndOfNumber";
      ParseErrorCode[(ParseErrorCode["InvalidUnicode"] = 14)] = "InvalidUnicode";
      ParseErrorCode[(ParseErrorCode["InvalidEscapeCharacter"] = 15)] = "InvalidEscapeCharacter";
      ParseErrorCode[(ParseErrorCode["InvalidCharacter"] = 16)] = "InvalidCharacter";
    })(ParseErrorCode || (exports$1.ParseErrorCode = ParseErrorCode = {}));
    function printParseErrorCode(code) {
      switch (code) {
        case 1:
          return "InvalidSymbol";
        case 2:
          return "InvalidNumberFormat";
        case 3:
          return "PropertyNameExpected";
        case 4:
          return "ValueExpected";
        case 5:
          return "ColonExpected";
        case 6:
          return "CommaExpected";
        case 7:
          return "CloseBraceExpected";
        case 8:
          return "CloseBracketExpected";
        case 9:
          return "EndOfFileExpected";
        case 10:
          return "InvalidCommentToken";
        case 11:
          return "UnexpectedEndOfComment";
        case 12:
          return "UnexpectedEndOfString";
        case 13:
          return "UnexpectedEndOfNumber";
        case 14:
          return "InvalidUnicode";
        case 15:
          return "InvalidEscapeCharacter";
        case 16:
          return "InvalidCharacter";
      }
      return "<unknown ParseErrorCode>";
    }
    exports$1.printParseErrorCode = printParseErrorCode;
    /**
     * Computes the edit operations needed to format a JSON document.
     *
     * @param documentText The input text
     * @param range The range to format or `undefined` to format the full content
     * @param options The formatting options
     * @returns The edit operations describing the formatting changes to the original document following the format described in {@linkcode EditResult}.
     * To apply the edit operations to the input, use {@linkcode applyEdits}.
     */
    function format(documentText, range, options) {
      return formatter.format(documentText, range, options);
    }
    exports$1.format = format;
    /**
     * Computes the edit operations needed to modify a value in the JSON document.
     *
     * @param documentText The input text
     * @param path The path of the value to change. The path represents either to the document root, a property or an array item.
     * If the path points to an non-existing property or item, it will be created.
     * @param value The new value for the specified property or item. If the value is undefined,
     * the property or item will be removed.
     * @param options Options
     * @returns The edit operations describing the changes to the original document, following the format described in {@linkcode EditResult}.
     * To apply the edit operations to the input, use {@linkcode applyEdits}.
     */
    function modify(text, path, value, options) {
      return edit.setProperty(text, path, value, options);
    }
    exports$1.modify = modify;
    /**
     * Applies edits to an input string.
     * @param text The input text
     * @param edits Edit operations following the format described in {@linkcode EditResult}.
     * @returns The text with the applied edits.
     * @throws An error if the edit operations are not well-formed as described in {@linkcode EditResult}.
     */
    function applyEdits(text, edits) {
      let sortedEdits = edits.slice(0).sort((a, b) => {
        const diff = a.offset - b.offset;
        if (diff === 0) return a.length - b.length;
        return diff;
      });
      let lastModifiedOffset = text.length;
      for (let i = sortedEdits.length - 1; i >= 0; i--) {
        let e = sortedEdits[i];
        if (e.offset + e.length <= lastModifiedOffset) text = edit.applyEdit(text, e);
        else throw new Error("Overlapping edit");
        lastModifiedOffset = e.offset;
      }
      return text;
    }
    exports$1.applyEdits = applyEdits;
  });
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/lib/parser.js
var require_parser = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const ParserEND = 1114112;
  var ParserError = class ParserError extends Error {
    /* istanbul ignore next */
    constructor(msg, filename, linenumber) {
      super("[ParserError] " + msg, filename, linenumber);
      this.name = "ParserError";
      this.code = "ParserError";
      if (Error.captureStackTrace) Error.captureStackTrace(this, ParserError);
    }
  };
  var State = class {
    constructor(parser) {
      this.parser = parser;
      this.buf = "";
      this.returned = null;
      this.result = null;
      this.resultTable = null;
      this.resultArr = null;
    }
  };
  var Parser = class {
    constructor() {
      this.pos = 0;
      this.col = 0;
      this.line = 0;
      this.obj = {};
      this.ctx = this.obj;
      this.stack = [];
      this._buf = "";
      this.char = null;
      this.ii = 0;
      this.state = new State(this.parseStart);
    }
    parse(str) {
      /* istanbul ignore next */
      if (str.length === 0 || str.length == null) return;
      this._buf = String(str);
      this.ii = -1;
      this.char = -1;
      let getNext;
      while (getNext === false || this.nextChar()) getNext = this.runOne();
      this._buf = null;
    }
    nextChar() {
      if (this.char === 10) {
        ++this.line;
        this.col = -1;
      }
      ++this.ii;
      this.char = this._buf.codePointAt(this.ii);
      ++this.pos;
      ++this.col;
      return this.haveBuffer();
    }
    haveBuffer() {
      return this.ii < this._buf.length;
    }
    runOne() {
      return this.state.parser.call(this, this.state.returned);
    }
    finish() {
      this.char = ParserEND;
      let last;
      do {
        last = this.state.parser;
        this.runOne();
      } while (this.state.parser !== last);
      this.ctx = null;
      this.state = null;
      this._buf = null;
      return this.obj;
    }
    next(fn) {
      /* istanbul ignore next */
      if (typeof fn !== "function")
        throw new ParserError("Tried to set state to non-existent state: " + JSON.stringify(fn));
      this.state.parser = fn;
    }
    goto(fn) {
      this.next(fn);
      return this.runOne();
    }
    call(fn, returnWith) {
      if (returnWith) this.next(returnWith);
      this.stack.push(this.state);
      this.state = new State(fn);
    }
    callNow(fn, returnWith) {
      this.call(fn, returnWith);
      return this.runOne();
    }
    return(value) {
      /* istanbul ignore next */
      if (this.stack.length === 0) throw this.error(new ParserError("Stack underflow"));
      if (value === void 0) value = this.state.buf;
      this.state = this.stack.pop();
      this.state.returned = value;
    }
    returnNow(value) {
      this.return(value);
      return this.runOne();
    }
    consume() {
      /* istanbul ignore next */
      if (this.char === ParserEND) throw this.error(new ParserError("Unexpected end-of-buffer"));
      this.state.buf += this._buf[this.ii];
    }
    error(err) {
      err.line = this.line;
      err.col = this.col;
      err.pos = this.pos;
      return err;
    }
    /* istanbul ignore next */
    parseStart() {
      throw new ParserError("Must declare a parseStart method");
    }
  };
  Parser.END = ParserEND;
  Parser.Error = ParserError;
  module.exports = Parser;
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/lib/create-datetime.js
var require_create_datetime = /* @__PURE__ */ __commonJSMin((exports, module) => {
  module.exports = (value) => {
    const date = new Date(value);
    /* istanbul ignore if */
    if (isNaN(date)) throw new TypeError("Invalid Datetime");
    else return date;
  };
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/lib/format-num.js
var require_format_num = /* @__PURE__ */ __commonJSMin((exports, module) => {
  module.exports = (d, num) => {
    num = String(num);
    while (num.length < d) num = "0" + num;
    return num;
  };
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/lib/create-datetime-float.js
var require_create_datetime_float = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const f = require_format_num();
  var FloatingDateTime = class extends Date {
    constructor(value) {
      super(value + "Z");
      this.isFloating = true;
    }
    toISOString() {
      return `${`${this.getUTCFullYear()}-${f(2, this.getUTCMonth() + 1)}-${f(2, this.getUTCDate())}`}T${`${f(2, this.getUTCHours())}:${f(2, this.getUTCMinutes())}:${f(2, this.getUTCSeconds())}.${f(3, this.getUTCMilliseconds())}`}`;
    }
  };
  module.exports = (value) => {
    const date = new FloatingDateTime(value);
    /* istanbul ignore if */
    if (isNaN(date)) throw new TypeError("Invalid Datetime");
    else return date;
  };
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/lib/create-date.js
var require_create_date = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const f = require_format_num();
  const DateTime = global.Date;
  var Date = class extends DateTime {
    constructor(value) {
      super(value);
      this.isDate = true;
    }
    toISOString() {
      return `${this.getUTCFullYear()}-${f(2, this.getUTCMonth() + 1)}-${f(2, this.getUTCDate())}`;
    }
  };
  module.exports = (value) => {
    const date = new Date(value);
    /* istanbul ignore if */
    if (isNaN(date)) throw new TypeError("Invalid Datetime");
    else return date;
  };
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/lib/create-time.js
var require_create_time = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const f = require_format_num();
  var Time = class extends Date {
    constructor(value) {
      super(`0000-01-01T${value}Z`);
      this.isTime = true;
    }
    toISOString() {
      return `${f(2, this.getUTCHours())}:${f(2, this.getUTCMinutes())}:${f(2, this.getUTCSeconds())}.${f(3, this.getUTCMilliseconds())}`;
    }
  };
  module.exports = (value) => {
    const date = new Time(value);
    /* istanbul ignore if */
    if (isNaN(date)) throw new TypeError("Invalid Datetime");
    else return date;
  };
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/lib/toml-parser.js
var require_toml_parser = /* @__PURE__ */ __commonJSMin((exports, module) => {
  module.exports = makeParserClass(require_parser());
  module.exports.makeParserClass = makeParserClass;
  var TomlError = class TomlError extends Error {
    constructor(msg) {
      super(msg);
      this.name = "TomlError";
      /* istanbul ignore next */
      if (Error.captureStackTrace) Error.captureStackTrace(this, TomlError);
      this.fromTOML = true;
      this.wrapped = null;
    }
  };
  TomlError.wrap = (err) => {
    const terr = new TomlError(err.message);
    terr.code = err.code;
    terr.wrapped = err;
    return terr;
  };
  module.exports.TomlError = TomlError;
  const createDateTime = require_create_datetime();
  const createDateTimeFloat = require_create_datetime_float();
  const createDate = require_create_date();
  const createTime = require_create_time();
  const CTRL_I = 9;
  const CTRL_J = 10;
  const CTRL_M = 13;
  const CTRL_CHAR_BOUNDARY = 31;
  const CHAR_SP = 32;
  const CHAR_QUOT = 34;
  const CHAR_NUM = 35;
  const CHAR_APOS = 39;
  const CHAR_PLUS = 43;
  const CHAR_COMMA = 44;
  const CHAR_HYPHEN = 45;
  const CHAR_PERIOD = 46;
  const CHAR_0 = 48;
  const CHAR_1 = 49;
  const CHAR_7 = 55;
  const CHAR_9 = 57;
  const CHAR_COLON = 58;
  const CHAR_EQUALS = 61;
  const CHAR_A = 65;
  const CHAR_E = 69;
  const CHAR_F = 70;
  const CHAR_T = 84;
  const CHAR_U = 85;
  const CHAR_Z = 90;
  const CHAR_LOWBAR = 95;
  const CHAR_a = 97;
  const CHAR_b = 98;
  const CHAR_e = 101;
  const CHAR_f = 102;
  const CHAR_i = 105;
  const CHAR_l = 108;
  const CHAR_n = 110;
  const CHAR_o = 111;
  const CHAR_r = 114;
  const CHAR_s = 115;
  const CHAR_t = 116;
  const CHAR_u = 117;
  const CHAR_x = 120;
  const CHAR_z = 122;
  const CHAR_LCUB = 123;
  const CHAR_RCUB = 125;
  const CHAR_LSQB = 91;
  const CHAR_BSOL = 92;
  const CHAR_RSQB = 93;
  const CHAR_DEL = 127;
  const SURROGATE_FIRST = 55296;
  const SURROGATE_LAST = 57343;
  const escapes = {
    [CHAR_b]: "\b",
    [CHAR_t]: "	",
    [CHAR_n]: "\n",
    [CHAR_f]: "\f",
    [CHAR_r]: "\r",
    [CHAR_QUOT]: '"',
    [CHAR_BSOL]: "\\",
  };
  function isDigit(cp) {
    return cp >= CHAR_0 && cp <= CHAR_9;
  }
  function isHexit(cp) {
    return (
      (cp >= CHAR_A && cp <= CHAR_F) ||
      (cp >= CHAR_a && cp <= CHAR_f) ||
      (cp >= CHAR_0 && cp <= CHAR_9)
    );
  }
  function isBit(cp) {
    return cp === CHAR_1 || cp === CHAR_0;
  }
  function isOctit(cp) {
    return cp >= CHAR_0 && cp <= CHAR_7;
  }
  function isAlphaNumQuoteHyphen(cp) {
    return (
      (cp >= CHAR_A && cp <= CHAR_Z) ||
      (cp >= CHAR_a && cp <= CHAR_z) ||
      (cp >= CHAR_0 && cp <= CHAR_9) ||
      cp === CHAR_APOS ||
      cp === CHAR_QUOT ||
      cp === CHAR_LOWBAR ||
      cp === CHAR_HYPHEN
    );
  }
  function isAlphaNumHyphen(cp) {
    return (
      (cp >= CHAR_A && cp <= CHAR_Z) ||
      (cp >= CHAR_a && cp <= CHAR_z) ||
      (cp >= CHAR_0 && cp <= CHAR_9) ||
      cp === CHAR_LOWBAR ||
      cp === CHAR_HYPHEN
    );
  }
  const _type = Symbol("type");
  const _declared = Symbol("declared");
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const defineProperty = Object.defineProperty;
  const descriptor = {
    configurable: true,
    enumerable: true,
    writable: true,
    value: void 0,
  };
  function hasKey(obj, key) {
    if (hasOwnProperty.call(obj, key)) return true;
    if (key === "__proto__") defineProperty(obj, "__proto__", descriptor);
    return false;
  }
  const INLINE_TABLE = Symbol("inline-table");
  function InlineTable() {
    return Object.defineProperties({}, { [_type]: { value: INLINE_TABLE } });
  }
  function isInlineTable(obj) {
    if (obj === null || typeof obj !== "object") return false;
    return obj[_type] === INLINE_TABLE;
  }
  const TABLE = Symbol("table");
  function Table() {
    return Object.defineProperties(
      {},
      {
        [_type]: { value: TABLE },
        [_declared]: {
          value: false,
          writable: true,
        },
      },
    );
  }
  function isTable(obj) {
    if (obj === null || typeof obj !== "object") return false;
    return obj[_type] === TABLE;
  }
  const _contentType = Symbol("content-type");
  const INLINE_LIST = Symbol("inline-list");
  function InlineList(type) {
    return Object.defineProperties([], {
      [_type]: { value: INLINE_LIST },
      [_contentType]: { value: type },
    });
  }
  function isInlineList(obj) {
    if (obj === null || typeof obj !== "object") return false;
    return obj[_type] === INLINE_LIST;
  }
  const LIST = Symbol("list");
  function List() {
    return Object.defineProperties([], { [_type]: { value: LIST } });
  }
  function isList(obj) {
    if (obj === null || typeof obj !== "object") return false;
    return obj[_type] === LIST;
  }
  let _custom;
  try {
    const utilInspect = eval("require('util').inspect");
    _custom = utilInspect.custom;
  } catch (_) {}
  /* istanbul ignore next */
  const _inspect = _custom || "inspect";
  var BoxedBigInt = class {
    constructor(value) {
      try {
        this.value = global.BigInt.asIntN(64, value);
      } catch (_) {
        /* istanbul ignore next */
        this.value = null;
      }
      Object.defineProperty(this, _type, { value: INTEGER });
    }
    isNaN() {
      return this.value === null;
    }
    /* istanbul ignore next */
    toString() {
      return String(this.value);
    }
    /* istanbul ignore next */
    [_inspect]() {
      return `[BigInt: ${this.toString()}]}`;
    }
    valueOf() {
      return this.value;
    }
  };
  const INTEGER = Symbol("integer");
  function Integer(value) {
    let num = Number(value);
    if (Object.is(num, -0)) num = 0;
    /* istanbul ignore else */
    if (global.BigInt && !Number.isSafeInteger(num)) return new BoxedBigInt(value);
    else
      /* istanbul ignore next */
      return Object.defineProperties(new Number(num), {
        isNaN: {
          value: function () {
            return isNaN(this);
          },
        },
        [_type]: { value: INTEGER },
        [_inspect]: { value: () => `[Integer: ${value}]` },
      });
  }
  function isInteger(obj) {
    if (obj === null || typeof obj !== "object") return false;
    return obj[_type] === INTEGER;
  }
  const FLOAT = Symbol("float");
  function Float(value) {
    /* istanbul ignore next */
    return Object.defineProperties(new Number(value), {
      [_type]: { value: FLOAT },
      [_inspect]: { value: () => `[Float: ${value}]` },
    });
  }
  function isFloat(obj) {
    if (obj === null || typeof obj !== "object") return false;
    return obj[_type] === FLOAT;
  }
  function tomlType(value) {
    const type = typeof value;
    if (type === "object") {
      /* istanbul ignore if */
      if (value === null) return "null";
      if (value instanceof Date) return "datetime";
      /* istanbul ignore else */
      if (_type in value)
        switch (value[_type]) {
          case INLINE_TABLE:
            return "inline-table";
          case INLINE_LIST:
            return "inline-list";
          /* istanbul ignore next */
          case TABLE:
            return "table";
          /* istanbul ignore next */
          case LIST:
            return "list";
          case FLOAT:
            return "float";
          case INTEGER:
            return "integer";
        }
    }
    return type;
  }
  function makeParserClass(Parser) {
    class TOMLParser extends Parser {
      constructor() {
        super();
        this.ctx = this.obj = Table();
      }
      atEndOfWord() {
        return (
          this.char === CHAR_NUM ||
          this.char === CTRL_I ||
          this.char === CHAR_SP ||
          this.atEndOfLine()
        );
      }
      atEndOfLine() {
        return this.char === Parser.END || this.char === CTRL_J || this.char === CTRL_M;
      }
      parseStart() {
        if (this.char === Parser.END) return null;
        else if (this.char === CHAR_LSQB) return this.call(this.parseTableOrList);
        else if (this.char === CHAR_NUM) return this.call(this.parseComment);
        else if (
          this.char === CTRL_J ||
          this.char === CHAR_SP ||
          this.char === CTRL_I ||
          this.char === CTRL_M
        )
          return null;
        else if (isAlphaNumQuoteHyphen(this.char)) return this.callNow(this.parseAssignStatement);
        else throw this.error(new TomlError(`Unknown character "${this.char}"`));
      }
      parseWhitespaceToEOL() {
        if (this.char === CHAR_SP || this.char === CTRL_I || this.char === CTRL_M) return null;
        else if (this.char === CHAR_NUM) return this.goto(this.parseComment);
        else if (this.char === Parser.END || this.char === CTRL_J) return this.return();
        else
          throw this.error(
            new TomlError(
              "Unexpected character, expected only whitespace or comments till end of line",
            ),
          );
      }
      parseAssignStatement() {
        return this.callNow(this.parseAssign, this.recordAssignStatement);
      }
      recordAssignStatement(kv) {
        let target = this.ctx;
        let finalKey = kv.key.pop();
        for (let kw of kv.key) {
          if (hasKey(target, kw) && (!isTable(target[kw]) || target[kw][_declared]))
            throw this.error(new TomlError("Can't redefine existing key"));
          target = target[kw] = target[kw] || Table();
        }
        if (hasKey(target, finalKey))
          throw this.error(new TomlError("Can't redefine existing key"));
        if (isInteger(kv.value) || isFloat(kv.value)) target[finalKey] = kv.value.valueOf();
        else target[finalKey] = kv.value;
        return this.goto(this.parseWhitespaceToEOL);
      }
      parseAssign() {
        return this.callNow(this.parseKeyword, this.recordAssignKeyword);
      }
      recordAssignKeyword(key) {
        if (this.state.resultTable) this.state.resultTable.push(key);
        else this.state.resultTable = [key];
        return this.goto(this.parseAssignKeywordPreDot);
      }
      parseAssignKeywordPreDot() {
        if (this.char === CHAR_PERIOD) return this.next(this.parseAssignKeywordPostDot);
        else if (this.char !== CHAR_SP && this.char !== CTRL_I)
          return this.goto(this.parseAssignEqual);
      }
      parseAssignKeywordPostDot() {
        if (this.char !== CHAR_SP && this.char !== CTRL_I)
          return this.callNow(this.parseKeyword, this.recordAssignKeyword);
      }
      parseAssignEqual() {
        if (this.char === CHAR_EQUALS) return this.next(this.parseAssignPreValue);
        else throw this.error(new TomlError('Invalid character, expected "="'));
      }
      parseAssignPreValue() {
        if (this.char === CHAR_SP || this.char === CTRL_I) return null;
        else return this.callNow(this.parseValue, this.recordAssignValue);
      }
      recordAssignValue(value) {
        return this.returnNow({
          key: this.state.resultTable,
          value,
        });
      }
      parseComment() {
        do if (this.char === Parser.END || this.char === CTRL_J) return this.return();
        while (this.nextChar());
      }
      parseTableOrList() {
        if (this.char === CHAR_LSQB) this.next(this.parseList);
        else return this.goto(this.parseTable);
      }
      parseTable() {
        this.ctx = this.obj;
        return this.goto(this.parseTableNext);
      }
      parseTableNext() {
        if (this.char === CHAR_SP || this.char === CTRL_I) return null;
        else return this.callNow(this.parseKeyword, this.parseTableMore);
      }
      parseTableMore(keyword) {
        if (this.char === CHAR_SP || this.char === CTRL_I) return null;
        else if (this.char === CHAR_RSQB) {
          if (
            hasKey(this.ctx, keyword) &&
            (!isTable(this.ctx[keyword]) || this.ctx[keyword][_declared])
          )
            throw this.error(new TomlError("Can't redefine existing key"));
          else {
            this.ctx = this.ctx[keyword] = this.ctx[keyword] || Table();
            this.ctx[_declared] = true;
          }
          return this.next(this.parseWhitespaceToEOL);
        } else if (this.char === CHAR_PERIOD) {
          if (!hasKey(this.ctx, keyword)) this.ctx = this.ctx[keyword] = Table();
          else if (isTable(this.ctx[keyword])) this.ctx = this.ctx[keyword];
          else if (isList(this.ctx[keyword]))
            this.ctx = this.ctx[keyword][this.ctx[keyword].length - 1];
          else throw this.error(new TomlError("Can't redefine existing key"));
          return this.next(this.parseTableNext);
        } else throw this.error(new TomlError("Unexpected character, expected whitespace, . or ]"));
      }
      parseList() {
        this.ctx = this.obj;
        return this.goto(this.parseListNext);
      }
      parseListNext() {
        if (this.char === CHAR_SP || this.char === CTRL_I) return null;
        else return this.callNow(this.parseKeyword, this.parseListMore);
      }
      parseListMore(keyword) {
        if (this.char === CHAR_SP || this.char === CTRL_I) return null;
        else if (this.char === CHAR_RSQB) {
          if (!hasKey(this.ctx, keyword)) this.ctx[keyword] = List();
          if (isInlineList(this.ctx[keyword]))
            throw this.error(new TomlError("Can't extend an inline array"));
          else if (isList(this.ctx[keyword])) {
            const next = Table();
            this.ctx[keyword].push(next);
            this.ctx = next;
          } else throw this.error(new TomlError("Can't redefine an existing key"));
          return this.next(this.parseListEnd);
        } else if (this.char === CHAR_PERIOD) {
          if (!hasKey(this.ctx, keyword)) this.ctx = this.ctx[keyword] = Table();
          else if (isInlineList(this.ctx[keyword]))
            throw this.error(new TomlError("Can't extend an inline array"));
          else if (isInlineTable(this.ctx[keyword]))
            throw this.error(new TomlError("Can't extend an inline table"));
          else if (isList(this.ctx[keyword]))
            this.ctx = this.ctx[keyword][this.ctx[keyword].length - 1];
          else if (isTable(this.ctx[keyword])) this.ctx = this.ctx[keyword];
          else throw this.error(new TomlError("Can't redefine an existing key"));
          return this.next(this.parseListNext);
        } else throw this.error(new TomlError("Unexpected character, expected whitespace, . or ]"));
      }
      parseListEnd(keyword) {
        if (this.char === CHAR_RSQB) return this.next(this.parseWhitespaceToEOL);
        else throw this.error(new TomlError("Unexpected character, expected whitespace, . or ]"));
      }
      parseValue() {
        if (this.char === Parser.END) throw this.error(new TomlError("Key without value"));
        else if (this.char === CHAR_QUOT) return this.next(this.parseDoubleString);
        if (this.char === CHAR_APOS) return this.next(this.parseSingleString);
        else if (this.char === CHAR_HYPHEN || this.char === CHAR_PLUS)
          return this.goto(this.parseNumberSign);
        else if (this.char === CHAR_i) return this.next(this.parseInf);
        else if (this.char === CHAR_n) return this.next(this.parseNan);
        else if (isDigit(this.char)) return this.goto(this.parseNumberOrDateTime);
        else if (this.char === CHAR_t || this.char === CHAR_f) return this.goto(this.parseBoolean);
        else if (this.char === CHAR_LSQB) return this.call(this.parseInlineList, this.recordValue);
        else if (this.char === CHAR_LCUB) return this.call(this.parseInlineTable, this.recordValue);
        else
          throw this.error(
            new TomlError(
              "Unexpected character, expecting string, number, datetime, boolean, inline array or inline table",
            ),
          );
      }
      recordValue(value) {
        return this.returnNow(value);
      }
      parseInf() {
        if (this.char === CHAR_n) return this.next(this.parseInf2);
        else
          throw this.error(new TomlError('Unexpected character, expected "inf", "+inf" or "-inf"'));
      }
      parseInf2() {
        if (this.char === CHAR_f)
          if (this.state.buf === "-") return this.return(-Infinity);
          else return this.return(Infinity);
        else
          throw this.error(new TomlError('Unexpected character, expected "inf", "+inf" or "-inf"'));
      }
      parseNan() {
        if (this.char === CHAR_a) return this.next(this.parseNan2);
        else throw this.error(new TomlError('Unexpected character, expected "nan"'));
      }
      parseNan2() {
        if (this.char === CHAR_n) return this.return(NaN);
        else throw this.error(new TomlError('Unexpected character, expected "nan"'));
      }
      parseKeyword() {
        if (this.char === CHAR_QUOT) return this.next(this.parseBasicString);
        else if (this.char === CHAR_APOS) return this.next(this.parseLiteralString);
        else return this.goto(this.parseBareKey);
      }
      parseBareKey() {
        do
          if (this.char === Parser.END) throw this.error(new TomlError("Key ended without value"));
          else if (isAlphaNumHyphen(this.char)) this.consume();
          else if (this.state.buf.length === 0)
            throw this.error(new TomlError("Empty bare keys are not allowed"));
          else return this.returnNow();
        while (this.nextChar());
      }
      parseSingleString() {
        if (this.char === CHAR_APOS) return this.next(this.parseLiteralMultiStringMaybe);
        else return this.goto(this.parseLiteralString);
      }
      parseLiteralString() {
        do
          if (this.char === CHAR_APOS) return this.return();
          else if (this.atEndOfLine()) throw this.error(new TomlError("Unterminated string"));
          else if (
            this.char === CHAR_DEL ||
            (this.char <= CTRL_CHAR_BOUNDARY && this.char !== CTRL_I)
          )
            throw this.errorControlCharInString();
          else this.consume();
        while (this.nextChar());
      }
      parseLiteralMultiStringMaybe() {
        if (this.char === CHAR_APOS) return this.next(this.parseLiteralMultiString);
        else return this.returnNow();
      }
      parseLiteralMultiString() {
        if (this.char === CTRL_M) return null;
        else if (this.char === CTRL_J) return this.next(this.parseLiteralMultiStringContent);
        else return this.goto(this.parseLiteralMultiStringContent);
      }
      parseLiteralMultiStringContent() {
        do
          if (this.char === CHAR_APOS) return this.next(this.parseLiteralMultiEnd);
          else if (this.char === Parser.END)
            throw this.error(new TomlError("Unterminated multi-line string"));
          else if (
            this.char === CHAR_DEL ||
            (this.char <= CTRL_CHAR_BOUNDARY &&
              this.char !== CTRL_I &&
              this.char !== CTRL_J &&
              this.char !== CTRL_M)
          )
            throw this.errorControlCharInString();
          else this.consume();
        while (this.nextChar());
      }
      parseLiteralMultiEnd() {
        if (this.char === CHAR_APOS) return this.next(this.parseLiteralMultiEnd2);
        else {
          this.state.buf += "'";
          return this.goto(this.parseLiteralMultiStringContent);
        }
      }
      parseLiteralMultiEnd2() {
        if (this.char === CHAR_APOS) return this.return();
        else {
          this.state.buf += "''";
          return this.goto(this.parseLiteralMultiStringContent);
        }
      }
      parseDoubleString() {
        if (this.char === CHAR_QUOT) return this.next(this.parseMultiStringMaybe);
        else return this.goto(this.parseBasicString);
      }
      parseBasicString() {
        do
          if (this.char === CHAR_BSOL)
            return this.call(this.parseEscape, this.recordEscapeReplacement);
          else if (this.char === CHAR_QUOT) return this.return();
          else if (this.atEndOfLine()) throw this.error(new TomlError("Unterminated string"));
          else if (
            this.char === CHAR_DEL ||
            (this.char <= CTRL_CHAR_BOUNDARY && this.char !== CTRL_I)
          )
            throw this.errorControlCharInString();
          else this.consume();
        while (this.nextChar());
      }
      recordEscapeReplacement(replacement) {
        this.state.buf += replacement;
        return this.goto(this.parseBasicString);
      }
      parseMultiStringMaybe() {
        if (this.char === CHAR_QUOT) return this.next(this.parseMultiString);
        else return this.returnNow();
      }
      parseMultiString() {
        if (this.char === CTRL_M) return null;
        else if (this.char === CTRL_J) return this.next(this.parseMultiStringContent);
        else return this.goto(this.parseMultiStringContent);
      }
      parseMultiStringContent() {
        do
          if (this.char === CHAR_BSOL)
            return this.call(this.parseMultiEscape, this.recordMultiEscapeReplacement);
          else if (this.char === CHAR_QUOT) return this.next(this.parseMultiEnd);
          else if (this.char === Parser.END)
            throw this.error(new TomlError("Unterminated multi-line string"));
          else if (
            this.char === CHAR_DEL ||
            (this.char <= CTRL_CHAR_BOUNDARY &&
              this.char !== CTRL_I &&
              this.char !== CTRL_J &&
              this.char !== CTRL_M)
          )
            throw this.errorControlCharInString();
          else this.consume();
        while (this.nextChar());
      }
      errorControlCharInString() {
        let displayCode = "\\u00";
        if (this.char < 16) displayCode += "0";
        displayCode += this.char.toString(16);
        return this.error(
          new TomlError(
            `Control characters (codes < 0x1f and 0x7f) are not allowed in strings, use ${displayCode} instead`,
          ),
        );
      }
      recordMultiEscapeReplacement(replacement) {
        this.state.buf += replacement;
        return this.goto(this.parseMultiStringContent);
      }
      parseMultiEnd() {
        if (this.char === CHAR_QUOT) return this.next(this.parseMultiEnd2);
        else {
          this.state.buf += '"';
          return this.goto(this.parseMultiStringContent);
        }
      }
      parseMultiEnd2() {
        if (this.char === CHAR_QUOT) return this.return();
        else {
          this.state.buf += '""';
          return this.goto(this.parseMultiStringContent);
        }
      }
      parseMultiEscape() {
        if (this.char === CTRL_M || this.char === CTRL_J) return this.next(this.parseMultiTrim);
        else if (this.char === CHAR_SP || this.char === CTRL_I)
          return this.next(this.parsePreMultiTrim);
        else return this.goto(this.parseEscape);
      }
      parsePreMultiTrim() {
        if (this.char === CHAR_SP || this.char === CTRL_I) return null;
        else if (this.char === CTRL_M || this.char === CTRL_J)
          return this.next(this.parseMultiTrim);
        else throw this.error(new TomlError("Can't escape whitespace"));
      }
      parseMultiTrim() {
        if (
          this.char === CTRL_J ||
          this.char === CHAR_SP ||
          this.char === CTRL_I ||
          this.char === CTRL_M
        )
          return null;
        else return this.returnNow();
      }
      parseEscape() {
        if (this.char in escapes) return this.return(escapes[this.char]);
        else if (this.char === CHAR_u)
          return this.call(this.parseSmallUnicode, this.parseUnicodeReturn);
        else if (this.char === CHAR_U)
          return this.call(this.parseLargeUnicode, this.parseUnicodeReturn);
        else throw this.error(new TomlError("Unknown escape character: " + this.char));
      }
      parseUnicodeReturn(char) {
        try {
          const codePoint = parseInt(char, 16);
          if (codePoint >= SURROGATE_FIRST && codePoint <= SURROGATE_LAST)
            throw this.error(
              new TomlError("Invalid unicode, character in range 0xD800 - 0xDFFF is reserved"),
            );
          return this.returnNow(String.fromCodePoint(codePoint));
        } catch (err) {
          throw this.error(TomlError.wrap(err));
        }
      }
      parseSmallUnicode() {
        if (!isHexit(this.char))
          throw this.error(new TomlError("Invalid character in unicode sequence, expected hex"));
        else {
          this.consume();
          if (this.state.buf.length >= 4) return this.return();
        }
      }
      parseLargeUnicode() {
        if (!isHexit(this.char))
          throw this.error(new TomlError("Invalid character in unicode sequence, expected hex"));
        else {
          this.consume();
          if (this.state.buf.length >= 8) return this.return();
        }
      }
      parseNumberSign() {
        this.consume();
        return this.next(this.parseMaybeSignedInfOrNan);
      }
      parseMaybeSignedInfOrNan() {
        if (this.char === CHAR_i) return this.next(this.parseInf);
        else if (this.char === CHAR_n) return this.next(this.parseNan);
        else return this.callNow(this.parseNoUnder, this.parseNumberIntegerStart);
      }
      parseNumberIntegerStart() {
        if (this.char === CHAR_0) {
          this.consume();
          return this.next(this.parseNumberIntegerExponentOrDecimal);
        } else return this.goto(this.parseNumberInteger);
      }
      parseNumberIntegerExponentOrDecimal() {
        if (this.char === CHAR_PERIOD) {
          this.consume();
          return this.call(this.parseNoUnder, this.parseNumberFloat);
        } else if (this.char === CHAR_E || this.char === CHAR_e) {
          this.consume();
          return this.next(this.parseNumberExponentSign);
        } else return this.returnNow(Integer(this.state.buf));
      }
      parseNumberInteger() {
        if (isDigit(this.char)) this.consume();
        else if (this.char === CHAR_LOWBAR) return this.call(this.parseNoUnder);
        else if (this.char === CHAR_E || this.char === CHAR_e) {
          this.consume();
          return this.next(this.parseNumberExponentSign);
        } else if (this.char === CHAR_PERIOD) {
          this.consume();
          return this.call(this.parseNoUnder, this.parseNumberFloat);
        } else {
          const result = Integer(this.state.buf);
          /* istanbul ignore if */
          if (result.isNaN()) throw this.error(new TomlError("Invalid number"));
          else return this.returnNow(result);
        }
      }
      parseNoUnder() {
        if (
          this.char === CHAR_LOWBAR ||
          this.char === CHAR_PERIOD ||
          this.char === CHAR_E ||
          this.char === CHAR_e
        )
          throw this.error(new TomlError("Unexpected character, expected digit"));
        else if (this.atEndOfWord()) throw this.error(new TomlError("Incomplete number"));
        return this.returnNow();
      }
      parseNoUnderHexOctBinLiteral() {
        if (this.char === CHAR_LOWBAR || this.char === CHAR_PERIOD)
          throw this.error(new TomlError("Unexpected character, expected digit"));
        else if (this.atEndOfWord()) throw this.error(new TomlError("Incomplete number"));
        return this.returnNow();
      }
      parseNumberFloat() {
        if (this.char === CHAR_LOWBAR) return this.call(this.parseNoUnder, this.parseNumberFloat);
        else if (isDigit(this.char)) this.consume();
        else if (this.char === CHAR_E || this.char === CHAR_e) {
          this.consume();
          return this.next(this.parseNumberExponentSign);
        } else return this.returnNow(Float(this.state.buf));
      }
      parseNumberExponentSign() {
        if (isDigit(this.char)) return this.goto(this.parseNumberExponent);
        else if (this.char === CHAR_HYPHEN || this.char === CHAR_PLUS) {
          this.consume();
          this.call(this.parseNoUnder, this.parseNumberExponent);
        } else throw this.error(new TomlError("Unexpected character, expected -, + or digit"));
      }
      parseNumberExponent() {
        if (isDigit(this.char)) this.consume();
        else if (this.char === CHAR_LOWBAR) return this.call(this.parseNoUnder);
        else return this.returnNow(Float(this.state.buf));
      }
      parseNumberOrDateTime() {
        if (this.char === CHAR_0) {
          this.consume();
          return this.next(this.parseNumberBaseOrDateTime);
        } else return this.goto(this.parseNumberOrDateTimeOnly);
      }
      parseNumberOrDateTimeOnly() {
        if (this.char === CHAR_LOWBAR) return this.call(this.parseNoUnder, this.parseNumberInteger);
        else if (isDigit(this.char)) {
          this.consume();
          if (this.state.buf.length > 4) this.next(this.parseNumberInteger);
        } else if (this.char === CHAR_E || this.char === CHAR_e) {
          this.consume();
          return this.next(this.parseNumberExponentSign);
        } else if (this.char === CHAR_PERIOD) {
          this.consume();
          return this.call(this.parseNoUnder, this.parseNumberFloat);
        } else if (this.char === CHAR_HYPHEN) return this.goto(this.parseDateTime);
        else if (this.char === CHAR_COLON) return this.goto(this.parseOnlyTimeHour);
        else return this.returnNow(Integer(this.state.buf));
      }
      parseDateTimeOnly() {
        if (this.state.buf.length < 4)
          if (isDigit(this.char)) return this.consume();
          else if (this.char === CHAR_COLON) return this.goto(this.parseOnlyTimeHour);
          else throw this.error(new TomlError("Expected digit while parsing year part of a date"));
        else if (this.char === CHAR_HYPHEN) return this.goto(this.parseDateTime);
        else throw this.error(new TomlError("Expected hyphen (-) while parsing year part of date"));
      }
      parseNumberBaseOrDateTime() {
        if (this.char === CHAR_b) {
          this.consume();
          return this.call(this.parseNoUnderHexOctBinLiteral, this.parseIntegerBin);
        } else if (this.char === CHAR_o) {
          this.consume();
          return this.call(this.parseNoUnderHexOctBinLiteral, this.parseIntegerOct);
        } else if (this.char === CHAR_x) {
          this.consume();
          return this.call(this.parseNoUnderHexOctBinLiteral, this.parseIntegerHex);
        } else if (this.char === CHAR_PERIOD) return this.goto(this.parseNumberInteger);
        else if (isDigit(this.char)) return this.goto(this.parseDateTimeOnly);
        else return this.returnNow(Integer(this.state.buf));
      }
      parseIntegerHex() {
        if (isHexit(this.char)) this.consume();
        else if (this.char === CHAR_LOWBAR) return this.call(this.parseNoUnderHexOctBinLiteral);
        else {
          const result = Integer(this.state.buf);
          /* istanbul ignore if */
          if (result.isNaN()) throw this.error(new TomlError("Invalid number"));
          else return this.returnNow(result);
        }
      }
      parseIntegerOct() {
        if (isOctit(this.char)) this.consume();
        else if (this.char === CHAR_LOWBAR) return this.call(this.parseNoUnderHexOctBinLiteral);
        else {
          const result = Integer(this.state.buf);
          /* istanbul ignore if */
          if (result.isNaN()) throw this.error(new TomlError("Invalid number"));
          else return this.returnNow(result);
        }
      }
      parseIntegerBin() {
        if (isBit(this.char)) this.consume();
        else if (this.char === CHAR_LOWBAR) return this.call(this.parseNoUnderHexOctBinLiteral);
        else {
          const result = Integer(this.state.buf);
          /* istanbul ignore if */
          if (result.isNaN()) throw this.error(new TomlError("Invalid number"));
          else return this.returnNow(result);
        }
      }
      parseDateTime() {
        if (this.state.buf.length < 4)
          throw this.error(
            new TomlError("Years less than 1000 must be zero padded to four characters"),
          );
        this.state.result = this.state.buf;
        this.state.buf = "";
        return this.next(this.parseDateMonth);
      }
      parseDateMonth() {
        if (this.char === CHAR_HYPHEN) {
          if (this.state.buf.length < 2)
            throw this.error(
              new TomlError("Months less than 10 must be zero padded to two characters"),
            );
          this.state.result += "-" + this.state.buf;
          this.state.buf = "";
          return this.next(this.parseDateDay);
        } else if (isDigit(this.char)) this.consume();
        else throw this.error(new TomlError("Incomplete datetime"));
      }
      parseDateDay() {
        if (this.char === CHAR_T || this.char === CHAR_SP) {
          if (this.state.buf.length < 2)
            throw this.error(
              new TomlError("Days less than 10 must be zero padded to two characters"),
            );
          this.state.result += "-" + this.state.buf;
          this.state.buf = "";
          return this.next(this.parseStartTimeHour);
        } else if (this.atEndOfWord())
          return this.returnNow(createDate(this.state.result + "-" + this.state.buf));
        else if (isDigit(this.char)) this.consume();
        else throw this.error(new TomlError("Incomplete datetime"));
      }
      parseStartTimeHour() {
        if (this.atEndOfWord()) return this.returnNow(createDate(this.state.result));
        else return this.goto(this.parseTimeHour);
      }
      parseTimeHour() {
        if (this.char === CHAR_COLON) {
          if (this.state.buf.length < 2)
            throw this.error(
              new TomlError("Hours less than 10 must be zero padded to two characters"),
            );
          this.state.result += "T" + this.state.buf;
          this.state.buf = "";
          return this.next(this.parseTimeMin);
        } else if (isDigit(this.char)) this.consume();
        else throw this.error(new TomlError("Incomplete datetime"));
      }
      parseTimeMin() {
        if (this.state.buf.length < 2 && isDigit(this.char)) this.consume();
        else if (this.state.buf.length === 2 && this.char === CHAR_COLON) {
          this.state.result += ":" + this.state.buf;
          this.state.buf = "";
          return this.next(this.parseTimeSec);
        } else throw this.error(new TomlError("Incomplete datetime"));
      }
      parseTimeSec() {
        if (isDigit(this.char)) {
          this.consume();
          if (this.state.buf.length === 2) {
            this.state.result += ":" + this.state.buf;
            this.state.buf = "";
            return this.next(this.parseTimeZoneOrFraction);
          }
        } else throw this.error(new TomlError("Incomplete datetime"));
      }
      parseOnlyTimeHour() {
        /* istanbul ignore else */
        if (this.char === CHAR_COLON) {
          if (this.state.buf.length < 2)
            throw this.error(
              new TomlError("Hours less than 10 must be zero padded to two characters"),
            );
          this.state.result = this.state.buf;
          this.state.buf = "";
          return this.next(this.parseOnlyTimeMin);
        } else throw this.error(new TomlError("Incomplete time"));
      }
      parseOnlyTimeMin() {
        if (this.state.buf.length < 2 && isDigit(this.char)) this.consume();
        else if (this.state.buf.length === 2 && this.char === CHAR_COLON) {
          this.state.result += ":" + this.state.buf;
          this.state.buf = "";
          return this.next(this.parseOnlyTimeSec);
        } else throw this.error(new TomlError("Incomplete time"));
      }
      parseOnlyTimeSec() {
        if (isDigit(this.char)) {
          this.consume();
          if (this.state.buf.length === 2) return this.next(this.parseOnlyTimeFractionMaybe);
        } else throw this.error(new TomlError("Incomplete time"));
      }
      parseOnlyTimeFractionMaybe() {
        this.state.result += ":" + this.state.buf;
        if (this.char === CHAR_PERIOD) {
          this.state.buf = "";
          this.next(this.parseOnlyTimeFraction);
        } else return this.return(createTime(this.state.result));
      }
      parseOnlyTimeFraction() {
        if (isDigit(this.char)) this.consume();
        else if (this.atEndOfWord()) {
          if (this.state.buf.length === 0)
            throw this.error(new TomlError("Expected digit in milliseconds"));
          return this.returnNow(createTime(this.state.result + "." + this.state.buf));
        } else
          throw this.error(
            new TomlError(
              "Unexpected character in datetime, expected period (.), minus (-), plus (+) or Z",
            ),
          );
      }
      parseTimeZoneOrFraction() {
        if (this.char === CHAR_PERIOD) {
          this.consume();
          this.next(this.parseDateTimeFraction);
        } else if (this.char === CHAR_HYPHEN || this.char === CHAR_PLUS) {
          this.consume();
          this.next(this.parseTimeZoneHour);
        } else if (this.char === CHAR_Z) {
          this.consume();
          return this.return(createDateTime(this.state.result + this.state.buf));
        } else if (this.atEndOfWord())
          return this.returnNow(createDateTimeFloat(this.state.result + this.state.buf));
        else
          throw this.error(
            new TomlError(
              "Unexpected character in datetime, expected period (.), minus (-), plus (+) or Z",
            ),
          );
      }
      parseDateTimeFraction() {
        if (isDigit(this.char)) this.consume();
        else if (this.state.buf.length === 1)
          throw this.error(new TomlError("Expected digit in milliseconds"));
        else if (this.char === CHAR_HYPHEN || this.char === CHAR_PLUS) {
          this.consume();
          this.next(this.parseTimeZoneHour);
        } else if (this.char === CHAR_Z) {
          this.consume();
          return this.return(createDateTime(this.state.result + this.state.buf));
        } else if (this.atEndOfWord())
          return this.returnNow(createDateTimeFloat(this.state.result + this.state.buf));
        else
          throw this.error(
            new TomlError(
              "Unexpected character in datetime, expected period (.), minus (-), plus (+) or Z",
            ),
          );
      }
      parseTimeZoneHour() {
        if (isDigit(this.char)) {
          this.consume();
          if (/\d\d$/.test(this.state.buf)) return this.next(this.parseTimeZoneSep);
        } else throw this.error(new TomlError("Unexpected character in datetime, expected digit"));
      }
      parseTimeZoneSep() {
        if (this.char === CHAR_COLON) {
          this.consume();
          this.next(this.parseTimeZoneMin);
        } else throw this.error(new TomlError("Unexpected character in datetime, expected colon"));
      }
      parseTimeZoneMin() {
        if (isDigit(this.char)) {
          this.consume();
          if (/\d\d$/.test(this.state.buf))
            return this.return(createDateTime(this.state.result + this.state.buf));
        } else throw this.error(new TomlError("Unexpected character in datetime, expected digit"));
      }
      parseBoolean() {
        /* istanbul ignore else */
        if (this.char === CHAR_t) {
          this.consume();
          return this.next(this.parseTrue_r);
        } else if (this.char === CHAR_f) {
          this.consume();
          return this.next(this.parseFalse_a);
        }
      }
      parseTrue_r() {
        if (this.char === CHAR_r) {
          this.consume();
          return this.next(this.parseTrue_u);
        } else throw this.error(new TomlError("Invalid boolean, expected true or false"));
      }
      parseTrue_u() {
        if (this.char === CHAR_u) {
          this.consume();
          return this.next(this.parseTrue_e);
        } else throw this.error(new TomlError("Invalid boolean, expected true or false"));
      }
      parseTrue_e() {
        if (this.char === CHAR_e) return this.return(true);
        else throw this.error(new TomlError("Invalid boolean, expected true or false"));
      }
      parseFalse_a() {
        if (this.char === CHAR_a) {
          this.consume();
          return this.next(this.parseFalse_l);
        } else throw this.error(new TomlError("Invalid boolean, expected true or false"));
      }
      parseFalse_l() {
        if (this.char === CHAR_l) {
          this.consume();
          return this.next(this.parseFalse_s);
        } else throw this.error(new TomlError("Invalid boolean, expected true or false"));
      }
      parseFalse_s() {
        if (this.char === CHAR_s) {
          this.consume();
          return this.next(this.parseFalse_e);
        } else throw this.error(new TomlError("Invalid boolean, expected true or false"));
      }
      parseFalse_e() {
        if (this.char === CHAR_e) return this.return(false);
        else throw this.error(new TomlError("Invalid boolean, expected true or false"));
      }
      parseInlineList() {
        if (
          this.char === CHAR_SP ||
          this.char === CTRL_I ||
          this.char === CTRL_M ||
          this.char === CTRL_J
        )
          return null;
        else if (this.char === Parser.END)
          throw this.error(new TomlError("Unterminated inline array"));
        else if (this.char === CHAR_NUM) return this.call(this.parseComment);
        else if (this.char === CHAR_RSQB) return this.return(this.state.resultArr || InlineList());
        else return this.callNow(this.parseValue, this.recordInlineListValue);
      }
      recordInlineListValue(value) {
        if (this.state.resultArr) {
          const listType = this.state.resultArr[_contentType];
          const valueType = tomlType(value);
          if (listType !== valueType)
            throw this.error(
              new TomlError(
                `Inline lists must be a single type, not a mix of ${listType} and ${valueType}`,
              ),
            );
        } else this.state.resultArr = InlineList(tomlType(value));
        if (isFloat(value) || isInteger(value)) this.state.resultArr.push(value.valueOf());
        else this.state.resultArr.push(value);
        return this.goto(this.parseInlineListNext);
      }
      parseInlineListNext() {
        if (
          this.char === CHAR_SP ||
          this.char === CTRL_I ||
          this.char === CTRL_M ||
          this.char === CTRL_J
        )
          return null;
        else if (this.char === CHAR_NUM) return this.call(this.parseComment);
        else if (this.char === CHAR_COMMA) return this.next(this.parseInlineList);
        else if (this.char === CHAR_RSQB) return this.goto(this.parseInlineList);
        else
          throw this.error(
            new TomlError("Invalid character, expected whitespace, comma (,) or close bracket (])"),
          );
      }
      parseInlineTable() {
        if (this.char === CHAR_SP || this.char === CTRL_I) return null;
        else if (
          this.char === Parser.END ||
          this.char === CHAR_NUM ||
          this.char === CTRL_J ||
          this.char === CTRL_M
        )
          throw this.error(new TomlError("Unterminated inline array"));
        else if (this.char === CHAR_RCUB)
          return this.return(this.state.resultTable || InlineTable());
        else {
          if (!this.state.resultTable) this.state.resultTable = InlineTable();
          return this.callNow(this.parseAssign, this.recordInlineTableValue);
        }
      }
      recordInlineTableValue(kv) {
        let target = this.state.resultTable;
        let finalKey = kv.key.pop();
        for (let kw of kv.key) {
          if (hasKey(target, kw) && (!isTable(target[kw]) || target[kw][_declared]))
            throw this.error(new TomlError("Can't redefine existing key"));
          target = target[kw] = target[kw] || Table();
        }
        if (hasKey(target, finalKey))
          throw this.error(new TomlError("Can't redefine existing key"));
        if (isInteger(kv.value) || isFloat(kv.value)) target[finalKey] = kv.value.valueOf();
        else target[finalKey] = kv.value;
        return this.goto(this.parseInlineTableNext);
      }
      parseInlineTableNext() {
        if (this.char === CHAR_SP || this.char === CTRL_I) return null;
        else if (
          this.char === Parser.END ||
          this.char === CHAR_NUM ||
          this.char === CTRL_J ||
          this.char === CTRL_M
        )
          throw this.error(new TomlError("Unterminated inline array"));
        else if (this.char === CHAR_COMMA) return this.next(this.parseInlineTable);
        else if (this.char === CHAR_RCUB) return this.goto(this.parseInlineTable);
        else
          throw this.error(
            new TomlError("Invalid character, expected whitespace, comma (,) or close bracket (])"),
          );
      }
    }
    return TOMLParser;
  }
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/parse-pretty-error.js
var require_parse_pretty_error = /* @__PURE__ */ __commonJSMin((exports, module) => {
  module.exports = prettyError;
  function prettyError(err, buf) {
    /* istanbul ignore if */
    if (err.pos == null || err.line == null) return err;
    let msg = err.message;
    msg += ` at row ${err.line + 1}, col ${err.col + 1}, pos ${err.pos}:\n`;
    /* istanbul ignore else */
    if (buf && buf.split) {
      const lines = buf.split(/\n/);
      const lineNumWidth = String(Math.min(lines.length, err.line + 3)).length;
      let linePadding = " ";
      while (linePadding.length < lineNumWidth) linePadding += " ";
      for (let ii = Math.max(0, err.line - 1); ii < Math.min(lines.length, err.line + 2); ++ii) {
        let lineNum = String(ii + 1);
        if (lineNum.length < lineNumWidth) lineNum = " " + lineNum;
        if (err.line === ii) {
          msg += lineNum + "> " + lines[ii] + "\n";
          msg += linePadding + "  ";
          for (let hh = 0; hh < err.col; ++hh) msg += " ";
          msg += "^\n";
        } else msg += lineNum + ": " + lines[ii] + "\n";
      }
    }
    err.message = msg + "\n";
    return err;
  }
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/parse-string.js
var require_parse_string = /* @__PURE__ */ __commonJSMin((exports, module) => {
  module.exports = parseString;
  const TOMLParser = require_toml_parser();
  const prettyError = require_parse_pretty_error();
  function parseString(str) {
    if (global.Buffer && global.Buffer.isBuffer(str)) str = str.toString("utf8");
    const parser = new TOMLParser();
    try {
      parser.parse(str);
      return parser.finish();
    } catch (err) {
      throw prettyError(err, str);
    }
  }
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/parse-async.js
var require_parse_async = /* @__PURE__ */ __commonJSMin((exports, module) => {
  module.exports = parseAsync;
  const TOMLParser = require_toml_parser();
  const prettyError = require_parse_pretty_error();
  function parseAsync(str, opts) {
    if (!opts) opts = {};
    const index = 0;
    const blocksize = opts.blocksize || 40960;
    const parser = new TOMLParser();
    return new Promise((resolve, reject) => {
      setImmediate(parseAsyncNext, index, blocksize, resolve, reject);
    });
    function parseAsyncNext(index, blocksize, resolve, reject) {
      if (index >= str.length)
        try {
          return resolve(parser.finish());
        } catch (err) {
          return reject(prettyError(err, str));
        }
      try {
        parser.parse(str.slice(index, index + blocksize));
        setImmediate(parseAsyncNext, index + blocksize, blocksize, resolve, reject);
      } catch (err) {
        reject(prettyError(err, str));
      }
    }
  }
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/parse-stream.js
var require_parse_stream = /* @__PURE__ */ __commonJSMin((exports, module) => {
  module.exports = parseStream;
  const stream = __require("stream");
  const TOMLParser = require_toml_parser();
  function parseStream(stm) {
    if (stm) return parseReadable(stm);
    else return parseTransform(stm);
  }
  function parseReadable(stm) {
    const parser = new TOMLParser();
    stm.setEncoding("utf8");
    return new Promise((resolve, reject) => {
      let readable;
      let ended = false;
      let errored = false;
      function finish() {
        ended = true;
        if (readable) return;
        try {
          resolve(parser.finish());
        } catch (err) {
          reject(err);
        }
      }
      function error(err) {
        errored = true;
        reject(err);
      }
      stm.once("end", finish);
      stm.once("error", error);
      readNext();
      function readNext() {
        readable = true;
        let data;
        while ((data = stm.read()) !== null)
          try {
            parser.parse(data);
          } catch (err) {
            return error(err);
          }
        readable = false;
        /* istanbul ignore if */
        if (ended) return finish();
        /* istanbul ignore if */
        if (errored) return;
        stm.once("readable", readNext);
      }
    });
  }
  function parseTransform() {
    const parser = new TOMLParser();
    return new stream.Transform({
      objectMode: true,
      transform(chunk, encoding, cb) {
        try {
          parser.parse(chunk.toString(encoding));
        } catch (err) {
          this.emit("error", err);
        }
        cb();
      },
      flush(cb) {
        try {
          this.push(parser.finish());
        } catch (err) {
          this.emit("error", err);
        }
        cb();
      },
    });
  }
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/parse.js
var require_parse = /* @__PURE__ */ __commonJSMin((exports, module) => {
  module.exports = require_parse_string();
  module.exports.async = require_parse_async();
  module.exports.stream = require_parse_stream();
  module.exports.prettyError = require_parse_pretty_error();
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/stringify.js
var require_stringify = /* @__PURE__ */ __commonJSMin((exports, module) => {
  module.exports = stringify;
  module.exports.value = stringifyInline;
  function stringify(obj) {
    if (obj === null) throw typeError("null");
    if (obj === void 0) throw typeError("undefined");
    if (typeof obj !== "object") throw typeError(typeof obj);
    if (typeof obj.toJSON === "function") obj = obj.toJSON();
    if (obj == null) return null;
    const type = tomlType(obj);
    if (type !== "table") throw typeError(type);
    return stringifyObject("", "", obj);
  }
  function typeError(type) {
    return /* @__PURE__ */ new Error("Can only stringify objects, not " + type);
  }
  function arrayOneTypeError() {
    return /* @__PURE__ */ new Error("Array values can't have mixed types");
  }
  function getInlineKeys(obj) {
    return Object.keys(obj).filter((key) => isInline(obj[key]));
  }
  function getComplexKeys(obj) {
    return Object.keys(obj).filter((key) => !isInline(obj[key]));
  }
  function toJSON(obj) {
    let nobj = Array.isArray(obj)
      ? []
      : Object.prototype.hasOwnProperty.call(obj, "__proto__")
        ? { ["__proto__"]: void 0 }
        : {};
    for (let prop of Object.keys(obj))
      if (obj[prop] && typeof obj[prop].toJSON === "function" && !("toISOString" in obj[prop]))
        nobj[prop] = obj[prop].toJSON();
      else nobj[prop] = obj[prop];
    return nobj;
  }
  function stringifyObject(prefix, indent, obj) {
    obj = toJSON(obj);
    var inlineKeys;
    var complexKeys;
    inlineKeys = getInlineKeys(obj);
    complexKeys = getComplexKeys(obj);
    var result = [];
    var inlineIndent = indent || "";
    inlineKeys.forEach((key) => {
      var type = tomlType(obj[key]);
      if (type !== "undefined" && type !== "null")
        result.push(inlineIndent + stringifyKey(key) + " = " + stringifyAnyInline(obj[key], true));
    });
    if (result.length > 0) result.push("");
    var complexIndent = prefix && inlineKeys.length > 0 ? indent + "  " : "";
    complexKeys.forEach((key) => {
      result.push(stringifyComplex(prefix, complexIndent, key, obj[key]));
    });
    return result.join("\n");
  }
  function isInline(value) {
    switch (tomlType(value)) {
      case "undefined":
      case "null":
      case "integer":
      case "nan":
      case "float":
      case "boolean":
      case "string":
      case "datetime":
        return true;
      case "array":
        return value.length === 0 || tomlType(value[0]) !== "table";
      case "table":
        return Object.keys(value).length === 0;
      /* istanbul ignore next */
      default:
        return false;
    }
  }
  function tomlType(value) {
    if (value === void 0) return "undefined";
    else if (value === null) return "null";
    else if (typeof value === "bigint" || (Number.isInteger(value) && !Object.is(value, -0)))
      return "integer";
    else if (typeof value === "number") return "float";
    else if (typeof value === "boolean") return "boolean";
    else if (typeof value === "string") return "string";
    else if ("toISOString" in value) return isNaN(value) ? "undefined" : "datetime";
    else if (Array.isArray(value)) return "array";
    else return "table";
  }
  function stringifyKey(key) {
    var keyStr = String(key);
    if (/^[-A-Za-z0-9_]+$/.test(keyStr)) return keyStr;
    else return stringifyBasicString(keyStr);
  }
  function stringifyBasicString(str) {
    return '"' + escapeString(str).replace(/"/g, '\\"') + '"';
  }
  function stringifyLiteralString(str) {
    return "'" + str + "'";
  }
  function numpad(num, str) {
    while (str.length < num) str = "0" + str;
    return str;
  }
  function escapeString(str) {
    return str
      .replace(/\\/g, "\\\\")
      .replace(/[\b]/g, "\\b")
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\f/g, "\\f")
      .replace(/\r/g, "\\r")
      .replace(/([\u0000-\u001f\u007f])/, (c) => "\\u" + numpad(4, c.codePointAt(0).toString(16)));
  }
  function stringifyMultilineString(str) {
    let escaped = str
      .split(/\n/)
      .map((str) => {
        return escapeString(str).replace(/"(?="")/g, '\\"');
      })
      .join("\n");
    if (escaped.slice(-1) === '"') escaped += "\\\n";
    return '"""\n' + escaped + '"""';
  }
  function stringifyAnyInline(value, multilineOk) {
    let type = tomlType(value);
    if (type === "string") {
      if (multilineOk && /\n/.test(value)) type = "string-multiline";
      else if (!/[\b\t\n\f\r']/.test(value) && /"/.test(value)) type = "string-literal";
    }
    return stringifyInline(value, type);
  }
  function stringifyInline(value, type) {
    /* istanbul ignore if */
    if (!type) type = tomlType(value);
    switch (type) {
      case "string-multiline":
        return stringifyMultilineString(value);
      case "string":
        return stringifyBasicString(value);
      case "string-literal":
        return stringifyLiteralString(value);
      case "integer":
        return stringifyInteger(value);
      case "float":
        return stringifyFloat(value);
      case "boolean":
        return stringifyBoolean(value);
      case "datetime":
        return stringifyDatetime(value);
      case "array":
        return stringifyInlineArray(
          value.filter(
            (_) => tomlType(_) !== "null" && tomlType(_) !== "undefined" && tomlType(_) !== "nan",
          ),
        );
      case "table":
        return stringifyInlineTable(value);
      /* istanbul ignore next */
      default:
        throw typeError(type);
    }
  }
  function stringifyInteger(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, "_");
  }
  function stringifyFloat(value) {
    if (value === Infinity) return "inf";
    else if (value === -Infinity) return "-inf";
    else if (Object.is(value, NaN)) return "nan";
    else if (Object.is(value, -0)) return "-0.0";
    var chunks = String(value).split(".");
    var int = chunks[0];
    var dec = chunks[1] || 0;
    return stringifyInteger(int) + "." + dec;
  }
  function stringifyBoolean(value) {
    return String(value);
  }
  function stringifyDatetime(value) {
    return value.toISOString();
  }
  function isNumber(type) {
    return type === "float" || type === "integer";
  }
  function arrayType(values) {
    var contentType = tomlType(values[0]);
    if (values.every((_) => tomlType(_) === contentType)) return contentType;
    if (values.every((_) => isNumber(tomlType(_)))) return "float";
    return "mixed";
  }
  function validateArray(values) {
    const type = arrayType(values);
    if (type === "mixed") throw arrayOneTypeError();
    return type;
  }
  function stringifyInlineArray(values) {
    values = toJSON(values);
    const type = validateArray(values);
    var result = "[";
    var stringified = values.map((_) => stringifyInline(_, type));
    if (stringified.join(", ").length > 60 || /\n/.test(stringified))
      result += "\n  " + stringified.join(",\n  ") + "\n";
    else result += " " + stringified.join(", ") + (stringified.length > 0 ? " " : "");
    return result + "]";
  }
  function stringifyInlineTable(value) {
    value = toJSON(value);
    var result = [];
    Object.keys(value).forEach((key) => {
      result.push(stringifyKey(key) + " = " + stringifyAnyInline(value[key], false));
    });
    return "{ " + result.join(", ") + (result.length > 0 ? " " : "") + "}";
  }
  function stringifyComplex(prefix, indent, key, value) {
    var valueType = tomlType(value);
    /* istanbul ignore else */
    if (valueType === "array") return stringifyArrayOfTables(prefix, indent, key, value);
    else if (valueType === "table") return stringifyComplexTable(prefix, indent, key, value);
    else throw typeError(valueType);
  }
  function stringifyArrayOfTables(prefix, indent, key, values) {
    values = toJSON(values);
    validateArray(values);
    var firstValueType = tomlType(values[0]);
    /* istanbul ignore if */
    if (firstValueType !== "table") throw typeError(firstValueType);
    var fullKey = prefix + stringifyKey(key);
    var result = "";
    values.forEach((table) => {
      if (result.length > 0) result += "\n";
      result += indent + "[[" + fullKey + "]]\n";
      result += stringifyObject(fullKey + ".", indent, table);
    });
    return result;
  }
  function stringifyComplexTable(prefix, indent, key, value) {
    var fullKey = prefix + stringifyKey(key);
    var result = "";
    if (getInlineKeys(value).length > 0) result += indent + "[" + fullKey + "]\n";
    return result + stringifyObject(fullKey + ".", indent, value);
  }
});
//#endregion
//#region ../../node_modules/.pnpm/@iarna+toml@2.2.5/node_modules/@iarna/toml/toml.js
var require_toml = /* @__PURE__ */ __commonJSMin((exports) => {
  exports.parse = require_parse();
  exports.stringify = require_stringify();
});
//#endregion
//#region ../../node_modules/.pnpm/agent-install@0.0.5/node_modules/agent-install/dist/mcp-D24Z3PhI.js
var import_main = require_main();
var import_toml = /* @__PURE__ */ __toESM(require_toml(), 1);
const transformCodexServerConfig = (config) => {
  if (config.url) {
    const remoteConfig = {
      type: config.type || "http",
      url: config.url,
    };
    if (config.headers && Object.keys(config.headers).length > 0)
      remoteConfig.headers = config.headers;
    return remoteConfig;
  }
  const stdioConfig = {
    command: config.command,
    args: config.args || [],
  };
  if (config.env && Object.keys(config.env).length > 0) stdioConfig.env = config.env;
  return stdioConfig;
};
const DEFAULT_REMOTE_TRANSPORT = "http";
const MCP_DEFAULT_SERVER_NAME = "mcp-server";
const GENERIC_HOST_PREFIXES = new Set(["mcp", "api", "app", "www", "server", "servers", "remote"]);
const COMMON_TLD_LABELS = new Set([
  "com",
  "org",
  "net",
  "io",
  "dev",
  "ai",
  "tech",
  "co",
  "app",
  "cloud",
  "sh",
  "run",
]);
const PACKAGE_NAME_PREFIX_STRIP = ["mcp-server-", "server-"];
const PACKAGE_NAME_SUFFIX_STRIP = ["-mcp-server", "-mcp"];
const KNOWN_COMMAND_RUNNERS = new Set(["npx", "node", "python", "python3", "uvx", "bunx", "deno"]);
const SCRIPT_EXTENSION_REGEX = /\.(?:js|ts|mjs|cjs|py|sh|rb|go)$/i;
const transformGooseServerConfig = (serverName, config) => {
  if (config.url)
    return {
      name: serverName,
      description: "",
      type: config.type === "sse" ? "sse" : "streamable_http",
      uri: config.url,
      headers: config.headers || {},
      enabled: true,
      timeout: 300,
    };
  return {
    name: serverName,
    description: "",
    cmd: config.command,
    args: config.args || [],
    enabled: true,
    envs: config.env || {},
    type: "stdio",
    timeout: 300,
  };
};
const transformOpenCodeServerConfig = (config) => {
  if (config.url)
    return {
      type: "remote",
      url: config.url,
      enabled: true,
      headers: config.headers,
    };
  return {
    type: "local",
    command: [config.command, ...(config.args || [])],
    enabled: true,
    environment: config.env || {},
  };
};
const transformVscodeServerConfig = (config) => {
  if (config.url) {
    const remote = {
      type: config.type || "http",
      url: config.url,
    };
    if (config.headers && Object.keys(config.headers).length > 0) remote.headers = config.headers;
    return remote;
  }
  const stdio = {
    type: "stdio",
    command: config.command,
    args: config.args || [],
  };
  if (config.env && Object.keys(config.env).length > 0) stdio.env = config.env;
  return stdio;
};
const transformZedServerConfig = (config) => {
  if (config.url)
    return {
      source: "custom",
      type: config.type || "http",
      url: config.url,
      headers: config.headers || {},
    };
  return {
    source: "custom",
    command: config.command,
    args: config.args || [],
    env: config.env || {},
  };
};
const home = homedir();
const getPlatformPaths = () => {
  const currentPlatform = platform();
  if (currentPlatform === "win32") {
    const appData = process.env.APPDATA || join(home, "AppData", "Roaming");
    return {
      appSupport: appData,
      vscodePath: join(appData, "Code", "User"),
      gooseConfigPath: join(appData, "Block", "goose", "config", "config.yaml"),
    };
  }
  if (currentPlatform === "darwin")
    return {
      appSupport: join(home, "Library", "Application Support"),
      vscodePath: join(home, "Library", "Application Support", "Code", "User"),
      gooseConfigPath: join(home, ".config", "goose", "config.yaml"),
    };
  const configDir = process.env.XDG_CONFIG_HOME || join(home, ".config");
  return {
    appSupport: configDir,
    vscodePath: join(configDir, "Code", "User"),
    gooseConfigPath: join(configDir, "goose", "config.yaml"),
  };
};
const { appSupport, vscodePath, gooseConfigPath } = getPlatformPaths();
const antigravityConfigPath = join(home, ".gemini", "antigravity", "mcp_config.json");
const clineCliConfigPath = join(
  process.env.CLINE_DIR || join(home, ".cline"),
  "data",
  "settings",
  "cline_mcp_settings.json",
);
const clineExtensionConfigPath = join(
  vscodePath,
  "globalStorage",
  "saoudrizwan.claude-dev",
  "settings",
  "cline_mcp_settings.json",
);
const copilotConfigPath = join(home, ".copilot", "mcp-config.json");
const UNSUPPORTED_STDIO_MESSAGE =
  "This agent supports only remote MCP servers (HTTP/SSE). Stdio commands are not supported.";
const ALL_TRANSPORTS = ["stdio", "http", "sse"];
const mcpAgents = {
  antigravity: {
    name: "antigravity",
    displayName: "Antigravity",
    globalConfigPath: antigravityConfigPath,
    configKey: "mcpServers",
    format: "jsonc",
    supportedTransports: ALL_TRANSPORTS,
    detectGlobalInstall: () => existsSync(join(home, ".gemini", "antigravity")),
  },
  cline: {
    name: "cline",
    displayName: "Cline (VSCode extension)",
    globalConfigPath: clineExtensionConfigPath,
    configKey: "mcpServers",
    format: "jsonc",
    supportedTransports: ALL_TRANSPORTS,
    detectGlobalInstall: () => existsSync(clineExtensionConfigPath),
  },
  "cline-cli": {
    name: "cline-cli",
    displayName: "Cline CLI",
    globalConfigPath: clineCliConfigPath,
    configKey: "mcpServers",
    format: "jsonc",
    supportedTransports: ALL_TRANSPORTS,
    detectGlobalInstall: () => existsSync(join(home, ".cline")),
  },
  "claude-code": {
    name: "claude-code",
    displayName: "Claude Code",
    globalConfigPath: join(home, ".claude.json"),
    projectConfigPath: ".mcp.json",
    configKey: "mcpServers",
    format: "jsonc",
    supportedTransports: ALL_TRANSPORTS,
    detectGlobalInstall: () => existsSync(join(home, ".claude.json")),
    detectProjectInstall: (cwd) => existsSync(join(cwd, ".mcp.json")),
  },
  "claude-desktop": {
    name: "claude-desktop",
    displayName: "Claude Desktop",
    globalConfigPath: join(appSupport, "Claude", "claude_desktop_config.json"),
    configKey: "mcpServers",
    format: "jsonc",
    supportedTransports: ["stdio"],
    unsupportedTransportMessage:
      "Claude Desktop currently supports only stdio MCP servers. Use a package name or command instead of a URL.",
    detectGlobalInstall: () => existsSync(join(appSupport, "Claude", "claude_desktop_config.json")),
  },
  codex: {
    name: "codex",
    displayName: "Codex",
    globalConfigPath: join(process.env.CODEX_HOME?.trim() || join(home, ".codex"), "config.toml"),
    projectConfigPath: ".codex/config.toml",
    configKey: "mcp_servers",
    format: "toml",
    supportedTransports: ALL_TRANSPORTS,
    detectGlobalInstall: () => existsSync(process.env.CODEX_HOME?.trim() || join(home, ".codex")),
    detectProjectInstall: (cwd) => existsSync(join(cwd, ".codex", "config.toml")),
    transformConfig: (_name, config) => transformCodexServerConfig(config),
  },
  cursor: {
    name: "cursor",
    displayName: "Cursor",
    globalConfigPath: join(home, ".cursor", "mcp.json"),
    projectConfigPath: ".cursor/mcp.json",
    configKey: "mcpServers",
    format: "jsonc",
    supportedTransports: ALL_TRANSPORTS,
    detectGlobalInstall: () => existsSync(join(home, ".cursor")),
    detectProjectInstall: (cwd) => existsSync(join(cwd, ".cursor", "mcp.json")),
  },
  "gemini-cli": {
    name: "gemini-cli",
    displayName: "Gemini CLI",
    globalConfigPath: join(home, ".gemini", "settings.json"),
    projectConfigPath: ".gemini/settings.json",
    configKey: "mcpServers",
    format: "jsonc",
    supportedTransports: ALL_TRANSPORTS,
    detectGlobalInstall: () => existsSync(join(home, ".gemini")),
    detectProjectInstall: (cwd) => existsSync(join(cwd, ".gemini", "settings.json")),
  },
  goose: {
    name: "goose",
    displayName: "Goose",
    globalConfigPath: gooseConfigPath,
    projectConfigPath: ".goose/config.yaml",
    configKey: "extensions",
    format: "yaml",
    supportedTransports: ALL_TRANSPORTS,
    detectGlobalInstall: () => existsSync(gooseConfigPath),
    detectProjectInstall: (cwd) => existsSync(join(cwd, ".goose", "config.yaml")),
    transformConfig: (name, config) => transformGooseServerConfig(name, config),
  },
  "github-copilot-cli": {
    name: "github-copilot-cli",
    displayName: "GitHub Copilot CLI",
    globalConfigPath: copilotConfigPath,
    projectConfigPath: ".vscode/mcp.json",
    configKey: "mcpServers",
    projectConfigKey: "servers",
    format: "jsonc",
    supportedTransports: ALL_TRANSPORTS,
    detectGlobalInstall: () => existsSync(copilotConfigPath),
    detectProjectInstall: (cwd) => existsSync(join(cwd, ".vscode", "mcp.json")),
    transformConfig: (_name, config, context) =>
      context.global ? config : transformVscodeServerConfig(config),
  },
  mcporter: {
    name: "mcporter",
    displayName: "MCPorter",
    globalConfigPath: join(home, ".mcporter", "mcporter.json"),
    projectConfigPath: "config/mcporter.json",
    configKey: "mcpServers",
    format: "jsonc",
    supportedTransports: ALL_TRANSPORTS,
    detectGlobalInstall: () => existsSync(join(home, ".mcporter")),
    detectProjectInstall: (cwd) => existsSync(join(cwd, "config", "mcporter.json")),
  },
  opencode: {
    name: "opencode",
    displayName: "OpenCode",
    globalConfigPath: join(
      process.env.XDG_CONFIG_HOME || join(home, ".config"),
      "opencode",
      "opencode.json",
    ),
    projectConfigPath: "opencode.json",
    configKey: "mcp",
    format: "jsonc",
    supportedTransports: ALL_TRANSPORTS,
    detectGlobalInstall: () =>
      existsSync(join(process.env.XDG_CONFIG_HOME || join(home, ".config"), "opencode")),
    detectProjectInstall: (cwd) => existsSync(join(cwd, "opencode.json")),
    transformConfig: (_name, config) => transformOpenCodeServerConfig(config),
  },
  vscode: {
    name: "vscode",
    displayName: "VS Code",
    globalConfigPath: join(vscodePath, "mcp.json"),
    projectConfigPath: ".vscode/mcp.json",
    configKey: "servers",
    format: "jsonc",
    supportedTransports: ALL_TRANSPORTS,
    detectGlobalInstall: () => existsSync(join(vscodePath, "mcp.json")),
    detectProjectInstall: (cwd) => existsSync(join(cwd, ".vscode", "mcp.json")),
    transformConfig: (_name, config) => transformVscodeServerConfig(config),
  },
  zed: {
    name: "zed",
    displayName: "Zed",
    globalConfigPath: join(appSupport, "Zed", "settings.json"),
    projectConfigPath: ".zed/settings.json",
    configKey: "context_servers",
    format: "jsonc",
    supportedTransports: ALL_TRANSPORTS,
    unsupportedTransportMessage: UNSUPPORTED_STDIO_MESSAGE,
    detectGlobalInstall: () => existsSync(join(appSupport, "Zed")),
    detectProjectInstall: (cwd) => existsSync(join(cwd, ".zed", "settings.json")),
    transformConfig: (_name, config) => transformZedServerConfig(config),
  },
};
const mcpAgentAliases = {
  "cline-vscode": "cline",
  gemini: "gemini-cli",
  "github-copilot": "vscode",
};
const getMcpAgentConfig = (agentType) => mcpAgents[agentType];
const getMcpAgentTypes = () => Object.values(mcpAgents).map((config) => config.name);
const isMcpAgentType = (value) => value in mcpAgents;
const resolveMcpAgentAlias = (input) => {
  if (isMcpAgentType(input)) return input;
  return mcpAgentAliases[input] ?? null;
};
const isMcpTransportSupported = (agent, transport) => agent.supportedTransports.includes(transport);
const detectProjectInstalledMcpAgents = (cwd) =>
  getMcpAgentTypes().filter((type) =>
    mcpAgents[type].detectProjectInstall ? mcpAgents[type].detectProjectInstall(cwd) : false,
  );
const detectGloballyInstalledMcpAgents = () =>
  getMcpAgentTypes().filter((type) => mcpAgents[type].detectGlobalInstall());
const getMcpAgentsSupportingProjectScope = () =>
  getMcpAgentTypes().filter((type) => Boolean(mcpAgents[type].projectConfigPath));
const buildMcpServerConfig = (parsed, options = {}) => {
  if (parsed.type === "remote") {
    const config = {
      type: options.transport ?? "http",
      url: parsed.value,
    };
    if (options.headers && Object.keys(options.headers).length > 0)
      config.headers = options.headers;
    return config;
  }
  if (parsed.type === "command") {
    const parts = parsed.value.split(/\s+/);
    const config = {
      command: parts[0] ?? "",
      args: parts.slice(1),
    };
    if (options.env && Object.keys(options.env).length > 0) config.env = options.env;
    return config;
  }
  const config = {
    command: "npx",
    args: ["-y", parsed.value],
  };
  if (options.env && Object.keys(options.env).length > 0) config.env = options.env;
  return config;
};
const getNestedValue = (source, dottedKey) => {
  if (!source) return void 0;
  const segments = dottedKey.split(".");
  let cursor = source;
  for (const segment of segments) {
    if (!isPlainObject(cursor)) return void 0;
    cursor = cursor[segment];
  }
  return cursor;
};
const ensureParentDir$1 = (filePath) => {
  const parentDir = dirname(filePath);
  if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
};
const DANGEROUS_KEY_SEGMENTS$1 = new Set(["__proto__", "prototype", "constructor"]);
const assertSafeSegment = (segment) => {
  if (DANGEROUS_KEY_SEGMENTS$1.has(segment))
    throw new Error(`Refusing to write to unsafe key segment "${segment}"`);
};
const setNestedValue = (target, dottedKey, value) => {
  const segments = dottedKey.split(".");
  let cursor = target;
  for (let segmentIndex = 0; segmentIndex < segments.length - 1; segmentIndex += 1) {
    const segment = segments[segmentIndex];
    assertSafeSegment(segment);
    const existing = cursor[segment];
    if (isPlainObject(existing)) {
      cursor = existing;
      continue;
    }
    const next = {};
    cursor[segment] = next;
    cursor = next;
  }
  const finalSegment = segments[segments.length - 1];
  assertSafeSegment(finalSegment);
  cursor[finalSegment] = value;
};
const walkNestedObject = (root, segments) => {
  let cursor = root;
  for (const segment of segments) {
    if (!isPlainObject(cursor)) return void 0;
    cursor = cursor[segment];
  }
  return isPlainObject(cursor) ? cursor : void 0;
};
const JSONC_FORMATTING = {
  insertSpaces: true,
  tabSize: 2,
  eol: "\n",
};
const readFileOrEmpty = (filePath) => (existsSync(filePath) ? readFileSync(filePath, "utf-8") : "");
const writeWithTrailingNewline = (filePath, contents) => {
  writeFileSync(filePath, contents.endsWith("\n") ? contents : `${contents}\n`, "utf-8");
};
const readJsoncConfig = (filePath) => {
  const raw = readFileOrEmpty(filePath);
  if (!raw.trim()) return {};
  const parsed = (0, import_main.parse)(raw);
  return isPlainObject(parsed) ? parsed : {};
};
const setJsoncNestedValue = (filePath, dottedKey, serverName, serverConfig) => {
  ensureParentDir$1(filePath);
  const existingText = readFileOrEmpty(filePath);
  const sourceText = existingText.trim() ? existingText : "{}";
  writeWithTrailingNewline(
    filePath,
    (0, import_main.applyEdits)(
      sourceText,
      (0, import_main.modify)(sourceText, [...dottedKey.split("."), serverName], serverConfig, {
        formattingOptions: JSONC_FORMATTING,
      }),
    ),
  );
};
const writeJsonConfigAtKey = (filePath, dottedKey, serverName, serverConfig) => {
  ensureParentDir$1(filePath);
  const existing = readJsoncConfig(filePath);
  const existingServers = walkNestedObject(existing, dottedKey.split("."));
  const servers = existingServers ? { ...existingServers } : {};
  servers[serverName] = serverConfig;
  setNestedValue(existing, dottedKey, servers);
  writeFileSync(filePath, `${JSON.stringify(existing, null, 2)}\n`, "utf-8");
};
const removeJsoncConfigKey = (filePath, dottedKey, serverName) => {
  if (!existsSync(filePath)) return false;
  const sourceText = readFileSync(filePath, "utf-8");
  if (!sourceText.trim()) return false;
  const existing = readJsoncConfig(filePath);
  const segments = dottedKey.split(".");
  const parentObject = walkNestedObject(existing, segments);
  if (!parentObject || !(serverName in parentObject)) return false;
  const edits = (0, import_main.modify)(sourceText, [...segments, serverName], void 0, {
    formattingOptions: JSONC_FORMATTING,
  });
  if (edits.length === 0) return false;
  writeWithTrailingNewline(filePath, (0, import_main.applyEdits)(sourceText, edits));
  return true;
};
const DANGEROUS_KEY_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);
const deleteNestedValue = (target, dottedKey) => {
  if (!target) return false;
  const segments = dottedKey.split(".");
  if (segments.some((segment) => DANGEROUS_KEY_SEGMENTS.has(segment))) return false;
  let cursor = target;
  for (let segmentIndex = 0; segmentIndex < segments.length - 1; segmentIndex += 1) {
    const segment = segments[segmentIndex];
    const existing = cursor[segment];
    if (!isPlainObject(existing)) return false;
    cursor = existing;
  }
  const lastSegment = segments[segments.length - 1];
  if (!(lastSegment in cursor)) return false;
  delete cursor[lastSegment];
  return true;
};
const toTomlJsonMap = (value) => JSON.parse(JSON.stringify(value));
const readTomlConfig = (filePath) => {
  if (!existsSync(filePath)) return {};
  const raw = readFileSync(filePath, "utf-8");
  if (!raw.trim()) return {};
  const parsed = import_toml.parse(raw);
  return isPlainObject(parsed) ? parsed : {};
};
const writeTomlConfigAtKey = (filePath, dottedKey, serverName, serverConfig) => {
  ensureParentDir$1(filePath);
  const existing = readTomlConfig(filePath);
  const existingServers = walkNestedObject(existing, dottedKey.split("."));
  const servers = existingServers ? { ...existingServers } : {};
  servers[serverName] = serverConfig;
  setNestedValue(existing, dottedKey, servers);
  writeFileSync(filePath, import_toml.stringify(toTomlJsonMap(existing)), "utf-8");
};
const removeTomlConfigKey = (filePath, dottedKey, serverName) => {
  if (!existsSync(filePath)) return false;
  const existing = readTomlConfig(filePath);
  const didRemove = deleteNestedValue(existing, `${dottedKey}.${serverName}`);
  if (didRemove) writeFileSync(filePath, import_toml.stringify(toTomlJsonMap(existing)), "utf-8");
  return didRemove;
};
const readYamlConfig = (filePath) => {
  if (!existsSync(filePath)) return {};
  const raw = readFileSync(filePath, "utf-8");
  if (!raw.trim()) return {};
  const parsed = (0, import_dist.parse)(raw);
  return isPlainObject(parsed) ? parsed : {};
};
const writeYamlConfigAtKey = (filePath, dottedKey, serverName, serverConfig) => {
  ensureParentDir$1(filePath);
  const existing = readYamlConfig(filePath);
  const existingServers = walkNestedObject(existing, dottedKey.split("."));
  const servers = existingServers ? { ...existingServers } : {};
  servers[serverName] = serverConfig;
  setNestedValue(existing, dottedKey, servers);
  writeFileSync(filePath, (0, import_dist.stringify)(existing), "utf-8");
};
const removeYamlConfigKey = (filePath, dottedKey, serverName) => {
  if (!existsSync(filePath)) return false;
  const existing = readYamlConfig(filePath);
  const didRemove = deleteNestedValue(existing, `${dottedKey}.${serverName}`);
  if (didRemove) writeFileSync(filePath, (0, import_dist.stringify)(existing), "utf-8");
  return didRemove;
};
const readConfigFile = (filePath, format) => {
  switch (format) {
    case "json":
    case "jsonc":
      return readJsoncConfig(filePath);
    case "yaml":
      return readYamlConfig(filePath);
    case "toml":
      return readTomlConfig(filePath);
    default:
      throw new Error(`Unsupported config format: ${format}`);
  }
};
const writeServerToConfigFile = (filePath, format, dottedKey, serverName, serverConfig) => {
  switch (format) {
    case "jsonc":
      setJsoncNestedValue(filePath, dottedKey, serverName, serverConfig);
      return;
    case "json":
      writeJsonConfigAtKey(filePath, dottedKey, serverName, serverConfig);
      return;
    case "yaml":
      writeYamlConfigAtKey(filePath, dottedKey, serverName, serverConfig);
      return;
    case "toml":
      writeTomlConfigAtKey(filePath, dottedKey, serverName, serverConfig);
      return;
    default:
      throw new Error(`Unsupported config format: ${format}`);
  }
};
const removeServerFromConfigFile = (filePath, format, dottedKey, serverName) => {
  switch (format) {
    case "json":
    case "jsonc":
      return removeJsoncConfigKey(filePath, dottedKey, serverName);
    case "yaml":
      return removeYamlConfigKey(filePath, dottedKey, serverName);
    case "toml":
      return removeTomlConfigKey(filePath, dottedKey, serverName);
    default:
      throw new Error(`Unsupported config format: ${format}`);
  }
};
const listServersInConfigFile = (filePath, format, dottedKey) => {
  const entries = getNestedValue(readConfigFile(filePath, format), dottedKey);
  return isPlainObject(entries) ? entries : {};
};
const resolveMcpConfigTarget = (agent, options = {}) => {
  const isGlobal = options.global ?? false;
  const cwd = options.cwd ?? process.cwd();
  return {
    configPath: agent.resolveConfigPath
      ? agent.resolveConfigPath({
          global: isGlobal,
          cwd,
        })
      : !isGlobal && agent.projectConfigPath
        ? join(cwd, agent.projectConfigPath)
        : agent.globalConfigPath,
    configKey: !isGlobal && agent.projectConfigKey ? agent.projectConfigKey : agent.configKey,
  };
};
const installMcpServerForAgent = (serverName, serverConfig, agentType, options = {}) => {
  const agent = getMcpAgentConfig(agentType);
  const { configPath, configKey } = resolveMcpConfigTarget(agent, options);
  const isGlobal = options.global ?? false;
  try {
    const transformed = agent.transformConfig
      ? agent.transformConfig(serverName, serverConfig, { global: isGlobal })
      : serverConfig;
    writeServerToConfigFile(configPath, agent.format, configKey, serverName, transformed);
    return {
      agent: agentType,
      success: true,
      path: configPath,
    };
  } catch (error) {
    return {
      agent: agentType,
      success: false,
      path: configPath,
      error: toErrorMessage(error),
    };
  }
};
const installMcpServerForAgents = (serverName, serverConfig, agentTypes, options = {}) =>
  agentTypes.map((agentType) =>
    installMcpServerForAgent(serverName, serverConfig, agentType, options),
  );
const REMOTE_URL_REGEX = /^https?:\/\//i;
const HAS_WHITESPACE_REGEX = /\s/;
const PACKAGE_NAME_REGEX = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(?:@[^\s]+)?$/;
const PATH_SEPARATOR_REGEX = /[/\\]/;
const stripVersionSuffix = (input) => {
  if (input.startsWith("@")) {
    const secondAtIndex = input.indexOf("@", 1);
    if (secondAtIndex > 0) return input.slice(0, secondAtIndex);
    return input;
  }
  const atIndex = input.lastIndexOf("@");
  if (atIndex > 0) return input.slice(0, atIndex);
  return input;
};
const stripScopePrefix = (input) => {
  if (!input.startsWith("@") || !input.includes("/")) return input;
  return input.split("/")[1] || input;
};
const stripPathPrefix = (input) => {
  if (!PATH_SEPARATOR_REGEX.test(input)) return input;
  const segments = input.split(PATH_SEPARATOR_REGEX);
  return segments[segments.length - 1] || input;
};
const extractPackageName = (input) => {
  let name = stripVersionSuffix(input);
  name = stripScopePrefix(name);
  name = stripPathPrefix(name);
  name = name.replace(SCRIPT_EXTENSION_REGEX, "");
  for (const prefix of PACKAGE_NAME_PREFIX_STRIP)
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length);
      break;
    }
  for (const suffix of PACKAGE_NAME_SUFFIX_STRIP)
    if (name.endsWith(suffix)) {
      name = name.slice(0, -suffix.length);
      break;
    }
  return name || "mcp-server";
};
const inferNameFromUrl = (input) => {
  try {
    const labels = new URL(input).hostname.split(".").filter((segment) => segment.length > 0);
    if (labels.length === 0) return MCP_DEFAULT_SERVER_NAME;
    const meaningfulLabels = labels.filter((label) => {
      const lower = label.toLowerCase();
      if (COMMON_TLD_LABELS.has(lower)) return false;
      if (GENERIC_HOST_PREFIXES.has(lower)) return false;
      return true;
    });
    if (meaningfulLabels.length > 0) return meaningfulLabels[0];
    if (labels.length >= 2) return labels[labels.length - 2];
    return labels[labels.length - 1] || "mcp-server";
  } catch {
    return MCP_DEFAULT_SERVER_NAME;
  }
};
const inferNameFromCommand = (command) => {
  const tokens = command.trim().split(/\s+/);
  const runnerBase = tokens[0]?.split(PATH_SEPARATOR_REGEX).pop() ?? "";
  const startIndex = KNOWN_COMMAND_RUNNERS.has(runnerBase) ? 1 : 0;
  for (let tokenIndex = startIndex; tokenIndex < tokens.length; tokenIndex += 1) {
    const token = tokens[tokenIndex];
    if (!token || token.startsWith("-")) continue;
    return extractPackageName(token);
  }
  const firstNonFlag = tokens.find((token) => !token.startsWith("-"));
  return firstNonFlag ? extractPackageName(firstNonFlag) : MCP_DEFAULT_SERVER_NAME;
};
const parseMcpSource = (input) => {
  const trimmed = input.trim();
  if (trimmed.length === 0)
    throw new Error(
      "Invalid MCP source: input is empty. Expected a remote URL, an npm package, or a command line.",
    );
  if (REMOTE_URL_REGEX.test(trimmed))
    return {
      type: "remote",
      value: trimmed,
      inferredName: inferNameFromUrl(trimmed),
    };
  if (HAS_WHITESPACE_REGEX.test(trimmed))
    return {
      type: "command",
      value: trimmed,
      inferredName: inferNameFromCommand(trimmed),
    };
  if (PACKAGE_NAME_REGEX.test(trimmed))
    return {
      type: "package",
      value: trimmed,
      inferredName: extractPackageName(trimmed),
    };
  return {
    type: "command",
    value: trimmed,
    inferredName: inferNameFromCommand(trimmed),
  };
};
const isRemoteMcpSource = (parsed) => parsed.type === "remote";
const resolveMcpTargetAgents = (requested, isGlobal, cwd) => {
  if (requested && requested.length > 0)
    return {
      agents: requested,
      detected: false,
    };
  return {
    agents: isGlobal ? detectGloballyInstalledMcpAgents() : detectProjectInstalledMcpAgents(cwd),
    detected: true,
  };
};
const installMcpServer = (options) => {
  const parsed = parseMcpSource(options.source);
  const isGlobal = options.global ?? false;
  const cwd = options.cwd ?? process.cwd();
  const serverName = options.name ?? parsed.inferredName;
  const serverConfig = buildMcpServerConfig(parsed, {
    transport: options.transport,
    headers: options.headers,
    env: options.env,
  });
  const requestedTransport = parsed.type === "remote" ? (serverConfig.type ?? "http") : "stdio";
  const { agents: targetAgents } = resolveMcpTargetAgents(options.agents, isGlobal, cwd);
  return {
    serverName,
    config: serverConfig,
    results: targetAgents.map((agentType) => {
      const agent = getMcpAgentConfig(agentType);
      if (!isMcpTransportSupported(agent, requestedTransport))
        return {
          agent: agentType,
          success: false,
          path: "",
          error:
            agent.unsupportedTransportMessage ??
            `${agent.displayName} does not support ${requestedTransport} transport.`,
        };
      return installMcpServerForAgent(serverName, serverConfig, agentType, {
        global: isGlobal,
        cwd,
      });
    }),
  };
};
const listInstalledMcpServers = (options = {}) => {
  const agentTypes = options.agents ?? getMcpAgentTypes();
  const collected = [];
  for (const agentType of agentTypes) {
    const agent = getMcpAgentConfig(agentType);
    const { configPath, configKey } = resolveMcpConfigTarget(agent, options);
    if (!existsSync(configPath)) continue;
    const entries = listServersInConfigFile(configPath, agent.format, configKey);
    for (const [serverName, rawConfig] of Object.entries(entries))
      collected.push({
        serverName,
        agent: agentType,
        path: configPath,
        config: rawConfig,
      });
  }
  return collected;
};
const removeMcpServerFromAgent = (serverName, agentType, options = {}) => {
  const agent = getMcpAgentConfig(agentType);
  const { configPath, configKey } = resolveMcpConfigTarget(agent, options);
  if (!existsSync(configPath))
    return {
      agent: agentType,
      path: configPath,
      removed: false,
    };
  try {
    return {
      agent: agentType,
      path: configPath,
      removed: removeServerFromConfigFile(configPath, agent.format, configKey, serverName),
    };
  } catch (error) {
    return {
      agent: agentType,
      path: configPath,
      removed: false,
      error: toErrorMessage(error),
    };
  }
};
const removeMcpServer = (options) => {
  const agentTypes = options.agents ?? getMcpAgentTypes();
  const results = [];
  for (const agentType of agentTypes) {
    const result = removeMcpServerFromAgent(options.name, agentType, {
      global: options.global,
      cwd: options.cwd,
    });
    if (result.removed || result.error) results.push(result);
  }
  return results;
};
var mcp_exports = /* @__PURE__ */ __exportAll({
  DEFAULT_REMOTE_TRANSPORT: () => DEFAULT_REMOTE_TRANSPORT,
  NPX_COMMAND: () => "npx",
  NPX_DASH_Y: () => "-y",
  add: () => installMcpServer,
  buildMcpServerConfig: () => buildMcpServerConfig,
  detectGloballyInstalledMcpAgents: () => detectGloballyInstalledMcpAgents,
  detectProjectInstalledMcpAgents: () => detectProjectInstalledMcpAgents,
  extractPackageName: () => extractPackageName,
  getMcpAgentConfig: () => getMcpAgentConfig,
  getMcpAgentTypes: () => getMcpAgentTypes,
  getMcpAgentsSupportingProjectScope: () => getMcpAgentsSupportingProjectScope,
  install: () => installMcpServer,
  installMcpServer: () => installMcpServer,
  installMcpServerForAgent: () => installMcpServerForAgent,
  installMcpServerForAgents: () => installMcpServerForAgents,
  isMcpAgentType: () => isMcpAgentType,
  isMcpTransportSupported: () => isMcpTransportSupported,
  isRemoteMcpSource: () => isRemoteMcpSource,
  list: () => listInstalledMcpServers,
  listInstalledMcpServers: () => listInstalledMcpServers,
  listServersInConfigFile: () => listServersInConfigFile,
  mcpAgentAliases: () => mcpAgentAliases,
  mcpAgents: () => mcpAgents,
  parseMcpSource: () => parseMcpSource,
  parseSource: () => parseMcpSource,
  readConfigFile: () => readConfigFile,
  remove: () => removeMcpServer,
  removeMcpServer: () => removeMcpServer,
  removeMcpServerFromAgent: () => removeMcpServerFromAgent,
  removeServerFromConfigFile: () => removeServerFromConfigFile,
  resolveMcpAgentAlias: () => resolveMcpAgentAlias,
  resolveMcpConfigTarget: () => resolveMcpConfigTarget,
  resolveMcpTargetAgents: () => resolveMcpTargetAgents,
  writeServerToConfigFile: () => writeServerToConfigFile,
});
//#endregion
//#region ../../node_modules/.pnpm/agent-install@0.0.5/node_modules/agent-install/dist/agents-md-CLVomM5F.js
const agentsMdFiles = {
  universal: {
    agent: "universal",
    displayName: "AGENTS.md (universal)",
    filename: "AGENTS.md",
    fileExtension: "md",
    supportsMultipleFiles: false,
  },
  "claude-code": {
    agent: "claude-code",
    displayName: "Claude Code (CLAUDE.md)",
    filename: "CLAUDE.md",
    fileExtension: "md",
    supportsMultipleFiles: false,
    aliasOf: "AGENTS.md",
  },
  cursor: {
    agent: "cursor",
    displayName: "Cursor Rules (.cursor/rules)",
    filename: "cursor.mdc",
    supplementaryFilenames: [".cursorrules"],
    subdirectory: ".cursor/rules",
    fileExtension: "mdc",
    supportsMultipleFiles: true,
  },
  codex: {
    agent: "codex",
    displayName: "Codex (AGENTS.md)",
    filename: "AGENTS.md",
    fileExtension: "md",
    supportsMultipleFiles: false,
    aliasOf: "AGENTS.md",
  },
  "gemini-cli": {
    agent: "gemini-cli",
    displayName: "Gemini CLI (GEMINI.md)",
    filename: "GEMINI.md",
    fileExtension: "md",
    supportsMultipleFiles: false,
    aliasOf: "AGENTS.md",
  },
  windsurf: {
    agent: "windsurf",
    displayName: "Windsurf (.windsurfrules)",
    filename: ".windsurfrules",
    fileExtension: "txt",
    supportsMultipleFiles: false,
  },
  opencode: {
    agent: "opencode",
    displayName: "OpenCode (AGENTS.md)",
    filename: "AGENTS.md",
    fileExtension: "md",
    supportsMultipleFiles: false,
    aliasOf: "AGENTS.md",
  },
  aider: {
    agent: "aider",
    displayName: "Aider (.aider.conf.yml points at AGENTS.md)",
    filename: "AGENTS.md",
    fileExtension: "md",
    supportsMultipleFiles: false,
    aliasOf: "AGENTS.md",
  },
};
const getAgentsMdDescriptor = (agent) => agentsMdFiles[agent];
const listAgentsMdDescriptors = () => Object.values(agentsMdFiles);
const HEADING_LINE_REGEX = /^(#{1,6})\s+(.+?)\s*$/;
const FENCE_LINE_REGEX = /^(\s{0,3})(`{3,}|~{3,})(.*)$/;
const computeLineStarts = (content) => {
  const lineStarts = [0];
  for (let index = 0; index < content.length; index += 1)
    if (content.charCodeAt(index) === 10) lineStarts.push(index + 1);
  return lineStarts;
};
const parseSections = (content) => {
  const lines = content.split(/\r?\n/);
  const lineStarts = computeLineStarts(content);
  const sections = [];
  let activeFence = null;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const fenceMatch = line.match(FENCE_LINE_REGEX);
    if (fenceMatch) {
      const fenceToken = fenceMatch[2];
      if (activeFence === null) activeFence = fenceToken[0];
      else if (fenceToken[0] === activeFence && fenceToken.length >= activeFence.length)
        activeFence = null;
      continue;
    }
    if (activeFence !== null) continue;
    const headingMatch = line.match(HEADING_LINE_REGEX);
    if (!headingMatch) continue;
    sections.push({
      heading: headingMatch[2].trim(),
      level: headingMatch[1].length,
      start: lineStarts[lineIndex],
      headingLength: headingMatch[0].length,
    });
  }
  return sections.map((section, sectionIndex) => {
    const nextSection = sections[sectionIndex + 1];
    const end = nextSection ? nextSection.start : content.length;
    const body = content
      .slice(section.start + section.headingLength, end)
      .replace(/^\r?\n+/, "")
      .trimEnd();
    return {
      heading: section.heading,
      level: section.level,
      body,
      start: section.start,
      end,
    };
  });
};
const normalizeHeading = (heading) => heading.trim().toLowerCase();
const findSection = (sections, heading) => {
  const target = normalizeHeading(heading);
  return sections.find((section) => normalizeHeading(section.heading) === target);
};
const renderSection = (heading, body, level = 2) => {
  return `${"#".repeat(level)} ${heading}\n\n${body.replace(/^\r?\n+/, "").replace(/\r?\n+$/, "")}\n`;
};
const resolveAgentsMdFilePath = (options) => {
  const cwd = options.cwd ?? process.cwd();
  if (options.file) return isAbsolute(options.file) ? options.file : join(cwd, options.file);
  const descriptor = getAgentsMdDescriptor(options.agent ?? "universal");
  return join(
    descriptor.subdirectory ? join(cwd, descriptor.subdirectory) : cwd,
    descriptor.filename,
  );
};
const ensureParentDir = (filePath) => {
  const parent = dirname(filePath);
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
};
const readAgentsMd = (options = {}) => {
  const filePath = resolveAgentsMdFilePath(options);
  const content = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
  return {
    path: filePath,
    content,
    sections: parseSections(content),
  };
};
const writeAgentsMd = (options) => {
  const filePath = resolveAgentsMdFilePath(options);
  ensureParentDir(filePath);
  writeFileSync(
    filePath,
    options.content.endsWith("\n") ? options.content : `${options.content}\n`,
    "utf-8",
  );
  return filePath;
};
const removeAgentsMdSection = (options) => {
  const document = readAgentsMd(options);
  const target = findSection(document.sections, options.heading);
  if (!target) return false;
  const before = document.content.slice(0, target.start).replace(/\r?\n+$/, "");
  const after = document.content.slice(target.end).replace(/^\r?\n+/, "");
  const joined =
    before.length > 0 && after.length > 0
      ? `${before}\n\n${after}`
      : before.length > 0
        ? before
        : after;
  writeAgentsMd({
    cwd: options.cwd,
    agent: options.agent,
    file: options.file,
    content: joined,
  });
  return true;
};
const AGENTS_MD_FILENAME = "AGENTS.md";
const CLAUDE_MD_FILENAME = "CLAUDE.md";
const WIN_SYMLINK_TYPE = "file";
const isAlreadyLinkedToAgentsMd = async (claudePath, agentsPath) => {
  try {
    if (!(await lstat(claudePath)).isSymbolicLink()) return false;
    return (await realpath(claudePath)) === (await realpath(agentsPath));
  } catch {
    return false;
  }
};
const createSymlinkOrCopy = async (agentsPath, claudePath) => {
  const symlinkType = platform() === "win32" ? WIN_SYMLINK_TYPE : void 0;
  try {
    await symlink(AGENTS_MD_FILENAME, claudePath, symlinkType);
    return { fellBackToCopy: false };
  } catch {
    await copyFile(agentsPath, claudePath);
    return { fellBackToCopy: true };
  }
};
const symlinkClaudeToAgents = async (options = {}) => {
  const cwd = options.cwd ?? process.cwd();
  const agentsPath = join(cwd, AGENTS_MD_FILENAME);
  const claudePath = join(cwd, CLAUDE_MD_FILENAME);
  if (!existsSync(agentsPath))
    throw new Error(
      `Cannot create ${CLAUDE_MD_FILENAME} symlink: ${agentsPath} does not exist. Create ${AGENTS_MD_FILENAME} first.`,
    );
  if (existsSync(claudePath)) {
    if (await isAlreadyLinkedToAgentsMd(claudePath, agentsPath))
      return {
        claudePath,
        agentsPath,
        created: false,
        alreadyLinked: true,
      };
    if (!options.overwrite)
      return {
        claudePath,
        agentsPath,
        created: false,
        alreadyLinked: false,
      };
    const backupPath = join(cwd, options.backupName ?? "CLAUDE.md.bak");
    try {
      await rename(claudePath, backupPath);
      const { fellBackToCopy } = await createSymlinkOrCopy(agentsPath, claudePath);
      return {
        claudePath,
        agentsPath,
        created: true,
        alreadyLinked: false,
        backedUpTo: backupPath,
        fellBackToCopy,
      };
    } catch {
      await unlink(claudePath).catch(() => {});
    }
  }
  const { fellBackToCopy } = await createSymlinkOrCopy(agentsPath, claudePath);
  return {
    claudePath,
    agentsPath,
    created: true,
    alreadyLinked: false,
    fellBackToCopy,
  };
};
const appendBlock = (content, block) => {
  if (!content.trim()) return block;
  return `${content.replace(/\r?\n+$/, "")}\n\n${block}`;
};
const prependBlock = (content, block) => {
  if (!content.trim()) return block;
  return `${block}\n${content.replace(/^\r?\n+/, "")}`;
};
const replaceSection = (document, heading, block) => {
  const target = findSection(document.sections, heading);
  if (!target) return appendBlock(document.content, block);
  const before = document.content.slice(0, target.start).replace(/\r?\n+$/, "");
  const after = document.content.slice(target.end).replace(/^\r?\n+/, "");
  const middle = before.length > 0 ? `${before}\n\n${block}` : block;
  return after.length > 0 ? `${middle}\n${after}` : middle;
};
const upsertAgentsMdSection = (options) => {
  const document = readAgentsMd(options);
  const level = options.level ?? 2;
  const block = renderSection(options.heading, options.body, level);
  const placement = options.placement ?? "replace";
  let nextContent;
  if (placement === "append") nextContent = appendBlock(document.content, block);
  else if (placement === "prepend") nextContent = prependBlock(document.content, block);
  else nextContent = replaceSection(document, options.heading, block);
  return writeAgentsMd({
    cwd: options.cwd,
    agent: options.agent,
    file: options.file,
    content: nextContent,
  });
};
var agents_md_exports = /* @__PURE__ */ __exportAll({
  agentsMdFiles: () => agentsMdFiles,
  findSection: () => findSection,
  getAgentsMdDescriptor: () => getAgentsMdDescriptor,
  listAgentsMdDescriptors: () => listAgentsMdDescriptors,
  parseSections: () => parseSections,
  read: () => readAgentsMd,
  readAgentsMd: () => readAgentsMd,
  removeAgentsMdSection: () => removeAgentsMdSection,
  removeSection: () => removeAgentsMdSection,
  renderSection: () => renderSection,
  resolveAgentsMdFilePath: () => resolveAgentsMdFilePath,
  setSection: () => upsertAgentsMdSection,
  symlinkClaude: () => symlinkClaudeToAgents,
  symlinkClaudeToAgents: () => symlinkClaudeToAgents,
  upsertAgentsMdSection: () => upsertAgentsMdSection,
  write: () => writeAgentsMd,
  writeAgentsMd: () => writeAgentsMd,
});
//#endregion
export {
  CANONICAL_SKILLS_DIR,
  GitCloneError,
  SKILL_MANIFEST_FILE,
  installSkillsFromSource as add,
  installSkillsFromSource as install,
  installSkillsFromSource,
  agents_md_exports as agentsMd,
  cleanupTempDir,
  cloneRepo,
  detectInstalledSkillAgents,
  discoverSkills as discover,
  discoverSkills,
  fetchSkillManifestFromUrl,
  fetchWellKnownSkills,
  filterSkillsByName,
  getCanonicalSkillsDir,
  getNonUniversalSkillAgents,
  getPluginGroupings,
  getPluginSkillPaths,
  getSkillAgentBaseDir,
  getSkillAgentConfig,
  getSkillAgentDir,
  getSkillAgentTypes,
  getSkillDisplayName,
  getUniversalSkillAgents,
  installSkillForAgent,
  isSkillAgentType,
  isSkillInstalledForAgent,
  isUniversalSkillAgent,
  mcp_exports as mcp,
  parseFrontmatter,
  parseSkillManifest,
  parseSkillSource,
  parseSkillSource as parseSource,
  sanitizeMetadata,
  sanitizeName,
  skill_exports as skill,
  skillAgents,
};

//# sourceMappingURL=dist-Ct16PbPQ.js.map

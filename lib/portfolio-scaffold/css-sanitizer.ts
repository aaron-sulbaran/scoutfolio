import * as csstree from "css-tree";
import type { CssNode } from "css-tree";

// ---------------------------------------------------------------------------
// sanitizeCustomCss
//
// Parses agent-emitted CSS and returns a cleaned version that only contains
// rules targeting our stable .scout-* class hooks (plus :root for CSS
// variables and a/body/html with limited properties). Anything outside the
// whitelist is dropped silently. If the input fails to parse, returns
// { css: "", dropped: ["<parse-error>"] }.
//
// The same string is injected into the preview iframe AND the exported
// globals.css so preview-export parity is preserved automatically.
// ---------------------------------------------------------------------------

const SCOUT_CLASS_RE = /^scout-[a-zA-Z0-9-]+$/;
const ALLOWED_TYPE_SELECTORS = new Set(["a", "body", "html"]);
const ALLOWED_PSEUDO_CLASSES = new Set([
  "hover",
  "focus",
  "focus-visible",
  "active",
  "first-child",
  "last-child",
  "nth-child",
  "first-of-type",
  "last-of-type",
]);
const ALLOWED_PSEUDO_ELEMENTS = new Set(["before", "after", "first-letter"]);

const BODY_HTML_ALLOWED_PROPS = new Set([
  "background",
  "background-color",
  "background-image",
  "color",
  "font-family",
  "letter-spacing",
  "font-feature-settings",
  "line-height",
]);

const ROOT_ALLOWED_PROPS_CHECK = (prop: string): boolean =>
  prop.startsWith("--");

const ANCHOR_ALLOWED_PROPS = new Set([
  "color",
  "text-decoration",
  "text-decoration-color",
  "text-decoration-thickness",
  "text-decoration-style",
  "text-underline-offset",
  "transition",
  "transition-property",
  "transition-duration",
  "transition-timing-function",
  "opacity",
]);

const SCOUT_ALLOWED_PROPS = new Set([
  // Typography
  "font",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "font-variant",
  "font-feature-settings",
  "font-stretch",
  "font-variation-settings",
  "letter-spacing",
  "word-spacing",
  "line-height",
  "text-align",
  "text-transform",
  "text-decoration",
  "text-decoration-color",
  "text-decoration-thickness",
  "text-decoration-style",
  "text-underline-offset",
  "text-shadow",
  "text-indent",
  "white-space",
  "word-break",
  "overflow-wrap",
  "color",
  "caret-color",

  // Background
  "background",
  "background-color",
  "background-image",
  "background-position",
  "background-size",
  "background-repeat",
  "background-attachment",
  "background-blend-mode",
  "mix-blend-mode",

  // Border
  "border",
  "border-color",
  "border-style",
  "border-width",
  "border-radius",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-top-style",
  "border-right-style",
  "border-bottom-style",
  "border-left-style",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
  "outline",
  "outline-color",
  "outline-style",
  "outline-width",
  "outline-offset",

  // Spacing (tweaks only; do not allow changes that would break layout)
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "gap",
  "row-gap",
  "column-gap",

  // Visual effects
  "opacity",
  "transform",
  "transform-origin",
  "filter",
  "backdrop-filter",
  "box-shadow",

  // Transitions and animations (keyframe rules are blocked, but transitions
  // referencing built-in transition functions are fine).
  "transition",
  "transition-property",
  "transition-duration",
  "transition-timing-function",
  "transition-delay",
  "animation",
  "animation-name",
  "animation-duration",
  "animation-timing-function",
  "animation-delay",
  "animation-iteration-count",
  "animation-direction",
  "animation-fill-mode",

  // Content
  "content",

  // Misc
  "cursor",
  "list-style",
  "list-style-type",
  "list-style-position",
]);

export type SanitizeResult = {
  css: string;
  dropped: string[];
};

export function sanitizeCustomCss(input: string | undefined): SanitizeResult {
  if (!input || input.trim().length === 0) {
    return { css: "", dropped: [] };
  }
  const dropped: string[] = [];

  let ast: CssNode;
  try {
    ast = csstree.parse(input, { parseRulePrelude: true, parseValue: true });
  } catch (err) {
    return {
      css: "",
      dropped: [
        `parse-error: ${err instanceof Error ? err.message : String(err)}`,
      ],
    };
  }

  if (ast.type !== "StyleSheet") {
    return { css: "", dropped: ["unexpected-root: not a stylesheet"] };
  }

  // Walk the top-level children, replacing the children list with only the
  // rules we permit. Nested @media bodies are sanitized recursively.
  const filtered = sanitizeRuleList(ast.children, dropped, /*depth*/ 0);
  ast.children = filtered;

  const out = csstree.generate(ast);
  return { css: out, dropped };
}

function sanitizeRuleList(
  list: csstree.List<CssNode>,
  dropped: string[],
  depth: number
): csstree.List<CssNode> {
  const result = new csstree.List<CssNode>();
  list.forEach((node) => {
    const kept = sanitizeNode(node, dropped, depth);
    if (kept) result.appendData(kept);
  });
  return result;
}

function sanitizeNode(
  node: CssNode,
  dropped: string[],
  depth: number
): CssNode | null {
  if (node.type === "Rule") {
    return sanitizeRule(node, dropped);
  }
  if (node.type === "Atrule") {
    return sanitizeAtRule(node, dropped, depth);
  }
  // Comments and whitespace can pass through.
  if (node.type === "Comment") return node;
  dropped.push(`top-level-${node.type}`);
  return null;
}

function sanitizeRule(rule: csstree.Rule, dropped: string[]): CssNode | null {
  if (rule.prelude.type !== "SelectorList") {
    dropped.push("rule: non-selector-list prelude");
    return null;
  }
  const selectorList = rule.prelude;

  let selectorContext: SelectorContext | null = null;
  let allSelectorsValid = true;
  selectorList.children.forEach((sel) => {
    if (sel.type !== "Selector") {
      allSelectorsValid = false;
      return;
    }
    const ctx = classifySelector(sel);
    if (!ctx) {
      allSelectorsValid = false;
      return;
    }
    // If the rule has multiple selectors, they must all be the same kind so
    // we can apply a coherent property whitelist.
    if (selectorContext === null) selectorContext = ctx;
    else if (selectorContext !== ctx) selectorContext = "mixed";
  });

  if (!allSelectorsValid || selectorContext === null) {
    dropped.push(
      `rule: invalid selector(s) "${csstree.generate(rule.prelude).slice(0, 80)}"`
    );
    return null;
  }
  if (selectorContext === "mixed") {
    dropped.push("rule: mixed selector contexts disallowed");
    return null;
  }

  const cleanedBlock = sanitizeBlock(rule.block, selectorContext, dropped);
  if (cleanedBlock.children.isEmpty) {
    dropped.push(
      `rule: all declarations dropped for "${csstree.generate(rule.prelude).slice(0, 80)}"`
    );
    return null;
  }
  rule.block = cleanedBlock;
  return rule;
}

function sanitizeAtRule(
  rule: csstree.Atrule,
  dropped: string[],
  depth: number
): CssNode | null {
  if (depth > 0) {
    dropped.push(`@${rule.name}: nested at-rule disallowed`);
    return null;
  }
  if (rule.name !== "media") {
    dropped.push(`@${rule.name}: at-rule disallowed`);
    return null;
  }
  if (!rule.block) {
    dropped.push("@media: missing block");
    return null;
  }
  // Sanitize nested rules.
  const innerList = sanitizeRuleList(rule.block.children, dropped, depth + 1);
  if (innerList.isEmpty) {
    dropped.push("@media: empty after sanitization");
    return null;
  }
  rule.block.children = innerList;
  return rule;
}

type SelectorContext =
  | "scout"
  | "root"
  | "anchor"
  | "body-html"
  | "mixed";

function classifySelector(
  selector: csstree.Selector
): SelectorContext | null {
  // We require a simple, single-target selector. Walk through the children
  // and bucket the leading element/class, allowing a small set of trailing
  // pseudo-classes/elements.
  const children = selector.children;
  if (children.size === 0) return null;

  let context: SelectorContext | null = null;
  let valid = true;

  children.forEach((child) => {
    if (!valid) return;
    switch (child.type) {
      case "TypeSelector": {
        if (!ALLOWED_TYPE_SELECTORS.has(child.name)) {
          valid = false;
          return;
        }
        const next: SelectorContext = child.name === "a" ? "anchor" : "body-html";
        if (context && context !== next) valid = false;
        else context = next;
        return;
      }
      case "ClassSelector": {
        if (!SCOUT_CLASS_RE.test(child.name)) {
          valid = false;
          return;
        }
        if (context && context !== "scout") valid = false;
        else context = "scout";
        return;
      }
      case "PseudoClassSelector": {
        if (child.name === "root") {
          if (context && context !== "root") valid = false;
          else context = "root";
          return;
        }
        if (!ALLOWED_PSEUDO_CLASSES.has(child.name)) {
          valid = false;
          return;
        }
        return;
      }
      case "PseudoElementSelector": {
        if (!ALLOWED_PSEUDO_ELEMENTS.has(child.name)) {
          valid = false;
          return;
        }
        return;
      }
      case "Combinator":
      case "AttributeSelector":
      case "IdSelector":
      case "NestingSelector": {
        valid = false;
        return;
      }
      default:
        // Anything else (raw nodes, etc.) is treated as invalid.
        valid = false;
        return;
    }
  });

  if (!valid || !context) return null;
  return context;
}

function sanitizeBlock(
  block: csstree.Block,
  ctx: SelectorContext,
  dropped: string[]
): csstree.Block {
  const cleaned = new csstree.List<CssNode>();
  block.children.forEach((child) => {
    if (child.type !== "Declaration") {
      dropped.push(`block-${child.type}: dropped`);
      return;
    }
    if (!declarationAllowed(child, ctx, dropped)) return;
    cleaned.appendData(child);
  });
  return { ...block, children: cleaned } as csstree.Block;
}

function declarationAllowed(
  decl: csstree.Declaration,
  ctx: SelectorContext,
  dropped: string[]
): boolean {
  const property = decl.property.toLowerCase();
  if (
    property.startsWith("-webkit-") ||
    property.startsWith("-moz-") ||
    property.startsWith("-ms-") ||
    property.startsWith("-o-")
  ) {
    dropped.push(`vendor-prop: ${property}`);
    return false;
  }
  if (
    property === "behavior" ||
    property === "binding" ||
    property === "filter" && ctx === "body-html"
  ) {
    dropped.push(`unsafe-prop: ${property}`);
    return false;
  }
  if (ctx === "root") {
    if (!ROOT_ALLOWED_PROPS_CHECK(property)) {
      dropped.push(`:root: non-variable property "${property}"`);
      return false;
    }
  } else if (ctx === "body-html") {
    if (!BODY_HTML_ALLOWED_PROPS.has(property)) {
      dropped.push(`body/html: property "${property}" not allowed`);
      return false;
    }
  } else if (ctx === "anchor") {
    if (!ANCHOR_ALLOWED_PROPS.has(property)) {
      dropped.push(`a: property "${property}" not allowed`);
      return false;
    }
  } else if (ctx === "scout") {
    if (!SCOUT_ALLOWED_PROPS.has(property)) {
      dropped.push(`.scout-*: property "${property}" not allowed`);
      return false;
    }
  } else {
    return false;
  }

  // Value-level checks.
  if (!valueAllowed(decl.value, dropped)) return false;
  return true;
}

function valueAllowed(
  value: csstree.Value | csstree.Raw,
  dropped: string[]
): boolean {
  let allowed = true;
  csstree.walk(value, (node) => {
    if (!allowed) return;
    if (node.type === "Url") {
      // url(...) is only allowed when the inner value is a data: URI.
      const url = (node as unknown as { value: unknown }).value;
      let raw: string;
      if (typeof url === "string") {
        raw = url;
      } else if (
        url &&
        typeof url === "object" &&
        "value" in url &&
        typeof (url as { value: unknown }).value === "string"
      ) {
        raw = (url as { value: string }).value;
      } else {
        raw = "";
      }
      if (!raw.trim().toLowerCase().startsWith("data:")) {
        dropped.push(`url-not-data: "${raw.slice(0, 40)}"`);
        allowed = false;
      }
      return;
    }
    if (node.type === "Function") {
      const name = node.name.toLowerCase();
      if (
        name === "expression" ||
        name === "url-prefix" ||
        name === "domain" ||
        name === "javascript"
      ) {
        dropped.push(`fn: "${name}"`);
        allowed = false;
      }
      return;
    }
    if (node.type === "String" || node.type === "Identifier") {
      const raw =
        node.type === "String" ? node.value : node.name;
      const lower = raw.toLowerCase();
      if (lower.includes("javascript:") || lower.includes("expression(")) {
        dropped.push(`unsafe-token: "${raw.slice(0, 40)}"`);
        allowed = false;
      }
      return;
    }
  });
  return allowed;
}

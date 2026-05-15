import type { Diagnostic } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";

const ignoredRegionStartPattern = /^\s*\/\/\/<\s*$/;
const ignoredRegionEndPattern = /^\s*\/\/\/>\s*$/;

const oplangDisableDirectivePattern =
  /^\s*\/\/\s*oplang-disable(?:\s+([A-Za-z0-9_*,-\s]+))?\s*$/i;
const oplangEnableDirectivePattern =
  /^\s*\/\/\s*oplang-enable(?:\s+([A-Za-z0-9_*,-\s]+))?\s*$/i;
const oplangDisableNextLineDirectivePattern =
  /^\s*\/\/\s*oplang-disable-next-line(?:\s+([A-Za-z0-9_*,-\s]+))?\s*$/i;
const oplangDisableStartDirectivePattern =
  /^\s*\/\/\s*oplang-disable-start(?:\s+([A-Za-z0-9_*,-\s]+))?\s*$/i;
const oplangDisableEndDirectivePattern =
  /^\s*\/\/\s*oplang-disable-end(?:\s+([A-Za-z0-9_*,-\s]+))?\s*$/i;

const opDisableDirectivePattern =
  /^\s*\/\/\s*op-disable(?:\s+([A-Za-z0-9_|-]+))?(?:\s+([A-Za-z0-9_*,-\s]+))?\s*$/i;
const opEnableDirectivePattern =
  /^\s*\/\/\s*op-enable(?:\s+([A-Za-z0-9_|-]+))?(?:\s+([A-Za-z0-9_*,-\s]+))?\s*$/i;
const opDisableNextLineDirectivePattern =
  /^\s*\/\/\s*op-disable-next-line(?:\s+([A-Za-z0-9_|-]+))?(?:\s+([A-Za-z0-9_*,-\s]+))?\s*$/i;
const opDisableStartDirectivePattern =
  /^\s*\/\/\s*op-disable-start(?:\s+([A-Za-z0-9_|-]+))?(?:\s+([A-Za-z0-9_*,-\s]+))?\s*$/i;
const opDisableEndDirectivePattern =
  /^\s*\/\/\s*op-disable-end(?:\s+([A-Za-z0-9_|-]+))?(?:\s+([A-Za-z0-9_*,-\s]+))?\s*$/i;

const genericTargetAliases = new Set<string>([
  "all",
  "lang",
  "oplang",
  "ls",
  "lsp",
  "language",
  "language-server",
  "server",
  "lint",
  "oplint",
  "fmt",
  "opfmt",
  "form",
  "formatter",
  "opsyn",
  "opsynt",
  "syntax"
]);

const languageServerTargetAliases = new Set<string>([
  "all",
  "lang",
  "oplang",
  "ls",
  "lsp",
  "language",
  "language-server",
  "server"
]);

interface DiagnosticSuppressions {
  disabledByLine: Map<number, Set<string>>;
  disabledEverywhere: Set<string>;
}

export function filterDiagnosticsForIgnoredRegions(
  document: TextDocument,
  diagnostics: Diagnostic[]
): Diagnostic[] {
  if (diagnostics.length === 0) {
    return diagnostics;
  }

  const suppressions = parseDiagnosticSuppressions(document.getText());
  if (
    suppressions.disabledByLine.size === 0 &&
    suppressions.disabledEverywhere.size === 0
  ) {
    return diagnostics;
  }

  return diagnostics.filter(
    (diagnostic) => !isDiagnosticSuppressed(suppressions, diagnostic)
  );
}

function parseDiagnosticSuppressions(text: string): DiagnosticSuppressions {
  const lines = text.replace(/\r/g, "").split("\n");
  const disabledByLine = new Map<number, Set<string>>();
  const disabledEverywhere = new Set<string>();
  const activePersistent = new Set<string>();
  const activeBlockCounts = new Map<string, number>();
  const disableNextLineByCode = new Map<number, Set<string>>();

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const active = collectActiveCodesForLine(
      activePersistent,
      activeBlockCounts,
      disableNextLineByCode.get(lineIndex)
    );
    if (active.size > 0) {
      disabledByLine.set(lineIndex, active);
    }

    const lineText = lines[lineIndex];

    const oplangDisableNext = oplangDisableNextLineDirectivePattern.exec(lineText);
    if (oplangDisableNext) {
      addDisableNextLineCodes(
        disableNextLineByCode,
        lineIndex,
        lines.length,
        parseDiagnosticCodeSet(oplangDisableNext[1])
      );
      continue;
    }

    const genericDisableNext = opDisableNextLineDirectivePattern.exec(lineText);
    if (genericDisableNext) {
      const codes = parseGenericDirectiveCodeSet(
        genericDisableNext[1],
        genericDisableNext[2]
      );
      if (codes) {
        addDisableNextLineCodes(disableNextLineByCode, lineIndex, lines.length, codes);
      }
      continue;
    }

    if (ignoredRegionStartPattern.test(lineText)) {
      incrementCodeCounts(activeBlockCounts, new Set<string>(["*"]));
      continue;
    }

    if (ignoredRegionEndPattern.test(lineText)) {
      decrementCodeCounts(activeBlockCounts, new Set<string>(["*"]));
      continue;
    }

    const oplangDisableStart = oplangDisableStartDirectivePattern.exec(lineText);
    if (oplangDisableStart) {
      incrementCodeCounts(
        activeBlockCounts,
        parseDiagnosticCodeSet(oplangDisableStart[1])
      );
      continue;
    }

    const genericDisableStart = opDisableStartDirectivePattern.exec(lineText);
    if (genericDisableStart) {
      const codes = parseGenericDirectiveCodeSet(
        genericDisableStart[1],
        genericDisableStart[2]
      );
      if (codes) {
        incrementCodeCounts(activeBlockCounts, codes);
      }
      continue;
    }

    const oplangDisableEnd = oplangDisableEndDirectivePattern.exec(lineText);
    if (oplangDisableEnd) {
      decrementCodeCounts(
        activeBlockCounts,
        parseDiagnosticCodeSet(oplangDisableEnd[1])
      );
      continue;
    }

    const genericDisableEnd = opDisableEndDirectivePattern.exec(lineText);
    if (genericDisableEnd) {
      const codes = parseGenericDirectiveCodeSet(
        genericDisableEnd[1],
        genericDisableEnd[2]
      );
      if (codes) {
        decrementCodeCounts(activeBlockCounts, codes);
      }
      continue;
    }

    const oplangEnable = oplangEnableDirectivePattern.exec(lineText);
    if (oplangEnable) {
      removeFromCodeSet(activePersistent, parseDiagnosticCodeSet(oplangEnable[1]));
      continue;
    }

    const genericEnable = opEnableDirectivePattern.exec(lineText);
    if (genericEnable) {
      const codes = parseGenericDirectiveCodeSet(genericEnable[1], genericEnable[2]);
      if (codes) {
        removeFromCodeSet(activePersistent, codes);
      }
      continue;
    }

    const oplangDisable = oplangDisableDirectivePattern.exec(lineText);
    if (oplangDisable) {
      addToCodeSet(activePersistent, parseDiagnosticCodeSet(oplangDisable[1]));
      continue;
    }

    const genericDisable = opDisableDirectivePattern.exec(lineText);
    if (genericDisable) {
      const codes = parseGenericDirectiveCodeSet(
        genericDisable[1],
        genericDisable[2]
      );
      if (codes) {
        addToCodeSet(activePersistent, codes);
      }
    }
  }

  for (const code of activePersistent) {
    disabledEverywhere.add(code);
  }

  return {
    disabledByLine,
    disabledEverywhere
  };
}

function isDiagnosticSuppressed(
  suppressions: DiagnosticSuppressions,
  diagnostic: Diagnostic
): boolean {
  const diagnosticCode = normalizeDiagnosticCode(diagnostic.code);

  if (
    suppressions.disabledEverywhere.has("*") ||
    (diagnosticCode !== undefined &&
      suppressions.disabledEverywhere.has(diagnosticCode))
  ) {
    return true;
  }

  const startLine = diagnostic.range.start.line;
  const endLine = getInclusiveDiagnosticEndLine(diagnostic);
  for (let line = startLine; line <= endLine; line += 1) {
    const disabledCodes = suppressions.disabledByLine.get(line);
    if (!disabledCodes) {
      continue;
    }
    if (disabledCodes.has("*")) {
      return true;
    }
    if (diagnosticCode !== undefined && disabledCodes.has(diagnosticCode)) {
      return true;
    }
  }

  return false;
}

function normalizeDiagnosticCode(code: Diagnostic["code"]): string | undefined {
  if (typeof code === "string" && code.trim().length > 0) {
    return code.trim();
  }
  if (typeof code === "number") {
    return String(code);
  }
  return undefined;
}

function collectActiveCodesForLine(
  persistent: Set<string>,
  blockCounts: Map<string, number>,
  nextLineCodes: Set<string> | undefined
): Set<string> {
  const active = new Set<string>();
  for (const code of persistent) {
    active.add(code);
  }
  for (const [code, count] of blockCounts) {
    if (count > 0) {
      active.add(code);
    }
  }
  if (nextLineCodes) {
    for (const code of nextLineCodes) {
      active.add(code);
    }
  }
  return active;
}

function addDisableNextLineCodes(
  targetMap: Map<number, Set<string>>,
  lineIndex: number,
  lineCount: number,
  codes: Set<string>
): void {
  const targetLine = lineIndex + 1;
  if (targetLine >= lineCount) {
    return;
  }
  const existing = targetMap.get(targetLine) ?? new Set<string>();
  addToCodeSet(existing, codes);
  targetMap.set(targetLine, existing);
}

function incrementCodeCounts(
  counts: Map<string, number>,
  codes: Set<string>
): void {
  if (codes.has("*")) {
    counts.set("*", (counts.get("*") ?? 0) + 1);
    return;
  }

  for (const code of codes) {
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
}

function decrementCodeCounts(
  counts: Map<string, number>,
  codes: Set<string>
): void {
  if (codes.has("*")) {
    const current = counts.get("*") ?? 0;
    if (current <= 1) {
      counts.delete("*");
    } else {
      counts.set("*", current - 1);
    }
    return;
  }

  for (const code of codes) {
    const current = counts.get(code) ?? 0;
    if (current <= 1) {
      counts.delete(code);
    } else {
      counts.set(code, current - 1);
    }
  }
}

function addToCodeSet(target: Set<string>, values: Set<string>): void {
  if (values.has("*")) {
    target.clear();
    target.add("*");
    return;
  }
  if (target.has("*")) {
    return;
  }
  for (const value of values) {
    target.add(value);
  }
}

function removeFromCodeSet(target: Set<string>, values: Set<string>): void {
  if (values.has("*")) {
    target.clear();
    return;
  }
  if (target.has("*")) {
    target.delete("*");
  }
  for (const value of values) {
    target.delete(value);
  }
}

function parseDiagnosticCodeSet(raw?: string): Set<string> {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return new Set<string>(["*"]);
  }

  const parsed = new Set<string>();
  for (const chunk of raw.split(/[,\s]+/)) {
    const value = chunk.trim();
    if (!value) {
      continue;
    }
    parsed.add(value);
  }

  return parsed.size > 0 ? parsed : new Set<string>(["*"]);
}

function parseGenericDirectiveCodeSet(
  rawTargets?: string,
  rawCodes?: string
): Set<string> | null {
  if (typeof rawCodes === "string" && rawCodes.trim().length > 0) {
    return shouldApplyGenericTargetsToLanguageServer(rawTargets)
      ? parseDiagnosticCodeSet(rawCodes)
      : null;
  }

  if (typeof rawTargets === "string" && rawTargets.trim().length > 0) {
    if (looksLikeGenericTargetSelector(rawTargets)) {
      return shouldApplyGenericTargetsToLanguageServer(rawTargets)
        ? new Set<string>(["*"])
        : null;
    }

    return parseDiagnosticCodeSet(rawTargets);
  }

  return new Set<string>(["*"]);
}

function looksLikeGenericTargetSelector(rawTargets: string): boolean {
  const targets = splitGenericTargets(rawTargets);
  return targets.length > 0 && targets.every((target) => genericTargetAliases.has(target));
}

function shouldApplyGenericTargetsToLanguageServer(
  rawTargets?: string
): boolean {
  if (typeof rawTargets !== "string" || rawTargets.trim().length === 0) {
    return true;
  }

  const targets = splitGenericTargets(rawTargets);
  if (targets.length === 0) {
    return true;
  }

  return targets.some((target) => languageServerTargetAliases.has(target));
}

function splitGenericTargets(rawTargets: string): string[] {
  return rawTargets
    .split("|")
    .map((target) => target.trim().toLowerCase())
    .filter((target) => target.length > 0);
}

function getInclusiveDiagnosticEndLine(diagnostic: Diagnostic): number {
  const { start, end } = diagnostic.range;
  if (end.line > start.line && end.character === 0) {
    return end.line - 1;
  }
  return end.line;
}

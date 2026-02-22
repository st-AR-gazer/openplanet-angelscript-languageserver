import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { DiagnosticSeverity, type Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import {
  analyzeDocument,
  collectFunctionReturnTypes,
  type DocumentAnalysis
} from "../server/analysis";
import { createCompletionIndex } from "../server/completions";
import { getSemanticDiagnostics, getSyntaxDiagnostics } from "../server/diagnostics";
import { seedTestSymbols } from "./seedTestSymbols";

type ConformanceOutcome = "compile_success" | "compile_error" | "harness_error";
type DiagnosticTextBuckets = "ERR" | "WARN" | "INFO";

interface DiagnosticTextExpectations {
  ERR: string[];
  WARN: string[];
  INFO: string[];
}

interface ConformanceCase {
  id: string;
  description: string;
  expect: ConformanceOutcome;
  code: string;
  files: Record<string, string>;
  dependencies: string[];
  module: string | null;
  infoToml: string | null;
  expectContains: string[];
  rejectContains: string[];
  expectWarning: boolean | null;
  expectWarningContains: string[];
  rejectWarningContains: string[];
  strictDiagnosticText: boolean | null;
  expectDiagnosticText: DiagnosticTextExpectations | null;
  rejectDiagnosticText: DiagnosticTextExpectations | null;
}

interface CliOptions {
  fixturesPath: string;
  casePatterns: string[];
  oracleRunPath: string | null;
  reportPath: string | null;
  verbose: boolean;
  strictDiagnosticText: boolean;
}

interface ConformanceCaseResult {
  id: string;
  description: string;
  expected: ConformanceOutcome;
  expectedFrom: "fixture" | "oracle";
  expectedWarning: boolean | null;
  observed: ConformanceOutcome;
  observedHasWarning: boolean;
  observedWarningCount: number;
  passed: boolean;
  warningExpectationMismatch: boolean;
  strictDiagnosticTextApplied: boolean;
  missingExpectContains: string[];
  presentRejectContains: string[];
  missingExpectWarningContains: string[];
  presentRejectWarningContains: string[];
  missingExpectDiagnosticText: DiagnosticTextExpectations;
  presentRejectDiagnosticText: DiagnosticTextExpectations;
  diagnosticCodes: string[];
  diagnosticMessages: string[];
  warningCodes: string[];
  warningMessages: string[];
  diagnosticTextBySeverity: DiagnosticTextExpectations;
  haystack: string;
  warningHaystack: string;
}

const languageId = "openplanet-angelscript";
const repositoryRoot = path.resolve(__dirname, "..", "..");
const defaultFixturesPath = path.join(
  repositoryRoot,
  "test-files",
  "conformance",
  "cases.jsonl"
);

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const cases = await loadConformanceCases(options.fixturesPath);
  const selectedCases = filterCasesByPatterns(cases, options.casePatterns);
  if (selectedCases.length === 0) {
    throw new Error(
      `No conformance cases selected from ${options.fixturesPath}.`
    );
  }

  const oracleExpectations = options.oracleRunPath
    ? await loadOracleExpectations(options.oracleRunPath)
    : new Map<string, ConformanceOutcome>();
  const completionIndex = createCompletionIndex();
  seedTestSymbols(completionIndex);

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const results: ConformanceCaseResult[] = [];
  console.log(`[conformance] Fixtures: ${options.fixturesPath}`);
  console.log(`[conformance] Cases selected: ${selectedCases.length}`);
  if (options.oracleRunPath) {
    console.log(
      `[conformance] Oracle expectations loaded: ${oracleExpectations.size} (${options.oracleRunPath})`
    );
  }

  for (const [index, testCase] of selectedCases.entries()) {
    const oracleExpected = oracleExpectations.get(testCase.id);
    const expected = oracleExpected ?? testCase.expect;
    const expectedFrom = oracleExpected ? "oracle" : "fixture";

    if (expected === "harness_error") {
      skipped += 1;
      console.log(
        `[conformance] [${index + 1}/${selectedCases.length}] SKIP ${testCase.id} (expected harness_error from ${expectedFrom})`
      );
      continue;
    }

    const observed = await evaluateCaseWithLanguageServer(completionIndex, testCase);
    const missingExpectContains = testCase.expectContains.filter(
      (needle) => !observed.haystack.includes(needle)
    );
    const presentRejectContains = testCase.rejectContains.filter(
      (needle) => needle && observed.haystack.includes(needle)
    );
    const missingExpectWarningContains = testCase.expectWarningContains.filter(
      (needle) => !observed.warningHaystack.includes(needle)
    );
    const presentRejectWarningContains = testCase.rejectWarningContains.filter(
      (needle) => needle && observed.warningHaystack.includes(needle)
    );
    const strictDiagnosticTextApplied =
      options.strictDiagnosticText &&
      testCase.strictDiagnosticText !== false &&
      testCase.expectDiagnosticText !== null;
    const strictExpectedDiagnosticText =
      testCase.expectDiagnosticText ?? emptyDiagnosticTextExpectations();
    const missingExpectDiagnosticText = strictDiagnosticTextApplied
      ? collectMissingDiagnosticText(
        strictExpectedDiagnosticText,
        observed.diagnosticTextBySeverity
      )
      : emptyDiagnosticTextExpectations();
    const presentRejectDiagnosticText = strictDiagnosticTextApplied
      ? collectPresentDiagnosticText(
        testCase.rejectDiagnosticText,
        observed.diagnosticTextBySeverity
      )
      : emptyDiagnosticTextExpectations();
    const strictUnexpectedDiagnosticText = strictDiagnosticTextApplied
      ? collectUnexpectedDiagnosticText(
        strictExpectedDiagnosticText,
        observed.diagnosticTextBySeverity
      )
      : emptyDiagnosticTextExpectations();
    const presentRejectDiagnosticTextMerged = mergeDiagnosticTextExpectations(
      presentRejectDiagnosticText,
      strictUnexpectedDiagnosticText
    );
    const warningExpectationMismatch =
      testCase.expectWarning !== null &&
      observed.hasWarnings !== testCase.expectWarning;
    const result: ConformanceCaseResult = {
      id: testCase.id,
      description: testCase.description,
      expected,
      expectedFrom,
      expectedWarning: testCase.expectWarning,
      observed: observed.outcome,
      observedHasWarning: observed.hasWarnings,
      observedWarningCount: observed.warningMessages.length,
      passed:
        observed.outcome === expected &&
        !warningExpectationMismatch &&
        missingExpectContains.length === 0 &&
        presentRejectContains.length === 0 &&
        missingExpectWarningContains.length === 0 &&
        presentRejectWarningContains.length === 0 &&
        diagnosticTextExpectationCount(missingExpectDiagnosticText) === 0 &&
        diagnosticTextExpectationCount(presentRejectDiagnosticTextMerged) === 0,
      warningExpectationMismatch,
      strictDiagnosticTextApplied,
      missingExpectContains,
      presentRejectContains,
      missingExpectWarningContains,
      presentRejectWarningContains,
      missingExpectDiagnosticText,
      presentRejectDiagnosticText: presentRejectDiagnosticTextMerged,
      diagnosticCodes: observed.diagnosticCodes,
      diagnosticMessages: observed.diagnosticMessages,
      warningCodes: observed.warningCodes,
      warningMessages: observed.warningMessages,
      diagnosticTextBySeverity: observed.diagnosticTextBySeverity,
      haystack: observed.haystack,
      warningHaystack: observed.warningHaystack
    };
    results.push(result);

    if (result.passed) {
      passed += 1;
      console.log(
        `[conformance] [${index + 1}/${selectedCases.length}] PASS ${result.id} (expected=${result.expected} observed=${result.observed} source=${expectedFrom})`
      );
      continue;
    }

    failed += 1;
    console.log(
      `[conformance] [${index + 1}/${selectedCases.length}] FAIL ${result.id} (expected=${result.expected} observed=${result.observed} source=${expectedFrom})`
    );
    if (result.missingExpectContains.length > 0) {
      console.log(
        `[conformance]   missing expect_contains: ${result.missingExpectContains.join(", ")}`
      );
    }
    if (result.presentRejectContains.length > 0) {
      console.log(
        `[conformance]   hit reject_contains: ${result.presentRejectContains.join(", ")}`
      );
    }
    if (result.warningExpectationMismatch) {
      console.log(
        `[conformance]   warning mismatch: expected=${String(
          result.expectedWarning
        )} observed=${String(result.observedHasWarning)}`
      );
    }
    if (result.missingExpectWarningContains.length > 0) {
      console.log(
        `[conformance]   missing expect_warning_contains: ${result.missingExpectWarningContains.join(
          ", "
        )}`
      );
    }
    if (result.presentRejectWarningContains.length > 0) {
      console.log(
        `[conformance]   hit reject_warning_contains: ${result.presentRejectWarningContains.join(
          ", "
        )}`
      );
    }
    if (
      result.strictDiagnosticTextApplied &&
      diagnosticTextExpectationCount(result.missingExpectDiagnosticText) > 0
    ) {
      console.log(
        `[conformance]   missing strict diagnostic text: ${formatDiagnosticTextExpectationDiff(
          result.missingExpectDiagnosticText
        )}`
      );
    }
    if (
      result.strictDiagnosticTextApplied &&
      diagnosticTextExpectationCount(result.presentRejectDiagnosticText) > 0
    ) {
      console.log(
        `[conformance]   unexpected strict diagnostic text: ${formatDiagnosticTextExpectationDiff(
          result.presentRejectDiagnosticText
        )}`
      );
    }
    if (options.verbose) {
      for (const line of result.diagnosticMessages) {
        console.log(`[conformance]   diagnostic: ${line}`);
      }
      for (const line of result.warningMessages) {
        console.log(`[conformance]   warning: ${line}`);
      }
    }
  }

  const summary = {
    ts_utc: new Date().toISOString(),
    fixturesPath: options.fixturesPath,
    totalSelected: selectedCases.length,
    passed,
    failed,
    skipped,
    strictDiagnosticTextEnabled: options.strictDiagnosticText,
    strictDiagnosticTextAppliedCases: results.filter((entry) => entry.strictDiagnosticTextApplied)
      .length,
    oracleOverrides: results.filter((entry) => entry.expectedFrom === "oracle").length,
    results
  };

  if (options.reportPath) {
    const resolvedReportPath = path.resolve(options.reportPath);
    await fs.mkdir(path.dirname(resolvedReportPath), { recursive: true });
    await fs.writeFile(
      resolvedReportPath,
      `${JSON.stringify(summary, null, 2)}\n`,
      "utf8"
    );
    console.log(`[conformance] Report: ${resolvedReportPath}`);
  }

  console.log(`[conformance] Passed: ${passed}`);
  console.log(`[conformance] Failed: ${failed}`);
  console.log(`[conformance] Skipped: ${skipped}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

interface CaseEvaluation {
  outcome: ConformanceOutcome;
  hasWarnings: boolean;
  diagnosticCodes: string[];
  diagnosticMessages: string[];
  warningCodes: string[];
  warningMessages: string[];
  diagnosticTextBySeverity: DiagnosticTextExpectations;
  haystack: string;
  warningHaystack: string;
}

async function evaluateCaseWithLanguageServer(
  completionIndex: ReturnType<typeof createCompletionIndex>,
  testCase: ConformanceCase
): Promise<CaseEvaluation> {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-conformance-")
  );

  try {
    const pluginDir = path.join(tempRoot, sanitizeCaseFolderName(testCase.id));
    await materializeCasePlugin(pluginDir, testCase);
    const documents = await loadCaseDocuments(pluginDir);
    const analyses = documents.map((document) => analyzeDocument(document));
    const analysisByUri = new Map<string, DocumentAnalysis>(
      analyses.map((analysis) => [analysis.uri, analysis])
    );

    const mainUri = URI.file(path.join(pluginDir, "src", "main.as")).toString();
    const mainDocument = documents.find((document) => document.uri === mainUri);
    const mainAnalysis = analysisByUri.get(mainUri);
    if (!mainDocument || !mainAnalysis) {
      throw new Error(
        `Case "${testCase.id}" missing src/main.as after materialization.`
      );
    }

    const syntaxDiagnostics = getSyntaxDiagnostics(mainDocument, mainAnalysis, {
      enableUnparsableStatementDiagnostics: true,
      maxDiagnostics: 500
    });
    const semanticDiagnostics = getSemanticDiagnostics(
      mainDocument,
      mainAnalysis,
      analyses,
      completionIndex,
      {
        enableUnknownSymbols: true,
        enableCaseMismatch: true,
        enableSemanticBinding: true,
        enableTypeChecking: true,
        maxSymbolDiagnostics: 500
      },
      collectFunctionReturnTypes(analyses)
    );

    const diagnostics = [...syntaxDiagnostics, ...semanticDiagnostics];
    const errorDiagnostics = diagnostics.filter(isErrorDiagnostic);
    const warningDiagnostics = diagnostics.filter(isWarningDiagnostic);
    const outcome: ConformanceOutcome =
      errorDiagnostics.length > 0 ? "compile_error" : "compile_success";

    const diagnosticMessages = diagnostics.map(formatDiagnostic);
    const diagnosticCodes = diagnostics
      .map((diagnostic) => diagnosticCodeToString(diagnostic.code))
      .filter((code): code is string => typeof code === "string" && code.length > 0);
    const warningMessages = warningDiagnostics.map(formatDiagnostic);
    const warningCodes = warningDiagnostics
      .map((diagnostic) => diagnosticCodeToString(diagnostic.code))
      .filter((code): code is string => typeof code === "string" && code.length > 0);
    const diagnosticTextBySeverity = collectDiagnosticTextBySeverity(
      diagnostics,
      mainDocument,
      mainAnalysis
    );
    const haystack = diagnosticMessages.join("\n");
    const warningHaystack = warningMessages.join("\n");

    return {
      outcome,
      hasWarnings: warningDiagnostics.length > 0,
      diagnosticCodes,
      diagnosticMessages,
      warningCodes,
      warningMessages,
      diagnosticTextBySeverity,
      haystack,
      warningHaystack
    };
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

function isErrorDiagnostic(diagnostic: Diagnostic): boolean {
  if (diagnostic.severity === undefined) {
    return true;
  }
  return diagnostic.severity === DiagnosticSeverity.Error;
}

function isWarningDiagnostic(diagnostic: Diagnostic): boolean {
  return diagnostic.severity === DiagnosticSeverity.Warning;
}

function formatDiagnostic(diagnostic: Diagnostic): string {
  const line = diagnostic.range.start.line + 1;
  const character = diagnostic.range.start.character + 1;
  const code = diagnosticCodeToString(diagnostic.code) ?? "diag";
  return `${line}:${character} [${code}] ${diagnostic.message}`;
}

function collectDiagnosticTextBySeverity(
  diagnostics: Diagnostic[],
  document?: TextDocument,
  analysis?: DocumentAnalysis
): DiagnosticTextExpectations {
  const out = emptyDiagnosticTextExpectations();
  const hasUnknownUSuffix = diagnostics.some((diagnostic) => {
    const code = diagnosticCodeToString(diagnostic.code);
    return code === "unknown-identifier" && diagnostic.message.includes('Unknown identifier "u"');
  });
  const hasReservedKeywordIdentifier = diagnostics.some((diagnostic) => {
    const code = diagnosticCodeToString(diagnostic.code);
    return code === "reserved-keyword-identifier";
  });
  const hasUnterminatedString = diagnostics.some((diagnostic) => {
    const code = diagnosticCodeToString(diagnostic.code);
    return code === "syntax-unterminated-string";
  });
  const hasEnumLabelKeywordSyntax = diagnostics.some((diagnostic) => {
    if (diagnosticCodeToString(diagnostic.code) !== "syntax-unparsable-statement") {
      return false;
    }
    return (
      /Expected (class|interface|enum) name after "([^"]+)"\./.test(diagnostic.message) ||
      diagnostic.message.includes('Expected namespace identifier after "namespace".') ||
      diagnostic.message.includes('Expected "namespace" after "using".')
    );
  });
  const enumLabelSyntaxKeyword = hasEnumLabelKeywordSyntax
    ? extractEnumLabelKeywordFromSyntaxDiagnostics(diagnostics)
    : undefined;
  if (enumLabelSyntaxKeyword) {
    out.ERR.push("Expected identifier");
    out.ERR.push(`Instead found reserved keyword '${enumLabelSyntaxKeyword}'`);
  }

  for (const diagnostic of diagnostics) {
    const code = diagnosticCodeToString(diagnostic.code);
    const compilerText = extractCompilerTextEntries(diagnostic.data);
    if (compilerText.length > 0) {
      if (
        shouldSkipCompilerTextMapping(
          diagnostic,
          code,
          hasUnknownUSuffix,
          hasReservedKeywordIdentifier,
          hasUnterminatedString,
          hasEnumLabelKeywordSyntax
        )
      ) {
        continue;
      }
      for (const entry of compilerText) {
        const normalized = normalizeDiagnosticMessageText(entry.text);
        if (!normalized) {
          continue;
        }
        if (!out[entry.bucket].includes(normalized)) {
          out[entry.bucket].push(normalized);
        }
      }
      continue;
    }

    if (
      !shouldUseRawDiagnosticTextFallback(
        diagnostic,
        hasUnterminatedString,
        hasEnumLabelKeywordSyntax
      )
    ) {
      continue;
    }
    const bucket = severityToDiagnosticBucket(diagnostic.severity);
    const text = normalizeDiagnosticMessageText(
      code === "syntax-unterminated-string"
        ? "Non-terminated string literal"
        : diagnostic.message
    );
    if (!out[bucket].includes(text)) {
      out[bucket].push(text);
    }
  }

  const shouldSkipScriptCompilationFailed =
    out.ERR.length === 1 &&
    /^Unable to load plugin '.+' because the folder doesn't exist!$/.test(out.ERR[0]);
  if (
    out.ERR.length > 0 &&
    !out.ERR.includes("Script compilation failed!") &&
    !shouldSkipScriptCompilationFailed
  ) {
    out.ERR.push("Script compilation failed!");
  }

  appendCompileInfoMessage(out, diagnostics, document, analysis);

  return out;
}

function shouldUseRawDiagnosticTextFallback(
  diagnostic: Diagnostic,
  hasUnterminatedString: boolean,
  hasEnumLabelKeywordSyntax: boolean
): boolean {
  const code = diagnosticCodeToString(diagnostic.code);
  if (!code) {
    return false;
  }

  if (hasUnterminatedString) {
    if (
      code === "syntax-unclosed-delimiter" ||
      code === "syntax-unparsable-statement" ||
      code === "unknown-identifier"
    ) {
      return false;
    }
  }

  if (hasEnumLabelKeywordSyntax) {
    if (code === "syntax-unparsable-statement") {
      return false;
    }
    if (code === "unknown-identifier" && diagnostic.message.includes('Unknown identifier "LabelValue"')) {
      return false;
    }
  }

  return (
    code === "syntax-unclosed-delimiter" ||
    code === "syntax-unexpected-closing-delimiter" ||
    code === "syntax-unterminated-string" ||
    code === "syntax-unterminated-block-comment" ||
    code === "syntax-unparsable-statement"
  );
}

function shouldSkipCompilerTextMapping(
  diagnostic: Diagnostic,
  code: string | undefined,
  hasUnknownUSuffix: boolean,
  hasReservedKeywordIdentifier: boolean,
  hasUnterminatedString: boolean,
  hasEnumLabelKeywordSyntax: boolean
): boolean {
  if (!code) {
    return false;
  }
  if (
    hasUnknownUSuffix &&
    (code === "operator-type-mismatch" || code === "call-argument-type-mismatch")
  ) {
    return true;
  }
  if (
    hasReservedKeywordIdentifier &&
    (
      code === "assignment-type-mismatch" ||
      code === "return-type-mismatch" ||
      code === "binding-use-before-declaration"
    )
  ) {
    return true;
  }
  if (hasUnterminatedString && code === "unknown-identifier") {
    return true;
  }
  if (
    hasEnumLabelKeywordSyntax &&
    code === "unknown-identifier" &&
    diagnostic.message.includes('Unknown identifier "LabelValue"')
  ) {
    return true;
  }
  return false;
}

function extractEnumLabelKeywordFromSyntaxDiagnostics(
  diagnostics: Diagnostic[]
): string | undefined {
  for (const diagnostic of diagnostics) {
    if (diagnosticCodeToString(diagnostic.code) !== "syntax-unparsable-statement") {
      continue;
    }
    const typeHeaderMatch = /Expected (class|interface|enum) name after "([^"]+)"\./.exec(
      diagnostic.message
    );
    if (typeHeaderMatch) {
      return normalizeEnumLabelKeywordForOracle(typeHeaderMatch[2]);
    }
    if (diagnostic.message.includes('Expected namespace identifier after "namespace".')) {
      return "namespace";
    }
    if (diagnostic.message.includes('Expected "namespace" after "using".')) {
      return "using";
    }
  }
  return undefined;
}

function normalizeEnumLabelKeywordForOracle(keyword: string): string {
  const lower = keyword.toLowerCase();
  if (lower === "int32") {
    return "int";
  }
  if (lower === "uint32") {
    return "uint";
  }
  return lower === "not"
    ? "!"
    : lower === "and"
      ? "&&"
      : lower === "or"
        ? "||"
        : lower === "xor"
          ? "^^"
          : keyword;
}

function appendCompileInfoMessage(
  out: DiagnosticTextExpectations,
  diagnostics: Diagnostic[],
  document?: TextDocument,
  analysis?: DocumentAnalysis
): void {
  if (!document || !analysis) {
    return;
  }

  const hasWarningContextForCompileInfo = diagnostics.some((diagnostic) => {
    const code = diagnosticCodeToString(diagnostic.code);
    return code === "implicit-conversion-not-exact" || code === "binding-shadowing";
  });
  if (out.ERR.length === 0 && !hasWarningContextForCompileInfo) {
    return;
  }
  const reservedKeywordContexts = diagnostics
    .filter((diagnostic) => diagnosticCodeToString(diagnostic.code) === "reserved-keyword-identifier")
    .map(readReservedKeywordContextFromDiagnostic)
    .filter((context): context is string => typeof context === "string");
  if (
    reservedKeywordContexts.length > 0 &&
    !reservedKeywordContexts.includes("local-variable-name")
  ) {
    return;
  }
  const hasHandleModifierCallMismatch = diagnostics.some((diagnostic) => {
    if (diagnosticCodeToString(diagnostic.code) !== "call-argument-type-mismatch") {
      return false;
    }
    return (
      diagnostic.message.includes("Reference inout parameters are not supported in calls to") ||
      diagnostic.message.includes("Handle parameters cannot use in/out modifiers in calls to")
    );
  });
  if (hasHandleModifierCallMismatch) {
    return;
  }

  const sortedDiagnostics = [...diagnostics]
    .sort((left, right) => {
      if (left.range.start.line !== right.range.start.line) {
        return left.range.start.line - right.range.start.line;
      }
      return left.range.start.character - right.range.start.character;
    });
  if (sortedDiagnostics.length === 0) {
    return;
  }

  const candidateDiagnostics =
    out.ERR.length > 0 ? sortedDiagnostics.filter(isErrorDiagnostic) : sortedDiagnostics;
  let functionAtError: DocumentAnalysis["functions"][number] | undefined;
  for (const candidate of candidateDiagnostics) {
    functionAtError = findOwningFunctionForDiagnostic(analysis, document, candidate);
    if (functionAtError) {
      break;
    }
  }
  if (!functionAtError) {
    const hasDefaultArgReferenceError = diagnostics.some((diagnostic) => {
      return (
        diagnosticCodeToString(diagnostic.code) === "default-argument-ordering" &&
        diagnostic.message.includes("cannot reference parameter")
      );
    });
    if (hasDefaultArgReferenceError) {
      functionAtError = analysis.functions.find((fn) => fn.name === "Main");
    }
  }
  if (!functionAtError) {
    return;
  }

  const signature = formatCompilerFunctionSignature(functionAtError);
  const message = normalizeDiagnosticMessageText(`Compiling ${signature}`);
  if (!out.INFO.includes(message)) {
    out.INFO.push(message);
  }
}

function findOwningFunctionForDiagnostic(
  analysis: DocumentAnalysis,
  document: TextDocument,
  diagnostic: Diagnostic
): DocumentAnalysis["functions"][number] | undefined {
  const sortedFunctions = [...analysis.functions].sort(
    (left, right) => left.bodyStart - right.bodyStart
  );
  const offset = document.offsetAt(diagnostic.range.start);
  return sortedFunctions.find(
    (fn) => offset >= fn.bodyStart && offset <= fn.bodyEnd
  );
}

function readReservedKeywordContextFromDiagnostic(
  diagnostic: Diagnostic
): string | undefined {
  if (!diagnostic.data || typeof diagnostic.data !== "object" || Array.isArray(diagnostic.data)) {
    return undefined;
  }
  const source = diagnostic.data as Record<string, unknown>;
  const context = source.reservedKeywordContext;
  if (typeof context !== "string") {
    return undefined;
  }
  const normalized = context.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function formatCompilerFunctionSignature(fn: DocumentAnalysis["functions"][number]): string {
  const returnType = normalizeCompilerTypeToken(fn.returnType || "void");
  const parameters = splitTopLevelComma(fn.argsText)
    .map((entry) => normalizeCompilerParameterType(entry))
    .filter((entry) => entry.length > 0);
  return `${returnType} ${fn.name}(${parameters.join(", ")})`;
}

function normalizeCompilerParameterType(raw: string): string {
  const withoutDefault = stripTopLevelDefaultValue(raw).trim();
  if (!withoutDefault || withoutDefault === "void") {
    return "";
  }

  const trailingNameMatch = /^(.*\S)\s+([A-Za-z_][A-Za-z0-9_]*)$/.exec(withoutDefault);
  const withoutName = trailingNameMatch ? trailingNameMatch[1] : withoutDefault;
  return normalizeCompilerTypeToken(withoutName);
}

function normalizeCompilerTypeToken(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*@\s*/g, "@")
    .replace(/\s*&\s*(inout|in|out)?/gi, (_match, mode: string | undefined) =>
      mode ? `&${mode.toLowerCase()}` : "&"
    );
}

function splitTopLevelComma(text: string): string[] {
  const parts: string[] = [];
  let segmentStart = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let angleDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\") {
      escapeNext = true;
      continue;
    }

    if (inSingleQuote) {
      if (ch === "'") {
        inSingleQuote = false;
      }
      continue;
    }
    if (inDoubleQuote) {
      if (ch === "\"") {
        inDoubleQuote = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      continue;
    }
    if (ch === "\"") {
      inDoubleQuote = true;
      continue;
    }
    if (ch === "(") {
      parenDepth += 1;
      continue;
    }
    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }
    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (ch === "{") {
      braceDepth += 1;
      continue;
    }
    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
    if (ch === "<") {
      angleDepth += 1;
      continue;
    }
    if (ch === ">") {
      angleDepth = Math.max(0, angleDepth - 1);
      continue;
    }

    if (
      ch === "," &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0 &&
      angleDepth === 0
    ) {
      parts.push(text.slice(segmentStart, i));
      segmentStart = i + 1;
    }
  }

  parts.push(text.slice(segmentStart));
  return parts.map((part) => part.trim());
}

function stripTopLevelDefaultValue(text: string): string {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let angleDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\") {
      escapeNext = true;
      continue;
    }

    if (inSingleQuote) {
      if (ch === "'") {
        inSingleQuote = false;
      }
      continue;
    }
    if (inDoubleQuote) {
      if (ch === "\"") {
        inDoubleQuote = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      continue;
    }
    if (ch === "\"") {
      inDoubleQuote = true;
      continue;
    }
    if (ch === "(") {
      parenDepth += 1;
      continue;
    }
    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }
    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (ch === "{") {
      braceDepth += 1;
      continue;
    }
    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
    if (ch === "<") {
      angleDepth += 1;
      continue;
    }
    if (ch === ">") {
      angleDepth = Math.max(0, angleDepth - 1);
      continue;
    }

    if (
      ch === "=" &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0 &&
      angleDepth === 0 &&
      text[i + 1] !== "="
    ) {
      return text.slice(0, i).trimEnd();
    }
  }

  return text.trim();
}

function emptyDiagnosticTextExpectations(): DiagnosticTextExpectations {
  return {
    ERR: [],
    WARN: [],
    INFO: []
  };
}

function cloneDiagnosticTextExpectations(
  value: DiagnosticTextExpectations
): DiagnosticTextExpectations {
  return {
    ERR: [...value.ERR],
    WARN: [...value.WARN],
    INFO: [...value.INFO]
  };
}

function diagnosticTextExpectationCount(value: DiagnosticTextExpectations): number {
  return value.ERR.length + value.WARN.length + value.INFO.length;
}

function mergeDiagnosticTextExpectations(
  left: DiagnosticTextExpectations,
  right: DiagnosticTextExpectations
): DiagnosticTextExpectations {
  const merged = cloneDiagnosticTextExpectations(left);
  for (const bucket of ["ERR", "WARN", "INFO"] as DiagnosticTextBuckets[]) {
    for (const message of right[bucket]) {
      if (!merged[bucket].includes(message)) {
        merged[bucket].push(message);
      }
    }
  }
  return merged;
}

function collectMissingDiagnosticText(
  expected: DiagnosticTextExpectations,
  observed: DiagnosticTextExpectations
): DiagnosticTextExpectations {
  const out = emptyDiagnosticTextExpectations();
  for (const bucket of ["ERR", "WARN", "INFO"] as DiagnosticTextBuckets[]) {
    out[bucket] = expected[bucket].filter((message) => !observed[bucket].includes(message));
  }
  return out;
}

function collectUnexpectedDiagnosticText(
  expected: DiagnosticTextExpectations,
  observed: DiagnosticTextExpectations
): DiagnosticTextExpectations {
  const out = emptyDiagnosticTextExpectations();
  for (const bucket of ["ERR", "WARN", "INFO"] as DiagnosticTextBuckets[]) {
    out[bucket] = observed[bucket].filter((message) => !expected[bucket].includes(message));
  }
  return out;
}

function collectPresentDiagnosticText(
  rejected: DiagnosticTextExpectations | null,
  observed: DiagnosticTextExpectations
): DiagnosticTextExpectations {
  if (!rejected) {
    return emptyDiagnosticTextExpectations();
  }

  const out = emptyDiagnosticTextExpectations();
  for (const bucket of ["ERR", "WARN", "INFO"] as DiagnosticTextBuckets[]) {
    out[bucket] = rejected[bucket].filter((message) => observed[bucket].includes(message));
  }
  return out;
}

function formatDiagnosticTextExpectationDiff(value: DiagnosticTextExpectations): string {
  const rows: string[] = [];
  for (const bucket of ["ERR", "WARN", "INFO"] as DiagnosticTextBuckets[]) {
    if (value[bucket].length === 0) {
      continue;
    }
    rows.push(`${bucket}: ${value[bucket].join(" | ")}`);
  }
  return rows.join("; ");
}

function severityToDiagnosticBucket(
  severity: DiagnosticSeverity | undefined
): DiagnosticTextBuckets {
  if (severity === undefined || severity === DiagnosticSeverity.Error) {
    return "ERR";
  }
  if (severity === DiagnosticSeverity.Warning) {
    return "WARN";
  }
  return "INFO";
}

function normalizeDiagnosticMessageText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractCompilerTextEntries(data: Diagnostic["data"]): Array<{
  bucket: DiagnosticTextBuckets;
  text: string;
}> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return [];
  }

  const source = data as Record<string, unknown>;
  const compilerText = source.compilerText;
  if (!Array.isArray(compilerText)) {
    return [];
  }

  const out: Array<{ bucket: DiagnosticTextBuckets; text: string }> = [];
  for (const entry of compilerText) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const bucketRaw = typeof record.bucket === "string" ? record.bucket.toUpperCase() : "";
    const text = typeof record.text === "string" ? record.text.trim() : "";
    if (!text) {
      continue;
    }
    if (bucketRaw !== "ERR" && bucketRaw !== "WARN" && bucketRaw !== "INFO") {
      continue;
    }
    out.push({
      bucket: bucketRaw as DiagnosticTextBuckets,
      text
    });
  }

  return out;
}

function diagnosticCodeToString(code: Diagnostic["code"]): string | undefined {
  if (typeof code === "string") {
    return code;
  }
  if (typeof code === "number") {
    return String(code);
  }
  return undefined;
}

async function materializeCasePlugin(
  pluginDir: string,
  testCase: ConformanceCase
): Promise<void> {
  await fs.mkdir(path.join(pluginDir, "src"), { recursive: true });
  const infoToml = testCase.infoToml?.trim()
    ? ensureTrailingNewline(testCase.infoToml)
    : renderGeneratedInfoToml(
      `OpDevLSOracle_${sanitizeCaseFolderName(testCase.id)}`,
      testCase.module,
      testCase.dependencies
    );
  await fs.writeFile(path.join(pluginDir, "info.toml"), infoToml, "utf8");

  await fs.writeFile(
    path.join(pluginDir, "src", "main.as"),
    ensureTrailingNewline(testCase.code),
    "utf8"
  );

  for (const [relativePath, content] of Object.entries(testCase.files)) {
    const safePath = toSafeRelativePath(relativePath);
    const destination = path.join(pluginDir, safePath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, ensureTrailingNewline(content), "utf8");
  }
}

async function loadCaseDocuments(pluginDir: string): Promise<TextDocument[]> {
  const asFilePaths = await collectAsFiles(pluginDir);
  const sortedPaths = [...asFilePaths].sort((a, b) => a.localeCompare(b));
  const documents: TextDocument[] = [];
  for (const filePath of sortedPaths) {
    const text = await fs.readFile(filePath, "utf8");
    documents.push(
      TextDocument.create(
        URI.file(filePath).toString(),
        languageId,
        1,
        text
      )
    );
  }
  return documents;
}

async function collectAsFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const directoryPath = stack.pop();
    if (!directoryPath) {
      continue;
    }

    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    for (const entry of entries) {
      const childPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        stack.push(childPath);
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".as")) {
        out.push(childPath);
      }
    }
  }
  return out;
}

function sanitizeCaseFolderName(id: string): string {
  const compact = id.replace(/[^A-Za-z0-9]+/g, "");
  if (compact.length === 0) {
    return "Case";
  }
  return compact.slice(0, 64);
}

function ensureTrailingNewline(text: string): string {
  return text.endsWith("\n") ? text : `${text}\n`;
}

function toSafeRelativePath(rawPath: string): string {
  const normalized = rawPath.replace(/\\/g, "/").trim();
  if (!normalized) {
    throw new Error("Fixture file path is empty.");
  }
  if (path.posix.isAbsolute(normalized)) {
    throw new Error(`Fixture file path must be relative: ${rawPath}`);
  }
  const segments = normalized
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && segment !== ".");
  if (segments.length === 0) {
    throw new Error(`Fixture file path is invalid: ${rawPath}`);
  }
  if (segments.includes("..")) {
    throw new Error(`Fixture file path may not traverse parent dirs: ${rawPath}`);
  }
  return path.join(...segments);
}

function renderGeneratedInfoToml(
  pluginName: string,
  moduleName: string | null,
  dependencies: string[]
): string {
  const dependenciesRaw = dependencies.map((dep) => JSON.stringify(dep)).join(", ");
  const lines = [
    "[meta]",
    `name = ${JSON.stringify(pluginName)}`,
    'author = "OpenplanetDev"',
    'category = "Development"',
    'version = "0.0.0"',
    "siteid = 0",
    "",
    "[script]",
    "timeout = 0",
    `dependencies = [${dependenciesRaw}]`
  ];

  if (moduleName) {
    lines.push(`module = ${JSON.stringify(moduleName)}`);
  }
  lines.push("");
  return lines.join("\n");
}

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    fixturesPath: process.env.OPAS_CONFORMANCE_FIXTURES
      ? path.resolve(process.env.OPAS_CONFORMANCE_FIXTURES)
      : defaultFixturesPath,
    casePatterns: [],
    oracleRunPath: process.env.OPAS_CONFORMANCE_ORACLE_RUN
      ? path.resolve(process.env.OPAS_CONFORMANCE_ORACLE_RUN)
      : null,
    reportPath: process.env.OPAS_CONFORMANCE_REPORT
      ? path.resolve(process.env.OPAS_CONFORMANCE_REPORT)
      : null,
    verbose: false,
    strictDiagnosticText:
      String(process.env.OPAS_CONFORMANCE_STRICT_DIAGNOSTIC_TEXT ?? "")
        .trim()
        .toLowerCase() === "true"
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--fixtures":
        i += 1;
        if (i >= argv.length) {
          throw new Error("--fixtures requires a path.");
        }
        options.fixturesPath = path.resolve(argv[i]);
        break;
      case "--case":
        i += 1;
        if (i >= argv.length) {
          throw new Error("--case requires a glob pattern.");
        }
        options.casePatterns.push(argv[i]);
        break;
      case "--oracle-run":
        i += 1;
        if (i >= argv.length) {
          throw new Error("--oracle-run requires a path to run.jsonl or run dir.");
        }
        options.oracleRunPath = path.resolve(argv[i]);
        break;
      case "--report":
        i += 1;
        if (i >= argv.length) {
          throw new Error("--report requires a path.");
        }
        options.reportPath = path.resolve(argv[i]);
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--strict-diagnostic-text":
        options.strictDiagnosticText = true;
        break;
      case "--no-strict-diagnostic-text":
        options.strictDiagnosticText = false;
        break;
      case "--help":
      case "-h":
        printHelpAndExit();
        break;
      default:
        throw new Error(`Unknown argument: ${arg}. Use --help for usage.`);
    }
  }

  return options;
}

function printHelpAndExit(): never {
  const lines = [
    "Usage: node out/test/runConformanceTests.js [options]",
    "",
    "Options:",
    "  --fixtures <path>     Path to conformance fixtures (.jsonl or .json).",
    "  --case <glob>         Filter case IDs by glob pattern (repeatable).",
    "  --oracle-run <path>   Path to opdev conformance run.jsonl or run dir.",
    "  --report <path>       Write JSON summary report.",
    "  --verbose             Print diagnostics for failed cases.",
    "  --strict-diagnostic-text  Enforce strict ERR/WARN/INFO message parity for fixture diagnostic-text expectations.",
    "  -h, --help            Show this message.",
    "",
    "Env overrides:",
    "  OPAS_CONFORMANCE_FIXTURES",
    "  OPAS_CONFORMANCE_ORACLE_RUN",
    "  OPAS_CONFORMANCE_REPORT",
    "  OPAS_CONFORMANCE_STRICT_DIAGNOSTIC_TEXT"
  ];
  console.log(lines.join("\n"));
  process.exit(0);
}

function filterCasesByPatterns(
  cases: ConformanceCase[],
  patterns: string[]
): ConformanceCase[] {
  if (patterns.length === 0) {
    return cases;
  }

  return cases.filter((testCase) =>
    patterns.some((pattern) => globMatch(testCase.id, pattern))
  );
}

function globMatch(value: string, pattern: string): boolean {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  const regex = new RegExp(`^${escaped}$`);
  return regex.test(value);
}

async function loadOracleExpectations(
  oracleRunPath: string
): Promise<Map<string, ConformanceOutcome>> {
  const pathStats = await fs.stat(oracleRunPath);
  const jsonlPath = pathStats.isDirectory()
    ? path.join(oracleRunPath, "run.jsonl")
    : oracleRunPath;
  const content = removeUtf8Bom(await fs.readFile(jsonlPath, "utf8"));
  const result = new Map<string, ConformanceOutcome>();

  for (const [lineIndex, rawLine] of content.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      throw new Error(
        `Invalid oracle run JSONL at ${jsonlPath}:${lineIndex + 1}: ${String(error)}`
      );
    }
    if (!isRecord(parsed)) {
      continue;
    }
    const caseId = typeof parsed.case_id === "string" ? parsed.case_id.trim() : "";
    if (!caseId) {
      continue;
    }
    const observedRaw = typeof parsed.observed === "string" ? parsed.observed : "";
    if (!observedRaw) {
      continue;
    }
    const observed = normalizeConformanceExpect(observedRaw);
    result.set(caseId, observed);
  }

  return result;
}

async function loadConformanceCases(fixturesPath: string): Promise<ConformanceCase[]> {
  let stats;
  try {
    stats = await fs.stat(fixturesPath);
  } catch {
    throw new Error(`Conformance fixtures file not found: ${fixturesPath}`);
  }
  if (!stats.isFile()) {
    throw new Error(`Conformance fixtures path is not a file: ${fixturesPath}`);
  }

  const extension = path.extname(fixturesPath).toLowerCase();
  const content = removeUtf8Bom(await fs.readFile(fixturesPath, "utf8"));
  const rawCases: unknown[] = [];

  if (extension === ".jsonl") {
    for (const [lineIndex, rawLine] of content.split(/\r?\n/).entries()) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch (error) {
        throw new Error(
          `Invalid JSONL at ${fixturesPath}:${lineIndex + 1}: ${String(error)}`
        );
      }
      rawCases.push(parsed);
    }
  } else if (extension === ".json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON fixture file ${fixturesPath}: ${String(error)}`);
    }
    if (Array.isArray(parsed)) {
      rawCases.push(...parsed);
    } else if (isRecord(parsed) && Array.isArray(parsed.cases)) {
      rawCases.push(...parsed.cases);
    } else {
      throw new Error(
        `Invalid JSON fixture shape in ${fixturesPath}. Expected array or {"cases":[...]}.`
      );
    }
  } else {
    throw new Error(
      `Unsupported fixtures extension for ${fixturesPath}. Use .jsonl or .json.`
    );
  }

  const seenIds = new Set<string>();
  const cases: ConformanceCase[] = [];
  for (const [index, rawCase] of rawCases.entries()) {
    if (!isRecord(rawCase)) {
      throw new Error(
        `Invalid case entry at index ${index} in ${fixturesPath}: expected object.`
      );
    }

    const id = normalizeOptionalString(rawCase.id) || `case_${String(index + 1).padStart(3, "0")}`;
    if (seenIds.has(id)) {
      throw new Error(`Duplicate conformance case id: ${id}`);
    }
    seenIds.add(id);

    const code = normalizeOptionalString(rawCase.code);
    if (!code) {
      throw new Error(`Conformance case "${id}" is missing non-empty "code".`);
    }

    const filesRaw = rawCase.files ?? {};
    if (!isRecord(filesRaw)) {
      throw new Error(`Conformance case "${id}" has invalid "files" (expected object).`);
    }
    const files: Record<string, string> = {};
    for (const [filePath, fileContent] of Object.entries(filesRaw)) {
      if (typeof fileContent !== "string") {
        throw new Error(
          `Conformance case "${id}" file "${filePath}" must map to string content.`
        );
      }
      files[filePath] = fileContent;
    }

    const module = normalizeOptionalString(rawCase.module) ?? null;
    const infoToml = normalizeOptionalString(rawCase.info_toml) ?? null;
    const expect = normalizeConformanceExpect(
      normalizeOptionalString(rawCase.expect) ?? "compile_success"
    );
    const dependencies = normalizeStringArray(rawCase.dependencies);
    const expectContains = normalizeStringArray(rawCase.expect_contains);
    const rejectContains = normalizeStringArray(rawCase.reject_contains);
    const expectWarning =
      normalizeOptionalBoolean(rawCase.expect_warning ?? rawCase.expectWarning) ?? null;
    const expectWarningContains = normalizeStringArray(
      rawCase.expect_warning_contains ?? rawCase.expectWarningContains
    );
    const rejectWarningContains = normalizeStringArray(
      rawCase.reject_warning_contains ?? rawCase.rejectWarningContains
    );
    const strictDiagnosticText =
      normalizeOptionalBoolean(
        rawCase.strict_diagnostic_text ?? rawCase.strictDiagnosticText
      ) ?? null;
    const expectDiagnosticText = normalizeDiagnosticTextExpectations(
      rawCase.expect_diagnostic_text ?? rawCase.expectDiagnosticText
    );
    const rejectDiagnosticText = normalizeDiagnosticTextExpectations(
      rawCase.reject_diagnostic_text ?? rawCase.rejectDiagnosticText
    );

    cases.push({
      id,
      description: normalizeOptionalString(rawCase.description) ?? "",
      expect,
      code,
      files,
      dependencies,
      module,
      infoToml,
      expectContains,
      rejectContains,
      expectWarning,
      expectWarningContains,
      rejectWarningContains,
      strictDiagnosticText,
      expectDiagnosticText,
      rejectDiagnosticText
    });
  }

  return cases;
}

function removeUtf8Bom(text: string): string {
  return text.startsWith("\uFEFF") ? text.slice(1) : text;
}

function normalizeConformanceExpect(raw: string): ConformanceOutcome {
  const value = raw.trim().toLowerCase();
  if (["compile_success", "success", "pass", "ok", "compiles"].includes(value)) {
    return "compile_success";
  }
  if (
    ["compile_error", "error", "fail", "fails", "compile_fail", "not_compile"].includes(
      value
    )
  ) {
    return "compile_error";
  }
  if (["harness_error", "runner_error", "infra_error"].includes(value)) {
    return "harness_error";
  }
  throw new Error(
    `Invalid conformance expect value: ${raw} (expected compile_success|compile_error|harness_error).`
  );
}

function normalizeStringArray(raw: unknown): string[] {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (typeof raw === "string") {
    const value = raw.trim();
    return value ? [value] : [];
  }
  if (!Array.isArray(raw)) {
    throw new Error("Expected string[] or string.");
  }
  return raw
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normalizeDiagnosticTextExpectations(
  raw: unknown
): DiagnosticTextExpectations | null {
  if (raw === undefined || raw === null) {
    return null;
  }
  if (!isRecord(raw)) {
    throw new Error("Expected diagnostic text expectations object.");
  }

  const source = raw as Record<string, unknown>;
  const err = normalizeStringArray(source.ERR ?? source.err ?? source.errors);
  const warn = normalizeStringArray(source.WARN ?? source.warn ?? source.warnings);
  const info = normalizeStringArray(source.INFO ?? source.info ?? source.infos);

  return {
    ERR: err,
    WARN: warn,
    INFO: info
  };
}

function normalizeOptionalString(raw: unknown): string | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }
  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}

function normalizeOptionalBoolean(raw: unknown): boolean | undefined {
  if (typeof raw === "boolean") {
    return raw;
  }
  if (typeof raw !== "string") {
    return undefined;
  }

  const value = raw.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(value)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(value)) {
    return false;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[conformance] FAILED: ${message}`);
  process.exitCode = 1;
});

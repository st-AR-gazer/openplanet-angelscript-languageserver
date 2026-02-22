import {
  Diagnostic,
  DiagnosticSeverity
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentAnalysis } from "./analysis";
import {
  parseCallableSignature as parseCompilerCallableSignature
} from "./compilerPipeline";
import {
  isDisallowedDeclarationIdentifierKeyword,
  isDisallowedLocalIdentifierKeyword,
  isDisallowedParameterIdentifierKeyword,
  isDisallowedTopLevelFunctionIdentifierKeyword,
  normalizeTypeText
} from "./language";
import {
  getResolvedMembersForType,
  tryResolveTypeFullNameFromTypeString
} from "./members";
import type { CompletionIndex, TypeInfo } from "./types";

type GrammarDeclarationNodeLike = DocumentAnalysis["grammarProgram"]["declarations"][number];
type GrammarFunctionNodeLike = Extract<GrammarDeclarationNodeLike, { kind: "function" }>;
type GrammarStatementNodeLike = NonNullable<GrammarFunctionNodeLike["body"]>["statements"][number];

interface ReservedKeywordDiagnosticOptions {
  source: string;
  reservedKeywordIdentifierCode: string;
}

interface InheritanceDiagnosticOptions {
  source: string;
  inheritanceContractCode: string;
}

interface ShadowingDiagnosticOptions {
  source: string;
  bindingShadowingCode: string;
}

interface WorkspaceTypeCatalogLike {
  byFullName: Map<string, TypeInfo>;
  memberVariableTypesByFullName: Map<string, Map<string, string>>;
}

interface WorkspaceTypeDeclarationRecord {
  fullName: string;
  declaration: Extract<GrammarDeclarationNodeLike, { kind: "type" }>;
  sourceText: string;
}

interface MethodSignatureRecord {
  key: string;
  display: string;
}

export function collectReservedKeywordIdentifierDiagnostics(
  analysis: DocumentAnalysis,
  options: ReservedKeywordDiagnosticOptions
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const rangeByStart = new Map<number, Diagnostic["range"]>();

  for (const declaration of analysis.identifierDeclarations) {
    rangeByStart.set(declaration.start, declaration.range);
  }
  for (const fn of analysis.functions) {
    rangeByStart.set(fn.nameStart, fn.nameRange);
    for (const parameter of fn.parameters) {
      rangeByStart.set(parameter.start, parameter.range);
    }
    for (const declaration of fn.localDeclarations) {
      rangeByStart.set(declaration.start, declaration.range);
    }
  }

  const pushReservedKeywordDiagnostic = (
    name: string,
    start: number,
    contextLabel: string,
    reservedKeywordContext?: string
  ): void => {
    const range = rangeByStart.get(start);
    if (!range) {
      return;
    }
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range,
      message: `Reserved keyword "${name}" cannot be used as a ${contextLabel}.`,
      source: options.source,
      code: options.reservedKeywordIdentifierCode,
      ...(reservedKeywordContext
        ? {
          data: {
            reservedKeywordContext
          }
        }
        : {})
    });
  };

  for (const fn of analysis.functions) {
    for (const parameter of fn.parameters) {
      if (!isDisallowedParameterIdentifierKeyword(parameter.name)) {
        continue;
      }

      pushReservedKeywordDiagnostic(
        parameter.name,
        parameter.start,
        "parameter name",
        "parameter-name"
      );
    }

    for (const declaration of fn.localDeclarations) {
      if (!isDisallowedLocalIdentifierKeyword(declaration.name)) {
        continue;
      }

      pushReservedKeywordDiagnostic(
        declaration.name,
        declaration.start,
        "local variable name",
        "local-variable-name"
      );
    }
  }

  interface DeclarationContext {
    inNamespace: boolean;
    inType: boolean;
    typeKind: "class" | "interface" | "enum" | null;
  }

  const visitStatement = (
    statement: GrammarStatementNodeLike,
    context: DeclarationContext
  ): void => {
    if (statement.kind === "variable-declaration") {
      const shouldValidate =
        context.inNamespace || (context.inType && context.typeKind !== "enum");
      if (!shouldValidate) {
        return;
      }

      const label = context.inNamespace
        ? "namespace variable name"
        : "member variable name";
      const parityContext = context.inNamespace
        ? "namespace-variable-name"
        : "member-variable-name";
      for (const declarator of statement.declarators) {
        if (!isDisallowedDeclarationIdentifierKeyword(declarator.name)) {
          continue;
        }
        pushReservedKeywordDiagnostic(
          declarator.name,
          declarator.nameStart,
          label,
          parityContext
        );
      }
      return;
    }

    if (statement.kind === "block") {
      for (const child of statement.statements) {
        visitStatement(child, context);
      }
      return;
    }

    if (statement.kind !== "statement" && statement.body) {
      visitStatement(statement.body, context);
    }
  };

  const visitDeclaration = (
    declaration: GrammarDeclarationNodeLike,
    context: DeclarationContext
  ): void => {
    if (declaration.kind === "namespace") {
      if (isDisallowedDeclarationIdentifierKeyword(declaration.name)) {
        pushReservedKeywordDiagnostic(
          declaration.name,
          declaration.nameStart,
          "namespace name"
        );
      }
      for (const child of declaration.body) {
        visitDeclaration(child, {
          inNamespace: true,
          inType: context.inType,
          typeKind: context.typeKind
        });
      }
      return;
    }

    if (declaration.kind === "type") {
      if (isDisallowedDeclarationIdentifierKeyword(declaration.name)) {
        pushReservedKeywordDiagnostic(
          declaration.name,
          declaration.nameStart,
          `${declaration.typeKind} name`
        );
      }

      if (declaration.typeKind === "enum") {
        for (const enumLabel of collectEnumLabelDeclarations(
          analysis,
          declaration
        )) {
          if (!isDisallowedDeclarationIdentifierKeyword(enumLabel.name)) {
            continue;
          }
          pushReservedKeywordDiagnostic(
            enumLabel.name,
            enumLabel.start,
            "enum label",
            "enum-label"
          );
        }
      }

      for (const child of declaration.body) {
        visitDeclaration(child, {
          inNamespace: context.inNamespace,
          inType: true,
          typeKind: declaration.typeKind
        });
      }
      return;
    }

    if (declaration.kind === "function") {
      const isInMemberContext = context.inNamespace || context.inType;
      const isDisallowedName = isInMemberContext
        ? isDisallowedDeclarationIdentifierKeyword(declaration.name)
        : isDisallowedTopLevelFunctionIdentifierKeyword(declaration.name);
      if (isDisallowedName) {
        pushReservedKeywordDiagnostic(
          declaration.name,
          declaration.nameStart,
          isInMemberContext ? "member function name" : "function name",
          isInMemberContext
            ? context.inNamespace
              ? "namespace-function-name"
              : "member-function-name"
            : "function-name"
        );
      }
      return;
    }

    if (declaration.kind === "callable-declaration") {
      const isInMemberContext = context.inNamespace || context.inType;
      const isDisallowedName = isInMemberContext
        ? isDisallowedDeclarationIdentifierKeyword(declaration.name)
        : isDisallowedTopLevelFunctionIdentifierKeyword(declaration.name);
      if (isDisallowedName) {
        pushReservedKeywordDiagnostic(
          declaration.name,
          declaration.nameStart,
          `${declaration.declarationKind} name`
        );
      }
      return;
    }

    if (declaration.kind === "using") {
      return;
    }

    visitStatement(declaration, context);
  };

  for (const declaration of analysis.grammarProgram.declarations) {
    visitDeclaration(declaration, {
      inNamespace: false,
      inType: false,
      typeKind: null
    });
  }

  return dedupeDiagnostics(diagnostics);
}

export function collectVariableShadowingDiagnostics(
  analysis: DocumentAnalysis,
  options: ShadowingDiagnosticOptions
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const fn of analysis.functions) {
    const scopedDeclarations = [...fn.parameters, ...fn.localDeclarations]
      .slice()
      .sort((a, b) => a.start - b.start);

    for (const declaration of fn.localDeclarations.slice().sort((a, b) => a.start - b.start)) {
      const shadowedOuter = scopedDeclarations.find((candidate) => {
        if (candidate.start >= declaration.start) {
          return false;
        }
        if (candidate.name !== declaration.name) {
          return false;
        }
        if (
          candidate.scopeStart === declaration.scopeStart &&
          candidate.scopeEnd === declaration.scopeEnd
        ) {
          return false;
        }
        return (
          candidate.scopeStart <= declaration.start &&
          declaration.start <= candidate.scopeEnd
        );
      });
      if (!shadowedOuter) {
        continue;
      }

      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: declaration.range,
        message: `Variable '${declaration.name}' hides another variable of same name in outer scope`,
        source: options.source,
        code: options.bindingShadowingCode
      });
    }
  }

  return dedupeDiagnostics(diagnostics);
}

export function collectInheritanceContractDiagnostics(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  workspaceTypeCatalog: WorkspaceTypeCatalogLike | undefined,
  options: InheritanceDiagnosticOptions
): Diagnostic[] {
  if (!workspaceTypeCatalog) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  const declarationRecords = collectWorkspaceTypeDeclarationRecords(allAnalyses);
  const localTypeFullNames = new Set(analysis.typeDeclarations.map((type) => type.fullName));

  for (const fullName of localTypeFullNames) {
    const declarationRecord = declarationRecords.get(fullName);
    const typeInfo = workspaceTypeCatalog.byFullName.get(fullName);
    if (!declarationRecord || !typeInfo?.parentShortName) {
      continue;
    }

    const parentFullName =
      tryResolveTypeFullNameFromTypeString(index, typeInfo.parentShortName, fullName) ??
      typeInfo.parentShortName;

    const parentMembers = getResolvedMembersForType(index, parentFullName).filter(
      (member) => member.kind === "method"
    );
    const parentMemberKeys = new Set<string>();
    for (const member of parentMembers) {
      const parsed = parseMemberMethodSignature(member);
      if (!parsed) {
        continue;
      }
      parentMemberKeys.add(parsed.key);
    }

    for (const child of declarationRecord.declaration.body) {
      if (child.kind !== "function") {
        continue;
      }
      if (!hasFunctionOverrideQualifier(declarationRecord.sourceText, child)) {
        continue;
      }
      const childSignature = getDeclaredMethodSignature(child);
      if (parentMemberKeys.has(childSignature.key)) {
        continue;
      }

      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: offsetToRange(document, child.nameStart, child.nameEnd),
        message:
          `Method '${childSignature.display.replace(
            ` ${child.name}(`,
            ` ${declarationRecord.declaration.name}::${child.name}(`
          )}' marked as override ` +
          "but does not replace any base class or interface method",
        source: options.source,
        code: options.inheritanceContractCode
      });
    }

    if (isTypeDeclarationAbstract(declarationRecord.declaration, declarationRecord.sourceText)) {
      continue;
    }

    const parentRecord = declarationRecords.get(parentFullName);
    if (!parentRecord) {
      continue;
    }
    const requiredParentMethods = collectRequiredParentMethods(parentRecord);
    if (requiredParentMethods.length === 0) {
      continue;
    }

    const implementedKeys = new Set<string>();
    for (const child of declarationRecord.declaration.body) {
      if (child.kind !== "function") {
        continue;
      }
      implementedKeys.add(getDeclaredMethodSignature(child).key);
    }

    for (const required of requiredParentMethods) {
      if (implementedKeys.has(required.key)) {
        continue;
      }
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: offsetToRange(
          document,
          declarationRecord.declaration.nameStart,
          declarationRecord.declaration.nameEnd
        ),
        message:
          `Type "${declarationRecord.declaration.name}" does not implement required method ` +
          `"${required.display}".`,
        source: options.source,
        code: options.inheritanceContractCode
      });
      break;
    }
  }

  return dedupeDiagnostics(diagnostics);
}

function collectEnumLabelDeclarations(
  analysis: DocumentAnalysis,
  declaration: Extract<GrammarDeclarationNodeLike, { kind: "type" }>
): Array<{ name: string; start: number; end: number }> {
  if (declaration.typeKind !== "enum") {
    return [];
  }

  const labels: Array<{ name: string; start: number; end: number }> = [];
  for (const child of declaration.body) {
    if (child.kind !== "statement") {
      continue;
    }

    const statementText = analysis.text.slice(child.start, child.end);
    const segments = splitTopLevelByCommaWithOffsets(statementText, child.start);
    for (const segment of segments) {
      const nameMatch = /^\s*([A-Za-z_][A-Za-z0-9_]*)/.exec(segment.text);
      if (!nameMatch) {
        continue;
      }

      const name = nameMatch[1];
      const relativeNameStart = segment.text.indexOf(name);
      if (relativeNameStart < 0) {
        continue;
      }

      const start = segment.start + relativeNameStart;
      labels.push({
        name,
        start,
        end: start + name.length
      });
    }
  }

  return labels;
}

function splitTopLevelByCommaWithOffsets(
  text: string,
  startOffset: number
): Array<{ text: string; start: number }> {
  const segments: Array<{ text: string; start: number }> = [];
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
      segments.push({
        text: text.slice(segmentStart, i),
        start: startOffset + segmentStart
      });
      segmentStart = i + 1;
    }
  }

  if (segmentStart <= text.length) {
    segments.push({
      text: text.slice(segmentStart),
      start: startOffset + segmentStart
    });
  }

  return segments;
}

function collectWorkspaceTypeDeclarationRecords(
  analyses: DocumentAnalysis[]
): Map<string, WorkspaceTypeDeclarationRecord> {
  const records = new Map<string, WorkspaceTypeDeclarationRecord>();

  const visitDeclarations = (
    declarations: readonly GrammarDeclarationNodeLike[],
    namespacePath: string,
    sourceText: string
  ): void => {
    for (const declaration of declarations) {
      if (declaration.kind === "namespace") {
        const childNamespace = namespacePath
          ? `${namespacePath}::${declaration.name}`
          : declaration.name;
        visitDeclarations(declaration.body, childNamespace, sourceText);
        continue;
      }
      if (declaration.kind !== "type") {
        continue;
      }

      const fullName = namespacePath
        ? `${namespacePath}::${declaration.name}`
        : declaration.name;
      if (!records.has(fullName)) {
        records.set(fullName, {
          fullName,
          declaration,
          sourceText
        });
      }

      visitDeclarations(declaration.body, fullName, sourceText);
    }
  };

  for (const docAnalysis of analyses) {
    visitDeclarations(docAnalysis.grammarProgram.declarations, "", docAnalysis.text);
  }

  return records;
}

function parseMemberMethodSignature(
  member: TypeInfo["members"][number]
): MethodSignatureRecord | undefined {
  if (member.kind !== "method") {
    return undefined;
  }

  const parsed = parseCompilerCallableSignature(
    `${member.returnType ?? "void"} ${member.name}(${member.args ?? ""})`
  );
  if (!parsed) {
    return undefined;
  }

  const parameterTypes = parsed.parameters.map((parameter) =>
    normalizeTypeText(parameter.typeText).trim()
  );
  const returnType = normalizeTypeText(parsed.returnType).trim() || "void";
  return {
    key: buildMethodSignatureKey(member.name, parameterTypes, returnType),
    display: `${returnType} ${member.name}(${parameterTypes.join(", ")})`
  };
}

function getDeclaredMethodSignature(
  declaration: Extract<GrammarDeclarationNodeLike, { kind: "function" }>
): MethodSignatureRecord {
  const parameterTypes = declaration.parameters.map((parameter) =>
    normalizeTypeText(parameter.typeText).trim()
  );
  const returnType = normalizeTypeText(declaration.returnTypeText).trim() || "void";
  return {
    key: buildMethodSignatureKey(declaration.name, parameterTypes, returnType),
    display: `${returnType} ${declaration.name}(${parameterTypes.join(", ")})`
  };
}

function buildMethodSignatureKey(
  name: string,
  parameterTypes: string[],
  returnType: string
): string {
  return `${returnType}|${name}|${parameterTypes.join(",")}`;
}

function hasFunctionOverrideQualifier(
  sourceText: string,
  declaration: Extract<GrammarDeclarationNodeLike, { kind: "function" }>
): boolean {
  const tailStart = Math.max(0, declaration.closeParen + 1);
  const tailEnd = Math.max(tailStart, declaration.openBrace ?? declaration.end);
  const tailText = sourceText.slice(tailStart, tailEnd);
  return /\boverride\b/.test(tailText);
}

function isAbstractFunctionDeclaration(
  sourceText: string,
  declaration: Extract<GrammarDeclarationNodeLike, { kind: "function" }>
): boolean {
  if (declaration.body) {
    return false;
  }
  const tailStart = Math.max(0, declaration.closeParen + 1);
  const tailEnd = Math.max(tailStart, declaration.end);
  const tailText = sourceText.slice(tailStart, tailEnd);
  return /\babstract\b/.test(tailText);
}

function isTypeDeclarationAbstract(
  declaration: Extract<GrammarDeclarationNodeLike, { kind: "type" }>,
  sourceText: string
): boolean {
  const declarationText = sourceText.slice(declaration.start, declaration.end);
  const headerEnd = declarationText.indexOf("{");
  if (headerEnd < 0) {
    return false;
  }
  const header = declarationText.slice(0, headerEnd);
  return /\babstract\b/.test(header);
}

function collectRequiredParentMethods(
  parent: WorkspaceTypeDeclarationRecord
): MethodSignatureRecord[] {
  const required: MethodSignatureRecord[] = [];

  for (const child of parent.declaration.body) {
    if (child.kind !== "function") {
      continue;
    }

    const requiredByInterface = parent.declaration.typeKind === "interface";
    const requiredByAbstract = isAbstractFunctionDeclaration(parent.sourceText, child);
    if (!requiredByInterface && !requiredByAbstract) {
      continue;
    }

    required.push(getDeclaredMethodSignature(child));
  }

  return required;
}

function offsetToRange(
  document: TextDocument,
  startOffset: number,
  endOffset: number
): Diagnostic["range"] {
  const maxOffset = document.getText().length;
  const safeStart = Math.max(0, Math.min(startOffset, maxOffset));
  const safeEnd = Math.max(safeStart, Math.min(endOffset, maxOffset));

  return {
    start: document.positionAt(safeStart),
    end: document.positionAt(safeEnd)
  };
}

function dedupeDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const deduped: Diagnostic[] = [];
  const seen = new Set<string>();

  for (const diagnostic of diagnostics) {
    const key = [
      diagnostic.range.start.line,
      diagnostic.range.start.character,
      diagnostic.range.end.line,
      diagnostic.range.end.character,
      diagnostic.severity ?? "none",
      diagnostic.code ?? "none",
      diagnostic.message
    ].join(":");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(diagnostic);
  }

  return deduped;
}

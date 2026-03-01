import {
  Location,
  type CodeLens
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentAnalysis } from "./analysis";
import { getReferencesAtPosition } from "./navigation";

const openplanetRuntimeCallbackNames = new Set<string>([
  "Main",
  "Update",
  "Render",
  "RenderEarly",
  "RenderLate",
  "RenderMenu",
  "RenderMenuMain",
  "RenderMenuSettings",
  "RenderInterface",
  "RenderInterface_Settings",
  "OnEnabled",
  "OnDisabled",
  "OnDestroyed",
  "OnSettingsChanged",
  "OnKeyPress",
  "OnMouseButton",
  "OnMouseMove",
  "OnMouseWheel",
  "OnPluginMessage"
]);

export function getCodeLensesForDocument(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[]
): CodeLens[] {
  const codeLenses: CodeLens[] = [];

  for (const declaration of analysis.functions) {
    if (openplanetRuntimeCallbackNames.has(declaration.name)) {
      continue;
    }
    if (declaration.hasDeclarationAttributes) {
      continue;
    }

    const references = getReferencesAtPosition(
      document,
      analysis,
      allAnalyses,
      declaration.nameRange.start.line,
      declaration.nameRange.start.character,
      false
    );
    const locations = dedupeLocations(references);

    const title =
      locations.length === 1
        ? "1 reference"
        : `${locations.length} references`;
    codeLenses.push({
      range: declaration.nameRange,
      command: {
        title,
        command: "openplanetLanguageServer.showReferences",
        arguments: [
          document.uri,
          declaration.nameRange.start,
          locations
        ]
      }
    });
  }

  return codeLenses;
}

function dedupeLocations(locations: Location[]): Location[] {
  const unique: Location[] = [];
  const seen = new Set<string>();
  for (const location of locations) {
    const key = `${location.uri}:${location.range.start.line}:${location.range.start.character}:${location.range.end.line}:${location.range.end.character}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(location);
  }

  return unique;
}

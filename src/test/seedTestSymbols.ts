import { CompletionItemKind } from "vscode-languageserver/node";
import { addSymbol, registerNamespacePath } from "../server/completions";
import type { CompletionIndex } from "../server/types";

export function seedTestSymbols(index: CompletionIndex): void {
  registerNamespacePath(index, "UI");

  index.coreGlobalFunctionNames.add("GetApp");
  index.coreGlobalFunctionNames.add("Text");
  index.coreGlobalFunctionNames.add("print");
  index.coreGlobalFuncdefNames.add("CoroutineFunc");

  index.coreFunctionReturnTypes.set("GetApp", "CGameCtnApp@");
  index.coreFunctionSignatures.set("GetApp", ["CGameCtnApp@ GetApp()"]);
  index.coreFunctionSignatures.set("Text", ["void Text(const string &in text)"]);
  index.coreFunctionSignatures.set("print", [
    "void print(const string &in text)",
    "void print(int value)",
    "void print(float value)",
    "void print(bool value)"
  ]);
  index.coreFunctionSignaturesByQualifiedName.set("UI::Text", [
    "void UI::Text(const string &in text)",
    "void UI::Text(const string &in text, vec2 size)"
  ]);

  index.typeInfoByFullName.set("Game::CGameCtnApp", {
    fullName: "Game::CGameCtnApp",
    shortName: "CGameCtnApp",
    namespace: "Game",
    members: [
      {
        name: "CurrentPlayground",
        kind: "property",
        type: "CGamePlayground@"
      }
    ]
  });
  index.typeInfoByFullName.set("Game::CGamePlayground", {
    fullName: "Game::CGamePlayground",
    shortName: "CGamePlayground",
    namespace: "Game",
    members: [
      {
        name: "Analyzer",
        kind: "property",
        type: "CAnalyzer@"
      }
    ]
  });
  index.typeInfoByFullName.set("CAnalyzer", {
    fullName: "CAnalyzer",
    shortName: "CAnalyzer",
    namespace: "",
    members: [
      {
        name: "Id",
        kind: "property",
        type: "MwId"
      }
    ]
  });
  index.typeInfoByFullName.set("MwId", {
    fullName: "MwId",
    shortName: "MwId",
    namespace: "",
    members: [
      {
        name: "Name",
        kind: "method",
        returnType: "string",
        args: ""
      },
      {
        name: "Value",
        kind: "property",
        type: "uint"
      }
    ]
  });

  index.typeFullNamesByShortName.set("CGameCtnApp", ["Game::CGameCtnApp"]);
  index.typeFullNamesByShortName.set("CGamePlayground", ["Game::CGamePlayground"]);
  index.typeFullNamesByShortName.set("CAnalyzer", ["CAnalyzer"]);
  index.typeFullNamesByShortName.set("MwId", ["MwId"]);
  index.gameTypeFullNames.add("Game::CGameCtnApp");
  index.gameTypeFullNames.add("Game::CGamePlayground");

  addSymbol(index, "mat4", {
    label: "Rotate",
    kind: CompletionItemKind.Function,
    detail: "mat4::Rotate(float angle, const vec3&in dir)"
  });
}

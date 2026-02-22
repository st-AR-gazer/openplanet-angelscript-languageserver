// Openplanet AngelScript Language Server Showcase
//
// Open this file in the Extension Development Host and test each section.
// Expected diagnostics are intentional in this file.

using namespace UI;

#include "LocalInclude.as" // Should resolve: Go To Definition opens test-files/LocalInclude.as.
#include "DoesNotExist_ShowMissingInclude.as" // Should show missing-include warning.

// Document Symbols: these functions should appear in Outline.
void Main() {
  // Completion (namespace + keywords): type below and trigger completion.
  UI::AllowDoubleClick::break;

  string string;

  UI::SelectableFlags::AllowDoubleClick;

  // Signature Help (Openplanet core): place cursor inside parentheses.
  GetApp(

  // Case mismatch diagnostic + quick fix (intentional).
  GetaPp();

  // Unknown symbol diagnostic + quick fix suggestions (intentional).
  TotallyMadeUpCall();

  // Scope-aware local rename / references test.
  int localCounter = 1;
  localCounter = localCounter + 5;

  mat4 myMatrix; // Hover on mat4 should show type info.

  mat3;

  vec3;

  string out;


  // Definition/References/Rename for workspace function.
  int added = AddTwo(localCounter);
  int includedResult = IncludedDouble(added);
  print("includedResult: " + tostring(includedResult));

  // Dot-member completion + hover with local type inference.
  CGameCtnApp@ app = GetApp();
  app.Curre // Expect completion to include CurrentPlayground.

  // Chained member type resolution.
  MwId id = app.CurrentPlayground.Analyzer.Id;
  id.Na // Expect completion to include Name().
  id.Val // Expect completion to include Value.

  // Hover on the following member tokens should show signatures/details.
  app.CurrentPlayground.Analyzer;
  id.Name();

  // Function-return type inference (workspace function).
  MwId fromFunc = GetPlaygroundId();
  fromFunc.Na
}

void RenameScopeA() {
  int foo = 10;
  foo = foo + 1;
}

void RenameScopeB() {
  int foo = 20;
  foo = foo + 1;
}

int AddTwo(int value) {
  return value + 2;
}

// Comment explaining thi sfunction
// very comment yesyes
MwId GetPlaygroundId() {
  CGameCtnApp@ app = GetApp();
  return app.CurrentPlayground.Analyzer.Id;
}

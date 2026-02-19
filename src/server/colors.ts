import {
  Color,
  type ColorInformation,
  type ColorPresentation,
  type Range,
  TextEdit
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";

interface VecColorMatch {
  range: Range;
  arity: 3 | 4;
  values: number[];
}

const vecColorPattern =
  /\bvec(3|4)\s*\(\s*([0-9]*\.?[0-9]+)f?\s*,\s*([0-9]*\.?[0-9]+)f?\s*,\s*([0-9]*\.?[0-9]+)f?(?:\s*,\s*([0-9]*\.?[0-9]+)f?)?\s*\)/g;

export function getDocumentColors(document: TextDocument): ColorInformation[] {
  const text = document.getText();
  const matches = collectVecColorMatches(document, text);

  return matches.map((match) => ({
    range: match.range,
    color: {
      red: clampToUnit(match.values[0]),
      green: clampToUnit(match.values[1]),
      blue: clampToUnit(match.values[2]),
      alpha: match.arity === 4 ? clampToUnit(match.values[3]) : 1
    } satisfies Color
  }));
}

export function getColorPresentations(
  document: TextDocument,
  color: Color,
  range: Range
): ColorPresentation[] {
  const originalText = document.getText({ start: range.start, end: range.end });
  const arity = originalText.startsWith("vec4") ? 4 : 3;

  const formatted = arity === 4
    ? `vec4(${formatUnitValue(color.red)}, ${formatUnitValue(color.green)}, ${formatUnitValue(color.blue)}, ${formatUnitValue(color.alpha)})`
    : `vec3(${formatUnitValue(color.red)}, ${formatUnitValue(color.green)}, ${formatUnitValue(color.blue)})`;

  const alternate = arity === 4
    ? `vec4(${formatShortUnitValue(color.red)}, ${formatShortUnitValue(color.green)}, ${formatShortUnitValue(color.blue)}, ${formatShortUnitValue(color.alpha)})`
    : `vec3(${formatShortUnitValue(color.red)}, ${formatShortUnitValue(color.green)}, ${formatShortUnitValue(color.blue)})`;

  const presentations: ColorPresentation[] = [
    {
      label: formatted,
      textEdit: TextEdit.replace(range, formatted)
    }
  ];

  if (alternate !== formatted) {
    presentations.push({
      label: alternate,
      textEdit: TextEdit.replace(range, alternate)
    });
  }

  return presentations;
}

function collectVecColorMatches(
  document: TextDocument,
  text: string
): VecColorMatch[] {
  const matches: VecColorMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = vecColorPattern.exec(text)) !== null) {
    const arity = Number(match[1]) === 4 ? 4 : 3;
    if (arity === 4 && !match[5]) {
      continue;
    }

    const values = [
      Number.parseFloat(match[2]),
      Number.parseFloat(match[3]),
      Number.parseFloat(match[4])
    ];
    if (arity === 4) {
      values.push(Number.parseFloat(match[5]));
    }

    if (values.some((value) => Number.isNaN(value))) {
      continue;
    }

    const start = match.index;
    const end = start + match[0].length;
    matches.push({
      range: {
        start: document.positionAt(start),
        end: document.positionAt(end)
      },
      arity,
      values
    });
  }

  return matches;
}

function clampToUnit(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function formatUnitValue(value: number): string {
  return clampToUnit(value).toFixed(3);
}

function formatShortUnitValue(value: number): string {
  const clamped = clampToUnit(value);
  const fixed = clamped.toFixed(3);
  return fixed.replace(/\.?0+$/, "");
}

import type {
  GameDefinition,
  GameIdentifier,
  GameSymbolSourceSettings,
  SymbolSettings
} from "./types";

export interface GameProfileDefinition extends GameDefinition {
  preprocessorDefines: readonly string[];
}

export const gameProfileDefinitions: readonly GameProfileDefinition[] = [
  {
    id: "trackmania2020",
    folder: "OpenplanetNext",
    gameJsonFile: "OpenplanetNext.json",
    preprocessorDefines: ["TMNEXT"]
  },
  {
    id: "turbo",
    folder: "OpenplanetTurbo",
    gameJsonFile: "OpenplanetTurbo.json",
    preprocessorDefines: ["TURBO"]
  },
  {
    id: "openplanet4",
    folder: "Openplanet4",
    gameJsonFile: "Openplanet4.json",
    preprocessorDefines: ["MP4"]
  }
];

export function getGameSourceSettings(
  symbolSettings: SymbolSettings,
  gameId: GameIdentifier
): GameSymbolSourceSettings {
  switch (gameId) {
    case "trackmania2020":
      return symbolSettings.trackmania2020;
    case "turbo":
      return symbolSettings.turbo;
    case "openplanet4":
      return symbolSettings.openplanet4;
  }
}

export function collectGameProfilePreprocessorDefines(
  symbolSettings: SymbolSettings
): { trueDefines: string[]; falseDefines: string[] } {
  const trueDefines: string[] = [];
  const falseDefines: string[] = [];

  for (const profile of gameProfileDefinitions) {
    const target = getGameSourceSettings(symbolSettings, profile.id);
    const output = target.enabled ? trueDefines : falseDefines;
    for (const define of profile.preprocessorDefines) {
      if (!output.includes(define)) {
        output.push(define);
      }
    }
  }

  return { trueDefines, falseDefines };
}

export function getSingleGameProfilePreprocessorDefines(
  gameId: GameIdentifier
): { trueDefines: string[]; falseDefines: string[] } {
  const trueDefines: string[] = [];
  const falseDefines: string[] = [];

  for (const profile of gameProfileDefinitions) {
    const output = profile.id === gameId ? trueDefines : falseDefines;
    for (const define of profile.preprocessorDefines) {
      if (!output.includes(define)) {
        output.push(define);
      }
    }
  }

  return { trueDefines, falseDefines };
}

export function getGameProfileDisplayName(gameId: GameIdentifier): string {
  const profile = gameProfileDefinitions.find((entry) => entry.id === gameId);
  if (!profile) {
    return gameId;
  }

  return profile.preprocessorDefines[0] ?? profile.folder;
}

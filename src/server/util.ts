import * as os from "os";
import * as path from "path";
import { URI } from "vscode-uri";

export function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function readString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function toObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => toRecord(item))
    .filter((item) => Object.keys(item).length > 0);
}

export function uriToFsPath(uri: string): string {
  return URI.parse(uri).fsPath;
}

export function getBaseUserFolderPath(configPath: string): string {
  if (configPath.length > 0) {
    return resolveUserPath(configPath);
  }

  return os.homedir();
}

export function resolveConfiguredOrDefaultPath(
  configPath: string,
  defaultPath: string
): string {
  if (configPath.length > 0) {
    return resolveUserPath(configPath);
  }

  return defaultPath;
}

export function resolveUserPath(userPath: string): string {
  if (userPath.startsWith("~")) {
    const relativePath = userPath.slice(1).replace(/^[\\/]+/, "");
    return path.join(os.homedir(), relativePath);
  }

  return path.resolve(userPath);
}


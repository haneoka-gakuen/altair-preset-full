import type { AltairPlugin, AltairPluginHost, AltairPluginManifest } from "@haneoka/altair/plugins";
import type { StoryProjectPlugin } from "@haneoka/altair/model";

export const ALTAIR_FULL_PRESET_PEER_RANGE = "^0.1.0" as const;

export interface AltairFullPresetDescriptor {
  readonly id: string;
  readonly packageName: string;
  readonly exportName: string;
  readonly version: string;
  readonly peerRange: typeof ALTAIR_FULL_PRESET_PEER_RANGE;
  readonly dependencies: Readonly<Record<string, string>>;
  readonly capabilities: readonly string[];
  readonly permissions: readonly string[];
}

const descriptor = <
  const T extends Omit<AltairFullPresetDescriptor, "dependencies" | "peerRange"> & {
    readonly dependencies?: Readonly<Record<string, string>>;
  },
>(
  value: T,
): Readonly<
  T & {
    readonly peerRange: typeof ALTAIR_FULL_PRESET_PEER_RANGE;
    readonly dependencies: Readonly<Record<string, string>>;
  }
> =>
  Object.freeze({
    ...value,
    peerRange: ALTAIR_FULL_PRESET_PEER_RANGE,
    dependencies: Object.freeze({ ...(value.dependencies ?? {}) }),
    capabilities: Object.freeze([...value.capabilities]),
    permissions: Object.freeze([...value.permissions]),
  }) as Readonly<
    T & {
      readonly peerRange: typeof ALTAIR_FULL_PRESET_PEER_RANGE;
      readonly dependencies: Readonly<Record<string, string>>;
    }
  >;

/**
 * Canonical dependency-safe order for the complete authoring setup.
 *
 * These are descriptors only. This package never imports or evaluates an
 * implementation package.
 */
export const ALTAIR_FULL_PRESET_DESCRIPTORS = Object.freeze([
  descriptor({
    id: "haneoka.altair-history",
    packageName: "@haneoka/altair-plugin-history",
    exportName: "altairHistoryPlugin",
    version: "0.1.0",
    capabilities: ["services"],
    permissions: [],
  }),
  descriptor({
    id: "haneoka.altair-drafts",
    packageName: "@haneoka/altair-plugin-drafts",
    exportName: "altairDraftsPlugin",
    version: "0.1.0",
    capabilities: ["services"],
    permissions: [],
  }),
  descriptor({
    id: "haneoka.altair-adv",
    packageName: "@haneoka/altair-plugin-adv",
    exportName: "altairAdvPlugin",
    version: "0.1.0",
    capabilities: ["assets", "commands", "compiler", "diagnostics", "format", "services"],
    permissions: [],
  }),
  descriptor({
    id: "haneoka.altair-models",
    packageName: "@haneoka/altair-plugin-models",
    exportName: "altairModelsPlugin",
    version: "0.1.0",
    dependencies: { "haneoka.altair-adv": "^0.1.0" },
    capabilities: ["editor", "panel"],
    permissions: ["project.read", "project.write"],
  }),
  descriptor({
    id: "haneoka.altair-flow",
    packageName: "@haneoka/altair-plugin-flow",
    exportName: "altairFlowPlugin",
    version: "0.1.0",
    capabilities: ["flow", "panel"],
    permissions: [],
  }),
  descriptor({
    id: "haneoka.altair-prose",
    packageName: "@haneoka/altair-plugin-prose",
    exportName: "altairProsePlugin",
    version: "0.1.0",
    capabilities: ["ai"],
    permissions: [],
  }),
  descriptor({
    id: "haneoka.altair-webgal",
    packageName: "@haneoka/altair-plugin-webgal",
    exportName: "altairWebGalPlugin",
    version: "0.1.0",
    dependencies: {
      "haneoka.altair-adv": "^0.1.0",
    },
    capabilities: ["commands", "diagnostics", "format", "services", "editor", "panel"],
    permissions: ["project.read", "project.write"],
  }),
  descriptor({
    id: "haneoka.altair-marketplace",
    packageName: "@haneoka/altair-plugin-marketplace",
    exportName: "altairMarketplacePlugin",
    version: "0.1.0",
    capabilities: ["services"],
    permissions: ["network:http"],
  }),
  descriptor({
    id: "haneoka.altair-vega-preview",
    packageName: "@haneoka/altair-plugin-vega-preview",
    exportName: "altairVegaPreviewPlugin",
    version: "0.1.0",
    dependencies: {
      "haneoka.altair-adv": "^0.1.0",
    },
    capabilities: ["compiler", "preview", "services"],
    permissions: [],
  }),
  descriptor({
    id: "haneoka.altair-workspace-browser",
    packageName: "@haneoka/altair-plugin-workspace-browser",
    exportName: "altairWorkspaceBrowserPlugin",
    version: "0.1.0",
    capabilities: ["assets", "services"],
    permissions: ["filesystem:read", "filesystem:write"],
  }),
] as const);

export type AltairFullPresetDescriptorValue = (typeof ALTAIR_FULL_PRESET_DESCRIPTORS)[number];
export type AltairFullPresetPluginId = AltairFullPresetDescriptorValue["id"];

export const ALTAIR_FULL_PRESET_PLUGIN_IDS = Object.freeze(
  ALTAIR_FULL_PRESET_DESCRIPTORS.map(({ id }) => id),
) as readonly AltairFullPresetPluginId[];

/**
 * A caller-supplied plugin object or an already imported ESM namespace.
 * Loading remains the application's responsibility.
 */
export type AltairSuppliedPluginModule = AltairPlugin | Readonly<Record<string, unknown>>;

export type AltairFullPresetModules = Readonly<Partial<Record<AltairFullPresetPluginId, AltairSuppliedPluginModule>>>;

export interface InstallAltairFullPresetOptions {
  /**
   * Installs this subset and its transitive dependencies in canonical order.
   * Omit for the full preset.
   */
  readonly pluginIds?: readonly AltairFullPresetPluginId[];
}

export interface AltairFullPresetInstallation {
  /** All selected plugins, including compatible plugins already on the host. */
  readonly pluginIds: readonly AltairFullPresetPluginId[];
  /** Plugins owned by this installation and removed by dispose(). */
  readonly installedPluginIds: readonly AltairFullPresetPluginId[];
  readonly active: boolean;
  dispose(): Promise<void>;
}

const DESCRIPTOR_BY_ID = new Map(ALTAIR_FULL_PRESET_DESCRIPTORS.map((entry) => [entry.id, entry]));

const cloneProjectPlugin = (entry: AltairFullPresetDescriptor): StoryProjectPlugin =>
  Object.freeze({
    id: entry.id,
    version: entry.version,
    enabled: true,
    capabilities: Object.freeze([...entry.capabilities]),
    permissions: Object.freeze([...entry.permissions]),
    targets: Object.freeze({
      runtimes: Object.freeze(["altair"]),
    }),
    ...(Object.keys(entry.dependencies).length ? { dependencies: Object.freeze({ ...entry.dependencies }) } : {}),
    source: Object.freeze({
      type: "registry" as const,
      package: entry.packageName,
    }),
  });

/** Returns a fresh, immutable project selection for the complete preset. */
export const createAltairFullPresetProjectPlugins = (): readonly StoryProjectPlugin[] =>
  Object.freeze(ALTAIR_FULL_PRESET_DESCRIPTORS.map(cloneProjectPlugin));

const isPlugin = (value: unknown): value is AltairPlugin => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as {
    readonly manifest?: unknown;
    readonly setup?: unknown;
  };
  return Boolean(candidate.manifest) && typeof candidate.manifest === "object" && typeof candidate.setup === "function";
};

const unwrapPlugin = (
  module: AltairSuppliedPluginModule,
  descriptor: AltairFullPresetDescriptorValue,
): AltairPlugin => {
  if (isPlugin(module)) return module;
  if (module && typeof module === "object" && "default" in module && isPlugin(module.default)) {
    return module.default;
  }
  const named = module[descriptor.exportName];
  if (isPlugin(named)) return named;
  throw new TypeError(
    `Altair full preset module ${descriptor.id} has no ${descriptor.exportName} or default plugin export`,
  );
};

const requireApi2Manifest = (manifest: AltairPluginManifest, expected: AltairFullPresetDescriptor): void => {
  if (manifest.id !== expected.id) {
    throw new TypeError(`Altair full preset expected ${expected.id}, received ${manifest.id}`);
  }
  if (manifest.version !== expected.version) {
    throw new TypeError(`Altair full preset requires ${expected.id}@${expected.version}, received ${manifest.version}`);
  }
  if (manifest.apiVersion !== 2) {
    throw new TypeError(`Altair full preset requires API 2 for ${expected.id}`);
  }
};

const selectedDescriptors = (options: InstallAltairFullPresetOptions): readonly AltairFullPresetDescriptorValue[] => {
  if (options.pluginIds === undefined) {
    return ALTAIR_FULL_PRESET_DESCRIPTORS;
  }
  const requested = new Set<AltairFullPresetPluginId>();
  for (const id of options.pluginIds) {
    if (!DESCRIPTOR_BY_ID.has(id)) {
      throw new RangeError(`Unknown Altair full preset plugin: ${id}`);
    }
    if (requested.has(id)) {
      throw new TypeError(`Duplicate Altair full preset plugin: ${id}`);
    }
    requested.add(id);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of ALTAIR_FULL_PRESET_DESCRIPTORS) {
      if (!requested.has(entry.id)) continue;
      for (const dependencyId of Object.keys(entry.dependencies)) {
        if (!DESCRIPTOR_BY_ID.has(dependencyId as AltairFullPresetPluginId)) {
          throw new ReferenceError(`Altair full preset dependency is unknown: ${entry.id} -> ${dependencyId}`);
        }
        if (!requested.has(dependencyId as AltairFullPresetPluginId)) {
          requested.add(dependencyId as AltairFullPresetPluginId);
          changed = true;
        }
      }
    }
  }
  return Object.freeze(ALTAIR_FULL_PRESET_DESCRIPTORS.filter(({ id }) => requested.has(id)));
};

const removeOwned = async (host: AltairPluginHost, installed: readonly AltairFullPresetPluginId[]): Promise<void> => {
  const errors: unknown[] = [];
  for (const id of [...installed].reverse()) {
    try {
      await host.remove(id);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) {
    throw new AggregateError(errors, "Failed to dispose Altair full preset plugins");
  }
};

/**
 * Installs caller-supplied API 2 modules as one transaction.
 *
 * Every module is validated before mutation. If activation fails, plugins
 * installed by this call are removed in reverse order. The returned lifecycle
 * never removes compatible plugins that were already present.
 */
export const installAltairFullPreset = async (
  host: AltairPluginHost,
  modules: AltairFullPresetModules,
  options: InstallAltairFullPresetOptions = {},
): Promise<AltairFullPresetInstallation> => {
  if (!host || typeof host.install !== "function" || typeof host.remove !== "function") {
    throw new TypeError("Altair full preset requires an AltairPluginHost");
  }
  if (!modules || typeof modules !== "object" || Array.isArray(modules)) {
    throw new TypeError("Altair full preset modules must be an object");
  }

  for (const key of Object.keys(modules)) {
    if (!DESCRIPTOR_BY_ID.has(key as AltairFullPresetPluginId)) {
      throw new RangeError(`Unknown Altair full preset module: ${key}`);
    }
  }

  const selected = selectedDescriptors(options);
  const existing = new Map(host.list().map((manifest) => [manifest.id, manifest]));
  const pending: Array<{
    readonly descriptor: AltairFullPresetDescriptorValue;
    readonly plugin: AltairPlugin;
  }> = [];

  for (const entry of selected) {
    const installed = existing.get(entry.id);
    if (installed) {
      requireApi2Manifest(installed, entry);
      continue;
    }
    const supplied = modules[entry.id];
    if (supplied === undefined) {
      throw new ReferenceError(`Altair full preset module is missing: ${entry.packageName}`);
    }
    const plugin = unwrapPlugin(supplied, entry);
    requireApi2Manifest(plugin.manifest, entry);
    pending.push({ descriptor: entry, plugin });
  }

  const owned: AltairFullPresetPluginId[] = [];
  try {
    for (const { descriptor: entry, plugin } of pending) {
      await host.install(plugin, {
        permissions: entry.permissions,
      });
      owned.push(entry.id);
    }
  } catch (installError) {
    try {
      await removeOwned(host, owned);
    } catch (rollbackError) {
      throw new AggregateError([installError, rollbackError], "Altair full preset installation and rollback failed");
    }
    throw installError;
  }

  let active = true;
  let disposal: Promise<void> | undefined;
  const installation: AltairFullPresetInstallation = {
    pluginIds: Object.freeze(selected.map(({ id }) => id)),
    installedPluginIds: Object.freeze([...owned]),
    get active() {
      return active;
    },
    dispose() {
      if (!disposal) {
        active = false;
        disposal = removeOwned(host, owned);
      }
      return disposal;
    },
  };
  return Object.freeze(installation);
};

export default installAltairFullPreset;

# Altair Full Preset

The full [Altair](https://github.com/haneoka-gakuen/altair) editor in one
call. This preset knows the ten official authoring plugins, the order they
depend on each other, and the versions that belong together; you hand it the
plugin modules and it installs them correctly. Uninstalling is one call too.

| Plugin | What it adds |
| --- | --- |
| [History](https://github.com/haneoka-gakuen/altair-plugin-history) | Undo and redo |
| [Drafts](https://github.com/haneoka-gakuen/altair-plugin-drafts) | Recovery of unsaved edits |
| [ADV](https://github.com/haneoka-gakuen/altair-plugin-adv) | The story command set, file formats, validation and compiler |
| [Models](https://github.com/haneoka-gakuen/altair-plugin-models) | Composed character editor |
| [Flow](https://github.com/haneoka-gakuen/altair-plugin-flow) | Flowchart and story-structure checks |
| [Prose](https://github.com/haneoka-gakuen/altair-plugin-prose) | Prose to scenes |
| [WebGAL](https://github.com/haneoka-gakuen/altair-plugin-webgal) | WebGAL import and export |
| [Marketplace](https://github.com/haneoka-gakuen/altair-plugin-marketplace) | Project plugin management |
| [Vega Preview](https://github.com/haneoka-gakuen/altair-plugin-vega-preview) | Live preview and the Vega compiler |
| [Workspace Browser](https://github.com/haneoka-gakuen/altair-plugin-workspace-browser) | Local project folders |

Source plugins such as [Bestdori](https://github.com/haneoka-gakuen/altair-plugin-bestdori)
and [Haneoka](https://github.com/haneoka-gakuen/altair-plugin-haneoka) need
your own network adapter and are installed separately.

## Install

```sh
pnpm add @haneoka/altair @haneoka/altair-preset-full \
  @haneoka/altair-plugin-history @haneoka/altair-plugin-drafts @haneoka/altair-plugin-adv \
  @haneoka/altair-plugin-models @haneoka/altair-plugin-flow @haneoka/altair-plugin-prose \
  @haneoka/altair-plugin-webgal @haneoka/altair-plugin-marketplace \
  @haneoka/altair-plugin-vega-preview @haneoka/altair-plugin-workspace-browser
```

## Use it

The preset never imports plugin packages itself — you pass in the modules,
which keeps your bundler in charge of what is loaded and when:

```ts
import { AltairPluginHost } from "@haneoka/altair/plugins";
import installAltairFullPreset from "@haneoka/altair-preset-full";

const host = new AltairPluginHost();
const installation = await installAltairFullPreset(host, {
  "haneoka.altair-history": await import("@haneoka/altair-plugin-history"),
  "haneoka.altair-drafts": await import("@haneoka/altair-plugin-drafts"),
  "haneoka.altair-adv": await import("@haneoka/altair-plugin-adv"),
  "haneoka.altair-models": await import("@haneoka/altair-plugin-models"),
  "haneoka.altair-flow": await import("@haneoka/altair-plugin-flow"),
  "haneoka.altair-prose": await import("@haneoka/altair-plugin-prose"),
  "haneoka.altair-webgal": await import("@haneoka/altair-plugin-webgal"),
  "haneoka.altair-marketplace": await import("@haneoka/altair-plugin-marketplace"),
  "haneoka.altair-vega-preview": await import("@haneoka/altair-plugin-vega-preview"),
  "haneoka.altair-workspace-browser": await import("@haneoka/altair-plugin-workspace-browser"),
});

// later
await installation.dispose();
```

A module can be the plugin object itself or the package's module namespace;
the preset finds the plugin export in it.

### Installing part of it

```ts
await installAltairFullPreset(host, modules, { pluginIds: ["haneoka.altair-flow"] });
```

`pluginIds` selects a subset; their dependencies (here ADV) are added
automatically, in the right order. Only the modules actually needed must be
supplied.

### Plugins that are already installed

A plugin already on the host is checked for a compatible API version and
reused instead of installed twice. The returned installation reports both:

| Field | Meaning |
| --- | --- |
| `pluginIds` | Every plugin the selection needs, including ones that were already there. |
| `installedPluginIds` | The plugins this call installed. `dispose()` removes only these. |
| `active` | `false` after `dispose()`. |

If any plugin fails to install, the ones installed by this call are removed
again and the error is rethrown.

## Recording the preset in a project

```ts
import { createAltairFullPresetProjectPlugins } from "@haneoka/altair-preset-full";

project.plugins = [...createAltairFullPresetProjectPlugins()];
```

This writes the preset's plugins — ids, versions, capabilities, permissions,
dependencies and npm package names — into the project, so
[Altair Marketplace](https://github.com/haneoka-gakuen/altair-plugin-marketplace)
can check and lock them.

`ALTAIR_FULL_PRESET_DESCRIPTORS` and `ALTAIR_FULL_PRESET_PLUGIN_IDS` list the
plugins in install order, for tooling that wants the same information.

## License

MPL-2.0. See [LICENSE](LICENSE).

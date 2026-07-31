# Altair Full Preset

Recommended authoring plugins for Altair.

```sh
pnpm add @haneoka/altair-preset-full
```

```ts
const installation = await installAltairFullPreset(host, plugins);
await installation.dispose();
```

Applications provide the plugin modules they want to install. The preset resolves dependencies and installation order without downloading or executing catalog entries.

MPL-2.0.

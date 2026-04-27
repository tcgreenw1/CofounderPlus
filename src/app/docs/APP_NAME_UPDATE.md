# App Name Update: "Cofounder+"

I have updated the configuration to ensure your app appears as "Cofounder+" on the home screen.

## CHANGES MADE

1. **Capacitor Config (`capacitor.config.json`):** Updated `appName` to `Cofounder+`.
2. **Web Index (`index.html`):** Updated `<title>` to `Cofounder+`.

## REQUIRED ACTIONS

To apply this name change to the actual iOS app, you must run the sync command again:

```bash
npx cap sync ios
```

After syncing, rebuild the app in Xcode to see the new name on the simulator or device.

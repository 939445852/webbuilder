import "./..\\shell\\shell.js";
import*as ke from "./..\\..\\core\\i18n\\i18n.js";
import*as Ee from "./..\\..\\core\\root\\root.js";
import*as ce from "./..\\..\\core\\sdk\\sdk.js";
import*as w from "./..\\..\\ui\\legacy\\legacy.js";
var c = {
    showEventListenerBreakpoints: "Show Event Listener Breakpoints",
    eventListenerBreakpoints: "Event Listener Breakpoints",
    showCspViolationBreakpoints: "Show CSP Violation Breakpoints",
    cspViolationBreakpoints: "CSP Violation Breakpoints",
    showXhrfetchBreakpoints: "Show XHR/fetch Breakpoints",
    xhrfetchBreakpoints: "XHR/fetch Breakpoints",
    showDomBreakpoints: "Show DOM Breakpoints",
    domBreakpoints: "DOM Breakpoints",
    showGlobalListeners: "Show Global Listeners",
    globalListeners: "Global Listeners",
    page: "Page",
    showPage: "Show Page",
    overrides: "Overrides",
    showOverrides: "Show Overrides",
    contentScripts: "Content scripts",
    showContentScripts: "Show Content scripts",
    refreshGlobalListeners: "Refresh global listeners"
}, To = ke.i18n.registerUIStrings("panels/browser_debugger/browser_debugger-meta.ts", c), g = ke.i18n.getLazilyComputedLocalizedString.bind(void 0, To), le;
async function L() {
    return le || (le = await import("./..\\..\\panels\\browser_debugger\\browser_debugger.js")),
    le
}
function Do(e) {
    return le === void 0 ? [] : e(le)
}
var Le;
async function Ie() {
    return Le || (Le = await import("./..\\..\\panels\\sources\\sources.js")),
    Le
}
w.ViewManager.registerViewExtension({
    location: "navigator-view",
    id: "navigator-network",
    title: g(c.page),
    commandPrompt: g(c.showPage),
    order: 2,
    persistence: "permanent",
    async loadView() {
        return (await Ie()).SourcesNavigator.NetworkNavigatorView.instance()
    }
});
w.ViewManager.registerViewExtension({
    location: "navigator-view",
    id: "navigator-overrides",
    title: g(c.overrides),
    commandPrompt: g(c.showOverrides),
    order: 4,
    persistence: "permanent",
    condition: () => !Ee.Runtime.Runtime.isTraceApp(),
    async loadView() {
        return (await Ie()).SourcesNavigator.OverridesNavigatorView.instance()
    }
});
w.ViewManager.registerViewExtension({
    location: "navigator-view",
    id: "navigator-content-scripts",
    title: g(c.contentScripts),
    commandPrompt: g(c.showContentScripts),
    order: 5,
    persistence: "permanent",
    condition: () => Ee.Runtime.getPathName() !== "/bundled/worker_app.html" && !Ee.Runtime.Runtime.isTraceApp(),
    async loadView() {
        let e = await Ie();
        return new e.SourcesNavigator.ContentScriptsNavigatorView
    }
});
w.ActionRegistration.registerActionExtension({
    category: "DEBUGGER",
    actionId: "browser-debugger.refresh-global-event-listeners",
    async loadActionDelegate() {
        let e = await L();
        return new e.ObjectEventListenersSidebarPane.ActionDelegate
    },
    title: g(c.refreshGlobalListeners),
    iconClass: "refresh",
    contextTypes() {
        return Do(e => [e.ObjectEventListenersSidebarPane.ObjectEventListenersSidebarPane])
    }
});
w.ContextMenu.registerProvider({
    contextTypes() {
        return [ce.DOMModel.DOMNode]
    },
    async loadProvider() {
        let e = await L();
        return new e.DOMBreakpointsSidebarPane.ContextMenuProvider
    },
    experiment: void 0
});
w.Context.registerListener({
    contextTypes() {
        return [ce.DebuggerModel.DebuggerPausedDetails]
    },
    async loadListener() {
        return (await L()).XHRBreakpointsSidebarPane.XHRBreakpointsSidebarPane.instance()
    }
});
w.Context.registerListener({
    contextTypes() {
        return [ce.DebuggerModel.DebuggerPausedDetails]
    },
    async loadListener() {
        return (await L()).DOMBreakpointsSidebarPane.DOMBreakpointsSidebarPane.instance()
    }
});
import*as me from "./..\\..\\core\\common\\common.js";
import*as _e from "./..\\..\\core\\i18n\\i18n.js";
import*as qe from "./..\\..\\ui\\legacy\\legacy.js";
var t = {
    sensors: "Sensors",
    geolocation: "geolocation",
    timezones: "timezones",
    locale: "locale",
    locales: "locales",
    accelerometer: "accelerometer",
    deviceOrientation: "device orientation",
    locations: "Locations",
    touch: "Touch",
    devicebased: "Device-based",
    forceEnabled: "Force enabled",
    emulateIdleDetectorState: "Emulate Idle Detector state",
    noIdleEmulation: "No idle emulation",
    userActiveScreenUnlocked: "User active, screen unlocked",
    userActiveScreenLocked: "User active, screen locked",
    userIdleScreenUnlocked: "User idle, screen unlocked",
    userIdleScreenLocked: "User idle, screen locked",
    showSensors: "Show Sensors",
    showLocations: "Show Locations",
    cpuPressure: "CPU Pressure",
    noPressureEmulation: "No override",
    nominal: "Nominal",
    fair: "Fair",
    serious: "Serious",
    critical: "Critical"
}, Io = _e.i18n.registerUIStrings("panels/sensors/sensors-meta.ts", t), o = _e.i18n.getLazilyComputedLocalizedString.bind(void 0, Io), He;
async function Gt() {
    return He || (He = await import("./..\\..\\panels\\sensors\\sensors.js")),
    He
}
qe.ViewManager.registerViewExtension({
    location: "drawer-view",
    commandPrompt: o(t.showSensors),
    title: o(t.sensors),
    id: "sensors",
    persistence: "closeable",
    order: 100,
    async loadView() {
        let e = await Gt();
        return new e.SensorsView.SensorsView
    },
    tags: [o(t.geolocation), o(t.timezones), o(t.locale), o(t.locales), o(t.accelerometer), o(t.deviceOrientation)]
});
qe.ViewManager.registerViewExtension({
    location: "settings-view",
    id: "emulation-locations",
    commandPrompt: o(t.showLocations),
    title: o(t.locations),
    order: 40,
    async loadView() {
        let e = await Gt();
        return new e.LocationsSettingsTab.LocationsSettingsTab
    },
    settings: ["emulation.locations"],
    iconName: "location-on"
});
me.Settings.registerSettingExtension({
    storageType: "Synced",
    settingName: "emulation.locations",
    settingType: "array",
    defaultValue: [{
        title: "Berlin",
        lat: 52.520007,
        long: 13.404954,
        timezoneId: "Europe/Berlin",
        locale: "de-DE",
        accuracy: 150
    }, {
        title: "London",
        lat: 51.507351,
        long: -.127758,
        timezoneId: "Europe/London",
        locale: "en-GB",
        accuracy: 150
    }, {
        title: "Moscow",
        lat: 55.755826,
        long: 37.6173,
        timezoneId: "Europe/Moscow",
        locale: "ru-RU",
        accuracy: 150
    }, {
        title: "Mountain View",
        lat: 37.386052,
        long: -122.083851,
        timezoneId: "America/Los_Angeles",
        locale: "en-US",
        accuracy: 150
    }, {
        title: "Mumbai",
        lat: 19.075984,
        long: 72.877656,
        timezoneId: "Asia/Kolkata",
        locale: "mr-IN",
        accuracy: 150
    }, {
        title: "San Francisco",
        lat: 37.774929,
        long: -122.419416,
        timezoneId: "America/Los_Angeles",
        locale: "en-US",
        accuracy: 150
    }, {
        title: "Shanghai",
        lat: 31.230416,
        long: 121.473701,
        timezoneId: "Asia/Shanghai",
        locale: "zh-Hans-CN",
        accuracy: 150
    }, {
        title: "S\xE3o Paulo",
        lat: -23.55052,
        long: -46.633309,
        timezoneId: "America/Sao_Paulo",
        locale: "pt-BR",
        accuracy: 150
    }, {
        title: "Tokyo",
        lat: 35.689487,
        long: 139.691706,
        timezoneId: "Asia/Tokyo",
        locale: "ja-JP",
        accuracy: 150
    }]
});
me.Settings.registerSettingExtension({
    title: o(t.cpuPressure),
    reloadRequired: !0,
    settingName: "emulation.cpu-pressure",
    settingType: "enum",
    defaultValue: "none",
    options: [{
        value: "none",
        title: o(t.noPressureEmulation),
        text: o(t.noPressureEmulation)
    }, {
        value: "nominal",
        title: o(t.nominal),
        text: o(t.nominal)
    }, {
        value: "fair",
        title: o(t.fair),
        text: o(t.fair)
    }, {
        value: "serious",
        title: o(t.serious),
        text: o(t.serious)
    }, {
        value: "critical",
        title: o(t.critical),
        text: o(t.critical)
    }]
});
me.Settings.registerSettingExtension({
    title: o(t.touch),
    reloadRequired: !0,
    settingName: "emulation.touch",
    settingType: "enum",
    defaultValue: "none",
    options: [{
        value: "none",
        title: o(t.devicebased),
        text: o(t.devicebased)
    }, {
        value: "force",
        title: o(t.forceEnabled),
        text: o(t.forceEnabled)
    }]
});
me.Settings.registerSettingExtension({
    title: o(t.emulateIdleDetectorState),
    settingName: "emulation.idle-detection",
    settingType: "enum",
    defaultValue: "none",
    options: [{
        value: "none",
        title: o(t.noIdleEmulation),
        text: o(t.noIdleEmulation)
    }, {
        value: '{"isUserActive":true,"isScreenUnlocked":true}',
        title: o(t.userActiveScreenUnlocked),
        text: o(t.userActiveScreenUnlocked)
    }, {
        value: '{"isUserActive":true,"isScreenUnlocked":false}',
        title: o(t.userActiveScreenLocked),
        text: o(t.userActiveScreenLocked)
    }, {
        value: '{"isUserActive":false,"isScreenUnlocked":true}',
        title: o(t.userIdleScreenUnlocked),
        text: o(t.userIdleScreenUnlocked)
    }, {
        value: '{"isUserActive":false,"isScreenUnlocked":false}',
        title: o(t.userIdleScreenLocked),
        text: o(t.userIdleScreenLocked)
    }]
});
import*as Ae from "./..\\..\\core\\common\\common.js";
import*as at from "./..\\..\\core\\i18n\\i18n.js";
import*as O from "./..\\..\\ui\\legacy\\legacy.js";
var d = {
    rendering: "Rendering",
    showRendering: "Show Rendering",
    paint: "paint",
    layout: "layout",
    fps: "fps",
    cssMediaType: "CSS media type",
    cssMediaFeature: "CSS media feature",
    visionDeficiency: "vision deficiency",
    colorVisionDeficiency: "color vision deficiency",
    reloadPage: "Reload page",
    hardReloadPage: "Hard reload page",
    forceAdBlocking: "Force ad blocking on this site",
    blockAds: "Block ads on this site",
    showAds: "Show ads on this site, if allowed",
    autoOpenDevTools: "Auto-open DevTools for popups",
    doNotAutoOpen: "Do not auto-open DevTools for popups",
    disablePaused: "Disable paused state overlay",
    toggleCssPrefersColorSchemeMedia: "Toggle CSS media feature prefers-color-scheme"
}, Uo = at.i18n.registerUIStrings("entrypoints/inspector_main/inspector_main-meta.ts", d), m = at.i18n.getLazilyComputedLocalizedString.bind(void 0, Uo), rt;
async function te() {
    return rt || (rt = await import("./..\\inspector_main\\inspector_main.js")),
    rt
}
O.ViewManager.registerViewExtension({
    location: "drawer-view",
    id: "rendering",
    title: m(d.rendering),
    commandPrompt: m(d.showRendering),
    persistence: "closeable",
    order: 50,
    async loadView() {
        let e = await te();
        return new e.RenderingOptions.RenderingOptionsView
    },
    tags: [m(d.paint), m(d.layout), m(d.fps), m(d.cssMediaType), m(d.cssMediaFeature), m(d.visionDeficiency), m(d.colorVisionDeficiency)]
});
O.ActionRegistration.registerActionExtension({
    category: "NAVIGATION",
    actionId: "inspector-main.reload",
    async loadActionDelegate() {
        let e = await te();
        return new e.InspectorMain.ReloadActionDelegate
    },
    iconClass: "refresh",
    title: m(d.reloadPage),
    bindings: [{
        platform: "windows,linux",
        shortcut: "Ctrl+R"
    }, {
        platform: "windows,linux",
        shortcut: "F5"
    }, {
        platform: "mac",
        shortcut: "Meta+R"
    }]
});
O.ActionRegistration.registerActionExtension({
    category: "NAVIGATION",
    actionId: "inspector-main.hard-reload",
    async loadActionDelegate() {
        let e = await te();
        return new e.InspectorMain.ReloadActionDelegate
    },
    title: m(d.hardReloadPage),
    bindings: [{
        platform: "windows,linux",
        shortcut: "Shift+Ctrl+R"
    }, {
        platform: "windows,linux",
        shortcut: "Shift+F5"
    }, {
        platform: "windows,linux",
        shortcut: "Ctrl+F5"
    }, {
        platform: "windows,linux",
        shortcut: "Ctrl+Shift+F5"
    }, {
        platform: "mac",
        shortcut: "Shift+Meta+R"
    }]
});
O.ActionRegistration.registerActionExtension({
    actionId: "rendering.toggle-prefers-color-scheme",
    category: "RENDERING",
    title: m(d.toggleCssPrefersColorSchemeMedia),
    async loadActionDelegate() {
        let e = await te();
        return new e.RenderingOptions.ReloadActionDelegate
    }
});
Ae.Settings.registerSettingExtension({
    category: "NETWORK",
    title: m(d.forceAdBlocking),
    settingName: "network.ad-blocking-enabled",
    settingType: "boolean",
    storageType: "Session",
    defaultValue: !1,
    options: [{
        value: !0,
        title: m(d.blockAds)
    }, {
        value: !1,
        title: m(d.showAds)
    }]
});
Ae.Settings.registerSettingExtension({
    category: "GLOBAL",
    storageType: "Synced",
    title: m(d.autoOpenDevTools),
    settingName: "auto-attach-to-created-pages",
    settingType: "boolean",
    order: 2,
    defaultValue: !1,
    options: [{
        value: !0,
        title: m(d.autoOpenDevTools)
    }, {
        value: !1,
        title: m(d.doNotAutoOpen)
    }]
});
Ae.Settings.registerSettingExtension({
    category: "APPEARANCE",
    storageType: "Synced",
    title: m(d.disablePaused),
    settingName: "disable-paused-state-overlay",
    settingType: "boolean",
    defaultValue: !1
});
O.Toolbar.registerToolbarItem({
    async loadItem() {
        return (await te()).InspectorMain.NodeIndicatorProvider.instance()
    },
    order: 2,
    location: "main-toolbar-left"
});
O.Toolbar.registerToolbarItem({
    async loadItem() {
        return (await te()).OutermostTargetSelector.OutermostTargetSelector.instance()
    },
    order: 97,
    location: "main-toolbar-right"
});

import*as Eo from "./..\\..\\core\\root\\root.js";
import*as So from "./..\\main\\main.js";
self.runtime = Eo.Runtime.Runtime.instance({
    forceNew: !0
});
new So.MainImpl.MainImpl;
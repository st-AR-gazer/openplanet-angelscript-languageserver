Meta::Plugin@ pluginMeta = Meta::ExecutingPlugin();
const string  pluginNameHash = Crypto::MD5(pluginMeta.Name);
const string  menuIconColor = "\\$" + pluginNameHash.SubStr(0, 3);
const string  pluginIcon = _Text::GetRandomIcon(pluginNameHash); // Replace with an apropriate specific icon
const string  menuTitle = menuIconColor + pluginIcon + "\\$z " + pluginMeta.Name;
const string  g_PluginStorageRoot = IO::FromStorageFolder("");
const bool    g_IsOpDevCompileCheckInstance = pluginMeta.Name.EndsWith("__opdev")
    || pluginMeta.ID.EndsWith("__opdev")
    || g_PluginStorageRoot.Contains("__opdev");
string g_FilterInput = "";

void Main() {
    // Hide dependency-provided UiNav Dev tab in this plugin's settings page.
    S_ShowUiNavDev = false;
    while (true) {
        // Service UiNav dump requests from OpDevCompanion while this plugin is active.
        UiNav::Dump::TickRequestPump();
        if (!g_IsOpDevCompileCheckInstance) {
            ScoresTableFilter::Update();
        }
        yield();
    }
}

void RenderInterface() {
    if (!S_Enabled || (S_HideWithGame && !UI::IsGameUIVisible()) || (S_HideWithOP && !UI::IsOverlayShown())) { return; }

    if (UI::Begin(menuTitle + "###main-" + pluginMeta.ID, S_Enabled, UI::WindowFlags::None)) {
        RenderWindow();
    }
    UI::End();
}

void RenderMenu() {
    if (UI::MenuItem(menuTitle, "", S_Enabled)) {
        S_Enabled = !S_Enabled;
    }
}

void RenderWindow() {
    UI::Text("ScoresTable Filter");
    UI::Separator();

    ScoresTableFilter::S_Enable = UI::Checkbox("Enable filter layer", ScoresTableFilter::S_Enable);
    ScoresTableFilter::S_FilterLiveRankingPlayers = UI::Checkbox("Filter players in live ranking", ScoresTableFilter::S_FilterLiveRankingPlayers);
    ScoresTableFilter::S_UseCustomListOverlayWhenFiltering = UI::Checkbox(
        "Use custom list overlay",
        ScoresTableFilter::S_UseCustomListOverlayWhenFiltering
    );

    UI::Separator();
    UI::Text("Manual Filter Input");
    UI::TextWrapped("Type here to apply a filter immediately. Keyboard capture still works when the scores table is open.");

    string liveFilter = ScoresTableFilter::GetFilterText();
    if (g_FilterInput != liveFilter) g_FilterInput = liveFilter;
    string nextFilter = UI::InputText("Filter text", g_FilterInput);
    if (nextFilter != g_FilterInput) {
        g_FilterInput = nextFilter;
        ScoresTableFilter::SetFilterText(nextFilter);
    }

    if (UI::Button("Clear filter")) {
        g_FilterInput = "";
        ScoresTableFilter::SetFilterText("");
    }

    UI::SameLine();
    UI::Text(ScoresTableFilter::IsFilterActive() ? "Filter: active" : "Filter: idle");
    UI::Text(ScoresTableFilter::IsScoresTableOpen() ? "Scores table: open" : "Scores table: closed");

    UI::Separator();
    UI::Text("Debug");
    ScoresTableFilter::S_Debug = UI::Checkbox("Show debug window", ScoresTableFilter::S_Debug);
    ScoresTableFilter::S_DiagStepLogs = UI::Checkbox("Diag step logs", ScoresTableFilter::S_DiagStepLogs);
}

void Render() {
    if (g_IsOpDevCompileCheckInstance) return;
    ScoresTableFilter::Render();
}

UI::InputBlocking OnKeyPress(bool down, VirtualKey key) {
    if (g_IsOpDevCompileCheckInstance) return UI::InputBlocking::DoNothing;
    return ScoresTableFilter::OnKeyPress(down, key);
}

void OnDisabled() {
    if (g_IsOpDevCompileCheckInstance) return;
    ScoresTableFilter::ResetAll();
}

void OnDestroyed() {
    if (g_IsOpDevCompileCheckInstance) return;
    ScoresTableFilter::ResetAll();
}

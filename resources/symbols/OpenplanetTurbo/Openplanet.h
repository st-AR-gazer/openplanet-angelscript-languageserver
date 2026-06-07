// Maniaplanet engine classes documentation for 2016-11-07 16:15:45
// Generated with Openplanet 1.28.0 (turbo, Public, 2025-08-16)
// https://openplanet.dev/

using namespace MwFoundations;
using namespace Game;
using namespace Graphic;
using namespace Function;
using namespace Hms;
using namespace Control;
using namespace Motion;
using namespace Plug;
using namespace Scene;
using namespace System;
using namespace Vision;
using namespace Audio;
using namespace Script;
using namespace Net;
using namespace Input;
using namespace Xml;
using namespace TrackMania;
using namespace ShootMania;
using namespace GameData;

namespace MwFoundations {

struct CMwNod {
  CMwNod();

  string IdName;
  const MwId Id; // Maniascript
};

struct CMwEngine : public CMwNod {
  CMwEngine();

};

struct CMwCmd : public CMwNod {
};

struct CMwParam : public CMwNod {
  CMwParam();

};

struct CMwParamClass : public CMwParam {
  CMwParamClass();

};

struct CMwParamStruct : public CMwParam {
  CMwParamStruct();

};

struct CMwParamAction : public CMwParam {
  CMwParamAction();

};

struct CMwParamBool : public CMwParam {
  CMwParamBool();

};

struct CMwParamEnum : public CMwParam {
  CMwParamEnum();

};

struct CMwParamInteger : public CMwParam {
  CMwParamInteger();

};

struct CMwParamIntegerRange : public CMwParamInteger {
  CMwParamIntegerRange();

};

struct CMwParamNatural : public CMwParam {
  CMwParamNatural();

};

struct CMwParamNaturalRange : public CMwParamNatural {
  CMwParamNaturalRange();

};

struct CMwCmdFastCall : public CMwCmd {
};

struct CMwParamReal : public CMwParam {
  CMwParamReal();

};

struct CMwParamRealRange : public CMwParamReal {
  CMwParamRealRange();

};

struct CMwParamString : public CMwParam {
  CMwParamString();

};

struct CMwParamVec3 : public CMwParamStruct {
  CMwParamVec3();

  float x;
  float y;
  float z;
};

struct CMwParamIso3 : public CMwParamStruct {
  CMwParamIso3();

  const float AxeXx;
  const float AxeXy;
  const float AxeYx;
  const float AxeYy;
  float tx;
  float ty;
};

struct CMwParamColor : public CMwParamStruct {
  CMwParamColor();

  float r;
  float g;
  float b;
};

struct CMwParamVec2 : public CMwParamStruct {
  CMwParamVec2();

  float x;
  float y;
};

struct CMwParamIso4 : public CMwParamStruct {
  CMwParamIso4();

  const float AxeXx;
  const float AxeXy;
  const float AxeXz;
  const float AxeYx;
  const float AxeYy;
  const float AxeYz;
  const float AxeZx;
  const float AxeZy;
  const float AxeZz;
  float tx;
  float ty;
  float tz;
};

struct CMwCmdBuffer : public CMwNod {
  CMwCmdBuffer();

  const MwFastBufferCat<CMwCmd*> Cmds;
  const uint CmdCount;
};

struct CMwCmdFiber : public CMwCmd {
};

struct CMwParamVec4 : public CMwParamStruct {
  CMwParamVec4();

  float x;
  float y;
  float z;
  float w;
};

struct CMwCmdBufferCore : public CMwNod {
  CMwCmdBufferCore();

  const bool IsEnabled;
  const uint ComputerTime;
  const uint HumanTime;
  const uint GameTime;
  const uint SimulationTime;
  const float SimulationRelativeSpeed;
  float PeriodEstimated;
  float DeltaSmoothed;
  float PeriodSmoothing; // Range: 0 - 1
  float DeltaSmoothing; // Range: 0 - 1
  const bool IsLagForbidden;
};

struct CMwParamDataRef : public CMwParam {
  CMwParamDataRef();

};

struct CMwClassInfoViewer : public CMwNod {
  CMwClassInfoViewer();

  const uint ClassId;
};

struct CMwParamProc : public CMwParam {
  CMwParamProc();

};

// File extension: 'RefBuffer.Gbx'
struct CMwRefBuffer : public CMwNod {
  CMwRefBuffer();

  const uint Count;
  const MwFastBuffer<CMwNod*> Nods;
  const bool UseAddRefRelease;
  uint NodClassId;
};

struct CMwParamStringInt : public CMwParam {
  CMwParamStringInt();

};

struct CMwStatsValue : public CMwNod {
  uint NbMaxSamples;
  bool ComputeDeviatedMean;
  float StdDevRatio;
  bool ComputeMedian;
  uint ReductionRatio;
  bool ComputeBuckets;
  bool AutoBuckets;
  MwFastArray<float> BucketsRanges;
  void Log();
  const uint NbSamples;
  const string Summary;
  const float MeanInv;
  const float Mean;
  const float StdDev;
  const float Min;
  const float Max;
  const float Latest;
  const float Median;
  const float MedianStdDev;
  const float DeviatedMean;
  MwFastArray<float> BucketsRatio;
};

struct CMwCmdBlock : public CMwNod {
  CMwCmdBlock();

};

// File extension: 'Script.Gbx'
struct CMwCmdBlockMain : public CMwCmdBlock {
  CMwCmdBlockMain();

  const string ScriptText;
  CMwNod* const ThisClass;
};

struct CMwCmdContainer : public CMwNod {
  CMwCmdContainer();

};

struct CMwParamQuat : public CMwParamStruct {
  CMwParamQuat();

  float w;
  float x;
  float y;
  float z;
};

struct CMwCmdFastCallUser : public CMwCmd {
};

struct CMwParamInt3 : public CMwParamStruct {
  CMwParamInt3();

  int x;
  int y;
  int z;
};

struct CMwParamNat3 : public CMwParamStruct {
  CMwParamNat3();

  uint x;
  uint y;
  uint z;
};

struct CMwCmdFastCallStatic : public CMwCmd {
};

struct CMwCmdFastCallStaticParam : public CMwCmd {
};

struct CMwParamMwId : public CMwParam {
  CMwParamMwId();

};

} // namespace MwFoundations

namespace Game {

struct CGameEngine : public CMwEngine {
  CGameEngine();

};

// File extension: 'Title.Gbx'
struct CGameManiaTitle : public CGameNod {
  CGameManiaTitle();

  const string TitleId; // Maniascript
  const string BaseTitleId; // Maniascript
  const wstring Name; // Maniascript
  const wstring Desc; // Maniascript
  const string InfoUrl; // Maniascript
  const string DownloadUrl; // Maniascript
  const string TitleVersion; // Maniascript
  CPlugFileImg* LogosFid;
  string CollectionGroup;
  int SortIndex;
  CGameSkinnedNod* SkinnedBoxCase;
  CGameSkinnedNod* SkinnedLogosStyle;
  string StationManialinkUrl;
  string BoxCaseManialinkUrl;
  bool DisableStationQuickEnter;
  bool ScriptCloud_Enabled;
  CGameManiaTitleCore* TitleCoreFid;
  uint SmGameplayVersion;
  bool InternalAllowLegacyNonScriptModes;
  bool UnlockAdvancedCollectors;
  const MwFastBuffer<CGameCtnCollection*> CollectionFids;
  MwId VehicleIdentId;
  MwId VehicleIdentAuthor;
  MwId VehicleIdentCollection;
  const MwFastBuffer<CPlugFileSnd*> MusicFids;
  const MwFastBuffer<CGameCtnChallenge*> EditorSimpleChallengeFids;
  CPlugFileFidContainer* ModFid;
  string MenuMainManialinkUrl;
  CPlugFileImg* MenuBgFid;
  CSystemFidsFolder* MenuBgFolder;
  CGameCtnReplayRecord* MenuBgReplayFid;
  CPlugFileImg* MenuHeaderFid;
  CPlugFileSnd* MenuMusicFid;
  CGameManialink3dStyle* MenuStyle3dFid;
  CPlugFileImg* MenuSkyGradFid;
  CPlugFont* Hud3dFontFid;
  CPlugFileText* SoloModeFid;
  CPlugFileZip* SoloDataPackFid;
  CGameCtnCampaign* SoloCampaignFid;
  CPlugFileText* SoloPlaylistFid;
  int SoloCampaignMedals;
  CPlugFileText* NetModeFid;
  CPlugFileText* NetPlaylistFid;
  CPlugFileText* SplitScreenModeFid;
  CPlugFileText* SplitScreenPlaylistFid;
  CPlugFileText* EditorMapTypeFid;
  CGameCtnChallenge* AnimEditor_DefaultChallengeFid;
  uint ModelSkinInit;
};

// Description: "A player is the incarnation of the user in the playground."
struct CGamePlayer : public CMwNod {
  CGameMobil* const Mobil;
  CGamePlayerInfo* const User; // Maniascript
  const string Login; // Maniascript
  const wstring Name; // Maniascript
  const int RequestedClan; // Maniascript
  const bool RequestsSpectate; // Maniascript
};

struct CGameTerminal : public CMwNod {
  enum class CGameTerminal::ESpectatorCameraType {
    _SpectatorCam_Replay = 0, // |SpectatorCam|Replay
    _SpectatorCam_Follow = 1, // |SpectatorCam|Follow
    _SpectatorCam_Free = 2, // |SpectatorCam|Free
  };
  enum class CGameTerminal::ESpectatorCameraTarget {
    _SpectatorCam_Manual = 0, // |SpectatorCam|Manual
    _SpectatorCam_Auto = 1, // |SpectatorCam|Auto
  };
  CGamePlayer* ControlledPlayer;
  CGamePlayerCameraSet* const CameraSet;
  CGameCtnMediaClipPlayer* const MediaClipPlayer;
  CGameCtnMediaClipPlayer* const MediaAmbianceClipPlayer;
  void GetNextWantedCameraType();
  void GetNextWantedCameraTarget();
  CGameTerminal::ESpectatorCameraType SpectatorCameraType;
  CGameTerminal::ESpectatorCameraTarget SpectatorCameraTarget;
};

struct CGameApp : public CMwNod {
  CGameApp();

  void Start();
  void TerminateGame();
  CHmsViewport* const Viewport;
  CAudioPort* const AudioPort;
  CInputPort* const InputPort;
  CGameDialogs* const BasicDialogs;
  CGameSystemOverlay* const SystemOverlay;
  const MwFastBuffer<CGameMenu*> ActiveMenus;
  void ShowMenu(CGameMenu* Menu);
  void HideMenu(CGameMenu* Menu);
  void HeavyUpdate();
  const string OSUTCDate;
  const string OSLocalDate;
  const string OSUTCTime;
  const string OSLocalTime;
  CGameLoadProgress* const LoadProgress;
  string CmdLineUrlMptp;
  wstring BenchLoadingFolderName;
  CGameManialinkScriptHandler* const ScriptHandlerLiveMenu;
  CGameScriptBuddiesManager* const BuddiesManager;
  CGameAchievementScriptManager* const AchievementsScriptManager;
  CGameScriptNotificationsConsumer* const NotificationsConsumer;
  CGameScriptNotificationsProducer* const NotificationsProducer;
};

struct CGameMasterServer : public CNetMasterServer {
  const wstring SubscribeNickName;
  const wstring SubscribeNickNameNew;
  void Subscribe();
  void Connect();
  void Disconnect();
  void GetOnlineProfile();
  void UpdateOnlineProfile();
  void MailAccount();
  void SendCrashLogs();
  void SendGeneralCaps();
  void SendGfxPerformance();
  void SendMessages();
  void ReceiveMessages();
  uint RefreshOnlineNewsDoReply;
  MwFastBuffer<uint> FilesToSubmit;
  MwFastBuffer<uint> FilesToConfirm;
  const uint ReturnedError;
  const string ReturnedIP;
  const uint InboxMessagesCount;
  const uint OutboxMessagesCount;
  const MwFastBuffer<CGameRemoteBufferPool*> Pools;
  const MwFastBuffer<CGameRemoteBufferDataInfo*> RemoteDataInfos;
  void CheckDownloadToLaunch();
  const MwFastBuffer<CMwNod*> Downloads;
  const MwFastBuffer<CMwNod*> CurrentDownloads;
  uint Search_TimeToWait;
  const uint Search_Last;
  uint GetRankings_TimeToWait;
  const uint GetRankings_Last;
  CGameLeagueManager* const LeaguesManager;
  CGameLeagueManager* const SubscribedGroupsManager;
};

struct CGameMobil : public CMwNod {
  CGameMobil();

  CSceneMobil* const SceneMobil;
  const uint GameMobilId;
  const uint AudioGroupId;
  const uint ReplicaId;
};

// File extension: ''
struct CGameNod : public CMwNod {
};

// File extension: 'Menu.Gbx'
struct CGameMenu : public CMwNod {
  CGameMenu();

  enum class CGameMenu::EMenuOrder {
    Menu = 2,
    InGameMenu = 3,
    GameDialog = 5,
    SystemDialog = 8,
    BasicDialog = 11,
  };
  MwFastArray<CGameMenuFrame*> Frames;
  CGameMenuFrame* MainFrame;
  CGameMenuFrame* const CurrentFrame;
  CControlBase* const CurrentFocusedControl;
  CControlStyle* const CurrentFocusedControlStyle;
  CPlugSound* SoundDisplayed;
  CPlugSound* SoundHidden;
  CPlugSound* SoundPageChanged;
  CControlStyleSheet* StyleSheet;
  CPlugBitmap* BackgroundBitmapUnderlay;
  CScene3d* BackgroundScene;
  CSceneCamera* const BackgroundCamera;
  float BackgroundCameraFov;
  float BackgroundCameraNearZ;
  float BackgroundCameraFarZ;
  bool EnableFrameStack;
  void Back();
  void RedrawAll();
  vec3 FrustumCenter;
  vec3 FurstrumHfDiag;
  CScene2d* const Overlay;
  CGameMenu::EMenuOrder MenuOrder;
  vec2 GridStep;
};

struct CGameNetFormPlaygroundSync : public CNetNod {
  CGameNetFormPlaygroundSync();

};

// File extension: 'Frame.Gbx'
struct CGameMenuFrame : public CControlFrame {
  CGameMenuFrame();

  MwId AutoBackButtonId;
  CPlugSound* UpDownSound;
  CPlugSound* ShowSound;
  CMwCmdBlockMain* OnHideScript;
  CMwCmdBlockMain* OnBeforeShowScript;
  CMwCmdBlockMain* OnShowScript;
  CGameMenu* const Menu;
  CScene3d* FrameScene;
  void RunOnShowScripts();
  bool AllowBgCamera;
  uint NavigationDepth;
};

struct CGameSystemOverlay : public CMwNod {
  CScene2d* const Overlay;
  CScene2d* const PluginsMenuOverlayOverlay;
  uint HideDelay;
  void SwitchFullscreen();
  void MinimizeApp();
  void CloseApp();
  void OpenGraphicSettings();
  void OpenStereoscopySettings();
  void OpenInputSettings();
  void OpenInterfaceSettings();
  void OpenMessenger();
  void ThrobberOnAction();
  bool IconManiaPlanet_ShowHome;
  const bool ToolBarIsActive;
  wstring ToolTip;
  CGameManiaPlanetMenuStations* const MenuStations;
  CGameManialinkBrowser* const ManialinkBrowser;
  CGameScriptDebugger* const ScriptDebugger;
  wstring NadeoLiveSubPageUrl;
};

struct CGamePlayground : public CGameSwitcherModule {
  CGamePlaygroundInterface* const Interface; // Maniascript
  const MwFastBuffer<CGamePlayer*> Players;
  const MwFastBuffer<CGameTerminal*> GameTerminals;
  const MwFastBuffer<CGamePlaygroundUIConfig*> UIConfigs;
  CGameCtnReplayRecord* const ReplayRecord;
  CGameCtnReplayRecord* PrevReplayRecord;
  CGamePlaygroundSpectating* const Spectating;
  bool GameTerminals_IsBlackOut;
  bool GameTerminals_BlackOut_Auto2dVr;
  CGameAnalyzer* Analyzer;
};

struct CGameNetPlayerInfo : public CMwNod {
  enum class CGameNetPlayerInfo::EPlayerType {
    Human = 0,
    Fake = 1, // Fake (not net)
    Net = 2,
    Replay = 3,
  };
  enum class CGameNetPlayerInfo::ESpectatorMode {
    Void = 0,
    Watcher = 1,
    LocalWatcher = 2,
    Target = 3,
  };
  const uint DbgPlayerUid;
  bool Live_IsRegisteredToMasterServer;
  bool Live_HasRetrieveTimeLeft;
  const bool Live_Updating;
  const bool Live_RetrievingTimeLeft;
  const uint Live_UpdateLastTime;
  const uint LiveUpdate_Counter;
  const CGameNetPlayerInfo::EPlayerType PlayerType;
  const uint State;
  const uint ChallengeSequenceNumber;
  const uint LatestNetUpdate;
  const uint DownloadRate;
  const uint UploadRate;
  bool CustomDataDeactivated;
  const uint NbSpectators;
  CGameNetPlayerInfo::ESpectatorMode SpectatorMode;
};

struct CGameNetwork : public CMwNod {
  CGameNetServerInfo* ServerInfo;
  CNetMasterServer* const MasterServer;
  CNetFileTransfer* const FileTransfer;
  const MwFastBuffer<CSystemPackDesc*> PackDescs;
  CSystemFidsFolder* const LocationPacksContent;
  const bool IsMultiInternet;
  const bool IsEnabled;
  const bool IsServer;
  CNetServer* const Server;
  CNetClient* const Client;
  const MwFastBuffer<CGameNetServerInfo*> OnlineServers;
  const MwFastBuffer<CGameNetServerInfo*> OnlinePlayers;
  MwFastBuffer<CGameNetPlayerInfo*> PlayerInfos;
  void FindServers();
  CGamePlaygroundUIConfigMgr* const UIConfigMgr;
  float VoteDefaultRatio;
  uint CallVoteTimeOut;
  uint CallVotePercent;
  const bool InCallvote;
  const uint VoteNbYes;
  const uint VoteNbNo;
  const MwFastBuffer<wstring> ChatHistoryText;
  const MwFastBuffer<uint> ChatHistoryUid;
  const MwFastBuffer<uint> ChatHistoryTimestamp;
  const MwFastBuffer<wstring> ChatHistoryLines;
  const MwFastBuffer<CSystemData*> ManialinkDataCache;
  const uint RecvNetRate;
  const uint SendNetRate;
  const float PacketLossRate;
  const string RecvNetRatePretty;
  const string SendNetRatePretty;
  const uint CanDoUDP;
  const int LatestGamePing;
  const int LatestHumanPing;
  const float LatestEpsilon;
  const float SmoothedEpsilon;
  const uint TotalSendingSize;
  const uint TotalReceivingSize;
  const uint TotalHttpReceivingSize;
  const uint TotalTcpUdpReceivingSize;
  const uint TcpReceivingSize;
  const uint UdpReceivingSize;
  const uint TcpSendingSize;
  const uint UdpSendingSize;
  const uint NbrTotalConnection;
  const uint NbrConnectionsDone;
  const uint NbrConnectionsDisconnecting;
  const uint NbrConnectionsInProgress;
  const uint NbrConnectionsPending;
  const uint NbrAcceptPerSecond;
  const uint NbrNewConnectionPerSecond;
};

struct CGameNetFormTunnel : public CGameNetForm {
  CGameNetFormTunnel();

};

struct CGameManiaPlanetNetwork : public CGameCtnNetwork {
};

struct CGameManiaTitleCore : public CGameNod {
  const wstring DisplayName;
  CGameManiaPlanet* const ManiaPlanet;
  CGameCtnCollection* CollectionCommonFid;
  wstring ModeScriptFolderName;
  bool WithLocalMultiplayer;
};

// File extension: 'ManiaPlanet.Gbx'
struct CGameManiaPlanet : public CGameCtnApp {
  CGameManiaPlanet();

  CSystemFidsFolder* ManiaTitlesFolder;
  CGameCoverFlowDesc* CoverFlowDesc;
  CPlugFileImg* TitleMainDefaultBgFid;
  CControlStyleSheet* DefaultStyleSheet;
  void ScanDiskForManiaTitles();
  const MwFastBuffer<CGameManiaTitle*> ManiaTitles;
  const MwFastBuffer<CGameStation*> Stations;
  CGameManiaTitle* const LoadedManiaTitle;
  CGameManiaTitleCore* const LoadedCore;
  CGameManiaPlanetScriptAPI* const ManiaPlanetScriptAPI;
  CGameManiaTitleFlowScriptAPI* const ManiaTitleFlowScriptAPI;
  string StartupManiaTitle;
  void Operation_Abort();
  const bool Operation_InProgress;
  CGameCtnMenusManiaPlanet* MenuManager;
  void BackToMainMenu();
};

struct CGameStation : public CGameNod {
  CGameManiaTitle* const Title; // Maniascript
  const uint AudienceRegisteredUsers; // Maniascript
  const uint AudienceInstalls;
  const uint AudienceOnlineUsers;
  const uint CampaignMedalsMax; // Maniascript
  const uint CampaignMedalsCurrent; // Maniascript
  const uint CampaignMedalsRanking; // Maniascript
  const float LadderPoints; // Maniascript
  const uint LadderRank; // Maniascript
  const string ManialinkViewer_Url;
  CGameManialinkPage* const ManialinkViewer_Page;
};

// Description: "Manialink entry."
struct CGameManialinkEntry : public CGameManialinkControl {
  enum class CGameManialinkEntry::ETextFormat {
    Basic = 0,
    Script = 1,
    Password = 2,
    Newpassword = 3,
  };
  wstring Value; // Maniascript
  void StartEdition(); // Maniascript
  CGameManialinkEntry::ETextFormat TextFormat; // Maniascript
  float Opacity; // Maniascript
  vec3 TextColor; // Maniascript
  float TextSizeReal; // Maniascript
  uint TextSize; // Maniascript
  int MaxLine; // Maniascript
  bool AutoNewLine; // Maniascript
};

struct CGameScene : public CMwNod {
  CGamePlaygroundResources* Resources;
  const MwFastBuffer<CGameMobil*> GameMobils;
  CScene3d* Scene;
  CGameEnvironmentManager* const EnvironmentManager;
  CGameHud3d* const Hud3d;
  CGameMgrActionFxVis* const MgrActionFxVis;
  CSceneMobil* MarksMobil;
  const MwFastBuffer<CPlugDecalModel*> ChallengeDecals_Models;
  CHmsVisMiniMap* MiniMap;
};

// File extension: 'ColorEffect.Gbx'
struct CGameMenuColorEffect : public CControlEffect {
  CGameMenuColorEffect();

  MwFastArray<CFuncFullColorGradient*> ColorsBeam;
  MwFastArray<float> ColorPeriods;
  MwFastArray<float> BeamWidths;
  MwFastArray<float> InterWidths;
  float Period;
  bool IsBeamColorEvolving;
  bool IsBeamMoving;
  bool IsMoveHalf;
  bool IsMoveInverse;
  bool IsColorEvolveHalf;
  bool IsColorEvolveInverse;
  bool ForceFirstColorWord;
  bool ForceNoMove;
};

struct CGameCtnCollectorList : public CMwNod {
  CGameCtnCollectorList();

  const uint Bob;
  const MwFastBuffer<MwId> BlockStockIds;
  MwFastBuffer<uint> BlockStockNbAvailables;
};

struct CGameCtnChapter : public CMwNod {
  CGameCtnChapter();

  CSystemFidFile* const CollectionFid;
  const wstring LongDesc;
  const MwFastBuffer<CGameCtnArticle*> Articles;
  vec2 MapCoordElem;
  vec2 MapCoordIcon;
  vec2 MapCoordDesc;
  CSystemFidFile* const Icon;
  const bool Unlocked;
};

struct CGameCtnCatalog : public CMwNod {
  CGameCtnCatalog();

  const MwFastBuffer<CGameCtnChapter*> Chapters;
};

struct CGameCtnArticle : public CMwNod {
  CGameCtnArticle();

  const wstring Name;
  CSystemFidFile* const CollectorFid;
  const bool IsLoaded;
  void Preload();
  void Purge();
  const MwId IdentId;
  UnnamedEnum CollectionId;
  const MwId IdentAuthor;
  CPlugBitmap* const BitmapIcon;
  CPlugGameSkin* const GameSkin;
  const MwFastBuffer<CSystemPackDesc*> SkinPackDescs;
  uint CurrentSkin;
  uint NbAvailableCurrent;
  uint NbAvailableMax;
  UnnamedEnum ArticleDataLocation;
  const string PageName;
  const string ShortcutString;
  const string AmountString;
};

struct CGameNetOnlineEvent : public CMwNod {
  const uint Id;
  uint Priority;
  const string StartDate;
  const string EndDate;
  wstring Path;
  wstring SenderName;
  wstring Title;
  wstring Content;
  wstring ManiaCodeText;
  string ManiaCode;
};

struct CGameCtnPlayground : public CGamePlayground {
  CGameScene* const GameScene;
  CGameCtnGhost* const PlayerRecordedGhost;
  CGameCtnGhost* const PlayerBestGhost;
  CGameCtnChallengeScript* const ChallengeScript;
};

struct CGameNetOnlineNews : public CGameNetOnlineEvent {
};

struct CGameCamera : public CMwNod {
  CGameCamera();

  CSceneCamera* SceneCamera;
  const uint GroupIndex;
};

// File extension: 'GameCtnMediaBlock3dStereo.gbx'
struct CGameCtnMediaBlock3dStereo : public CGameCtnMediaBlock {
  CGameCtnMediaBlock3dStereo();

  float Separation;
  float ScreenDist;
};

struct CGameNetTeamInfo : public CMwNod {
  wstring Path;
  wstring Name;
  wstring Description;
  CSystemData* const Logo;
  uint MembersCount;
  uint Wins;
  uint Losses;
  uint Draws;
  uint Ranking;
  MwFastBuffer<string> MembersLogin;
  MwFastBuffer<wstring> MembersNickName;
};

struct CGameMasterServerRequest : public CNetMasterServerRequest {
};

struct CGameAvatar : public CMwNod {
  CSystemPackDesc* const PackDesc;
};

struct CGameNetOnlineMessage : public CMwNod {
  CGameNetOnlineMessage();

  string ReceiverLogin;
  string SenderLogin;
  wstring Subject;
  wstring Message;
  uint Donation;
};

// File extension: 'GameCtnMediaBlockTriangles.gbx'
struct CGameCtnMediaBlockTriangles : public CGameCtnMediaBlock {
  CSceneMobil* const Mobil;
};

struct CGameRemoteBuffer : public CMwNod {
  CMwNod* const LocalData;
  const string LastServerUpdate;
  const bool UseRefs;
  enum class CGameRemoteBuffer::EMode {
    None = 0,
    Get = 1,
    Set = 2,
    Get_Set = 3, // Get/Set
  };
  const CGameRemoteBuffer::EMode Mode;
  const uint TotalCount;
  const uint SpecificCount;
  const uint PerPageCount;
  const uint CacheDuration;
  const uint RegisteredUsersCount;
  MwFastBuffer<CMwNod*> Datas;
};

struct CGameRemoteBufferPool : public CMwNod {
  CGameRemoteBufferDataInfo* const DataInfo;
  const uint BuffersCount;
};

struct CGameRemoteBufferDataInfo : public CMwNod {
  uint Default_CacheDuration;
  uint Default_PerPageCount;
};

// File extension: 'GameResources.Gbx'
struct CGameResources : public CMwNod {
  CGameResources();

  MwFastArray<CPlugSound*> Sounds;
  const MwFastArray<CAudioSource*> AudioSources;
  CSystemFidsFolder* HymnsFolder;
  CSystemFidsFolder* MenuBackgroundsFolder;
  CSystemFidsFolder* FolderGlobalEnvBanners;
  CMwNod* EditorSpawnHelper;
  CPlugBitmap* BitmapCubeMenuManiaPlanet3d;
  CPlugMaterial* MaterialSkyDomeMenu;
  CPlugShader* InterfaceBg;
  CControlStyleSheet* StyleSheetFid;
  CControlStyle* StyleDefaultTitleLogos;
  CPlugFont* InterfaceFont;
  CScene2d* ReplayInterfaceFid;
  CScene2d* InterfaceEditorFid;
  CScene2d* InterfacePuzzleFid;
  CScene2d* InterfaceEditorSimpleFid;
  CScene2d* InterfaceBlockEditorFid;
  CControlFrame* InterfaceEditorInventoryModelFid;
  CScene2d* RaceInterfaceFid;
  CScene2d* RaceNetInterfaceFid;
  CScene2d* StoryInterfaceFid;
  CScene2d* MediaTrackerInterfaceFid;
  CControlFrame* EditorAnimInterfaceFid;
  CControlFrame* EditorAnimCharInterfaceFid;
  CControlFrame* EditorItemInterfaceFid;
  CControlFrame* EditorVehicleInterfaceFid;
  CControlFrame* EditorClassInterfaceFid;
  CControlFrame* EditorManialinkInterfaceFid;
  CControlFrame* EditorModuleInterfaceFid;
  CControlFrame* EditorAnimSetInterfaceFid;
  CGameMenu* MenusFid;
  CGameMenu* InGameDialogsFid;
  CGameMenu* DialogsFid;
  CGameMenu* SystemDialogsFid;
  CGameMenu* BasicDialogsFid;
  CScene2d* ProgressOverlayFid;
  CScene2d* SystemOverlayFid;
  CScene2d* SystemMenuFid;
  CScene2d* ManialinkBrowserOverlayFid;
  CScene2d* PluginsMenuOverlayFid;
  CPlugSolid* StationGoldFid;
  CPlugSolid* StationSilverFid;
  CPlugSolid* StationBronzeFid;
  CPlugSolid* StationServerFid;
  CPlugGameSkin* StationGameSkin;
  CPlugSolid* PlanetSolidFid;
  CPlugSound* ManiaPlanetMenuMusic;
  CControlFrame* CardStationMainFid;
  CControlFrame* CardStationSummaryFid;
  CControlFrame* CardPlanetMenu1Fid;
  CControlFrame* CardPlanetMenu2Fid;
  CControlFrame* CardPlanetServerMainFid;
  CControlFrame* CardPlanetServerSummaryFid;
  CControlFrame* CardPlanetServerRackSummaryFid;
  CGameManialink3dWorld* MenuManialink3dFid;
  CGameManialink3dStyle* MenuManialink3d_BaseStyleFid;
  CGameManialink3dStyle* MenuManialink3d_StationsStyleFid;
  CPlugFileImg* MenuManialink3d_DefaultSkyGradientV;
  CPlugSolid2Model* MenuManialink3dBox_Box;
  CPlugSolid2Model* MenuManialink3dBox_Title;
  CPlugSolid2Model* MenuManialink3dBox_Button;
  CPlugSolid2Model* MenuManialink3dBox_Window;
  CPlugSolid2Model* MenuManialink3dBox_WindowH;
  CPlugSolid2Model* MenuManialink3dBox_BoxCase;
  CPlugSolid2Model* MenuManialink3dBox_Station1x1;
  CPlugSolid2Model* MenuManialink3dBox_Station2x2;
  CPlugSolid2Model* MenuManialink3dBox_Station3x3;
  CSystemFidsFolder* TitleTemplateFolder;
  CPlugBitmap* DefaultAvatarBitmapFid;
  CPlugFileImg* DefaultMTColorGradingImageFid;
  CPlugBitmap* DefaultMTDecal2dBitmapFid;
  CPlugBitmap* DefaultMTBlockBitmapFid;
  CPlugSound* DefaultMTBlockSoundFid;
  CPlugBitmap* DefaultLeagueLogoBitmapFid;
  CPlugBitmap* DefaultOnlineNewsIconBitmapFid;
  CPlugBitmap* DefaultTeamLogoBitmapFid;
  CPlugBitmap* DefaultTagBitmapFid;
  CPlugMusic* DefaultMusicFid;
  CPlugBitmap* BitmapTeamEmblems;
  CPlugFileSnd* EmptyChallengeCustomMusicFid;
  CGameCtnPainterSetting* PainterSetting;
  CGameControlCardManager* GeneralCardManager;
  CSceneFxNod* SceneFxNodRoot;
  CScene3d* PodiumScene;
  CPlugFileTextScript* DefaultSkillScoreComputerFid;
  CPlugFileImg* ImageTurboRoulette;
  CPlugBitmap* EditorModelSpritesBitmapFid;
  CPlugMaterial* EditorModelDefaultMaterialFid;
  CGameCtnMediaClip* DefaultTransitionInClipFid;
  CGameCtnMediaClip* DefaultTransitionOutClipFid;
  CPlugAudioBalance* AudioBalance_Base;
  CPlugAudioBalance* AudioBalance_Menus;
  CPlugAudioBalance* AudioBalance_Editor;
  CPlugShaderApply* OffZoneSurfaceShaderFid;
  CPlugShaderApply* OffZoneLayerShaderFid;
};

struct CGameNetServerInfo : public CNetMasterHost {
  const bool IsIdle_ForMasterServer;
  const bool IsOnline;
  const bool IsServer;
  const bool IsPrivate;
  const bool IsPrivateForSpectator;
  const bool AcceptReferees;
  uint RefereesCount;
  const uint LadderMatchId;
  const uint DownloadRate;
  const uint UploadRate;
  enum class CGameNetServerInfo::EPingEnum {
    ____ = 0, //     
    A___ = 1, // *   
    AA__ = 2, // **  
    AAA_ = 3, // *** 
    AAAA = 4, // ****
  };
  const CGameNetServerInfo::EPingEnum PingEnum;
  const uint Ping;
  string ServerHostName;
  const uint State;
  const uint ChallengeSequenceNumber;
  const bool QuickInfoReceived;
  const uint RoundTrip;
  bool CallVoteEnabled;
  string AdvertisingSuffix;
};

struct CGameNetForm : public CNetNod {
  CGameNetForm();

};

struct CGameDialogs : public CMwNod {
  enum class CGameDialogs::EDialog {
    None = 0,
    Message = 1,
    WaitMessage = 2,
  };
  bool EnableCustomSystemDialogs; // Maniascript
  const CGameDialogs::EDialog Dialog; // Maniascript
  const wstring Message_LabelText; // Maniascript
  const wstring Message_ButtonText; // Maniascript
  const bool Message_FocusOnButton; // Maniascript
  void Message_Ok(); // Maniascript
  const wstring WaitMessage_LabelText; // Maniascript
  const wstring WaitMessage_ButtonText; // Maniascript
  const float WaitMessage_Progress; // Range: 0 - 1 // Maniascript
  const bool WaitMessage_ShowProgressBar; // Maniascript
  const bool WaitMessage_ShowAbortButton; // Maniascript
  void WaitMessage_Ok(); // Maniascript
  CGameMenu* Dialogs;
  void HideDialogs();
  void DoMessage_Ok();
  void AskYesNo_No();
  void AskYesNo_Yes();
  wstring String;
  void DialogSaveAs_HierarchyUp();
  const wstring DialogSaveAs_Path;
  void DialogSaveAs_OnRefresh();
  void DialogSaveAs_OnValidate();
  void DialogSaveAs_OnCancel();
  const MwFastBuffer<CGameFid*> DialogSaveAs_Files;
  void DbgTestDoMessage();
};

// File extension: 'ScaleEffect.Gbx'
struct CGameMenuScaleEffect : public CControlEffect {
  CGameMenuScaleEffect();

  float LeftBorderScale;
  float RightBorderScale;
  float UpBorderScale;
  float DownBorderScale;
  float Shift;
  uint Period;
  uint MaxLetterScaling;
  bool AllowDecalage;
  bool AllowHideBeforeEffect;
  bool IsHalf;
  bool IsInverse;
  bool ReCenter;
};

// File extension: 'Collection.Gbx'
struct CGameCtnCollection : public CMwNod {
  CGameCtnCollection();

  UnnamedEnum CollectionId;
  MwFastBuffer<CGameCtnZone*> CompleteZoneList;
  wstring DisplayName;
  uint CollectionPackMask;
  CGameCtnZone* DefaultZone;
  float SquareSize;
  float SquareHeight;
  float BoardSquareHeight;
  float BoardSquareBorder;
  float TerrainHeightOffset;
  MwId Water0_Id;
  float Water0_OffsetTop;
  float Water0_OffsetBottom;
  MwId Water1_Id;
  float Water1_OffsetTop;
  float Water1_OffsetBottom;
  float WaterTop;
  bool IsWaterMultiHeight;
  float WaterFogMaxDepth;
  float WaterFogClampAboveDist;
  float CameraMinHeight;
  bool NeedUnlock;
  UnnamedEnum BackgroundShadow;
  bool ShadowCastBack;
  float ShadowSoftSizeInWorld;
  UnnamedEnum VertexLighting;
  float ColorVertexMin; // Range: 0 - 1
  float ColorVertexMax; // Range: 0 - 1
  UnnamedEnum LightMapMapper;
  float VisMeshLodDistScale;
  vec3 Tech3TunnelSpecularExpScaleMax;
  CGameCtnDecoration* DefaultDecoration;
  MwId VehicleName;
  MwId VehicleAuthor;
  UnnamedEnum VehicleCollection;
  bool IsEditable;
  CPlugBitmap* IconFid;
  CPlugBitmap* LoadScreenFid;
  int SortIndex;
  CSystemFidsFolder* FolderBlockInfo;
  CSystemFidsFolder* FolderItem;
  CSystemFidsFolder* FolderDecoration;
  CSystemFidsFolder* FolderMenusIcons;
  CSystemFidsFolder* FolderCardEventInfo;
  CSystemFidsFolder* FolderMacroBlockInfo;
  CSystemFidsFolder* FolderDecalModels;
  CSystemFidsFolder* FolderMacroDecals;
  CPlugBitmap* MapFid;
  vec2 MapRectMin;
  vec2 MapRectMax;
  vec2 MapCoordElem;
  vec2 MapCoordIcon;
  vec2 MapCoordDesc;
  wstring LongDesc;
  void SetMapCoordFromRect();
  MwFastBuffer<wstring> BaseZoneStrings;
  MwFastBuffer<wstring> ReplacementZoneStrings;
  MwFastBuffer<CGameCtnDecorationTerrainModifier*> ReplacementTerrainModifiers;
  void AddReplacementZone();
  void RemoveReplacementZone();
  const MwFastBuffer<CPlugParticleEmitterModel*> ParticleEmitterModelsFids;
  MwFastBuffer<MwId> DecalsTypesId;
  CSceneVehicleCarMarksModel* MarksModel;
  CFuncShaderLayerUV* FidFuncShaderCloudsX2;
  CPlugBitmap* FidPlugBitmapCloudsX2;
  CPlugFogMatter* OffZone_FogMatter;
  const MwFastBuffer<CGameCtnZone*> ZoneList;
};

struct CGameCtnMediaBlockEditor : public CMwNod {
};

// File extension: 'ObjInfo.Gbx'
struct CGameVskObjectInfo : public CGameCtnCollector {
  CGameVskObjectInfo();

  CMwNod* Helper;
  CMwNod* Mobil;
  CMwNod* AltMobil;
  MwFastBuffer<CMwNod*> Properties;
};

struct CGameCtnBlockUnitInfo : public CMwNod {
  CGameCtnBlockUnitInfo();

  enum class CGameCtnBlockUnitInfo::ECardinalDirEnum {
    North = 0,
    East = 1,
    South = 2,
    West = 3,
  };
  enum class CGameCtnBlockUnitInfo::EMultiDirEnum {
    SameDir = 0,
    SymmetricalDirs = 1,
    AllDir = 2,
    OpposedDirOnly = 3,
    PerpendicularDirsOnly = 4,
    NextDirOnly = 5,
    PreviousDirOnly = 6,
  };
  int3 OffsetE;
  MwFastArray<CGameCtnBlockInfoClip*> ClipsE;
  CGameCtnBlockInfoClip* TopClip;
  CGameCtnBlockInfoClip* BottomClip;
  MwFastArray<CGameCtnBlockInfoPylon*> Pylons;
  uint AcceptPylons;
  uint PlacePylons;
  bool Underground;
  CGameCtnBlockInfo* ReplacementBlockInfo;
  uint ReplacementIndex;
  CGameCtnBlockUnitInfo::EMultiDirEnum ReplacementDir;
  MwId TerrainModifierId;
  CGameCtnBlockUnitInfo* OriginalBlockUnitInfo;
  CGameCtnBlockInfo* PillarBlockInfo;
  CGameCtnBlockUnitInfo::ECardinalDirEnum PillarDir;
  CGameCtnBlockUnitInfo::ECardinalDirEnum TopClipDir;
  CGameCtnBlockUnitInfo::ECardinalDirEnum BottomClipDir;
  const int3 Offset; // Maniascript
  const MwFastArray<CGameCtnBlockInfoClip*> Clips; // Maniascript
};

struct CGameFid : public CMwNod {
  const wstring Name; // Maniascript
  const wstring Path; // Maniascript
  const wstring FileName; // Maniascript
  CSystemFidFile* const Fid;
  CSystemFidsFolder* const Fids;
  const bool Selected;
};

// File extension: 'Decoration.Gbx'
struct CGameCtnDecoration : public CGameCtnCollector {
  CGameCtnDecoration();

  CPlugFileFidContainer* DefaultSkinFid;
  UnknownType DefaultSkinFileRef;
  CGameCtnDecorationSize* DecoSize;
  CGameCtnDecorationAudio* DecoAudio;
  CGameCtnDecorationMood* DecoMood;
  CGameCtnDecorationTerrainModifier* TerrainModifierBase;
  CGameCtnDecorationTerrainModifier* TerrainModifierCovered;
  bool IsWaterOutsidePlayField;
  CPlugGameSkin* VehicleFxSkin;
  CSystemFidsFolder* VehicleFxFolder;
  CPlugSound* DecoAudio_Ambient;
  MwId DecorationZoneFrontierId;
  void InitWithNoSkin();
  void ClearWithNoSkin();
  CPlugDecoratorSolid* DecoratorSolidWarp;
};

// File extension: 'DecorationAudio.Gbx'
struct CGameCtnDecorationAudio : public CMwNod {
  CGameCtnDecorationAudio();

  MwFastArray<CPlugSound*> Sounds;
  MwFastArray<CPlugSound*> Musics;
  float CameraWooshVolumedB; // Range: -60 - 0
  float CameraWooshMinSpeedKmh;
  CPlugAudioEnvironment* AudioEnvOutsideOpen;
  CPlugAudioEnvironment* AudioEnvOutsideEnclosed;
  CPlugAudioEnvironment* AudioEnvUndergroundOpen;
  CPlugAudioEnvironment* AudioEnvUndergroundEnclosed;
  CPlugAudioBalance* AudioBalance_Podium;
  CPlugAudioBalance* AudioBalance_ReplaySoft;
  CPlugAudioBalance* AudioBalance_ReplayLoud;
  CPlugAudioBalance* AudioBalance_PlaygroundSoft;
  CPlugAudioBalance* AudioBalance_PlaygroundLoud;
  CPlugAudioBalance* AudioBalance_Overlay_Underground;
  CPlugAudioBalance* AudioBalance_Overlay_Far;
  CPlugAudioBalance* AudioBalance_TM_EvtStartLine;
  CPlugAudioBalance* AudioBalance_TM_EvtCheckpoint;
  CPlugAudioBalance* AudioBalance_TM_EvtRespawn;
  CPlugAudioBalance* AudioBalance_TM_EvtCrash;
  CPlugAudioBalance* AudioBalance_TM_EvtFlying;
  CPlugAudioBalance* m_AudioBalance_TM_EvtSwimming;
  CPlugAudioBalance* AudioBalance_SM_EvtSpawn;
  CPlugAudioBalance* AudioBalance_SM_EvtUnspawn;
  CPlugAudioBalance* AudioBalance_SM_EvtHit;
  CPlugAudioBalance* AudioBalance_SM_EvtHitEliminated;
  CPlugAudioBalance* AudioBalance_SM_EvtFire;
  float ReverbMinBlockDist;
  float ReverbMaxBlockDist;
  MwFastBuffer<float> ReverbMaterialGains;
  CPlugFileText* ModifierXmlFile;
};

// File extension: 'DecorationMood.Gbx'
struct CGameCtnDecorationMood : public CMwNod {
  CGameCtnDecorationMood();

  uint ShadowCountCarHuman;
  uint ShadowCountCarOpponent;
  float ShadowCarIntensity; // Range: 0 - 1
  bool ShadowScene;
  bool BackgroundIsLocallyLighted;
  bool SolidLightAreSkinned;
  float Latitude;
  float Longitude;
  float DeltaGMT;
  float SunMoonIntensity;
  float LocalLightScale;
  float EditorHelperHdrScale;
  string TimeSunRise;
  string TimeSunFall;
  bool EnableStars;
  bool WaterReflectFakeCube;
  CFuncCloudsSolids* CloudsSolids;
  const string ToneMapping;
  float ToneMapExposureStaticBase;
  UnnamedEnum ToneMapFilmCurve;
  vec3 Tech3Bloom;
  vec4 Tech3ToneMapAutoExp;
  vec2 Tech3SpecularLocal;
  vec3 Tech3SpecularFake_ExpScaleMax;
  CFuncKeysReal* ToneMapAutoExp_FidAvgLumiToKeyValue;
  CFuncKeysReal* FxBloom_FidFuncIntensAtHdrNorm;
  CPlugFxLightning* FxLightning;
  CPlugFxWindOnDecal* FxWindOnDecal;
  CPlugFxWindOnTreeSprite* FxWindOnTreeSprite;
  CPlugFxHdrScales_Tech3* FxHdrScalesT3;
  float RemappedStartDayTime; // Range: 0 - 1
  bool IsNight;
  CPlugGameSkin* Remapping;
  CSystemFidsFolder* RemapFolder;
  CHmsLightMap* HmsLightMap;
  CHmsAmbientOcc* HmsAmbientOcc;
};

// File extension: 'DecorationSize.Gbx'
struct CGameCtnDecorationSize : public CMwNod {
  CGameCtnDecorationSize();

  CScene3d* Scene;
  uint SizeX;
  uint SizeY;
  uint SizeZ;
  uint BaseHeightBase;
  uint BaseHeightOffset;
  bool OffsetBlockY;
  vec2 EditionZoneMin;
  vec2 EditionZoneMax;
  uint VertexCount;
};

// File extension: 'TMTerrainModifier.Gbx'
struct CGameCtnDecorationTerrainModifier : public CMwNod {
  CGameCtnDecorationTerrainModifier();

  MwId IdName;
  CPlugGameSkin* Remapping;
  CSystemFidsFolder* RemapFolder;
};

// File extension: 'GameAdvertisement.Gbx'
struct CGameAdvertising : public CGameNod {
  CGameAdvertising();

  UnnamedEnum Mode;
  bool ImpressionHelpers_Enable;
  bool DisableOcclusion;
  bool EditionDummies;
  const MwFastBuffer<CMwNod*> Files;
  CPlugFileImg* EditonDummyImage;
  const string Identifier;
  const string PublicKey;
  string Radial_Config;
  uint Impression_Time;
  float Impression_Size;
  float Impression_CosAngle;
  string DefaultAdvertisingSuffix;
  void Init();
  void Destroy();
  void Flush();
  void ImpressionHelpers_Update();
  string ZoneName;
  string ZoneAuthor;
  string ZoneHost;
  string Nation;
  string Login;
  const MwFastBuffer<CGameAdvertisingElement*> ZoneElements;
  CSceneMobil* const ImpressionHelpers_Mobil;
};

struct CGameAdvertisingElement : public CGameNod {
  const string Name;
  const uint ContentDisplayed;
  const MwFastBuffer<CMwNod*> OwnerNods;
  CSystemFidFile* const File;
  void DisplayOrig();
  const float Nadeo_MaxImpression;
  const uint Nadeo_ContentId;
};

// File extension: 'Ghost.Gbx'
struct CGameGhost : public CMwNod {
  CGameGhost();

  const uint Duration;
  const uint Size;
};

struct CGameControlCameraMaster : public CMwNod {
  CGameControlCameraMaster();

  const MwFastBuffer<CGameControlCamera*> ManagedCams;
  CGameControlCameraEffectGroup* const GlobalEffects;
  uint CurrentCam;
  bool IsSwitching;
};

// File extension: 'CtrlCamFirstPerson.gbx'
struct CGameControlCameraFirstPerson : public CGameControlCamera {
  CGameControlCameraFirstPerson();

};

// File extension: 'CtrlCamThirdPerson.gbx'
struct CGameControlCameraThirdPerson : public CGameControlCamera {
  CGameControlCameraThirdPerson();

};

// File extension: 'Map.Gbx'
struct CGameCtnChallenge : public CMwNod {
  CGameCtnChallenge();

  const string EdChallengeId;
  CGameCtnChallengeInfo* const MapInfo; // Maniascript
  wstring MapName; // Maniascript
  wstring Comments; // Maniascript
  const string AuthorZoneIconUrl; // Maniascript
  const string CollectionName; // Maniascript
  const string DecorationName; // Maniascript
  const string AuthorLogin; // Maniascript
  const wstring AuthorNickName; // Maniascript
  const wstring AuthorZonePath; // Maniascript
  const wstring MapType; // Maniascript
  const wstring MapStyle; // Maniascript
  const MwId TitleId;
  uint TMObjective_AuthorTime; // Maniascript
  uint TMObjective_GoldTime; // Maniascript
  uint TMObjective_SilverTime; // Maniascript
  uint TMObjective_BronzeTime; // Maniascript
  const uint TMObjective_NbLaps; // Maniascript
  const bool TMObjective_IsLapRace; // Maniascript
  wstring ObjectiveTextAuthor; // Maniascript
  wstring ObjectiveTextGold; // Maniascript
  wstring ObjectiveTextSilver; // Maniascript
  wstring ObjectiveTextBronze; // Maniascript
  const uint CopperPrice; // Maniascript
  const int3 Size; // Maniascript
  CGameCtnChallengeParameters* ChallengeParameters;
  CGameCtnCollectorList* BlockStock;
  CPlugBitmap* const AuthorZoneIcon;
  const wstring MapTypeOrLegacyMode;
  string HashedPassword;
  MwId VehicleName;
  MwId VehicleAuthor;
  UnnamedEnum VehicleCollection;
  bool NeedUnlock;
  UnnamedEnum Kind;
  UnnamedEnum Difficulty;
  CGameCtnDecoration* Decoration;
  CSystemPackDesc* ModPackDesc;
  CSystemPackDesc* CustomMusicPackDesc;
  CPlugSound* CustomMusic;
  CGameCtnCollection* Collection;
  const MwFastBuffer<CGameCtnBlock*> Blocks;
  const MwFastBuffer<CGameCtnBlock*> BakedBlocks;
  CPlugTrafficGraph* TrafficGraph;
  const MwFastBuffer<CGameCtnChallengeTrafficElemDesc*> TrafficElemDescs;
  const MwFastBuffer<CPlugSpline3D*> TrafficPathSplines;
  const MwFastBuffer<CPlugTrafficPathSquares*> TrafficPathSquares;
  const MwFastBuffer<CPlugTrafficZoneSquares*> TrafficZoneSquares;
  void CheckPlayField();
  const uint VertexCount;
  uint TargetTime;
  bool ShowBlockNormalHelpers;
  bool ShowBlockFacultativeHelpers;
  void ComputeCrc32(CMwNod* Nod, uint Crc32);
  CGameCtnMediaClip* ClipIntro;
  CGameCtnMediaClipGroup* ClipGroupInGame;
  CGameCtnMediaClipGroup* ClipGroupEndRace;
  CGameCtnMediaClip* ClipAmbiance;
  vec2 MapCoordTarget;
  vec2 MapCoordOrigin;
  MwFastBuffer<CSceneVehicleCarMarksSamples*> CarMarksBuffer;
  void TmpBlockOffsetMoulinette();
  uint TmpBlockOffsetMoulinetteY;
  const uint LightMapCacheSmallByteSize;
  MwFastBuffer<CGameCtnAnchoredObject*> AnchoredObjects;
  CPlugAnimFile* AnimLibrary;
  CScriptTraitsMetadata* ScriptMetadata;
  string ChallengeScript;
  float ThumbnailCam_TransX;
  float ThumbnailCam_TransY;
  float ThumbnailCam_TransZ;
  float ThumbnailCam_Yaw;
  float ThumbnailCam_Pitch;
  void UpdateBases();
  const uint DecoBaseHeightOffset;
};

struct CGameCtnChallengeInfo : public CGameFid {
  const string MapUid; // Maniascript
  const wstring Comments; // Maniascript
  const uint CopperPrice; // Maniascript
  const string CollectionName; // Maniascript
  const string AuthorLogin; // Maniascript
  const wstring AuthorNickName; // Maniascript
  const wstring AuthorZonePath; // Maniascript
  const wstring MapType; // Maniascript
  const wstring MapStyle; // Maniascript
  const bool Unlocked; // Maniascript
  const bool IsPlayable; // Maniascript
  const uint TMObjective_AuthorTime; // Maniascript
  const uint TMObjective_GoldTime; // Maniascript
  const uint TMObjective_SilverTime; // Maniascript
  const uint TMObjective_BronzeTime; // Maniascript
  const bool TMObjective_IsLapRace; // Maniascript
  const wstring NameForUi;
  const string CopperString;
  const vec2 MapCoordOrigin;
  const vec2 MapCoordTarget;
  const bool CreatedWithEditorSimple;
  const UnnamedEnum Kind;
  const bool LapRace;
  const uint DbgPackMask;
  enum class CGameCtnChallengeInfo::EMedal {
    None = 0,
    Finished = 1,
    Bronze = 2,
    Silver = 3,
    Gold = 4,
    Author = 5,
  };
  const CGameCtnChallengeInfo::EMedal Medal;
  const CGameCtnChallengeInfo::EMedal OfficialMedal;
  const uint BestTime;
  const uint OfficialBestRecord;
  const uint GoldTime;
  const uint OfficialSkillMedal;
  const MwFastBuffer<CGameHighScore*> SoloScores;
  CGameChallengeScores* const GeneralOfficialScores;
};

struct CGameOutlineBox : public CMwNod {
  CGameOutlineBox();

  CSceneMobil* const Mobil;
  bool AdditiveElseBlendSrcA;
  bool IsShowQuads;
  bool IsShowLines;
  float HardLinesColorCoef;
  float SoftLinesColorCoef;
};

// File extension: 'ParticleParam.Gbx'
struct CGameCtnParticleParam : public CMwNod {
  CGameCtnParticleParam();

  MwId ParticleModelId;
};

struct CGameHighScore : public CMwNod {
  CGameHighScore();

  enum class CGameHighScore::EMedal {
    None = 0,
    Finished = 1,
    Bronze = 2,
    Silver = 3,
    Gold = 4,
    Author = 5,
  };
  const wstring Name; // Maniascript
  const uint Time; // Maniascript
  const wstring Score; // Maniascript
  const uint Rank; // Maniascript
  const uint Count; // Maniascript
  const string GhostUrl; // Maniascript
  const CGameHighScore::EMedal Medal; // Maniascript
  const string GhostName; // Maniascript
};

// File extension: 'PainterSetting.Gbx'
struct CGameCtnPainterSetting : public CMwNod {
  CGameCtnPainterSetting();

  vec2 MinMaxScaleFill;
  vec2 MinMaxScaleSticker;
  vec2 MinMaxScaleStickerText;
  vec2 MinMaxScaleBrush;
  vec2 MinMaxScaleBrushText;
  CGameControlCameraOrbital3d* const Camera;
  void SetDefaultCameraSettings();
  CPlugMaterial* MaterialPaint;
  CPlugMaterial* MaterialFillColor;
  CPlugMaterial* MaterialLayerBlend;
  CPlugMaterial* MaterialLayerModulate;
  CPlugShader* ShaderRasterRgbMask;
  CPlugShader* ShaderRasterAlphaMask;
  CPlugBitmap* BitmapBrushFade;
  CPlugBitmap* BitmapStickerFade;
  CPlugFileImg* ImageSubObjectAllIcon;
  const MwFastBuffer<CScene3d*> ScenesFids;
  float MouseZDeltaRot;
  float MouseZDeltaScale;
  bool CameraBottomClipGeometry;
  float CameraBottomIn_m1p1;
  CPlugGameSkin* Remapping;
  CSystemFidsFolder* RemapFolder;
  CFuncKeysReal* FxBloom_FidFuncIntensAtHdrNorm;
};

struct CGameLeagueManager : public CMwNod {
  CGameLeagueManager();

  uint CacheDuration;
  MwFastBuffer<CGameLeague*> Leagues;
};

struct CGameCtnMediaBlockEditorTriangles : public CGameCtnMediaBlockEditor {
  CGameCtnMediaBlockEditorTriangles();

  void ModeMoveVertexs();
  void ModeCreateTriangles();
  void ModeDeleteVertexs();
  vec3 VertRGB;
  float VertAlpha; // Range: 0 - 1
  float VertPosX;
  float VertPosY;
  float VertPosZ;
  CControlFrame* Frame;
};

// File extension: 'GameCtnMediaBlockTriangles2D.gbx'
struct CGameCtnMediaBlockTriangles2D : public CGameCtnMediaBlockTriangles {
  CGameCtnMediaBlockTriangles2D();

};

// File extension: 'GameCtnMediaBlockTriangles3D.gbx'
struct CGameCtnMediaBlockTriangles3D : public CGameCtnMediaBlockTriangles {
  CGameCtnMediaBlockTriangles3D();

};

struct CGameNetOnlineNewsReply : public CMwNod {
};

// Description: "The model of a map block"
struct CGameCtnBlockInfo : public CGameCtnCollector {
  enum class CGameCtnBlockInfo::EBaseType {
    None = 0,
    Conductor = 1,
    Generator = 2,
    Collector = 3,
  };
  enum class CGameCtnBlockInfo::EWayPointType {
    Start = 0,
    Finish = 1,
    Checkpoint = 2,
    None = 3,
    StartFinish = 4,
  };
  CGameCtnBlockInfoVariantGround* VariantBaseGround;
  CGameCtnBlockInfoVariantAir* VariantBaseAir;
  const MwFastBuffer<CGameCtnBlockInfoVariantGround*> AdditionalVariantsGround;
  const MwFastBuffer<CGameCtnBlockInfoVariantAir*> AdditionalVariantsAir;
  bool IsPillar;
  CGameCtnBlockInfo::EWayPointType EdWaypointType;
  bool SpawnUnderground;
  CGameCtnBlockInfo::EBaseType BaseType;
  MwId SymmetricalBlockInfoId;
  UnnamedEnum Dir;
  CGameCtnBlockInfo* SymmetricalBlockInfoConnected;
  bool EdNoRespawn;
  bool IconAutoUseGround;
  CMwNod* IconMacroBlockInfo;
  CMwNod* PrecalcPartParams;
  iso4 PrecalcPartLoc;
  bool CharPhySpecialPropertyCustomizable;
  CPlugCharPhySpecialProperty* CharPhySpecialProperty;
  CGameWaypointSpecialProperty* WaypointSpecialProperty;
  CGamePodiumInfo* PodiumInfo;
  CGamePodiumInfo* IntroInfo;
  CPlugFogVolumeBox* FogVolumeBox;
  CPlugSound* Sound1;
  iso4 Sound1Loc;
  CPlugSound* Sound2;
  iso4 Sound2Loc;
  const wstring Name; // Maniascript
  const bool IsRoad; // Maniascript
  const bool IsTerrain; // Maniascript
  const bool IsPodium; // Maniascript
  const CGameCtnBlockInfo::EWayPointType WaypointType; // Maniascript
  const CGameCtnBlockInfo::EWayPointType WayPointType; // Maniascript
  const bool NoRespawn; // Maniascript
  CGameCtnBlockInfoVariantGround* const VariantGround; // Maniascript
  CGameCtnBlockInfoVariantAir* const VariantAir; // Maniascript
};

// File extension: 'EDFlat.Gbx'
struct CGameCtnBlockInfoFlat : public CGameCtnBlockInfo {
  CGameCtnBlockInfoFlat();

};

// File extension: 'EDFrontier.Gbx'
struct CGameCtnBlockInfoFrontier : public CGameCtnBlockInfo {
  CGameCtnBlockInfoFrontier();

};

// File extension: 'EDClassic.Gbx'
struct CGameCtnBlockInfoClassic : public CGameCtnBlockInfo {
  CGameCtnBlockInfoClassic();

};

// File extension: 'EDRoad.Gbx'
struct CGameCtnBlockInfoRoad : public CGameCtnBlockInfo {
  CGameCtnBlockInfoRoad();

  CGameCtnBlockInfoSlope* Slope;
};

// File extension: 'EDClip.Gbx'
struct CGameCtnBlockInfoClip : public CGameCtnBlockInfo {
  CGameCtnBlockInfoClip();

  enum class CGameCtnBlockInfoClip::EnumClipType {
    ClassicClip = 0,
    FreeClipSide = 1,
    FreeClipTop = 2,
    FreeClipBottom = 3,
  };
  enum class CGameCtnBlockInfoClip::EMultiDirEnum {
    SameDir = 0,
    SymmetricalDirs = 1,
    AllDir = 2,
    OpposedDirOnly = 3,
    PerpendicularDirsOnly = 4,
    NextDirOnly = 5,
    PreviousDirOnly = 6,
  };
  bool HasPassingPoint;
  float PassingPointPosX;
  float PassingPointPosY;
  float PassingPointRoll;
  float PassingPointPitch;
  MwId ASymmetricalClipId;
  MwId ClipGroupId;
  MwId SymmetricalClipGroupId;
  CGameCtnBlockInfoClip::EnumClipType ClipType;
  bool IsFullFreeClip;
  bool IsExclusiveFreeClip;
  bool CanBeDeletedByFullFreeClip;
  CGameCtnBlockInfoClip::EMultiDirEnum TopBottomMultiDir;
};

// File extension: 'EDSlope.Gbx'
struct CGameCtnBlockInfoSlope : public CGameCtnBlockInfo {
  CGameCtnBlockInfoSlope();

};

// File extension: 'EDPylon.Gbx'
struct CGameCtnBlockInfoPylon : public CGameCtnBlockInfo {
  CGameCtnBlockInfoPylon();

  float PylonOffset;
  UnnamedEnum PylonAmount;
  UnnamedEnum PylonPlacement;
  int BlockHeightOffset;
};

// File extension: 'EDRectAsym.Gbx'
struct CGameCtnBlockInfoRectAsym : public CGameCtnBlockInfo {
  CGameCtnBlockInfoRectAsym();

};

struct CGameCtnBlock : public CMwNod {
  CGameCtnBlock();

  enum class CGameCtnBlock::ECardinalDirections {
    North = 0,
    East = 1,
    South = 2,
    West = 3,
  };
  const MwId DescId;
  const UnnamedEnum CollectionId;
  const MwId DescAuthor;
  uint CoordX;
  uint CoordY;
  uint CoordZ;
  CGameCtnBlock::ECardinalDirections Dir;
  const uint MobilIndex;
  CSceneMobil* const Mobil;
  MwFastArray<CGameCtnBlockUnit*> BlockUnitsE;
  CGameCtnBlockSkin* const Skin;
  void ApplySkin();
  bool Editable;
  CGameCtnBlockInfo* const BlockInfo;
  CPlugCharPhySpecialProperty* CharPhySpecialProperty;
  CGameWaypointSpecialProperty* WaypointSpecialProperty;
  const uint BlockScriptId; // Maniascript
  const bool CanHaveAnchor; // Maniascript
  void UseDefaultAnchor(); // Maniascript
  void UseCustomAnchor(); // Maniascript
  const int3 Coord; // Maniascript
  const CGameCtnBlock::ECardinalDirections Direction; // Maniascript
  const MwFastArray<CGameCtnBlockUnit*> BlockUnits; // Maniascript
  CGameCtnBlockInfo* const BlockModel; // Maniascript
};

struct CGameCtnBlockUnit : public CMwNod {
  CGameCtnBlockUnit();

  uint PlacePylons;
  uint AcceptPylons;
  const int3 Offset; // Maniascript
  CGameCtnBlockUnitInfo* const BlockUnitModel; // Maniascript
  CGameCtnBlock* const Block; // Maniascript
};

struct CGameCtnBlockSkin : public CMwNod {
  CGameCtnBlockSkin();

  bool IsDirty;
  CSystemPackDesc* PackDesc;
  CSystemPackDesc* ParentPackDesc;
  wstring Text;
};

struct CGameCtnPylonColumn : public CMwNod {
  CGameCtnPylonColumn();

};

struct CGameCtnChallengeParameters : public CMwNod {
  CGameCtnChallengeParameters();

  uint AuthorScore;
  uint AuthorTime;
  uint GoldTime;
  uint SilverTime;
  uint BronzeTime;
  void ResetGoldSilverBronzeStunts();
  wstring MapType;
  wstring MapStyle;
  const wstring Type;
  const wstring Style;
  string Tip;
  CGameCtnGhost* RaceValidateGhost;
  const bool IsValidatedForScriptModes;
};

// File extension: 'TMZone.Gbx'
struct CGameCtnZone : public CMwNod {
  CGameCtnZone();

  MwId ZoneId;
  MwId SurfaceId;
  MwId WaterId;
  bool IsLargeZone;
  float VisualTopGroundHeight;
  MwId ForcedParentZoneFrontierId;
  const uint Height;
};

// File extension: 'ZoneFlat.Gbx'
struct CGameCtnZoneFlat : public CGameCtnZone {
  CGameCtnZoneFlat();

  bool GroundOnly;
  bool AutoSimplifyGenealogy;
  CGameCtnBlockInfoFlat* BlockInfoFlat;
  CGameCtnBlockInfoClip* BlockInfoClip;
  CGameCtnBlockInfoRoad* BlockInfoRoad;
  CGameCtnBlockInfoPylon* BlockInfoPylon;
};

// File extension: 'ZoneFrontier.Gbx'
struct CGameCtnZoneFrontier : public CGameCtnZone {
  CGameCtnZoneFrontier();

  int ParentToChildHeightChange;
  const int BlockYOffsetFromParent;
  MwId ParentZoneId;
  MwId ChildZoneId;
  CGameCtnBlockInfoFrontier* BlockInfoFrontier;
  bool FrontierParentBorder_AcceptPylons;
  bool FrontierChildBorder_AcceptPylons;
  bool FrontierTransitionMiddle_AcceptPylons;
  bool FrontierStraightMiddle_AcceptPylons;
  MwFastBuffer<CGameCtnZoneFusionInfo*> CompatibleZones;
};

// File extension: 'GameSkinnedNod.gbx'
struct CGameSkinnedNod : public CGameNod {
  CGameSkinnedNod();

  CMwNod* BaseNodFid;
  CPlugGameSkin* GameSkin;
  MwFastArray<CMwNod*> RemapFids;
};

struct CGameCtnMediaShootParams : public CMwNod {
  CGameCtnMediaShootParams();

  uint VideoFps;
  float Duration;
  uint SizeX;
  uint SizeY;
  bool Hq;
  uint HqSampleCountPerAxe;
  bool HqMB;
  bool HqSoftShadows;
  bool HqAmbientOcc;
  UnnamedEnum Stereo3d;
  bool IsAudioStream;
};

struct CGameCampaignsScoresManager : public CMwNod {
  CGameCampaignsScoresManager();

};

struct CGameSkillScoreComputer : public CMwNod {
  CGameSkillScoreComputer();

};

struct CGameCampaignScores : public CMwNod {
  CGameCampaignScores();

};

struct CGameChallengeScores : public CMwNod {
  CGameChallengeScores();

};

struct CGameGeneralScores : public CMwNod {
  CGameGeneralScores();

};

struct CGameManialinkBrowser : public CMwNod {
  CControlFrame* const FramePage;
  CControlFrame* const FrameHeader;
  CMwCmdFiber* const FiberCmd;
  bool Manialink_Enabled;
  bool Manialink_Active;
  wstring ManialinkBrowser_Link;
  MwId ManialinkBrowser_Frame3dFocused;
  void ManialinkBrowser_OnHome();
  void ManialinkBrowser_OnQuit();
  void ManialinkBrowser_OnBack();
  void ManialinkBrowser_OnForward();
  CGameManialinkPage* const CurrentPage;
  CGameManiaApp* const CurrentManiaApp;
};

struct CGameNetFormAdmin : public CNetNod {
  CGameNetFormAdmin();

};

struct CGameNetFileTransfer : public CNetFileTransfer {
};

struct CGameNetFormTimeSync : public CNetFormTimed {
  CGameNetFormTimeSync();

};

struct CGameNetFormCallVote : public CGameNetForm {
  CGameNetFormCallVote();

};

// File extension: 'CtrlCam.Gbx'
struct CGameControlCamera : public CSceneController {
  CGameControlCamera();

  void Reset();
  bool IsActive;
  bool IsFirstPerson;
  uint FollowedGameMobilId;
  float Fov;
  float NearZ;
  float FarZ;
};

// File extension: 'CtrlCamFree.gbx'
struct CGameControlCameraFree : public CGameControlCamera {
  CGameControlCameraFree();

  vec3 Translation;
  float X;
  float Y;
  float Z;
  float Pitch;
  float Yaw;
  float Roll;
  float Radius;
  vec3 RelativeFollowedPos;
  vec3 TargetPos;
  bool TargetIsEnabled;
  float FovY;
  float LimitFovRatioXy;
  float DofFocusZ;
  float DofLensSize;
  bool ClampPitch;
  float ClampPitchMin;
  float ClampPitchMax;
  float Acceleration;
  float StartMoveSpeed;
  uint MoveSpeedCoef; // Range: 0 - 15
  float MoveSpeed;
  float MoveInertia;
  float RotateSpeed;
  float RotateInertia;
  bool UseForcedRoll;
  float ForcedRoll;
  bool DisableMouseZ;
  bool DebugUseOculus;
};

// File extension: 'CtrlCamOrbital3d.gbx'
struct CGameControlCameraOrbital3d : public CGameControlCameraTarget {
  CGameControlCameraOrbital3d();

  bool CanUseRelativeTargetLocation;
  iso4 RelativeTargetLocation;
  float MinFov;
  float MaxFov;
  bool CanCameraMove;
  bool UseAutoRadiusFromTargets;
  vec2 RotateSpeed;
  vec3 RadiusScale;
  bool OcclusionIsEnable;
  bool UsingBorderToRotate;
  float MouseBorderMoveSize;
  float OcclusionTargetRadius;
  float OcclusionDistFromHit;
  float Radius;
  float Latitude;
  float Longitude;
  float WheelSensitivity;
  float FovKeySensitivity;
  float ZoomKeySensitivity;
  float DefaultRadius;
  float RadiusMin;
  float RadiusMax;
  float LatitudeMin;
  float LatitudeMax;
  bool FixedTargetLocation;
  bool UseNonLinearZoom;
};

struct CGameControlCameraEffect : public CMwNod {
  CGameControlCameraEffect();

  void Reset();
  void Install();
  void Uninstall();
  const bool IsInstalled;
};

struct CGameControlCameraEffectGroup : public CGameControlCameraEffect {
  CGameControlCameraEffectGroup();

  const MwFastBuffer<CGameControlCameraEffect*> Effects;
};

struct CGameControlCameraEffectShake : public CGameControlCameraEffect {
  CGameControlCameraEffectShake();

  const vec3 OffsetPos;
  float Yaw;
  float Pitch;
  float Roll;
  float Speed;
  float Intensity;
};

struct CGameControlCameraTarget : public CGameControlCamera {
};

struct CGameRace : public CGameCtnPlayground {
  CScene2d* InterfaceFid;
  void WriteDebugValidateStringToDisk();
};

struct CGameLadderRanking : public CMwNod {
  wstring Name;
  wstring Path;
  string Login;
  string ScoreStr;
  uint Ranking;
  uint Ranking2;
  uint Score;
  uint Stars;
  uint ChildsCount;
  bool IsFolder;
};

struct CGameCtnMediaBlock : public CMwNod {
  const bool IsInstalled;
  const bool IsActive;
  void SwitchOn();
  float Start;
  float End;
};

// File extension: 'GameCtnMediaTrack.gbx'
struct CGameCtnMediaTrack : public CMwNod {
  CGameCtnMediaTrack();

  wstring Name;
  bool IsReadOnly;
  bool IsCycling;
  const MwFastBuffer<CGameCtnMediaBlock*> Blocks;
};

// File extension: 'Clip.gbx'
struct CGameCtnMediaClip : public CMwNod {
  CGameCtnMediaClip();

  wstring Name;
  const MwFastBuffer<CGameCtnMediaTrack*> Tracks;
  uint LocalPlayerGhostId;
  bool StopOnRespawn;
};

// File extension: 'GameCtnMediaClipGroup.gbx'
struct CGameCtnMediaClipGroup : public CMwNod {
  CGameCtnMediaClipGroup();

  const MwFastBuffer<CGameCtnMediaClip*> Clips;
};

struct CGameCtnMediaBlockCamera : public CGameCtnMediaBlock {
  const bool IsInstalled;
  const bool IsActive;
};

// File extension: 'GameCtnMediaBlockUi.gbx'
struct CGameCtnMediaBlockUi : public CGameCtnMediaBlock {
  CGameCtnMediaBlockUi();

  CControlContainer* UserInterface;
};

struct CGameCtnMediaBlockFx : public CGameCtnMediaBlock {
  const float FadeDuration;
  CSceneFx* const SceneFx;
};

struct CGameCtnMediaBlockFxBlur : public CGameCtnMediaBlockFx {
};

// File extension: 'GameCtnMediaBlockFxColors.gbx'
struct CGameCtnMediaBlockFxColors : public CGameCtnMediaBlockFx {
  CGameCtnMediaBlockFxColors();

  void SwitchOn();
};

// File extension: 'GameCtnMediaBlockFxBlurDepth.gbx'
struct CGameCtnMediaBlockFxBlurDepth : public CGameCtnMediaBlockFxBlur {
  CGameCtnMediaBlockFxBlurDepth();

  void SwitchOn();
};

// File extension: 'GameCtnMediaBlockFxBlurMotion.gbx'
struct CGameCtnMediaBlockFxBlurMotion : public CGameCtnMediaBlockFxBlur {
  CGameCtnMediaBlockFxBlurMotion();

};

// File extension: 'GameCtnMediaBlockFxBloom.gbx'
struct CGameCtnMediaBlockFxBloom : public CGameCtnMediaBlockFx {
  CGameCtnMediaBlockFxBloom();

  void SwitchOn();
};

// File extension: 'GameCtnMediaBlockCamGame.gbx'
struct CGameCtnMediaBlockCameraGame : public CGameCtnMediaBlockCamera {
  CGameCtnMediaBlockCameraGame();

  enum class CGameCtnMediaBlockCameraGame::EGameCam {
    None = 0,
    Default = 1,
    Free = 2,
    Spectator = 3,
    Behind = 4,
    Close = 5,
    Internal = 6,
    Helico = 7,
    FirstPerson = 8,
    ThirdPerson = 9,
    ThirdPersonTop = 10,
    Iso = 11,
    IsoFocus = 12,
    Dia3 = 13,
    Board = 14,
    MonoScreen = 15,
    Rear = 16,
    HmdExt = 17,
  };
  const CGameCtnMediaBlockCameraGame::EGameCam GameCam;
  uint GhostId;
};

struct CGameCtnMediaBlockTime : public CGameCtnMediaBlock {
  CGameCtnMediaBlockTime();

  void SwitchOn();
};

struct CGameCtnMediaClipPlayer : public CMwNod {
  CGameCtnMediaClip* const Clip;
  CScene2d* const Scene2d;
  const MwFastBuffer<CGameCtnMediaTrack*> EdMediaTracks;
  const uint LocalPlayerGameMobilId;
};

struct CGameCtnMediaBlockEvent_deprecated : public CGameCtnMediaBlock {
};

struct CGameHud3d : public CMwNod {
  CScene2d* Overlay;
  bool Players;
  bool Markers;
  bool DisplayAvatar;
  bool DisplayName;
  bool DisplayBg;
  bool DisplayEchelon;
  bool DoDistanceFade;
  float DisplaySize;
  vec3 PlayerBaseTint;
  float PlayerBaseAlpha;
  vec3 MarkerBaseTint;
  float MarkerBaseAlpha;
  float WorldCartoucheAltitude;
  float ScreenCartoucheAltitude;
  bool ForceNameShadow;
  float NameClipLengthSizeRatio;
  float NameRatioXY;
  float LineWidthRatio;
  float GaugeYPos;
  float GaugeHeight;
  float GaugeWidth;
  uint VisibilityFadeDuration;
  uint VisibilityTestPeriod;
};

struct CGameManiaNetResource : public CMwNod {
  const string Url;
};

// Description: "User profile."
struct CGamePlayerInfo : public CGameNetPlayerInfo {
  CGamePlayerInfo();

  enum class CGamePlayerInfo::EEchelon {
    None = 0,
    Bronze1 = 1,
    Bronze2 = 2,
    Bronze3 = 3,
    Silver1 = 4,
    Silver2 = 5,
    Silver3 = 6,
    Gold1 = 7,
    Gold2 = 8,
    Gold3 = 9,
  };
  enum class CGamePlayerInfo::ETagType {
    Bronze = 0,
    Silver = 1,
    Gold = 2,
    Nadeo = 3,
  };
  enum class CGamePlayerInfo::EStereoDisplayMode {
    None = 0,
    Stereo = 1,
    HMD = 2,
  };
  enum class CGamePlayerInfo::EMuteSetting {
    Auto = 0,
    Muted = 1,
    NotMuted = 2,
  };
  const string Login; // Maniascript
  wstring Name; // Maniascript
  const wstring AvatarUrl; // Maniascript
  const wstring ZonePath; // Maniascript
  const wstring ZoneFlagUrl; // Maniascript
  const wstring CountryFlagUrl; // Maniascript
  const string Language; // Maniascript
  const wstring Description; // Maniascript
  const vec3 Color; // Maniascript
  const string ClubLink; // Maniascript
  const string BroadcastTVLogin; // Maniascript
  const string SteamUserId; // Maniascript
  const uint FameStars; // Maniascript
  const CGamePlayerInfo::EEchelon Echelon; // Maniascript
  const uint NextEchelonPercent; // Maniascript
  const bool IsBeginner; // Maniascript
  const uint LadderRank; // Maniascript
  const uint LadderTotal; // Maniascript
  const float LadderPoints; // Maniascript
  const wstring LadderZoneName; // Maniascript
  const wstring LadderZoneFlagUrl; // Maniascript
  const bool IsFakeUser; // Maniascript
  const MwFastBuffer<uint> Tags_Favored_Indices; // Maniascript
  const MwFastBuffer<string> Tags_Id; // Maniascript
  const MwFastBuffer<CGamePlayerInfo::ETagType> Tags_Type; // Maniascript
  const MwFastBuffer<wstring> Tags_Comments; // Maniascript
  const MwFastBuffer<wstring> Tags_Deliverer; // Maniascript
  const bool VoiceChat_Supported; // Maniascript
  CGamePlayerInfo::EMuteSetting VoiceChat_MuteSetting; // Maniascript
  const bool VoiceChat_IsSpeaking; // Maniascript
  const bool VoiceChat_IsMuted; // Maniascript
  const uint RequestedClan; // Maniascript
  const bool RequestsSpectate; // Maniascript
  const bool IsConnectedToMasterServer; // Maniascript
  const MwFastBuffer<string> AlliesConnected; // Maniascript
  const CGamePlayerInfo::EStereoDisplayMode StereoDisplayMode; // Maniascript
  bool HackCamHmdDisabled; // Maniascript
  CPlugBitmap* const ZoneBitmap;
  CGameLeague* const ZoneLeague;
  const bool WishSpectator;
  const bool ForcedSpectator;
  uint PlaygroundTeamRequested;
  float LightTrailLinearHue; // Range: 0 - 1
  const wstring StrLadderRanking;
  const wstring StrLadderRankingSimple;
  const string StrLadderScore;
  const string StrLadderLastPoints;
  const string StrLadderWins;
  const string StrLadderDraws;
  const string StrLadderLosses;
  const string StrLadderTeamName;
  const string StrLadderTeamRanking;
  const string StrLadderTeamRankingSimple;
  const string StrLadderNbrTeams;
  const string StrLadderScoreRounded;
  const uint PlaygroundRoundNum;
  const string GameStateName;
};

struct CGamePlayerCameraSet : public CMwNod {
  CGamePlayerCameraSet();

  CGameControlCameraMaster* CamsMaster;
  const MwFastBuffer<CPlugCamControlModel*> CamControlModels;
  uint SwitchDuration;
  enum class CGamePlayerCameraSet::EGameCam {
    None = 0,
    Default = 1,
    Free = 2,
    Spectator = 3,
    Behind = 4,
    Close = 5,
    Internal = 6,
    Helico = 7,
    FirstPerson = 8,
    ThirdPerson = 9,
    ThirdPersonTop = 10,
    Iso = 11,
    IsoFocus = 12,
    Dia3 = 13,
    Board = 14,
    MonoScreen = 15,
    Rear = 16,
    HmdExt = 17,
  };
  CGamePlayerCameraSet::EGameCam DefaultCam;
};

struct CGamePlayerProfile : public CMwNod {
  CGamePlayerProfile();

  string ProfileName;
  const wstring DisplayProfileName;
  const uint TotalPlayTime;
  const MwFastBuffer<CGamePlayerProfileChunk*> Chunks;
  CGamePlayerProfileChunk_AccountSettings* AccountSettings;
  CGamePlayerProfileChunk_GameSettings* GameSettings;
  CGamePlayerProfileChunk_GameScores* GameScores;
  CGamePlayerProfileChunk_GameStats* GameStats;
  CGamePlayerProfileChunk_GlobalInterfaceSettings* GlobalInterfaceSettings;
  CGamePlayerProfileChunk_InterfaceSettings* InterfaceSettings;
  CGamePlayerProfileChunk_VehiclesSettings* VehiclesSettings;
  CGamePlayerProfileChunk_ManiaPlanetStations* ManiaPlanetStations;
  const MwFastBuffer<CGamePlayerProfileChunk_InputBindingsConfig*> InputBindingsConfigs;
  const MwFastBuffer<CGamePlayerProfileChunk_Campaign*> CustomCampaigns;
  const MwFastBuffer<CGamePlayerProfileChunk_PackagesInfos*> PackagesInfosChunks;
  CScriptTraitsPersistent* const ScriptPersistentTraits_NoTitle;
};

struct CGameScriptDebugger : public CMwNod {
  enum class CGameScriptDebugger::EVisibility {
    Hidden = 0,
    Reduced = 1,
    Full = 2,
  };
  CGameScriptDebugger::EVisibility Visibility;
};

// File extension: 'League.Gbx'
struct CGameLeague : public CMwNod {
  CGameLeague();

  wstring Path;
  wstring Name;
  wstring Description;
  string Login;
  uint OnlinePlayersCount;
  uint OnlineHostsCount;
  UnnamedEnum MaxServerLevel;
  bool IsGroup;
  CSystemData* const Logo;
};

struct CGameCtnChallengeGroup : public CMwNod {
  CGameCtnChallengeGroup();

  wstring Name;
  const UnnamedEnum Medal;
  bool Unlocked;
  void CleanChallenges();
  void EmptyChallenges();
};

// File extension: 'GameCtnCampaign.Gbx'
struct CGameCtnCampaign : public CMwNod {
  CGameCtnCampaign();

  MwId CollectionId;
  MwId IconId;
  wstring Name;
  enum class CGameCtnCampaign::EType {
    None = 0,
    Race = 1,
    Puzzle = 2,
    Survival = 3,
    Platform = 4,
    Stunts = 5,
    Training = 6,
  };
  CGameCtnCampaign::EType Type;
  uint Index;
  enum class CGameCtnCampaign::EUnlockType {
    By_Row = 0, // By Row(Nations)
    By_Column = 1, // By Column(United)
    Custom = 2,
  };
  CGameCtnCampaign::EUnlockType UnlockType;
  enum class CGameCtnCampaign::ERequiredPlayersCount {
    Solo_Only = 0, // Solo Only
    Multi_Only = 1, // Multi Only
    Duo_Only = 2, // Duo Only
    Trio_Only = 3, // Trio Only
    Quatuor_Only = 4, // Quatuor Only
    All = 5,
  };
  CGameCtnCampaign::ERequiredPlayersCount RequiredPlayersCount;
  bool IsInternal;
  wstring UnlockedByCampaign;
  uint NbMedals;
  uint NbBronzeMedals;
  uint NbSilverMedals;
  uint NbGoldMedals;
  uint NbAuthorMedals;
  const UnnamedEnum Medal;
  MwFastBuffer<CGameCtnChallengeGroup*> ChallengeGroups;
  void AddChallengeGroup();
  wstring ModeScriptName;
};

struct CGameCtnGhostInfo : public CMwNod {
  const uint Time;
  const uint StuntsScore;
  const string Login;
  const wstring Nickname;
};

struct CGameCtnGhost : public CGameGhost {
  CGameCtnGhost();

  MwId ModelIdentName;
  MwId ModelIdentAuthor;
  UnnamedEnum ModelIdentCollection;
  const uint EventsDuration;
  string GhostLogin;
  wstring GhostNickname;
  wstring GhostAvatarName;
  string RecordingContext;
  vec3 LightTrailColor;
  const uint RaceTime; // Maniascript
  const uint NbRespawns; // Maniascript
  const uint StuntsScore; // Maniascript
  const string Validate_Version;
  const string Validate_RaceSettings;
  const uint Validate_ExeChecksum;
  const uint Validate_OsKind;
  const uint Validate_CpuKind;
  const uint RecordedPlayerUid;
};

// File extension: 'TMReplay.Gbx'
struct CGameCtnReplayRecord : public CMwNod {
  CGameCtnReplayRecord();

  CGameCtnMediaClip* const Clip;
  const MwFastBuffer<CGameCtnGhost*> Ghosts;
  CGameCtnChallenge* Challenge;
  const uint Duration;
  void StopRecord();
  CFuncSegment* HumanTimeToGameTimeFunc;
};

struct CGameCtnReplayRecordInfo : public CGameFid {
  const MwId ChallengeId;
  const MwId CollectionId;
  const uint BestTime;
  const wstring PlayerNickname;
  const string PlayerLogin;
};

struct CGamePlayerOfficialScores : public CMwNod {
  CGamePlayerOfficialScores();

};

struct CGameLadderRankingLeague : public CGameLadderRanking {
};

struct CGameLadderRankingPlayer : public CGameLadderRanking {
};

struct CGameLadderRankingSkill : public CGameLadderRanking {
  const wstring DynamicLeagueName;
  CSystemData* const DynamicLeagueLogo;
};

// File extension: 'Frame.Gbx'
struct CGameControlCard : public CControlFrame {
  CGameControlCard();

  CMwNod* DisplayedNod;
  void ForceReconfig();
  void ConnectChilds();
  void DisconnectChilds();
  bool UseDelays;
  bool UseOwnData;
  bool SelectionEnabled;
  bool CardFocused;
  bool CardSelected;
};

// File extension: 'CtnCtlCardMng.Gbx'
struct CGameControlCardManager : public CMwNod {
  CGameControlCardManager();

  const MwFastBuffer<CGameControlDataType*> DataTypes;
};

// File extension: 'CtnDispType.Gbx'
struct CGameControlDataType : public CMwNod {
  CGameControlDataType();

  string Name;
  CGameControlCard* CardTemplate;
};

struct CGameCtnMediaBlockCameraSimple : public CGameCtnMediaBlockCamera {
  CGameCtnMediaBlockCameraSimple();

  const uint KeyCache;
};

struct CGameCtnMediaBlockCameraOrbital : public CGameCtnMediaBlockCamera {
  CGameCtnMediaBlockCameraOrbital();

  iso4 BaseLocation;
};

// File extension: 'CtnMediaBlockCamPath.gbx'
struct CGameCtnMediaBlockCameraPath : public CGameCtnMediaBlockCamera {
  CGameCtnMediaBlockCameraPath();

  const bool IsPathDirty;
  CFuncKeysTrans* Path;
  const MwFastArray<float> Lengths;
  const float CurveLength;
  const float TotalWeight;
};

// File extension: 'CtnMediaBlockCamCustom.gbx'
struct CGameCtnMediaBlockCameraCustom : public CGameCtnMediaBlockCamera {
  CGameCtnMediaBlockCameraCustom();

  const uint KeyCache;
};

struct CGameCtnMediaBlockCameraEffect : public CGameCtnMediaBlock {
};

// File extension: 'CtnMediaBlockCamFxShake.gbx'
struct CGameCtnMediaBlockCameraEffectShake : public CGameCtnMediaBlockCameraEffect {
  CGameCtnMediaBlockCameraEffectShake();

  CGameControlCameraEffect* const Effect;
};

// File extension: 'GameCtnMediaBlockImage.gbx'
struct CGameCtnMediaBlockImage : public CGameCtnMediaBlock {
  CGameCtnMediaBlockImage();

  CPlugBitmap* Bitmap;
  CControlEffectSimi* const Effect;
  CControlBase* const Mobil;
};

// File extension: 'CtnMediaBlockMusicFx.gbx'
struct CGameCtnMediaBlockMusicEffect : public CGameCtnMediaBlock {
  CGameCtnMediaBlockMusicEffect();

  uint Dummy;
};

// File extension: 'GameCtnMediaBlockSound.gbx'
struct CGameCtnMediaBlockSound : public CGameCtnMediaBlock {
  CGameCtnMediaBlockSound();

  CPlugSound* Sound;
  CAudioSource* AudioSource;
  const bool IsBlockPlaying;
  bool IsLooping;
  bool IsMusic;
  bool StopWithClip;
  uint PlayCount;
  void OnParamsModified();
};

// File extension: 'GameCtnMediaBlockText.gbx'
struct CGameCtnMediaBlockText : public CGameCtnMediaBlock {
  CGameCtnMediaBlockText();

  wstring Text;
  CControlBase* const Mobil;
  CControlEffectSimi* const Effect;
};

// File extension: 'GameCtnMediaBlockTrails.gbx'
struct CGameCtnMediaBlockTrails : public CGameCtnMediaBlock {
  CGameCtnMediaBlockTrails();

};

struct CGameCtnMediaBlockTransition : public CGameCtnMediaBlock {
};

// File extension: 'CtnMediaBlockTransFade.gbx'
struct CGameCtnMediaBlockTransitionFade : public CGameCtnMediaBlockTransition {
  CGameCtnMediaBlockTransitionFade();

  CControlBase* const Mobil;
  vec3 Color;
};

struct CGameCtnMediaBlockUiSimpleEvtsDisplay_deprecated : public CGameCtnMediaBlockUi {
};

struct CGameCtnMediaClipViewer : public CGameSwitcherModule {
  CGameCtnMediaClipViewer();

  const bool DoInputs;
  enum class CGameCtnMediaClipViewer::EStatus {
    Running = 0,
    Exit = 1,
    Next = 2,
  };
  const CGameCtnMediaClipViewer::EStatus ViewerStatus;
  CGameCtnMediaClip* const Clip;
  CGameCtnMediaClipPlayer* const ClipPlayer;
  float PlaySpeed;
  CGameCtnMediaClipGroup* const ClipGroup;
  CGameCtnMediaClip* const ClipGroupClip;
  CGameCtnMediaClipPlayer* const ClipGroupPlayer;
  uint ClipGroupIndex;
  float ClipGroupStartTime;
};

struct CGameCursorBlock : public CMwNod {
  CGameCursorBlock();

  int3 Coord;
  int3 Subdiv;
  int3 SubdivFactors;
  const UnnamedEnum Dir;
  CGameOutlineBox* const CursorBox;
  CPlugTree* const CursorBoxShadow;
  CSceneMobil* const BlockMobil;
  CSceneMobil* const BlockClipsMobil;
  CSceneMobil* const BlockHelperMobil;
  CSceneMobil* const PickerMobil;
  CSceneMobil* const PickerHelperMobil;
  CPlugTree* const DirectionalArrow;
  vec3 CanPlaceColor;
  vec3 CanChangeVariantColor;
  vec3 CanJoinColor;
  vec3 CannotPlaceNorJoinColor;
  vec3 NothingToDoColor;
  vec3 GhostBlockColor;
  vec3 VariantForcedColor;
  float BrightnessFactor;
};

struct CGameCtnEditor : public CGameSwitcherModule {
  CGameScene* const GameScene;
  CGameCamera* const GameCamera;
  CControlContainer* FrameRoot;
};

struct CGameCtnMediaTracker : public CGameCtnEditor {
  CGameCtnMediaTracker();

  UnnamedEnum EditionMode;
  CGameCtnMediaClipPlayer* const MediaClipPlayer;
  CGameSafeFrame* const SafeFrame;
  bool IsDisplayPlayerNames;
  void SafeFrameCreate();
  void SafeFrameDestroy();
  CGameControlCameraFree* const ControlCamFree;
  CGameCtnMediaBlockEditor* const BlockEditor;
  void Undo();
  void Redo();
  void TimePlay();
  void TimeStop();
  void TimePlayFromStart();
  void TimeSlowForward();
  void TimeNormalForward();
  void TimeFirstFrame();
  void TimeLastFrame();
  void ClipInsert();
  void ClipRemove();
  void TrackInsert();
  void TrackRemove();
  void TrackDuplicate();
  void BlockInsert();
  void BlockRemove();
  void BlockCutBefore();
  void BlockCutAfter();
  void KeyInsert();
  void KeyRemove();
  void KeyRemoveAll();
  void StartIsCycling();
  void EndIsCycling();
  void CameraKeyInsert();
  void CutBefore();
  void CutAfter();
  void IncTimeAndInsertKey();
  void MoveFaster();
  void MoveSlower();
  void SafeFrameSwitch();
  void SafeFrameVisibleSwitch();
  void NextKey();
  void PrevKey();
  void FullScreenSwitch();
  void ActionShootScreen();
  void EditClipConfigScript();
  void BlockHelpersSwitch();
  void TriggerModeValidate();
  void TriggerModeUpdateRef();
  void RecordGhostModeStopWait();
  void CursorUp();
  void CursorDown();
  void CursorRotate();
  void CursorSetHeightFromPickedPoint();
  void ClipGroupPreviewStop();
  void OpenInputList();
  void ButExit();
  void ButShootVideo();
  void ButShootScreen();
  void ButRecordGhost();
  void ButComputeShadows();
  void ButPreview();
  void But3dPreview();
  void ButSave();
  void ButExportClip();
  void ButExportClip_OnOk();
  void ButImportClip();
  void ButImportClip_OnOk();
  void ButImportGhosts();
  void ButImportGhosts_OnOk();
  void ButImportAction();
  void ButImportAction_OnOk();
  float OrientWeight;
  float OrientWeightDist;
  int ReplayTime;
  int BlockStart;
  int BlockEnd;
  void ButPrevFrame();
  void ButNextFrame();
  void ClipRename();
  void TrackRename();
  void ClipRemove_Ok();
  void TrackRemove_Ok();
  void BlockRemove_Ok();
  void ButTriggerMode();
  void ButPreviewClipGroup();
  uint MediaTrackerGhostRefIndex;
  uint MediaTrackerGhosts;
  void ButClipCam();
  void ButFreeCam();
  bool ButIsLooping;
  const bool ClipKeepPlaying;
  const bool ClipIsCycling;
  bool ClipIsInside;
  bool ClipIsScriptEvent;
  bool ClipStopOnRespawn;
  enum class CGameCtnMediaTracker::EClipTriggerCond {
    None = 0,
    RaceTime_L = 1, // RaceTime <
    RaceTime_G = 2, // RaceTime >
    Already_Triggered = 3, // Already Triggered
    Speed_L = 4, // Speed <
    Speed_G = 5, // Speed >
    Not_Already_Triggered = 6, // Not Already Triggered
    Max_play_count = 7, // Max play count
    Random_once = 8, // Random once
    Random = 9,
  };
  CGameCtnMediaTracker::EClipTriggerCond ClipTriggerCond;
  float ClipTriggerCondValue;
  bool TrackKeepPlaying;
  bool TrackIsCycling;
  uint ClipMaxPlayedCount;
  const string ActionBinding;
  void ButShowFullTimeLine();
  void ButSmoothSpeed();
  float EntryPlaySpeed;
  void ButResetRoll();
  void ButResetDir();
  void ButCamCustomAdvancedParams();
  void ButCamPathAdvancedParams();
  CControlSimi2* const ControlSimi2;
  MwFastBuffer<CGameCtnMediaClip*> Clips;
  MwFastBuffer<CGameCtnMediaTrack*> Tracks;
  CGameCtnMediaTrack* SelTrack;
  wstring TrackName;
  wstring TrackText;
  float TextPosX;
  float TextPosY;
  float TextDepth; // Range: 0 - 1
  float TextRot;
  float TextScaleX;
  float TextScaleY;
  float TextOpacity; // Range: 0 - 1
  const wstring TrackImage;
  float ImagePosX;
  float ImagePosY;
  float ImageDepth; // Range: 0 - 1
  float ImageRot;
  float ImageScaleX;
  float ImageScaleY;
  float ImageOpacity; // Range: 0 - 1
  void ButChooseImage();
  void ButChooseSound();
  float TransFadeOpacity;
  float CamPosXCamCustom;
  float CamPosYCamCustom;
  float CamPosZCamCustom;
  float CamPitchCamCustom;
  float CamYawCamCustom;
  float CamRollCamCustom;
  float CamFovCamCustom; // Range: 1 - 175
  const uint CamAnchorCamCustom;
  const wstring CamAnchorNameCamCustom;
  bool CamIsAnchorVisibleCamCustom;
  bool CamUseAnchorOrientationCamCustom;
  const uint CamTargetCamCustom;
  const wstring CamTargetNameCamCustom;
  float CamTargetPosXCamCustom;
  float CamTargetPosYCamCustom;
  float CamTargetPosZCamCustom;
  enum class CGameCtnMediaTracker::ECamInterpCamCustom {
    _CameraInterp_None = 0, // |CameraInterp|None
    _CameraInterp_Hermite = 1, // |CameraInterp|Hermite
    _CameraInterp_Linear = 2, // |CameraInterp|Linear
    _CameraInterp_FixedTangent = 3, // |CameraInterp|FixedTangent
  };
  CGameCtnMediaTracker::ECamInterpCamCustom CamInterpCamCustom;
  float CamLeftTangentXCamCustom;
  float CamLeftTangentYCamCustom;
  float CamLeftTangentZCamCustom;
  float CamRightTangentXCamCustom;
  float CamRightTangentYCamCustom;
  float CamRightTangentZCamCustom;
  float CamNearZCamCustom;
  float CamPosXCamPath;
  float CamPosYCamPath;
  float CamPosZCamPath;
  float CamPitchCamPath;
  float CamYawCamPath;
  float CamRollCamPath;
  float CamFovCamPath; // Range: 1 - 175
  const uint CamAnchorCamPath;
  const wstring CamAnchorNameCamPath;
  float CamWeightCamPath;
  bool CamIsAnchorVisibleCamPath;
  bool CamUseAnchorOrientationCamPath;
  const uint CamTargetCamPath;
  const wstring CamTargetNameCamPath;
  float CamTargetPosXCamPath;
  float CamTargetPosYCamPath;
  float CamTargetPosZCamPath;
  float CamNearZCamPath;
  void ButCamAnchorPrev();
  void ButCamAnchorNext();
  void ButCamTargetPrev();
  void ButCamTargetNext();
  const string CamGameCur;
  void ButCamGamePrev();
  void ButCamGameNext();
  const uint CamGameTarget;
  const wstring CamGameTargetName;
  void ButCamGameTargetPrev();
  void ButCamGameTargetNext();
  const wstring VehicleLightTargetName;
  void ButVehicleLightTargetPrev();
  void ButVehicleLightTargetNext();
  float TimeValue;
  float TimeTangent;
  float FxColorsFxIntensity; // Range: 0 - 1
  UnnamedEnum FxColorsZMode;
  float FxColorsZ_Near;
  float FxColorsInverseRGB; // Range: 0 - 1
  float FxColorsHue; // Range: 0 - 1
  float FxColorsSaturation; // Range: -1 - 1
  float FxColorsBrightness; // Range: -0.5 - 0.5
  float FxColorsContrast; // Range: -0.6 - 0.6
  float FxColorsModulateR; // Range: 0.2 - 1
  float FxColorsModulateG; // Range: 0.2 - 1
  float FxColorsModulateB; // Range: 0.2 - 1
  float FxColorsIntensityF; // Range: 0 - 1
  float FxColorsZ_Far;
  float FxColorsInverseRGBF; // Range: 0 - 1
  float FxColorsHueF; // Range: 0 - 1
  float FxColorsSaturationF; // Range: -1 - 1
  float FxColorsBrightnessF; // Range: -0.5 - 0.5
  float FxColorsContrastF; // Range: -0.6 - 0.6
  float FxColorsModulateRF; // Range: 0.2 - 1
  float FxColorsModulateGF; // Range: 0.2 - 1
  float FxColorsModulateBF; // Range: 0.2 - 1
  float FxBlurDepthLensSize;
  bool FxBlurDepthForceZ;
  float FxBlurDepthFocusZ;
  wstring FxCameraMapFileName;
  void ButFxCameraMapScreenShot();
  void ButFxCameraMapReloadFile();
  float CamFxShakeIntensity;
  float CamFxShakeSpeed;
  float CamFxScriptA;
  float CamFxScriptB;
  float CamFxScriptC;
  float StereoSepMax; // Range: 0 - 1
  float StereoSepUpToMax; // Range: 0 - 1
  float StereoScreenDist; // Range: 0.5 - 500
  float DofFocusZ; // Range: 0.5 - 500
  float DofLensSize; // Range: 0 - 1
  const wstring DofTargetName;
  void ButDofTargetPrev();
  void ButDofTargetNext();
  float DofTargetPosX;
  float DofTargetPosY;
  float DofTargetPosZ;
  float ToneMapExposure;
  float ToneMapMaxHDR;
  float ToneMapLightTrailScale;
  uint ToneMapFilmCurve;
  float BloomHdrFxIntensity;
  float BloomHdrStreaksIntensity;
  float BloomHdrStreaksAttenuation;
  float DirtyLensIntensity;
  const wstring ColorGradingName;
  float ColorGradingIntensity;
  void ButChooseColorGrading();
  uint ColoringCapturableIndex;
  float ColoringCapturableHue;
  float ColoringCapturableGauge;
  uint ColoringCapturableEmblemIndex;
  bool ColoringCapturableEmblemBlink;
  uint ColoringBaseBaseIndex;
  float ColoringBaseHue;
  float ColoringBaseIntensity;
  CGameCtnMediaBlockCameraEffectInertialTracking* const SelBlockCamFxTracking;
  float TimeSpeedValue;
  const wstring TrackSound;
  bool SoundIsMusic;
  bool SoundStopWithClip;
  float SoundVolume; // Range: 0 - 1
  float SoundPan; // Range: -1 - 1
  float SoundPosX;
  float SoundPosY;
  float SoundPosZ;
  bool SoundLooping;
  uint SoundPlayCount;
  const wstring SoundTargetName;
  void ButSoundTargetPrev();
  void ButSoundTargetNext();
  bool AudioToSpeak;
  bool ShowHUD;
  bool ShowPing;
  bool ShowCrossHair;
  float CrossHairSizeScale; // Range: 0.1 - 2
  float MusicVolume; // Range: 0 - 1
  float GlobalSoundVolume; // Range: 0 - 1
  wstring GhostName;
  const wstring GhostSkin;
  const uint GhostRaceTime;
  float GhostStartOffset;
  bool GhostNoDamage;
  bool GhostForceLight;
  bool GhostForceTeamColor;
  float GhostLightIntens; // Range: 0 - 1
  void BlockGhost_SetAsCameraTarget();
  void ButGhostSkinSelect();
  bool RenderHq;
  bool RenderHqSoftShadows;
  uint RenderHqCountSS;
  void ButFrameKeyAdvanced();
  bool DrawGhostPaths;
  bool DrawCameraPaths;
  bool GhostPathTranslationC1;
  const wstring GhostSkinSimple;
  void ButGhostSkinSelectSimple();
  CMwNod* DebugNod;
  wstring ManialinkURL;
  wstring ManialinkInterface;
  bool ManialinkInterfaceShow;
  float FogDistance;
  float FogIntensity; // Range: 0 - 1
  float FogSkyIntensity; // Range: 0 - 1
  float FogSliderBlendF; // Range: 0 - 1
  CMwNod* const TriggerOutlineBox;
  CPlugBitmap* const Shoot_Bitmap;
  void ButtonEditCameraEffectScript();
  bool DynaCam_Helpers;
  bool ButtonScreenCaptures;
};

struct CGamePopUp : public CMwNod {
  void OnSelect();
  void OnCancel();
};

struct CGameCtnEdControlCam : public CMwNod {
};

struct CGameCtnEdControlCamCustom : public CGameCtnEdControlCam {
  CGameCtnEdControlCamCustom();

};

struct CGameCtnEdControlCamPath : public CGameCtnEdControlCam {
  CGameCtnEdControlCamPath();

};

struct CGameSafeFrame : public CMwNod {
  CGameSafeFrame();

  uint SafeFrameSizeX;
  uint SafeFrameSizeY;
  float Zoom;
  vec2 Position;
  bool AutoZoom;
};

struct CGameSafeFrameConfig : public CMwNod {
  CGameSafeFrameConfig();

  vec4 Color;
  vec4 LinesColor;
};

struct CGameCtnPainter : public CMwNod {
  CGameCtnPainter();

  UnnamedEnum PainterMode;
  CSceneMobil* const PlayerMobil;
  CGameControlCameraOrbital3d* const ControlCameraOrbital3d;
  CPlugShader* PaintSolidShader;
  CPlugSolid* PaintSolid;
  CPlugBitmap* const IconSkinBitmap;
  CPlugBitmap* const BitmapToPaintSrc;
  CPlugBitmap* const BitmapToPaintDst;
  CGameBadgeStickerSlots* const BadgeStickerSlots;
  bool ButtonFillModeEnabled;
  bool ButtonBrushModeEnabled;
  bool ButtonStickerModeEnabled;
  bool ButtonLayerModeEnabled;
  bool ButtonTeamModeEnabled;
  vec3 PaintColor;
  float Scale; // Range: 0 - 1
  float Angle; // Range: -3 - 3
  float Shininess; // Range: 0 - 1
  float Transparency; // Range: 0 - 1
  bool ButtonPaintSymModeSelected;
  bool ButtonColorPickerModeSelected;
  void OnOkInHelpFrame();
  void OnButtonCurrentColorClicked();
  void OnButtonCustomColor0Clicked();
  void OnButtonCustomColor1Clicked();
  void OnButtonCustomColor2Clicked();
  void OnButtonCustomColor3Clicked();
  void OnButtonCustomColor4Clicked();
  void HasToAlignSticker();
  void ImageQuarterRotLeft();
  void ImageQuarterRotRight();
  void EngageColorChooserMode();
  void Undo();
  void Redo();
  void SaveSkin();
  void SaveSkinAs();
  void SaveSkinAs_OnOk();
  void ReloadSkin();
  void WantHelpDialog();
  bool ButtonPaintWithTextEnabled;
  wstring TextToCreateBitmap;
  CPlugBitmap* BitmapText;
};

struct CGameControlGrid : public CControlGrid {
  CGameControlGrid();

  uint MaxPerColumn;
  uint MaxPerRow;
  uint FastNextPageCount;
  uint FastPreviousPageCount;
  uint ForcedPageCount;
  bool ForceHideArrows;
  bool ForceHidePageCounter;
  bool HaveLocalData;
  bool HideLocalDataIfNone;
  uint CurrentPage;
  uint PageCount;
  void UpdatePageCount();
  void UpdatePageCounter();
  void UpdateNavigationButtons();
  void UpdateLocalData();
  void OnCurrentPageChanged();
  CControlButton* ButtonFirstPage;
  CControlButton* ButtonFastPreviousPage;
  CControlButton* ButtonPreviousPage;
  CControlEntry* EntryPageCounter;
  CControlButton* ButtonNextPage;
  CControlButton* ButtonFastNextPage;
  CControlButton* ButtonLastPage;
  CControlBase* BaseLocalData;
  void OnFirstPage();
  void OnFastPreviousPage();
  void OnPreviousPage();
  void OnNextPage();
  void OnFastNextPage();
  void OnLastPage();
  string StrPageCounter;
  const uint Remote_TotalCount;
  const string Remote_SpecificOverTotalCount;
  CGameRemoteBufferPool* const Remote_Pool;
};

// File extension: 'GameGridCards.Gbx'
struct CGameControlGridCard : public CGameControlGrid {
  CGameControlGridCard();

  CGameControlCardManager* CardManager;
  bool PushByColumns;
  bool LeftToRight;
  bool UpToDown;
  bool CacheAtCreation;
  bool AreCardsReadOnly;
  bool UseCustomSelection;
  bool FillWithDefault;
  string DefaultCardName;
  MwFastBuffer<CMwNod*> NodsToDisplay;
  MwFastBuffer<CGameControlCard*> NodCards;
  void UpdateFromDatas();
  void UpdateOnlyCards();
  void PrecacheAll();
  void CleanCaches();
};

struct CGameCtnNetServerInfo : public CGameNetServerInfo {
  const wstring ServerName; // Maniascript
  const string ServerLogin; // Maniascript
  const string JoinLink; // Maniascript
  const wstring Comment; // Maniascript
  const string ServerVersionBuild; // Maniascript
  const uint PlayerCount; // Maniascript
  const uint MaxPlayerCount; // Maniascript
  const uint SpectatorCount; // Maniascript
  const uint MaxSpectatorCount; // Maniascript
  const float PlayersLevelMin; // Maniascript
  const float PlayersLevelAvg; // Maniascript
  const float PlayersLevelMax; // Maniascript
  const uint ServerLevel; // Maniascript
  const wstring ServerLevelText; // Maniascript
  const wstring ModeName; // Maniascript
  const float LadderServerLimitMax; // Maniascript
  const float LadderServerLimitMin; // Maniascript
  const MwFastBuffer<wstring> PlayerNames; // Maniascript
  const MwFastBuffer<wstring> ChallengeNames; // Maniascript
  const uint NbChallenges; // Maniascript
  const bool HasBuddies; // Maniascript
  const bool IsFavourite; // Maniascript
  const bool IsLobbyServer; // Maniascript
  const bool IsPrivate; // Maniascript
  wstring ServerName_Menu;
  wstring Comment_Menu;
  const string PlayerCountOverMax;
  const UnnamedEnum LadderMode;
  const wstring PlayerName;
  const bool IsBuddy_HackForServerInfoUsedAsPlayer;
  bool AllowDownload;
  bool DisableHorns;
  bool DisableServiceAnnounces;
  string ClientUIRootModuleUrl;
  uint HideServer;
  UnnamedEnum ValidationMode;
  UnnamedEnum ValidationAction_Invalid;
  UnnamedEnum ValidationAction_NA;
  bool IsWarmUp;
  const uint PlaygroundRoundNum;
  const uint PlaygroundRoundNumToPlay;
  const string GameStateName;
  void TeamProfilesAvoidHueOverlap();
  CGameTeamProfile* TeamProfile0;
  CGameTeamProfile* TeamProfile1;
  CGameTeamProfile* TeamProfile2;
  string ForcedClubLinkUrl1;
  string ForcedClubLinkUrl2;
  uint NextMaxPlayerCount;
  uint NextMaxSpectatorCount;
  UnnamedEnum NextLadderMode;
  enum class CGameCtnNetServerInfo::EVehicleNetQuality {
    Low = 0,
    High = 1,
  };
  CGameCtnNetServerInfo::EVehicleNetQuality NextVehicleNetQuality;
  string FirstPartySessionId;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardCtnChallengeInfo : public CGameControlCard {
  CGameControlCardCtnChallengeInfo();

  const MwFastBuffer<CGameLeague*> Groups;
  uint LeagueNameMaxCharsCount;
  const wstring StrFullLeagueName;
  const wstring StrPlayerLeagueRanking;
  const wstring StrChallengeName;
  const wstring StrChallengeAuthor;
  const wstring StrChallengeComments;
  const wstring StrCollectionName;
  const wstring StrCopperPrice;
  const wstring StrPlayerName;
  const wstring StrBronzeScore;
  const wstring StrSilverScore;
  const wstring StrGoldScore;
  const wstring StrAuthorScore;
  const wstring StrPlayerScore;
  const wstring StrPlayerOfficialRecord;
  const string StrCopperString;
  const wstring StrLeagueName;
  const uint Medals;
  const uint TrainingMedal;
  const uint OfficialMedal;
  const uint NextMedalTime;
  const uint PlayerLeagueRanking;
  const uint PlayerSkillScore;
  CPlugBitmap* const BmpLeagueLogo;
  CPlugBitmap* const BmpMood;
  CPlugBitmap* const BmpMod;
  CPlugBitmap* const BmpBannerGrey;
  CPlugBitmap* const BmpBanner;
  void OnRemoveChallenge();
};

// File extension: 'Frame.Gbx'
struct CGameControlCardGeneric : public CGameControlCard {
  CGameControlCardGeneric();

  uint Type;
  string Str1;
  string Str2;
  string Str3;
  string Str4;
  string Str5;
  string Str6;
  string Str7;
  const wstring StrInt1;
  const wstring StrInt2;
  const wstring StrInt3;
  const wstring StrInt4;
  const wstring StrInt5;
  const wstring StrInt6;
  const wstring StrInt7;
  uint Nat1;
  uint Nat2;
  uint Nat3;
  uint Nat4;
  uint Nat5;
  uint Nat6;
  float Real1;
  float Real2;
  float Real3;
  CMwNod* Nod1;
  CMwNod* Nod2;
  CMwNod* Nod3;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardLeague : public CGameControlCard {
  CGameControlCardLeague();

  const wstring StrPath;
  const wstring StrName;
  const wstring StrDescription;
  const string StrOnlinePlayersCount;
  const string StrOnlineHostsCount;
  const string StrLogoUrl;
  CPlugBitmap* Logo;
  const uint MaxLevel;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardCtnNetServerInfo : public CGameControlCard {
  CGameControlCardCtnNetServerInfo();

  enum class CGameControlCardCtnNetServerInfo::ELadderServerType {
    _ServerLevel_Amateurs_place = 1, // |ServerLevel|Amateurs place
    _ServerLevel_Serious_challengers = 2, // |ServerLevel|Serious challengers
    _ServerLevel_Competitive_racers = 3, // |ServerLevel|Competitive racers
    _ServerLevel_Pro_racing = 4, // |ServerLevel|Pro racing
    _ServerLevel_Races_of_champions = 5, // |ServerLevel|Races of champions
    _ServerLevel_Beginners = 6, // |ServerLevel|Beginners
  };
  const wstring StrPath;
  const wstring StrPlayerName;
  const wstring StrServerName;
  const wstring StrHostName;
  const wstring StrPureServerName;
  const wstring StrComment;
  const string StrPlayersCount;
  const string StrPlayersCountMax;
  const string StrSpectatorsCount;
  const string StrSpectatorsCountMax;
  const wstring StrLadderServerLimitMin;
  const wstring StrLadderServerLimitMax;
  const uint LadderMode;
  const uint VehicleQuality;
  const uint RaceType;
  const bool HaveBuddies;
  const bool IsBuddy;
  const bool IsFull;
  const bool IsFullSpectator;
  const bool IsAllowingDownload;
  const bool IsPrivate;
  const bool IsPrivateForSpectator;
  CPlugBitmap* Logo;
  CPlugBitmap* BmpBannerEnv;
  const float PlayersCountRatio;
  const float SpectatorsCountRatio;
  const uint Level;
  const uint State;
  const CGameControlCardCtnNetServerInfo::ELadderServerType LadderServerType;
  void OnChangeBuddyState();
  void OnChangeBuddyState_SetBuddy();
  void OnChangeBuddyState_SetNotBuddy();
  void OnChangeFavouriteState();
  void OnChangeFavouriteState_SetFavourite();
  void OnChangeFavouriteState_SetNotFavourite();
};

// File extension: 'Frame.Gbx'
struct CGameControlCardNetOnlineNews : public CGameControlCard {
  CGameControlCardNetOnlineNews();

  const string StrRepliesTotalCount;
  const string StrStartDate;
  const string StrIconUrl;
  const string StrUrlToReply;
  const wstring StrPath;
  const wstring StrTitle;
  const wstring StrContent;
  CPlugBitmap* Icon;
  void OnViewReplies();
  void OnEditReply();
  void OnUseManiaCode();
};

// File extension: 'Frame.Gbx'
struct CGameControlCardLadderRanking : public CGameControlCard {
  CGameControlCardLadderRanking();

  const uint ChildsCount;
  const uint Ranking;
  const uint Ranking2;
  const uint Medals;
  const uint Medals2;
  const uint Score2;
  const wstring StrName;
  const wstring StrPath;
  const wstring StrScore;
  const float ManiaStarsRatio;
  const string StrLogin;
  const string StrLogoUrl;
  const string StrSubGroupLogoUrl;
  CPlugBitmap* Logo;
  CPlugBitmap* SubGroupLogo;
  bool DoSelectionOnChildsCount;
  bool UseTop3Medals;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardMessage : public CGameControlCard {
  CGameControlCardMessage();

  string StrSender;
  string StrReceiver;
  const string StrSendDate;
  wstring StrSubject;
  wstring StrMessage;
  uint Donation;
  void OnCheckLogin();
};

struct CGameCalendar : public CMwNod {
  MwFastBuffer<CGameCalendarEvent*> Events;
};

struct CGameCalendarEvent : public CMwNod {
  string Date;
  wstring Description;
  CMwNod* Data;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardCalendar : public CGameControlCard {
  CGameControlCardCalendar();

  const wstring StrToday;
  const wstring StrCurrentDate;
  string TodayTextModifier;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardCalendarEvent : public CGameControlCard {
  CGameControlCardCalendarEvent();

  const string StrDate;
  const wstring StrDescription;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardProfile : public CGameControlCard {
  CGameControlCardProfile();

  const wstring StrLogin;
  wstring StrNickName;
  CPlugBitmap* Avatar;
  void OnChooseProfile();
  void OnRemoveProfile();
  void OnConnectProfile();
};

// File extension: 'Frame.Gbx'
struct CGameControlCardCtnReplayRecordInfo : public CGameControlCard {
  CGameControlCardCtnReplayRecordInfo();

  const wstring StrName;
  const uint Time;
  bool ShortName;
  void OnRemoveReplayRecord();
};

struct CGameCtnMenus : public CGameSwitcherModule {
  CGameMenu* Menus;
  CGameMenu* InGameDialogs;
  CGameMenu* Dialogs;
  CGameMenu* SystemDialogs;
  CGameManialinkScriptHandler* const ManialinkScriptHandlerMenus;
  string PasswordString;
  string PasswordString2;
  string PasswordString3;
  float RankingScrollDelay;
  float RankingScrollSpeed;
  string SelectedName;
  wstring SelectedNickname;
  wstring SelectedAvatarName;
  CGameCtnChallengeInfo* const SelectedChallengeInfo;
  const MwFastBuffer<CGameCtnChapter*> EnvironmentChapters;
  void DialogMessenger_Update();
  void DialogMessenger_UpdateButtons();
  void DialogMessenger_Clean();
  void DialogMessenger_NotifyNewMessages();
  void DialogMessenger_OnNewMessage();
  void DialogMessenger_OnShowInbox();
  void DialogMessenger_OnShowOutbox();
  void DialogMessenger_OnSave();
  void DialogMessenger_OnSend();
  void DialogMessenger_OnReply();
  void DialogMessenger_OnSendAll();
  void DialogMessenger_OnRemove();
  void DialogMessenger_OnRemoveAll();
  void DialogMessenger_OnQuit();
  void Dialog_OnValidate_InGame();
  void Dialog_OnCancel_InGame();
  void Dialog_OnValidate_Normal();
  void Dialog_OnCancel_Normal();
  void DialogJoin_OnJoinAsSpectator();
  const MwFastBuffer<CMwNod*> DialogList_Nods;
  void DialogCardGrid_OnOk();
  void DialogCardGrid_OnCancel();
  void DialogCardGrid_OnRefresh();
  void DialogRefereeStatus_OnCancel();
  const MwFastArray<wstring> DialogRefereeStatus_Message;
  wstring DialogChooseSkin_Name;
  bool DialogChooseSkin_SaveAsDds;
  uint DialogChooseSkin_SelectIndex;
  CGameCtnArticle* DialogChooseSkin_Article;
  const MwFastBuffer<CControlListItem*> DialogChooseSkin_SkinsItem;
  string TempLogin;
  string TempPassword;
  bool CheckPassword;
  string TempEMail;
  void DialogConnect_OnRememberPassword();
  void DialogConnect_OnForgotPassword();
  void DialogConnect_OnConnect();
  void DialogConnect_OnCancel();
  void DialogMailAccount_OnOk();
  void DialogMailAccount_OnCancel();
  void DialogGrid_OnSelect();
  void DialogGrid_OnNextPage();
  void DialogGrid_OnPrevPage();
  void DialogGrid_OnOk();
  void DialogGrid_OnCancel();
  void DialogGrid_OnRemove();
  void DialogGrid_OnAdd();
  uint DialogGrid_CurPage;
  void DialogChoosePackDesc_OnNextPage();
  void DialogChoosePackDesc_OnPrevPage();
  void DialogChoosePackDesc_DrawCurPage();
  void DialogChoosePackDesc_OnAddItem();
  uint DialogChoosePackDesc_CurPage;
  void DialogConfirmOfficialRecord_OnPlayOfficial();
  void DialogConfirmOfficialRecord_OnKeepTraining();
  void DialogConfirmOfficial_OnOk();
  void DialogConfirmOfficial_OnCancel();
  void DialogInputSettings();
  void DialogInputSettings_OnClose();
  void DialogInputSettings_OnDeviceSettings();
  void DialogInputSettings_OnPlayerInputs();
  void DialogInputSettings_OnStandardInputs();
  void DialogInputSettings_OnDeviceSettingsApply();
  bool DialogInputSettingsApplyOnlyToThisTitle;
  void DialogInputSettings_OnBindingsUnbindKey();
  void DialogInputSettings_OnBindingsResetToDefaults();
  float DialogInputSettings_AnalogDeadZone; // Range: 0 - 0.25
  float DialogInputSettings_AnalogSensitivity; // Range: 0.1 - 10
  bool DialogInputSettings_AnalogSteerV2;
  float DialogInputSettings_RumbleIntensity; // Range: 0 - 2
  float DialogInputSettings_CenterSpringIntensity; // Range: 0 - 1
  bool DialogInputSettings_MouseLookInvertY;
  UnnamedEnum DialogInputSettings_MouseReleaseKey;
  bool DialogInputSettings_MouseAccel;
  float DialogInputSettings_MouseScaleY; // Range: 0.1 - 3
  float DialogInputSettings_MouseScaleFreeLook; // Range: 0.1 - 3
  float DialogInputSettings_MouseAccelQuantity_NormalizedLog; // Range: 0 - 3
  bool DialogInputSettings_MouseSensitivities_EnableSpecific;
  float DialogInputSettings_MouseSensitivity_Default_Normalized; // Range: 0.2 - 20
  float DialogInputSettings_MouseSensitivity_Laser_Normalized; // Range: 0.2 - 20
  float DialogInputSettings_MouseSensitivity_Default_NormalizedLog; // Range: -1 - 1
  float DialogInputSettings_MouseSensitivity_Laser_NormalizedLog; // Range: -1 - 1
  void DialogInterfaceSettings_OnOk();
  void DialogInterfaceSettings_OnCancel();
  void DialogInterfaceSettings_OnCrosshairNameSelect();
  void DialogInterfaceSettings_OnCrosshairNameSelect_Yes();
  void DialogInterfaceSettings_OnCrosshairNameUseDefault();
  bool DialogInterfaceSettings_CrosshairCustomColor;
  float DialogInterfaceSettings_CrosshairSaturation; // Range: 0 - 1
  float DialogInterfaceSettings_CrosshairSize; // Range: 0.1 - 2
  float DialogInterfaceSettings_CrosshairOpacity; // Range: 0.1 - 1
  const wstring DialogInterfaceSettings_CrosshairName;
  bool DialogInterfaceSettings_AllyCustomColor;
  bool DialogInterfaceSettings_OppoCustomColor;
  float DialogInterfaceSettings_PlayerShieldScale; // Range: 0.1 - 2
  float DialogInterfaceSettings_BulletHueOffset; // Range: -0.5 - 0.5
  float DialogInterfaceSettings_BeaconOpacity; // Range: 0 - 1
  float DialogInterfaceSettings_BeaconSize; // Range: 0.1 - 5
  float DialogInterfaceSettings_BeaconDuration; // Range: 0.5 - 15
  bool DialogInterfaceSettings_BeaconAllowCustom;
  void DialogReportAbuse_OnOk();
  void DialogReportAbuse_OnCancel();
  bool DialogReportAbuse_UploadReplay;
  wstring DialogReportAbuse_Reason;
  void DialogStereoscopySettings_OnQuit();
  void DialogStereoscopySettings_Enable();
  void DialogStereoscopySettings_Disable();
  void DialogStereoscopySettings_DefaultValues();
  float DialogStereoscopySettings_DisplaySize_cm;
  float DialogStereoscopySettings_DisplaySize_inch;
  float DialogStereoscopySettings_Strength; // Range: 0 - 1
  uint DialogStereoscopySettings_StrengthPercent; // Range: 0 - 100
  float DialogStereoscopySettings_ScreenDist; // Range: 1 - 10
  float DialogStereoscopySettings_ColorFactor; // Range: 0 - 1
  UnnamedEnum DialogStereoscopySettings_Mode;
  bool DialogStereoscopySettings_HmdResetOnRaceReset;
  bool DialogStereoscopySettings_HmdGraphicOptions;
  float DialogStereoscopySettings_HmdWorldScale;
  void DialogStereoscopySettings_HmdDetect();
  void DialogChooseEnvironment_OnCancel();
  void DialogEditorMenu();
  void DialogEditorHelp_OnHelpers();
  void DialogEditorMenu_OnShootCollectorIcons();
  void DialogEditorMenu_OnSaveAllBlocks();
  void DialogEditorMenu_OnAutoAddTopBottomFreeClipsForAllBlockInfos();
  void DialogEditorMenu_OnAutoRemoveTopBottomFreeClipsForAllBlockInfos();
  void DialogEditorMenu_OnReturn();
  void DialogEditorAdditionalMenu();
  void DialogEditorAdditionalMenu_OnEditComments();
  void DialogEditorAdditionalMenu_OnChallengeType();
  void DialogEditorAdditionalMenu_OnPlayMap();
  void DialogEditorAdditionalMenu_OnObjectives();
  void DialogEditorAdditionalMenu_OnEditSnapCamera();
  void DialogEditorAdditionalMenu_OnSetDifficulty();
  void DialogEditorAdditionalMenu_OnChooseCustomMusic();
  void DialogEditorAdditionalMenu_OnComputeShadows();
  void DialogEditorAdditionalMenu_OnSetPassword();
  void DialogEditorAdditionalMenu_OnUnlockExperimentalFeatures();
  void DialogEditorAdditionalMenu_OnReturn();
  void DialogEditorAnimAdditionalMenu();
  void DialogEditorAnimAdditionalMenu_OnTestActionWithMode();
  void DialogEditorAnimAdditionalMenu_OnDefineMap();
  void DialogEditorAnimAdditionalMenu_OnReturn();
  void DialogComputeShadowsQuality_VeryFast();
  void DialogComputeShadowsQuality_Fast();
  void DialogComputeShadowsQuality_Default();
  void DialogComputeShadowsQuality_High();
  void DialogComputeShadowsQuality_Ultra();
  bool DialogComputeShadowsQuality_CheckSaveBounces;
  void DialogEditorHelp();
  void DialogEditorHelp_OnOk();
  void DialogActionMakerHelp();
  void DialogActionMakerHelp_OnOk();
  void DialogItemEditorHelp();
  void DialogItemEditorHelp_OnOk();
  void DialogEditorManialinkHelp();
  void DialogEditorManialinkHelp_OnOk();
  void DialogEditorManialinkOptions();
  void DialogEditorManialinkOptions_OnOk();
  void DialogEditorManialinkOptions_OnCancel();
  bool DialogEditorManialinkOptions_ButtonGrid;
  bool DialogEditorManialinkOptions_ButtonSnap;
  wstring DialogEditorManialinkOptions_GridStep;
  wstring DialogEditorManialinkOptions_RotationStep;
  void DialogEditorShiftTrack_OnDown();
  void DialogEditorShiftTrack_OnUp();
  void DialogEditorShiftTrack_OnLeft();
  void DialogEditorShiftTrack_OnRight();
  void DialogEditorShiftTrack_OnCancel();
  void DialogEditorShiftTrack_OnApply();
  int LastShiftX;
  int LastShiftZ;
  void DialogAskPassword();
  void DialogAskPassword_OnOk();
  void DialogAskPassword_OnCancel();
  wstring DialogAskPassword_String;
  void DialogDisplayChallengeCard();
  void DialogDisplayChallengeCard_OnOk();
  CPlugBitmap* ModBitmap;
  void DialogDisplayAnimCard();
  void DialogDisplayAnimCard_OnOk();
  void MenuMain();
  void MenuMain_OnQuit();
  void MenuEditors();
  void MenuEditors_OnLoadChallenge();
  void MenuEditors_OnLoadChallenge_OnSimple();
  void MenuEditors_OnLoadChallenge_OnAdvanced();
  void MenuTitleTools();
  void MenuChallengeSlots();
  void MenuChallengeSlots_OnSlot1();
  void MenuChallengeSlots_OnSlot2();
  void MenuChallengeSlots_OnSlot3();
  void MenuChallengeSlots_OnSlot4();
  void MenuChallengeSlots_OnSlot5();
  void MenuCreateChallenge();
  void MenuCreateChallenge_OnSimple();
  void MenuCreateChallenge_OnAdvanced();
  void MenuLoadSimpleChallenge_OnSimple();
  void MenuLoadSimpleChallenge_OnAdvanced();
  void MenuChooseChallenge_OnSelect();
  void MenuChooseChallenge_OnBack();
  void MenuChooseChallenge_OnRefresh();
  void MenuChooseChallenge_OnOk();
  void MenuChooseChallenge_OnPathUp();
  void MenuChooseChallenge_OnOpenInExplorer();
  void MenuChooseChallenge_OnChangeLeague();
  void MenuChooseChallenge_OnChallengeRemoved();
  void MenuChooseChallenge_OnChallengeRemovedConfirmed();
  void MenuChooseChallenge_SelectOrUnselectAll();
  void MenuPlayChallenge_Edit();
  const uint MenuChooseChallenge_ChallengesCount;
  const bool MenuSoloLadderBoth_ShowSkillPointsOrElseMedals;
  bool MenuChooseChallenge_Flatten;
  bool MenuChooseChallenge_SortByName;
  bool MenuChooseChallenge_SortOrderAsc;
  bool SelectAll;
  const wstring HierarchyPath;
  wstring MenuChooseChallenge_FilterString;
  void MenuMultiLocal();
  void MenuMultiLocal_OnBack();
  void MenuMultiLocal_OnOk();
  void MenuMultiLocal_OnConfigureInputs();
  MwFastBuffer<bool> MenuMultiLocal_SetUsedPlayersCount;
  void MenuProfileAdvanced();
  void MenuProfile();
  void MenuProfile_Launch();
  void MenuProfile_OnChooseAvatar();
  void MenuProfile_OnChangeHorn();
  void MenuProfile_OnReceiveNews();
  void MenuProfile_OnGroupSelected();
  void MenuProfile_OnAddGroup();
  void MenuProfile_RemoveGroup();
  void MenuProfile_OnChangeZone();
  void MenuProfile_OnConvertAccount();
  void MenuProfile_OnDisconnectAccount();
  void MenuProfile_OnDisconnectAccountConfirmed();
  void MenuProfile_OnCheckModifications();
  void MenuProfile_OnChangePass();
  void MenuProfile_OnShowGameKeyInSteam();
  void MenuProfile_OnEditPodiumAnimWin();
  void MenuProfile_OnEditPodiumAnimLose();
  float MenuProfile_SoundPitchLog; // Range: -0.5 - 2
  bool MenuProfile_ParentalLock;
  CGameAvatar* const MenuProfile_Avatar;
  CGameLeague* const Menu_GroupToManage;
  const uint MenuProfile_GroupsCount;
  wstring MenuProfile_HornName;
  void DialogManageGroup_Create();
  void DialogManageGroup_ViewPlayers();
  void DialogManageGroup_Invite();
  void DialogManageGroup_Unsubscribe();
  void DialogManageGroup_SetDefault();
  void DialogViewPlayersInGroup_Ok();
  void DialogInviteToGroup_Add();
  void DialogInviteToGroup_Cancel();
  wstring DialogManageGroup_Name;
  string DialogManageGroup_Login;
  string DialogManageGroup_Pass;
  string DialogManageGroup_PassConfirm;
  void MenuPaintVehicle();
  void MenuPaintVehicle_OnBackConfirm();
  void MenuPaintVehicle_OnBack();
  CGameCtnPainter* Painter;
  void DialogRegisterAccountChoice_CreateNewAccount();
  void DialogRegisterAccountChoice_UseExistingAccount();
  void DialogRegisterAccountChoice_Offline();
  string DialogEula_AgeString;
  uint DialogEula_Age;
  bool DialogEula_EulaValidated;
  bool DialogEula_PrivacyPolicyValidated;
  void DialogEula_OnOk();
  void DialogEula_OnCancel();
  void DialogOnlineAccount_OnCancel();
  void DialogOnlineAccount_OnOk();
  void DialogOnlineAccount_OnCheckLogin();
  void DialogOnlineAccountInfo_OnCopyToClipboard();
  void DialogOnlineAccountError_OnOk();
  void DialogOnlineAccountError_OnCancel();
  void DialogOnlineAccountError_OnMailAccount();
  void DialogOnlineAccount_OnRememberPassword();
  void DialogOnlineAccountPersonnal_OnReceiveNews();
  bool DialogOnlineAccount_ChooseLogin1;
  bool DialogOnlineAccount_ChooseLogin2;
  bool DialogOnlineAccount_ChooseLogin3;
  CGameLeague* const DialogOnlineAccount_SubscriptionLeague;
  void DialogOnlineAccountPersonnal_OnCancel();
  void DialogOnlineAccountPersonnal_OnOk();
  void DialogBuyTitlePackages_OnPay();
  void DialogBuyTitlePackages_OnEnterKey();
  void DialogBuyTitlePackages_OnBuyAndEnterKey();
  void DialogBuyTitlePackages_OnBuyKeyAndRefresh();
  void DialogBuyTitlePackages_OnBuyKeyAndQuit();
  void DialogBuyTitlePackages_OnCancel();
  void DialogBuyManiaPlanetStations_OnEnterKey();
  void DialogBuyManiaPlanetStations_OnPay();
  void DialogBuyManiaPlanetStations_OnCancel();
  void DialogGeneratedGameKeys_OnCopyToClipboard();
  void DialogImportAccount_OnImport();
  void DialogImportAccount_OnCancel();
  bool ImportAccount_UseFreeAccountLogin;
  string ImportAccount_Login;
  string ImportAccount_Pass;
  void DialogConvertAccount_OnConvert();
  void DialogConvertAccount_OnCancel();
  string ConvertAccount_Key;
  string OnlineAccount_Key;
  string OnlineAccount_Login;
  string OnlineAccount_Pass;
  string OnlineAccount_PassConfirm;
  string OnlineAccount_PassNew;
  uint OnlineAccount_Age;
  string OnlineAccount_EMail;
  string OnlineAccount_EMailConfirm;
  wstring OnlineAccount_NickName;
  wstring OnlineAccount_Path;
  CGameLeague* OnlineAccount_NewLeague;
  bool OnlineAccount_AcceptNews;
  string YoutubeCode;
  const MwFastBuffer<CControlListItem*> DialogPlayers;
  const MwFastBuffer<CControlListItem*> ConfirmFiles;
  MwFastBuffer<CGameCtnReplayRecordInfo*> ReplayInfos;
  void MenuMultiPlayerNetworkLan_OnRefresh();
  void MenuMultiPlayerNetworkLan_OnSel();
  void MenuMultiPlayerNetworkLan_OnCreate();
  void MenuMultiPlayerNetworkLan_OnBack();
  const uint MenuMultiPlayerNetworkLan_ServersCount;
  const uint MenuMultiPlayerNetworkLan_PlayersCount;
  CGameCtnNetServerInfo* MenuMultiPlayerNetworkCreate_ServerInfo;
  void MenuMultiPlayerNetworkCreate();
  void MenuMultiPlayerNetworkCreate_OnStart();
  void MenuMultiPlayerNetworkCreate_OnBack();
  void MenuMultiPlayerNetworkCreate_OnAdvanced();
  void MenuMultiPlayerNetworkCreate_OnLoadSettings();
  void MenuMultiPlayerNetworkCreate_OnLoadSettings_OnYes();
  wstring DialogRemoteBrowser_ToFind;
  void DialogRemoteBrowser_OnClose();
  void DialogRemoteBrowser_OnFind();
  void MenuInternetLeague_OnAll();
  void MenuInternetLeague_OnFavorites();
  void MenuInternetLeague_OnRankings();
  void MenuInternetLeague_OnCreate();
  void MenuInternetLeague_OnBack();
  void MenuInternetLeague_OnRefresh();
  void MenuInternetLeague_OnRefreshSimple();
  void MenuInternetLeague_OnHierarchyUp();
  void MenuInternetLeague_OnHierarchyItemSelected();
  void MenuInternetLeague_OnServerSelected();
  void MenuInternetLeague_OnPlayerSelected();
  void MenuInternetLeague_OnFilterGameMode();
  void MenuInternetLeague_OnFilterEnvironment();
  void MenuInternetLeague_BrowseServers();
  void MenuInternetLeague_BrowsePlayers();
  void MenuInternetLeague_OnChangeBuddyState();
  void MenuInternetLeague_OnLadderHierarchyUp();
  void MenuInternetLeague_SwitchServersPlayers();
  void MenuInternetLeague_SwitchLeaguesPlayersLadder();
  wstring MenuInternetLeague_Today;
  wstring MenuInternet_Path;
  const wstring MenuInternet_LadderCurrentLeagueName;
  const wstring MenuInternetLeague_CurrentLeagueName;
  const wstring MenuInternetLeague_CurrentLeagueDescription;
  void DialogChooseGameModeFilter_OnGameModeChoosen();
  void DialogChooseEnvironmentFilter_OnEnvironmentChosen();
  void MenuHotSeatCreate();
  void MenuHotSeatCreate_Start();
  void MenuHotSeatCreate_LoadSettings();
  void MenuHotSeatCreate_OnBack();
  void MenuHotSeatCreate_OnOk();
  uint HotSeatTime;
  uint HotSeatTries;
  UnnamedEnum HotSeatGameMode;
  void MenuSplitScreenMode_OnParty();
  void MenuSplitScreenMode_OnTeam();
  void MenuSplitScreenMode_OnCompetition();
  void MenuSplitScreenMode_OnOk();
  void MenuSplitScreenMode_OnBack();
  void MenuSplitScreenControls_Start();
  void MenuSplitScreenControlsAndPlayers_OnBack();
  void MenuSplitScreenControlsAndPlayers_OnOk();
  void MenuSplitScreenControls_OnScreen1();
  void MenuSplitScreenControls_OnScreen2();
  void MenuSplitScreenControls_OnScreen3();
  void MenuSplitScreenControls_OnScreen4();
  bool SplitScreen_2Players;
  bool SplitScreen_3Players;
  bool SplitScreen_4Players;
  bool SplitScreen_ScoreLeft;
  bool SplitScreen_ScoreMiddle;
  bool SplitScreen_ScoreRight;
  bool SplitScreen_SplitVertical;
  bool SplitScreen_SplitHorizontal;
  uint MenuSplitScreenMode_TeamTime;
  uint MenuSplitScreenMode_PartyTime;
  uint MenuSplitScreenMode_CompetitionPoints;
  void DialogChooseInputDevice_OnCancel();
  void DialogChooseInputDevice_OnCardSelected();
  void DialogChooseInputDevice_OnSet();
  void DialogSetInputDevice_OnOk();
  void MenuReplay_OnBack();
  void MenuReplay_OnRefresh();
  void MenuReplay_OnSelectDir();
  void MenuReplay_OnSelectReplay();
  void MenuReplay_OnOk();
  void MenuReplay_OnSelectAll();
  void MenuReplay_FilterAndRedraw();
  void MenuReplay_OnPathUp();
  void MenuReplay_OnOpenInExplorer();
  bool MenuReplay_Flatten;
  bool MenuReplay_SortByName;
  bool MenuReplay_SortOrderAsc;
  void MenuReplay_OnReplayRemovedConfirmed();
  const wstring MenuReplay_CurPath;
  const uint MenuReplay_ReplaysCount;
  const MwFastBuffer<CGameCtnReplayRecordInfo*> ReplayList;
  const MwFastBuffer<CGameCtnReplayRecordInfo*> ReplayDirsList;
  void DialogReplayLoaded_OnPlayAgainst();
  void DialogReplayLoaded_OnWatch();
  void DialogReplayLoaded_OnEdit();
  void DialogReplayLoaded_OnCancel();
  void DialogViewReplay_OnView();
  void DialogViewReplay_OnEdit();
  void DialogViewReplay_OnSimpleEdit();
  void DialogViewReplay_OnValidate();
  void DialogViewReplay_OnPlay();
  void DialogViewReplay_OnBench();
  void DialogViewReplay_OnShootVideo();
  void DialogViewReplay_OnConcatenate();
  void DialogViewReplay_OnBack();
  void DialogViewReplay_OnExportToValidate();
  void DialogViewReplay_OnExportChallengeAndReplay();
  const uint DialogViewReplay_ReplayTime;
  const wstring DialogViewReplay_ReplayAuthorLogin;
  const wstring DialogViewReplay_ReplayMapName;
  const wstring DialogViewReplay_ReplayScriptShortName;
  void DialogViewAction_OnWeaponBullet();
  void DialogViewAction_OnWeaponLaser();
  void DialogViewAction_OnMove();
  void DialogViewAction_OnStatic();
  void DialogViewAction_OnBack();
  void DialogViewAction_OnLoadAction();
  void DialogViewItem_OnBot();
  void DialogViewItem_OnPickUp();
  void DialogViewItem_OnSpot();
  void DialogViewItem_OnDecoration();
  void DialogViewItem_OnCannon();
  void DialogViewItem_OnDecal();
  void DialogViewItem_OnVehicle();
  void DialogViewItem_OnBack();
  void DialogViewModule_OnHud();
  void DialogViewModule_OnInventory();
  void DialogViewModule_OnMinimap();
  void DialogViewModule_OnStore();
  void DialogViewModule_OnScoresTable();
  void DialogViewModule_OnMenuBase();
  void DialogViewModule_OnMenuBrowser();
  void DialogViewModule_OnBack();
  void DialogViewModuleMenuComponent_OnLadderRankings();
  void DialogViewModuleMenuComponent_OnServerBrowser();
  void DialogViewModuleMenuComponent_OnBack();
  void DialogViewScoresTableColumn_OnAvatar();
  void DialogViewScoresTableColumn_OnPlayerName();
  void DialogViewScoresTableColumn_OnManiaStars();
  void DialogViewScoresTableColumn_OnTools();
  void DialogViewScoresTableColumn_OnTags();
  void DialogViewScoresTableColumn_OnSMPoints();
  void DialogViewScoresTableColumn_OnSMRoundPoints();
  void DialogViewScoresTableColumn_OnTMBestTime();
  void DialogViewScoresTableColumn_OnTMPrevTime();
  void DialogViewScoresTableColumn_OnTMBestLapTime();
  void DialogViewScoresTableColumn_OnTMStunts();
  void DialogViewScoresTableColumn_OnTMRespawns();
  void DialogViewScoresTableColumn_OnTMCheckpoints();
  void DialogViewScoresTableColumn_OnTMPoints();
  void DialogViewScoresTableColumn_OnTMPrevRaceDeltaPoints();
  void DialogViewScoresTableColumn_OnCustomReal();
  void DialogViewScoresTableColumn_OnCustomString();
  void DialogViewScoresTableColumn_OnCustomNatural();
  void DialogViewScoresTableColumn_OnCustomInteger();
  void DialogViewScoresTableColumn_OnCustomTime();
  void DialogViewScoresTableColumn_OnBack();
  void InputsList_ResetToDefaults_OnYes();
  const MwFastBuffer<CControlListItem*> InputsList_Actions;
  void InputDevicesList_OnButtonRemove_OnYes();
  void MenuConfigureInputs();
  void MenuConfigureInputs_OnBack();
  void MenuConfigureInputs_SetDefaults();
  void MenuConfigureInputs_OnPlayerInputs();
  void MenuConfigureInputs_OnStandardInputs();
  void MenuConfigureInputs_OnSplitScreenInputs();
  void MenuConfigureInputs_OnUnbindKey();
  void DialogChooseProfile_OnAdd();
  void DialogChooseProfile_OnSelect();
  void DialogChooseProfile_OnCancel();
  bool DialogChooseProfile_PrivateSession;
  void DialogChooseProfileWelcome_OnConnect();
  void DialogChooseProfileWelcome_OnChangeAccount();
  void DialogChooseProfileWelcome_OnPrivateSession();
  void DialogChooseProfileWelcome_OnStayOffline();
  void DialogInGameMenu_OnAdvanced();
  void DialogInGameMenu_OnServerSettings();
  void DialogInGameMenu_OnResume();
  void DialogInGameMenu_Spectator();
  void DialogInGameMenu_Buddy();
  void DialogInGameMenu_Abuse();
  void DialogInGameMenu_Kick();
  void DialogInGameMenu_Ban();
  void DialogInGameMenu_OnQuit();
  void DialogInGameMenu_OnChangeTeam();
  void DialogInGameMenu_OnValidateBest();
  void DialogInGameMenu_OnRetire();
  void DialogInGameMenu_SwitchFavourite();
  void DialogInGameMenu_OnSoloOfficialMode();
  void DialogInGameMenu_OnTrackRankings();
  void DialogInGameMenuAdvanced_OnPlayerProfile();
  void DialogInGameMenuAdvanced_OnCancel();
  void DialogInGameMenuAdvanced_OnInputSettings();
  void DialogInGameMenuAdvanced_OnInterfaceSettings();
  void DialogInGameMenuAdvanced_OnStereoscopySettings();
  void DialogInGameMenuAdvanced_OnSaveReplay();
  void DialogInGameMenuAdvanced_OnSavePrevReplay();
  void DialogInGameMenuAdvanced_OnBecomeReferee();
  void DialogInGameMenuAdvanced_OnSaveChallenge();
  void DialogInGameMenuAdvanced_OnVote();
  void DialogChangeTeam();
  void DialogChangeTeam_OnJoinTeam1();
  void DialogChangeTeam_OnJoinTeam2();
  void DialogChangeTeam_OnCancel();
  const MwFastBuffer<CControlListItem*> DialogChangeTeam_Players1;
  const MwFastBuffer<CControlListItem*> DialogChangeTeam_Players2;
  void DialogPlayerProfile_OnOk();
  void DialogPlayerProfile_OnPrevPlayer();
  void DialogPlayerProfile_OnNextPlayer();
  void DialogPlayerProfile_OnHorn();
  void DialogPlayerProfile_Buddy();
  void DialogPlayerProfile_Kick();
  void DialogPlayerProfile_Ban();
  void DialogPlayerProfile_Abuse();
  void DialogPlayerProfile_Validate();
  void DialogLadderRankingsOld_OnOk();
  void DialogLadderRankingsOld_OnBack();
  void DialogLadderRankingsOld_OnShowCurrentPlayersRankings();
  void DialogLadderRankingsOld_OnSelectItem();
  void DialogLadderRankings_OnOk();
  void DialogLadderRankings_OnBack();
  void DialogLadderRankings_OnShowCurrentPlayersRankings();
  void DialogLadderRankings_OnRankingSelected();
  void DialogVote_OnVoteYes();
  void DialogVote_OnVoteNo();
  void DialogVote_OnCancel();
  void DialogInGameAskYesNo_Yes();
  void DialogInGameAskYesNo_No();
  CScene2d* const DialogPlayerProfile_VehicleOverlayScene;
  void DialogManiaCodeActionsList_Ok();
  void DialogManiaCodeActionsList_Cancel();
  void DialogAskIncreaseCacheSize_OnYes();
  void DialogAskIncreaseCacheSize_OnNo();
  void DialogAskIncreaseCacheSize_OnNever();
  void DialogChooseLeague();
  void DialogChooseLeague_Clean();
  void DialogChooseLeague_UpdateThisLevel();
  void DialogChooseLeague_OnSelect();
  void DialogChooseLeague_OnOk();
  void DialogChooseLeague_OnCancel();
  const wstring DialogChooseLeague_CurrentPath;
  const wstring DialogChooseLeague_DisplayableCurrentPath;
  void DialogCreateProfile_OnOk();
  void DialogCreateProfile_OnCancel();
  void DialogCreateProfile_OnAvatar();
  void DialogChooseAvatar_OnCancel();
  void DialogChooseAvatar_OnAddAvatar();
  bool NeverAskAgain;
  const MwFastBuffer<CControlListItem*> DataInfos;
  void DialogCredits_NonBlocking();
  bool DialogConnect_RememberOnlinePassword;
  bool DialogOnlineAccount_RememberOnlinePassword;
  bool DialogOnlineAccountPersonnal_ReceiveNews;
  void DialogAddOrInviteBuddy_OnAdd();
  CGameLeague* const DialogAddOrInviteBuddy_SelectedGroup;
  bool DialogAddOrInviteBuddy_InviteToJoinAGroup;
  void DialogAddOrInviteBuddy_OnMail();
  void DialogAddOrInviteBuddy_OnCancel();
  string DialogAddOrInviteBuddy_Login;
  string DialogAddOrInviteBuddy_EMail;
  void DialogSelectGroup_OnSelect();
  void DialogSelectGroup_CreateNew();
  void DialogSelectGroup_Cancel();
  uint DialogGraphicSettings_DisplayMode;
  const string DialogGraphicSettings_Resolution;
  uint DialogGraphicSettings_WindowSizeX;
  uint DialogGraphicSettings_WindowSizeY;
  bool DialogGraphicSettings_WindowBorder;
  UnnamedEnum DialogGraphicSettings_DisplayRatio;
  uint DialogGraphicSettings_Antialias;
  uint DialogGraphicSettings_Filter;
  uint DialogGraphicSettings_MaxFps;
  uint DialogGraphicSettings_GpuSync;
  uint DialogGraphicSettings_DisplaySync;
  uint DialogGraphicSettings_TripleBuffer;
  uint DialogGraphicSettings_WaterReflect;
  uint DialogGraphicSettings_CarReflect;
  uint DialogGraphicSettings_Bloom;
  uint DialogGraphicSettings_MotionBlur;
  float DialogGraphicSettings_MotionBlurIntens; // Range: 0 - 1
  uint DialogGraphicSettings_SSAO;
  float DialogGraphicSettings_FogScale; // Range: 0 - 1
  uint DialogGraphicSettings_ScreenShotExt;
  void DialogGraphicSettings_OnApply();
  void DialogGraphicSettings_OnCancel();
  void DialogGraphicSettings_OnAdvanced();
  void DialogGraphicSettings_OnBroadcast();
  uint DialogBroadcast_Provider;
  string DialogBroadcast_Login;
  string DialogBroadcast_Password;
  uint DialogBroadcast_Resolution;
  uint DialogBroadcast_VideoMaxKbps;
  uint DialogBroadcast_VideoTargetFps;
  uint DialogBroadcast_VideoCpuUsage;
  bool DialogBroadcast_AudioEnable;
  float DialogBroadcast_AudioVolumePlayback; // Range: 0 - 1
  float DialogBroadcast_AudioVolumeRecorder; // Range: 0 - 1
  void DialogBroadcast_StartStop();
  const wstring DialogBroadcast_UserOutput;
  uint MenuProfile_TagsAdmin_CurTag;
  const uint MenuProfile_TagsAdmin_TagCount;
  bool MenuProfile_TagsAdmin_CurTagIsAvailableForConsultation;
  void DialogSetChallengeType();
  void DialogSetChallengeType_OnOk();
  void DialogSetChallengeType_ShowPickType();
  void DialogSetChallengeType_ShowPickStyle();
  void DialogSetChallengeType_TypePicked();
  void DialogSetChallengeType_StylePicked();
  uint ChallengeType_NbLaps;
  CGameCtnChallenge* const CurGameChallenge;
  void DialogSetDifficulty();
  void DialogSetDifficulty_OnOk();
  UnnamedEnum ChallengeDifficulty;
  void DialogUnlockExperimentalFeatures();
  void DialogUnlockExperimentalFeatures_OnOk();
  void DialogCreateObjectives();
  void DialogCreateObjectives_OnValidate();
  uint CreateObjectives_GoldTime;
  uint CreateObjectives_SilverTime;
  uint CreateObjectives_BronzeTime;
  void DialogEditCutScenes_OnIntroEdit();
  void DialogEditCutScenes_OnIntroRemove();
  void DialogEditCutScenes_OnPodiumEdit();
  void DialogEditCutScenes_OnPodiumRemove();
  void DialogEditCutScenes_OnInGameEdit();
  void DialogEditCutScenes_OnInGameRemove();
  void DialogEditCutScenes_OnEndRaceEdit();
  void DialogEditCutScenes_OnEndRaceRemove();
  void DialogEditCutScenes_OnAmbianceEdit();
  void DialogEditCutScenes_OnAmbianceRemove();
  void DialogEditCutScenes_OnRecordMediaTrackerGhost();
  void DialogEndRaceSummary_OnReplay();
  void DialogGainMedalMoney_OnOk();
  void DialogEditCardEventsDeck_OnAdd();
  void DialogEditCardEventsDeck_OnRemove();
  void DialogEditCardEventsDeck_OnOk();
  void DialogEditCardEventsDeck_OnAvailableCardEventSelect();
  void DialogEditCardEventsDeck_OnCurrentCardEventSelect();
  string DialogEditCardEventsDeck_DeckIdName;
  void DialogSelectCardEventsDeck_OnDeckSelected();
  void DialogSelectCardEventsDeck_OnAdd();
  void DialogSelectCardEventsDeck_OnAddCheckName();
  void DialogSelectCardEventsDeck_OnRemove();
  void DialogSelectCardEventsDeck_OnRemoveYes();
  void DialogSelectCardEventsDeck_OnRename();
  void DialogSelectCardEventsDeck_OnRenameCheckName();
  void DialogSelectCardEventsDeck_OnEdit();
  void DialogSelectCardEventsDeck_OnOk();
  string DialogSelectCardEventsDeck_DeckName;
  void DialogEditorSelectDecal_OnSolidVariant1();
  void DialogEditorSelectDecal_OnSolidVariant2();
  void DialogEditorSelectDecal_OnSolidVariant3();
  void DialogEditorSelectDecal_OnSolidVariant4();
  void DialogEditorSelectDecal_OnSolidVariant5();
  void DialogEditorSelectDecal_OnSolidVariant6();
  void DialogEditorSelectDecal_OnSolidVariant7();
  void DialogEditorSelectDecal_OnSolidVariant8();
  void DialogEditorSelectDecal_OnSolidVariant9();
  void DialogEditorSelectDecal_OnSolidVariant10();
  void DialogEditorSelectDecal_OnType1();
  void DialogEditorSelectDecal_OnType2();
  void DialogEditorSelectDecal_OnType3();
  void DialogEditorSelectDecal_OnType4();
  void DialogEditorSelectDecal_OnType5();
  void DialogEditorSelectDecal_OnType6();
  void DialogEditorSelectDecal_OnDensity1();
  void DialogEditorSelectDecal_OnDensity2();
  void DialogEditorSelectDecal_OnDensity3();
  void DialogEditorSelectDecal_OnVariant1();
  void DialogEditorSelectDecal_OnVariant2();
  void DialogEditorSelectDecal_OnVariant3();
  void DialogEditorSelectDecal_OnVariant4();
  void DialogEditorSelectDecal_OnVariant5();
  void DialogEditorSelectDecal_OnVariant6();
  void DialogEditorSelectDecal_OnVariant7();
  void DialogEditorSelectDecal_OnVariant8();
  void DialogEditorSelectDecal_OnVariant9();
  void DialogEditorSelectDecal_OnVariant10();
  void DialogEditorSelectDecal_OnOk();
  void DialogEditorSelectDecal_OnBack();
  wstring DialogEditScript_TempText;
  wstring DialogEditScript_TempSearchText;
  uint DialogEditScript_TempLineNumber;
  wstring DialogEditScript_TempReplaceText;
  void DialogEditScript_Ok();
  void DialogEditScript_Cancel();
  void DialogEditScript_Compile();
  void DialogEditScript_Save();
  void DialogEditScript_Save_Done();
  void DialogEditScript_SaveAllFiles_Step2();
  void DialogEditScript_Find();
  void DialogEditScript_ToggleIncludes();
  void DialogEditScript_DisplayLayout();
  void DialogLayoutMaker_Exit();
  CPlugCharPhySpecialProperty* DialogEditBlockSpecialProperty_Property;
  void DialogEditBlockSpecialProperty_OnOk();
  void DialogEditBlockSpecialProperty_OnCancel();
  void DialogEditBlockSpecialProperty_OnCustom();
  void DialogEditBlockSpecialProperty_OnDefault();
  void DialogChooseMapTypeForEditorSimple_OnMapTypeChosen();
  void DialogUpdateFiles_Abort();
  const float DialogUpdateFiles_OverallProgress; // Range: 0 - 1
  const float DialogUpdateFiles_CurrentProgress; // Range: 0 - 1
  CGameMenuSkinChooser* const MenuSkinChooser;
};

struct CGameLadderRankingCtnChallengeAchievement : public CGameLadderRanking {
};

struct CGameCtnNetForm : public CGameNetForm {
  CGameCtnNetForm();

};

struct CGameRemoteBufferDataInfoFinds : public CGameRemoteBufferDataInfo {
  uint RefreshPlayerDuration;
  uint RefreshServerDuration;
  uint CountPlayerPerPage;
  uint CountServerPerPage;
};

struct CGameRemoteBufferDataInfoRankings : public CGameRemoteBufferDataInfo {
  uint RefreshLeagueRankingDuration;
  uint RefreshPlayerRankingDuration;
  uint RefreshTeamRankingDuration;
  uint RefreshSkillRankingDuration;
  uint RefreshAchievementRankingDuration;
  uint CountLeagueRankingPerPage;
  uint CountPlayerRankingPerPage;
  uint CountTeamRankingPerPage;
  uint CountSkillRankingPerPage;
  uint CountAchievementRankingPerPage;
};

struct CGameRemoteBufferDataInfoSearchs : public CGameRemoteBufferDataInfo {
  uint RefreshLeaguesDuration;
  uint RefreshServersDuration;
  uint RefreshServersSuggestedDuration;
  uint RefreshServersFavouritesDuration;
  uint RefreshPlayersDuration;
  uint LeaguesPerPageCount;
  uint ServersPerPageCount;
  uint ServersSuggestedPerPageCount;
  uint ServersFavouritesPerPageCount;
  uint PlayersPerPageCount;
};

struct CGameMgrActionFxPhy : public CMwNod {
  const uint InstancesCount;
};

struct CGameScriptHandlerStation : public CGameScriptHandlerBrowser {
  CGameStation* const Station; // Maniascript
  void EnterStation(); // Maniascript
};

struct CGameCtnMasterServer : public CGameMasterServer {
  const bool IsTransfering;
};

struct CGameCtnNetwork : public CGameNetwork {
  const uint NextChallengeIndex;
  const bool Spectator;
  void GetFilesToSubmit();
  bool InGetReplaysMode;
  bool IsInRefereeMode;
  UnnamedEnum ValidationMode;
  void GetManiaNetResource_OnCancel();
  CGameManiaAppPlayground* ClientManiaAppPlayground;
  CGameScriptHandlerPlaygroundInterface* PlaygroundInterfaceScriptHandler;
  CGamePlaygroundClientScriptAPI* PlaygroundClientScriptAPI;
  void RequestChangeSpectator_ToSpec();
  void RequestChangeSpectator_ToPlayer();
};

// File extension: 'GameCtnApp.Gbx'
struct CGameCtnApp : public CGameApp {
  CGameCtnApp();

  CGameResources* Resources;
  CGameCtnNetwork* Network;
  CGamePlaygroundScript* const PlaygroundScript;
  CGameSwitcher* const Switcher;
  CGameCtnChallenge* Challenge;
  UnnamedEnum VehicleCollectionId;
  CGameScene* const GameScene;
  CGameCamera* const GameCamera;
  CGameEditorBase* const EditorBase;
  CGameCtnEditor* const Editor;
  CGamePlayground* const CurrentPlayground;
  CGameCtnCatalog* const GlobalCatalog;
  const MwFastBuffer<CGameCtnCollection*> CollectionFids;
  const MwFastBuffer<CMwNod*> AdditionalSkinsFids;
  MwFastBuffer<CGameCtnChallengeInfo*> ChallengeInfos;
  MwFastBuffer<CGameCtnReplayRecordInfo*> ReplayRecordInfos;
  const MwFastBuffer<CGamePlayerProfile*> PlayerProfiles;
  CGamePlayerProfile* CurrentProfile;
  MwFastBuffer<CGameCtnCampaign*> BaseOfficialCampaigns;
  const MwFastBuffer<CGameCtnCampaign*> BaseDynamicCampaigns;
  MwFastBuffer<CGameCtnCampaign*> OfficialCampaigns;
  const MwFastBuffer<CGameCtnCampaign*> DynamicCampaigns;
  CGameCtnCampaign* const CurrentCampaign;
  CGameOfficialRecorder* OfficialRecorder;
  CGameOfficialRecord* CurrentOfficialRecord;
  bool MenuBackground_MustLoopIntro;
  const uint MessagesCount;
  const wstring Money;
  const string OSLocalTimeOrTimeLeft;
  bool StereoscopyEnable;
  bool CanModifyWithoutInvalidate;
  CGameAdvertising* Advertising;
  CGameYoutube* const Youtube;
  CGameUserManagerScript* const UserManagerScript;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardCtnArticle : public CGameControlCard {
  CGameControlCardCtnArticle();

  CPlugBitmap* const Icon;
  const wstring StrName;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardCtnCampaign : public CGameControlCard {
  CGameControlCardCtnCampaign();

  const wstring StrName;
  const wstring StrRaceType;
  const wstring StrEnvironment;
  const wstring StrLeagueName;
  const wstring StrSkillRank;
  const wstring StrSkillScore;
  const MwId IconId;
  const uint NbMedals;
  const wstring Name;
};

// Description: "Internal API for Maniaplanet."
struct CGameManiaPlanetScriptAPI : public CMwNod {
  enum class CGameManiaPlanetScriptAPI::EContext {
    MenuStartUp = 0,
    MenuManiaPlanet = 1,
    MenuManiaTitleMain = 2,
    MenuProfile = 3,
    MenuSolo = 4,
    MenuLocal = 5,
    MenuMulti = 6,
    MenuCompetitions = 7,
    MenuEditors = 8,
    EditorPainter = 9,
    EditorTrack = 10,
    EditorMediaTracker = 11,
    Solo = 12,
    SoloLoadScreen = 13,
    Multi = 14,
    MultiLoadScreen = 15,
    MenuCustom = 16,
    Unknown = 17,
  };
  enum class CGameManiaPlanetScriptAPI::ELinkType {
    ExternalBrowser = 0,
    ManialinkBrowser = 1,
  };
  enum class CGameManiaPlanetScriptAPI::EBuyTitleMode {
    OpenStore = 0,
    BuyIfNeeded = 1,
    Ask = 2,
  };
  enum class CGameManiaPlanetScriptAPI::EMenuStationsPage {
    Home = 0,
    Play = 1,
    Store = 2,
    Options = 3,
    Help = 4,
  };
  enum class CGameManiaPlanetScriptAPI::EUplayFlow {
    OverView = 0,
    Auth = 1,
    Reward = 2,
    Rewards = 3,
    Actions = 4,
  };
  enum class CGameManiaPlanetScriptAPI::ESystemPlatform {
    None = 0,
    Steam = 1,
    UPlay = 2,
    PS4 = 3,
    XBoxOne = 4,
  };
  enum class CGameManiaPlanetScriptAPI::ESystemSkuIdentifier {
    Unknown = 0,
    EU = 1,
    US = 2,
    JP = 3,
  };
  enum class CGameManiaPlanetScriptAPI::EHmdWearingState {
    Dismount = 0,
    Mount = 1,
    Unknown = 2,
  };
  enum class CGameManiaPlanetScriptAPI::EHmdTrackingState {
    NotStarted = 0,
    Calibrating = 1,
    NotTracking = 2,
    Tracking = 3,
  };
  const int Now; // Maniascript
  const string CurrentLocalDateText; // Maniascript
  CGamePlayerInfo* const LocalUser; // Maniascript
  CGameManiaTitle* const LoadedTitle; // Maniascript
  const MwFastBuffer<CGameManiaTitle*> TitlesAvailable; // Maniascript
  const MwFastBuffer<CGameManiaTitle*> TitlesBases; // Maniascript
  const MwFastBuffer<string> TitleIdsInstalled; // Maniascript
  const MwFastBuffer<string> TitleIdsPayed; // Maniascript
  const uint EmptyStationsCount; // Maniascript
  const CGameManiaPlanetScriptAPI::ESystemPlatform SystemPlatform; // Maniascript
  const CGameManiaPlanetScriptAPI::ESystemSkuIdentifier SystemSkuIdentifier; // Maniascript
  const string ExeVersion; // Maniascript
  CGameCtnChallenge* const CurrentMap; // Maniascript
  const CGameManiaPlanetScriptAPI::EContext ActiveContext; // Maniascript
  const string ActiveContext_MenuFrame; // Maniascript
  const string ActiveContext_InGameDialogFrame; // Maniascript
  const string ActiveContext_DialogFrame; // Maniascript
  const string ActiveContext_SystemDialogFrame; // Maniascript
  const bool ActiveContext_ClassicDialogDisplayed; // Maniascript
  const uint ActiveContext_GameWill; // Maniascript
  const bool ActiveContext_ManialinkBrowserDisplayed; // Maniascript
  const bool ActiveContext_MenuStationsDisplayed; // Maniascript
  const bool ActiveContext_InGameMenuDisplayed; // Maniascript
  const CGameManiaPlanetScriptAPI::EMenuStationsPage ActiveContext_MenuStationsPage; // Maniascript
  const CGameManiaPlanetScriptAPI::EMenuStationsPage ActiveContext_MenuStationsClickedPage; // Maniascript
  const string CurrentServerLogin; // Maniascript
  const wstring CurrentServerName; // Maniascript
  const wstring CurrentServerModeName; // Maniascript
  const string CurrentServerJoinLink; // Maniascript
  const MwFastBuffer<CGamePlayerInfo*> CurrentServerPlayers; // Maniascript
  const uint CurrentAppId; // Maniascript
  bool IsPrivateSession; // Maniascript
  const bool IsKioskMode; // Maniascript
  const bool ParentalLock_IsLocked; // Maniascript
  const uint TotalTimePlay; // Maniascript
  const uint Messenger_MessagesCount; // Maniascript
  const uint AccountPlanets; // Maniascript
  const bool IsTitleTimeLimited; // Maniascript
  const bool IsTitleTimeLimitActivated; // Maniascript
  const bool CanUnlockTitleTimeLimitOnStore; // Maniascript
  const uint TitleTimeLeft; // Maniascript
  const uint CurConnectionDate; // Maniascript
  const uint PrevConnectionDate; // Maniascript
  float MasterSoundVolume; // Range: -40 - 0 // Maniascript
  float MasterMusicVolume; // Range: -40 - 0 // Maniascript
  const bool TmTurbo_IsDemo; // Maniascript
  const bool TmTurbo_IsPartialInstall; // Maniascript
  const bool TmTurbo_IsBeta; // Maniascript
  const bool TmTurbo_IsBetaDeactivated; // Maniascript
  const bool TmTurbo_IsOpenBeta; // Maniascript
  const bool TmTurbo_IsSlowInstall; // Maniascript
  bool Settings_StationsManualLayout; // Maniascript
  void ClipboardSet(wstring ClipboardText); // Maniascript
  void OpenLink(string Url, CGameManiaPlanetScriptAPI::ELinkType LinkType); // Maniascript
  void QuitGameAndOpenLink(string Url); // Maniascript
  void InstallTitle(string TitleId); // Maniascript
  void InstallTitleFromUrl(string Url, wstring DisplayName); // Maniascript
  void InstallTitleFromUrlEx(string Url, wstring DisplayName, bool EnterAfterInstall); // Maniascript
  void ShowTitle(string TitleId, bool ShowStation); // Maniascript
  void SelectTitle(string TitleId); // Maniascript
  void EnterTitle(string TitleId); // Maniascript
  void ShowCurMapCard(); // Maniascript
  void SetMenuStationsActive(bool Activate); // Maniascript
  void Dialog_EnterGameKey(); // Maniascript
  void Dialog_BuyTitleDialog(string TitleId, string OverrideBuyUrl, int OverrideActionAfterBuy); // Maniascript
  void Dialog_BuyTitleEx(string TitleId, CGameManiaPlanetScriptAPI::EBuyTitleMode Mode, string OverrideBuyUrl, int OverrideActionAfterBuy); // Maniascript
  void Dialog_GenerateGameKeys(string TitleId, uint FeaturesLevel, uint NbToGenerate, bool AddBuddyOnRegistration); // Maniascript
  void Dialog_BuyStations(); // Maniascript
  void Dialog_SetServerFavourite(string ServerLogin, bool Favorite, bool Silent); // Maniascript
  const bool Dialog_IsFinished; // Maniascript
  const bool Dialog_Success; // Maniascript
  const bool Dialog_Aborted; // Maniascript
  void CustomMenu_Request(wstring Type, MwFastBuffer<wstring>& Data); // Maniascript
  void SetLocalUserClubLink(string ClubLink); // Maniascript
  void SetLocalUserNickName(wstring NickName); // Maniascript
  void FlashWindow(); // Maniascript
  void CreateShortcut(string ShortcutName, string Url); // Maniascript
  void HideSystemLoadingScreen(); // Maniascript
  bool IsLiveStreamingEnabled; // Maniascript
  bool IsRemotePlayEnabled; // Maniascript
  void TmTurbo_LoadingOpportunity(); // Maniascript
  CGameAchievementScriptManager* const AchievementsManager; // Maniascript
  CGameUserManagerScript* const UserMgr; // Maniascript
  void Authentication_GetToken(MwId UserId, string AppLogin); // Maniascript
  const bool Authentication_GetTokenResponseReceived; // Maniascript
  const uint Authentication_ErrorCode; // Maniascript
  const string Authentication_Token; // Maniascript
  const MwFastBuffer<CWebServicesTaskResult*> MasterServer_MSTaskResults; // Maniascript
  void MasterServer_ReleaseMSTaskResult(MwId TaskId); // Maniascript
  string MasterServer_GetURL(string ShortCutId); // Maniascript
  CGameMasterServerUserInfo* const MasterServer_MainMSUser; // Maniascript
  const MwFastBuffer<CGameMasterServerUserInfo*> MasterServer_MSUsers; // Maniascript
  CGameMasterServerUserInfo* MasterServer_GetMSUserFromId(MwId UserId); // Maniascript
  void MasterServer_Connect(MwId UserId); // Maniascript
  CWebServicesTaskResult_GetDisplayNameScriptResult* MasterServer_GetDisplayName(MwId UserId); // Maniascript
  CWebServicesTaskResult* MasterServer_CheckNetworkAvailability(MwId UserId); // Maniascript
  CWebServicesTaskResult_Session_Get* MasterServer_GetSessionInfo(MwId UserId, wstring SessionId); // Maniascript
  void MasterServer_Zone_GetPathAndName(wstring ZoneFullPath, wstring ZonePath, wstring ZoneName); // Maniascript
  CWebServicesTaskResult_ZoneList* MasterServer_Zone_GetChilds(wstring ZoneFullPath); // Maniascript
  CWebServicesTaskResult* MasterServer_Zone_ChangeZone(MwId UserId, wstring ZoneFullPath); // Maniascript
  CWebServicesTaskResult_LaunchUplayScriptResult* MasterServer_UplayLaunch(MwId UserId, CGameManiaPlanetScriptAPI::EUplayFlow UplayFlow, uint RewardCode); // Maniascript
  CWebServicesTaskResult_LaunchUplayScriptResult* MasterServer_UplayLaunch_v2(MwId UserId, CGameManiaPlanetScriptAPI::EUplayFlow UplayFlow, string RewardId); // Maniascript
  CWebServicesTaskResult_LaunchUplayScriptResult* MasterServer_UplayLaunchAndCompleteActions(MwId UserId, CGameManiaPlanetScriptAPI::EUplayFlow UplayFlow, string RewardId); // Maniascript
  void MasterServer_Tracking_ContextMenuStart(MwId UserId, string MenuName); // Maniascript
  void MasterServer_Tracking_ContextMenuStop(MwId UserId, string MenuName); // Maniascript
  void MasterServer_Tracking_ContextGameModeStart(MwId UserId, string GameMode); // Maniascript
  void MasterServer_Tracking_ContextGameModeStop(MwId UserId, string GameMode); // Maniascript
  void MasterServer_Tracking_ContextMapStart(MwId UserId, string MapUid, string Environment); // Maniascript
  void MasterServer_Tracking_ContextMapStop(MwId UserId, string MapUid); // Maniascript
  void MasterServer_Tracking_ContextPlayStart(MwId UserId, string Type); // Maniascript
  void MasterServer_Tracking_ContextPlayStop(MwId UserId, string Type, string Reason, uint NbRespawns); // Maniascript
  void MasterServer_Tracking_MedalUnlock(MwId UserId, uint Medal); // Maniascript
  void MasterServer_Tracking_MedalUnlock_v2(MwId UserId, uint PreviousMedal, uint Medal); // Maniascript
  void MasterServer_Tracking_NewMapCreated(MwId UserId, string Environment, bool IsRandomlyGenerated); // Maniascript
  void MasterServer_Tracking_NewsImpression(MwId UserId, string NewsId); // Maniascript
  void MasterServer_Tracking_NewsClick(MwId UserId, string NewsId); // Maniascript
  void MasterServer_Tracking_PlayerAchievement(MwId UserId, uint AchievementId); // Maniascript
  void MasterServer_Tracking_PlayerProgressionMap(MwId UserId, string Value); // Maniascript
  void MasterServer_Tracking_PlayerRespawn(MwId UserId, uint RaceTime); // Maniascript
  void MasterServer_Tracking_StatCampaign(MwId UserId, uint PlayedMapCount, uint BronzeMedalCount, uint SilverMedalCount, uint GoldMedalCount, uint AuthorMedalCount, uint MaxDifficultyLevel); // Maniascript
  void MasterServer_Tracking_StatCampaign_v2(MwId UserId, uint PlayedMapCount, uint PlayedEnvCount, uint BronzeMedalCount, uint SilverMedalCount, uint GoldMedalCount, uint AuthorMedalCount, uint MaxDifficultyLevel); // Maniascript
  void MasterServer_Tracking_StatChallenge(MwId UserId, uint PendingChallengeCount); // Maniascript
  void MasterServer_Tracking_StatGlobalRanking(MwId UserId, uint GlobalRanking); // Maniascript
  void MasterServer_Tracking_StatOnline(MwId UserId, uint Echelon); // Maniascript
  void MasterServer_Tracking_StatRecordCenter(MwId UserId, uint BestCount, uint EqualCount, uint WorstCount); // Maniascript
  CWebServicesTaskResult* MasterServer_Beta_RetrieveUserInfo(MwId UserId); // Maniascript
  CWebServicesTaskResult* MasterServer_Beta_AcceptNDA(MwId UserId); // Maniascript
  CWebServicesTaskResult* BuyFullGame(MwId UserId); // Maniascript
  CWebServicesTaskResult* ShowSystemError(MwId UserId, uint ErrorCode); // Maniascript
  void HMD_Activate(bool Enable); // Maniascript
  const bool HMD_IsActive; // Maniascript
  const vec3 HMD_HeadTranslation; // Maniascript
  const float HMD_HeadYaw; // Maniascript
  const float HMD_HeadPitch; // Maniascript
  const float HMD_HeadRoll; // Maniascript
  void HMD_ResetTracking(); // Maniascript
  void HMD_SelectUser(); // Maniascript
  CGameUserScript* const HMD_CurrentUser; // Maniascript
  float HMD_WorldScale; // Maniascript
  float HMD_MoveScale; // Range: 1e-05 - 10000 // Maniascript
  float HMD_HUD_Distance; // Range: 0.2 - 100 // Maniascript
  const CGameManiaPlanetScriptAPI::EHmdWearingState HMD_WearingState; // Maniascript
  const CGameManiaPlanetScriptAPI::EHmdTrackingState HMD_TrackingState; // Maniascript
  const bool HMD_IsUserWarnBySystem_OutOfPlayArea; // Maniascript
  bool Cameras_BlackOut; // Maniascript
};

// File extension: 'Frame.Gbx'
struct CGameControlCardCtnChapter : public CGameControlCard {
  CGameControlCardCtnChapter();

  CPlugBitmap* const Icon;
  CPlugBitmap* const BannerChallenge;
  const wstring StrName;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardCtnGhost : public CGameControlCard {
  CGameControlCardCtnGhost();

  const wstring StrName;
  const uint Time;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardCtnGhostInfo : public CGameControlCard {
  CGameControlCardCtnGhostInfo();

  const wstring StrName;
  const uint Time;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardNetOnlineEvent : public CGameControlCard {
  CGameControlCardNetOnlineEvent();

  const uint Id;
  const string StrStartDate;
  const string StrEndDate;
  const wstring StrSenderName;
  const wstring StrTitle;
  const wstring StrContent;
  void OnUseManiaCode();
};

// File extension: 'Frame.Gbx'
struct CGameControlCardNetTeamInfo : public CGameControlCard {
  CGameControlCardNetTeamInfo();

  const string StrLogoUrl;
  const string StrHomeUrl;
  const wstring StrPath;
  const wstring StrName;
  const wstring StrDescription;
  const uint MembersCount;
  const uint Wins;
  const uint Losses;
  const uint Draws;
  const uint Ranking;
  CPlugBitmap* Logo;
  const MwFastBuffer<CControlListItem*> NodsMembers;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardCtnVehicle : public CGameControlCard {
  CGameControlCardCtnVehicle();

  CPlugBitmap* const Icon;
  const wstring StrName;
};

struct CGameControlGridCtnCampaign : public CControlGrid {
  CGameControlGridCtnCampaign();

  CGameCtnCampaign* Campaign;
  CControlLabel* CampaignNameLabel;
  CControlGrid* ChallengeGroupNamesGrid;
  UnnamedEnum ChallengeGroupAlignment;
  CGameControlCardCtnChallengeInfo* ChallengeCardTemplate;
};

struct CGameControlGridCtnChallengeGroup : public CControlGrid {
  CGameControlGridCtnChallengeGroup();

  CGameCtnChallengeGroup* ChallengeGroup;
  CControlLabel* ChallengeGroupNameLabel;
  UnnamedEnum ChallengeAlignment;
};

struct CGameEditorTexCoords : public CMwNod {
  CGameEditorTexCoords();

  CMwNod* const Overlay;
  const vec3 ColorSelected;
  const vec3 ColorSelectable;
  const float Alpha;
  float DrawTcRectMargin;
  float DrawTcRectMinSize;
  void UpdateSelectables();
  vec2 DrawTcRectMin;
  vec2 DrawTcRectMax;
  vec2 DrawVisualRectMin;
  vec2 DrawVisualRectMax;
  void ResetView();
  void CenterViewOnSelection();
  bool SnapToGrid;
  uint GridPixelStep;
};

struct CGameAnalyzer : public CMwNod {
  const int Mode;
  CMwStatsValue* const FrameRate;
};

struct CGamePlaygroundInterface : public CMwNod {
  CControlContainer* InterfaceRoot;
  CGameHud3d* const Hud3d;
  CGameCtnNetServerInfo* const ServerInfo;
  CGameCtnChallenge* const Challenge;
  CGamePodium* const Podium;
  wstring ChatEntry;
  void ChatNextPage();
  void ChatPreviousPage();
  void ChatToggleDisplayMode();
  CControlFrame* const ManialinkPage;
  CGameScriptHandlerPlaygroundInterface* const ManialinkScriptHandler;
  CGameManialinkScriptHandler* const ManialinkScriptHandlerBasic;
  void ShowChallengeCard();
  void ShowModeHelp();
  void CopyServerLink();
};

struct CGamePlaygroundSpectating : public CMwNod {
};

struct CGameEditorModel : public CMwNod {
  CGameEditorModel();

  UnnamedEnum NavigationMode;
  UnnamedEnum ComponentMode;
  UnnamedEnum SelectionMode;
  UnnamedEnum ErrorMode;
  UnnamedEnum PivotMode;
  const UnnamedEnum Operation;
  bool ScaleX;
  bool ScaleY;
  bool ScaleZ;
  float DeltaScale; // Range: 0.1 - 1
  float ScaleValue; // Range: 0 - 10
  float Angle; // Range: 1 - 360
  bool IsShowPivot;
  void CurveObject();
  bool AlignX;
  bool AlignY;
  bool AlignZ;
  const uint NbFaces;
  const uint NbEdges;
  const uint NbVertexs;
  bool IsUndoEnabled;
  bool IsKeepInfo;
  bool IsKeepTexCoordOrientation;
  bool IsShowFace;
  bool IsShowEdge;
  bool IsShowVertex;
  uint LastSize;
  uint LastRawSize;
  uint TotalUpdate;
  float WeldDist;
  void CreatePolygon();
  uint PolyNbEdge;
  float PolyRadius;
  bool FillPolygon;
  void SetUpperLimit();
  void SetLowerLimit();
  bool m_LimitSelection;
  vec3 Translation;
  void CreateGuide();
  void CleanGuide();
  uint BaseVisualLevel;
  void AddVisualLevel();
  void RemoveVisualLevel();
  const uint NbVisualLevel;
  uint VisualLevelIndex;
  uint VisualLevelValue;
  float VisualLevelDistance;
  CScene3d* Scene;
  CSceneCamera* Camera;
  CHmsPicker* Picker;
  CSceneMobil* Floor;
  CMwNod* const ControlCameraOrbital;
  CMwNod* const EditPos3D;
  bool DisplayEditionCrystal;
  bool DisplayEditedCrystal;
  bool AllowVertexCreationOnTheFly;
  CSceneMobil* const MobilHelper;
  vec3 HelperColor;
  vec3 HelperColorFocused;
  vec3 HelperColorSelected;
  vec3 HelperColorFocusedSelected;
  vec3 HelperColorSplit;
  vec3 HelperColorMerge;
  vec3 HelperColorDraw;
  vec3 HelperColorMove;
  vec3 HelperColorRotate;
  vec3 HelperColorScale;
  vec3 HelperColorError;
  float VertexAlpha;
  float VertexAlphaFocused;
  float VertexAlphaSelected;
  float VertexAlphaFocusedSelected;
  float EdgeAlpha;
  float EdgeAlphaFocused;
  float EdgeAlphaSelected;
  float EdgeAlphaFocusedSelected;
  float FaceAlpha;
  float FaceAlphaFocused;
  float FaceAlphaSelected;
  float FaceAlphaFocusedSelected;
  float VertexWidth;
  float VertexWidthFocused;
  float VertexWidthSelected;
  float VertexWidthFocusedSelected;
  float EdgeWidth;
  float EdgeWidthFocused;
  float EdgeWidthSelected;
  float EdgeWidthFocusedSelected;
  float DifferentModeAlphaDivider;
  float ComponentModeChangeEffect_SizeCoef;
  float ComponentModeChangeEffect_Duration;
  float PickMinScreenDist;
  bool AllPickable;
  float DbgSmooth; // Range: 0 - 1
  uint LodLevel;
  CPlugCrystal* const Crystal;
  const float CursorCoordsX;
  const float CursorCoordsY;
  const float CursorCoordsZ;
  const float GridStep;
  const uint VertexCount;
  const uint EdgeCount;
  const uint FaceCount;
  void ComponentModeVertexAndEdge();
  void ComponentModeFace();
  void Creation();
  void Selection();
  void SplitLine();
  void MergePoints();
  void Face();
  void Disc();
  void PolygonalChain();
  void Spline();
  void RegularSelection();
  void AddSelection_Trigger();
  void AddSelection_Release();
  void AddSelection();
  void Move();
  void Rotate();
  void UniformScale();
  void _1DScale();
  void Eraser_Trigger();
  void Eraser_Release();
  void Eraser();
  void FreeLook_Trigger();
  void FreeLook_Release();
  void FreeLook();
  void MultipleSelectStart();
  void MultipleSelectStartDoubleClick();
  void MultipleSelectInterrupt();
  void MultipleSelectEngage();
  void MultipleSelectStop();
  void LassoSelectAddPoint();
  void LassoSelectInterrupt();
  void MoveSwitch();
  void FindFacesFromEdge();
  void QuickSelect();
  void SelectAll();
  void SetCursorToPickedVertex();
  void CursorSnap();
  void InvertSel();
  void ShowHideHelpers();
  void CreateEdge_Start();
  void CreateEdge_Draw();
  void CreateEdge_Finish();
  void CreateEdge_SelectVertex();
  void CreateEdge_Cancel();
  void DrawEdge_Start();
  void DrawEdge_SelectVertex();
  void DrawEdge_Cancel();
  void StepUp();
  void StepDown();
  void PointMode();
  void LineMode();
  void FaceMode();
  void SwitchPlane();
  void Delete();
  void SwapFaceNormal();
  void MoveClick_Start();
  void MoveClick_Interrupt();
  void MoveClick_Engage();
  void MoveClick_Finish();
  void MoveClick_Cancel();
  void SplitEdge2_Start();
  void SplitEdge2_Split();
  void SplitEdge2_Cancel();
  void Magnetize_Start();
  void Magnetize_Continue();
  void Magnetize_Finish();
  void Magnetize_Cancel();
  void Extrude();
  void MergePoints_Start();
  void MergePoints_SelectVertex();
  void MergePoints_Cancel();
  void SnapVertexsToGrid();
  void Rotate_Start();
  void Rotate_SmallAngleXCw();
  void Rotate_SmallAngleXCcw();
  void Rotate_SmallAngleYCw();
  void Rotate_SmallAngleYCcw();
  void Rotate_SmallAngleZCw();
  void Rotate_SmallAngleZCcw();
  void Rotate_RightAngleXCw();
  void Rotate_RightAngleXCcw();
  void Rotate_RightAngleYCw();
  void Rotate_RightAngleYCcw();
  void Rotate_RightAngleZCw();
  void Rotate_RightAngleZCcw();
  void Rotate_Finish();
  void Rotate_Cancel();
  void RotateClick_Start();
  void RotateClick_Interrupt();
  void RotateClick_Engage();
  void RotateClick_Finish();
  void RotateClick_Cancel();
  void Scale_Start();
  void Scale_SmallIncX();
  void Scale_SmallDecX();
  void Scale_SmallIncY();
  void Scale_SmallDecY();
  void Scale_SmallIncZ();
  void Scale_SmallDecZ();
  void Scale_SmallIncAll();
  void Scale_SmallDecAll();
  void Scale_DoubleX();
  void Scale_HalfX();
  void Scale_DoubleY();
  void Scale_HalfY();
  void Scale_DoubleZ();
  void Scale_HalfZ();
  void Scale_DoubleAll();
  void Scale_HalfAll();
  void Scale_Finish();
  void Scale_Cancel();
  void ScaleClick_Start();
  void ScaleClick_Interrupt();
  void ScaleClick_Engage();
  void ScaleClick_Finish();
  void ScaleClick_Cancel();
  void _1DScaleClick_Start();
  void _1DScaleClick_Interrupt();
  void _1DScaleClick_Engage();
  void _1DScaleClick_Finish();
  void _1DScaleClick_Cancel();
  void FillSelection();
  void Symetric();
  void SuperSymmetric();
  void SuperSymmetric_X();
  void SuperSymmetric_Z();
  void SnapAllEpsilon();
  void WeldFaces();
  void SeparateFaces();
  void SwitchSmooth();
  void QuadsToTriangles();
  void TrianglesToQuads();
  void EditTexCoords_Start();
  void EditTexCoords_Select();
  void EditTexCoords_QuickSelect();
  void EditTexCoords_CopyMaterialAndUvs();
  void EditTexCoords_RotateUvsCw();
  void EditTexCoords_RotateUvsCcw();
  void EditTexCoords_HackPrevMaterial();
  void EditTexCoords_HackNextMaterial();
  void EditTexCoords_Undo();
  void EditTexCoords_Redo();
  void EditTexCoords_Stop();
  void ApplyTexture1();
  void ApplyTexture2();
  void ApplyTexture3();
  void ApplyTexture4();
  void ApplyTexture5();
  void ApplyTexture6();
  void ApplyTexture7();
  void ApplyTexture8();
  void ApplyTexture9();
  void Exit();
  void Copy();
  void Cut();
  void Paste();
  void Undo();
  void Redo();
  void PlaneMoveUp();
  void PlaneMoveDown();
  void MaterialUp();
  void MaterialDown();
  void SelectGroup1();
  void SelectGroup2();
  void SelectGroup3();
  void SelectGroup4();
  void SelectGroup5();
  void SelectGroup6();
  void SelectGroup7();
  void SelectGroup8();
  void SelectGroup9();
  void ShowHideVertexNormals();
  void SnapObjectToGrid();
  void AlignVertex();
  void AlignObject();
  void SetAlignVertex();
  void SetPivotFromCursor();
  void SetPivotFromObject();
  void CreatePortal();
  void DeleteIsolatedVertexs();
  void CheckErrors();
  void CreateQuadFromSel();
  void CreateTriangleFromSel();
  void ComponentModeVertex();
  void ComponentModeEdge();
  void CursorOnPivot();
  void SplitEdge_Start();
  void SplitEdge_Split();
  void SplitEdge_Cancel();
  CMwNod* const GameEditorTexCoords;
  const wstring CurrentErrorMessage;
};

// File extension: 'GameCtnMediaBlockGhost.gbx'
struct CGameCtnMediaBlockGhost : public CGameCtnMediaBlock {
  CGameCtnMediaBlockGhost();

  CGameCtnGhost* GhostModel;
  float StartOffset;
};

struct CGameEnvironmentManager : public CMwNod {
};

struct CGameDialogShootParams : public CMwNod {
  float Duration;
  uint VideoFps;
  uint Width;
  uint Height;
  uint TileCountX;
  uint TileCountY;
  bool TileSplit;
  bool VideoHq;
  UnnamedEnum VideoHqSampleCount;
  bool Sharpen;
  bool VideoHqMB;
  bool VideoHqDOF;
  UnnamedEnum DofSampleCount;
  bool VideoHqCarReflects;
  bool VideoReflectSubSample;
  bool VideoReflectRayCast;
  UnnamedEnum VideoStereo3d;
  bool IsAudioStream;
  UnnamedEnum ExtScreen;
  UnnamedEnum ExtVideo;
  const string EstimatedTime;
  bool UploadToYoutube;
  string YoutubeTitle;
  string YoutubeDesc;
  string ShootName;
  bool Hud3d;
  UnnamedEnum WebmVideoMode;
  UnnamedEnum WebmVideoAutoBirate;
  uint WebmVideoBitrate;
  uint WebmVideoCQ_Level;
  float WebmAudioVBR_Quality;
  void OnOk();
  void OnCancel();
  void OnAdvanced();
  void SetQualityPreset_Low();
  void SetQualityPreset_Medium();
  void SetQualityPreset_High();
};

struct CGameManialinkFileEntry : public CGameManialinkEntry {
  void OnFileChoosen();
  const wstring FullFileName; // Maniascript
};

struct CGameNetDataDownload : public CMwNod {
  CGameNetDataDownload();

  const uint ReturnedError;
  const bool CheckUpToDate;
  const bool PauseOnError;
  const bool IsPaused;
  const bool IsFinished;
};

struct CGameCampaignPlayerScores : public CMwNod {
  CGameCampaignPlayerScores();

};

struct CGameLoadProgress : public CMwNod {
  CScene2d* const Overlay;
};

struct CGameNetFormBuddy : public CNetNod {
  CGameNetFormBuddy();

};

// Description: "API for GameModes Manialinks"
struct CGameScriptHandlerPlaygroundInterface : public CGameManialinkScriptHandler {
  enum class CGameScriptHandlerPlaygroundInterface::EUISound {
    Default = 0,
    Silence = 1,
    StartMatch = 2,
    EndMatch = 3,
    StartRound = 4,
    EndRound = 5,
    PhaseChange = 6,
    TieBreakPoint = 7,
    TiePoint = 8,
    VictoryPoint = 9,
    Capture = 10,
    TimeOut = 11,
    Notice = 12,
    Warning = 13,
    PlayerEliminated = 14,
    PlayerHit = 15,
    Checkpoint = 16,
    Finish = 17,
    Record = 18,
    ScoreProgress = 19,
    RankChange = 20,
    Bonus = 21,
    FirstHit = 22,
    Combo = 23,
    PlayersRemaining = 24,
    Custom1 = 25,
    Custom2 = 26,
    Custom3 = 27,
    Custom4 = 28,
  };
  enum class CGameScriptHandlerPlaygroundInterface::EInGameMenuResult {
    Resume = 0,
    Quit = 1,
    NormalMenu = 2,
    AdvancedMenu = 3,
    ServerSettings = 4,
  };
  const int GameTime; // Maniascript
  CGamePlaygroundClientScriptAPI* const Playground; // Maniascript
  CGamePlaygroundUIConfig* UI; // Maniascript
  CGamePlaygroundUIConfig* ClientUI; // Maniascript
  const bool IsSpectator; // Maniascript
  const bool IsSpectatorClient; // Maniascript
  const bool UseClans; // Maniascript
  const bool UseForcedClans; // Maniascript
  CGameManiaAppPlaygroundCommon* const ParentApp; // Maniascript
  CGameCtnChallenge* const Map; // Maniascript
  void ShowCurChallengeCard(); // Maniascript
  void ShowModeHelp(); // Maniascript
  void CopyServerLinkToClipBoard(); // Maniascript
  void JoinTeam1(); // Maniascript
  void JoinTeam2(); // Maniascript
  const MwFastBuffer<CGameTeamProfile*> Teams; // Maniascript
  void RequestSpectatorClient(bool Spectator); // Maniascript
  void SetSpectateTarget(string Player); // Maniascript
  void ShowProfile(string Player); // Maniascript
  void ShowInGameMenu(); // Maniascript
  void CloseInGameMenu(CGameScriptHandlerPlaygroundInterface::EInGameMenuResult Result); // Maniascript
  void CloseScoresTable(); // Maniascript
  const bool IsInGameMenuDisplayed; // Maniascript
  const string CurrentServerLogin; // Maniascript
  const wstring CurrentServerName; // Maniascript
  const wstring CurrentServerDesc; // Maniascript
  const string CurrentServerJoinLink; // Maniascript
  const wstring CurrentServerModeName; // Maniascript
  void PlayUiSound(CGameScriptHandlerPlaygroundInterface::EUISound Sound, int SoundVariant, float Volume); // Maniascript
  void Spectate(string Player); // Maniascript
  const bool IsTeamMode; // Maniascript
  const bool IsForcedTeams; // Maniascript
  bool IsSpectatorMode; // Maniascript
  CGamePlayerInfo* const LocalPlayerInfo; // Maniascript
  CGameAchievementScriptManager* const AchievementsManager; // Maniascript
};

struct CGameLadderScores : public CMwNod {
  CGameLadderScores();

};

struct CGameEditPos3D : public CMwNod {
  CGameEditPos3D();

  bool CursorAutoSnap;
  const vec3 CursorStepSize;
  vec3 CursorOffset;
  UnnamedEnum GridDisplayType;
  vec3 ColorGridPlane;
  float AlphaGridPlane;
  vec3 ColorGridLines;
  float AlphaGroundLines;
  vec3 ColorGroundPlane;
  float AlphaGroundPlane;
  vec3 ColorGroundLines;
  vec3 ColorAxisX;
  vec3 ColorAxisY;
  vec3 ColorAxisZ;
  vec3 ColorGradationX;
  vec3 ColorGradationY;
  vec3 ColorGradationZ;
  bool ShowAxisGradations;
  vec3 CursorColorBase;
  vec3 CursorColorMove;
  vec3 CursorColorRotate;
  vec3 CursorColorDraw;
  vec3 CursorColorSplit;
  vec3 CursorColorMerge;
  vec3 CursorColorUVMapping;
  float GradationLength;
  const vec3 Pos3D;
  void Show();
  void Hide();
};

// Description: "This is the base Manialink page interface."
struct CGameManialinkScriptHandler : public CMwNod {
  enum class CGameManialinkScriptHandler::ELinkType {
    ExternalBrowser = 0,
    ManialinkBrowser = 1,
    Goto = 2,
    ExternalFromId = 3,
    ManialinkFromId = 4,
    GotoFromId = 5,
  };
  enum class CGameManialinkScriptHandler::ESystemPlatform {
    None = 0,
    Steam = 1,
    UPlay = 2,
    PS4 = 3,
    XBoxOne = 4,
  };
  enum class CGameManialinkScriptHandler::ESystemSkuIdentifier {
    Unknown = 0,
    EU = 1,
    US = 2,
    JP = 3,
  };
  CGameManialinkPage* const Page; // Maniascript
  const bool PageIsVisible; // Maniascript
  const uint Now; // Maniascript
  const uint Period; // Maniascript
  const uint CurrentTime; // Maniascript
  const string CurrentTimeText; // Maniascript
  const string CurrentLocalDateText; // Maniascript
  CGamePlayerInfo* const LocalUser; // Maniascript
  CGameManiaTitle* const LoadedTitle; // Maniascript
  const CGameManialinkScriptHandler::ESystemPlatform SystemPlatform; // Maniascript
  const CGameManialinkScriptHandler::ESystemSkuIdentifier SystemSkuIdentifier; // Maniascript
  const MwFastBuffer<CGameManialinkScriptEvent*> PendingEvents; // Maniascript
  void Dbg_SetProcessed(CGameManialinkScriptEvent* Event); // Maniascript
  bool Dbg_WarnOnDroppedEvents; // Maniascript
  const float MouseX; // Maniascript
  const float MouseY; // Maniascript
  const bool MouseLeftButton; // Maniascript
  const bool MouseRightButton; // Maniascript
  const bool MouseMiddleButton; // Maniascript
  const bool KeyUp; // Maniascript
  const bool KeyDown; // Maniascript
  const bool KeyLeft; // Maniascript
  const bool KeyRight; // Maniascript
  const bool KeyReturn; // Maniascript
  const bool KeySpace; // Maniascript
  const bool KeyDelete; // Maniascript
  bool IsKeyPressed(int KeyCode); // Maniascript
  bool EnableMenuNavigationInputs; // Maniascript
  void EnableMenuNavigation(bool EnableInputs, bool WithAutoFocus, CGameManialinkControl* AutoBackControl, int InputPriority); // Maniascript
  const bool IsMenuNavigationForeground; // Maniascript
  void OpenLink(string Url, CGameManialinkScriptHandler::ELinkType LinkType); // Maniascript
  void TriggerPageAction(string ActionString); // Maniascript
  CXmlScriptManager* const Xml; // Maniascript
  CNetScriptHttpManager* const Http; // Maniascript
  CGameVideoScriptManager* const Video; // Maniascript
  CAudioScriptManager* const Audio; // Maniascript
  CInputScriptManager* const Input; // Maniascript
  CGameDataManagerScript* const DataMgr; // Maniascript
  CGameScoreAndLeaderBoardManagerScript* const ScoreMgr; // Maniascript
  CGameUserPrivilegesManagerScript* const PrivilegeMgr; // Maniascript
  CGameMasterServerRichPresenceManagerScript* const PresenceMgr; // Maniascript
  CGameManiaplanetPluginInterface* GetPluginInterface(wstring Name); // Maniascript
  const MwFastBuffer<CGameManiaplanetPluginInterface*> PluginInterfaces; // Maniascript
  CGamePluginInterfacesScript* const Plugins; // Maniascript
  void SendCustomEvent(wstring Type, MwFastBuffer<wstring>& Data); // Maniascript
  void PreloadImage(string ImageUrl); // Maniascript
  void PreloadAll(); // Maniascript
  wstring Dbg_DumpDeclareForVariables(CMwNod* Nod, bool StatsOnly); // Maniascript
};

// File extension: 'Frame.Gbx'
struct CGameControlFrameInventory : public CControlFrame {
  CGameControlFrameInventory();

  CGameControlGridCard* const GridCards;
  const MwFastBuffer<CGameControlCardGeneric*> FreeCards;
  void InitItems();
};

// File extension: 'Frame.Gbx'
struct CGameControlFrameInventoryManager : public CControlFrame {
  CGameControlFrameInventoryManager();

  CControlToolTipManager* ToolTipManager;
};

// File extension: 'Frame.Gbx'
struct CGamePlaygroundControlScores : public CControlFrame {
  CGamePlaygroundControlScores();

  uint ListLineCount;
  uint ListColumnCount;
  CControlFrame* CardModelPlayer;
  float PlayerScale;
  float HorizontalMargin;
  float VerticalMargin;
  float CenterMargin;
  bool IsCentered;
  uint Page;
  uint PageCount;
  void PrevPage();
  void NextPage();
  bool LabelHelpEnabled;
  bool LabelMessageEnabled;
  bool HidePureSpectators;
  bool Rank;
  bool Avatar;
  bool IsLocalPlayer;
  bool IsSpectator;
  bool Score;
  bool ScoreInc;
  bool LapScore;
  bool LadderRank;
  bool LadderPointsGain;
  bool CupModeResult;
  bool NotPlaying;
};

struct CGameManialinkMediaPlayer : public CGameManialinkControl {
  bool IsInitPlay; // Maniascript
  bool Music; // Maniascript
  bool IsLooping; // Maniascript
  float Volume; // Maniascript
  string Url; // Maniascript
  void Play(); // Maniascript
  void Stop(); // Maniascript
  void StopAndRewind(); // Maniascript
};

struct CGameNetFormPlayground : public CGameNetForm {
  CGameNetFormPlayground();

};

struct CGameCtnArticleNode : public CMwNod {
  string Name;
};

struct CGameSwitcher : public CMwNod {
  enum class CGameSwitcher::ESwitcherMode {
    None = 0,
    Editor = 1,
    Playground = 2,
    PlaygroundReplay = 3,
    Menus = 4,
  };
  const CGameSwitcher::ESwitcherMode FocusedModule;
  int FocusDialogCount;
  CGameSwitcher::ESwitcherMode ActiveModule;
  CGameSwitcher::ESwitcherMode OverrideActiveModule;
  const CGameSwitcher::ESwitcherMode ActualActiveModule;
  bool ModuleIsInstalled_Editor;
  bool ModuleIsInstalled_Playground;
  bool ModuleIsInstalled_ClipViewer;
  bool ModuleIsInstalled_Menus;
  CGameSwitcherModule* const Module_Editor;
  CGameSwitcherModule* const Module_Playground;
  CGameSwitcherModule* const Module_ClipViewer;
  CGameSwitcherModule* const Module_Menus;
};

struct CGameManialinkOldTable : public CGameManialinkControl {
};

struct CGameCtnMenusManiaPlanet : public CGameCtnMenus {
  const MwFastBuffer<CGameCtnChallengeInfo*> ChallengeInfosCampaign;
  CGameCtnCampaign* const CurrentCampaign;
  CGameManialink3dWorld* const Manialink3dWorld;
  CGameManiaAppTitle* const MenuCustom_CurrentManiaApp;
  CGameManiaPlanetMenuStations* const MenuManiaPlanet_MenuStations;
  CGameManialink3dStyle* const MenuManiaPlanet3d_BrowserManialink3dStyle;
  iso4 CurFocusedCamLoc;
  vec2 CurFocusedCamFovMaxMinY;
  bool DebugBlockBackground;
};

// Description: "Manialink entry."
struct CGameManialinkLabel : public CGameManialinkControl {
  enum class CGameManialinkLabel::EBlendMode {
    Default = 0,
    Add = 1,
  };
  string Style; // Maniascript
  string Substyle; // Maniascript
  wstring TextFont; // Maniascript
  void SetText(wstring NewText); // Maniascript
  wstring Value; // Maniascript
  const uint ValueLineCount; // Maniascript
  int MaxLine; // Maniascript
  float LineSpacing; // Maniascript
  bool AppendEllipsis; // Maniascript
  bool AutoNewLine; // Maniascript
  float Opacity; // Maniascript
  vec3 TextColor; // Maniascript
  float TextSizeReal; // Maniascript
  uint TextSize; // Maniascript
  CGameManialinkLabel::EBlendMode Blend; // Maniascript
  float ComputeWidth(wstring Text); // Maniascript
  float ComputeWidth2(wstring Text, bool Translated); // Maniascript
  float ComputeHeight(wstring Text); // Maniascript
};

struct CGameYoutube : public CMwNod {
  const string AccessToken;
  void CleanPendingUploads();
};

struct CGameUILayer : public CMwNod {
  enum class CGameUILayer::EUILayerType {
    Normal = 0,
    ScoresTable = 1,
    ScreenIn3d = 2,
    AltMenu = 3,
    Markers = 4,
    CutScene = 5,
    InGameMenu = 6,
    EditorPlugin = 7,
    ManiaplanetPlugin = 8,
    ManiaplanetMenu = 9,
    LoadingScreen = 10,
  };
  enum class CGameUILayer::EUILayerAnimation {
    None = 0,
    DownFast = 1,
    DownSlow = 2,
    LeftFast = 3,
    LeftSlow = 4,
    RightFast = 5,
    RightSlow = 6,
    ScaleFast = 7,
    ScaleSlow = 8,
    UpFast = 9,
    UpSlow = 10,
  };
  bool IsVisible; // Maniascript
  const bool AnimInProgress; // Maniascript
  CGameUILayer::EUILayerType Type; // Maniascript
  CGameUILayer::EUILayerAnimation InAnimation; // Maniascript
  CGameUILayer::EUILayerAnimation OutAnimation; // Maniascript
  CGameUILayer::EUILayerAnimation InOutAnimation; // Maniascript
  string AttachId; // Maniascript
  wstring ManialinkPage; // Maniascript
  string ManialinkPageUtf8;
  CGameManialinkPage* const LocalPage; // Maniascript
};

struct CGamePlaygroundCommon : public CGameCtnPlayground {
};

struct CGameCtnAnchoredObject : public CMwNod {
  CGameCtnAnchoredObject();

  enum class CGameCtnAnchoredObject::ECardinalDirections {
    North = 0,
    East = 1,
    South = 2,
    West = 3,
  };
  int3 BlockUnitCoord;
  MwId AnchorTreeId;
  vec3 AbsolutePosition;
  float Yaw;
  float Pitch;
  float Roll;
  bool IsFlying;
  float Scale;
  CGameItemModel* const ItemModel;
  bool IsLocationInitialised;
  iso4 BlockLocation;
  iso4 LocationInBlock;
  CGameWaypointSpecialProperty* WaypointSpecialProperty;
};

struct CGameSwitcherModule : public CMwNod {
};

// Description: "This object handles the interface."
struct CGamePlaygroundUIConfig : public CMwNod {
  enum class CGamePlaygroundUIConfig::EUISequence {
    None = 0,
    Playing = 1,
    Intro = 2,
    Outro = 3,
    Podium = 4,
    CustomMTClip = 5,
    EndRound = 6,
    PlayersPresentation = 7,
    UIInteraction = 8,
    RollingBackgroundIntro = 9,
    CustomMTClip_WithUIInteraction = 10,
  };
  enum class CGamePlaygroundUIConfig::EUIStatus {
    None = 0,
    Normal = 1,
    Warning = 2,
    Error = 3,
    Official = 4,
  };
  enum class CGamePlaygroundUIConfig::EVisibility {
    None = 0,
    Normal = 1,
    Manual = 2,
    ForcedHidden = 3,
    ForcedVisible = 4,
  };
  enum class CGamePlaygroundUIConfig::ELabelsVisibility {
    None = 0,
    Never = 1,
    Always = 2,
    WhenInFrustum = 3,
    WhenVisible = 4,
    WhenInMiddleOfScreen = 5,
  };
  enum class CGamePlaygroundUIConfig::EAvatarVariant {
    Default = 0,
    Sad = 1,
    Happy = 2,
  };
  enum class CGamePlaygroundUIConfig::EUISound {
    Default = 0,
    Silence = 1,
    StartMatch = 2,
    EndMatch = 3,
    StartRound = 4,
    EndRound = 5,
    PhaseChange = 6,
    TieBreakPoint = 7,
    TiePoint = 8,
    VictoryPoint = 9,
    Capture = 10,
    TimeOut = 11,
    Notice = 12,
    Warning = 13,
    PlayerEliminated = 14,
    PlayerHit = 15,
    Checkpoint = 16,
    Finish = 17,
    Record = 18,
    ScoreProgress = 19,
    RankChange = 20,
    Bonus = 21,
    FirstHit = 22,
    Combo = 23,
    PlayersRemaining = 24,
    Custom1 = 25,
    Custom2 = 26,
    Custom3 = 27,
    Custom4 = 28,
  };
  enum class CGamePlaygroundUIConfig::ENoticeLevel {
    Default = 0,
    PlayerInfo = 1,
    PlayerWarning = 2,
    MapInfo = 3,
    MapWarning = 4,
    MatchInfo = 5,
    MatchWarning = 6,
  };
  enum class CGamePlaygroundUIConfig::EObserverMode {
    Default = 0,
    Forced = 1,
    Forbidden = 2,
    Manual = 3,
  };
  CGamePlaygroundUIConfig::EUISequence UISequence; // Maniascript
  const bool UISequenceIsCompleted; // Maniascript
  wstring UISequence_CustomMTClip; // Maniascript
  uint UISequence_CustomMTRefTime; // Maniascript
  bool UISequence_CanSkipIntroMT; // Maniascript
  string UISequence_PodiumPlayersWin; // Maniascript
  string UISequence_PodiumPlayersLose; // Maniascript
  wstring ManialinkPage; // Maniascript
  wstring BigMessage; // Maniascript
  string BigMessageAvatarLogin; // Maniascript
  CGamePlaygroundUIConfig::EAvatarVariant BigMessageAvatarVariant; // Maniascript
  CGamePlaygroundUIConfig::EUISound BigMessageSound; // Maniascript
  uint BigMessageSoundVariant; // Maniascript
  wstring StatusMessage; // Maniascript
  wstring GaugeMessage; // Maniascript
  float GaugeRatio; // Maniascript
  uint GaugeClan; // Maniascript
  string Hud3dMarkers; // Maniascript
  string MarkersXML; // Maniascript
  const MwFastBuffer<CGameUILayer*> UILayers; // Maniascript
  bool OverlayHideAll; // Maniascript
  bool OverlayHideNotices; // Maniascript
  bool OverlayHideMapInfo; // Maniascript
  bool OverlayHideOpponentsInfo; // Maniascript
  bool OverlayHideChat; // Maniascript
  bool OverlayHideCheckPointList; // Maniascript
  bool OverlayHideRoundScores; // Maniascript
  bool OverlayHideCountdown; // Maniascript
  bool OverlayHideCrosshair; // Maniascript
  bool OverlayHideGauges; // Maniascript
  bool OverlayHideConsumables; // Maniascript
  bool OverlayHide321Go; // Maniascript
  bool OverlayHideBackground; // Maniascript
  bool OverlayHideChrono; // Maniascript
  bool OverlayHideSpeedAndDist; // Maniascript
  bool OverlayHidePersonnalBestAndRank; // Maniascript
  bool OverlayHidePosition; // Maniascript
  bool OverlayHideCheckPointTime; // Maniascript
  bool OverlayHideEndMapLadderRecap; // Maniascript
  bool OverlayHideMultilapInfos; // Maniascript
  bool OverlayHideSpectatorControllers; // Maniascript
  bool OverlayHideSpectatorInfos; // Maniascript
  bool OverlayChatHideAvatar; // Maniascript
  uint OverlayChatLineCount; // Range: 0 - 40 // Maniascript
  vec2 OverlayChatOffset; // Maniascript
  vec2 CountdownCoord; // Maniascript
  bool NoticesFilter_HidePlayerInfo; // Maniascript
  bool NoticesFilter_HidePlayerWarning; // Maniascript
  bool NoticesFilter_HidePlayerInfoIfNotMe; // Maniascript
  bool NoticesFilter_HidePlayerWarningIfNotMe; // Maniascript
  bool NoticesFilter_HideMapInfo; // Maniascript
  bool NoticesFilter_HideMapWarning; // Maniascript
  bool NoticesFilter_HideMatchInfo; // Maniascript
  bool NoticesFilter_HideMatchWarning; // Maniascript
  CGamePlaygroundUIConfig::ENoticeLevel NoticesFilter_LevelToShowAsBigMessage; // Maniascript
  string ScoreTable; // Maniascript
  CGamePlaygroundUIConfig::EVisibility ScoreTableVisibility; // Maniascript
  string SmallScoreTable; // Maniascript
  CGamePlaygroundUIConfig::EVisibility SmallScoreTableVisibility; // Maniascript
  bool ScoreTableOnlyManialink; // Maniascript
  bool AltMenuNoDefaultScores; // Maniascript
  bool AltMenuNoCustomScores; // Maniascript
  bool OverlayScoreSummary; // Maniascript
  MwId ScoreSummary_Player1; // Maniascript
  int ScoreSummary_Points1; // Maniascript
  int ScoreSummary_RoundPoints1; // Maniascript
  int ScoreSummary_MatchPoints1; // Maniascript
  float ScoreSummary_Gauge1; // Maniascript
  MwId ScoreSummary_Player2; // Maniascript
  int ScoreSummary_Points2; // Maniascript
  int ScoreSummary_RoundPoints2; // Maniascript
  int ScoreSummary_MatchPoints2; // Maniascript
  float ScoreSummary_Gauge2; // Maniascript
  bool ScreenIn3dHideScoreSummary; // Maniascript
  bool ScreenIn3dHideVersus; // Maniascript
  int CountdownEndTime; // Maniascript
  CGamePlaygroundUIConfig::EUIStatus UIStatus; // Maniascript
  CGamePlaygroundUIConfig::ELabelsVisibility AlliesLabelsVisibility; // Maniascript
  CGamePlaygroundUIConfig::EVisibility AlliesLabelsShowGauges; // Maniascript
  CGamePlaygroundUIConfig::EVisibility AlliesLabelsShowNames; // Maniascript
  uint AlliesLabelsMaxCount; // Range: 0 - 250 // Maniascript
  CGamePlaygroundUIConfig::ELabelsVisibility TeamLabelsVisibility; // Maniascript
  CGamePlaygroundUIConfig::EVisibility TeamLabelsShowGauges; // Maniascript
  CGamePlaygroundUIConfig::EVisibility TeamLabelsShowNames; // Maniascript
  CGamePlaygroundUIConfig::ELabelsVisibility OpposingTeamLabelsVisibility; // Maniascript
  CGamePlaygroundUIConfig::EVisibility OpposingTeamLabelsShowGauges; // Maniascript
  CGamePlaygroundUIConfig::EVisibility OpposingTeamLabelsShowNames; // Maniascript
  bool ForceSpectator; // Maniascript
  uint SpectatorForceCameraType; // Maniascript
  MwId SpectatorAutoTarget; // Maniascript
  MwId SpectatorForcedTarget; // Maniascript
  int SpectatorForcedClan; // Maniascript
  float SpectatorCamAutoLatitude; // Maniascript
  float SpectatorCamAutoLongitude; // Maniascript
  float SpectatorCamAutoRadius; // Maniascript
  CGamePlaygroundUIConfig::EObserverMode SpectatorObserverMode; // Maniascript
  void SendChat(wstring Text); // Maniascript
  void SendNotice(wstring Text, CGamePlaygroundUIConfig::ENoticeLevel Level, CGamePlayerInfo* Avatar, CGamePlaygroundUIConfig::EAvatarVariant AvatarVariant, CGamePlaygroundUIConfig::EUISound Sound, int SoundVariant); // Maniascript
  wstring GetLayerManialinkAction(CGameUILayer* Layer); // Maniascript
  void ClearLayerManialinkAction(CGameUILayer* Layer); // Maniascript
};

struct CGameManialinkFrame : public CGameManialinkControl {
  enum class CGameManialinkFrame::EControlType {
    Audio = 0,
    Entry = 1,
    FileEntry = 2,
    Frame = 3,
    Label = 4,
    Quad = 5,
    Video = 6,
  };
  const MwFastBuffer<CGameManialinkControl*> Controls; // Maniascript
  CGameManialinkControl* GetFirstChild(string ControlId); // Maniascript
  bool ClipWindowActive; // Maniascript
  vec2 ClipWindowRelativePosition; // Maniascript
  vec2 ClipWindowSize; // Maniascript
  bool DisablePreload; // Maniascript
};

struct CGameManialinkPage : public CMwNod {
  const string Url;
  CGameManialinkScriptHandler* const ScriptHandler;
  string ScriptText;
  CGameManialinkFrame* const MainFrame; // Maniascript
  CGameManialinkControl* GetFirstChild(string ControlId); // Maniascript
  bool LinksInhibited; // Maniascript
  void GetClassChildren(string Class, CGameManialinkFrame* Frame, bool Recursive); // Maniascript
  const MwFastBuffer<CGameManialinkControl*> GetClassChildren_Result; // Maniascript
};

// Description: "Manialink control."
struct CGameManialinkControl : public CMwNod {
  enum class CGameManialinkControl::EAlignHorizontal {
    Left = 0,
    HCenter = 1,
    Right = 2,
    None = 3,
  };
  enum class CGameManialinkControl::EAlignVertical {
    Top = 0,
    VCenter = 1,
    Bottom = 2,
    None = 3,
    VCenter2 = 4,
  };
  CControlBase* const Control;
  const string ControlId; // Maniascript
  const MwFastBuffer<string> ControlClasses; // Maniascript
  bool HasClass(string Class); // Maniascript
  vec2 Size; // Maniascript
  CGameManialinkControl::EAlignHorizontal HorizontalAlign; // Maniascript
  CGameManialinkControl::EAlignVertical VerticalAlign; // Maniascript
  bool Visible; // Maniascript
  vec2 RelativePosition_V3; // Maniascript
  float ZIndex; // Maniascript
  float RelativeScale; // Maniascript
  float RelativeRotation; // Maniascript
  const vec2 AbsolutePosition_V3; // Maniascript
  const vec3 AbsolutePosition; // Maniascript
  const float AbsoluteScale; // Maniascript
  const float AbsoluteRotation; // Maniascript
  bool DataAttributeExists(string DataName); // Maniascript
  string DataAttributeGet(string DataName); // Maniascript
  void DataAttributeSet(string DataName, string DataValue); // Maniascript
  void Show(); // Maniascript
  void Hide(); // Maniascript
  void Unload(); // Maniascript
  void Focus(); // Maniascript
  const bool IsFocused; // Maniascript
  vec3 RelativePosition; // Maniascript
  float PosnX; // Maniascript
  float PosnY; // Maniascript
  float PosnZ; // Maniascript
  float Scale; // Maniascript
};

// File extension: 'GameCardEventInfo.Gbx'
struct CGameCardEventInfo : public CGameCtnCollector {
  CGameCardEventInfo();

  string EventId;
};

// Description: ""
struct CGameManialinkQuad : public CGameManialinkControl {
  enum class CGameManialinkQuad::EKeepRatioMode {
    Inactive = 0,
    Clip = 1,
    Fit = 2,
  };
  enum class CGameManialinkQuad::EBlendMode {
    Default = 0,
    Add = 1,
  };
  void ChangeImageUrl(string fieldName); // Maniascript
  CPlugBitmap* Image; // Maniascript
  string ImageUrl; // Maniascript
  string ImageUrlFocus; // Maniascript
  string Style; // Maniascript
  string Substyle; // Maniascript
  bool StyleSelected; // Maniascript
  const bool DownloadInProgress; // Maniascript
  vec3 Colorize; // Maniascript
  vec3 ModulateColor; // Maniascript
  vec3 BgColor; // Maniascript
  vec3 BgColorFocus; // Maniascript
  float Opacity; // Maniascript
  CGameManialinkQuad::EKeepRatioMode KeepRatio; // Maniascript
  CGameManialinkQuad::EBlendMode Blend; // Maniascript
  bool Video_IsPlaying; // Maniascript
  bool Video_IsLooping; // Maniascript
  void Video_Rewind(); // Maniascript
};

struct CGameManiaPlanetMenuStations : public CMwNod {
  bool IsActive;
  CMwCmdFiber* const MenuManiaPlanetCmd;
  CScene2d* const OverlayMenuStations;
  CGameManialinkPage* const MainPage;
  const wstring MainPageManialinkViewerStartUrl;
  CGameManiaTitle* const MainStationFullManiaTitle;
  const bool IsBeginnerMenuDisplay;
  bool IsEditingStations;
  CGameScriptHandlerStation* const ScriptHandlerStations;
};

// File extension: 'AnchorPoint.gbx'
struct CGameCtnAnchorPoint : public CMwNod {
  CGameCtnAnchorPoint();

  const MwId TreeId;
  iso4 LocationInBlock;
  CGameCtnBlock* const Block;
};

// File extension: 'MacroBlock.Gbx'
struct CGameCtnMacroBlockInfo : public CGameCtnCollector {
  CGameCtnMacroBlockInfo();

  bool Connected;
  bool Initialized;
  CGameCtnBlockInfo* const GeneratedBlockInfo;
  const bool IsGround; // Maniascript
  const bool HasStart; // Maniascript
  const bool HasFinish; // Maniascript
  const bool HasCheckpoint; // Maniascript
  const bool HasMultilap; // Maniascript
  CGameCtnBlockInfo* const GeneratedBlockModel; // Maniascript
  CScriptTraitsMetadata* ScriptMetadata;
  void ClearScriptMetadata(); // Maniascript
  const MwFastBuffer<CPlugSpline3D*> TrafficPathSplines;
  const wstring Name; // Maniascript
};

struct CGameCtnEditorCommon : public CGameCtnEditor {
  CGameCtnChallenge* const Challenge;
  CGameCursorBlock* const Cursor;
  CGameCursorItem* const ItemCursor;
  CGameCtnEditorCommonInterface* EditorInterface;
  const float MouseMoveDist;
  CGameCtnBlockInfo* const CurrentBlockInfo;
  CGameItemModel* const CurrentItemModel;
  CGameItemModel* const CurrentTrafficItemModel;
  CGameCtnMacroBlockInfo* const CurrentMacroBlockInfo;
  CGameCtnMacroBlockInfo* const CopyPasteMacroBlockInfo;
  CGameCtnBlock* CurrentTerrainBlock;
  CGameCtnBlock* CurrentBlock;
  int PluginOffsetX;
  int PluginOffsetY;
  int PluginOffsetZ;
  const MwFastBuffer<CGameCtnEditorPlugin*> ActiveEditorPlugins;
  CGameCtnEditorPluginMapType* const EditorMapType;
  void ReloadPlugins();
  void DeactivateAllPlugins();
  bool HackMixMapping;
  bool UseNewTerraforming;
  bool UseNewPillars;
  bool HackExternalMbIconsHD;
  bool HackInternalMbIconsHD;
  bool HackForceTerrainBulldozeForbidden;
  bool HackPlaceGhostBlocksOnlyIfNecessary;
  bool HackCreateItemGroupFromMb;
  bool EnableGhostMode;
  bool EmbedCustomItems;
  bool HideAlwaysCursorDirectionalArrow;
  uint IterationsRecursive;
  CGameCtnBlock* const PickedBlock;
  CGameCtnBlock* BlockEditor2_Block;
  CGameCtnBlockInfo* BlockEditor2_BlockInfo;
  CPlugSolid* BlockEditor2_BlockSolid;
  const int OldNbAvailableCoppers;
  const uint OldNbMaxCoppers;
  uint CopperPriceThreshhold_WarningHigh;
  uint CopperPriceThreshhold_WarningVeryHigh;
  bool HasCopperPriceDemoLimit;
  uint CopperPriceThreshhold_DemoWarning;
  uint CopperPriceThreshhold_DemoLimit;
  string ColoredCopperPrice;
  wstring SkinText;
  CGameControlCameraEditorOrbital* OrbitalCameraControl;
  const float CameraTargetMinX;
  const float CameraTargetMaxX;
  const float CameraTargetMinZ;
  const float CameraTargetMaxZ;
  const float CameraAngle;
  CSceneMobil* const Grid;
  CGameOutlineBox* const UndergroundBox;
  CGameOutlineBox* const SelectionBox;
  CGameOutlineBox* const ItemSelectionBox;
  CGameOutlineBox* const CustomSelectionBox;
  CGameOutlineBox* const OffZoneSelectionBox;
  vec3 GridColor;
  float GridColorAlpha; // Range: 0 - 1
  string BlockEditor2_Text;
  wstring MacroDecalsEditor_Text;
  void ButtonComputeShadowsOnClick();
  void ButtonComputeDecalsOnClick();
  void ButtonHelper1OnClick();
  void SweepBlocksAndSave();
  void SweepTerrainAndSave();
  void SweepOffZoneAndSave();
  void SweepObjectsAndSave();
  void SuperSweepAndSave();
  void SweepSelectionAndSave();
  void SwitchToCameraIconMode();
  void SwitchFromCameraIconMode();
  void BlockViewerOnClick();
  void BlockAddOnClick();
  void BlockSubOnClick();
  void ButtonTestOnClick();
  void ButtonOffZoneOnClick();
  void ButtonBackOnClick();
  void ButtonSaveOnClick();
  void ButtonSaveAsOnClick();
  void ButtonLoadOnClick();
  void ButtonCameraUpOnClick();
  void ButtonCameraDownOnClick();
  void ButtonCameraLeftOnClick();
  void ButtonCameraRightOnClick();
  void ButtonValidateOnClick();
  void ButtonCursorRaiseOnClick();
  void ButtonCursorLowerOnClick();
  void ButtonCursorTurnClockwiseOnClick();
  void ButtonCursorTurnAnticlockwiseOnClick();
  void ButtonCursorUpOnClick();
  void ButtonCursorDownOnClick();
  void ButtonCursorLeftOnClick();
  void ButtonCursorRightOnClick();
  void HackTurbo_ButtonMapStyleOnClick();
  void HackTurbo_ButtonClassicMapEditorOnClick();
  void ButtonUndoOnClick();
  void ButtonRedoOnClick();
  void ButtonZoomInOnClick();
  void ButtonZoomOutOnClick();
  void ButtonEraserModeOnClick();
  void ButtonUndergroundModeOnClick();
  void ButtonAirMappingModeOnClick();
  void ButtonFreelookModeOnClick();
  void ButtonPickerModeOnClick();
  void ButtonSelectionBoxAddModeOnClick();
  void ButtonSelectionBoxSubModeOnClick();
  void ButtonChooseSkinModeOnClick();
  void ButtonSetCardEventModeOnClick();
  void ButtonInventoryDecalsOnClick();
  void ButtonInventoryTrafficOnClick();
  void ButtonInventoryFlyingTrafficOnClick();
  void ButtonInventoryBlocksOnClick();
  void ButtonInventoryGhostBlocksOnClick();
  void ButtonInventoryTerraformOnClick();
  void ButtonInventoryObjectsOnClick();
  void ButtonInventoryPluginsOnClick();
  void ButtonInventoryMacroBlocksOnClick();
  void ButtonCreateDeckOnClick();
  void ButtonMacroDecalsOnClick();
  void ButtonMacroDecalsSave_OnClick();
  void ButtonMacroDecalsScreenshot_OnClick();
  void ButtonMacroDecalApplyScreenshot_OnClick();
  void ButtonBlockPropertyModeOnClick();
  void ButtonBlockStockOnClick();
  void ButtonCopyPasteOnClick();
  void DeleteArticle_OnYes();
  void ButtonItemEditModeOnClick();
  void ButtonItemNewOnClick();
  void ButtonChallengeTypeOnClick();
  void ButtonObjectivesOnClick();
  void ButtonHelpOnClick();
  void ButtonShowChallengeDetailsOnClick();
  void ButtonEditToolsOnClick();
  void ButtonAdditionalToolsOnClick();
  void ButtonChooseMapTypeOnClick();
  void ButtonSelectionBoxCopyOnClick();
  void ButtonSelectionBoxCutOnClick();
  void ButtonSelectionBoxSaveNewOnClick();
  void ButtonSelectionBoxResetOnClick();
  void ButtonSelectionBoxSelectAllOnClick();
  void ButtonSelectionBoxSymmetriseOnClick();
  void EditorPluginCreateOnClick();
  void EditorPluginEditOnClick();
  void ButtonMixMapOnClick();
  void ButtonNewTerrainEditorOnClick();
  void ButtonNewPillarsOnClick();
  void ButtonHackExternalMbIconsHDOnClick();
  void ButtonHackInternalMbIconsHDOnClick();
  void ButtonHackCreateItemGroupFromMbOnClick();
  void ButtonEditEndRaceReplay();
  void ButtonBackStepOnClick();
  CGameCtnEditorDecals* EditorDecals;
  CGameCtnEditorTraffic* EditorTraffic;
  void BlockEditor_OnRotateIcon();
  void BlockEditor_OnCancelIcon();
  void BlockEditor_OnSaveIcon();
  void MacroDecalsEditor_OnSave();
  void MacroDecalsEditor_OnCancel();
  void SaveMacroBlockFromScript_OnSave();
  void SaveMacroBlockFromScript_OnCancel();
  void OnPluginOperationCancelled();
  void OnPluginOperationCancelled_OnYes();
  void OnPluginOperationCancelled_OnNo();
  void SaveChallengeFromScript_OnSave();
  void ComputeShadowsFromScript_OnOk();
  void HideInterfaceFromScript_OnOk();
  void HideInterfaceFromScript_OnCancel();
  void SwitchToMTFromScript_OnOk();
  void SwitchToPlaygroundFromScript_OnOk();
  void SwitchToValidationFromScript_OnOk();
  void SwitchToTestWithMapTypeFromScript_OnOk();
  void SwitchToTestWithMapTypeFromScript_OnCancel();
  void QuitFromScript_OnOk();
  void QuickQuitFromScript_OnOk();
  void ChangePlaceModeFromScript_OnOk();
  void PrecalcParticleEditor_Init();
  void PrecalcParticleEditor_Destroy();
  CGameCtnEditChallengePrecalcParticles* PrecalcParticleEditor;
  string DebugShootIconName;
  void OnMapRulesModeSelected();
  void TooManyCoppers_OnOk();
  void TooManyCoppers_OnNeverShowAgain();
  wstring ForcedPluginName;
  string ForcedPluginSettings;
};

struct CGameCtnEditorFree : public CGameCtnEditorCommon {
};

struct CGameCtnEditorPuzzle : public CGameCtnEditorFree {
};

struct CGamePlaygroundScore : public CMwNod {
  CGamePlayerInfo* const User; // Maniascript
  const bool IsRegisteredForLadderMatch; // Maniascript
  const float LadderScore; // Maniascript
  int LadderRankSortValue; // Maniascript
  float LadderMatchScoreValue; // Maniascript
  uint LadderClan; // Maniascript
};

struct CGameCtnEditorCommonInterface : public CMwNod {
  CGameCtnEditorCommonInterface();

  CGameCtnArticleNodeDirectory* const BlockIconsRoot;
  CGameCtnArticleNodeDirectory* const TerraformIconsRoot;
  CGameCtnArticleNodeDirectory* const MacroBlockIconsRoot;
  CGameCtnArticleNodeDirectory* const ObjectIconsRoot;
  CGameCtnArticleNodeDirectory* const DecalIconsRoot;
  CGameCtnArticleNodeDirectory* const MacroDecalIconsRoot;
  CGameCtnArticleNodeDirectory* const TrafficObjectIconsRoot;
  CGameCtnArticleNodeDirectory* const PluginsIconsRoot;
  CScene2d* const InterfaceScene;
  CGameCtnEditorCommon* const Editor;
  void ToggleBlockRotation();
  wstring CurrentToolTip;
  const string Allocated;
  const wstring m_LastMacroBlockSelected;
  void EditSnapCamera_OnOk();
  void EditSnapCamera_OnCancel();
  CPlugBitmap* EditSnapCamera_BitmapSnap;
  void HideInterface();
  void ShowInterface();
};

struct CGameControlCameraFollowAboveWater : public CGameControlCameraTarget {
};

// File extension: 'MacroDecals.Gbx'
struct CGameCtnMacroDecals : public CGameCtnCollector {
  CGameCtnMacroDecals();

  bool Connected;
};

struct CGameCtnEditorSimple : public CGameCtnEditorPuzzle {
};

struct CGameCtnArticleNodeDirectory : public CGameCtnArticleNode {
  const MwFastBuffer<CGameCtnArticleNode*> ChildNodes;
  void CreateNewDirectory();
};

struct CGameCtnArticleNodeArticle : public CGameCtnArticleNode {
  CGameCtnArticle* const Article;
};

struct CGameCtnDecalsBrush : public CMwNod {
  CGameCtnDecalsBrush();

  const uint NbDecals;
  UnnamedEnum DecalProj;
  float GridStepPos;
  float GridStepRoll;
  float GridStepSize;
  float GridStepOpacity;
  float GridStepThickness;
  float Size;
  float EraserSize;
  float Opacity;
  float Thickness;
  void Reset();
  bool RandomizeAtlasId;
  bool RandomizeRoll;
  float RandomRollMin;
  float RandomRollMax;
  bool RandomizeSize;
  float RandomSizeMin;
  float RandomSizeMax;
  bool RandomizeOpacity;
  float RandomOpacityMin;
  float RandomOpacityMax;
};

struct CGameCtnEditChallengePrecalcParticles : public CMwNod {
  CGameCtnEditChallengePrecalcParticles();

  bool ShowHelpers;
  void ResetSimulation();
  void Simulate();
  bool StepByStep;
  void GenerateDecalsFromCurState();
  void GenerateDecalsFromScratch();
};

struct CGameCtnEditorDecals : public CMwNod {
  CGameCtnEditorDecals();

  CGameCtnDecalsBrush* BrushPlace;
  CGameCtnDecalsBrush* BrushModify;
  uint EffectFlickerFrequency;
  bool ShowHelpers;
  const uint NbDecals;
  const uint NbDecalsInBrush;
  const UnnamedEnum EditionMode;
  CGameCtnChallenge* MergeFromChallenge;
  void BitmapDecalSetFlipX();
  void BitmapDecalSetFlipY();
  void SnapOnLandscape();
  CSceneDecalsManager* const DecalsMgr;
  CScene* Scene;
  void Undo_Clear();
  float UVDistMax;
  void BitmapDecalSetRemoveTooCloseDecals();
  void BitmapDecalSetRemoveInvalidDecals();
  void BitmapDecalSetRemoveInvalidDecalsAllSets();
  CPlugBitmap* Bitmap;
  const uint BitmapDecalSet;
  bool TestDensity;
  float Density; // Range: 0 - 1
  void BrushSizeInc();
  void BrushSizeDec();
  void BrushRollInc();
  void BrushRollDec();
  void BrushOpacityInc();
  void BrushOpacityDec();
  void BrushThicknessInc();
  void BrushThicknessDec();
  void BrushModelOrAtlasInc();
  void BrushModelOrAtlasPrev();
  void DecalFillZone();
  void BrushReset();
  void BrushApply();
  void BrushPickSimple();
  void BrushPickMulti();
  void EditionModeModify();
  void EditionModePlace();
  void DecalBoxesShowHide();
  void DecalSnapOnOff();
  void BrushSwitchProj();
  void BrushFlipU();
  void Undo_Rewind();
  void Undo_Forward();
  void BitmapDecalSetAdd();
  void BitmapDecalSetRemove();
  void BitmapDecalSetNext();
  void BitmapDecalSetPrev();
  void BitmapDecalSetDuplicate();
  void BitmapEditionPlaneShowHide();
  void BitmapSave();
  void BitmapCellGridShowHide();
  void SceneBitmapsDecals_Create();
  void SceneBitmapsDecals_Destroy();
};

// File extension: 'GamePrecalcPartParams.Gbx'
struct CGameCtnPrecalcPartParams : public CMwNod {
  CGameCtnPrecalcPartParams();

  iso4 EmitLoc;
  vec3 EmitZoneSize;
  uint EmitCount;
  uint IterCount;
  float TimeStep;
  uint RandValSeed;
  float Mass;
  float FluidFriction;
  float Restitution;
  float Friction;
  uint CollGroupFlags;
  bool LeafMotion;
  float LeafMotionScale;
  float LeafMotionFreq;
  CPlugSurface* CollSurf;
  vec3 PhyZoneGravity;
  vec3 PhyZoneWind;
  CPlugDecalModel* DecalModel;
  float DecalSizeBase;
  float DecalSizeVar;
  float DecalBoxDepth;
};

// File extension: 'ZoneGenealogy.Gbx'
struct CGameCtnZoneGenealogy : public CMwNod {
  CGameCtnZoneGenealogy();

  MwId CurrentZoneId;
  uint CurrentIndex;
  UnnamedEnum Dir;
  MwFastBuffer<MwId> ZoneIds;
  CGameCtnZone* const CurrentZone;
  const MwFastBuffer<CGameCtnZone*> Zones;
  const MwFastBuffer<int> ZoneHeights;
  const int BaseHeight;
  const int BottomHeight;
  const int TopHeight;
  void RemoveLastZoneId();
  void AddZoneId();
};

struct CGameOfficialRecorder : public CMwNod {
  const bool CustomEnabled;
  const wstring CustomServerName;
  const string CustomAdSuffix;
};

struct CGameOfficialRecord : public CMwNod {
  const UnnamedEnum State;
  const bool IsAllowed;
  const bool IsRunning;
  const bool IsBroken;
  const bool IsCustom;
  const bool MustUploadReplay;
  CGamePlayerInfo* const User;
  CGameCtnChallengeInfo* const ChallengeInfo;
  CGameCtnChallenge* const Challenge;
  const uint RecordTime;
  const uint Record;
  const uint OldRecord;
  const uint ValidationSeed;
  const uint UploadReplayKey;
  const string CustomRecordData;
  const uint StartRequestTime;
  const uint StartResponseTime;
  const uint StopRequestTime;
  const uint StopResponseTime;
  const uint UploadRequestTime;
  const uint UploadResponseTime;
  const wstring StartRequestErrorMessage;
  const wstring StopOrUploadRequestErrorMessage;
  const wstring ResultMessage;
};

struct CGameCtnAutoTerrain : public CMwNod {
  CGameCtnAutoTerrain();

  int OffsetX;
  int OffsetY;
  int OffsetZ;
  CGameCtnZoneGenealogy* const Genealogy;
};

struct CGameCtnSolidDecals : public CMwNod {
  CGameCtnSolidDecals();

  string Name;
  MwId TypeId;
  uint TypeIntensity;
  uint DecalFrequency;
  const uint DecalsCount;
};

struct CGameCtnBlockInfoMobil : public CMwNod {
  CGameCtnBlockInfoMobil();

  CSceneMobil* const OldMobil;
  CPlugSolid* SolidFid;
  CPlugSolid* SolidAggreg;
  CPlugSolid* SolidCache;
  CSceneMobil* const MobilCache;
  const MwFastBuffer<CGameCtnBlockInfoMobilLink*> DynaLinks;
  uint SolidFrequency;
  const MwFastBuffer<CGameCtnSolidDecals*> SolidDecals;
  uint NoDecalFrequency;
  const vec3 GeomTranslation;
  const vec3 GeomRotation;
};

struct CGameCtnEditorBlockSolid : public CGameEditorAsset {
  CGameCtnEditorBlockSolidInterface* const EditorBlockSolidInterface;
  CGameEditorModel* const EditorModel;
  CPlugSolid* const BlockSolid;
  CPlugSolid2Model* const BlockSolid2;
  void ButtonVertexAndEdgeMode_OnClick();
  void ButtonFaceMode_OnClick();
  void ButtonPreviewMode_OnClick();
  void ButtonAddTruc_OnClick();
  void ButtonAddCube_OnClick();
  void ButtonAddSphere_OnClick();
  void ButtonAddCylinder_OnClick();
  void ButtonExport_OnClick();
  void ButtonExtrudeSpe_OnClick();
  void ButtonPlaneSwitch_OnClick();
  void ButtonUndoSpe_OnClick();
  void ButtonRedoSpe_OnClick();
  void ButtonCopy_OnClick();
  void ButtonCut_OnClick();
  void ButtonStepMinus_OnClick();
  void ButtonStepPlus_OnClick();
  void ButtonCreation_OnClick();
  void ButtonSelectionSpe_OnClick();
  void ButtonSplitEdge_OnClick();
  void ButtonMergePoints_OnClick();
  void ButtonRegularSelection_OnClick();
  void ButtonAddSelection_OnClick();
  void ButtonMove_OnClick();
  void ButtonSpeRotate_OnClick();
  void ButtonUniformScale_OnClick();
  void Button_1DScale_OnClick();
  void ButtonPaste_OnClick();
  void ButtonFreeLook_OnClick();
  void ButtonDeleteSpe_OnClick();
  void ButtonCreationPolygonalChain_OnClick();
  void ButtonCreationSpline_OnClick();
  void ButtonCreationDisc_OnClick();
  void ButtonCreationFace_OnClick();
};

struct CGameCtnEditorBlockSolidInterface : public CMwNod {
  CGameCtnEditorBlockSolidInterface();

  CControlContainer* const InterfaceRoot;
};

struct CGameControlCameraEditorOrbital : public CGameControlCamera {
  CGameControlCameraEditorOrbital();

  float CameraToTargetDistance;
  float CurrentVAngle;
  float CurrentHAngle;
  float DestinationHAngle;
  vec3 TargetedPosition;
  float MinDistance;
  float MaxDistance;
  float MinVAngle;
  float MaxVAngle;
  float ParamTurnCameraDistance_X;
  float ParamTurnCameraDistance_Y;
  uint ParamScrollHoldTime;
  uint ParamScrollRepeatTime;
  float ParamScrollAreaStart;
  float ParamScrollAreaMax;
  float ParamScrollLowerLimitStart;
  float ParamScrollLowerLimitEnd;
  float ParamScrollSpeed0_OnZoomMin;
  float ParamScrollSpeed0_OnZoomMax;
  float ParamScrollSpeed1_OnZoomMin;
  float ParamScrollSpeed1_OnZoomMax;
  float ParamPanSpeed_OnZoomMin;
  float ParamPanSpeed_OnZoomMax;
  float ParamRotationSpeed;
  float ParamAutopanTime;
  float ParamZoomPower;
  float ParamZoomClosePower;
  float ParamZoomDistanceClose;
  uint ParamCameraBaseRaiseTime;
};

// File extension: 'GameCtnMediaBlockDOF.gbx'
struct CGameCtnMediaBlockDOF : public CGameCtnMediaBlock {
  CGameCtnMediaBlockDOF();

  float FocusZ;
  float LensSize;
  uint GhostId;
};

// File extension: 'GameCtnMediaBlockToneMapping.gbx'
struct CGameCtnMediaBlockToneMapping : public CGameCtnMediaBlock {
  CGameCtnMediaBlockToneMapping();

  float Exposure;
  float MaxHDR;
  UnnamedEnum FilmCurve;
};

// File extension: 'GameCtnMediaBlockBloomHdr.gbx'
struct CGameCtnMediaBlockBloomHdr : public CGameCtnMediaBlock {
  CGameCtnMediaBlockBloomHdr();

  float Intensity;
  float StreaksIntensity;
  float StreaksAttenuation;
};

struct CGameCtnMediaBlockTimeSpeed : public CGameCtnMediaBlock {
  CGameCtnMediaBlockTimeSpeed();

};

// File extension: 'GameCtnMediaBlockManialink.Gbx'
struct CGameCtnMediaBlockManialink : public CGameCtnMediaBlock {
  CGameCtnMediaBlockManialink();

  wstring ManialinkURL;
};

struct CGamePlayerProfileChunk : public CMwNod {
  const string ChunkName;
  const string GameName;
  const string Checksum;
  const uint TimeStamp;
  const bool IsSynchronizedFromMS;
  const bool IsModified;
  const bool IsLoaded;
  const bool IsOnlineSave;
};

struct CGamePlayerProfileChunk_AccountSettings : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_AccountSettings();

  const string OnlineLogin;
  string OnlinePassword;
  string OnlineValidationCode;
  string OnlineSupportKey;
  wstring NickName;
  wstring Description;
  string ClubLinkUrl;
  bool LoginValidated;
  bool RememberOnlinePassword;
  bool AutoConnect;
  bool AskForAccountConversion;
  bool ReceiveNews;
  const uint OnlineRemainingNickNamesChangesCount;
  const uint OnlinePlanets;
  string RSAPrivateKey;
  string LastUsedMSAddress;
  string LastUsedMSPath;
  string LastSessionId;
  const wstring OnlinePath;
  CGameLeague* League;
  MwFastBuffer<wstring> LeagueSteps;
  wstring AvatarName;
  const MwFastBuffer<CGameNetOnlineMessage*> InboxMessages;
  const MwFastBuffer<CGameNetOnlineMessage*> ReadMessages;
  const MwFastBuffer<CGameNetOnlineMessage*> OutboxMessages;
  bool UnlockAllCheat;
  bool FriendsCheat;
  uint EulaVersion;
  uint PrivacyPolicyVersion;
  uint Age;
  const uint FameStars;
};

struct CGamePlayerProfileChunk_GameSettings : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_GameSettings();

  float RumbleIntensity;
  bool DownloadOfficialRecordReplaysForGroup;
  float StereoscopyStrength01;
  float StereoscopyAdvancedScreenDist;
  CGameCtnMediaShootParams* ShootParamsVideo;
  wstring ServerName;
  wstring ServerComment;
  uint NetworkGameMode;
  uint MaxPlayerCount;
  uint MaxSpectatorCount;
  uint NetStateQuality;
  uint LadderMode;
  bool AdvancedCreate;
  bool AllowDownload;
  bool EnablePlayerSkinGeom;
  bool EnableUnlimitedHorns;
  bool AutoSaveReplayOnMulti;
  bool SaveRoundsSeparately;
  bool ProposeSimpleEditor;
  uint UnlockClickCount;
  bool UnlockTalkedToFriend;
  bool UnlockInvitedBuddy;
  bool UnlockHadBuddy;
  bool UnlockSponsoredBuddy;
  bool UnlockCreatedTrack;
  bool UnlockPlayedHotSeat;
  bool UnlockPlayedOnline;
  bool UnlockSentScore;
  float MouseAccelQuantity;
  float MouseSensitivity_Default;
  float MouseSensitivity_Laser;
};

struct CGamePlayerProfileChunk_InterfaceSettings : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_InterfaceSettings();

  wstring MenuLeagueFilter;
  uint MenuInternetView;
  uint DynamicLoadScreenIndex;
  uint ClickedOnShare;
  uint EditorHelp;
};

struct CGamePlayerProfileChunk_InputBindingsConfig : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_InputBindingsConfig();

  CInputBindingsConfig* Config;
};

struct CGamePlayerProfileChunk_VehiclesSettings : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_VehiclesSettings();

};

struct CGamePlayerProfileChunk_Challenge : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_Challenge();

  wstring ChallengeName;
};

struct CGamePlayerProfileChunk_Campaign : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_Campaign();

  CGameCtnCampaign* Campaign;
};

// File extension: 'GameCtnMediaBlockVehicleLight.gbx'
struct CGameCtnMediaBlockVehicleLight : public CGameCtnMediaBlock {
  CGameCtnMediaBlockVehicleLight();

};

struct CGameCardEventListInfo : public CGameCtnCollector {
};

struct CGamePlaygroundUIConfigMgr : public CMwNod {
  void ResetAll(); // Maniascript
  CGamePlaygroundUIConfig* const UIAll; // Maniascript
  const MwFastBuffer<CGamePlaygroundUIConfig*> UI; // Maniascript
  CGamePlaygroundUIConfig* GetUI_Player(CGamePlayer* Player); // Maniascript
  CGamePlaygroundUIConfig* GetUI_User(CGamePlayerInfo* User); // Maniascript
  const MwFastBuffer<CGameUILayer*> UILayers; // Maniascript
  CGameUILayer* UILayerCreate(); // Maniascript
  void UILayerDestroy(CGameUILayer* Layer); // Maniascript
  void UILayerDestroyAll(); // Maniascript
  const MwFastBuffer<CGameUILayer*> UIReplayLayers; // Maniascript
  CGamePlaygroundUIConfig* const LocalPlayerConfig;
  CGamePlaygroundUIConfig* const LocalPlayerConfig1;
  CGamePlaygroundUIConfig* const LocalPlayerConfig2;
  CGamePlaygroundUIConfig* const LocalPlayerConfig3;
  uint UISequenceMaxDuration; // Maniascript
  bool HoldLoadingScreen; // Maniascript
};

// File extension: 'Frame.Gbx'
struct CGamePlaygroundControlSmPlayers : public CControlFrame {
  CGamePlaygroundControlSmPlayers();

  uint ListLineCount;
  uint ListColumnCount;
  CControlFrame* CardModelPlayer;
  void EdClean();
};

// File extension: 'Frame.Gbx'
struct CGamePlaygroundControlMessages : public CControlFrame {
  CGamePlaygroundControlMessages();

  CControlContainer* MessageModel;
  uint LineCount;
  float LineHeight;
  uint DisplayDuration;
  uint MinDuration;
  float LastMessageBaseScale;
  uint ShowEffectDuration;
  float ShowEffectScale;
  uint HideEffectDuration;
  float HideEffectScale;
  float RatioElimination;
};

// Description: "Rules API for gamemodes."
struct CGamePlaygroundScript : public CMwNod {
  enum class CGamePlaygroundScript::EMedal {
    None = 0,
    Finished = 1,
    Bronze = 2,
    Silver = 3,
    Gold = 4,
    Author = 5,
  };
  enum class CGamePlaygroundScript::ESystemPlatform {
    None = 0,
    Steam = 1,
    UPlay = 2,
    PS4 = 3,
    XBoxOne = 4,
  };
  enum class CGamePlaygroundScript::ESystemSkuIdentifier {
    Unknown = 0,
    EU = 1,
    US = 2,
    JP = 3,
  };
  CPlugFileTextScript* Script;
  wstring ModeStatusMessage; // Maniascript
  CGameManiaTitle* const LoadedTitle; // Maniascript
  const string ServerLogin; // Maniascript
  const wstring ServerName; // Maniascript
  const wstring ServerModeName; // Maniascript
  const wstring MapName; // Maniascript
  CGameCtnChallenge* const Map; // Maniascript
  const wstring MapPlayerModelName; // Maniascript
  const MwFastBuffer<CGamePlayerInfo*> Users; // Maniascript
  const MwFastBuffer<CGameTeamProfile*> Teams; // Maniascript
  string NeutralEmblemUrl; // Maniascript
  const string ForcedClubLinkUrl1; // Maniascript
  const string ForcedClubLinkUrl2; // Maniascript
  void TweakTeamColorsToAvoidHueOverlap(); // Maniascript
  string ClientManiaAppUrl; // Maniascript
  const uint Now; // Maniascript
  const uint Period; // Maniascript
  bool MatchEndRequested; // Maniascript
  const bool ServerShutdownRequested; // Maniascript
  const bool MapLoaded; // Maniascript
  void RequestLoadMap(); // Maniascript
  void RequestUnloadMap(); // Maniascript
  const MwFastBuffer<CGameCtnChallengeInfo*> MapList; // Maniascript
  uint NextMapIndex; // Maniascript
  CGamePlaygroundUIConfigMgr* const UIManager; // Maniascript
  void Hud_Load(wstring ModuleUrl); // Maniascript
  CGamePlaygroundModuleServerHud* const Hud; // Maniascript
  void Ladder_OpenMatch_Request(); // Maniascript
  void Ladder_AddPlayer(CGamePlaygroundScore* PlayerScore); // Maniascript
  void Ladder_OpenMatch_BeginRequest(); // Maniascript
  void Ladder_OpenMatch_AddPlayer(CGamePlaygroundScore* PlayerScore); // Maniascript
  void Ladder_OpenMatch_EndRequest(); // Maniascript
  void Ladder_CloseMatchRequest(); // Maniascript
  void Ladder_CancelMatchRequest(); // Maniascript
  const bool Ladder_RequestInProgress; // Maniascript
  void Ladder_SetResultsVersion(uint Version); // Maniascript
  void Ladder_SetMatchMakingMatchId(uint MatchId); // Maniascript
  void Ladder_EnableChallengeMode(bool Enable); // Maniascript
  bool Admin_KickUser(CGamePlayerInfo* User, wstring Reason); // Maniascript
  void Admin_SetLobbyInfo(bool IsLobby, int LobbyPlayerCount, int LobbyMaxPlayerCount, float LobbyPlayersLevel); // Maniascript
  void AutoTeamBalance(); // Maniascript
  void Solo_SetNewRecord(CGamePlaygroundScore* PlayerScore, CGamePlaygroundScript::EMedal PlayerScore); // Maniascript
  const bool Solo_NewRecordSequenceInProgress; // Maniascript
  CGamePlaygroundScriptXmlRpc* const XmlRpc; // Maniascript
  CXmlScriptManager* const Xml; // Maniascript
  CNetScriptHttpManager* const Http; // Maniascript
  CInputScriptManager* const Input; // Maniascript
  CGameDataManagerScript* const DataMgr; // Maniascript
  CGameScoreAndLeaderBoardManagerScript* const ScoreMgr; // Maniascript
  const CGamePlaygroundScript::ESystemPlatform SystemPlatform; // Maniascript
  const CGamePlaygroundScript::ESystemSkuIdentifier SystemSkuIdentifier; // Maniascript
  int Synchro_AddBarrier(); // Maniascript
  bool Synchro_BarrierReached(int Barrier); // Maniascript
  bool Users_AreAllies(CGamePlayerInfo* User1, CGamePlayerInfo* User2); // Maniascript
  void Users_RequestSwitchToSpectator(CGamePlayerInfo* User); // Maniascript
  CGamePlayerInfo* Users_CreateFake(wstring NickName, int RequestedTeam); // Maniascript
  void Users_DestroyFake(CGamePlayerInfo* User); // Maniascript
  void Users_SetNbFakeUsers(int NbTeam1, int NbTeam2); // Maniascript
  void Users_DestroyAllFakes(); // Maniascript
  uint Users_EdNbFakeUsers;
  void ItemList_Begin(); // Maniascript
  bool ItemList_Begin2(); // Maniascript
  MwId ItemList_Add(wstring ModelName); // Maniascript
  MwId ItemList_AddWithSkin(wstring ModelName, wstring SkinName); // Maniascript
  void ItemList_End(); // Maniascript
  void DemoToken_StartUsingToken(); // Maniascript
  void DemoToken_StopUsingToken(); // Maniascript
  void DemoToken_GetAndUseToken(CGamePlayerInfo* User); // Maniascript
  void ActionList_Begin(); // Maniascript
  bool ActionList_Begin2(); // Maniascript
  MwId ActionList_Add(wstring ActionName); // Maniascript
  void ActionList_End(); // Maniascript
  bool UseMinimap; // Maniascript
  bool Replay_AutoStart; // Maniascript
  void Replay_Start(); // Maniascript
  void Replay_Stop(); // Maniascript
  CGameAchievementScriptManager* const AchievementsManager; // Maniascript
  CGameManiaplanetPluginInterface* GetPluginInterface(wstring Name); // Maniascript
  const MwFastBuffer<CGameManiaplanetPluginInterface*> PluginInterfaces; // Maniascript
  CGamePluginInterfacesScript* const Plugins; // Maniascript
  wstring Dbg_DumpDeclareForVariables(CMwNod* Nod, bool StatsOnly); // Maniascript
};

// File extension: 'GameCtnMediaBlockFxCameraMap.gbx'
struct CGameCtnMediaBlockFxCameraMap : public CGameCtnMediaBlock {
  CGameCtnMediaBlockFxCameraMap();

  wstring FileName;
};

struct CGamePodium : public CMwNod {
  CSceneCamera* const PodiumCamera;
};

struct CGameManialinkDownloader : public CMwNod {
  const wstring Manialink;
};

struct CGamePlaygroundBasic : public CGamePlayground {
};

struct CGameScriptHandlerManiaPlanet : public CGameScriptHandlerStation {
  enum class CGameScriptHandlerManiaPlanet::EContext {
    MenuStartUp = 0,
    MenuManiaPlanet = 1,
    MenuManiaTitleMain = 2,
    MenuProfile = 3,
    MenuSolo = 4,
    MenuLocal = 5,
    MenuMulti = 6,
    MenuCompetitions = 7,
    MenuEditors = 8,
    EditorPainter = 9,
    EditorTrack = 10,
    EditorMediaTracker = 11,
    Solo = 12,
    SoloLoadScreen = 13,
    Multi = 14,
    MultiLoadScreen = 15,
    MenuCustom = 16,
    Unknown = 17,
  };
  CGameManiaPlanetScriptAPI* const ManiaPlanet; // Maniascript
  float MusicVolume; // Range: 0 - 1 // Maniascript
  wstring SubPageUrl; // Maniascript
  CGameManialinkPage* const SubPage; // Maniascript
  void SubPageReload(); // Maniascript
  const CGameScriptHandlerManiaPlanet::EContext ActiveContext; // Maniascript
  const string ActiveContext_MenuFrame; // Maniascript
  const string ActiveContext_DialogFrame; // Maniascript
  const string ActiveContext_SystemDialogFrame; // Maniascript
  const bool ActiveContext_ClassicDialogDisplayed; // Maniascript
  const uint ActiveContext_GameWill; // Maniascript
  const bool ActiveContext_ManialinkBrowserDisplayed; // Maniascript
};

struct CGamePlayerProfileChunk_PackagesInfos : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_PackagesInfos();

  const uint PackagesInfosCount;
};

struct CGameAnticheat : public CMwNod {
  enum class CGameAnticheat::EMonitorTypes {
    KeyDown = 0,
    GameAction = 1,
  };
  const uint Now; // Maniascript
  const MwFastBuffer<CGameAnticheatFunctions*> Packages;
  CGameAnticheatMonitor* CreateMonitor(CGameAnticheat::EMonitorTypes Type);
  void DestroyMonitor(CGameAnticheatMonitor* Monitor);
  const MwFastBuffer<CGameAnticheatMonitor*> Monitors;
  const MwFastBuffer<CGameAnticheatEvent*> PendingEvents;
  void PopEvent(CGameAnticheatEvent* Event);
  void SendResult(string Message);
  bool IsKeyDown(int KeyCode);
};

struct CGameAnticheatFunctions : public CMwNod {
};

struct CGameAnticheatMonitor : public CMwNod {
  enum class CGameAnticheatMonitor::EMonitorType {
    KeyDown = 0,
    GameAction = 1,
  };
  const CGameAnticheatMonitor::EMonitorType Type;
  bool Active;
};

struct CGameAnticheatEvent : public CMwNod {
  enum class CGameAnticheatEvent::EventType {
    OnMessage = 0,
    OnKeyDown = 1,
  };
  const CGameAnticheatEvent::EventType Type;
  const string OnMessage_Message;
  const uint OnKeyDown_Char;
  const uint OnKeyDown_ScanCode;
};

struct CGameCtnMediaBlockShoot : public CGameCtnMediaBlock {
  CGameCtnMediaBlockShoot();

};

struct CGamePlayerProfileChunk_GameScores : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_GameScores();

  const uint GlobalSkillPoints;
  const MwFastBuffer<CGamePlayerProfileChunk_ChallengesScores*> ChallengesScoresChunks;
};

struct CGamePlayerProfileChunk_GameStats : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_GameStats();

  const uint TotalTimePlay;
  const uint TotalTimeInSolo;
  const uint TotalTimeInSoloRace;
  const uint TotalTimeInSoloPuzzle;
  const uint TotalTimeInSoloPlatform;
  const uint TotalTimeInSoloScript;
  const uint TotalTimeInSplitScreen;
  const uint TotalTimeInHotSeat;
  const uint TotalTimeInNetwork;
  const uint TotalTimeInNetworkTimeAttack;
  const uint TotalTimeInNetworkRounds;
  const uint TotalTimeInNetworkLaps;
  const uint TotalTimeInNetworkStunts;
  const uint TotalTimeInNetworkCup;
  const uint TotalTimeInNetworkScript;
  const uint TotalTimeInEditChallenge;
  const uint TotalTimeInEditReplay;
  const uint TotalTimeInEditSkin;
  const uint TotalTimeInManiaLink;
  const uint TotalNbReset;
  const uint TotalNbFinish;
  const uint TotalNbChallenges;
  const uint AverageTimePlay;
  const uint AverageTimeInSolo;
  const uint AverageTimeInSoloRace;
  const uint AverageTimeInSoloPuzzle;
  const uint AverageTimeInSoloPlatform;
  const uint AverageTimeInSoloScript;
  const uint AverageTimeInSplitScreen;
  const uint AverageTimeInHotSeat;
  const uint AverageTimeInNetwork;
  const uint AverageTimeInNetworkTimeAttack;
  const uint AverageTimeInNetworkRounds;
  const uint AverageTimeInNetworkLaps;
  const uint AverageTimeInNetworkStunts;
  const uint AverageTimeInNetworkCup;
  const uint AverageTimeInNetworkScript;
  const uint AverageTimeInEditChallenge;
  const uint AverageNbReset;
  const uint AverageNbFinish;
  const uint MaxTimePlay;
  const uint MaxTimeInSolo;
  const uint MaxTimeInSoloRace;
  const uint MaxTimeInSoloPuzzle;
  const uint MaxTimeInSoloPlatform;
  const uint MaxTimeInSoloScript;
  const uint MaxTimeInSplitScreen;
  const uint MaxTimeInHotSeat;
  const uint MaxTimeInNetwork;
  const uint MaxTimeInNetworkTimeAttack;
  const uint MaxTimeInNetworkRounds;
  const uint MaxTimeInNetworkLaps;
  const uint MaxTimeInNetworkStunts;
  const uint MaxTimeInNetworkCup;
  const uint MaxTimeInNetworkScript;
  const uint MaxTimeInEditChallenge;
  const uint MaxNbReset;
  const uint MaxNbFinish;
  const wstring MostPlayed;
  const wstring MostRaced;
  const wstring MostEdited;
  const wstring MostNetted;
  const MwFastBuffer<CGamePlayerProfileChunk_ChallengesStats*> ChallengesStatsChunks;
};

struct CGamePlayerProfileChunk_ChallengesStats : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_ChallengesStats();

  const uint ChallengesStatsCount;
};

struct CGamePlayerProfileChunk_ChallengesScores : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_ChallengesScores();

  const uint ChallengesScoresCount;
};

struct CGameCtnMediaBlockSkel : public CGameCtnMediaBlock {
  CGameCtnMediaBlockSkel();

  CSceneMobil* const Mobil;
};

struct CGameEditorAnimClip : public CMwNod {
  CGameEditorAnimChar_Interface* const CharEditorInterface;
  CGameEditorAnimChar* const CharEditor;
  float ParticlesPosX;
  float ParticlesPosY;
  float ParticlesPosZ;
  float ParticlesVelX;
  float ParticlesVelY;
  float ParticlesVelZ;
  float ParticlesAnglesYaw;
  float ParticlesAnglesPitch;
  float ParticlesAnglesRoll;
  bool ParticlesOnMesh;
  bool UseCustomColor;
  float ParticlesScale; // Range: 0 - 5
  bool CustomKeyLinearHue;
  bool CustomKeyPos;
  bool CustomKeyAngles;
  bool CustomKeyVel;
  bool KeyVelInLocal;
  bool CustomKeyVolume;
  bool CustomKeyPitch;
  uint SoundVariant;
  float SoundVolume; // Range: 0 - 5
  float Pitch; // Range: 0 - 4
  bool Preview;
  float SoundPosX;
  float SoundPosY;
  float SoundPosZ;
  const wstring SpriteTextureFid;
  float SpritesPosX;
  float SpritesPosY;
  float SpritesPosZ;
  float SpritesSize; // Range: 0 - 25
  bool SpritesIsFree;
  bool UseRandomSoundVar;
  const string SoundVarName;
  wstring ActionDescription;
};

// File extension: 'EDTransition.Gbx'
struct CGameCtnBlockInfoTransition : public CGameCtnBlockInfo {
  CGameCtnBlockInfoTransition();

};

// File extension: 'ZoneTransition.Gbx'
struct CGameCtnZoneTransition : public CGameCtnZone {
  CGameCtnZoneTransition();

  enum class CGameCtnZoneTransition::EZoneTransitionType {
    Custom = 0,
    TriZone = 1,
    Overlap = 2,
  };
  CGameCtnBlockInfoTransition* BlockInfoTransition;
  CGameCtnZoneTransition::EZoneTransitionType TransitionType;
  MwId FrontierId_0To1;
  MwId FrontierId_0To2;
  MwId FrontierId_1To2;
  MwId FrontierId_Base;
  MwId FrontierId_Overlap;
  MwId FrontierId_BaseToOverlap;
  MwId ReplacementZoneId;
  UnnamedEnum Border_North;
  CGameCtnZoneGenealogy* const Genealogy_North;
  UnnamedEnum Border_East;
  CGameCtnZoneGenealogy* const Genealogy_East;
  UnnamedEnum Border_South;
  CGameCtnZoneGenealogy* const Genealogy_South;
  UnnamedEnum Border_West;
  CGameCtnZoneGenealogy* const Genealogy_West;
};

struct CGameMenuSkinChooser : public CMwNod {
  CScene3d* SceneProfile;
  CPlugCamControlModel* CamModel;
};

struct CGameEditorTrigger : public CMwNod {
  CGameEditorTrigger();

};

// File extension: ''
struct CGameCtnZoneFusionInfo : public CMwNod {
  CGameCtnZoneFusionInfo();

  MwId CompatibleZoneId;
  MwId MergedZoneId;
  UnnamedEnum FusionType;
};

// File extension: 'Frame.Gbx'
struct CGameControlCardBuddy : public CGameControlCard {
  CGameControlCardBuddy();

  const wstring StrLoginOrNickName;
  const wstring StrStatus;
  CPlugBitmap* AvatarOrLeague;
};

struct CGameBuddy : public CMwNod {
  CGameBuddy();

  string Login;
  wstring NickName;
  wstring Path;
  uint SkillsRank;
  uint SkillsPoints;
  uint LadderRank;
  uint LadderPoints;
  bool Invited;
  bool WaitingConfirmation;
  bool CanReceiveMessages;
  bool IsUsed;
  bool IsOnline;
  CGameNetServerInfo* Server;
  CGameAvatar* Avatar;
  CGameLeague* League;
};

struct CGameCtnEditorPluginMapType : public CGameCtnEditorPlugin {
  enum class CGameCtnEditorPluginMapType::EValidationStatus {
    NotValidable = 0,
    Validable = 1,
    Validated = 2,
  };
  bool CustomEditAnchorData; // Maniascript
  void ClearMapMetadata(); // Maniascript
  CGameCtnEditorPluginMapType::EValidationStatus ValidationStatus; // Maniascript
  wstring ValidabilityRequirementsMessage; // Maniascript
  bool ValidationEndRequested; // Maniascript
  bool ValidationEndNoConfirm; // Maniascript
  void RequestEnterPlayground(); // Maniascript
  void RequestLeavePlayground(); // Maniascript
  const bool IsSwitchedToPlayground; // Maniascript
  CGamePlaygroundUIConfigMgr* const UIManager; // Maniascript
  const MwFastBuffer<CGamePlayerInfo*> Users; // Maniascript
};

struct CGameCursorItem : public CMwNod {
  CGameCursorItem();

  CSceneMobil* const HelperMobil;
};

struct CGameCtnMacroBlockJunction : public CMwNod {
  CGameCtnMacroBlockJunction();

  enum class CGameCtnMacroBlockJunction::ECardDir {
    North = 0,
    East = 1,
    South = 2,
    West = 3,
  };
  int OffsetX;
  int OffsetY;
  int OffsetZ;
  CGameCtnMacroBlockJunction::ECardDir Dir;
  bool CanBeEntry;
  bool CanBeExit;
};

struct CGameActionMaker : public CGameEditorAsset {
  void Undo();
  void Redo();
  void Exit();
  void ModelLoad();
  void ActionNew();
  void ActionOpen();
  void ActionSaveAs();
  void SwitchFullScreen();
  void BlockSoundInsert();
  void BlockParticleInsert();
  void BlockSpriteInsert();
  void BlockCollisionInsert();
  void BlockRemove();
  void AdditionalTools();
  void SwitchToBlockMode();
  void SwitchToAnimMode();
  void SwitchToScriptMode();
  void AnimEdit();
  void AnimValidate();
  void BlocAnimValidate();
  void ScriptParamProjAdd();
  void ScriptParamProjSuppr();
  void ScriptParamProjEdit();
  void ScriptParamAnimEdit();
  void ScriptParamProjNext();
  void ScriptParamProjPrev();
  void ScriptParamUpdate();
  void ScriptParamCompil();
  void ScriptAdvancedParamCompil();
  void SoundTypePrev();
  void SoundTypeNext();
  void SoundVarPrev();
  void SoundVarNext();
  void ImportBullet();
  void ExportBullet();
  void Help();
  void ScriptAddAnimEffect();
  void ScriptAddProjEffect();
  void ScriptAddBuffEffect();
  void ScriptAddAoeEffect();
  void CreateResources();
  void ImportResources();
  void LibraryValidate();
  void ActionIsCustom();
  void ShowBulletEditor();
  void TestMode();
  void SwitchBulletState();
  void SubModelShowList();
  void SwitchSubModelVisibility();
  void SoloMode();
  void ModelValidate();
  void NextBulletPattern();
  void PrevBulletPattern();
  void NextLaserType();
  void PrevLaserType();
  void EditModeBullet();
  void EditModeExplosion();
  void EditModeSound();
  void EditModeGameplay();
  void EditModeGauge();
  void SubModelTypeCore();
  void SubModelTypeTrail();
  void SubModelTypePower();
  void SubModelTypeSmokeDebris();
  void ProjectileSoundModeShooting();
  void ProjectileSoundModeExplosion();
  void ProjectileSoundModeProjectile();
  void ProjectileSoundModeRebound();
  void ProjectileSoundModeHoming();
  void ParamGameplayModeBullet();
  void ParamGameplayModeExplosion();
  void ParamLoadMesh();
  void DrawHelp();
  void SpriteTextureImport();
  CGameEditorAnimClip* const ClipEditor;
  CGameEditorBullet* const BulletEditor;
  CPlugAnimFile* const AnimFile;
  uint ClipIndex;
  CGameActionModel* Action;
};

struct CGameCtnEditorTraffic : public CMwNod {
  bool IsInsertionMode;
  bool DrawClipsPassingPoints;
  bool EnableClipsMagnetization;
  float MagnetizationRadius;
  float AirClipYIncr;
  bool EnableSplinesBoundariesEdition;
  void CycleCurrentLane();
  const uint CurrentGraphSplineBaseIndex;
  uint CursorNumberOfLanes;
  float CursorVerticalOffset;
  float CursorYaw;
  vec3 CursorCenterWorldPos;
  vec3 MagnetCursorYawPitchRoll;
  float PickKeyRadius;
  float CursorVerticalOffsetMin;
  float CursorVerticalStep;
  float CursorRotationStep;
  float CursorLanesSpacing;
  void NewCurrentLanes();
  void DeleteCurrentLanes();
  void StartTrafficPreview();
  void StopTrafficPreview();
  float PhyPeriod;
  CPlugTrafficGraph* TrafficGraph;
};

struct CGameCtnEditorScriptAnchoredObject : public CMwNod {
  enum class CGameCtnEditorScriptAnchoredObject::ECardinalDirections {
    North = 0,
    East = 1,
    South = 2,
    West = 3,
  };
  const vec3 Position; // Maniascript
};

struct CGameCtnEditorScriptSpecialProperty : public CMwNod {
  const string DefaultTag; // Maniascript
  const uint DefaultOrder; // Maniascript
  string Tag; // Maniascript
  uint Order; // Maniascript
  CGameCtnBlock* const Block; // Maniascript
  CGameCtnEditorScriptAnchoredObject* const Item; // Maniascript
};

struct CGameCtnBlockInfoVariant : public CMwNod {
  MwFastArray<CGameCtnBlockUnitInfo*> BlockUnitInfos;
  string Name; // Maniascript
  const bool IsAllUnderground; // Maniascript
  const bool IsPartUnderground; // Maniascript
  const int3 Size; // Maniascript
  CPlugSolid* HelperSolidFid;
  CPlugSolid* FacultativeHelperSolidFid;
  CMwNod* WayPointTriggerSolid;
  enum class CGameCtnBlockInfoVariant::EPhysicsModTriggerType {
    InsideToOutside_ZP = 0, // InsideToOutside_Z+
    InsideToOutside_YP = 1, // InsideToOutside_Y+
    InsideToOutside_XP = 2, // InsideToOutside_X+
    InsideToOutside_ZN = 3, // InsideToOutside_Z-
    InsideToOutside_YN = 4, // InsideToOutside_Y-
    InsideToOutside_XN = 5, // InsideToOutside_X-
  };
  CGameCtnBlockInfoVariant::EPhysicsModTriggerType PhysicsModTriggerType;
  CMwNod* PhysicsModTriggerSolid;
  CMwNod* ScreenInteractionTriggerSolid;
  CGameGateModel* Gate;
  CGameTeleporterModel* Teleporter;
  CGameTurbineModel* Turbine;
  CPlugFlockModel* FlockModel;
  float FlockEmitterRadius;
  float FlockEmitterPower;
  uint FlockEmitterSpawnCount;
  bool FlockEmitterIsRepulsor;
  bool FlockEmitterIsLandingArea;
  vec3 FlockEmitterPos;
  CGameSpawnModel* SpawnModel;
  CPlugProbe* Probe;
  bool HasManualSymmetryH;
  bool HasManualSymmetryV;
  bool HasManualSymmetryD1;
  bool HasManualSymmetryD2;
  const bool HasVolumeSymmetryH;
  const bool HasVolumeSymmetryV;
  const bool HasVolumeSymmetryD1;
  const bool HasVolumeSymmetryD2;
  const bool HasFreeClips;
  uint SymmetricalVariantIndex;
  enum class CGameCtnBlockInfoVariant::ESymmetricalVariantRotation {
    North = 0,
    East = 1,
    South = 2,
    West = 3,
  };
  CGameCtnBlockInfoVariant::ESymmetricalVariantRotation CardinalDir;
  uint NoPillarBelowIndex;
  bool IsObsoleteVariant;
  bool IsFakeReplacement;
  bool AutoChangeVariantOff;
  bool DontPlaySound1;
  bool DontPlaySound2;
  bool IsNoPillarBelowVariant;
  enum class CGameCtnBlockInfoVariant::EMultiDir {
    SameDir = 0,
    SymmetricalDirs = 1,
    AllDir = 2,
    OpposedDirOnly = 3,
    PerpendicularDirsOnly = 4,
    NextDirOnly = 5,
    PreviousDirOnly = 6,
  };
  CGameCtnBlockInfoVariant::EMultiDir MultiDir;
  vec3 SpawnTrans;
  float SpawnYaw; // Range: -180 - 180
  float SpawnPitch; // Range: -90 - 90
  const int2 OffsetBoundingBoxMin; // Maniascript
  const int2 OffsetBoundingBoxMax; // Maniascript
  MwFastBuffer<CMwNod*> Mobils00;
  MwFastBuffer<CMwNod*> Mobils01;
  MwFastBuffer<CMwNod*> Mobils02;
  MwFastBuffer<CMwNod*> Mobils03;
  MwFastBuffer<CMwNod*> Mobils04;
  MwFastBuffer<CMwNod*> Mobils05;
  MwFastBuffer<CMwNod*> Mobils06;
  MwFastBuffer<CMwNod*> Mobils07;
  MwFastBuffer<CMwNod*> Mobils08;
  MwFastBuffer<CMwNod*> Mobils09;
  MwFastBuffer<CMwNod*> Mobils10;
  MwFastBuffer<CMwNod*> Mobils11;
  MwFastBuffer<CMwNod*> Mobils12;
  MwFastBuffer<CMwNod*> Mobils13;
  MwFastBuffer<CMwNod*> Mobils14;
  enum class CGameCtnBlockInfoVariant::EVariantBaseType {
    Inherit = 0,
    None = 1,
    Conductor = 2,
    Generator = 3,
  };
  CGameCtnBlockInfoVariant::EVariantBaseType VariantBaseType;
  MwFastArray<CGameCtnBlockUnitInfo*> BlockUnitModels; // Maniascript
};

struct CGameCtnBlockInfoVariantGround : public CGameCtnBlockInfoVariant {
  CGameCtnBlockInfoVariantGround();

  enum class CGameCtnBlockInfoVariantGround::EnumAutoTerrainPlaceType {
    Auto = 0,
    Force = 1,
    DoNotPlace = 2,
    DoNotDestroy = 3,
  };
  const MwFastBuffer<CGameCtnAutoTerrain*> AutoTerrains;
  bool AutoTerrainWithFrontiers;
  int AutoTerrainHeightOffset;
  CGameCtnBlockInfoVariantGround::EnumAutoTerrainPlaceType AutoTerrainPlaceType;
};

struct CGameCtnBlockInfoVariantAir : public CGameCtnBlockInfoVariant {
  CGameCtnBlockInfoVariantAir();

  CGameCtnBlockInfo* PillarsForCompatibility;
};

struct CGameTeamProfile : public CMwNod {
  wstring Name; // Maniascript
  wstring ZonePath; // Maniascript
  wstring City; // Maniascript
  string EmblemUrl; // Maniascript
  string PresentationManialinkUrl; // Maniascript
  string ClubLinkUrl; // Maniascript
  float ColorLinearHuePrimary; // Range: 0 - 1
  const vec3 ColorPrimaryAsColor;
  vec3 ColorPrimary; // Maniascript
  float ColorLinearHueSecondary; // Range: 0 - 1
  const vec3 ColorSecondaryAsColor;
  vec3 ColorSecondary; // Maniascript
  const wstring ColorText; // Maniascript
  const wstring ColorizedName; // Maniascript
  void UpdateCache();
};

// Description: "Events for Manialink page scripts."
struct CGameManialinkScriptEvent : public CMwNod {
  enum class CGameManialinkScriptEvent::EType {
    KeyPress = 0,
    MouseClick = 1,
    MouseOver = 2,
    MouseOut = 3,
    EntrySubmit = 4,
    MenuNavigation = 5,
    PluginCustomEvent = 6,
  };
  enum class CGameManialinkScriptEvent::EMenuNavAction {
    Up = 0,
    Right = 1,
    Left = 2,
    Down = 3,
    Select = 4,
    Cancel = 5,
    PageUp = 6,
    PageDown = 7,
    AppMenu = 8,
    Action1 = 9,
    Action2 = 10,
  };
  const CGameManialinkScriptEvent::EType Type; // Maniascript
  const uint KeyCode; // Maniascript
  const string KeyName; // Maniascript
  const string CharPressed; // Maniascript
  const string ControlId; // Maniascript
  CGameManialinkControl* const Control; // Maniascript
  const CGameManialinkScriptEvent::EMenuNavAction MenuNavAction; // Maniascript
  const bool IsActionAutoRepeat; // Maniascript
  const wstring CustomEventType; // Maniascript
  const MwFastBuffer<wstring> CustomEventData; // Maniascript
  const wstring PluginCustomEventType; // Maniascript
  const MwFastBuffer<wstring> PluginCustomEventData; // Maniascript
};

// Description: "API for the plugins of the map editor."
struct CGameCtnEditorPlugin : public CGameManiaApp {
  enum class CGameCtnEditorPlugin::ECardinalDirections {
    North = 0,
    East = 1,
    South = 2,
    West = 3,
  };
  enum class CGameCtnEditorPlugin::EPlaceMode {
    Unknown = 0,
    Terraform = 1,
    Block = 2,
    Macroblock = 3,
    Skin = 4,
    CopyPaste = 5,
    Test = 6,
    Plugin = 7,
    CustomSelection = 8,
    OffZone = 9,
    BlockProperty = 10,
    Path = 11,
    GhostBlock = 12,
    Item = 13,
  };
  enum class CGameCtnEditorPlugin::EditMode {
    Unknown = 0,
    Place = 1,
    FreeLook = 2,
    Erase = 3,
    Pick = 4,
    SelectionAdd = 5,
    SelectionRemove = 6,
  };
  enum class CGameCtnEditorPlugin::EShadowsQuality {
    NotComputed = 0,
    VeryFast = 1,
    Fast = 2,
    Default = 3,
    High = 4,
    Ultra = 5,
  };
  enum class CGameCtnEditorPlugin::EValidationStatus {
    NotValidable = 0,
    Validable = 1,
    Validated = 2,
  };
  enum class CGameCtnEditorPlugin::EditorStatus {
    Running = 0,
    ChallengeType = 1,
    Objectives = 2,
    ToPlayground = 3,
    ChangeEditor = 4,
    Save = 5,
    SaveSameId = 6,
    ToPlaygroundRecordPath = 7,
    QuickSave = 8,
    QuickLoad = 9,
    EditToolsMenu = 10,
    Quit = 11,
    QuickQuit = 12,
    ReplayRemoveAllKeys = 13,
    ReplaySave = 14,
    ReplayQuit = 15,
    ToAnim = 16,
    ToItem = 17,
    ToEditor = 18,
    ToLayer = 19,
    EditSequences = 20,
    QuickEditInGameClipGroup = 21,
    ComputeShadows = 22,
    ComputeShadowsFromScript = 23,
    ShootVideo = 24,
    ShootScreen = 25,
    Preview = 26,
    EditBlock = 27,
    EditBlockQuit = 28,
    AdditionalToolsMenu = 29,
    RecordGhost = 30,
    SaveMacroblock = 31,
    EditCameraEffectScript = 32,
    SaveFromScript = 33,
    CreatePluginScript = 34,
    EditPluginScript = 35,
    EditMapTypeScript = 36,
    ReloadMapTypeScript = 37,
    EditClipConfigScript = 38,
    ChooseMapType = 39,
    ClipExport = 40,
    ChooseBlockSkin = 41,
    Count = 42,
  };
  const MwFastBuffer<CGameCtnEditorPluginScriptEvent*> PendingEvents; // Maniascript
  CGameCtnChallenge* const Map; // Maniascript
  const wstring MapName; // Maniascript
  const bool IsEditorReadyForRequest; // Maniascript
  bool HoldLoadingScreen; // Maniascript
  void ComputeShadows(); // Maniascript
  void ComputeShadows1(CGameCtnEditorPlugin::EShadowsQuality ShadowsQuality); // Maniascript
  const CGameCtnEditorPlugin::EShadowsQuality CurrentShadowsQuality; // Maniascript
  const bool IsUltraShadowsQualityAvailable; // Maniascript
  void Undo(); // Maniascript
  void Redo(); // Maniascript
  void Help(); // Maniascript
  void Validate(); // Maniascript
  void AutoSave(); // Maniascript
  void Quit(); // Maniascript
  void QuickQuit(); // Maniascript
  void QuitAndSetResult(wstring Type, MwFastBuffer<wstring>& Data); // Maniascript
  void QuickQuitAndSetResult(wstring Type, MwFastBuffer<wstring>& Data); // Maniascript
  void TestMapFromStart(); // Maniascript
  void TestMapFromCoord(int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir); // Maniascript
  void TestMapFromCoordWithMapTypeScript(int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir); // Maniascript
  void TestMapWithMode(wstring RulesModeName); // Maniascript
  void StartTestMapWithMode(wstring RulesModeName); // Maniascript
  void SaveMap(wstring FileName); // Maniascript
  void SaveMapCompat(wstring FileName, wstring Path); // Maniascript
  CGameCtnEditorPlugin::EPlaceMode PlaceMode; // Maniascript
  CGameCtnEditorPlugin::EditMode EditMode; // Maniascript
  bool UndergroundMode; // Maniascript
  bool BlockStockMode; // Maniascript
  int3 CursorCoord; // Maniascript
  CGameCtnEditorPlugin::ECardinalDirections CursorDir; // Maniascript
  CGameCtnBlockInfo* CursorBlockModel; // Maniascript
  CGameCtnBlockInfo* CursorTerrainBlockModel; // Maniascript
  CGameCtnMacroBlockInfo* CursorMacroblockModel; // Maniascript
  float CameraVAngle; // Maniascript
  float CameraHAngle; // Maniascript
  float CameraToTargetDistance; // Maniascript
  vec3 CameraTargetPosition; // Maniascript
  const vec3 CameraPosition; // Maniascript
  vec3 TargetedPosition; // Maniascript
  float ThumbnailCameraVAngle; // Maniascript
  float ThumbnailCameraHAngle; // Maniascript
  float ThumbnailCameraRoll; // Maniascript
  float ThumbnailCameraFovY; // Maniascript
  vec3 ThumbnailCameraPosition; // Maniascript
  bool GetRaceCamera(vec3 Position, float Yaw, float Pitch, float Roll, float FovY); // Maniascript
  bool EnableAirMapping; // Maniascript
  bool EnableMixMapping; // Maniascript
  void RemoveAllBlocks(); // Maniascript
  void RemoveAllTerrain(); // Maniascript
  void RemoveAllOffZone(); // Maniascript
  void RemoveAllObjects(); // Maniascript
  void RemoveAll(); // Maniascript
  void RemoveAllBlocksAndTerrain(); // Maniascript
  void ShowCustomSelection(); // Maniascript
  void HideCustomSelection(); // Maniascript
  void CopyPaste_Copy(); // Maniascript
  void CopyPaste_Cut(); // Maniascript
  void CopyPaste_Remove(); // Maniascript
  void CopyPaste_SelectAll(); // Maniascript
  void CopyPaste_ResetSelection(); // Maniascript
  void OpenToolsMenu(); // Maniascript
  void EditMediatrackIngame(); // Maniascript
  void PreloadAllBlocks(); // Maniascript
  void PreloadAllItems(); // Maniascript
  bool CanPlaceBlock(CGameCtnBlockInfo* BlockModel, int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir, bool OnGround, uint VariantIndex); // Maniascript
  bool PlaceBlock(CGameCtnBlockInfo* BlockModel, int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir); // Maniascript
  bool CanPlaceBlock_NoDestruction(CGameCtnBlockInfo* BlockModel, int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir, bool OnGround, uint VariantIndex); // Maniascript
  bool PlaceBlock_NoDestruction(CGameCtnBlockInfo* BlockModel, int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir); // Maniascript
  bool CanPlaceRoadBlocks(CGameCtnBlockInfo* BlockModel, int2 StartCoord, int2 EndCoord); // Maniascript
  bool PlaceRoadBlocks(CGameCtnBlockInfo* BlockModel, int2 StartCoord, int2 EndCoord); // Maniascript
  bool CanPlaceTerrainBlocks(CGameCtnBlockInfo* BlockModel, int2 StartCoord, int2 EndCoord); // Maniascript
  bool PlaceTerrainBlocks(CGameCtnBlockInfo* BlockModel, int2 StartCoord, int2 EndCoord); // Maniascript
  bool PlaceTerrainBlocks_NoDestruction(CGameCtnBlockInfo* BlockModel, int2 StartCoord, int2 EndCoord); // Maniascript
  bool CanPlaceMacroblock(CGameCtnMacroBlockInfo* MacroblockModel, int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir); // Maniascript
  bool PlaceMacroblock(CGameCtnMacroBlockInfo* MacroblockModel, int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir); // Maniascript
  bool CanPlaceMacroblock_NoDestruction(CGameCtnMacroBlockInfo* MacroblockModel, int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir); // Maniascript
  bool PlaceMacroblock_NoDestruction(CGameCtnMacroBlockInfo* MacroblockModel, int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir); // Maniascript
  bool CanPlaceMacroblock_NoTerrain(CGameCtnMacroBlockInfo* MacroblockModel, int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir); // Maniascript
  bool PlaceMacroblock_NoTerrain(CGameCtnMacroBlockInfo* MacroblockModel, int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir); // Maniascript
  bool RemoveMacroblock(CGameCtnMacroBlockInfo* MacroblockModel, int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir); // Maniascript
  bool RemoveMacroblock_NoTerrain(CGameCtnMacroBlockInfo* MacroblockModel, int2 Coord, CGameCtnEditorPlugin::ECardinalDirections Dir); // Maniascript
  CGameCtnBlock* GetBlock(int2 Coord); // Maniascript
  bool IsBlockModelSkinnable(CGameCtnBlockInfo* BlockModel); // Maniascript
  uint GetNbBlockModelSkins(CGameCtnBlockInfo* BlockModel); // Maniascript
  wstring GetBlockModelSkinName(CGameCtnBlockInfo* BlockModel, uint SkinIndex); // Maniascript
  uint GetBlockSkinIndex(CGameCtnBlock* Block); // Maniascript
  void SetBlockSkinIndex(CGameCtnBlock* Block, uint SkinIndex); // Maniascript
  bool OpenBlockSkinDialog(CGameCtnBlock* Block); // Maniascript
  bool RemoveBlock(int2 Coord); // Maniascript
  bool RemoveTerrainBlocks(int2 StartCoord, int2 EndCoord); // Maniascript
  uint GetBlockGroundHeight(CGameCtnBlockInfo* BlockModel, int CoordX, int CoordZ, CGameCtnEditorPlugin::ECardinalDirections Dir); // Maniascript
  uint GetGroundHeight(int CoordX, int CoordZ); // Maniascript
  int2 GetMouseCoordOnGround(); // Maniascript
  int2 GetMouseCoordAtHeight(uint CoordY); // Maniascript
  CGameCtnBlock* GetStartLineBlock(); // Maniascript
  bool RemoveItem(CGameCtnEditorScriptSpecialProperty* Item); // Maniascript
  void CopyPaste_AddOrSubSelection(int2 StartCoord, int2 EndCoord); // Maniascript
  bool CopyPaste_Symmetrize(); // Maniascript
  void SaveMacroblock(CGameCtnMacroBlockInfo* MacroblockModel); // Maniascript
  CGameCtnMacroBlockInfo* GetMacroblockModelFromName(wstring MacroblockModelName); // Maniascript
  CGameCtnMacroBlockInfo* GetMacroblockModelFromFilePath(wstring MacroblockModelFilePath); // Maniascript
  CGameCtnBlockInfo* GetTerrainBlockModelFromName(wstring TerrainBlockModelName); // Maniascript
  CGameCtnBlockInfo* GetBlockModelFromName(wstring BlockModelName); // Maniascript
  wstring GetMapStyle(); // Maniascript
  void SetMapStyle(wstring MapStyle); // Maniascript
  const MwFastBuffer<CGameCtnEditorScriptAnchoredObject*> Items; // Maniascript
  const MwFastBuffer<wstring> MediatrackIngameClips; // Maniascript
  const MwFastBuffer<wstring> MediatrackIngameIsScriptClips; // Maniascript
  uint MediatrackIngameEditedClipIndex; // Maniascript
  const MwFastBuffer<CGameCtnBlock*> Blocks; // Maniascript
  const MwFastBuffer<CGameCtnBlockInfo*> BlockModels; // Maniascript
  const MwFastBuffer<CGameCtnBlockInfo*> TerrainBlockModels; // Maniascript
  const MwFastBuffer<CGameCtnMacroBlockInfo*> MacroblockModels; // Maniascript
  const MwFastBuffer<CGameCtnEditorScriptSpecialProperty*> AnchorData; // Maniascript
  MwFastBuffer<int3> CustomSelectionCoords; // Maniascript
  vec3 CustomSelectionRGB; // Maniascript
  bool EnableEditorInputsCustomProcessing; // Maniascript
  bool EnableCursorShowingWhenInterfaceIsFocused; // Maniascript
  bool HideEditorInterface; // Maniascript
  bool HideBlockHelpers; // Maniascript
  bool ShowPlacementGrid; // Maniascript
  bool IsTrustedPlugin_DevBuild; // Maniascript
  const CGameCtnEditorPlugin::EditorStatus EditorStatus; // Maniascript
  bool HideAlwaysCursorDirectionalArrow; // Maniascript
  float CursorBrightnessFactor; // Maniascript
  bool EnableUnlimitedUndoHistory; // Maniascript
  uint UndoHistorySize; // Maniascript
  uint CoppersLimit; // Maniascript
  bool TurboClassicMapEditorMode; // Maniascript
  const bool EditorInputIsDown_Menu; // Maniascript
  const bool EditorInputIsDown_SwitchToRace; // Maniascript
  const bool EditorInputIsDown_Undo; // Maniascript
  const bool EditorInputIsDown_Redo; // Maniascript
  const bool EditorInputIsDown_CursorUp; // Maniascript
  const bool EditorInputIsDown_CursorRight; // Maniascript
  const bool EditorInputIsDown_CursorDown; // Maniascript
  const bool EditorInputIsDown_CursorLeft; // Maniascript
  const bool EditorInputIsDown_CursorRaise; // Maniascript
  const bool EditorInputIsDown_CursorLower; // Maniascript
  const bool EditorInputIsDown_CursorTurn; // Maniascript
  const bool EditorInputIsDown_CursorPick; // Maniascript
  const bool EditorInputIsDown_CursorPlace; // Maniascript
  const bool EditorInputIsDown_CursorDelete; // Maniascript
  const bool EditorInputIsDown_CameraUp; // Maniascript
  const bool EditorInputIsDown_CameraRight; // Maniascript
  const bool EditorInputIsDown_CameraDown; // Maniascript
  const bool EditorInputIsDown_CameraLeft; // Maniascript
  const bool EditorInputIsDown_CameraZoomNext; // Maniascript
  const bool EditorInputIsDown_Camera0; // Maniascript
  const bool EditorInputIsDown_Camera1; // Maniascript
  const bool EditorInputIsDown_Camera3; // Maniascript
  const bool EditorInputIsDown_Camera7; // Maniascript
  const bool EditorInputIsDown_Camera9; // Maniascript
  const bool EditorInputIsDown_PivotChange; // Maniascript
  const bool EditorInputIsDown_CursorTurnSlightly; // Maniascript
  const bool EditorInputIsDown_CursorTurnSlightlyAntiClockwise; // Maniascript
  const bool EditorInputIsDown_IconUp; // Maniascript
  const bool EditorInputIsDown_IconRight; // Maniascript
  const bool EditorInputIsDown_IconDown; // Maniascript
  const bool EditorInputIsDown_IconLeft; // Maniascript
  const bool EditorInputIsDown_RemoveAll; // Maniascript
  const bool EditorInputIsDown_Save; // Maniascript
  const bool EditorInputIsDown_SaveAs; // Maniascript
  const bool EditorInputIsDown_MapStyle; // Maniascript
  const bool EditorInputIsDown_ClassicMapEditor; // Maniascript
  const float CollectionSquareSize; // Maniascript
  const float CollectionSquareHeight; // Maniascript
  const uint CollectionGroundY; // Maniascript
  const CGameCtnEditorPlugin::EValidationStatus ValidationStatus; // Maniascript
  string ManialinkText; // Maniascript
  CGameManialinkPage* const ManialinkPage; // Maniascript
  uint GetInterfaceNumber(CGameCtnCollector* Collector); // Maniascript
  void SetInterfaceNumber(CGameCtnCollector* Collector, uint NewValue); // Maniascript
};

struct CGameCtnMediaBlockCameraEffectScript : public CGameCtnMediaBlockCameraEffect {
  CGameCtnMediaBlockCameraEffectScript();

  const float Now; // Maniascript
  const float A; // Maniascript
  const float B; // Maniascript
  const float C; // Maniascript
  vec3 OffsetPos; // Maniascript
  vec3 OffsetRot; // Maniascript
};

struct CGameCtnChallengeScript : public CMwNod {
  CGameCtnChallenge* const Map; // Maniascript
  bool StartClip(wstring ClipName); // Maniascript
};

struct CGamePlayerProfileChunk_EditorSettings : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_EditorSettings();

  wstring EditorSettingsName;
};

struct CGameCtnEditorPluginScriptEvent : public CGameManiaAppScriptEvent {
  enum class CGameCtnEditorPluginScriptEvent::EType {
    LayerCustomEvent = 0,
    KeyPress = 1,
    MenuNavigation = 3,
    ChildModuleEvent = 4,
    ParentModuleEvent = 5,
    CursorSelectionBegin = 6,
    CursorSelectionEnd = 7,
    CursorChange = 8,
    MapModified = 9,
    EditorInput = 10,
    EditAnchor = 11,
    EditObjectives = 12,
    StartValidation = 13,
    StartTest = 14,
  };
  enum class CGameCtnEditorPluginScriptEvent::EInput {
    Unknown = 0,
    Menu = 1,
    SwitchToRace = 2,
    Undo = 3,
    Redo = 4,
    CursorUp = 5,
    CursorRight = 6,
    CursorDown = 7,
    CursorLeft = 8,
    CursorRaise = 9,
    CursorLower = 10,
    CursorTurn = 11,
    CursorPick = 12,
    CursorPlace = 13,
    CursorDelete = 14,
    CameraUp = 15,
    CameraRight = 16,
    CameraDown = 17,
    CameraLeft = 18,
    CameraZoomNext = 19,
    Camera0 = 20,
    Camera1 = 21,
    Camera3 = 22,
    Camera7 = 23,
    Camera9 = 24,
    PivotChange = 25,
    CursorTurnSlightly = 26,
    CursorTurnSlightlyAntiClockwise = 27,
    IconUp = 28,
    IconRight = 29,
    IconDown = 30,
    IconLeft = 31,
    RemoveAll = 32,
    Save = 33,
    SaveAs = 34,
    MapStyle = 35,
    ClassicMapEditor = 36,
  };
  const CGameCtnEditorPluginScriptEvent::EType Type; // Maniascript
  const CGameCtnEditorPluginScriptEvent::EInput Input; // Maniascript
  const MwId EditedAnchorDataId; // Maniascript
  const bool IsFromPad; // Maniascript
  const bool IsFromMouse; // Maniascript
  const bool IsFromKeyboard; // Maniascript
};

// File extension: 'GameCtnMediaBlockDirtyLens.gbx'
struct CGameCtnMediaBlockDirtyLens : public CGameCtnMediaBlock {
  CGameCtnMediaBlockDirtyLens();

  void SwitchOn();
};

struct CGameCtnMediaBlockCameraEffectInertialTracking : public CGameCtnMediaBlockCameraEffect {
  CGameCtnMediaBlockCameraEffectInertialTracking();

  bool TrackingEnabled;
  bool AutoFocusEnabled;
  bool AutoZoomEnabled;
  float AutoZoomMinDist;
  float AutoZoomMaxDist;
  float AutoZoomMinFov;
  float AutoZoomMaxFov;
};

struct CGameEditorPacks : public CMwNod {
  const bool PackInfo_IsTitlePack;
  bool PackInfo_IsCreditedPack;
  uint PackInfo_Price;
  const uint PackInfo_PriceIncluded;
  const uint PackInfo_PriceTotal;
  string PackInfo_Url;
  wstring PackInfo_PackName;
  wstring PackInfo_Comment;
  void PackInfo_EditTitle();
  void PackInfo_EditTitle_OnOk();
  void PackInfo_EditContents();
  const wstring Contents_Contents;
  const wstring Contents_IncludedContents;
  void Contents_OnAdd();
  void Contents_OnClear();
  const wstring Title_BaseTitle;
  void Title_ChooseBaseTitle();
  const MwId Title_PlayerModel;
  void Title_OnOpenInExplorer();
  void Title_OnButtonPreview();
  const wstring Title_MusicFolder;
  void Title_ChooseMusicFolder();
  void Title_ClearMusicFolder();
  string Title_CollectionGroup;
  int Title_SortOrder;
  string Title_StationManialinkUrl;
  void Title_ChooseStationManialinkUrl();
  void Title_ClearStationManialinkUrl();
  string Title_BoxCaseManialinkUrl;
  void Title_ChooseBoxCaseManialinkUrl();
  void Title_ClearBoxCaseManialinkUrl();
  const wstring Title_Mod;
  void Title_ChooseMod();
  void Title_ClearMod();
  void Title_Test();
  const wstring Title_Hud3dFontFileName;
  const wstring TitleMenu_ReplayName;
  void TitleMenu_ChooseReplayName();
  void TitleMenu_ClearReplayName();
  const wstring TitleMenu_MusicName;
  void TitleMenu_ChooseMusicName();
  void TitleMenu_ClearMusicName();
  string TitleMenu_ManialinkUrl;
  void TitleMenu_ChooseManialinkUrl();
  void TitleMenu_ClearManialinkUrl();
  vec3 TitleMenu_Color;
  const wstring TitleEditor_MapType;
  void TitleEditor_ChooseMapType();
  void TitleEditor_ClearMapType();
  const wstring TitleEditor_SimpleEditorMap;
  void TitleEditor_ChooseSimpleEditorMap();
  void TitleEditor_ClearSimpleEditorMap();
  const wstring TitleSolo_Mode;
  void TitleSolo_ChooseMode();
  void TitleSolo_ClearMode();
  const wstring TitleSolo_CampaignName;
  void TitleSolo_ChooseCampaignName();
  void TitleSolo_ClearCampaignName();
  const wstring TitleSolo_PlaylistFileName;
  void TitleSolo_ChoosePlaylistFileName();
  void TitleSolo_ClearPlaylistFileName();
  int TitleSolo_Medals;
  const wstring TitleNet_Mode;
  void TitleNet_ChooseMode();
  void TitleNet_ClearMode();
  const wstring TitleNet_PlaylistFileName;
  void TitleNet_ChoosePlaylistFileName();
  void TitleNet_ClearPlaylistFileName();
  void OpenDialogChooseName_Yes();
  void OpenDialogChooseFolder_Yes();
};

// File extension: 'GamePodiumInfo.Gbx'
struct CGamePodiumInfo : public CMwNod {
  CGamePodiumInfo();

  const MwFastBuffer<CGameCtnMediaClip*> MediaClipFids;
};

struct CGameCtnMediaBlockBulletFx_Deprecated : public CGameCtnMediaBlock {
  CGameCtnMediaBlockBulletFx_Deprecated();

};

struct CGameCtnMediaBlockCharVis_Deprecated : public CGameCtnMediaBlock {
  CGameCtnMediaBlockCharVis_Deprecated();

};

struct CGamePlaygroundScriptXmlRpc : public CMwNod {
  const MwFastBuffer<CGamePlaygroundScriptXmlRpcEvent*> PendingEvents; // Maniascript
  void SendCallback(wstring Param1, wstring Param2); // Maniascript
  void SendCallbackArray(wstring Type, MwFastBuffer<wstring>& Data); // Maniascript
  void SendCallback_BeginRound(); // Maniascript
  void SendCallback_EndRound(); // Maniascript
};

// File extension: 'GameCtnMediaBlockColoringCapturable.gbx'
struct CGameCtnMediaBlockColoringCapturable : public CGameCtnMediaBlock {
  CGameCtnMediaBlockColoringCapturable();

  uint CapturableIndex;
};

// File extension: 'GameCtnMediaBlockFxCameraBlend.gbx'
struct CGameCtnMediaBlockFxCameraBlend : public CGameCtnMediaBlock {
  CGameCtnMediaBlockFxCameraBlend();

  float Intensity;
};

struct CGameCtnChallengeTrafficElemDesc : public CMwNod {
  CGameCtnChallengeTrafficElemDesc();

  MwId ElemId;
  MwId PathId;
  const string Name;
  CPlugTrafficObjectParams* Model;
  uint Faction;
  uint TimeOffset;
  CSystemPackDesc* PackDesc;
  MwId TrafficObjectId;
  MwId TrafficObjectAuthor;
  MwId TrafficObjectCollection;
};

// File extension: 'GameCoverFlow.Gbx'
struct CGameCoverFlowDesc : public CMwNod {
  CGameCoverFlowDesc();

  CScene3d* SceneFid;
  CPlugGameSkin* GameSkin;
  CSystemFidsFolder* GameSkinFolder;
  float TimeRemapped;
  CGameManialink3dStyle* Style;
  float SpeedChangeGroup;
  float SpeedZ;
  float TransitionRotateAngleDegPrev;
  float TransitionRotateAngleDegNext;
  const MwFastBuffer<CSceneLocationCamera*> CameraLocs;
  iso4 BoxesGroup_RelLoc;
  iso4 StationsGroup_HomeManialinkRelLoc;
  iso4 StationsGroup_MainRelLoc;
  iso4 StationsGroup_ListRelLoc;
  const string LinearSeparator0;
  float LinearOffsetX;
  float LinearOffsetY;
  float LinearOffsetZ;
  float LinearStepX;
  float LinearStepY;
  float LinearStepZ0;
  float LinearStepZ1;
  float LinearAngleMax0;
  float LinearAngleMax1;
  float LinearSpeedMove;
  float LinearSpeedFocus;
  float LinearBumpY;
  float LinearZoomDistance;
  uint LinearTransitionDuration0;
  uint LinearTransitionDuration1;
  uint LinearTransitionDuration2;
  const string GridSeparator0;
  float GridOffsetX;
  float GridOffsetY;
  float GridOffsetZ;
  float GridStepX;
  float GridStepY;
  float GridStepZ0;
  float GridStepZ1;
  float GridAngleMax0;
  float GridAngleMax1;
  float GridSpeedMove;
  float GridSpeedFocus;
  float GridBumpY;
  float GridZoomDistance;
  uint GridTransitionDuration0;
  uint GridTransitionDuration1;
  uint GridTransitionDuration2;
  const string FreeSeparator0;
  float FreeOffsetX;
  float FreeOffsetY;
  float FreeOffsetZ;
  float FreeStepX;
  float FreeStepY;
  float FreeStepZ0;
  float FreeStepZ1;
  float FreeAngleMax0;
  float FreeAngleMax1;
  float FreeSpeedMove;
  float FreeSpeedFocus;
  float FreeBumpY;
  float FreeZoomDistance;
  uint FreeTransitionDuration0;
  uint FreeTransitionDuration1;
  uint FreeTransitionDuration2;
  const string LinearSeparator1;
  CPlugSound* LinearSound_FocusGained;
  CPlugSound* LinearSound_FocusLoop;
  CPlugSound* LinearSound_FocusLost;
  CPlugSound* LinearSound_Select;
  CPlugSound* LinearSound_Edit;
  CPlugSound* LinearSound_Clear;
  CPlugSound* LinearSound_GroupEnter;
  CPlugSound* LinearSound_GroupLoop;
  CPlugSound* LinearSound_GroupLeave;
  CPlugSound* LinearSound_TransitionBump;
  CPlugSound* LinearSound_TransitionZoomIn;
  CPlugSound* LinearSound_TransitionZoomOut;
  const string GridSeparator1;
  CPlugSound* GridSound_FocusGained;
  CPlugSound* GridSound_FocusLoop;
  CPlugSound* GridSound_FocusLost;
  CPlugSound* GridSound_Select;
  CPlugSound* GridSound_Edit;
  CPlugSound* GridSound_Clear;
  CPlugSound* GridSound_GroupEnter;
  CPlugSound* GridSound_GroupLoop;
  CPlugSound* GridSound_GroupLeave;
  CPlugSound* GridSound_TransitionBump;
  CPlugSound* GridSound_TransitionZoomIn;
  CPlugSound* GridSound_TransitionZoomOut;
  const string FreeSeparator1;
  CPlugSound* FreeSound_FocusGained;
  CPlugSound* FreeSound_FocusLoop;
  CPlugSound* FreeSound_FocusLost;
  CPlugSound* FreeSound_Select;
  CPlugSound* FreeSound_Edit;
  CPlugSound* FreeSound_Clear;
  CPlugSound* FreeSound_GroupEnter;
  CPlugSound* FreeSound_GroupLoop;
  CPlugSound* FreeSound_GroupLeave;
  CPlugSound* FreeSound_TransitionBump;
  CPlugSound* FreeSound_TransitionZoomIn;
  CPlugSound* FreeSound_TransitionZoomOut;
};

struct CGamePlayerProfileChunk_ScriptPersistentTraits : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_ScriptPersistentTraits();

  CScriptTraitsPersistent* ScriptPersistentTraits;
};

struct CGamePlayerProfileCompatibilityChunk : public CMwNod {
  CGamePlayerProfileCompatibilityChunk();

  const uint ClassId;
  const string ChunkName;
  const string GameName;
  const string Checksum;
  const uint TimeStamp;
};

// File extension: 'GameCtnMediaBlockColoringBase.gbx'
struct CGameCtnMediaBlockColoringBase : public CGameCtnMediaBlock {
  CGameCtnMediaBlockColoringBase();

  uint BaseIndex;
};

struct CGameCtnMediaClipConfigScriptContext : public CMwNod {
  float SmShieldSizeScale; // Maniascript
};

struct CGamePlaygroundScriptXmlRpcEvent : public CMwNod {
  enum class CGamePlaygroundScriptXmlRpcEvent::EType {
    Unknown = 0,
    Callback = 1,
    CallbackArray = 2,
  };
  const CGamePlaygroundScriptXmlRpcEvent::EType Type; // Maniascript
  const wstring Param1; // Maniascript
  const wstring Param2; // Maniascript
  const wstring ParamArray1; // Maniascript
  const MwFastBuffer<wstring> ParamArray2; // Maniascript
};

// Description: "This is the Manialink browser interface."
struct CGameScriptHandlerBrowser : public CGameManialinkScriptHandler {
  enum class CGameScriptHandlerBrowser::EBuddyAction {
    Add = 0,
    Invite = 1,
    Remove = 2,
  };
  enum class CGameScriptHandlerBrowser::EBuddyResult {
    Ok = 0,
    Error = 1,
    NotFinished = 2,
  };
  CGameCtnChallenge* const CurMap; // Maniascript
  void ShowCurMapCard(); // Maniascript
  void BuddyDo(CGameScriptHandlerBrowser::EBuddyAction Action, string BuddyLogin, bool IsSilent); // Maniascript
  const CGameScriptHandlerBrowser::EBuddyResult BuddyDoResult; // Maniascript
  const wstring BuddyDoErrorMessage; // Maniascript
  CGameManiaAppBrowser* const ParentApp; // Maniascript
  const bool IsInBrowser; // Maniascript
  void BrowserBack(); // Maniascript
  void BrowserQuit(); // Maniascript
  void BrowserHome(); // Maniascript
  void BrowserReload(); // Maniascript
  wstring BrowserFocusedFrameId; // Maniascript
  void SetLocalUserClubLink(string ClubLink); // Maniascript
};

struct CGameCtnEditorBody : public CMwNod {
  void StartBodiesPreview();
  void StopBodiesPreview();
  void SwitchToGhostPathMode();
  void SwitchToStraightPathMode();
  void SwitchToRemoveMode();
  void SwitchToPathSpotsMode();
  void SwitchMarkersVisible();
  float BotSpeed;
  uint GhostSamplingPeriod;
  float ShootmanSpeed;
  void SweepPathsAndSave();
  string BotPathFrameTag;
  uint BotPathFrameOrder;
  uint BotPathFrameKind;
  bool BotPathFrameIsAutonomous;
};

struct CGameManialinkPlayerList : public CGameManialinkControl {
};

struct CGamePlayerProfileChunk_GlobalInterfaceSettings : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_GlobalInterfaceSettings();

  uint WarnUserForAvatars;
  bool EnableAvatars;
  bool EnableChat;
  bool OpenWebLinksInSteamOverlay;
  bool SynchonizeSteamWorkshopFiles;
  bool PreferSteamScreenshots;
};

struct CGameAnimSet : public CMwNod {
  CGameAnimSet();

  const string ZipName;
  CGameAnimClipNod* Idle;
  CGameAnimClipNod* RunF;
  CGameAnimClipNod* RunB;
  CGameAnimClipNod* TurnR_90;
  CGameAnimClipNod* TurnL_90;
  CGameAnimClipNod* Jump;
  CGameAnimClipNod* FrontFlip;
  CGameAnimClipNod* BackFlip;
  CGameAnimClipNod* Air;
  CGameAnimClipNod* AirToIdle;
  CGameAnimClipNod* AirToRunF;
  CGameAnimClipNod* AirToRunB;
  CGameAnimClipNod* Slide;
  CGameAnimClipNod* Glide;
  CGameAnimClipNod* SwimI;
  CGameAnimClipNod* SwimF;
  CGameAnimClipNod* SwimB;
  CGameAnimClipNod* SneakF;
  CGameAnimClipNod* SneakI;
  CGameAnimClipNod* SneakB;
  CGameAnimClipNod* Sneak_TurnR_90;
  CGameAnimClipNod* Sneak_TurnL_90;
  CGameAnimClipNod* Fire;
  CGameAnimClipNod* Gesture;
};

// Description: "Manager of buddies instant messaging."
struct CGameScriptBuddiesManager : public CMwNod {
  enum class CGameScriptBuddiesManager::EConnectionStatus {
    Offline = 0,
    Online = 1,
    Connecting = 2,
  };
  enum class CGameScriptBuddiesManager::EDesiredConnectionStatus {
    Offline = 0,
    Online = 1,
  };
  enum class CGameScriptBuddiesManager::EPresenceShow {
    Available = 0,
    WantToChat = 1,
    DoNotDisturb = 2,
    Away = 3,
    ExtendedAway = 4,
  };
  const MwFastBuffer<CGameScriptBuddy*> DebugBuddies;
  const CGameScriptBuddiesManager::EConnectionStatus CurrentConnectionStatus; // Maniascript
  CGameScriptBuddiesManager::EDesiredConnectionStatus DesiredConnectionStatus; // Maniascript
  const bool SteamIsEnabled; // Maniascript
  void SendMessage(CGameScriptBuddy* Buddy, string Type, wstring Body); // Maniascript
  void ChangePresence(CGameScriptBuddiesManager::EPresenceShow Show, wstring Status); // Maniascript
  void OpenSteamChat(CGameScriptBuddy* Buddy); // Maniascript
  const string CurrentServerLogin; // Maniascript
  const wstring CurrentServerName; // Maniascript
  const string CurrentServerJoinLink; // Maniascript
  const wstring CurrentServerModeName; // Maniascript
  const wstring CurrentServerModeStatus; // Maniascript
  const uint CurrentServerPlayerCount; // Maniascript
  const uint CurrentServerPlayerCountMax; // Maniascript
  const bool CurrentServer_IsFull; // Maniascript
  const bool CurrentServer_IsFullSpec; // Maniascript
  const bool CurrentServer_IsPrivate; // Maniascript
  const bool CurrentServer_IsPrivateSpec; // Maniascript
  const bool CurrentServer_IsHidden; // Maniascript
  const bool CurrentServer_IsLobby; // Maniascript
  const bool CurrentServer_IsRelay; // Maniascript
  const bool CurrentServer_IsFavourite; // Maniascript
  const bool CurrentServer_IsWarmUp; // Maniascript
  CGameScriptBuddy* GetBuddyFromLogin(string Login); // Maniascript
  wstring Filter_SearchText; // Maniascript
  bool Filter_PlayingOnline; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> Contacts; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> Buddies; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> FilteredBuddies; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> OnlineBuddies; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> PlayingOnlineBuddies; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> OfflineBuddies; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> XmppBuddies; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> XmppOnlineBuddies; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> XmppOfflineBuddies; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> SteamBuddies; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> SteamOnlineBuddies; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> SteamOfflineBuddies; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> IncomingBuddyRequests; // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> OutgoingBuddyRequests; // Maniascript
  const MwFastBuffer<CGameScriptBuddiesEvent*> PendingEvents; // Maniascript
  void AddBuddy(string Login); // Maniascript
  void RemoveBuddy(CGameScriptBuddy* Buddy); // Maniascript
  void AcceptBuddy(CGameScriptBuddy* Buddy); // Maniascript
  const MwFastBuffer<CGameScriptBuddy*> PendingRequestBuddies; // Maniascript
  void GetContactsVCards();
};

// Description: "A buddy from the buddy list."
struct CGameScriptBuddy : public CMwNod {
  enum class CGameScriptBuddy::ESubscriptionStatus {
    None = 0,
    RequestFrom = 1,
    RequestTo = 2,
    Both = 3,
  };
  enum class CGameScriptBuddy::EPresenceShow {
    Offline = 0,
    Available = 1,
    WantToChat = 2,
    DoNotDisturb = 3,
    Away = 4,
    ExtendedAway = 5,
  };
  const string BuddyId; // Maniascript
  const string Login; // Maniascript
  const wstring Name; // Maniascript
  const wstring Description; // Maniascript
  const wstring ZonePath; // Maniascript
  const CGameScriptBuddy::EPresenceShow PresenceShow; // Maniascript
  const wstring PresenceStatus; // Maniascript
  const CGameScriptBuddy::ESubscriptionStatus SubscriptionStatus; // Maniascript
  const bool IsXmpp; // Maniascript
  const bool IsSteam; // Maniascript
  const bool IsLegacy; // Maniascript
  const bool IsOnline; // Maniascript
  const bool IsOnlineInLegacy; // Maniascript
  const bool IsOnlineInXmpp; // Maniascript
  const bool IsOnlineInSteam; // Maniascript
  const bool IsBuddyInManiaPlanet; // Maniascript
  bool IsAlly; // Maniascript
  const string CurrentServerLogin; // Maniascript
  const wstring CurrentServerName; // Maniascript
  const string CurrentServerJoinLink; // Maniascript
  const wstring CurrentServerModeName; // Maniascript
  const wstring CurrentServerModeStatus; // Maniascript
  const uint CurrentServerPlayerCount; // Maniascript
  const uint CurrentServerPlayerCountMax; // Maniascript
  const bool CurrentServer_IsFull; // Maniascript
  const bool CurrentServer_IsFullSpec; // Maniascript
  const bool CurrentServer_IsPrivate; // Maniascript
  const bool CurrentServer_IsPrivateSpec; // Maniascript
  const bool CurrentServer_IsHidden; // Maniascript
  const bool CurrentServer_IsLobby; // Maniascript
  const bool CurrentServer_IsRelay; // Maniascript
  const bool CurrentServer_IsFavourite; // Maniascript
  const bool CurrentServer_IsWarmUp; // Maniascript
  void NotifyInteraction(); // Maniascript
};

// Description: "Event from the BuddiesManager."
struct CGameScriptBuddiesEvent : public CMwNod {
  enum class CGameScriptBuddiesEvent::EType {
    Message = 0,
    PresenceChange = 1,
    BuddyChange = 2,
    AddBuddyResult = 3,
    RemoveBuddyResult = 4,
    ConnectionStatusUpdate = 5,
  };
  enum class CGameScriptBuddiesEvent::ESubscriptionStatus {
    None = 0,
    RequestFrom = 1,
    RequestTo = 2,
    Both = 3,
  };
  enum class CGameScriptBuddiesEvent::EPresenceShow {
    Offline = 0,
    Available = 1,
    WantToChat = 2,
    DoNotDisturb = 3,
    Away = 4,
    ExtendedAway = 5,
  };
  const CGameScriptBuddiesEvent::EType Type; // Maniascript
  CGameScriptBuddy* const Sender; // Maniascript
  const string SenderResource; // Maniascript
  const string MessageType; // Maniascript
  const wstring MessageBody; // Maniascript
  CGameScriptBuddy* const Buddy; // Maniascript
  const bool PreviousIsOnline; // Maniascript
  const CGameScriptBuddiesEvent::EPresenceShow PreviousShow; // Maniascript
  const wstring PreviousStatus; // Maniascript
  const string PreviousServerLogin; // Maniascript
  const wstring PreviousServerName; // Maniascript
  const string PreviousServerJoinLink; // Maniascript
  const wstring PreviousServerModeName; // Maniascript
  const wstring PreviousServerModeStatus; // Maniascript
  const uint PreviousServerPlayerCount; // Maniascript
  const uint PreviousServerPlayerCountMax; // Maniascript
  const wstring PreviousSubscriptionStatus; // Maniascript
  const wstring PreviousNickname; // Maniascript
  const wstring PreviousDescription; // Maniascript
  const string BuddyLogin; // Maniascript
  const bool Success; // Maniascript
  const wstring ErrorMessage; // Maniascript
};

struct CGameManialink3dMood : public CMwNod {
  CGameManialink3dMood();

  vec3 LAmbient_LinearRgb;
  vec3 LDir0_LinearRgb;
  float LDir0_Intens;
  float LDir0_DirTheta; // Range: 0 - 180
  float LDir0_DirPhi; // Range: -180 - 180
  vec3 LDir1_LinearRgb;
  float LDir1_Intens;
  float LDir1_DirTheta; // Range: 0 - 180
  float LDir1_DirPhi; // Range: -180 - 180
  vec3 LBall_LinearRgb;
  float LBall_Intens;
  float LBall_Radius;
  vec3 CloudsRgbMinSrgb;
  float CloudsRgbMinScale;
  vec3 CloudsRgbMaxSrgb;
  float CloudsRgbMaxScale;
  vec3 FogColorSrgb;
  float SkyGradientV_Scale;
  CPlugFileImg* FidImageSkyGradientV;
  vec3 SelfIllumColor;
};

struct CGameManialink3dWorld : public CMwNod {
  CGameManialink3dWorld();

  CGameManialink3dStyle* Style;
};

struct CGamePlayerProfileChunk_ManiaPlanetStations : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_ManiaPlanetStations();

  bool IsFirstLaunch;
  bool HasSeenWelcomePage;
  MwId LatestTitleIdLoaded;
  uint StationsCount;
};

struct CGameManialink3dStyle : public CMwNod {
  CGameManialink3dStyle();

  CGameManialink3dMood* Mood;
};

// Description: "API for Maniaplanet plugins."
struct CGameManiaplanetPlugin : public CGameManiaApp {
  enum class CGameManiaplanetPlugin::EContext {
    MenuStartUp = 0,
    MenuManiaPlanet = 1,
    MenuManiaTitleMain = 2,
    MenuProfile = 3,
    MenuSolo = 4,
    MenuLocal = 5,
    MenuMulti = 6,
    MenuCompetitions = 7,
    MenuEditors = 8,
    EditorPainter = 9,
    EditorTrack = 10,
    EditorMediaTracker = 11,
    Solo = 12,
    SoloLoadScreen = 13,
    Multi = 14,
    MultiLoadScreen = 15,
    MenuCustom = 16,
    Unknown = 17,
  };
  enum class CGameManiaplanetPlugin::EBuyTitleMode {
    OpenStore = 0,
    BuyIfNeeded = 1,
    Ask = 2,
  };
  enum class CGameManiaplanetPlugin::EUISound {
    Alert = 0,
    ShowDialog = 1,
    HideDialog = 2,
  };
  const MwFastBuffer<CGameManiaAppScriptEvent*> PendingEvents; // Maniascript
  const MwFastBuffer<CGameManiaTitle*> TitlesAvailable; // Maniascript
  const MwFastBuffer<CGameManiaTitle*> TitlesBases; // Maniascript
  const MwFastBuffer<string> TitleIdsInstalled; // Maniascript
  const MwFastBuffer<string> TitleIdsPayed; // Maniascript
  const uint CurrentAppId; // Maniascript
  const string CurrentServerLogin; // Maniascript
  const wstring CurrentServerName; // Maniascript
  const wstring CurrentServerModeName; // Maniascript
  const string CurrentServerJoinLink; // Maniascript
  const MwFastBuffer<CGamePlayerInfo*> CurrentServerPlayers; // Maniascript
  CGameCtnChallenge* const CurrentMap; // Maniascript
  const CGameManiaplanetPlugin::EContext ActiveContext; // Maniascript
  const string ActiveContext_MenuFrame; // Maniascript
  const string ActiveContext_DialogFrame; // Maniascript
  const string ActiveContext_SystemDialogFrame; // Maniascript
  const bool ActiveContext_ClassicDialogDisplayed; // Maniascript
  const uint ActiveContext_GameWill; // Maniascript
  const bool ActiveContext_ManialinkBrowserDisplayed; // Maniascript
  bool PrivateSession; // Maniascript
  CGameScriptBuddiesManager* const BuddiesManager; // Maniascript
  CGamePlaygroundClientScriptAPI* const Playground; // Maniascript
  CGameManiaPlanetScriptAPI* const ManiaPlanet; // Maniascript
  CGameAchievementScriptManager* const AchievementsManager; // Maniascript
  CGameScriptNotificationsProducer* const NotificationsProducer; // Maniascript
  CGameScriptNotificationsConsumer* const Notifications; // Maniascript
  CGameMasterServerOnlineSignalsManager* const OnlineSignalsManager; // Maniascript
  bool ToolBarForceShow; // Maniascript
  const bool ToolBarIsActive; // Maniascript
  bool ToolBarClockVisible; // Maniascript
  bool ToolBarPlanetsVisible; // Maniascript
  float MusicVolume; // Range: 0 - 1 // Maniascript
  void HackSetCurMenuControlVisible(string ControlId, bool Visible); // Maniascript
  bool HackIsCurMenuControlVisible(string ControlId); // Maniascript
  bool RequestStartUpFreeze; // Maniascript
  void ClipboardSet(wstring ClipboardText); // Maniascript
  void QuitGameAndOpenLink(string Url); // Maniascript
  void ShowTitle(string TitleId, bool ShowStation); // Maniascript
  void EnterTitle(string TitleId); // Maniascript
  void ShowCurMapCard(); // Maniascript
  CGameDialogs* const SystemDialogs; // Maniascript
  void Dialog_EnterGameKey(); // Maniascript
  void Dialog_BuyTitleDialog(string TitleId, string OverrideBuyUrl, int OverrideActionAfterBuy); // Maniascript
  void Dialog_BuyTitleEx(string TitleId, CGameManiaplanetPlugin::EBuyTitleMode Mode, string OverrideBuyUrl, int OverrideActionAfterBuy); // Maniascript
  void Dialog_GenerateGameKeys(string TitleId, uint FeaturesLevel, uint NbToGenerate, bool AddBuddyOnRegistration); // Maniascript
  const bool Dialog_IsFinished; // Maniascript
  const bool Dialog_Success; // Maniascript
  const bool Dialog_Aborted; // Maniascript
  const bool UseAllies; // Maniascript
  const uint TotalTimePlay; // Maniascript
  bool LoadingScreenRequireKeyPressed; // Maniascript
  void SetLocalUserClubLink(string ClubLink); // Maniascript
  void SetLocalUserNickName(wstring NickName); // Maniascript
  void FlashWindow(); // Maniascript
  const uint Messenger_MessagesCount; // Maniascript
  void PlaySound(CGameManiaplanetPlugin::EUISound Sound, uint SoundVariant); // Maniascript
  CGameManiaplanetPluginInterface* const Interface;
  void CustomEvent(wstring Type, MwFastBuffer<wstring>& Data); // Maniascript
  void ExternalCustomEvent(wstring Type, MwFastBuffer<wstring>& Data); // Maniascript
  void Dialog_ShowEnterGameKeyDialog();
  void Dialog_ShowBuyTitleDialog();
  void Dialog_ShowGenerateGameKeysDialog();
};

struct CGameCtnInterfaceViewer : public CMwNod {
  bool Hit;
  bool Elimination;
  uint Score;
};

struct CGameManialinkGauge : public CGameManialinkControl {
  string Style; // Maniascript
  void SetRatio(float NewRatio); // Maniascript
  void SetClan(uint NewClan); // Maniascript
  float Ratio; // Range: 0 - 1 // Maniascript
  float GradingRatio; // Range: 0 - 1 // Maniascript
  uint Clan; // Maniascript
  vec3 Color; // Maniascript
  bool DrawBackground; // Maniascript
  bool DrawBlockBackground; // Maniascript
  bool CenteredBar; // Maniascript
};

// File extension: 'GameCtnMediaBlockColorGrading.gbx'
struct CGameCtnMediaBlockColorGrading : public CGameCtnMediaBlock {
  CGameCtnMediaBlockColorGrading();

  CPlugFileImg* Image;
};

// Description: "API for plugins to get playground info."
struct CGamePlaygroundClientScriptAPI : public CMwNod {
  CGameCtnChallenge* const Map; // Maniascript
  const int GameTime; // Maniascript
  CGamePlayerInfo* const LocalUser; // Maniascript
  CGamePlaygroundUIConfig* const UI; // Maniascript
  CGameCtnNetServerInfo* const ServerInfo; // Maniascript
  const bool IsSpectator; // Maniascript
  const bool IsSpectatorClient; // Maniascript
  const bool UseClans; // Maniascript
  const bool UseForcedClans; // Maniascript
  const bool IsLoadingScreen; // Maniascript
  void QuitServer(bool Silent); // Maniascript
  void QuitServerAndSetResult(bool Silent, wstring Type, MwFastBuffer<wstring>& Data); // Maniascript
  void JoinTeam1(); // Maniascript
  void JoinTeam2(); // Maniascript
  const MwFastBuffer<CGameTeamProfile*> Teams; // Maniascript
  void RequestSpectatorClient(bool Spectator); // Maniascript
  void SetSpectateTarget(string Player); // Maniascript
  void ShowProfile(string Player); // Maniascript
  bool DisablePlayingStateTracking; // Maniascript
};

struct CGameCtnMediaBlockScenery : public CGameCtnMediaBlock {
  CGameCtnMediaBlockScenery();

};

struct CGameControlCameraVehicleInternal : public CGameControlCamera {
};

struct CGameMgrObjectVis : public CMwNod {
  const uint cObjectVis;
};

struct CGamePlaygroundResources : public CMwNod {
  const MwFastBuffer<CGameItemModel*> ItemLibAll;
  const MwFastBuffer<CSystemPackDesc*> ItemLibSkins;
  const MwFastBuffer<CGameObjectPhyModel*> PickUpPhyLib;
  const MwFastBuffer<CGameObjectVisModel*> PickUpVisLib;
  const MwFastBuffer<CPlugCharPhyModel*> CharPhyLib;
  CPlugAnimFile* const CinematicLib;
  const MwFastBuffer<CGameActionModel*> ActionsModels;
};

struct CGameMgrObjectPhy : public CMwNod {
};

struct CGameMgrActionFxVis : public CMwNod {
  const uint cActionFxVis;
};

struct CGameEditorAsset : public CGameCtnEditor {
};

struct CGameManialinkGraph : public CGameManialinkControl {
  vec2 CoordsMin; // Maniascript
  vec2 CoordsMax; // Maniascript
  CGameManialinkGraphCurve* AddCurve(); // Maniascript
  void RemoveCurve(CGameManialinkGraphCurve* Curve); // Maniascript
  MwFastBuffer<CGameManialinkGraphCurve*> Curves; // Maniascript
};

struct CGameManialinkGraphCurve : public CMwNod {
  MwFastBuffer<vec2> Points; // Maniascript
  vec3 Color; // Maniascript
  void SortPoints(); // Maniascript
  string Style; // Maniascript
  float Width; // Range: 0 - 50 // Maniascript
};

struct CGameCtnBlockInfoMobilLink : public CMwNod {
  CGameCtnBlockInfoMobilLink();

  MwId SocketId;
  CGameObjectPhyModel* PhyModel;
  CGameObjectVisModel* VisModel;
};

struct CGameManiaplanetPluginInterface : public CMwNod {
  const wstring Name; // Maniascript
  void CustomEvent(wstring Type, MwFastBuffer<wstring>& Data); // Maniascript
  const MwFastBuffer<CGameManiaplanetPluginInterfaceEvent*> PendingEvents; // Maniascript
};

struct CGameManiaplanetPluginInterfaceEvent : public CMwNod {
  enum class CGameManiaplanetPluginInterfaceEvent::EType {
    PluginCustomEvent = 0,
  };
  const CGameManiaplanetPluginInterfaceEvent::EType Type; // Maniascript
  const wstring EventType; // Maniascript
  const MwFastBuffer<wstring> EventData; // Maniascript
};

// File extension: 'GameCtnMediaBlockInterface.gbx'
struct CGameCtnMediaBlockInterface : public CGameCtnMediaBlock {
  CGameCtnMediaBlockInterface();

  const bool ShowInterface;
};

// File extension: 'GameCtnMediaBlockObject.gbx'
struct CGameCtnMediaBlockObject : public CGameCtnMediaBlock {
  CGameCtnMediaBlockObject();

  const bool ShowObjects;
};

struct CGameScriptCloudManager : public CMwNod {
};

struct CGameEditorBullet : public CMwNod {
  CPlugParticleEmitterModel* ParticleEmitterModel;
  CPlugBeamEmitterModel* BeamEmitterModel;
  CPlugBeamEmitterSubModel* BaseSubModel;
  float SubModelSphereRadMax;
  float SubModelSphereThickness;
  float SubModelViscosity;
  float SubModelFriction;
  float SubModelLength;
  float SubModelLengthVar;
  float SubModelRotation;
  float SubModelRotationVar;
  float SubModelLife;
  float SubModelLifeVar;
  float SubModelParticlesCount;
  float SubModelSize;
  float SubModelSizeSlider; // Range: 0 - 1
  float SubModelSizeVar;
  float SubModelSizeEndScale;
  float SubModelIntensVar;
  float SubModelIntens;
  float SubModelIntensSlider; // Range: 0 - 1
  float SubModelWeight;
  float SubModelPersistence;
  float SubModelEmitterCoef;
  float SubModelDiscMaxZ;
  float SubModelDiscVelRad;
  float SubModelDiscVelLong;
  float SubModelDiscRadMax;
  float SubModelDiscThickness;
  uint SubModelParticlesCountSplash;
  float SubModelLengthPitchMin;
  float SubModelLengthPitchMax;
  float SubModelIntensFadeIn;
  float SubModelIntensFadeOut;
  bool SubModelUseCustomColor;
  bool SubModelCameraSpace;
  string BulletName;
  float BulletScale;
  string BulletSubModelName;
  float BulletSpeed;
  float BulletMass;
  float BulletFluidFriction; // Range: 0 - 2
  float BulletHitboxRadius;
  float BulletLifeTime;
  float BulletLifeTimeAfterFirstImpact;
  wstring BulletPattern;
  bool BulletExplodeOnEndLife;
  uint BulletRebounds;
  bool BulletBounceOnTechWall;
  float BulletImpactBouncingN;
  float BulletImpactBouncingT;
  bool BulletIsHoming;
  float BulletHomingDist;
  float BulletHomingPeriod;
  float BulletHomingAngularSpeed;
  bool BulletShowPlayerExplosion;
  bool BulletShowDebris;
  bool BulletShowPlayerLaserExplosion;
  bool BulletShowLaserDebris;
  bool BulletLaserModifyFOV;
  bool BulletModifyFOV;
  uint PatternBulletCount;
  float PatternBulletRadius;
  float PatternBulletSpinSecond;
  float PatternBulletBlendDuration;
  uint NoPatternBulletCount;
  float NoPatternBulletDispersionAngle;
  float NoPatternBulletSpeedCoef;
  float PatternBulletMinApexTime;
  bool PatternBulletApexRegroup;
  bool PatternBulletRandomRotations;
  float BulletEDRResting;
  float BulletEDRFlying;
  float BulletBlowRadius;
  float BulletBlowStrength;
  float BulletBlowVerticalScale;
  float BulletDamageRadius;
  float BulletBlowAttenuation; // Range: 0 - 1
  uint BulletDamage;
  float BulletDamageAttenuation; // Range: 0 - 1
  bool BulletExplosionOnAllPlayers;
  bool BulletIsFlare;
  float BulletFlareAttractionRadius;
  float BulletFlareExplosionRadius;
  const wstring IsLaser;
  const wstring LaserType;
  float LaserUVScale;
  float LaserUSpeed;
  float LaserVSpeed;
  uint LaserCylinderSideCount;
  bool LaserBackface;
  uint LaserDuration;
  float LaserRadius;
  float LaserRadiusAtOneMeter0;
  float LaserRadiusAtOneMeter1;
  uint LaserDamage;
  uint HelixVerticesCountPerTurn;
  float HelixTurnLength;
  float HelixOutterRadius;
  float HelixInnerRadius;
  float HelixStartAngle;
  uint HelixMaxHelixCount;
  bool HelixClockWise;
  float DoubleHelixStartAngle;
  bool DoubleHelixClockWise;
  uint BWSNbRadialSubDiv;
  uint BWSNbVerticalSubDiv;
  uint BWSNbSpheresPerMeter;
  float BWSRadius;
  float BWSStartDistance;
  float BWSStepAngle;
  float BWSEndDistance;
  float BWSSpeed;
  uint BWCNbSubDiv;
  float BWCStepSize;
  float BWCOutterRadius;
  float BWCInnerRadius;
  float BWCHalfWidth;
  float BWCTimeStartFade;
  float BWCFadeSpeed;
  uint LightningcBeam;
  float LightningDistStep;
  float LightningMaxJitterDistPerStep;
  float LightningJitterRadius;
  float LightningLenMax;
  float LightningFadeTimeScale;
  float LightningFadeTimeOffset;
  float SoundParamVolume; // Range: 0 - 1
  void ParamModePoint();
  void ParamModeSphereFull();
  void ParamModeSphereEmpty();
  void ParamModeDisc();
  void ParamModeCircle();
  const MwFastBuffer<CPlugBulletModel*> BulletModels;
};

// File extension: 'GameCtnMediaBlockFog.gbx'
struct CGameCtnMediaBlockFog : public CGameCtnMediaBlock {
  CGameCtnMediaBlockFog();

  void SwitchOn();
};

struct CGameEditorActionScript : public CMwNod {
  wstring EditorActionScript;
  uint ScriptCooldown;
  float ScriptReloadTime;
  uint ScriptEnergyNbBullets;
  bool ScriptAdvancedMode;
  float ScriptEffectOffset;
  bool ScriptAnimOnPlayer;
  float ScriptAnimPosX;
  float ScriptAnimPosY;
  float ScriptAnimPosZ;
  float ScriptAnimDirX;
  float ScriptAnimDirY;
  float ScriptAnimDirZ;
  bool ScriptProjByPlayer;
  float ScriptProjPosX;
  float ScriptProjPosY;
  float ScriptProjPosZ;
  float ScriptProjDirX;
  float ScriptProjDirY;
  float ScriptProjDirZ;
  bool ScriptEffectIsArea;
  bool ScriptAoeIsArea;
  float ScriptBuffDuration;
  string ScriptBuffName;
  bool ScriptAoeOnPlayer;
  float ScriptAoePosX;
  float ScriptAoePosY;
  float ScriptAoePosZ;
  string ScriptAoeName;
  float ScriptAoeDuration;
  float ScriptAoeTickTime;
  uint ScriptAoeTickValue;
  float ScriptAoeRadius;
  bool ScriptAoeOnlyAllies;
  bool ScriptAoeOnlyEnemies;
  bool ScriptAoeAffectsOwner;
  string ScriptProjName;
};

struct CGameEditorItem : public CGameEditorAsset {
  void Exit();
  void FileOpen();
  void FileSaveAs();
  void FileNew();
  void Help();
  void SwitchFullScreen();
  void EditCapsuleTrigger();
  void EditDiscTrigger();
  void EditCylinderObjectTrigger();
  void EditTimeTrigger();
  void EditMeshTrigger();
  void EditCapsuleObjectTrigger();
  void CreateAABBShape();
  void CreateSphereShape();
  void CreateCylinderShape();
  void ImportResources();
  void CreateResources();
  void TriggerValidate();
  void SwitchActionMaker();
  void SwitchParticleModel();
  void SwitchVehicleEditor();
  void CenterCamera();
  void PrevInput();
  void NextInput();
  void PrevLinkedAction();
  void NextLinkedAction();
  void AddEmptyMesh();
  CGameCtnApp* const Game;
  float TimeTriggerPeriod;
  const string TriggerInput;
  const string LinkedAction;
  float SpritePosX;
  float SpritePosY;
  float SpritePosZ;
  float SpriteSize; // Range: 0 - 25
  bool SpriteIsFree;
  float ShapeAABBWidth;
  float ShapeAABBHeight;
  float ShapeAABBDepth;
  float ShapeSphereRadius;
  float ShapeCylinderHeight;
  float ShapeCylinderRadius;
  bool PlacementParamSwitchPivotManually;
  float PlacementParamFlyStep;
  float PlacementParamFlyOffset;
  float PlacementParamGridHorizontalSize;
  float PlacementParamGridHorizontalOffset;
  float PlacementParamGridVerticalSize;
  float PlacementParamGridVerticalOffset;
  float PlacementParamCubeSize;
  float PlacementParamCubeCenterX;
  float PlacementParamCubeCenterY;
  float PlacementParamCubeCenterZ;
  bool PlacementParamYawOnly;
  bool PlacementParamNotOnObject;
  bool PlacementParamAutoRotation;
  float PlacementParamPivotSnapDistance;
  CGameItemModel* ItemModel;
};

struct CGameManialinkMiniMap : public CGameManialinkControl {
  vec3 WorldPosition; // Maniascript
  vec2 MapPosition; // Maniascript
  float MapYaw; // Maniascript
  float ZoomFactor; // Range: 0.5 - 10 // Maniascript
  bool Underground; // Maniascript
  void Fog_SetAll(float Value); // Maniascript
  void Fog_ClearDisk(vec3 WorldCenter, float Radius, float FadeSize); // Maniascript
};

struct CGameMgrGatePhy : public CMwNod {
};

struct CGameMgrGateVis : public CMwNod {
  uint ArmorAnimTime;
  float ArmorAnimExp;
};

struct CGameEditorManialink : public CGameEditorBase {
  CGameEditorManialink();

  void ButExit();
  void ButAddQuad();
  void ButAddFrame();
  void ButAddFrameModel();
  void ButAddFrameInstance();
  void ButAddFormat();
  void ButAddLabel();
  void ButAddAudio();
  void ButAddEntry();
  void ButAddTextEdit();
  void ButAddFileEntry();
  void ButAddVideo();
  void ButAddGauge();
  void ButAddGraph();
  void ButDeleteTag();
  void ButLockControl();
  void ButUnlockControl();
  void ButIndent();
  void ButHelp();
  void ButAdvancedOptions();
  void ButUndo();
  void ButRedo();
  void ButToggleStyles();
  void ButTogglePreview();
  void ButReloadResources();
  void ButQuadImage();
  void ButQuadImageFocus();
  void ButQuadStyle();
  void ButTextStyle();
  void ButTextTextFont();
  void ButGaugeStyle();
  void ButMediaData();
  void OnTextFontChoosen();
  void OnMediaChoosen();
  void OnImageChoosen();
  void ButQuadColor();
  void ButTextColorColor();
  void ButBgColorColor();
  void ButColorHelperOk();
  void ButFocusAreaColor1Color();
  void ButFocusAreaColor2Color();
  void ButGaugeColorColor();
  void ButColorHelperCancel();
  wstring Params;
  wstring PosnX;
  wstring PosnY;
  wstring PosnZ;
  wstring Scale;
  wstring Rot;
  wstring Id;
  wstring Class;
  bool ButtonHidden;
  wstring SizenWidth;
  wstring SizenHeight;
  wstring Halign;
  wstring Valign;
  wstring FrameModelId;
  wstring ModelId;
  wstring Image;
  wstring ImageFocus;
  wstring Style;
  wstring Substyle;
  wstring Colorize;
  wstring ModulateColor;
  wstring KeepRatio;
  bool ButtonStyleSelected;
  bool ButtonAutoscale;
  bool ButtonAutoscaleFixedWidth;
  wstring StyleText;
  wstring TextColor;
  wstring TextSize;
  wstring TextFont;
  wstring FocusAreaColor1;
  wstring FocusAreaColor2;
  wstring Url;
  wstring Manialink;
  wstring Text;
  wstring TextId;
  wstring Action;
  wstring TextPrefix;
  wstring MaxLine;
  wstring Opacity;
  wstring LineSpacing;
  bool ButtonTextEmboss;
  bool ButtonTranslate;
  wstring Default;
  wstring Name;
  bool ButtonSelectText;
  wstring TextEditDefault;
  wstring TextEditMaxLine;
  bool ButtonShowLineNumbers;
  wstring TextFormat;
  wstring Data;
  wstring Volume;
  bool ButtonLooping;
  bool ButtonPlay;
  bool ButtonMusic;
  bool ButtonScriptEvents;
  wstring BgColor;
  bool ButtonAutoNewLine;
  wstring Folder;
  wstring Type;
  wstring Style3d;
  wstring Grading;
  wstring Ratio;
  wstring StyleGauge;
  wstring GaugeColor;
  wstring Clan;
  bool ButtonCentered;
  bool ButtonDrawBg;
  bool ButtonDrawBlockBg;
  void ButHalignNextInput();
  void ButHalignPrevInput();
  void ButValignNextInput();
  void ButValignPrevInput();
  void ButKeepRatioNextInput();
  void ButKeepRatioPrevInput();
  void ButClanNextInput();
  void ButClanPrevInput();
  void ButTypeNextInput();
  void ButTypePrevInput();
  void ButXmlTypeNextInput();
  void ButXmlTypePrevInput();
  void ButTextFormatNextInput();
  void ButTextFormatPrevInput();
  void ButActionNext();
  void ButActionPrev();
  void ButUIBaseChoose();
  void ButUIBaseUp();
  void ButUIBaseDown();
  void ButUIBaseDelete();
  void OnUIBaseChoosen();
  void ToggleScriptEditorSize();
  bool ButtonGrid;
  bool ButtonSnap;
  wstring Step;
  wstring RotationStep;
  float ColorHelperOpacity; // Range: 0 - 1
  CControlFrame* const FrameLayoutEditor;
};

struct CGameEditorBase : public CMwNod {
};

struct CGameEditorPropertyList : public CMwNod {
};

struct CGameEditorFileToolBar : public CMwNod {
};

// Description: "API for Maniaplanet client scripts."
struct CGameManiaApp : public CMwNod {
  enum class CGameManiaApp::ELinkType {
    ExternalBrowser = 0,
    ManialinkBrowser = 1,
  };
  enum class CGameManiaApp::EAnimManagerEasing {
    Linear = 0,
    QuadIn = 1,
    QuadOut = 2,
    QuadInOut = 3,
    CubicIn = 4,
    CubicOut = 5,
    CubicInOut = 6,
    QuartIn = 7,
    QuartOut = 8,
    QuartInOut = 9,
    QuintIn = 10,
    QuintOut = 11,
    QuintInOut = 12,
    SineIn = 13,
    SineOut = 14,
    SineInOut = 15,
    ExpIn = 16,
    ExpOut = 17,
    ExpInOut = 18,
    CircIn = 19,
    CircOut = 20,
    CircInOut = 21,
    BackIn = 22,
    BackOut = 23,
    BackInOut = 24,
    ElasticIn = 25,
    ElasticOut = 26,
    ElasticInOut = 27,
    ElasticIn2 = 28,
    ElasticOut2 = 29,
    ElasticInOut2 = 30,
    BounceIn = 31,
    BounceOut = 32,
    BounceInOut = 33,
  };
  enum class CGameManiaApp::ESystemPlatform {
    None = 0,
    Steam = 1,
    UPlay = 2,
    PS4 = 3,
    XBoxOne = 4,
  };
  enum class CGameManiaApp::ESystemSkuIdentifier {
    Unknown = 0,
    EU = 1,
    US = 2,
    JP = 3,
  };
  const string DbgUrl;
  const int Now; // Maniascript
  const bool IsVisible; // Maniascript
  const uint CurrentDate; // Maniascript
  const string CurrentLocalDateText; // Maniascript
  uint LayersDefaultManialinkVersion; // Maniascript
  CGamePlayerInfo* const LocalUser; // Maniascript
  CGameManiaTitle* const LoadedTitle; // Maniascript
  const CGameManiaApp::ESystemPlatform SystemPlatform; // Maniascript
  const CGameManiaApp::ESystemSkuIdentifier SystemSkuIdentifier; // Maniascript
  bool EnableMenuNavigationInputs; // Maniascript
  const float MouseX; // Maniascript
  const float MouseY; // Maniascript
  const MwFastBuffer<CGameUILayer*> UILayers; // Maniascript
  CGameUILayer* UILayerCreate(); // Maniascript
  void UILayerDestroy(CGameUILayer* Layer); // Maniascript
  void UILayerDestroyAll(); // Maniascript
  void LayerCustomEvent(CGameUILayer* Layer, wstring Type, MwFastBuffer<wstring>& Data); // Maniascript
  void OpenLink(string Url, CGameManiaApp::ELinkType LinkType); // Maniascript
  CXmlScriptManager* const Xml; // Maniascript
  CNetScriptHttpManager* const Http; // Maniascript
  CGameVideoScriptManager* const Video; // Maniascript
  CAudioScriptManager* const Audio; // Maniascript
  CInputScriptManager* const Input; // Maniascript
  CGameDataManagerScript* const DataMgr; // Maniascript
  CGameScoreAndLeaderBoardManagerScript* const ScoreMgr; // Maniascript
  CGameUserPrivilegesManagerScript* const PrivilegeMgr; // Maniascript
  CGameMasterServerRichPresenceManagerScript* const PresenceMgr; // Maniascript
  CGameUserManagerScript* const UserMgr; // Maniascript
  CGameManiaPlanetScriptAPI* const ManiaPlanet; // Maniascript
  CGamePluginInterfacesScript* const Plugins; // Maniascript
  wstring Dbg_DumpDeclareForVariables(CMwNod* Nod, bool StatsOnly); // Maniascript
};

struct CGameManiaAppScriptEvent : public CMwNod {
  enum class CGameManiaAppScriptEvent::EType {
    LayerCustomEvent = 0,
    KeyPress = 1,
    ExternalCustomEvent = 2,
    MenuNavigation = 3,
    ChildModuleEvent = 4,
    ParentModuleEvent = 5,
  };
  enum class CGameManiaAppScriptEvent::EMenuNavAction {
    Up = 0,
    Right = 1,
    Left = 2,
    Down = 3,
    Select = 4,
    Cancel = 5,
    PageUp = 6,
    PageDown = 7,
    AppMenu = 8,
    Action1 = 9,
    Action2 = 10,
  };
  const CGameManiaAppScriptEvent::EType Type; // Maniascript
  CGameUILayer* const CustomEventLayer; // Maniascript
  const wstring CustomEventType; // Maniascript
  const MwFastBuffer<wstring> CustomEventData; // Maniascript
  const wstring ExternalEventType; // Maniascript
  const MwFastBuffer<wstring> ExternalEventData; // Maniascript
  CGameManiaApp* const ChildModuleEventModule; // Maniascript
  const wstring ChildModuleEventType; // Maniascript
  const MwFastBuffer<wstring> ChildModuleEventData; // Maniascript
  const wstring ParentModuleEventType; // Maniascript
  const MwFastBuffer<wstring> ParentModuleEventData; // Maniascript
  const CGameManiaAppScriptEvent::EMenuNavAction MenuNavAction; // Maniascript
  const bool IsActionAutoRepeat; // Maniascript
  const uint KeyCode; // Maniascript
  const string KeyName; // Maniascript
};

// Description: "API for game interface client scripts"
struct CGameManiaAppPlaygroundCommon : public CGameManiaApp {
  const MwFastBuffer<CGameManiaAppPlaygroundScriptEvent*> PendingEvents; // Maniascript
  CGamePlaygroundClientScriptAPI* const Playground; // Maniascript
  CGameCtnChallenge* const Map; // Maniascript
  CGamePlaygroundUIConfig* UI; // Maniascript
  CGamePlaygroundUIConfig* ClientUI; // Maniascript
};

struct CGameManialinkCamera : public CGameManialinkControl {
};

struct CGameReplayObjectVisData : public CMwNod {
  CGameReplayObjectVisData();

};

struct CGameManiaAppTitle : public CGameManiaApp {
  const MwFastBuffer<CGameManiaAppScriptEvent*> PendingEvents; // Maniascript
  void Menu_Quit(); // Maniascript
  void Menu_Home(); // Maniascript
  void Menu_Solo(); // Maniascript
  void Menu_Competitions(); // Maniascript
  void Menu_Local(); // Maniascript
  void Menu_Internet(); // Maniascript
  void Menu_Editor(); // Maniascript
  void Menu_Profile(); // Maniascript
  void PlayMap(wstring Map); // Maniascript
  bool LoadingScreenRequireKeyPressed; // Maniascript
  bool DontScaleMainMenuForHMD; // Maniascript
  CGameManiaTitleFlowScriptAPI* const TitleFlow; // Maniascript
  CGameScriptNotificationsConsumer* const Notifications; // Maniascript
  const wstring ExternalRequest_Type; // Maniascript
  const MwFastBuffer<wstring> ExternalRequest_Data; // Maniascript
  void ExternalRequest_Clear(); // Maniascript
  CGameAchievementScriptManager* const AchievementsManager; // Maniascript
  CGameManagerBadgeScript* BadgeManager; // Maniascript
};

// File extension: 'GameCtnMediaBlockDecal2d.gbx'
struct CGameCtnMediaBlockDecal2d : public CGameCtnMediaBlock {
  CGameCtnMediaBlockDecal2d();

};

struct CGameCtnMediaBlockEditorDecal2d : public CGameCtnMediaBlockEditor {
  CGameCtnMediaBlockEditorDecal2d();

  void ChooseImage();
  const wstring ImgDiffuseA;
  float Depth; // Range: 0 - 5
  float Opacity; // Range: 0 - 1
  bool FlipU;
  bool ForcePreview;
  CPlugDecalModel* DecalModel;
  CControlFrame* Frame;
};

struct CGameManiaAppBrowser : public CGameManiaApp {
  const MwFastBuffer<CGameManiaAppScriptEvent*> PendingEvents; // Maniascript
  void BrowserBack(); // Maniascript
  void BrowserQuit(); // Maniascript
  void BrowserHome(); // Maniascript
  void BrowserReload(); // Maniascript
  wstring BrowserFocusedFrameId; // Maniascript
};

// Description: "API for titles menus to control the main loop."
struct CGameManiaTitleFlowScriptAPI : public CMwNod {
  enum class CGameManiaTitleFlowScriptAPI::ESplitScreenLayout {
    Horizontal = 0,
    Vertical = 1,
    Four = 2,
  };
  enum class CGameManiaTitleFlowScriptAPI::EResult {
    Success = 0,
    Error_Internal = 1,
    Error_DataMgr = 2,
    Error_Net_ServerNotFound = 3,
    Error_Net_ServerUnreachable = 4,
    Error_Net_Disconnected = 5,
    Error_Net_WrongPassword = 6,
    Error_Network_OnlineExpired = 7,
    Error_Network_ServerFull = 8,
  };
  const bool IsReady; // Maniascript
  const CGameManiaTitleFlowScriptAPI::EResult LatestResult; // Maniascript
  const wstring CustomResultType; // Maniascript
  const MwFastBuffer<wstring> CustomResultData; // Maniascript
  void PlayMap(wstring Map, wstring Mode, string SettingsXml); // Maniascript
  void PlayMapList(MwFastBuffer<wstring>& MapList, wstring Mode, string SettingsXml); // Maniascript
  void PlayPlaylist(wstring Playlist, wstring OverrideMode, string OverrideSettingsXml); // Maniascript
  void PlaySplitScreen(CGameManiaTitleFlowScriptAPI::ESplitScreenLayout LayoutType, MwFastBuffer<wstring>& MapList, wstring Mode, string SettingsXml); // Maniascript
  void PlayMultiOnSameScreen(CGameManiaTitleFlowScriptAPI::ESplitScreenLayout LayoutType, MwFastBuffer<wstring>& MapList, wstring Mode, string SettingsXml); // Maniascript
  void ViewReplay(wstring Replay); // Maniascript
  void EditMap(wstring Map, wstring EditorPluginScript, string EditorPluginArgument); // Maniascript
  void EditNewMap(string Environment, string Decoration, string ModUrl, string PlayerModel, wstring MapType, wstring EditorPluginScript, string EditorPluginArgument); // Maniascript
  void EditBadges(); // Maniascript
  void EditBadgesOld(MwId UserId DEPRECATED); // Maniascript
  CGameCtnNetServerInfo* const JoinServer_ServerInfo; // Maniascript
  void JoinServer_GetInfo(string ServerLogin); // Maniascript
  void JoinServer_GetInfoPwd(string ServerLogin, string ServerPassword); // Maniascript
  void JoinServer_Join(bool AsSpectator); // Maniascript
  void JoinServer_Abort(); // Maniascript
  void Quit(); // Maniascript
};

struct CGameManiaAppTitleLayerScriptHandler : public CGameManialinkScriptHandler {
  CGameManiaAppTitle* ParentApp; // Maniascript
  CGameManiaTitleFlowScriptAPI* const TitleFlow; // Maniascript
};

struct CGameCtnEditorPluginLayerScriptHandler : public CGameManialinkScriptHandler {
  CGameCtnEditorPlugin* const Editor; // Maniascript
};

// Description: "A Notification."
struct CGameScriptNotificationsConsumerNotification : public CMwNod {
  enum class CGameScriptNotificationsConsumerNotification::ENotificationPriority {
    Memo = 0,
    Notice = 1,
    Alarm = 2,
  };
  const wstring Title; // Maniascript
  const wstring Description; // Maniascript
  const wstring ImageUrl; // Maniascript
  const CGameScriptNotificationsConsumerNotification::ENotificationPriority Priority; // Maniascript
  const bool HasBeenRead; // Maniascript
  const bool HasBeenActivated; // Maniascript
  void SetRead(); // Maniascript
  void SetActivated(); // Maniascript
};

// Description: "Notifications Producing manager."
struct CGameScriptNotificationsProducer : public CMwNod {
  enum class CGameScriptNotificationsProducer::ENotificationLifeSpan {
    Game = 0,
    Session = 1,
    NeverEnding = 2,
  };
  enum class CGameScriptNotificationsProducer::ENotificationPriority {
    Memo = 0,
    Notice = 1,
    Alarm = 2,
  };
  const MwFastBuffer<CGameScriptNotificationsProducerEvent*> Events; // Maniascript
  void SendNotification(MwFastBuffer<wstring>& CallbackParams, wstring Title, wstring Description, wstring ImageUrl, CGameScriptNotificationsProducer::ENotificationLifeSpan LifeSpan, CGameScriptNotificationsProducer::ENotificationPriority Priority); // Maniascript
};

// Description: "Manager of buddies instant messaging."
struct CGameScriptNotificationsConsumer : public CMwNod {
  enum class CGameScriptNotificationsConsumer::EFilterPriority {
    All = 0,
    MoreThanMemo = 1,
    MoreThanNotice = 2,
  };
  const MwFastBuffer<CGameScriptNotificationsConsumerEvent*> Events; // Maniascript
  const MwFastBuffer<CGameScriptNotificationsConsumerNotification*> Notifications; // Maniascript
  const MwFastBuffer<CGameScriptNotificationsConsumerNotification*> FilteredNotifications; // Maniascript
  CGameScriptNotificationsConsumer::EFilterPriority Filter_Priority; // Maniascript
};

// Description: "An event."
struct CGameScriptNotificationsProducerEvent : public CMwNod {
  enum class CGameScriptNotificationsProducerEvent::EType {
    NotificationHasBeenActivated = 0,
  };
  const CGameScriptNotificationsProducerEvent::EType Type; // Maniascript
};

// Description: "An event."
struct CGameScriptNotificationsConsumerEvent : public CMwNod {
  enum class CGameScriptNotificationsConsumerEvent::EType {
    NewNotification = 0,
    NotificationChanged = 1,
  };
  const CGameScriptNotificationsConsumerEvent::EType Type; // Maniascript
  CGameScriptNotificationsConsumerNotification* const Notification; // Maniascript
};

// Description: "Script API to manage user data."
struct CGameDataManagerScript : public CMwNod {
  enum class CGameDataManagerScript::EFileType {
    Map = 0,
    Ghost = 1,
  };
  enum class CGameDataManagerScript::EResult {
    NotStarted = 0,
    Running = 1,
    Cancelled = 2,
    Finished_Ok = 3,
    Error_MountRead = 4,
    Error_MountWrite = 5,
    Error_Delete = 6,
    Error_NoUserRecords = 7,
    Error_NoUserDataCache = 8,
    Error_MasterServer = 9,
    Error_FindOrAddFid = 10,
    Error_DownloadPackDesc = 11,
    Error_LoadFromFid = 12,
    Error_FidNotLoadable = 13,
    Error_BadFileType = 14,
    Error_MedalGhostReplayFidNotFound = 15,
    Error_MedalGhostNotFoundOnReplay = 16,
    Error_SaveUserRecordsToFid = 17,
    Error_FindFid = 18,
    Error_SaveToFid = 19,
    Error_UrlNotReachable = 20,
    Error_EmptyUrl = 21,
    Error_Internal = 22,
    Error_NotEnoughSpace = 23,
  };
  const MwFastBuffer<CGameCtnChallengeInfo*> Maps; // Maniascript
  const MwFastBuffer<CGameHighScore*> Records; // Maniascript
  const MwFastBuffer<CGameGhostScript*> Ghosts; // Maniascript
  const bool HasFreeSpaceForNewMap; // Maniascript
  CPlugBitmap* const MapThumbnail; // Maniascript
  void MapFilterClear(); // Maniascript
  string MapFilterStartWithPath; // Maniascript
  void DeleteFile(wstring FileName); // Maniascript
  void RetrieveNewFileName(MwId UserId, string SlotName, CGameDataManagerScript::EFileType FileType); // Maniascript
  void GetNewMapEditionId(MwId UserId, uint MinEditionId); // Maniascript
  void RetrieveMapFileNameFromEditionId(MwId UserId, wstring FileName); // Maniascript
  void RetrieveUserFiles(MwId UserId, string SlotName, CGameDataManagerScript::EFileType FileType); // Maniascript
  void RetrieveGameFiles(CGameDataManagerScript::EFileType FileType); // Maniascript
  void RetrieveOrderedCampaignMaps(); // Maniascript
  void ClearFileList(); // Maniascript
  void LoadMapThumbnail(uint MapIndex); // Maniascript
  void UploadUserFile(string PostUrl, wstring MapName, string Metadata); // Maniascript
  void UploadUserFile2(string PostUrl, wstring MapName, string Metadata, string AdditionalHeaders); // Maniascript
  void QueryHasFreeSpaceForNewMap(MwId UserId); // Maniascript
  void RetrieveRecords(CGameCtnChallengeInfo* MapInfo, MwId UserId); // Maniascript
  void RetrieveRecordsNoMedals(string MapUid, MwId UserId); // Maniascript
  void StoreRecord(string MapUid, MwId UserId, CGameGhostScript* Ghost); // Maniascript
  void StoreRecordName(string MapUid, MwId UserId, CGameGhostScript* Ghost, string GhostName); // Maniascript
  CGameGhostScript* GhostRetrieve(string GhostUrl); // Maniascript
  CGameGhostScript* GhostRetrieveFromPlayer(CGamePlayer* GamePlayer); // Maniascript
  CGameGhostScript* GhostRetrieveFromTaskResult(CWebServicesTaskResult_GhostHandle* TaskResult); // Maniascript
  void GhostDestroy(CGameGhostScript* Ghost); // Maniascript
  const bool Ready; // Maniascript
  const bool DoNotSwitchOff; // Maniascript
  const CGameDataManagerScript::EResult LatestResult; // Maniascript
  const MwId MenuUserId; // Maniascript
  const wstring NewFileName; // Maniascript
  const uint MinEditionId; // Maniascript
  const wstring MapFileNameFromEditionId; // Maniascript
  vec3 GetColorForUserId(MwId UserId); // Maniascript
};

// Description: "Manialink entry."
struct CGameManialinkTextEdit : public CGameManialinkControl {
  enum class CGameManialinkTextEdit::EControlScriptEditorTextFormat {
    Basic = 0,
    Script = 1,
    Password = 2,
    Newpassword = 3,
  };
  wstring Value; // Maniascript
  void StartEdition(); // Maniascript
  int MaxLine; // Maniascript
  bool AutoNewLine; // Maniascript
  bool ShowLineNumbers; // Maniascript
  float LineSpacing; // Maniascript
  const uint ValueLineCount; // Maniascript
  float Opacity; // Maniascript
  vec3 TextColor; // Maniascript
  float TextSizeReal; // Maniascript
  uint TextSize; // Maniascript
  CGameManialinkTextEdit::EControlScriptEditorTextFormat TextFormat; // Maniascript
};

struct CGameUserFileList : public CMwNod {
  CGameUserFileList();

};

struct CGameManialinkStylesheet : public CMwNod {
  CGameManialinkStylesheet();

};

struct CGameMasterServerOnlineSignalsManager : public CMwNod {
  const MwFastBuffer<CGameMasterServerUserOnlineSignals*> UsersOnlineSignals; // Maniascript
  CGameMasterServerUserOnlineSignals* GetUserOnlineSignals(MwId UserId); // Maniascript
};

struct CGameMasterServerOnlineSignal : public CMwNod {
  const uint OnlineSignalId; // Maniascript
  const string SenderLogin; // Maniascript
  const string SenderDisplayName; // Maniascript
  const uint TimeStamp; // Maniascript
};

struct CGameMasterServerOnlineSignal_RecordBeaten : public CGameMasterServerOnlineSignal {
  const string BeatenLogin; // Maniascript
  const wstring BeatenDisplayName; // Maniascript
  const string ChallengeUid; // Maniascript
  const wstring ChallengeName; // Maniascript
  const uint RecordScore; // Maniascript
  const uint RecordScoreBeaten; // Maniascript
};

struct CGameManiaAppMinimal : public CGameManiaApp {
  const MwFastBuffer<CGameManiaAppScriptEvent*> PendingEvents; // Maniascript
};

struct CGameVideoScriptManager : public CMwNod {
  CGameVideoScriptVideo* CreateVideo(string Url, bool IsLooping, bool AutoProcessing); // Maniascript
  void DestroyVideo(CGameVideoScriptVideo* Video); // Maniascript
  const MwFastBuffer<CGameVideoScriptVideo*> Videos; // Maniascript
};

struct CGameGhostScript : public CMwNod {
  enum class CGameGhostScript::EDataState {
    Ready = 0,
    InProgress = 1,
    Error = 2,
  };
  const CGameGhostScript::EDataState DataState; // Maniascript
  CTmRaceResultNod* const RaceResult; // Maniascript
  wstring Nickname; // Maniascript
};

struct CTmRaceResultNod : public CMwNod {
  enum class CTmRaceResultNod::ETmRaceResultCriteria {
    Time = 0,
    Stunts = 1,
    NbRespawns = 2,
    CheckpointsProgress = 3,
    None = 4,
  };
  int Time; // Maniascript
  int StuntsScore; // Maniascript
  int NbRespawns; // Maniascript
  MwFastBuffer<int> Checkpoints; // Maniascript
  int Compare(CTmRaceResultNod* Other, CTmRaceResultNod::ETmRaceResultCriteria Criteria); // Maniascript
};

struct CGameEditorModule : public CGameCtnEditor {
  void Exit();
  void FileNew();
  void FileOpen();
  void FileSave();
  void FileSaveAs();
  void SwitchToPreview();
  void SwitchFromPreview();
  void AdvancedParameters();
  void CustomMode();
  void ActionIsPowerup();
  void SwitchInterfaceDesigner();
  CGameCtnApp* const Game;
  CGameModuleModel* ModuleModel;
  void EditHudModule_OnBack();
  void EditStoreAction_OnBack();
  void EditStoreItem_OnBack();
  void EditScoresTableColumn_OnBack();
  void EditMenuSubMenu_OnBack();
  void EditMenuComponent_OnBack();
  void EditMenuAdvancedComponent_OnBack();
  void EditScoresTableColumn_OnNextTextHalign();
  void EditScoresTableColumn_OnPrevTextHalign();
  void EditMenuLadderRankings_OnNextMode();
  void EditMenuLadderRankings_OnPrevMode();
  float EditHudModulePosX;
  float EditHudModulePosY;
  float EditHudModuleZIndex;
  float EditHudModuleScale;
  string EditActionName;
  string EditActionDesc;
  uint EditActionMaxLevel;
  uint EditActionPrice;
  uint EditActionPrice1;
  uint EditActionPrice2;
  uint EditActionPrice3;
  uint EditActionPrice4;
  uint EditActionPrice5;
  string EditItemName;
  string EditItemDesc;
  uint EditItemPrice;
  string EditColumnName;
  string EditColumnDefaultValue;
  float EditColumnWidth;
  string EditColumnTextStyle;
  float EditColumnTextSize;
  wstring EditSubMenuName;
  string EditMenuAdvancedComponentName;
  float EditMenuAdvancedComponentPosX;
  float EditMenuAdvancedComponentPosY;
  float EditMenuAdvancedComponentScale;
  string EditMenuComponentName;
  float EditMenuComponentPosX;
  float EditMenuComponentPosY;
  float EditMenuComponentScale;
  float EditLadderRankingsSizeX;
  float EditLadderRankingsSizeY;
  string EditLadderRankingsTitle;
  float EditServerBrowserSizeX;
  float EditServerBrowserSizeY;
  uint EditServerBrowserLineCount;
  uint EditServerBrowserColumnCount;
  uint EditMenuBrowserItemsLineCount;
  uint EditMenuBrowserItemsColumnCount;
  uint EditMenuBrowserFoldersLineCount;
  uint EditMenuBrowserFoldersColumnCount;
};

struct CGameMgrItem : public CMwNod {
};

struct CGameHighScoreList : public CMwNod {
  const MwFastBuffer<CGameHighScore*> HighScores; // Maniascript
  const bool IsReady; // Maniascript
  const bool ErrorOccured; // Maniascript
};

// Description: "Manager of achievements."
struct CGameAchievementScriptManager : public CMwNod {
  const MwFastBuffer<CGameAchievementScriptEvent*> PendingEvents; // Maniascript
  const MwFastBuffer<CGameAchievementScriptAchievement*> Achievements; // Maniascript
  const MwFastBuffer<CGameAchievementScriptStat*> Stats; // Maniascript
  const MwFastBuffer<CGameAchievementScriptAchievementDesc*> AchievementDescriptions; // Maniascript
  const MwFastBuffer<CGameAchievementScriptStatDesc*> StatDescriptions; // Maniascript
  void SendEvent(MwId UserId, string Mnemo, MwFastBuffer<int>& Params); // Maniascript
  CWebServicesTaskResult* MasterServer_UplayCompleteAction(MwId UserId, string ActionId); // Maniascript
  CWebServicesTaskResult* MasterServer_UplayCompleteActions(MwId UserId, MwFastBuffer<wstring>& ActionIds); // Maniascript
  CGameAchievementScriptUplayAction* MasterServer_GetUplayAction(MwId UserId, string ActionId); // Maniascript
  bool MasterServer_IsUplayActionCompleted(MwId UserId, string ActionId); // Maniascript
  CWebServicesTaskResult* MasterServer_UplayPurchaseReward(MwId UserId, string RewardId); // Maniascript
  bool MasterServer_IsUplayRewardPurchased(MwId UserId, string RewardId); // Maniascript
  const MwFastBuffer<CWebServicesTaskResult*> MasterServer_MSTaskResults; // Maniascript
  void MasterServer_ReleaseMSTaskResult(MwId TaskId); // Maniascript
  const MwFastBuffer<CGameAchievementScriptUplayAction*> MasterServer_UplayActions; // Maniascript
};

// Description: "Event concerning achievements."
struct CGameAchievementScriptEvent : public CMwNod {
  enum class CGameAchievementScriptEvent::EType {
    NewAchievement = 0,
  };
  const CGameAchievementScriptEvent::EType Type; // Maniascript
  CGameAchievementScriptAchievement* const Achievement; // Maniascript
};

// Description: "An achievement earned by a user."
struct CGameAchievementScriptAchievement : public CMwNod {
  const MwId UserId; // Maniascript
  CGameAchievementScriptAchievementDesc* const AchievementDesc; // Maniascript
};

// Description: "Achievement stat."
struct CGameAchievementScriptStat : public CMwNod {
  const MwId UserId; // Maniascript
  CGameAchievementScriptStatDesc* const StatDesc; // Maniascript
  const uint Value; // Maniascript
};

struct CGamePlaygroundModuleClientInventory : public CGamePlaygroundModuleClient {
  CGameUILayer* const InventoryLayer; // Maniascript
};

struct CGamePlaygroundModuleClientScoresTable : public CGamePlaygroundModuleClient {
};

struct CGamePlaygroundModuleManagerClient : public CMwNod {
};

struct CGameManiaAppPlaygroundScriptEvent : public CGameManiaAppScriptEvent {
  enum class CGameManiaAppPlaygroundScriptEvent::EType {
    LayerCustomEvent = 0,
    KeyPress = 1,
    MenuNavigation = 3,
    ChildModuleEvent = 4,
    ParentModuleEvent = 5,
    PlaygroundScriptEvent = 6,
  };
  const wstring PlaygroundScriptEventType; // Maniascript
  const MwFastBuffer<wstring> PlaygroundScriptEventData; // Maniascript
};

struct CGameBadgeScript : public CMwNod {
  vec3 PrimaryColor; // Maniascript
  wstring SkinName; // Maniascript
  wstring StickerSlot_Get(string Slot); // Maniascript
  void StickerSlot_Set(string Slot, wstring Sticker); // Maniascript
  void StickerSlot_Clear(); // Maniascript
  MwFastBuffer<wstring> Layers; // Maniascript
};

struct CGameUserProfile : public CMwNod {
  CGameUserProfile();

  wstring SkinName; // Maniascript
  vec3 PrimaryColor; // Maniascript
  UnnamedEnum CamName;
};

struct CGameUIAnimManager : public CMwNod {
};

// File extension: 'CtrlCamTmRace3.gbx'
struct CGameControlCameraTrackManiaRace3 : public CGameControlCameraTarget {
  CGameControlCameraTrackManiaRace3();

  CPlugVehicleCameraRace3Model* Model;
};

// File extension: 'CtrlCamTmRace2.gbx'
struct CGameControlCameraTrackManiaRace2 : public CGameControlCameraTarget {
  CGameControlCameraTrackManiaRace2();

  CPlugVehicleCameraRace2Model* const Model;
};

struct CGameEditorBadge : public CGameEditorBase {
  CGameEditorBadgeScript* const ScriptAPI;
  uint DisplayTextureSize_Log2; // Range: 6 - 12
};

struct CGameEditorBadgeScript : public CGameManiaAppMinimal {
  CGameEditorBadge* const Game;
  void Leave(); // Maniascript
  CGameBadgeScript* DisplayCurrentBadge; // Maniascript
  vec2 DisplayPosN; // Maniascript
  vec2 DisplaySize; // Maniascript
  float DisplayFoV; // Maniascript
  float CameraTransitionDuration; // Range: 0.1 - 10 // Maniascript
  float MeshRotation_MaxSpeed; // Range: -10 - 10 // Maniascript
  float MeshRotation_Acceleration; // Range: 0.1 - 10 // Maniascript
  MwId DisplayCurrentMeshId; // Maniascript
  const MwFastBuffer<MwId> MeshIds; // Maniascript
  void MeshId_Next(); // Maniascript
  void MeshId_Previous(); // Maniascript
  const MwFastBuffer<CGameBadgeScript*> Badges; // Maniascript
  CGameBadgeScript* BadgeCreate(); // Maniascript
  void BadgeDestroy(CGameBadgeScript* Badge); // Maniascript
  void BadgeCopy(CGameBadgeScript* Source, CGameBadgeScript* Destination); // Maniascript
  void BadgeReadFromProfile(CGameBadgeScript* Badge, MwId UserId); // Maniascript
  void BadgeWriteToProfile(CGameBadgeScript* Badge, MwId UserId); // Maniascript
};

struct CGamePlaygroundModuleClientStore : public CGamePlaygroundModuleClient {
  CGameUILayer* const StoreLayer; // Maniascript
};

struct CGamePlaygroundModuleConfig : public CMwNod {
};

// Description: "Masterserver user info."
struct CGameMasterServerUserInfo : public CNetMasterServerUserInfo {
  const bool NeedToChangeZone; // Maniascript
  const uint ZoneLevelCount; // Maniascript
  wstring GetZone(uint ZoneLevel); // Maniascript
  void SetSubscriptionZone(wstring Zone); // Maniascript
  const uint MultiInternetPlayTimeLeft; // Maniascript
};

// File extension: 'StickerSlots.Gbx'
struct CGameBadgeStickerSlots : public CMwNod {
  CGameBadgeStickerSlots();

  const uint MeshCount;
};

struct CGamePlaygroundModuleClient : public CGameManiaAppPlaygroundCommon {
};

struct CGameManiaAppPlayground : public CGameManiaAppPlaygroundCommon {
};

// Description: "This is a video playback handle."
struct CGameVideoScriptVideo : public CMwNod {
  enum class CGameVideoScriptVideo::ETextureFilter {
    Default = 0,
    Point = 1,
  };
  CPlugBitmap* const Image; // Maniascript
  bool IsLooping; // Maniascript
  const bool DownloadInProgress; // Maniascript
  const float PlayLength; // Maniascript
  void BeginProcessing(); // Maniascript
  void EndProcessing(); // Maniascript
  const bool IsProcessing; // Maniascript
  bool AutoProcessing; // Maniascript
  void Play(); // Maniascript
  void Pause(); // Maniascript
  void Stop(); // Maniascript
  const bool IsPlaying; // Maniascript
  float PlayCursor; // Maniascript
  CGameVideoScriptVideo::ETextureFilter TextureFilter; // Maniascript
};

// Description: "User playing the game."
struct CGameUserScript : public CMwNod {
  const string SystemName; // Maniascript
  const wstring DisplayName; // Maniascript
  const vec3 Color; // Maniascript
  const bool PersistentIsReady; // Maniascript
  void PersistentSave(); // Maniascript
  void SavePersistent(); // Maniascript
  CGameUserProfile* const Config; // Maniascript
};

// Description: "API for users."
struct CGameUserManagerScript : public CMwNod {
  const bool Intro; // Maniascript
  bool CanSkipIntro; // Maniascript
  void SetSkipIntro(); // Maniascript
  void DevSetSkipIntro(); // Maniascript
  const bool MainUserLogged; // Maniascript
  CGameUserScript* const MainUser; // Maniascript
  const bool MainUser_CanUseVoiceChat; // Maniascript
  bool VoiceChat_MuteAll; // Maniascript
  void RequestMainUserChange(); // Maniascript
  const MwFastBuffer<CGameUserScript*> Users; // Maniascript
  CInputScriptPad* const MainUserPad; // Maniascript
  wstring GetBuddiesLogins(MwId UserId); // Maniascript
  bool AreBuddiesLoginsReady(MwId UserId); // Maniascript
  void InviteBuddyToServer(MwId UserId, string Login); // Maniascript
  void ShowInviteUI(MwId UserId); // Maniascript
  void ShowProfile(MwId UserId, string ProfileLogin); // Maniascript
};

// Description: "Results for comparison of challenge records with all the buddies."
struct CWebServicesTaskResult_BuddiesChallengeRecordsComparison : public CWebServicesTaskResult {
  const string Login; // Maniascript
  const MwFastBuffer<CGameHighScoreComparisonSummary*> BuddiesComparison; // Maniascript
  void SortByPlayerCount(); // Maniascript
  void SortByOpponentLogin(); // Maniascript
  void SortByOpponentCount(); // Maniascript
  void SortByOpponentDate(); // Maniascript
  void SortByOpponentDisplayName(); // Maniascript
};

struct CGameCtnMasterServerTask_GetChallengeRecordsComparisonSummaries : public CNetMasterServerRequestTask {
};

// Description: "Results for comparison of challenge records between a user and one of its buddy."
struct CWebServicesTaskResult_BuddyChallengeRecordsComparison : public CWebServicesTaskResult {
  const string Login; // Maniascript
  const string BuddyLogin; // Maniascript
  const MwFastBuffer<CGameHighScoreComparison*> PlayerBestRecordsComparison; // Maniascript
  const MwFastBuffer<CGameHighScoreComparison*> BuddyBestRecordsComparison; // Maniascript
  void SortByMapName(); // Maniascript
  void SortByRecordTime(); // Maniascript
  void SortByRecordTimeDiff(); // Maniascript
  void SortByRecordDate(); // Maniascript
};

struct CGameCtnMasterServerTask_ChallengeRecords_GetBuddyRecordComparison : public CNetMasterServerRequestTask {
};

struct CGameHighScoreComparison : public CMwNod {
  CGameCtnChallengeInfo* const MapInfo; // Maniascript
  const string Login; // Maniascript
  const uint RecordTime; // Maniascript
  const uint RecordDate; // Maniascript
  const string RecordDateString; // Maniascript
  const uint RecordElapsedTime; // Maniascript
  const uint RecordCount; // Maniascript
  const string OpponentLogin; // Maniascript
  const wstring OpponentDisplayName; // Maniascript
  const string OpponentRecordUrl; // Maniascript
  const uint OpponentRecordTime; // Maniascript
  const uint OpponentRecordDate; // Maniascript
  const string OpponentRecordDateString; // Maniascript
  const uint OpponentRecordElapsedTime; // Maniascript
  const uint OpponentRecordCount; // Maniascript
};

struct CGameHighScoreComparisonSummary : public CMwNod {
  const string Login; // Maniascript
  const uint BestRecordCount; // Maniascript
  const uint BestRecordLastDate; // Maniascript
  const string BestRecordLastDateString; // Maniascript
  const uint BestRecordElapsedTime; // Maniascript
  const string OpponentLogin; // Maniascript
  const wstring OpponentDisplayName; // Maniascript
  const uint OpponentBestRecordCount; // Maniascript
  const uint OpponentBestRecordLastDate; // Maniascript
  const string OpponentBestRecordLastDateString; // Maniascript
  const uint OpponentBestRecordElapsedTime; // Maniascript
};

struct CGameModuleMenuBase : public CGameManiaAppTitle {
};

struct CGameModuleMenuBrowser : public CGameModuleMenuAdvancedComponent {
};

struct CGameHapticDevice : public CMwNod {
};

// Description: "Script API to communicate with plugins."
struct CGamePluginInterfacesScript : public CMwNod {
  CGameManiaplanetPluginInterface* GetInterface(wstring Name); // Maniascript
  const MwFastBuffer<CGameManiaplanetPluginInterface*> Interfaces; // Maniascript
};

struct CGameEditorManialink2 : public CGameEditorBase {
  CGameEditorManialink2();

};

struct CGameModuleMenuComponent : public CMwNod {
  CGameUILayer* const ComponentLayer; // Maniascript
  void Hide(); // Maniascript
  void Show(); // Maniascript
};

struct CGameModuleMenuAdvancedComponent : public CGameModuleMenuComponent {
};

struct CGameScoreAndLeaderBoardManager : public CMwNod {
};

struct CGameCampaignScoreManager : public CMwNod {
};

struct CGameCampaignScoreManager_MapTime : public CGameCampaignScoreManager {
};

struct CGameCampaignScoreManager_MultiAsyncLevel : public CGameCampaignScoreManager {
};

struct CGameScoreComputer_MultiAsyncLevel : public CMwNod {
  CGameScoreComputer_MultiAsyncLevel();

};

struct CGameMultiplayerScoreManager : public CMwNod {
};

struct CGameGlobalScoreManager : public CMwNod {
};

struct CGameLeaderBoard : public CMwNod {
};

struct CGameNaturalLeaderBoard : public CGameLeaderBoard {
};

struct CGameRealLeaderBoard : public CGameLeaderBoard {
};

struct CGameCampaignLeaderBoard : public CGameNaturalLeaderBoard {
};

struct CGameMapLeaderBoard : public CGameNaturalLeaderBoard {
};

struct CGameMultiplayerLeaderBoard : public CGameRealLeaderBoard {
};

struct CGameGlobalLeaderBoard : public CGameRealLeaderBoard {
};

struct CGameScoreTask_UpdateData : public CWebServicesTaskSequence {
};

struct CGameScoreTask_UpdateMultiAsyncLevelComputer : public CGameScoreTask_UpdateData {
};

struct CGameScoreTask_LoadPlayerScores : public CWebServicesTaskSequence {
};

struct CGameScoreTask_SynchronizePlayerScore : public CWebServicesTaskSequence {
};

struct CWebServicesTaskResult_CampaignMapTimes : public CWebServicesTaskResult {
};

struct CGameCtnMasterServerTask_GetCampaignMapTimes : public CNetMasterServerRequestTask {
};

struct CWebServicesTaskResult_CampaignPlayerRecordTimes : public CWebServicesTaskResult {
};

struct CGameCtnMasterServerTask_GetCampaignPlayerRecordTimes : public CNetMasterServerRequestTask {
};

struct CGameModuleMenuLadderRankings : public CGameModuleMenuComponent {
};

struct CGameScriptHandlerPlaygroundModuleStore : public CGameManialinkScriptHandler {
  const uint CurrentMoney; // Maniascript
  const MwFastBuffer<string> Categories; // Maniascript
  const MwFastBuffer<CGameModuleScriptItem*> CategoryItems; // Maniascript
  void RetrieveCategoryItems(string CategoryName); // Maniascript
  void Buy(string ItemName); // Maniascript
  int GetItemCurrentLevel(wstring ItemUrl); // Maniascript
  int GetItemPrice(wstring ItemUrl, int Level); // Maniascript
  string GetItemStoreName(wstring ItemUrl); // Maniascript
  string GetItemStoreDesc(wstring ItemUrl); // Maniascript
  void Quit(); // Maniascript
};

struct CGameModuleMenuServerBrowser : public CGameModuleMenuComponent {
};

struct CGamePlaygroundModuleClientHud : public CGameManiaAppPlaygroundCommon {
  void ToggleStore(); // Maniascript
  void ToggleInventory(); // Maniascript
};

struct CGamePlaygroundModuleServer : public CMwNod {
  void Hide(); // Maniascript
  void Hide2(CGamePlayer* Player); // Maniascript
  void Show(); // Maniascript
  void Show2(CGamePlayer* Player); // Maniascript
  bool IsVisible(CGamePlayer* Player); // Maniascript
};

struct CGameMasterServerOnlineSignalTask_GetPlayerOnlineSignals : public CNetMasterServerRequestTask {
};

struct CWebServicesTaskResult_OnlineSignals : public CWebServicesTaskResult {
};

struct CGameScriptHandlerTitleModuleMenu : public CGameManiaAppTitleLayerScriptHandler {
  const MwFastBuffer<CGameModuleMenuComponent*> Components; // Maniascript
  CGameModuleMenuComponent* GetFirstComponent(string Name); // Maniascript
};

struct CGameEditorAnimChar : public CMwNod {
  bool DbgDrawJointCurves;
  bool DbgIKs;
  bool DbgTestIK;
  float DbgIKTolerance;
  int DbgJoint;
  int DbgSkel;
  bool DrawBoneInfos;
  bool DrawRefBox;
  bool Collisions;
  bool DrawJointWeights;
  uint IKChainLength;
};

struct CGameScriptHandlerPlaygroundModuleInventory : public CGameManialinkScriptHandler {
  const MwFastBuffer<CGameModuleInventoryCategory*> InventoryContent; // Maniascript
  void Quit(); // Maniascript
  void Drop(uint CategoryIndex, uint SlotIndex); // Maniascript
  void Equip(uint CategoryIndex, uint SlotIndex); // Maniascript
};

struct CGameModuleInventoryCategory : public CMwNod {
  const string Name; // Maniascript
  const string Description; // Maniascript
  const uint ItemClass; // Maniascript
  const MwFastBuffer<CGameModuleScriptItem*> SlotsItems; // Maniascript
  const MwFastBuffer<uint> SlotsItemsQuantity; // Maniascript
};

struct CGameModuleScriptItem : public CMwNod {
  const wstring Url; // Maniascript
  const string IconUrl; // Maniascript
  const string Name; // Maniascript
  const string Description; // Maniascript
  const uint Occupation; // Maniascript
  void IsItem(); // Maniascript
  void HasAction(); // Maniascript
  const uint MaxLevel; // Maniascript
};

struct CGameMasterServerTask_SetBuddies : public CNetMasterServerRequestTask {
};

struct CGameCtnMasterServerTask_GetRealLeaderBoard : public CNetMasterServerRequestTask {
};

struct CGameCtnMasterServerTask_UploadPlayerRecord : public CNetMasterServerRequestTask {
};

struct CGameScoreTask_SetCampaignNewMapRecord : public CWebServicesTaskSequence {
};

struct CWebServicesTaskResult_Timestamp : public CWebServicesTaskResult {
};

struct CGamePlaygroundModuleServerStore : public CGamePlaygroundModuleServer {
  void Reset(); // Maniascript
  void SetMoney(CGamePlayer* Player, uint Amount); // Maniascript
  uint GetMoney(CGamePlayer* Player); // Maniascript
  bool AddMoney(CGamePlayer* Player, uint Amount); // Maniascript
  bool SubMoney(CGamePlayer* Player, uint Amount); // Maniascript
  void SetActionLevel(CGamePlayer* Player, wstring ActionUrl, uint ActionLevel); // Maniascript
  uint GetActionLevel(CGamePlayer* Player, wstring ActionUrl); // Maniascript
};

struct CGamePlaygroundModuleServerHud : public CMwNod {
  CGamePlaygroundModuleServerInventory* Inventory; // Maniascript
  CGamePlaygroundModuleServerStore* Store; // Maniascript
  CGamePlaygroundModuleServerScoresTable* ScoresTable; // Maniascript
};

struct CGamePlaygroundModuleManagerServer : public CMwNod {
};

struct CGamePlaygroundModuleServerInventory : public CGamePlaygroundModuleServer {
  uint AddItem(CGamePlayer* Player, wstring ItemModelUrl, uint Quantity); // Maniascript
  uint RemoveItem(CGamePlayer* Player, wstring ItemModelUrl, uint Quantity); // Maniascript
  uint GetItemQuantity(CGamePlayer* Player, wstring ItemModelUrl); // Maniascript
  bool AddAction(CGamePlayer* Player, wstring ActionModelUrl); // Maniascript
  bool RemoveAction(CGamePlayer* Player, wstring ActionModelUrl); // Maniascript
  bool IsActionStored(CGamePlayer* Player, wstring ActionModelUrl); // Maniascript
};

struct CGamePlaygroundModuleServerScoresTable : public CGamePlaygroundModuleServer {
  void SetFooterText(wstring FooterText); // Maniascript
  void SetColumnValueString(CGamePlayer* Player, string ColumnName, string ColumnValue); // Maniascript
  void SetColumnValueInteger(CGamePlayer* Player, string ColumnName, int ColumnValue); // Maniascript
  void SetColumnValueReal(CGamePlayer* Player, string ColumnName, float ColumnValue); // Maniascript
};

// Description: "Results containing a part of the leaderboard."
struct CWebServicesTaskResult_RealLeaderBoard : public CWebServicesTaskResult {
  const uint FromIndex; // Maniascript
  const uint Count; // Maniascript
  const MwFastBuffer<CGameRealLeaderBoardInfo*> LeaderBoardInfo; // Maniascript
};

// Description: "Ranking item of a leaderboard."
struct CGameRealLeaderBoardInfo : public CMwNod {
  const uint Rank; // Maniascript
  const string Login; // Maniascript
  const wstring DisplayName; // Maniascript
  const float Score; // Maniascript
};

struct CGameScoreTask_GetRealLeaderBoardPlayerList : public CWebServicesTaskSequence {
};

struct CWebServicesTaskResult_CampaignMapRecordGhost : public CWebServicesTaskResult_GhostHandle {
};

struct CGameScoreTask_GetCampaignMapRecordGhost : public CWebServicesTaskSequence {
};

// Description: "Score and leaderboard manager."
struct CGameScoreAndLeaderBoardManagerScript : public CMwNod {
  enum class CGameScoreAndLeaderBoardManagerScript::ELocalScoreStatus {
    None = 0,
    Loading = 1,
    NotLoaded = 2,
    Loaded = 3,
  };
  enum class CGameScoreAndLeaderBoardManagerScript::EMasterServerScoreStatus {
    None = 0,
    Synchronizing = 1,
    NotSynchronized = 2,
    Synchronized = 3,
  };
  const MwFastBuffer<CWebServicesTaskResult*> TaskResults; // Maniascript
  void ReleaseTaskResult(MwId TaskId); // Maniascript
  CGameScoreAndLeaderBoardManagerScript::ELocalScoreStatus ScoreStatus_GetLocalStatus(MwId UserId); // Maniascript
  CGameScoreAndLeaderBoardManagerScript::EMasterServerScoreStatus ScoreStatus_GetMasterServerStatus(MwId UserId); // Maniascript
  CWebServicesTaskResult* Campaign_SetNewMapRecord(MwId UserId, string MapUid, CGameGhostScript* Ghost); // Maniascript
  uint Campaign_GetMapRecord(MwId UserId, string MapUid); // Maniascript
  CWebServicesTaskResult_GhostHandle* Campaign_GetMapRecordGhost(MwId UserId, string MapUid); // Maniascript
  uint Campaign_GetMapMultiAsyncLevel(MwId UserId, string MapUid); // Maniascript
  CWebServicesTaskResult_BuddiesChallengeRecord* Campaign_GetBuddiesMapRecord(MwId UserId, string MapUid); // Maniascript
  bool Campaign_IsBuddiesMapRecordDirty(MwId UserId, string MapUid); // Maniascript
  CWebServicesTaskResult_BuddiesChallengeRecordsComparison* Campaign_GetBuddiesMapRecordsComparison(MwId UserId); // Maniascript
  CWebServicesTaskResult_BuddyChallengeRecordsComparison* Campaign_GetBuddyMapRecordsComparison(MwId UserId, string OpponentLogin); // Maniascript
  void Multiplayer_AddToScore(MwId UserId, float ScoreDiff, uint Timestamp); // Maniascript
  uint CampaignLeaderBoard_GetPlayerRanking(MwId UserId, string CampaignId, wstring Zone); // Maniascript
  uint CampaignLeaderBoard_GetPlayerCount(string CampaignId, wstring Zone); // Maniascript
  uint MapLeaderBoard_GetPlayerRanking(MwId UserId, string MapUid, wstring Zone); // Maniascript
  uint MapLeaderBoard_GetPlayerCount(string MapUid, wstring Zone); // Maniascript
  uint GlobalLeaderBoard_GetPlayerRanking(MwId UserId, wstring Zone); // Maniascript
  uint GlobalLeaderBoard_GetPlayerCount(wstring Zone); // Maniascript
  CWebServicesTaskResult_RealLeaderBoard* GlobalLeaderBoard_GetPlayerList(MwId UserId, wstring Zone, uint FromIndex, uint Count); // Maniascript
};

struct CGameCtnMasterServerTask_GetDisplayNameScript : public CWebServicesTaskSequence {
};

// Description: "Results of task requesting the display name of registered login."
struct CWebServicesTaskResult_GetDisplayNameScriptResult : public CWebServicesTaskResult {
  void AddLogin(string Login); // Maniascript
  void StartTask(); // Maniascript
  wstring GetDisplayName(string Login); // Maniascript
};

struct CGameEditorTimeLine : public CMwNod {
  const uint Time;
  void TimeStop();
  void TimeSlowForward();
  void TimeNormalForward();
  void TimeFirstFrame();
  void TimeLastFrame();
  void TimePlayStop();
  void TimeLineShowFull();
  void KeyInsert();
  void KeyRemove();
  void KeysSelectAll();
  void KeyPrev();
  void KeyNext();
  void Copy();
  void KeyCut();
  void Paste();
  void TimeLineNext();
  void TimeLinePrev();
  void KeysRemoveAll();
};

struct CGameEditorAnimChar_Interface : public CMwNod {
  CScene2d* const Scene2d;
  float EntryParamTransitionDuration;
  const float Duration;
};

struct CGameMasterServerOnlineSignalTask_NotifyBuddiesAboutNewOnlineSignals : public CWebServicesTaskSequence {
};

struct CGameMasterServerUserOnlineSignals : public CMwNod {
  const MwId Id; // Maniascript
  const MwFastBuffer<CGameMasterServerOnlineSignal*> OnlineSignals; // Maniascript
  void RemoveOnlineSignal(uint OnlineId); // Maniascript
};

struct CGameEditorAnimSet : public CGameEditorBase {
  CGameAnimSet* const AnimSet;
};

struct CGameAnimClipNod : public CMwNod {
  CGameAnimClipNod();

};

struct CGameUserPrivilegeTask_CheckPlayMultiplayerMode : public CWebServicesTaskSequence {
};

// Description: "Achievement stat."
struct CGameAchievementScriptStatDesc : public CMwNod {
  const string TitleId; // Maniascript
  const wstring DisplayName; // Maniascript
  const wstring Description; // Maniascript
};

// Description: "An achievement's description."
struct CGameAchievementScriptAchievementDesc : public CMwNod {
  const string TitleId; // Maniascript
  const wstring DisplayName; // Maniascript
  const wstring Description; // Maniascript
  const wstring IconUrl; // Maniascript
};

struct CGameEditorVehicle : public CGameEditorAsset {
  void Quit();
  void Save();
  float GridColorAlpha; // Range: 0 - 1
  int PluginOffsetX;
  int PluginOffsetY;
  int PluginOffsetZ;
  CScene2d* const InterfaceScene;
  bool EmbedCustomItems;
};

struct CGameEditorParent : public CGameEditorBase {
  bool DummyBool;
};

// Description: "Results containing a list of child zones of a specified zone."
struct CWebServicesTaskResult_ZoneList : public CWebServicesTaskResult {
  const wstring Path; // Maniascript
  const uint ZoneCount; // Maniascript
  const MwFastBuffer<CGameLeagueScript*> Zones; // Maniascript
};

struct CGameCtnMasterServerTask_ZoneGetChilds : public CWebServicesTaskSequence {
};

struct CGameCtnMasterServerTask_GetLeagues : public CNetMasterServerRequestTask {
};

struct CGameLeagueScript : public CMwNod {
  const wstring Name; // Maniascript
  const wstring Path; // Maniascript
  const wstring FullPath; // Maniascript
  const string FlagUrl; // Maniascript
};

struct CGameMasterServerTask_Connect : public CNetMasterServerTask_Connect {
};

// Description: "Uplay action."
struct CGameAchievementScriptUplayAction : public CMwNod {
  const string ActionId; // Maniascript
  const wstring Name; // Maniascript
  const wstring Description; // Maniascript
  const uint Value; // Maniascript
};

// Description: "Online presence"
struct CGameMasterServerPlayerOnlinePresence : public CMwNod {
  const string Login; // Maniascript
  const wstring DisplayName; // Maniascript
  const string ServerLogin; // Maniascript
  const bool IsOnline; // Maniascript
};

struct CWebServicesTaskResult_OnlinePresenceList : public CWebServicesTaskResult {
};

struct CGameCtnMasterServerTask_GetOnlinePresenceForPlayers : public CNetMasterServerRequestTask {
};

// Description: "Results of task requesting the list of servers where the logins are playing."
struct CGameMasterServerRichPresenceTaskResult_GetOnlinePresenceForPlayersScript : public CGameMasterServerRichPresenceTaskResult_PlayerOnlinePresenceList {
  const MwFastBuffer<CGameMasterServerPlayerOnlinePresence*> OnlinePresences; // Maniascript
  void AddLogin(string Login); // Maniascript
  void StartTask(); // Maniascript
};

struct CWebServicesTaskResult_GhostHandle : public CWebServicesTaskResult {
};

struct CGameMasterServerRichPresenceManager : public CMwNod {
};

struct CGameMasterServerRichPresenceTask_UpdatePresence : public CWebServicesTaskSequence {
};

// Description: "User privileges manager."
struct CGameUserPrivilegesManagerScript : public CMwNod {
  enum class CGameUserPrivilegesManagerScript::EPrivilege {
    PlayMultiplayerMode = 0,
    PlayMultiplayerSession = 1,
    UploadUserCreatedContent = 2,
    ViewOnlinePresence = 3,
    ViewUserCreatedContent = 4,
    ViewUserCreatedContentRequired = 5,
    ViewUserGameHistory = 6,
    VoiceChat = 7,
    PlayMultiplayerAsync = 8,
    DownloadUserCreatedContent = 9,
  };
  const MwFastBuffer<CWebServicesTaskResult*> TaskResults; // Maniascript
  void ReleaseTaskResult(MwId TaskId); // Maniascript
  CWebServicesTaskResult* CheckPrivilege(MwId UserId, CGameUserPrivilegesManagerScript::EPrivilege Privilege); // Maniascript
  CWebServicesTaskResult* CheckPrivilegeForAllUsers(CGameUserPrivilegesManagerScript::EPrivilege Privilege); // Maniascript
  CWebServicesTaskResult_CheckTargetedPrivilegeResultScript* CheckTargetedPrivilege(MwId UserId, CGameUserPrivilegesManagerScript::EPrivilege Privilege); // Maniascript
  CWebServicesTaskResult_CheckTargetedPrivilegeResultScript* CheckTargetedPrivilegeForAllUsers(CGameUserPrivilegesManagerScript::EPrivilege Privilege); // Maniascript
};

struct CGameUserPrivilegeTask_CheckUploadUserCreatedContent : public CWebServicesTaskSequence {
};

struct CWebServicesTaskResult_CheckTargetedPrivilegeResult : public CWebServicesTaskResult {
};

struct CGameUserPrivilegeTask_CheckViewOnlinePresence : public CWebServicesTaskSequence {
};

// Description: "Results of task requesting if the registered login have a privilege."
struct CWebServicesTaskResult_CheckTargetedPrivilegeResultScript : public CWebServicesTaskResult_CheckTargetedPrivilegeResult {
  void AddLogin(string Login); // Maniascript
  void StartTask(); // Maniascript
  bool HasPrivilege(string Login); // Maniascript
  wstring GetDenyReason(string Login); // Maniascript
};

struct CGameUserPrivilegeTask_CheckTargetedViewUserCreatedContent : public CWebServicesTaskSequence {
};

struct CGameMasterServerRichPresenceTask_GetOnlinePresence : public CWebServicesTaskSequence {
};

struct CGameMasterServerRichPresenceTaskResult_PlayerOnlinePresenceList : public CWebServicesTaskResult {
};

struct CGameMasterServerRichPresenceManagerScript : public CMwNod {
  enum class CGameMasterServerRichPresenceManagerScript::ERichPresence {
    Undefined = 0,
    MainMenu = 1,
    Solo = 2,
    Multi = 3,
    Party = 4,
    Create = 5,
  };
  const MwFastBuffer<CWebServicesTaskResult*> TaskResults; // Maniascript
  void ReleaseTaskResult(MwId TaskId); // Maniascript
  void SetPresence(MwId UserId, CGameMasterServerRichPresenceManagerScript::ERichPresence UplayFlow); // Maniascript
  CGameMasterServerRichPresenceTaskResult_GetOnlinePresenceForPlayersScript* GetOnlinePresenceForPlayers(MwId UserId); // Maniascript
};

struct CGameUserPrivilegeTask_CheckViewUserCreatedContent : public CWebServicesTaskSequence {
};

struct CGameManagerBadgeScript : public CMwNod {
  const MwFastBuffer<CGameBadgeScript*> Badges; // Maniascript
  CGameBadgeScript* BadgeCreate(); // Maniascript
  void BadgeDestroy(CGameBadgeScript* Badge); // Maniascript
  void BadgeCopy(CGameBadgeScript* Source, CGameBadgeScript* Destination); // Maniascript
  void BadgeReadFromProfile(CGameBadgeScript* Badge, MwId UserId); // Maniascript
  void BadgeWriteToProfile(CGameBadgeScript* Badge, MwId UserId); // Maniascript
  bool ProfileIsReady(MwId UserId); // Maniascript
};

struct CGameUserPrivilegeTask_CheckPlayMultiplayerSession : public CWebServicesTaskSequence {
};

struct CGameCtnMasterServerTask_BuyFullGame : public CWebServicesTaskSequence {
};

struct CGameUserPrivilegeTask_CheckVoiceChat : public CWebServicesTaskSequence {
};

struct CGameNetFormVoiceChat : public CGameNetForm {
  CGameNetFormVoiceChat();

};

struct CGameMasterServerTask_ChangeZone : public CNetMasterServerRequestTask {
};

struct CGameUserPrivilegeTask_CheckPlayMultiplayerAsync : public CWebServicesTaskSequence {
};

struct CGameCtnMasterServerTask_LaunchUplay : public CWebServicesTaskSequence {
};

struct CGameUserPrivilegeTask_CheckDownloadUserCreatedContent : public CWebServicesTaskSequence {
};

struct CGameScoreTask_UploadCampaignNewMapRecord : public CWebServicesTaskSequence {
};

struct CGameUserPrivilegeTask_CheckTargetedViewUserGameHistory : public CWebServicesTaskSequence {
};

struct CGameScoreTask_BuddiesChallengeRecordsComparison : public CWebServicesTaskSequence {
};

struct CWebServicesTaskResult_ChallengeRecordsComparisonSummaries : public CWebServicesTaskResult {
};

// Description: "Results of task launching Uplay and completing action at registration."
struct CWebServicesTaskResult_LaunchUplayScriptResult : public CWebServicesTaskResult {
  void AddActionToComplete(string ActionId); // Maniascript
  void StartTask(); // Maniascript
};

struct CGameUserPrivilegeTask_CheckTargetedViewUserCreatedContentForAllUsers : public CWebServicesTaskSequence {
};

struct CGameUserPrivilegeTask_CheckPrivilegeForAllUsers : public CWebServicesTaskSequence {
};

struct CGameCtnMasterServerTask_ChallengeRecords_GetBuddiesRecord : public CNetMasterServerRequestTask {
};

struct CWebServicesTaskResult_ChallengeRecords_BuddiesRecord : public CWebServicesTaskResult {
};

struct CGameScoreTask_BuddiesChallengeRecordsForMap : public CWebServicesTaskSequence {
};

// Description: "List of all buddies record for a map."
struct CWebServicesTaskResult_BuddiesChallengeRecord : public CWebServicesTaskResult {
  const string Login; // Maniascript
  const MwFastBuffer<CGameHighScoreComparison*> BuddiesChallengeRecord; // Maniascript
  void SortByOpponentCount(); // Maniascript
  void SortByOpponentDisplayName(); // Maniascript
  void SortByOpponentLogin(); // Maniascript
  void SortByOpponentRecordDate(); // Maniascript
  void SortByOpponentRecordTime(); // Maniascript
};

struct CGameScoreTask_BuddyChallengeRecordsComparison : public CWebServicesTaskSequence {
};

struct CWebServicesTaskResult_ChallengeRecords_BuddyRecordComparison : public CWebServicesTaskResult {
};

struct CGameCtnMediaBlockCheatEmptyCars : public CGameCtnMediaBlock {
  CGameCtnMediaBlockCheatEmptyCars();

};

struct CGameControlCameraHmdExternal : public CGameControlCamera {
};

struct CWebServicesTaskResult_NaturalLeaderBoardSummaries : public CWebServicesTaskResult {
};

struct CGameCtnMasterServerTask_GetNaturalLeaderBoardSummaries : public CNetMasterServerRequestTask {
};

struct CWebServicesTaskResult_RealLeaderBoardSummaries : public CWebServicesTaskResult {
};

struct CGameCtnMasterServerTask_GetRealLeaderBoardSummaries : public CNetMasterServerRequestTask {
};

} // namespace Game

namespace Graphic {

struct GxLight : public CMwNod {
  GxLight();

  vec3 Color;
  float Intensity; // Range: 0 - 1
  float DiffuseIntensity; // Range: 0 - 1
  float SpecularIntens;
  float SpecularPower;
  float ShadowIntensity; // Range: 0 - 1
  vec3 ShadowRGB;
  bool DoLighting;
  bool LightMapOnly;
  bool IsInversed;
  bool IsShadowGen;
  bool DoSpecular;
  bool HasLensFlare;
  float FlareIntensity; // Range: 0 - 1
  bool HasSprite;
  bool IgnoreLocalScale;
  bool EnableGroup0;
  bool EnableGroup1;
  bool EnableGroup2;
  bool EnableGroup3;
  CMwNod* const PlugLight;
};

struct GxLightBall : public GxLightPoint {
  GxLightBall();

  vec3 AmbientRGB;
  float Radius; // Range: 0.01 - 50
  bool CustomRadiusSpecular;
  float RadiusSpecular; // Range: 0.01 - 50
  bool CustomRadiusIndex;
  float RadiusIndex; // Range: 0.01 - 50
  bool CustomRadiusShadow;
  float RadiusShadow; // Range: 0.01 - 50
  bool CustomRadiusFlare;
  float RadiusFlare; // Range: 0.01 - 50
  float EmittingRadius;
  float EmittingCylinderLenZ;
  UnnamedEnum AttenuationType;
  UnnamedEnum TweakHN2;
  const float AttHTnLR; // Range: 0 - 10
  const float AttHTnLR2; // Range: 0 - 10
  float AttHyper2DerivAt0; // Range: -5 - 0
  float AttHyper2Tension; // Range: 0 - 1
};

struct GxLightPoint : public GxLightNotAmbient {
  GxLightPoint();

  float FlareSize;
  float FlareBiasZ;
};

struct CGxFog : public CMwNod {
  CGxFog();

};

struct GxLightAmbient : public GxLight {
  GxLightAmbient();

  float ShadeMinY;
  float ShadeMaxY;
};

struct GxLightNotAmbient : public GxLight {
  GxLightNotAmbient();

};

struct GxLightDirectional : public GxLightNotAmbient {
  GxLightDirectional();

  vec3 DblSidedRGB;
  vec3 ReverseRGB;
  float ReverseIntens; // Range: 0 - 1
  float EmittAngularSize;
  float FlareAngularSize;
  float FlareIntensPower; // Range: 0 - 1
  bool UseBoundaryHint;
  vec3 BoundaryHintPos;
  float DazzleAngleMax;
  float DazzleIntensity; // Range: 0 - 1
};

struct GxFogBlender : public CMwNod {
  GxFogBlender();

};

struct GxLightFrustum : public GxLightBall {
  GxLightFrustum();

  bool IsOrtho;
  float NearZ;
  float FarZ;
  float FovY;
  float RatioXY;
  float SizeX;
  float SizeY;
  bool DoAttenuation;
  enum class GxLightFrustum::EApply {
    ModulateAdd = 0,
    Modulate = 1,
    Add = 2,
    ModulateX2 = 3,
  };
  GxLightFrustum::EApply Apply;
  enum class GxLightFrustum::ETechnique {
    RenderCube = 0,
    _2dMaskNoClipZ = 1, // 2dMaskNoClipZ
    _2dBallLight = 2, // 2dBallLight
    GenShadowMask = 3,
  };
  GxLightFrustum::ETechnique Technique;
  uint iShadowGroup;
  bool DoFadeZ;
  float RatioFadeZ; // Range: 0 - 1
  bool UseFacePosX;
  bool UseFaceNegX;
  bool UseFacePosY;
  bool UseFaceNegY;
  bool UseFacePosZ;
  bool UseFaceNegZ;
};

struct GxLightSpot : public GxLightBall {
  GxLightSpot();

  float AngleInner; // Range: 0 - 179
  float AngleOuter; // Range: 0 - 179
  bool CustomAngleFlare;
  float AngleFlare; // Range: 0 - 179
  bool CustomAngleShadow;
  float AngleInnerShadow; // Range: 0 - 179
  float AngleOuterShadow; // Range: 0 - 179
};

} // namespace Graphic

namespace Function {

// File extension: 'FuncKey.Gbx'
struct CFuncKeys : public CFunc {
  MwFastArray<float> Xs;
  void Reset();
};

struct CFuncKeysTrans : public CFuncKeys {
  CFuncKeysTrans();

  MwFastArray<vec3> Trans;
};

// File extension: 'KeysTransQuat.Gbx'
struct CFuncKeysTransQuat : public CFuncKeysTrans {
  CFuncKeysTransQuat();

  void AddTransQuatKey(float X, vec3 Pos, vec3 Dir, vec3 Up);
};

// File extension: 'KeysPath.Gbx'
struct CFuncKeysPath : public CFuncKeysTransQuat {
  CFuncKeysPath();

  enum class CFuncKeysPath::EPathDrawMode {
    Line = 0,
    BSpline = 1,
    BSplineTension = 2,
    BSplineBias = 3,
    BezierSpline = 4,
    BetaSpline = 5,
    Hermite = 6,
  };
  CFuncKeysPath::EPathDrawMode DrawMode;
  float BSplineTension; // Range: -2 - 0
  float BSplineBias; // Range: -1 - 1
  float BetaSplineTension; // Range: 0 - 100
  float BetaSplineSkew; // Range: -1 - 1
  bool UseTangentOrientation;
};

struct CFuncPlug : public CFunc {
  float Period;
  float Phase;
  bool AutoCreateMotion;
  bool RandomizePhase;
  MwId InputValId;
};

struct CFuncLightIntensity : public CFuncLight {
  CFuncLightIntensity();

  float Intensity0;
  float Intensity1;
  float FlickerDuration;
};

struct CFuncTreeTranslate : public CFuncTree {
  CFuncTreeTranslate();

  vec3 StartPoint;
  vec3 EndPoint;
  bool IsPingPong;
  bool IsSmooth;
};

struct CFuncEnum : public CFunc {
  CFuncEnum();

};

// File extension: 'Func.Gbx'
struct CFunc : public CMwNod {
};

struct CFuncShader : public CFuncPlug {
};

struct CFuncKeysVisual : public CFuncKeys {
  CFuncKeysVisual();

};

// File extension: 'FuncShader.Gbx'
struct CFuncShaders : public CFuncShader {
  CFuncShaders();

  MwFastArray<CFuncShader*> FuncShaders;
};

// File extension: 'FuncShader.Gbx'
struct CFuncShaderLayerUV : public CFuncShader {
  CFuncShaderLayerUV();

  string LayerName;
  UnnamedEnum LayerEnum;
  enum class CFuncShaderLayerUV::ESignalType {
    TransLinear = 0,
    TransCircular = 1,
    Rotate = 2,
    TransSubTexture = 3,
    TransLinearScale = 4,
    CopySubTexture = 5,
    Scale = 6,
    Reset = 7,
    TransSubTexture2 = 8,
    _GComp = 9, // =>Comp
    TransLinearScaleRotate = 10,
  };
  CFuncShaderLayerUV::ESignalType SignalType;
  vec2 Base;
  vec2 Amplitude;
  vec2 Offset;
  vec2 Scale;
  float Angle; // Range: 0 - 360
  float AngleStart; // Range: 0 - 360
  float AngleEnd; // Range: 0 - 360
  uint NbSubTexture;
  uint NbSubTexturePerLine;
  uint NbSubTexturePerColumn;
  bool TopToBottom;
  bool WriteX;
  bool WriteY;
  bool WriteZ;
  bool WriteW;
  bool EnablePingPong;
  bool EnableSmooth;
  bool EnableMipMapping;
  bool EnableBlending;
  bool EnableSmoothBlend;
  CPlugBitmap* BitmapCopy;
};

struct CFuncShaderFxFactor : public CFuncShader {
  CFuncShaderFxFactor();

  enum class CFuncShaderFxFactor::EMapFx {
    SelfIllumLuminance = 0,
    LightMapIntensity = 1,
  };
  CFuncShaderFxFactor::EMapFx MapFx;
  enum class CFuncShaderFxFactor::EFctType {
    Linear = 0,
    Smooth = 1,
    Refresh_glow = 2, // Refresh glow
  };
  CFuncShaderFxFactor::EFctType Type;
  float Base;
  float Amplitude;
  float Offset;
};

struct CFuncLight : public CFuncPlug {
  enum class CFuncLight::EFctType {
    Sinus = 0,
    Flick = 1,
  };
  CFuncLight::EFctType FctType;
  float FlickPeriod;
  uint FlickCount;
};

struct CFuncLightColor : public CFuncLight {
  CFuncLightColor();

  vec3 Color0;
  vec3 Color1;
  CPlugFileImg* Image;
};

// File extension: 'FuncKeysReals.Gbx'
struct CFuncKeysReal : public CFuncKeys {
  CFuncKeysReal();

  enum class CFuncKeysReal::ERealInterp {
    None = 0,
    Linear = 1,
    Hermite = 2,
    SmoothStep = 3,
  };
  CFuncKeysReal::ERealInterp RealInterp;
  bool ForceTangentMinX;
  float ForcedTangentMinX;
  bool ForceTangentMaxX;
  float ForcedTangentMaxX;
  MwFastArray<float> Ys;
};

struct CFuncVisual : public CFuncPlug {
};

struct CFuncTree : public CFuncPlug {
};

struct CFuncVisualShiver : public CFuncVisual {
  CFuncVisualShiver();

  float Amplitude;
  vec3 OffsetPlane;
  enum class CFuncVisualShiver::EShiverType {
    Normal = 0,
    Axis = 1,
  };
  CFuncVisualShiver::EShiverType ShiverType;
  vec3 Axis;
  bool UsePlane;
  vec3 PlanePoint;
  vec3 PlaneNormal;
  float PlaneMinDist;
  bool UsePlane2;
  vec3 Plane2Point;
  vec3 Plane2Normal;
  float Plane2MinDist;
};

// File extension: 'FuncTree.Gbx'
struct CFuncTreeRotate : public CFuncTree {
  CFuncTreeRotate();

  float AngleMin;
  float AngleMax;
};

struct CFuncTreeBend : public CFuncTree {
  CFuncTreeBend();

  float Amplitude;
};

// File extension: 'PathMesh.Gbx'
struct CFuncPathMesh : public CFunc {
  CFuncPathMesh();

  CPlugVisual3D* Visual;
  vec3 OffsetVisualPos;
  MwFastArray<CFuncPathMeshLocation*> Locations;
};

struct CFuncPathMeshLocation : public CFunc {
  CFuncPathMeshLocation();

  string Name;
  iso4 Location;
};

struct CFuncKeysReals : public CFuncKeys {
  CFuncKeysReals();

};

// File extension: 'KeysBlendShape.Gbx'
struct CFuncVisualBlendShapeSequence : public CFuncVisual {
  CFuncVisualBlendShapeSequence();

};

struct CFuncKeysNatural : public CFuncKeys {
  CFuncKeysNatural();

  MwFastArray<uint> Naturals;
};

struct CFuncTreeSubVisualSequence : public CFuncTree {
  CFuncTreeSubVisualSequence();

  CFuncKeysNatural* SubKeys;
  bool SimpleModeIsLooping;
  uint SimpleModeStartIndex;
  uint SimpleModeEndIndex;
};

struct CFuncShaderTweakKeysTranss : public CFuncShader {
  CFuncShaderTweakKeysTranss();

};

// File extension: 'FuncWeather.Gbx'
struct CFuncWeather : public CFunc {
  CFuncWeather();

  CFuncClouds* FuncClouds;
  CPlugMaterial* MaterialSky_Night;
  CPlugMaterial* MaterialSky_SunRise;
  CPlugMaterial* MaterialSky_Day;
  CPlugMaterial* MaterialSky_SunFall;
  CPlugMaterial* MaterialSea0;
  CPlugMaterial* MaterialSea1;
  CPlugFileImg* ImageLightAmb;
  CPlugFileImg* ImageLightDirSun;
  CPlugFileImg* ImageLightDirMoon;
  CPlugFileImg* ImageLightDirDblSided;
  CPlugBitmap* BitmapFlareSun;
  float FlareAngularSizeSun;
  CPlugBitmap* BitmapFlareMoon;
  float FlareAngularSizeMoon;
  CPlugBitmap* BitmapSkyGradV;
  CPlugFileImg* ImageFogColor;
  CPlugFileImg* ImageSeaColor;
  CPlugBitmap* BitmapRainFid;
  CMwNod* SceneFxFid;
  float CameraFarZ;
  bool FogByVertex;
  vec3 FogRGB;
  enum class CFuncWeather::EGxFogFormula {
    None = 0,
    Exp = 1,
    Exp2 = 2,
    Linear = 3,
  };
  CFuncWeather::EGxFogFormula FogFormula;
  enum class CFuncWeather::EGxFogSpace {
    CameraFarZ = 0,
    World = 1,
  };
  CFuncWeather::EGxFogSpace FogSpace;
  float FogLinearStart;
  float FogLinearEnd;
  float FogExpDensity;
  vec3 DayFogColor;
  float DayFogStart;
  float DayFogEnd;
  float DayFogDensity;
  GxFogBlender* FogBlender;
  void SeaTwkResetToShaderDefaults();
  vec2 LDirSpecIntens;
  vec2 LDirSpecPower;
  float SeaTwkReflecIntensNight; // Range: 0 - 1
  float SeaTwkReflecIntensDay; // Range: 0 - 1
  float SeaTwkReflecIntensMidNight; // Range: 0 - 1
  float SeaTwkReflecIntensMidDay; // Range: 0 - 1
  float SeaTwkReflecIntensTMNight; // Range: 0 - 1
  float SeaTwkReflecIntensTMDay; // Range: 0 - 1
  float SeaTwkReflecIntensTMmidNight; // Range: 0 - 1
  float SeaTwkReflecIntensTMmidDay; // Range: 0 - 1
  vec3 SeaTwkWaterColor_Night;
  vec3 SeaTwkWaterColor_Day;
};

// File extension: 'FuncPuffLull.Gbx'
struct CFuncPuffLull : public CFunc {
  CFuncPuffLull();

  float TileSizeInWorld;
  float PuffWDMax; // Range: 0 - 1
  float LullWDMax; // Range: 0 - 1
  uint GenCount;
  float GenPuffRatio; // Range: 0 - 1
  vec2 GenSize;
  float GenPuffWDMin; // Range: 0 - 1
  float GenPuffWDMax; // Range: 0 - 1
  float GenLullWDMin; // Range: 0 - 1
  float GenLullWDMax; // Range: 0 - 1
  string GenLifeTimeMin;
  string GenLifeTimeMax;
  float BlendPuff; // Range: 0 - 1
  float BlendLull; // Range: 0 - 1
  float Combine2nd8th; // Range: 0 - 1
  CPlugMaterial* MaterialPuff;
  CPlugMaterial* MaterialLull;
};

struct CFuncEnvelope : public CFunc {
  CFuncEnvelope();

  float KeyFrameValue0;
  float KeyFrameValue1;
  float KeyFrameValue2;
  float KeyFrameValue3;
  float KeyFramePos1;
  float KeyFramePos2;
  float Frequency;
  float Amplitude;
  enum class CFuncEnvelope::EModulation {
    Cos = 0,
    Sin = 1,
  };
  CFuncEnvelope::EModulation ModFunc;
};

struct CFuncSegment : public CFunc {
  CFuncSegment();

  const uint KeyCount;
};

// File extension: 'FuncColorGradient.Gbx'
struct CFuncColorGradient : public CFunc {
  CFuncColorGradient();

  UnnamedEnum ColorSpace;
  vec3 KeyFrameValue0;
  vec3 KeyFrameValue1;
  vec3 KeyFrameValue2;
  vec3 KeyFrameValue3;
  float KeyFramePos1;
  float KeyFramePos2;
};

// File extension: 'FuncFullColorGradient.Gbx'
struct CFuncFullColorGradient : public CFunc {
  CFuncFullColorGradient();

  vec3 KeyFrameValue0;
  vec3 KeyFrameValue1;
  vec3 KeyFrameValue2;
  vec3 KeyFrameValue3;
  float KeyFramePos1;
  float KeyFramePos2;
};

// File extension: 'FuncClouds.Gbx'
struct CFuncClouds : public CFunc {
  CFuncClouds();

  CFuncCloudsSolids* Solids;
  CPlugFileImg* ImageColorMin;
  CPlugFileImg* ImageColorMax;
  CPlugMaterial* MaterialModelToForce;
  CFuncCloudsParam* CloudsParam;
};

struct CCurveInterface : public CMwNod {
};

struct CFuncCurvesReal : public CMwNod {
  CFuncCurvesReal();

  MwId Id;
  MwFastBuffer<float> Xs;
  MwFastBuffer<CFuncKeysReal*> Curves;
};

struct CFuncCurves2Real : public CMwNod {
  CFuncCurves2Real();

  MwId Id;
  MwFastBuffer<float> Xs;
  MwFastBuffer<CFuncCurvesReal*> Curves2;
};

struct CFuncNoise : public CFunc {
  CFuncNoise();

  float ScaleX;
  float ScaleY;
  float ScaleZ;
  float ScaleT;
  float PeriodX;
  float PeriodY;
  float PeriodZ;
  float PeriodT;
  float ValMin;
  float ValMax;
};

struct CFuncDayTime : public CFunc {
  CFuncDayTime();

};

// File extension: 'FuncCloudsParam.Gbx'
struct CFuncCloudsParam : public CFunc {
  CFuncCloudsParam();

  UnnamedEnum HeightCenter;
  vec2 HeightCenterXZ;
  float BottomNearZ;
  MwFastBuffer<float> PointDists;
  MwFastBuffer<float> PointHeights;
  float BottomFarZ;
  float SpeedScale;
  UnnamedEnum Lighting;
  bool MaterialUseT3b;
};

// File extension: 'FuncCloudsSolids.Gbx'
struct CFuncCloudsSolids : public CFunc {
  CFuncCloudsSolids();

  vec2 GridSizeXZ;
  const MwFastBuffer<CPlugSolid*> SolidFids;
};

} // namespace Function

namespace Hms {

struct CHmsCamera : public CHmsPoc {
  CHmsCamera();

  bool PickEnable;
  bool UseViewDependantRendering;
  UnnamedEnum ViewportRatio;
  UnnamedEnum iPrecalcRender;
  iso4 NextLocation;
  void ResetLocation();
  bool IsOverlay3d;
  bool ClearColorEnable;
  vec3 ClearColor;
  bool UseZBuffer;
  bool ScissorEnable;
  bool FovRectEnable;
  bool ClearZBuffer;
  vec2 DrawRectMin;
  vec2 DrawRectMax;
  vec2 ScissorRectMin;
  vec2 ScissorRectMax;
  vec2 FovRectMin;
  vec2 FovRectMax;
  float NearZ;
  float FarZ;
  float Fov;
  float ClampFovX;
  float ClampFovY;
  bool ClampFovAuto;
  float ClampAutoRatioXy;
  float RatioXY;
  CHmsPicker* const Picker;
  const uint GroupIndex;
  float DofFocusZ;
  UnnamedEnum DofLensMode;
  float DofLensFocal;
  float DofLensSize;
  float StereoScreenDist;
  float Desaturate01; // Range: 0 - 1
  float FadeToBlack01; // Range: 0 - 1
  float AsyncPrevDeltaTimeMax;
  float AsyncPrevDeltaRotationScale; // Range: 0 - 1
  float AlphaClipFarZ;
  bool ZClipEnable;
  float ZClipValue;
  float ZClipMargin;
  float ZClipZBuffer1End; // Range: 0 - 1
  float ZClipZBuffer2Start; // Range: 0 - 1
  bool TargetFpsEnable;
  float TargetFpsZClipSpeed; // Range: 0.001 - 1
  float TargetFpsZClipMinValue;
};

struct CHmsCorpus : public CHmsZoneElem {
  CHmsCorpus();

  CHmsItem* const Item;
};

struct CHmsItem : public CMwNod {
  CHmsItem();

  CPlugSolid* Solid;
  CHmsCorpus* const Corpus;
  CMwNod* const SceneMobil;
  bool IsVisionStatic;
  bool IsStatic;
  bool IsBackground;
  bool CopyCameraTranslationXZ;
  bool BackgroundZClipCullBefore;
  bool UseAccurateBBoxTest;
  bool IsForcePointDynamicCollisionResponse;
  uint CountShadowTexCasted;
  bool CanSelfShadow;
  bool CanFakeShadow;
  bool CastShadowGrp0;
  bool CastShadowGrp1;
  bool CastShadowGrp2;
  bool CastShadowGrp3;
  bool RecvShadowGrp0;
  bool RecvShadowGrp1;
  bool RecvShadowGrp2;
  bool RecvShadowGrp3;
  CHmsItemShadow* ItemShadow;
  bool LightLensFlareEnable;
  bool LightEGroup0;
  bool LightEGroup1;
  bool LightEGroup2;
  bool LightEGroup3;
  bool VIdReflected;
  bool VIdReflectMirror;
  bool VIdRefracted;
  bool VIdViewDepBump;
  bool VIdViewDepOcclusion;
  bool VIdOnlyRefracted;
  bool VIdHideWhenUnderground;
  bool VIdFoilage;
  bool VIdHideAlways;
  bool VIdHideButPick;
  bool VIdBackground;
  bool VIdGrassRGB;
  bool VIdLightGenP;
  bool VIdVehicle;
  bool VIdHideOnlyDirect;
  bool VIdInvisibleStopBounce;
  bool IsVisible;
};

struct CHmsZone : public CMwNod {
  CHmsZone();

  bool IsVisible;
  MwFastBufferCat<CHmsCorpus*> CorpusCats;
  bool FogByVertex;
  vec3 FogRGB;
  enum class CHmsZone::EGxFogFormula {
    None = 0,
    Exp = 1,
    Exp2 = 2,
    Linear = 3,
  };
  CHmsZone::EGxFogFormula FogFormula;
  enum class CHmsZone::EGxFogSpace {
    CameraFarZ = 0,
    World = 1,
  };
  CHmsZone::EGxFogSpace FogSpace;
  float FogLinearStart;
  float FogLinearEnd;
  float FogExpDensity;
  CGxFog* Fog;
  MwFastBuffer<CHmsPrecalcRender*> PrecalcRenders;
  const MwFastBufferCat<CHmsCorpusLight*> CorpusLights;
  const MwFastBuffer<CHmsCorpusLight*> CorpusLightsDyna;
  const MwFastBuffer<CHmsLightArray*> DynamicLightArrays;
  const MwFastBuffer<CHmsDecalArray*> DynamicDecalArrays;
  const MwFastBuffer<CHmsDecalArray*> StaticDecalArrays;
  float LocalLightScale;
  bool MRIsForced;
  bool MRMaskWater;
  float MRTileH;
  vec3 MRPoint;
  vec3 MRNormal;
  bool IVIdMaskReflected;
  bool IVIdMaskReflectMirror;
  bool IVIdMaskRefracted;
  bool IVIdMaskViewDepBump;
  bool IVIdMaskViewDepOcclusion;
  bool IVIdMaskOnlyRefracted;
  bool IVIdMaskHideWhenUnderground;
  bool IVIdMaskFoilage;
  bool IVIdMaskHideAlways;
  bool IVIdMaskHideButPick;
  bool IVIdMaskBackground;
  bool IVIdMaskGrassRGB;
  bool IVIdMaskLightGenP;
  bool IVIdMaskVehicle;
  bool IVIdMaskHideOnlyDirect;
  bool IVIdMaskInvisibleStopBounce;
  bool IVIdRefReflected;
  bool IVIdRefReflectMirror;
  bool IVIdRefRefracted;
  bool IVIdRefViewDepBump;
  bool IVIdRefViewDepOcclusion;
  bool IVIdRefOnlyRefracted;
  bool IVIdRefHideWhenUnderground;
  bool IVIdRefFoilage;
  bool IVIdRefHideAlways;
  bool IVIdRefHideButPick;
  bool IVIdRefBackground;
  bool IVIdRefGrassRGB;
  bool IVIdRefLightGenP;
  bool IVIdRefVehicle;
  bool IVIdRefHideOnlyDirect;
  bool IVIdRefInvisibleStopBounce;
  bool SVIdMaskReflected;
  bool SVIdMaskReflectMirror;
  bool SVIdMaskRefracted;
  bool SVIdMaskViewDepBump;
  bool SVIdMaskViewDepOcclusion;
  bool SVIdMaskOnlyRefracted;
  bool SVIdMaskHideWhenUnderground;
  bool SVIdMaskFoilage;
  bool SVIdMaskHideAlways;
  bool SVIdMaskHideButPick;
  bool SVIdMaskBackground;
  bool SVIdMaskGrassRGB;
  bool SVIdMaskLightGenP;
  bool SVIdMaskVehicle;
  bool SVIdMaskHideOnlyDirect;
  bool SVIdMaskInvisibleStopBounce;
  bool SVIdRefReflected;
  bool SVIdRefReflectMirror;
  bool SVIdRefRefracted;
  bool SVIdRefViewDepBump;
  bool SVIdRefViewDepOcclusion;
  bool SVIdRefOnlyRefracted;
  bool SVIdRefHideWhenUnderground;
  bool SVIdRefFoilage;
  bool SVIdRefHideAlways;
  bool SVIdRefHideButPick;
  bool SVIdRefBackground;
  bool SVIdRefGrassRGB;
  bool SVIdRefLightGenP;
  bool SVIdRefVehicle;
  bool SVIdRefHideOnlyDirect;
  bool SVIdRefInvisibleStopBounce;
  uint VPackerC3CellX;
  uint VPackerC3CellY;
  uint VPackerC3CellZ;
  const float VPackerPercentCellUsed;
  const float VPackerAverageObjectPerCell;
  const float VPackerAveragePackPerCell;
  const float VPackerAverageKVertPerPack;
  const float VPackerPercentObjectOutside;
  const uint VPackerObjectInside;
  const uint VPackerObjectOutside;
  const uint VPackerNbUnpackableVSpace;
  void VPackerForceBBoxUpdate();
  void VPackerLogUsageStats();
  void ForceUpdate_ReflectLQ();
  void TestDynaSpriteMgr();
  CPlugBitmap* BitmapWaterFog;
  CPlugBitmap* BitmapCubeReflectHardSpecA;
  CPlugBitmap* BitmapCubeReflectHdrAlpha2;
  CMwNod* const UserData;
};

struct CHmsPortal : public CMwNod {
  CHmsPortal();

  bool IsActive;
  bool NeedClipping2D;
  bool NeedClipping3D;
  bool CanSeeThrough;
  float SeeThroughOpacity; // Range: 0 - 1
  bool IsVisualVisible;
  bool IsPickingPossible;
  bool CanPassThrough;
  bool SoundCanPassThrough;
  bool IsDirectPathSet;
  int DirectOcclusion;
  float DirectOcclusionSpectralRatio;
  float DirectOcclusionRatio;
  int IndirectOcclusion;
  float IndirectOcclusionSpectralRatio;
  float IndirectOcclusionRatio;
  int IndirectObstruction;
  float IndirectObstructionSpectralRatio;
};

struct CHmsPoc : public CHmsZoneElem {
  CHmsPoc();

  bool IsActive;
};

struct CHmsZoneElem : public CMwNod {
  CHmsZoneElem();

  CHmsZone* const Zone;
  iso4 Location;
  vec3 Vel;
};

struct CHmsZoneOverlay : public CHmsZone {
  CHmsZoneOverlay();

  enum class CHmsZoneOverlay::EnablePick {
    Disabled = 0,
    Foreground = 1,
    Always = 2,
  };
  CHmsZoneOverlay::EnablePick PickEnableMode;
  UnnamedEnum AdaptRatio;
  bool UseZBuffer;
  vec2 DrawRectMin;
  vec2 DrawRectMax;
  vec3 FrustumCenter;
  vec3 FurstrumHfDiag;
  const uint SortOrder;
  bool DescIsClearColorEnable;
  bool DescIsClearDepthEnable;
  bool DescIsClearStencilEnable;
  vec3 DescClearColor;
  MwFastBuffer<CHmsCorpus*> CorpusVisibles;
  CHmsCamera* In3d_Camera;
  bool StickToHmd;
};

struct CHmsLight : public CHmsPoc {
  CHmsLight();

  UnnamedEnum UpdateType;
  GxLight* const MainGxLight;
  CPlugBitmap* BitmapFlare;
  CPlugBitmap* BitmapSprite;
  CPlugBitmap* BitmapProjector;
  CHmsCorpusLight* CorpusLight;
  CHmsItem* const ItemContainer;
  bool ForceShadowGroup;
  uint ForceShadowGroupIndex;
  bool NeverSkipShadow;
};

struct CHmsPortalProperty : public CMwNod {
  CHmsPortalProperty();

  CHmsPortal* const Portal1;
  CHmsPortal* const Portal2;
  bool Visibility;
  bool Audibility;
};

struct CHmsCorpusLight : public CHmsZoneElem {
  CHmsCorpusLight();

  CHmsLight* Light;
};

struct CHmsViewport : public CMwNod {
  const wstring DisplayName;
  const uint PixelCountX;
  const uint PixelCountY;
  enum class CPlugShaderWrapper::ERenderDevice {
    PC0 = 0,
    PC1 = 1,
    PC2 = 2,
    PC3 = 3,
  };
  CPlugShaderWrapper::ERenderDevice DeviceKind;
  uint iSubDevice;
  UnnamedEnum PC3_Quality;
  enum class CHmsViewport::ECPlugBitmap {
    PC0 = 0,
    PC1 = 1,
    PC2 = 2,
    PC3 = 3,
  };
  CHmsViewport::ECPlugBitmap BitmapQuality;
  UnnamedEnum MultiSampleType;
  UnnamedEnum DeferredAA;
  UnnamedEnum MaxFiltering;
  uint AnisotropicLevel;
  uint DisplaySyncIntervalCount;
  bool EnableTripleBuffer;
  bool ArePortalsActive;
  uint PortalMaxRecur;
  bool IsPickingPossible;
  const uint TimeTickToPresent;
  const uint TimeQueryIssueToFinish;
  bool TargetFpsEnable;
  uint TargetFps;
  float TargetFpsMinScaleZ; // Range: 0.001 - 1
  float TargetFpsMaxScaleZ; // Range: 1 - 50
  float TargetFpsSpeed; // Range: 0.001 - 1
  const float AverageFps;
  float MipScaleZ_SysConfig;
  float MipScaleZ_Production;
  const float MipScaleZ;
  UnnamedEnum TextureRender;
  bool ShadowCastBack;
  UnnamedEnum RenderShadows;
  UnnamedEnum RenderProjectors;
  bool PreLoadProjectors;
  bool EnableLightFlares;
  bool RenderZoneVPacker;
  UnnamedEnum SelectTnL;
  bool EnableTessellation;
  bool IsPureDevice;
  UnnamedEnum FullScreenModeIndex;
  UnnamedEnum FullScreenRefreshRate;
  float FullScreenBrightness; // Range: -1 - 1
  float FullScreenContrast; // Range: -1 - 1
  float FullScreenGamma; // Range: -1 - 1
  const MwFastBuffer<wstring> DisplayNames;
  const wstring ScreenShotFullName;
  bool ScreenShotForceRes;
  uint ScreenShotWidth;
  uint ScreenShotHeight;
  bool ScreenShotUseAlpha;
  uint ScreenShotTileX;
  uint ScreenShotTileY;
  UnnamedEnum PixelOutput;
  void ScreenShotDoCaptureBMP();
  void ScreenShotDoCaptureJPG();
  void ScreenShotDoCapturePNG();
  void ScreenShotDoCaptureDDS();
  void ShaderConstantLogBindedValues();
  void LogHlslFromFixedVertex();
  MwFastBuffer<CHmsZoneOverlay*> Underlays;
  MwFastBuffer<CHmsCamera*> Cameras;
  MwFastBuffer<CHmsZoneOverlay*> Overlays;
  CSystemConfig* SystemConfig;
  CSystemWindow* const SystemWindow;
  CHmsPicker* const Picker;
  CHmsConfig* Config;
  CHmsAmbientOcc* HmsAmbientOcc;
  UnnamedEnum AmbientOcc;
  bool MgrParticle_UseCameraMotion;
  bool MgrParticle_PauseKeepCameraMotion;
};

struct CHmsPrecalcRender : public CMwNod {
  CHmsPrecalcRender();

  CPlugBitmap* BitmapRGB;
  CPlugBitmap* BitmapDepth;
  enum class CHmsPrecalcRender::EBitmapDepth {
    Linear = 0,
    ZBuffer = 1,
  };
  CHmsPrecalcRender::EBitmapDepth BitmapDepthMode;
  string TreeIdDepthGen;
  const bool IsTreeDepthGenFound;
  float ZoomFactor;
  float ScrollPosX; // Range: -1 - 1
  float ScrollPosY; // Range: -1 - 1
};

struct CHmsShadowGroup : public CMwNod {
  CHmsShadowGroup();

  uint TexelCountX;
  uint TexelCountY;
  uint MaxShadowCountGrp0;
  float MappingQuality;
  float MaxTexelPerMeter;
  bool Enable;
  bool EnableLightDir;
  bool EnableLightPos;
  bool GameAllowLightDir;
  bool GameAllowLightPos;
  float LocalIntensity; // Range: 0 - 1
  bool NeedSelfShadow;
  bool ForceShadowMask;
  bool DepthNeed32b;
  bool IsStatic;
  bool IsStaticDirty;
  bool ForceWorldAlign;
  bool UseHqCasterBBox;
  bool AllStaticItemAreCaster;
  bool ShadowInShader;
  bool TmBackgroundReceives;
  bool TmBackgroundCast;
  bool DepthTestMaskRender;
  UnnamedEnum DepthBiasScale;
  uint DepthBiasConst;
  float DepthBiasSlope;
  float DepthBiasConstShaderExtra;
  float ShadeSlope; // Range: 0 - 1
  float Soft2dSlope; // Range: 0 - 2
  vec2 SoftSizeInW;
  float OpacityMipMapLodBias;
  uint MaskBlurTexelCount;
  uint PssmTexelCountX;
  uint PssmTexCount;
  const uint PssmTexCountActive;
  float PssmOverlapIn01; // Range: 0 - 1
  float PssmDistNF0;
  float PssmDistNF1;
  float PssmDistNF2;
  float PssmDistNF3;
  float PssmDistNF4;
  float PssmDistScale;
  float PssmSkipCmpStaticScale;
};

struct CHmsViewportPerfDbg : public CMwNod {
  bool UseAverage;
  bool ShowMem;
  bool ForceOcclusion;
  UnnamedEnum ShowFps;
  UnnamedEnum Profile;
  UnnamedEnum SumUp;
  UnnamedEnum VisionSkip;
  bool SmallShader;
  bool SmallScissor;
  bool DebugParticle;
  UnnamedEnum FillForced;
  bool IsFillRateEnable;
  bool IsFillRateZTestEnable;
  bool IsFillRateStencilTestEnable;
  bool IsFillRateNoMipMapEnable;
  bool IsFillRateLegendEnable;
};

struct CHmsMgrVisDyna : public CMwNod {
};

struct CHmsFogPlane : public CHmsZoneElem {
  CHmsFogPlane();

};

struct CHmsPicker : public CMwNod {
  CHmsPicker();

  bool IsEnable;
  const vec2 InputPos;
  CHmsCamera* const Camera;
  CHmsZoneOverlay* const Overlay;
  const vec2 PosRect;
  const vec3 RayDir;
  const vec3 RayPos;
  const uint In3dQuadIndex;
  CMwNod* const PickedUserData;
  CHmsCorpus* const Corpus;
  CPlugTree* const Tree;
  CPlugSolid2Model* const Solid2Model;
  const uint VisDynaHandle;
  const vec3 PickPosV;
  const vec3 PickPosZ;
  const vec3 PickNormalV;
  const vec3 PickNormalZ;
  const float PickZ;
  const float PickZNoBiasZ;
  const float Depth;
};

struct CHmsConfig : public CMwNod {
  CHmsConfig();

  bool FreezeViewportRun;
  uint ViewportRunFrameCount;
  const uint ViewportRunFrameRemaining;
  const MwFastArray<CHmsShadowGroup*> ShadowGroups;
};

struct CHmsItemShadow : public CMwNod {
  CHmsItemShadow();

  float Intensity; // Range: 0 - 1
  float FallOffStart;
  float FallOffEnd;
  float VolumeMaxZ;
  CHmsShadowGroup* GroupOverride;
};

// File extension: 'LightMap.Gbx'
struct CHmsLightMap : public CMwNod {
  CHmsLightMap();

};

struct CHmsLightMapCache : public CMwNod {
  CHmsLightMapCache();

};

// File extension: 'LightMapMood.Gbx'
struct CHmsLightMapMood : public CMwNod {
  CHmsLightMapMood();

};

struct CHmsLightMapAlloc : public CMwNod {
  CHmsLightMapAlloc();

};

struct CHmsCorpus2d : public CHmsCorpus {
  CHmsCorpus2d();

  uint ClipRectIndex;
  uint In3dQuadIndex;
};

struct CHmsAmbientOcc : public CMwNod {
  CHmsAmbientOcc();

};

struct CHmsLightProbeGrid : public CMwNod {
};

struct CHmsLightMapCacheSH : public CMwNod {
  CHmsLightMapCacheSH();

};

struct CHmsDynaZone : public CMwNod {
  const uint AllocatedByteCount;
  const uint UsedByteCount;
  const uint cDynaItem;
  const vec3 Gravity;
  float ReplacementEpsilon;
};

struct CHmsCollZone : public CMwNod {
  void UpdateStatic();
  const uint AllocatedByteCount;
  const uint UsedByteCount;
  const uint cItemStatic;
  const uint cItemContinuous;
  const uint cItemDiscrete;
  const uint cSurfaceStatic;
  const uint cSurfaceContinuous;
  const uint cSurfaceDiscrete;
  vec3 WarpExclusionBoxCenter;
  vec3 WarpExclusionBoxHalf;
  float CellSize;
  float CellHeight;
  float AgentHeight;
  float AgentRadius;
  float AgentMaxClimb;
  float RegionMinSize;
  float RegionMergeSize;
  float EdgeMaxLen;
  float EdgeMaxError;
  float DetailSampleDist;
  float DetailSampleMaxError;
  float AgentMaxSlope;
  int VertsPerPoly;
  bool MonotonePartitioning;
  uint TileCountX;
  uint TileCountZ;
  bool PartialNavMesh;
  vec3 PartialNavMeshBBMin;
  vec3 PartialNavMeshBBMax;
};

struct CHmsLightMapParam : public CMwNod {
  CHmsLightMapParam();

};

struct CHmsLightArray : public CMwNod {
  CHmsLightArray();

};

struct CHmsDecalArray : public CMwNod {
  CHmsDecalArray();

};

struct CHmsLightProbePartition : public CMwNod {
};

struct CHmsMgrVisEnvMap : public CMwNod {
};

struct CHmsMgrVisDynaDecal2d : public CMwNod {
};

struct CHmsMgrVisParticle : public CMwNod {
};

struct CHmsVisMiniMap : public CMwNod {
};

} // namespace Hms

namespace Control {

struct CControlBase : public CSceneToy {
  void Draw();
  void Clean();
  UnnamedEnum AlignHorizontal;
  UnnamedEnum AlignVertical;
  CControlStyle* Style;
  bool IsReadOnly;
  bool AddFocusArea;
  bool DrawBackground;
  bool InheritVisualStyle;
  bool KeepFocusWeak;
  const uint ClipRectAllocatedIndex;
  const uint ClipRectCurrentIndex;
  bool DisableI18n;
  const bool HasSolid;
  bool IsSubSolid;
  bool IsDynamic;
  bool IsFocused;
  bool IsSelected;
  bool IsHiddenExternal;
  const bool IsVisualFocus;
  const bool IsVisualSelect;
  CControlContainer* const Parent;
  CMwNod* Nod;
  string StackText;
  wstring ToolTip;
  const bool IsHiddenInternal;
  const bool IsFocusCaptured;
  const bool IsStackNeeded;
  bool IsCreatedByScript;
  CPlugTree* ControlDisplayTree;
  CPlugTree* ControlDrawTree;
  vec2 BoxMin;
  vec2 BoxMax;
  CControlLayout* Layout;
  const float ClipLength;
  void OnAction();
};

struct CControlContainer : public CControlBase {
  MwFastArray<CControlBase*> Childs;
  bool IsClippingContainer;
  CMwCmdBlockMain* CreateScript;
  bool UseScript;
  bool AcceptOwnControls;
  CControlBase* AddControl(string Id, vec3 Position, string Label, CMwNod* Nod, string Stack, string Type, CControlStyle* Style);
  CControlBase* AddInstance(CControlBase* Model, string Id, vec3 Position);
  CControlLabel* AddLabel(string Id, vec3 Position, string Label, CControlStyle* Style);
  CControlButton* AddButtonScript(string Id, vec3 Position, string Label, CMwCmdBlockMain* Script, CControlStyle* Style);
  void RemoveControl(CControlBase* Control);
};

struct CControlEffectSwitchStyle : public CControlEffect {
  CControlEffectSwitchStyle();

  CControlStyle* FocusedStyle;
};

// File extension: 'UiElement.gbx'
struct CControlUiElement : public CControlForm {
  CControlUiElement();

  CMwRefBuffer* const Resources;
};

struct CControlEffect : public CMwNod {
};

struct CControlLabel : public CControlText {
  CControlLabel();

  wstring Label;
  CPlugBitmap* Bitmap;
  CPlugShaderApply* ExternalShader;
  vec3 ImageColor;
  float ImageAlpha; // Range: 0 - 1
  bool DontDrawText;
};

struct CControlButton : public CControlText {
  CControlButton();

  wstring Label;
  CPlugSound* ActionSound;
  CFuncEnum* Icons;
  UnnamedEnum DisplayType;
  CMwCmdBlockMain* ActionScript;
  uint SubIconIndexOff;
  uint SubIconIndexOn;
  string IconId;
};

struct CControlEntry : public CControlText {
  CControlEntry();

  wstring String;
  uint MaxLength;
  UnnamedEnum Type;
  bool IsPassword;
  bool IsNewPassword;
  bool ValidateOnLostFocus;
  bool SelectAllOnFocusGained;
};

struct CControlEnum : public CControlText {
  CControlEnum();

  CFuncEnum* FuncEnum;
  bool IsLooping;
  UnnamedEnum DisplayType;
  void Incr();
  void Decr();
  uint EnumIndex;
  const string EnumString;
};

struct CControlSlider : public CControlBase {
  CControlSlider();

  enum class CControlSlider::EAxis {
    X = 0,
    Y = 1,
  };
  CControlSlider::EAxis Axis;
  float Ratio;
  MwId IconIdBar;
  MwId IconIdCursor;
  bool AutoSize;
};

// File extension: 'ControlLayout.Gbx'
struct CControlLayout : public CMwNod {
  CControlLayout();

  UnnamedEnum AlignHorizontal;
  UnnamedEnum AlignVertical;
  float RatioHorizontal;
  float RatioVertical;
  float PaddingHorizontal;
  float PaddingVertical;
};

// File extension: 'ListItem.Gbx'
struct CControlListItem : public CMwNod {
  CControlListItem();

  const string Str1;
  const string Str2;
  const string Str3;
  const string Str4;
  const string Str5;
  const string Str6;
  const string Str7;
  const wstring StrInt1;
  const wstring StrInt2;
  const wstring StrInt3;
  const wstring StrInt4;
  const uint Nat1;
  const uint Nat2;
  const uint Nat3;
  const uint Nat4;
  const uint Nat5;
  const uint Nat6;
  const uint Time1;
  const uint Time2;
  const uint Time3;
  const float Real1;
  const float Real2;
  const float Real3;
  vec2 MapCoordOrigin;
  vec2 MapCoordTarget;
  CMwNod* const Nod1;
  CMwNod* const Nod2;
  CMwNod* const Nod3;
  bool IsSelected;
};

// File extension: 'UiElement.gbx'
struct CControlUiDockable : public CControlUiElement {
  CControlUiDockable();

  void Close();
  void Open();
  void Switch();
  bool IsClosed;
  bool IsOpened;
  const MwFastBuffer<CControlForm*> Screens;
  void NextScreen();
  void PrevScreen();
  uint CurScreen;
  void CreateRotate(vec3 Axis, float MinAngle, float MaxAngle);
  void CreateTranslate(vec3 StartPoint, vec3 EndPoint);
  CControlForm* AddScreen(string Id);
};

struct CControlList : public CControlFrame {
  CControlList();

};

// File extension: 'ControlEffect.Gbx'
struct CControlEffectSimi : public CControlEffect {
  CControlEffectSimi();

  bool IsInterpolated;
  bool Centered;
  UnnamedEnum ColorBlendMode;
  bool IsContinousEffect;
  const uint KeyCount;
  uint CurrentKey;
  void InsertKey();
  void RemoveKey();
  float Time;
  float Rot;
  vec2 Pos;
  vec2 Scale;
  float Depth;
  float Opacity;
  float ColorBlend;
  vec3 Color;
};

// File extension: 'ControlEffect.Gbx'
struct CControlEffectMotion : public CControlEffect {
  CControlEffectMotion();

  CPlugParticleEmitterModel* ParticleEmitterModel;
  MwId ParticleEmitterId;
  float Period;
  CFuncEnvelope* Envelope;
  float EnveloppePosStart;
  float EnveloppePosCharged;
  float IntensityStart;
  float IntensityCharged;
  float SpeedStart;
  float SpeedCharged;
  vec3 SpeedDirection;
  float ChargeTime;
  vec3 EmitterPosOffset;
};

struct CControlForm : public CControlContainer {
  CControlForm();

  void ClearCache();
};

struct CControlOverlay : public CControlBase {
  CControlOverlay();

  CScene3d* Scene;
  CSceneCamera* const Camera;
};

struct CControlUiRange : public CControlBase {
  CControlUiRange();

  float BlockOverlapRatio; // Range: 0 - 1
  float BackgroundMargin; // Range: 0 - 1
  bool DrawBackground;
  bool DrawBlockBackground;
  MwId IconId;
  bool CenteredBar;
  vec3 Color;
  float ColorAlpha; // Range: 0 - 1
  vec3 Color2;
  float Color2Alpha; // Range: 0 - 1
  float Ratio; // Range: 0 - 1
  uint UnitMax;
  uint Unit1;
  uint Unit2;
  float GradingRatio;
  float Scaling; // Range: 0.1 - 10
  bool LastGradingIsGhostlike;
  void CreateTranslate(vec3 StartPoint, vec3 EndPoint);
  void CreateRotate(vec3 Axis, float MinAngle, float MaxAngle);
};

struct CControlGrid : public CControlContainer {
  CControlGrid();

  MwFastArray<vec2> ChildsSquares;
  MwFastArray<string> ChildsSquaresParam;
  CControlLayout* MainLayout;
  bool PackEmptyRows;
  float ForceColumnsUniformWidth;
  float ForceRowsUniformHeight;
  MwFastBuffer<float> ForceColumnsWidths;
  float HorizontalSkewOffset;
  float VerticalSkewOffset;
  bool PagedGrid_Enable;
  uint PagedGrid_NbLinesPerPage;
  uint PagedGrid_FastPageStep;
  uint CurrentPage;
  uint PageCount;
  void OnNextPage();
  void OnPrevPage();
  void OnFastPrevPage();
  void OnFastNextPage();
  void OnFirstPage();
  void OnLastPage();
};

// File extension: 'Frame.Gbx'
struct CControlFrame : public CControlContainer {
  CControlFrame();

  MwFastArray<iso4> ChildsRelativeLocations;
};

// File extension: 'ControlStyle.Gbx'
struct CControlStyle : public CPlug {
  CControlStyle();

  CPlugFont* Font;
  float FontHeight;
  float FontRatioXY;
  UnnamedEnum LabelColorFromPalette;
  vec3 LabelColor;
  float LabelColorAlpha; // Range: 0 - 1
  bool LabelForceEmbossed;
  bool LabelDisableSqueeze;
  wstring LabelCharAttributes;
  UnnamedEnum EditableColorFromPalette;
  vec3 EditableColor;
  float EditableColorAlpha; // Range: 0 - 1
  bool EditableForceEmbossed;
  bool EditableDisableSqueeze;
  wstring EditableCharAttributes;
  UnnamedEnum GrayedColorFromPalette;
  vec3 GrayedColor;
  float GrayedColorAlpha; // Range: 0 - 1
  bool GrayedForceEmbossed;
  bool GrayedDisableSqueeze;
  wstring GrayedCharAttributes;
  bool FitTextSize;
  float Skew; // Range: -1 - 1
  CPlugShader* DefaultShader;
  CMwCmdBlockMain* FocusGainedScript;
  CMwCmdBlockMain* FocusLostScript;
  CPlugSound* FocusSound;
  CPlugSound* ActionSound;
  CPlugSound* ActionBackSound;
  CFuncEnum* ButtonDefaultIcons;
  MwId ButtonDefaultIconId;
  float ButtonIconWidth;
  float ButtonIconHeight;
  CPlugShader* EnumSound;
  CPlugShader* EnumListShader;
  uint EnumMaxElemCount;
  float EnumIconWidth;
  float EnumIconHeight;
  UnnamedEnum EnumForceDisplayType;
  CFuncEnum* EnumForceIcons;
  float QuadZ;
  bool QuadIsLines;
  bool QuadIsFill;
  float QuadZLines;
  vec3 QuadGradientColor0;
  float QuadGradientColor0Alpha; // Range: 0 - 1
  vec3 QuadGradientColor1;
  float QuadGradientColor1Alpha; // Range: 0 - 1
  vec3 LineGradientColor0;
  float LineGradientColor0Alpha; // Range: 0 - 1
  vec3 LineGradientColor1;
  float LineGradientColor1Alpha; // Range: 0 - 1
  vec3 QuadLinesColor;
  float QuadLinesColorAlpha; // Range: 0 - 1
  vec2 Quad_UvTopLeft;
  vec2 Quad_UvBottomRight;
  float SliderBarWidth;
  float SliderBarHeight;
  float SliderCursorWidth;
  float SliderCursorHeight;
  CFuncEnum* SliderBarIcons;
  CFuncEnum* SliderCursorIcons;
  CPlugSound* SliderSound;
  bool FocusAreaEnable;
  CPlugMaterial* FocusAreaMaterial;
  CPlugMaterial* FocusAreaMaterialReadOnly;
  CPlugMaterial* FocusAreaMaterialSelected;
  CPlugMaterial* FocusAreaMaterialFocused;
  float FocusAreaMinWidth;
  float FocusAreaMinHeight;
  float FocusAreaXMargin;
  float FocusAreaYMargin;
  float FocusAreaZOffset;
  CPlugSolid* FocusAreaSolid;
  CControlEffectMaster* EffectMaster;
};

struct CControlField2 : public CControlBase {
  CControlField2();

  UnnamedEnum ControlMode;
  UnnamedEnum DisplayMode;
  UnnamedEnum RenderMode;
  float ArrowRatio; // Range: 0 - 1
  float DisplaySize;
  UnnamedEnum IntensityPaintMode;
  UnnamedEnum DirectionPaintMode;
  float BrushSize; // Range: 0 - 1
  float BrushIntensity; // Range: 0 - 1
  float BrushDirection; // Range: -3.14159 - 3.14159
  vec2 DeltaDebug;
  float RotationModifSpeed;
  float ScaleModifSpeed;
  bool IsInterpolate;
  bool IsIntensityInArrowSize;
  vec3 ArrowColor;
  vec3 ArrowColorMin;
  vec3 ArrowColorMax;
  bool IsDisplayFieldRect;
  bool IsDisplayDrawRect;
  uint DisplaySkipLevel;
  bool IsAutoDisplaySkipLevel;
};

// File extension: 'ControlUrlLinks.Gbx'
struct CControlUrlLinks : public CControlBase {
  CControlUrlLinks();

  void ForceDirty();
  uint CurFocusedLink;
};

struct CControlTimeLine : public CControlBase {
  CControlTimeLine();

};

struct CControlQuad : public CControlBase {
  CControlQuad();

  bool IsLines;
  bool IsFill;
  UnnamedEnum GradientDir;
  MwId IconId;
  vec3 IconVertexColors;
  float IconVertexAlpha; // Range: 0 - 1
};

// File extension: 'ControlEffectMaster.Gbx'
struct CControlEffectMaster : public CMwNod {
  CControlEffectMaster();

  CControlEffect* FocusEffect;
  CControlEffect* FocusGainedEffect;
  CControlEffect* FocusLostEffect;
  CControlEffect* FocusGainedByAnotherEffect;
  CControlEffect* FocusLostByAnotherEffect;
  CControlEffect* SleepingEffect;
  CControlEffect* ShowingEffect;
  CControlEffect* HidingEffect;
  CControlEffect* ActionEffect;
  CControlEffect* ManagedEffect;
  bool UseRefBBox;
  bool ShowActivated;
  bool HideActivated;
  CMwRefBuffer* SpecialEffect;
};

struct CControlCredit : public CControlFrame {
  CControlCredit();

  const bool Constructed;
  const bool IsFinished;
  const bool AnimEnabled;
  const float LocalTimer;
  float Speed;
  void Start();
  void Stop();
  void Rewind();
  CControlStyle* StyleBlock;
  CControlStyle* StyleTitle;
  CControlStyle* StyleSubTitle;
  CControlStyle* StyleText;
  CControlLayout* GlobalLayout;
  CControlLayout* BlocksLayout;
};

struct CControlColorChooser : public CControlFrame {
  CControlColorChooser();

  UnnamedEnum StyleType;
  vec2 ColorChooserSize;
  vec3 Color;
  const float Hue; // Range: 0 - 1
  CPlugShader* ColorChooserShader;
};

struct CControlColorChooser2 : public CControlFrame {
  CControlColorChooser2();

  vec3 Color;
  CControlColorChooser* const ColorChooserHue;
  CControlColorChooser* const ColorChooserSV;
};

struct CControlSimi2 : public CMwNod {
  CControlSimi2();

  float PosX;
  float PosY;
  float Rot;
  float ScaleX;
  float ScaleY;
};

struct CControlTimeLine2 : public CControlBase {
  CControlTimeLine2();

  uint TrackCount;
  uint TrackStart;
  float TimeMin;
  float TimeMax;
  float RulerLength;
  float Width;
  float Height;
  float TrackHeight;
  float BlockHeight;
  float RulerHeight;
  float TimeCursorWidth;
  float TimeCursorHeight;
  float KeyHeight;
  float KeyWidth;
  float KeyHighLightHeight;
  float KeyHighLightWidth;
  vec3 RulerLinesColorBig;
  vec3 RulerLinesColorSmall;
  vec3 TrackSeparationColor;
  vec3 BlockColor;
  vec3 TimeCursorLineColor;
  vec3 BgColor;
  vec3 RulerBgColor;
  vec3 BlockHighLightColor;
  vec3 KeyColor;
  vec3 KeyHighLightColor;
  vec3 KeyFocusColor;
  vec3 DeadZoneColor;
  void CreateSampleData();
  float Time;
};

// File extension: 'ControlEffect.Gbx'
struct CControlEffectCombined : public CControlEffect {
  CControlEffectCombined();

  CMwRefBuffer* Effects;
};

struct CControlDisplayGraph : public CControlBase {
  CControlDisplayGraph();

  void AddAutoVal(CMwNod* Nod, string Param, uint DisplayMode, vec3 Color, float MinRange, float MaxRange);
  void AddConstant(float Value, vec3 Color);
};

// File extension: 'ControlEffectMoveFrame.Gbx'
struct CControlEffectMoveFrame : public CControlEffect {
  CControlEffectMoveFrame();

  vec2 DefaultShift;
  float Period;
  void AddChildShift();
  void RemoveChildShift();
  bool IsInverse;
  vec3 AngleFrom;
};

// File extension: 'FrameStyled.Gbx'
struct CControlFrameStyled : public CControlFrame {
  CControlFrameStyled();

  CControlStyleSheet* StyleSheet;
};

// File extension: 'StyleSheet.Gbx'
struct CControlStyleSheet : public CPlug {
  CControlStyleSheet();

  CMwRefBuffer* Buffer;
  CControlStyle* MasterStyle;
  MwFastBuffer<CMwNod*> Overrides;
  CControlStyle* PagerIconStyle;
  CControlStyle* PagerTextStyle;
  CControlStyle* PagerTextBackgroundStyle;
  MwFastArray<vec3> Colors;
  MwFastArray<float> ColorsAlpha;
};

struct CControlListMap : public CControlList {
  CControlListMap();

  CPlugBitmap* Bitmap;
  string StackTextTargetCoord;
  string StackTextOriginCoord;
  vec2 MapRectMin;
  vec2 MapRectMax;
};

struct CControlListMap2 : public CControlFrame {
  CControlListMap2();

  CPlugBitmap* Bitmap;
  CPlugMaterial* Material;
  vec2 MapRectMin;
  vec2 MapRectMax;
  CControlStyle* StyleElem;
  CControlStyle* StyleHelper1;
  CControlStyle* StyleHelper1Elem;
  CControlStyle* StyleHelper2;
  CControlStyle* SpecialStyleElem;
  CControlStyle* SpecialStyleHelper1;
  CControlStyle* SpecialStyleHelper1Elem;
  CControlStyle* SpecialStyleHelper2;
  string StackTextElem;
  string StackTextElemCoord;
  string StackTextHelper1;
  string StackTextHelper1Coord;
  string StackTextHelper1Elem;
  string StackTextHelper1ElemCoord;
  string StackTextHelper2;
  string StackTextHelper2Coord;
  string SpecialElemName;
  uint Helper1EnableIconIndex;
  uint Helper1DisableIconIndex;
};

struct CControlCurve : public CControlBase {
  CControlCurve();

  CCurveInterface* Curve;
  bool AreControlPointsVisible;
  vec3 CurveColor;
  vec3 ControlPointsColor;
  vec3 SelectedControlPointColor;
  uint CurrentLayer;
  const uint LayersCount;
  uint SelectedControlPoint;
  uint CurvePrecision;
  float CurveHalfWidth;
  bool UseSnapping;
  float GridX;
  float GridY;
  float StartX;
  float EndX;
  float StartY;
  float EndY;
  CPlugTree* const CurveTree;
  CPlugVisualIndexedLines* const CurveVisual;
  CPlugVisualIndexedLines* const ControlPointVisual;
  CPlugShaderGeneric* const ControlPointShader;
  CPlugShaderGeneric* const SelectedControlPointShader;
  enum class CControlCurve::ECurveDrawMode {
    Steps = 0,
    Linear = 1,
    Smooth = 2,
  };
  CControlCurve::ECurveDrawMode CurveDrawMode;
  vec2 ScreenToControlSpace(vec2 PosInScreenSpace);
};

struct CControlMediaPlayer : public CControlFrame {
  CControlMediaPlayer();

  CPlugFileSnd* const MediaAudio;
  CPlugFileVideo* const MediaVideo;
};

struct CControlRadar : public CControlBase {
  CControlRadar();

  CMwRefBuffer* Resources;
  CScene2d* const Overlay;
  CSceneMobil* const Screen;
  float Scale;
  bool FollowOnlyPosition;
  void AddDummyMobil();
};

// File extension: 'MediaItem.Gbx'
struct CControlMediaItem : public CMwNod {
  CControlMediaItem();

  CPlugBitmap* BitmapFid;
};

struct CControlGraph : public CControlBase {
  CControlGraph();

  vec2 ValuesMin;
  vec2 ValuesMax;
  uint SampleCount;
  bool SampleKeys;
  MwFastBuffer<CFuncKeysReal*> Curves;
};

// File extension: 'Pager.Gbx'
struct CControlPager : public CControlFrame {
  CControlPager();

  string StackPageCountText;
  bool UseCounter;
  bool UseCounterQuadBackground;
  bool UseUpDown;
  bool UseFastPrevNext;
  bool UseFirstLast;
  uint FastPrevNextIncrement;
  CControlLabel* LabelPageCounter;
  CControlQuad* QuadPageCounter;
  CControlButton* ButtonPrevPage;
  CControlButton* ButtonNextPage;
  CControlButton* ButtonFastPrevPage;
  CControlButton* ButtonFastNextPage;
  CControlButton* ButtonFirstPage;
  CControlButton* ButtonLastPage;
  void OnPrevPage();
  void OnNextPage();
  void OnFastPrevPage();
  void OnFastNextPage();
  void OnFirstPage();
  void OnLastPage();
};

struct CControlText : public CControlBase {
  float ClipLength;
  int MaxLine;
  UnnamedEnum TextMode;
  CPlugTree* const TextTree;
};

// File extension: 'FrameAnimated.Gbx'
struct CControlFrameAnimated : public CControlFrame {
  CControlFrameAnimated();

  float ScrollVerticalDistance;
  float ScrollHorizontalDistance;
  float ScrollPeriod;
  float ScrollCycleTime;
  bool DoScrolling;
  float ScrolledVerticalDistance;
  float ScrolledHorizontalDistance;
  float ScrollVerticalHistory;
  float ScrollHorizontalHistory;
};

struct CControlToolTipManager : public CMwNod {
};

struct CControlScriptEditor : public CControlBase {
  CControlScriptEditor();

  wstring Text;
  bool ShowLineNumbers;
  vec3 ShowLineNuKeywordColormbers;
  vec3 OperatorColor;
  vec3 ConstantColor;
  vec3 CommentColor;
  vec3 ClassNameColor;
  vec3 IdentColor;
  vec3 OthersColor;
  vec3 DirectiveColor;
  vec3 UnexpectedColor;
  string Colors;
};

struct CControlScriptConsole : public CControlBase {
  CControlScriptConsole();

  const wstring HistoryText;
};

struct CControlListCard : public CControlFrame {
  CControlListCard();

  uint NbLinesPerPage;
  uint NbColumnsPerPage;
  uint FastPageStep;
  vec2 GridSize;
  bool Transpose;
  bool AllowMultipleSelection;
  uint CurrentPage;
  uint PageCount;
  void OnNextPage();
  void OnPrevPage();
  void OnFastPrevPage();
  void OnFastNextPage();
  void OnFirstPage();
  void OnLastPage();
  MwFastBuffer<CControlBase*> CardsModels;
  const MwFastBuffer<CControlBase*> ListCards;
};

struct CControlMiniMap : public CControlBase {
};

struct CControlCamera : public CControlBase {
};

} // namespace Control

namespace Motion {

struct CMotion : public CMwNod {
};

struct CMotionFunc : public CMotionTrack {
  CMotionFunc();

  CMwNod* Func;
};

struct CMotions : public CMotion {
  CMotions();

  const MwFastArray<CMwNod*> Motions;
};

struct CMotionCmdBase : public CMwCmd {
  CMotionCmdBase();

  float Period;
  float Phase;
  const float Value;
  enum class CMotionCmdBase::EWave {
    Sin = 0,
    Triangle = 1,
    Square = 2,
    SawTooth = 3,
    InverseSawTooth = 4,
  };
  CMotionCmdBase::EWave WaveType;
  bool IsOnce;
  const float NormedValue;
  bool IsAbsolutePhase;
  const uint LoopCount;
  CMotionCmdBaseParams* CmdBaseParams;
};

// File extension: 'MotionTrackShader.Gbx'
struct CMotionShader : public CMotionTrack {
  CMotionShader();

};

// File extension: 'MotionBase.Gbx'
struct CMotionCmdBaseParams : public CMwNod {
  CMotionCmdBaseParams();

  enum class CMotionCmdBaseParams::ETimeUnit {
    mSecond = 0,
    Second = 1,
    Minute = 2,
    Hour = 3,
    Day = 4,
  };
  CMotionCmdBaseParams::ETimeUnit TimeUnit;
  float Period;
  float Phase;
};

struct CMotionTrack : public CMwCmdContainer {
  CMotionTrack();

  CMwNod* const Owner;
};

struct CMotionPlayer : public CMotion {
  CMotionPlayer();

  void Play();
  void Pause();
  void Stop();
  const bool IsPlaying;
  CMotionCmdBase* Base;
  float BaseValue;
  enum class CMotionPlayer::EPlayState {
    Playing = 0,
    Paused = 1,
    Stopped = 2,
    Current = 3,
  };
  CMotionPlayer::EPlayState SavePlayState;
  const MwFastArray<CMotionTrack*> Tracks;
  bool IsPhysics;
};

// File extension: 'MotionTrackMobilRotate.Gbx'
struct CMotionTrackMobilRotate : public CMotionTrack {
  CMotionTrackMobilRotate();

  float LoopAngle;
  vec3 Axe;
  bool IsLeftMult;
  vec3 RotationCenter;
};

struct CMotionLight : public CMotionTrack {
  CMotionLight();

  CFuncLight* FuncLight;
};

struct CMotionTrackMobilMove : public CMotionTrack {
  CMotionTrackMobilMove();

  CFuncKeysTrans* KeysTrans;
  bool IsAbsolute;
  void BuildChordLengthParametrization();
  float ParametrizationDistMax;
};

struct CMotionTrackVisual : public CMotionTrack {
  CMotionTrackVisual();

  CPlugVisual* const Visual;
  CFuncVisual* FuncVisual;
};

struct CMotionTrackMobilPitchin : public CMotionTrack {
  CMotionTrackMobilPitchin();

  UnnamedEnum PitchinMode;
  CSceneToySea* const Sea;
  float Flottaison;
  float Tangage;
  float Roulis;
  float OffsetHauteur;
  float PeriodDelta;
  float MaxAngle;
};

struct CMotionTrackTree : public CMotionTrack {
  CMotionTrackTree();

  CPlugTree* const Tree;
  CFuncTree* FuncTree;
};

struct CMotionTeamActionInfo : public CMotionTrack {
  CMotionTeamActionInfo();

  UnnamedEnum TeamMateName;
  UnnamedEnum Destination;
  UnnamedEnum AnimAtDest;
  float AnimAtDestDuration;
  float TeamMateSpeed;
};

struct CMotionTeamManager : public CMotionTrack {
  CMotionTeamManager();

  CFuncPathMesh* FuncPathMesh;
  const MwFastBuffer<CPlugTree*> TeamTrees;
  const MwFastBuffer<CFuncTreeSubVisualSequence*> AnimList;
  uint WalkAnimIndex;
  void AddAction();
  const MwFastBuffer<CMotionTeamAction*> Actions;
};

struct CMotionTeamAction : public CMotionTrack {
  CMotionTeamAction();

  void AddTeamMate();
  const MwFastBuffer<CMotionTeamActionInfo*> TeamMates;
};

// File extension: 'MotionTrackMobilScale.Gbx'
struct CMotionTrackMobilScale : public CMotionTrack {
  CMotionTrackMobilScale();

  float ScaleValue;
};

struct CMotionManager : public CMwNod {
};

struct CMotionEmitterLeaves : public CMotionManaged {
  CMotionEmitterLeaves();

  CMotionManagerLeaves* ManagerModel;
  vec3 Pos;
  vec3 Radius;
};

struct CMotionManagerLeaves : public CMotionManager {
  CMotionManagerLeaves();

  CSceneMobilLeaves* const MobilLeaves;
  bool IsActive;
};

struct CMotionManaged : public CMotion {
};

// File extension: 'MotionEmitterFlock.Gbx'
struct CMotionEmitterFlock : public CMotionManaged {
  CMotionEmitterFlock();

  CPlugFlockModel* FlockModel;
  float Radius;
  float Power;
  uint SpawnCount;
  bool IsRepulsor;
  bool IsLandingArea;
  void UpdateParams();
};

// File extension: 'WindBlocker.Gbx'
struct CMotionWindBlocker : public CMotionManaged {
  CMotionWindBlocker();

  bool UseNewWindShadowing;
  vec2 Pos0;
  vec2 Pos1;
  float Height;
  float BlockerCoeffX;
  float BlockerCoeffY;
  float BlockerCoeffYMax;
  float BlockerValXCoeff;
  float BlockerOffsetX;
  float BlockerBase;
  float BlockerBaseXCenter;
  float BlockerBaseXCenterVal;
  float BlockerBaseXMult;
  float TurbulenceCoeffX;
  float TurbulenceCoeffY;
  float TurbulenceBase;
  float TurbulenceBaseXCenter;
  float TurbulenceBaseXCenterVal;
  float TurbulenceBaseXMult;
  float TurbulenceAngleDeviationMult;
  float SillageCoeffX;
  float SillageCoeffY;
  float SillageBase;
  float SillageOffsetMult;
  float SizeF7F3Ratio;
  float TurbulenceMaxAwa;
  float TurbulenceFadderAwa;
  float TurbulencePosRatio;
  float BlockerPosRatio;
  float SillageMaxAwa;
  float SillageFadderAwa;
  float SillageCoeffYRot;
  float SillageRotAwa;
  float SillageAngleDeviationDiv;
  float SecondSegmentCenterRatio;
  float SecondSegmentLength;
  float WindDirDevCoef;
  float WindDirDevMax;
};

struct CMotionManagerMeteo : public CMotionManager {
  CMotionManagerMeteo();

  MwFastBuffer<CMotionWindBlocker*> WindBlockers;
  float WindGlobalDirection; // Range: -3.14159 - 3.14159
  float WindGlobalIntensity;
  float StreamGlobalIntensity;
  float BlockerDist;
  float TideIn01; // Range: 0 - 1
  const float TideBlend; // Range: 0 - 1
  CMotionManagerMeteoPuffLull* const MeteoPuffLull;
  float VariationsAmp;
  float VariationsTimeFactor;
  CFuncKeysReal* TideBlendFunc;
};

// File extension: 'MotionManagerWeathers.Gbx'
struct CMotionManagerWeathers : public CMotionManager {
  CMotionManagerWeathers();

  void SaveInModelFid();
  float SiteLatitude; // Range: -90 - 90
  MwFastBuffer<CFuncWeather*> FuncWeathers;
  CPlugMoodSetting* MoodSetting;
  CFuncDayTime* FuncDayTime;
  CMotionTimerLoop* const Timer;
  float TimeRemapped; // Range: 0 - 1
  CPlugBitmap* BitmapSpecularDir;
  CPlugBitmap* BitmapWaterFog;
  enum class CMotionManagerWeathers::EClearMode {
    Fixed = 0,
    Fog = 1,
  };
  CMotionManagerWeathers::EClearMode ClearMode;
  vec3 ClearColor;
  float SunIntensity;
  float MoonIntensity;
  bool EnableUpdate;
};

// File extension: 'MotionWeather.Gbx'
struct CMotionWeather : public CMotionManaged {
  CMotionWeather();

  CMotionManagerWeathers* const Manager;
};

struct CMotionDayTime : public CMotionManaged {
  CMotionDayTime();

};

struct CMotionTimerLoop : public CMwNod {
  CMotionTimerLoop();

  void Stop();
  uint RealTimePhase;
  float TimeIn01; // Range: 0 - 1
};

struct CMotionManagerMeteoPuffLull : public CMwNod {
  CMotionManagerMeteoPuffLull();

  CFuncPuffLull* FuncPuffLull;
  bool IsVisible;
};

struct CMotionEmitterParticles : public CMotionManaged {
  CMotionEmitterParticles();

  CPlugParticleEmitterModel* EmitterModel;
  bool IsActive;
  bool IsEventMode;
  bool UseOwnerLoc;
  iso4 EmitLoc;
  vec3 EmitHalfSize;
  vec3 EmitVel;
  float EmitIntensity;
  vec3 EmitColor;
};

} // namespace Motion

namespace Plug {

struct CPlugAudio : public CPlug {
};

struct CPlugShader : public CPlug {
};

// File extension: 'Crystal.Gbx'
struct CPlugCrystal : public CPlugTreeGenerator {
  CPlugCrystal();

  const uint CrystalVertexCount;
  const uint CrystalEdgeCount;
  const uint CrystalFaceCount;
};

struct CPlugShaderGeneric : public CPlugShader {
};

struct CPlugSolid : public CPlug {
  CPlugSolid();

};

// File extension: 'Visual.Gbx'
struct CPlugVisual : public CPlug {
  void Inverse();
  bool IsGeometryStatic;
  const bool IsGeometryDynaPart;
  bool IsIndexationStatic;
  bool OptimizeInVision;
  bool UseVertexNormal;
  bool UseVertexColor;
  CFuncVisual* FuncVisual;
  const MwFastArray<CPlugVertexStream*> VertexStreams;
  const uint cBone;
};

struct CPlugBitmapHighLevel : public CSystemNodWrapper {
  CPlugBitmapHighLevel();

  UnnamedEnum Mode;
  uint BlurTexelCount;
  uint Width;
  uint Height;
  iso4 CameraToWorld;
  float CameraFovY;
  float CameraRatioXY;
  float CameraNearZ;
  float CameraFarZ;
};

struct CPlugVisualIndexedLines : public CPlugVisualIndexed {
  CPlugVisualIndexedLines();

};

struct CPlugVisualOctree : public CMwNod {
};

struct CPlugBitmapRenderShadow : public CPlugBitmapRender {
  CPlugBitmapRenderShadow();

};

// File extension: 'Shape.Gbx'
struct CPlugSurface : public CPlug {
  CPlugSurface();

  const MwFastBuffer<CPlugMaterial*> Materials;
  CPlugSkel* Skel;
  void UpdateSurfMaterialIdsFromMaterialIndexs();
  enum class CPlugSurface::EGmSurfType {
  };
  CPlugSurface::EGmSurfType GmSurfType;
  float Radius;
  vec3 Radii;
  vec3 AABBCenter;
  vec3 AABBHalfSize;
};

// File extension: 'PlugModelShading.Gbx'
struct CPlugModelShading : public CMwNod {
  CPlugModelShading();

  CPlugFileImg* DefaultImage_Diffuse;
  CPlugFileImg* DefaultImage_DiffuseOpacity;
  CPlugFileImg* DefaultImage_Specular;
  CPlugFileImg* DefaultImage_Normal;
  CPlugFileImg* DefaultImage_Energy;
  CPlugFileImg* DefaultImage_TeamMask;
  CPlugFileImg* DefaultImage_SelfIllum;
  CPlugFileImg* DefaultImage_Damage;
  CPlugFileImg* DefaultImage_Dirt;
  CPlugMaterial* MaterialDyna0_TDSNI;
  CPlugMaterial* MaterialDyna0_TI;
  CPlugMaterial* MaterialDyna0_TI_AddModCV;
  CPlugMaterial* MaterialDyna0_TDSNE;
  CPlugMaterial* MaterialDyna0_TE;
  CPlugMaterial* MaterialDyna0_TIce;
  CPlugMaterial* MaterialStatic_TDSN;
  CPlugMaterial* MaterialStatic_TDOSN;
  CPlugMaterial* MaterialStatic_TDSNE;
  CPlugMaterial* MaterialStatic_TDSNI;
  CPlugMaterial* MaterialStatic_TDSNI_Night;
  CPlugMaterial* MaterialStatic_TIAdd;
  CPlugMaterial* MaterialChar_TDSNEM;
  CPlugMaterial* MaterialChar_TE;
  CPlugMaterial* MaterialChar_TDOSN;
  CPlugMaterial* MaterialChar_TDOS;
  CPlugMaterial* MaterialFid_Char_Shield;
  CPlugMaterial* MaterialFid_Char_Teleport;
  CPlugMaterial* MaterialFid_Char_ActionMakerOtherFrames;
  CPlugMaterial* MaterialFid_Char_ShowEnergy;
  CPlugLight* LightFid_Char_FakeShadowProj;
  CPlugMaterial* MaterialVehicle_Skin;
  CPlugMaterial* MaterialVehicle_Details;
  CPlugMaterial* MaterialVehicle_Glass;
  CPlugMaterial* MenuBox3dMaterial_MenuBox3dStation;
  CPlugMaterial* MenuBox3dMaterial_MenuBox3dBoxCase;
  CPlugMaterial* MenuBox3dMaterial_MenuBox3dMetal;
  CPlugMaterial* MenuBox3dMaterial_MenuBox3dGlass;
  CPlugMaterial* MenuBox3dMaterial_MenuBox3dLight;
  CPlugMaterial* MenuBox3dMaterial_MenuBox3dTransp;
};

struct CPlugSurfaceGeomDeprecated : public CPlug {
  CPlugSurfaceGeomDeprecated();

};

struct CPlugVisualSprite : public CPlugVisual3D {
  CPlugVisualSprite();

  const bool UseTextureAtlas;
  const bool SpriteIndexTC1;
  CPlugSpriteParam* const SpriteParam;
  CPlugBitmapAtlas* const BitmapAtlas;
};

// File extension: 'Texture.Gbx'
struct CPlugBitmap : public CPlug {
  CPlugBitmap();

  enum class CPlugBitmap::ERenderTech {
    Unknown = 0,
    Tech3 = 1,
  };
  enum class CPlugBitmap::ETexFilter {
    Point = 0,
    Bilinear = 1,
    Trilinear = 2,
    Anisotropic = 3,
    AnisoPoint = 4,
  };
  enum class CPlugBitmap::ETexAddress {
    Wrap = 0,
    Mirror = 1,
    Clamp = 2,
    BorderSM3 = 3,
  };
  enum class CPlugBitmap::EColorSpace {
    Linear = 0,
    sRGB = 1,
  };
  enum class CPlugBitmap::EVideoTimer {
    Game = 0,
    Human = 1,
    Scene = 3,
    Default = 4,
  };
  enum class CPlugBitmap::EGenerateUV {
    NoGenerate = 0,
    CameraVertex = 1,
    WorldVertex = 2,
    WorldVertexXY = 3,
    WorldVertexXZ = 4,
    WorldVertexYZ = 5,
    CameraNormal = 6,
    WorldNormal = 7,
    CameraReflectionVector = 8,
    WorldReflectionVector = 9,
    WorldNormalNeg = 10,
    WaterReflectionVector = 11,
    Hack1Vertex = 12,
    MapTexel_DEPRECATED = 13, // MapTexel DEPRECATED
    FogPlane0 = 14,
    Vsk3SeaFoam = 15,
    ImageSpace = 16,
    LightDir0Reflect = 17,
    EyeNormal = 18,
    ShadowB1Pw01 = 19,
    Tex3AsPosPrCamera = 20,
    FlatWaterReflect = 21,
    FlatWaterRefract = 22,
    FlatWaterFresnel = 23,
    WorldPosXYblendZY = 24,
    DisableVshOutput = 25,
  };
  enum class CPlugBitmap::EUsage {
    Color = 0,
    Light = 1,
    HeightNGDuDv = 2, // Height->DuDv
    Render = 3,
    HNGDuDvLumi = 4, // H->DuDvLumi
    HNGNormXYZ = 5, // H->NormXYZ
    HNGNormXY = 6, // H->NormXY
    DepthCmp = 7,
    DispH01 = 8,
    HNGNormPal8b = 9, // H->NormPal8b
    NormXYZ = 10,
    NormXY = 11,
    NormPal8b = 12,
    NormPal16b = 13,
    ColorFloat = 14,
    RenderFloat = 15,
    HNGDuDv1 = 16, // H->DuDv1
    Alpha = 17,
    LightAlpha = 18,
    HNGNormX0ZY = 19, // H->NormX0ZY
    NormX0ZY = 20,
    TexCoord = 21,
    Render16b = 22,
    Vertex = 23,
    HNGBumpTxTy = 24, // H->BumpTxTy
    BumpTxTy = 25,
    HNGNorm0YZX = 26, // H->Norm0YZX
    Norm0YZX = 27,
    Norm_XYZNG0YZX = 28, // Norm:XYZ->0YZX
    Depth = 29,
    SrgbL8NGLinearL16 = 30, // SrgbL8->LinearL16
    NormATI2N = 31,
    NormXYZNGATI2N = 32, // NormXYZ->ATI2N
    Color16b = 33,
    SpecFIENGFI0E = 34, // SpecFIE->FI0E
    SpecFI0E = 35,
  };
  enum class CPlugBitmap::EColorDepth {
    DefaultColorDepth = 0,
    Color16b = 1,
    Color32b = 2,
  };
  enum class CPlugBitmap::ECubeMapFace {
    None = 0,
    XPos = 1,
    XNeg = 2,
    YPos = 3,
    YNeg = 4,
    ZPos = 5,
    ZNeg = 6,
  };
  enum class CPlugBitmap::EBumpCompressMode {
    None = 0, // None(32b)
    Pal8b = 1,
    DXT1 = 2, // DXT1(4b)
    Pal16b = 3,
  };
  enum class CPlugBitmap::EPixelUpdate {
    None = 0,
    Render = 1,
    Shader = 2,
    DynaSpecular = 3,
    Clear = 4,
    RenderVideo = 5,
  };
  enum class CPlugBitmap::EDynamic {
    Off = 0,
    On = 1,
    On_2_Buffers = 2, // On 2 Buffers
  };
  enum class CPlugBitmap::ENormalRotate {
    None = 0,
    Px_Pz_Ny = 1, // +x +z -y
  };
  enum class CPlugBitmap::EEdCustomSaveOp {
    None = 0,
    Conv_Diffuse = 1, // Conv.Diffuse
    ShootCubeHdrScaleA2_DXT5 = 2, // ShootCubeHdrScaleA2 DXT5
  };
  enum class CPlugBitmap::ECompressor {
    NVidia = 0,
    DirectX = 1,
  };
  enum class CPlugBitmap::EForceBorderSize {
    _1_texel = 0, // 1 texel
    _2_texels = 1, // 2 texels
    _3_texels = 2, // 3 texels
    _4_texels = 3, // 4 texels
  };
  enum class CPlugBitmap::EMipMapAlpha01 {
    HalfBinary = 0,
    ForceBinary = 1,
    ShadeOfGray = 2,
  };
  CPlugBitmap::ERenderTech RenderTech;
  CPlugBitmap::EUsage Usage;
  CPlugBitmap::EColorDepth WantedColorDepth;
  bool AllowR11G11B10F;
  bool IsOneBitAlpha;
  const bool IgnoreImageAlpha01;
  bool NoShaderSetBlendMap;
  bool ShadowCasterIgnoreAlpha;
  bool AlphaToCoverage;
  const bool IsNonPow2Conditional;
  const bool IsCubeMap;
  const bool IsOriginTop;
  CPlugBitmap::ETexFilter TexFilter;
  CPlugBitmap::ETexAddress TexAddressU;
  CPlugBitmap::ETexAddress TexAddressV;
  CPlugBitmap::ETexAddress TexAddressW;
  CPlugBitmap::EColorSpace LdrColorSpace;
  CPlugBitmap::ECubeMapFace CubeMapAuto2dFace;
  float MipMapLodBiasDefault;
  float DefaultTexCoordSizeXm;
  float DefaultTexCoordSizeYm;
  float DefaultTexCoordTransXm;
  float DefaultTexCoordTransYm;
  vec2 DefaultTexCoordScale;
  vec2 DefaultTexCoordTrans;
  float DefaultTexCoordRotate; // Range: 0 - 360
  CPlugBitmap::EVideoTimer DefaultVideoTimer;
  const uint DefaultMaxMipLevel;
  bool Force1stPixelAlpha0;
  bool ForceBorderRGB;
  vec3 BorderRGB;
  bool ForceBorderAlpha;
  float BorderAlpha; // Range: 0 - 1
  CPlugBitmap::EForceBorderSize ForceBorderSize;
  bool BorderLeft;
  bool BorderRight;
  bool BorderTop;
  bool BorderBottom;
  bool WantMipMapping;
  bool IsMipMapLowerAlphaEnable;
  float MipMapLowerAlpha; // Range: 0 - 1
  MwFastArray<float> MipMapFadeAlphas;
  CPlugBitmap::EMipMapAlpha01 MipMapAlpha01;
  bool CanBeDeletedFromSystemMemory;
  bool RenderTexelsMustPersist;
  bool CanBeCompressedInVideoMemory;
  bool CompressInterpolatedAlpha;
  bool CompressSkipDXT1;
  bool CompressUseDithering;
  CPlugBitmap::ECompressor Compressor;
  CPlugBitmap::EBumpCompressMode BumpCompressMode;
  float BumpScaleFactor;
  float BumpScaleMipLevel;
  CPlugBitmap::ENormalRotate NormalRotate;
  bool NormalAreSigned;
  bool NoMipNormalize;
  CPlugFileImg* Image;
  CPlugBitmapAtlas* Atlas;
  CPlugSpriteParam* const SpriteParam;
  CPlugBitmapDecals* Decals;
  bool MipLevelSkipFromQuality;
  uint MipLevelSkipCountMax;
  int LDExportSkipMip_Racing;
  bool FloatRequireFiltering;
  bool RenderAutoFitSize;
  bool RenderAutoFitSS;
  uint RenderSizeMul;
  uint RenderSizeDiv;
  bool RenderRequireBlending;
  uint MultiSampleCount;
  bool RenderCreateClear;
  vec3 DefaultRenderClearRGB;
  float DefaultRenderClearAlpha; // Range: 0 - 1
  bool DepthUseStencil;
  bool DepthCanSwap;
  bool UseUAV;
  CPlugBitmap::EPixelUpdate PixelUpdate;
  CPlugBitmap::EDynamic Dynamic;
  vec3 SpecularRGB;
  float SpecularExp; // Range: 1 - 50
  vec3 ClearRGB;
  float ClearAlpha; // Range: 0 - 1
  CPlugBitmapRender* Render;
  CPlugBitmapShader* Shader;
  bool ForceShaderBitmapTc;
  bool ForceShaderGenerateUV;
  CPlugBitmap::EGenerateUV GenerateUV;
};

struct CPlugBitmapApply : public CPlugBitmapAddress {
  CPlugBitmapApply();

  enum class CPlugBitmapApply::EGxTexInput {
    Current = 0,
    Constant = 1,
  };
  CPlugBitmapApply::EGxTexInput TexInput;
  enum class CPlugBitmapApply::EGxTexArg {
    Texture = 0,
    VColor0 = 1,
    Temporary = 2,
    VColor1 = 3,
  };
  CPlugBitmapApply::EGxTexArg TexArg;
  enum class CPlugBitmapApply::EGxTexOp {
    Replace = 0,
    Modulate = 1,
    Modulate2X = 2,
    Add = 3,
    BlendAlpha = 4,
    AddDstColorModBySrcAlpha = 5,
    AddSrcColorModByDstAlpha = 6,
    BumpEnvMap = 7,
    BumpEnvMapLumi = 8,
    DotProduct3 = 9,
    AddSigned = 10,
    AddSigned2X = 11,
    Subtract = 12,
    AddSmooth = 13,
    BlendVAlpha = 14,
    ReplaceRGB = 15,
    ReplaceAlpha = 16,
    ModulateRGB = 17,
    ModulateAlpha = 18,
    AddAlpha = 19,
    Modulate2xAlpha = 20,
    ReplaceRGB_ModulateAlpha = 21,
    Mod2xRGB_ReplaceAlpha = 22,
  };
  CPlugBitmapApply::EGxTexOp TextureOp;
  enum class CPlugBitmapApply::EGxTexOutput {
    Current = 0,
    Temporary = 1,
  };
  CPlugBitmapApply::EGxTexOutput TexOutput;
};

struct CPlugVisualLines : public CPlugVisual3D {
  CPlugVisualLines();

};

struct CPlugVisualLines2D : public CPlugVisual2D {
  CPlugVisualLines2D();

};

struct CPlugTreeVisualMip : public CPlugTree {
  CPlugTreeVisualMip();

  MwFastArray<float> LevelsFarZ;
  MwFastArray<CPlugTree*> LevelsTree;
};

struct CPlugVisualStrip : public CPlugVisual3D {
  CPlugVisualStrip();

};

struct CPlugVisualVertexs : public CPlugVisual3D {
  CPlugVisualVertexs();

};

struct CPlugFilePack : public CPlugFileFidContainer {
  CPlugFilePack();

  const uint Version;
  const string CreationBuildInfo;
  const string AuthorLogin;
  const wstring AuthorNickName;
  const wstring AuthorZonePath;
  const string InfoManialinkUrl;
  const string DownloadUrl;
  const wstring Comment;
  const string XmlHeader;
  const string TitleId;
  const string UsageSubDir;
};

// File extension: 'Sound.Gbx'
struct CPlugSound : public CPlugAudio {
  CPlugSound();

  enum class CPlugSound::EAudioBalanceGroup {
    Auto = 0,
    Music = 1,
    Menus = 2,
    Ambiance = 3,
    Player = 4,
    Bengs = 5,
    Guns = 6,
    BackingDirect = 7,
    Trails = 8,
    GameUI = 9,
    Custom1 = 10,
    Custom2 = 11,
    OtherPlayers = 12,
    ImpactWarning = 13,
    Environment = 14,
  };
  enum class CPlugSound::EAudioRoomFx {
    None = 0,
    Low = 1,
    Mid = 2,
    High = 3,
    Music = 4,
    UI = 5,
  };
  enum class CPlugSound::EAudioPitchFromDistMode {
    Auto = 0,
    CurvePlayer = 1,
    CurveGun = 2,
    Disabled = 3,
  };
  enum class CPlugSound::EAudioIgnoreSourceProperties {
    None = 0,
    Ignore_All = 1, // Ignore All
    Ignore_Pitch = 2, // Ignore Pitch
    Ignore_Volume = 3, // Ignore Volume
  };
  CPlugFileSnd* PlugFile;
  UnnamedEnum Mode;
  float VolumedB; // Range: -60 - 0
  float Priority;
  int MaxDuplicates;
  MwId GroupDuplicate;
  CPlugSound::EAudioBalanceGroup BalanceGroup;
  float RefDistance;
  float MaxDistance;
  float RolloffFactor; // Range: 0 - 10
  CFuncKeysReal* VolumeFromDistance;
  CFuncKeysReal* PitchFromDistance;
  CFuncKeysReal* VolumeFromSpeedKmh;
  float Pitch; // Range: 0.5 - 2
  float DopplerFactor;
  bool EnableDoppler;
  CPlugSound* BackingSound;
  CPlugSound* FocusedSound;
  float AirAbsorptionFactor; // Range: 0 - 10
  CPlugSound::EAudioRoomFx RoomFxSend;
  float RoomRolloffFactor; // Range: 1 - 10
  float LfeSenddB; // Range: -60 - 0
  float FadeStopDuration;
  float FadePlayDuration;
  bool IsLooping;
  UnnamedEnum SoundKind;
  uint InsideConeAngle; // Range: 0 - 360
  uint OutsideConeAngle; // Range: 0 - 360
  float ConeOutsideAttenuation; // Range: 0 - 1
  float Radius;
  float PanAngleDeg; // Range: -180 - 180
  CPlugSound::EAudioPitchFromDistMode PitchFromDistMode;
  CPlugSound::EAudioIgnoreSourceProperties IgnoreSourceProperties;
  bool IsContinuous;
  bool UseLowPassFilter;
  int DuplicatesIntervalMin;
  void SetDirty();
};

// File extension: 'SoundMood.Gbx'
struct CPlugSoundMood : public CPlugSound {
  CPlugSoundMood();

  CPlugFileSnd* InsideFileSnd;
  const MwFastBuffer<CPlugFileSnd*> EventSounds;
  const MwFastBuffer<float> EventPeriods;
};

// File extension: 'Music.Gbx'
struct CPlugMusic : public CPlugMusicType {
  CPlugMusic();

  CSystemFidsFolder* RootFolder;
  CPlugFileText* Settings;
};

struct CPlugLight : public CPlug {
  CPlugLight();

};

struct CPlugVisualIndexedTriangles : public CPlugVisualIndexed {
  CPlugVisualIndexedTriangles();

};

struct CPlugFile : public CPlug {
  void ReGenerate();
};

struct CPlugBitmapRenderLightFromMap : public CPlugBitmapRender {
  CPlugBitmapRenderLightFromMap();

  uint SampledWidthPerObject;
  uint ObjectCountPerAxisMin;
  uint ObjectCountPerAxisMax;
  const uint ObjectCountPerAxisVision;
  float CameraNearZ_FactorInObject; // Range: 0 - 1
  float CameraFarZ_ToAdd;
  float StartFadeToWhite; // Range: 0 - 1
  float RemapMin_Night; // Range: -0.5 - 1.5
  float RemapMax_Night; // Range: -0.5 - 1.5
  float RemapMin_DayAmb; // Range: -0.5 - 1.5
  float RemapMax_DayAmb; // Range: -0.5 - 1.5
  float RemapMin_DayDir; // Range: -0.5 - 1.5
  float RemapMax_DayDir; // Range: -0.5 - 1.5
  float CameraDovWorldY_MaxDot; // Range: -1 - 1
  CPlugBitmap* BitmapLightHistory;
  uint RayCastHalfTimeMs;
};

struct CPlugFileJpg : public CPlugFileImg {
  CPlugFileJpg();

};

// File extension: 'tga'
struct CPlugFileTga : public CPlugFileImg {
  CPlugFileTga();

};

// File extension: 'dds'
struct CPlugFileDds : public CPlugFileImg {
  CPlugFileDds();

};

struct CPlugFileImg : public CPlugFile {
  enum class CPlugFileImg::EDimension {
    _1D = 0, // 1D
    _2D = 1, // 2D
    _3D = 2, // 3D
    Cube = 3,
  };
  const CPlugFileImg::EDimension Dimension;
  const uint Width;
  const uint Height;
  const uint Depth;
  const uint NbComp;
  enum class CPlugFileImg::EPlugImageFormat {
    BGRA = 0,
    BC1_DXT1 = 1,
    BC2_DXT2_PM = 2,
    BC2_DXT3 = 3,
    BC3_DXT4_PM = 4,
    BC3_DXT5 = 5,
    RGBA16 = 6,
    RGBA16F = 7,
    RGBA32F = 8,
    FileJpg = 9,
    BC4 = 10, // BC4 (ATI1N)
    BC5yx = 11, // BC5yx (ATI2N)
    BC6U = 12,
    BC6F = 13,
    BC7 = 14,
    R11G11B10F = 15,
  };
  const CPlugFileImg::EPlugImageFormat Format;
  const uint cMipLevel;
  const uint cMipLevelSkipAtLoad;
  const bool IsInSystemMemory;
  const uint SystemKb;
  void ScaleToPowerOfTwo(bool Shrink, uint TexFilter);
  const float LdrToHdrScale;
  const UnnamedEnum MipMapFilter;
};

struct CPlugShaderApply : public CPlugShaderGeneric {
  CPlugShaderApply();

};

struct CPlugVisualQuads : public CPlugVisual3D {
  CPlugVisualQuads();

};

struct CPlugVisualTriangles : public CPlugVisual3D {
  CPlugVisualTriangles();

};

// File extension: 'SoundEngine.Gbx'
struct CPlugSoundEngine2 : public CPlugSound {
  CPlugSoundEngine2();

  CPlugFileAudioMotors* AudioMotors_Exhaust_Throttle;
  CPlugFileAudioMotors* AudioMotors_Exhaust_Release;
  CPlugFileAudioMotors* AudioMotors_Engine_Throttle;
  CPlugFileAudioMotors* AudioMotors_Engine_Release;
  CPlugFileSnd* AudioMotors_IdleLoop_Exhaust;
  CPlugFileSnd* AudioMotors_LimiterLoop_Exhaust;
  CPlugFileSnd* AudioMotors_IdleLoop_Engine;
  CPlugFileSnd* AudioMotors_LimiterLoop_Engine;
  float AudioMotors_LPF_CutoffRatio_Exhaust; // Range: 0 - 1
  float AudioMotors_LPF_CutoffRatio_Engine; // Range: 0 - 1
  CFuncKeysReal* const AudioMotors_PitchRandomize_Rpm;
  CFuncKeysReal* const AudioMotors_PitchRandomize_Throttle;
  float AudioMotors_IdleVolumedB;
  float AudioMotors_LimiterVolumedB;
  CSystemFidsFolder* Loops_Folder;
  bool Loops_UseVolumeCorrection;
  bool Loops_RpmClamp;
  float RpmMaxFromEngine;
  float RpmGamma;
  CFuncKeysReal* const Volume_Speed;
  CFuncKeysReal* const Volume_Distance;
  CFuncKeysReal* const Volume_Rpm;
  CFuncKeysReal* const Volume_Throttle;
  CFuncKeysReal* const Volume_Gear;
  CFuncKeysReal* const RpmFactor_Gear;
  CFuncKeysReal* const VolPersp_Rpm_Exhaust;
  CFuncKeysReal* const VolPersp_Throttle_Exhaust;
  CFuncKeysReal* const VolPersp_Rpm_Engine;
  CFuncKeysReal* const VolPersp_Throttle_Engine;
  CFuncKeysReal* const VolPersp_Rpm_Interior;
  CFuncKeysReal* const VolPersp_Throttle_Interior;
  float Mix_FrontBackSpread;
  float MixFront; // Range: 0 - 1
  float MixBack; // Range: 0 - 1
  void UpdateSubEmitters();
  float SubEmitter_Vol_Exhaust;
  float SubEmitter_RelSize_Exhaust;
  vec3 SubEmitter_RelPos_Exhaust;
  vec3 SubEmitter_RelDir_Exhaust;
  float SubEmitter_ConeAttenuation_Exhaust;
  float SubEmitter_ConeAngle_Exhaust;
  float SubEmitter_Vol_Engine;
  float SubEmitter_RelSize_Engine;
  vec3 SubEmitter_RelPos_Engine;
  vec3 SubEmitter_RelDir_Engine;
  float SubEmitter_ConeAttenuation_Engine;
  float SubEmitter_ConeAngle_Engine;
  float SubEmitter_Vol_Interior;
  float SubEmitter_RelSize_Interior;
  vec3 SubEmitter_RelPos_Interior;
  vec3 SubEmitter_RelDir_Interior;
  float SubEmitter_ConeAttenuation_Int;
  float SubEmitter_ConeAngle_Int;
  void Loops_LoadAndParseFileSnd();
  const float Loops_MinRpmAll;
  const float Loops_MaxRpmAll;
};

struct CPlugVisualIndexedStrip : public CPlugVisualIndexed {
  CPlugVisualIndexedStrip();

};

struct CPlug : public CMwNod {
  CPlug();

};

struct CPlugVisual3D : public CPlugVisual {
  bool UseTgtU;
  bool UseTgtV;
  CPlugBlendShapes* const BlendShapes;
  void NegNormals();
  void ComputeFaceCull();
  void ComputeOccBox();
};

struct CPlugFileFont : public CPlugFile {
  CPlugFileFont();

};

struct CPlugFileGen : public CPlugFileImg {
  CPlugFileGen();

  enum class CPlugFileGen::EGenKind {
    Checker = 0,
    LightMap = 1,
    Plain = 2,
    Point = 3,
    Shade = 4,
    Render = 5,
    RenderCube = 6,
    CubeNormals = 7,
    Identity = 8,
    Pixels = 9,
    Depth = 10,
    DepthCube = 11,
    RenderF = 12,
    Iradiance = 13,
    Specular = 14,
    TestNormal = 15,
    RandNormal = 16,
    SpecularCube = 17,
    HemiReflec = 18,
    CubeInvHemiReflec = 19,
    SpecularsLA = 20,
    HueGradient = 21,
    SLGradient = 22,
    VolumeRotate = 23,
    SpecularCubeVect = 24,
    TestMipMap = 25,
    SpecCubeVectRgb = 26,
    DdxInMipMap = 27,
    RandVolume = 28,
    Unalloc = 29,
    PotentialField = 30,
    RenderCubeF = 31,
    TestAnaglyph = 32,
    ACosSmoothInRange = 33,
    PerlinPerm = 34,
    PerlinPerm2D = 35,
    PerlinGrad3 = 36,
    PerlinGrad3OfPerm = 37,
    Script = 38,
    Cube3x2_2d1RotCube = 39,
    Cube3x2_Ya1 = 40,
    ShClampedCos = 41,
    Random = 42,
    HueSaturation = 43,
    SmEnergyHueIntens = 44,
    PerlinGrad3OfPerm2d = 45,
    PerlinGrad4OfPerm2d = 46,
    Simplex4 = 47,
    InvalidData = 48,
    Callback = 49,
  };
  const CPlugFileGen::EGenKind GenKind;
};

struct CPlugFileSnd : public CPlugFile {
};

struct CPlugFileWav : public CPlugFileSnd {
  CPlugFileWav();

};

// File extension: 'AudioBalance.Gbx'
struct CPlugAudioBalance : public CPlugAudio {
  CPlugAudioBalance();

  bool IsAbsolute;
  float AttackDuration;
  float MinimumDuration;
  float ReleaseDuration;
  void SetDefaultValues();
  float SceneVolumedB; // Range: -60 - 6
  float UiVolumedB; // Range: -60 - 6
  float SceneLfeSenddB; // Range: -60 - 6
  float MusicLfeSenddB; // Range: -60 - 6
  float GlobalLfeSenddB; // Range: -60 - 6
  CFuncKeysReal* RolloffFromMusicVolume;
  float RolloffFactor; // Range: 0 - 4
  float RefDistanceFactor; // Range: 0 - 4
  float AutoRadiusFactor; // Range: 0 - 1
  float MaxDistFade_Ratio_Others;
  float MaxDistFade_Rolloff_Others;
  CFuncKeysReal* PitchFromDistance_Player_Others;
  CFuncKeysReal* PitchFromDistance_BengsGuns_Others;
  float MaxDistFade_Ratio_Focused;
  float MaxDistFade_Rolloff_Focused;
  CFuncKeysReal* PitchFromDistance_Player_Focused;
  CFuncKeysReal* PitchFromDistance_BengsGuns_Focused;
};

struct CPlugFileFidContainer : public CPlugFile {
  CSystemFids* const Location;
  void UiInstallFidsInSubFolder();
  void UiInstallFids();
  void UninstallAndDeleteFids();
  void EdDumpStatistics();
  void DumpContents();
  const uint NbFolders;
  const uint NbFiles;
  void DbgBenchExpand();
  void DbgExpandToDisk();
};

// File extension: 'TexturePack.Gbx'
struct CPlugBitmapPacker : public CPlug {
  CPlugBitmapPacker();

  uint BitmapSizeMax;
  const MwFastBuffer<CPlugBitmapPack*> Packs;
  CSystemFidsFolder* FidsBrowseMaterials;
  CSystemFidsFolder* FidsBrowseSolids;
  void FindPackListFromPath();
  void PackBitmaps();
  void AddPackInput();
  const MwFastBuffer<CPlugBitmapPackInput*> PackInputs;
  void FindTextureTiling();
  void FidParametersPush();
};

struct CPlugMusicType : public CPlugSound {
};

// File extension: 'AudioEnvironment.Gbx'
struct CPlugAudioEnvironment : public CPlugAudio {
  CPlugAudioEnvironment();

  float DopplerFactor; // Range: 0 - 10
  float RoomFxLowGain; // Range: -60 - 0
  float RoomFxLowGainHF; // Range: -60 - 0
  float RoomFxMidGain; // Range: -60 - 0
  float RoomFxMidGainHF; // Range: -60 - 0
  float RoomFxHighGain; // Range: -60 - 0
  float RoomFxHighGainHF; // Range: -60 - 0
  float RoomFxUIGain; // Range: -60 - 0
  float RoomFxUIGainHF; // Range: -60 - 0
  float RoomFxMusicGain; // Range: -60 - 0
  float RoomFxMusicGainHF; // Range: -60 - 0
  float LowPassGain; // Range: -60 - 0
  float LowPassGainHF; // Range: -60 - 0
  const float Gain;
  const float ReflectionsGain;
  const float LateReverbGain;
};

struct CPlugMaterialCustom : public CPlug {
  CPlugMaterialCustom();

};

struct CPlugVisualGrid : public CPlugVisual3D {
  CPlugVisualGrid();

  uint NbPointX;
  uint NbPointZ;
  float RangeX;
  float RangeZ;
  void Courbificateur();
  float Courbifiant;
  float Courbifiant2;
};

struct CPlugVisualPath : public CPlugVisualGrid {
  CPlugVisualPath();

};

// File extension: 'png'
struct CPlugFilePng : public CPlugFileImg {
  CPlugFilePng();

};

struct CPlugBlendShapes : public CPlug {
  CPlugBlendShapes();

  MwFastArray<float> BlendVals;
  bool NormalizeNormals;
  bool BlendNormals;
};

// File extension: 'Text.Gbx'
struct CPlugTreeGenText : public CPlugTreeGenerator {
  CPlugTreeGenText();

  wstring Text;
  CPlugFont* Font;
  vec3 Color;
  float Height;
  float RatioXY;
  UnnamedEnum AlignHorizontal;
  UnnamedEnum AlignVertical;
  float ClipLength;
  uint MaxLine;
  uint ClipLineMin;
  uint ClipLineMax;
};

struct CPlugFileGPU : public CPlugFileText {
  CPlugFileGPU();

  const string GeneratedFromFixedStage_FileName;
  const UnnamedEnum GpuStage;
  const uint GpuVersionMajor;
  const uint GpuVersionMajorReq;
  const uint CodeSize;
  CSystemFid* const GeneratedCombination_Fid0;
  CSystemFid* const GeneratedCombination_Fid1;
};

// File extension: 'txt'
struct CPlugFileText : public CPlugFile {
  CPlugFileText();

  string Text;
};

struct CPlugBitmapPack : public CPlug {
  CPlugBitmapPack();

  uint SizeX;
  uint SizeY;
  UnnamedEnum Format;
  uint NbComp;
  enum class CPlugBitmapPack::EGxTexAddress {
    Wrap = 0,
    Mirror = 1,
    Clamp = 2,
    BorderSM3 = 3,
  };
  CPlugBitmapPack::EGxTexAddress TexAdrU;
  CPlugBitmap* Bitmap;
  const MwFastBuffer<CPlugBitmapPackElem*> PackElems;
  void LoadBitmap();
};

struct CPlugBitmapPackElem : public CPlug {
  CPlugBitmapPackElem();

  CPlugBitmap* FidBitmapSrc;
  uint TexelStartX;
  uint TexelStartY;
  const uint TexelCountX;
  const uint TexelCountY;
};

struct CPlugBitmapAddress : public CPlugBitmapSampler {
  CPlugBitmapAddress();

  bool ForcePassFill;
  bool UseBitmapTcScale;
  bool DirectTransfo;
  enum class CPlugBitmapAddress::EGxUVGenerate {
    NoGenerate = 0,
    CameraVertex = 1,
    WorldVertex = 2,
    WorldVertexXY = 3,
    WorldVertexXZ = 4,
    WorldVertexYZ = 5,
    CameraNormal = 6,
    WorldNormal = 7,
    CameraReflectionVector = 8,
    WorldReflectionVector = 9,
    WorldNormalNeg = 10,
    WaterReflectionVector = 11,
    Hack1Vertex = 12,
    MapTexel_DEPRECATED = 13, // MapTexel DEPRECATED
    FogPlane0 = 14,
    Vsk3SeaFoam = 15,
    ImageSpace = 16,
    LightDir0Reflect = 17,
    EyeNormal = 18,
    ShadowB1Pw01 = 19,
    Tex3AsPosPrCamera = 20,
    FlatWaterReflect = 21,
    FlatWaterRefract = 22,
    FlatWaterFresnel = 23,
    WorldPosXYblendZY = 24,
    DisableVshOutput = 25,
  };
  CPlugBitmapAddress::EGxUVGenerate GenerateUV;
  bool UVTransfoIso3;
  bool UVTransfoMat4;
  bool AreUVProjected;
  bool UseBumpEnvScale;
  float BumpEnvScale;
  uint TexCoordIndex;
  bool SkipAuto_m11_01;
  iso3 TransfoIso3;
  vec4 TransfoMat4U;
  vec4 TransfoMat4V;
  vec4 TransfoMat4W;
};

struct CPlugBitmapPackInput : public CPlug {
  CPlugBitmapPackInput();

  uint LayerCount;
  const MwFastBuffer<CPlugBitmap*> FidBitmaps;
};

// File extension: 'ScanCache.Gbx'
struct CPlugFileFidCache : public CPlugFileFidContainer {
  CPlugFileFidCache();

  CSystemFids* FidsToCreateCacheFrom;
  uint Version;
  const wstring RootEnumFullName;
};

struct CPlugVisual2D : public CPlugVisual {
};

struct CPlugVisualQuads2D : public CPlugVisual2D {
  CPlugVisualQuads2D();

};

// File extension: 'Font.Gbx'
struct CPlugFont : public CPlug {
};

// File extension: 'Font.Gbx'
struct CPlugFontBitmap : public CPlugFont {
  CPlugFontBitmap();

  CPlugFontBitmap* FallbackFont;
  uint NbPages;
  MwFastArray<CMwNod*> PageShaders;
  uint FontHeight;
  uint FontAscent;
  vec2 BBoxCapitalMin;
  vec2 BBoxCapitalMax;
  void LoadAllPages();
  void CreateCharRemap();
  const uint NbCharRemapPages;
  CPlugMaterial* CustomMaterialModel;
  const MwFastArray<CMwNod*> PageTextureFids;
  MwFastArray<wstring> PageTextureDataRefs;
};

struct CPlugTree : public CPlug {
  CPlugTree();

  const MwFastBuffer<CPlugTree*> Childs;
  bool IsVisible;
  bool IsCollidable;
  bool IsRooted;
  bool IsLightVolume;
  bool IsLightVolumeVisible;
  bool UseLocation;
  bool IsShadowCaster;
  bool IsFixedRatio2D;
  bool IsPickable;
  bool IsPickableVisual;
  bool IsPortal;
  const bool HasModel;
  bool TestBBoxVisibility;
  const bool IsCustomBBox;
  bool UseRenderBefore;
  iso4 Location;
  vec3 Translation;
  CPlugVisual* Visual;
  uint SubVisualIndex1;
  uint SubVisualIndex2;
  float SubVisualIndexB; // Range: 0 - 1
  uint SplitVisualIndex;
  uint SplitVisualCount;
  CPlugTreeGenerator* Generator;
  CPlugMaterial* Material;
  CPlug* Shader;
  CPlugSurface* Surface;
  void UpdateBBox();
  void Generate();
  CFuncTree* FuncTree;
  const vec3 BoundingBoxCenter;
  const vec3 BoundingBoxHalfDiag;
  const vec3 BoundingBoxMin;
  const vec3 BoundingBoxMax;
};

struct CPlugTreeGenerator : public CPlug {
  bool IsSaveGenerated;
  bool IsToKeepInSaveAsRelease;
};

// File extension: 'SoundGauge.Gbx'
struct CPlugSoundGauge : public CPlugSound {
  CPlugSoundGauge();

  CPlugFileSnd* FileSndFilling;
  CPlugFileSnd* FileSndEmptying;
  CPlugFileSnd* FileSndFillingFast;
  CPlugFileSnd* FileSndEmptyingFast;
  CPlugFileSnd* FileSndOnStopFilling;
  CPlugFileSnd* FileSndOnStopEmptying;
  CPlugFileSnd* FileSndOnStartFilling;
  CPlugFileSnd* FileSndOnStartEmptying;
  CPlugFileSnd* FileSndOnFull;
  CPlugFileSnd* FileSndOnEmpty;
  CPlugFileSnd* FileSndOnGradFull;
  CPlugFileSnd* FileSndOnGradEmpty;
  float FastRate;
  float FadeInDuration;
  float FadeOutDuration;
  float RestartLoopOnChange;
  CFuncKeysReal* PitchFromRateFilling;
  CFuncKeysReal* PitchFromRateEmptying;
  CFuncKeysReal* PitchFromRateOnStopFilling;
  CFuncKeysReal* PitchFromRateOnStopEmptying;
  CFuncKeysReal* PitchFromRateOnStartFilling;
  CFuncKeysReal* PitchFromRateOnStartEmptying;
  CFuncKeysReal* PitchFromRateOnFullOrEmpty;
  CFuncKeysReal* PitchFromRateOnGradFull;
  CFuncKeysReal* PitchFromRateOnGradEmpty;
  CFuncKeysReal* PitchFromRatioFilling;
  CFuncKeysReal* PitchFromRatioEmptying;
  CFuncKeysReal* PitchFromRatioOnStopFilling;
  CFuncKeysReal* PitchFromRatioOnStopEmptying;
  CFuncKeysReal* PitchFromRatioOnStartFilling;
  CFuncKeysReal* PitchFromRatioOnStartEmptying;
  CFuncKeysReal* PitchFromRatioOnFullOrEmpty;
  CFuncKeysReal* PitchFromRatioOnGradFull;
  CFuncKeysReal* PitchFromRatioOnGradEmpty;
  CFuncKeysReal* VolumeFromRateFilling;
  CFuncKeysReal* VolumeFromRateEmptying;
  CFuncKeysReal* VolumeFromRateOnStopFilling;
  CFuncKeysReal* VolumeFromRateOnStopEmptying;
  CFuncKeysReal* VolumeFromRateOnStartFilling;
  CFuncKeysReal* VolumeFromRateOnStartEmptying;
  CFuncKeysReal* VolumeFromRateOnFullOrEmpty;
  CFuncKeysReal* VolumeFromRateOnGradFull;
  CFuncKeysReal* VolumeFromRateOnGradEmpty;
  CFuncKeysReal* VolumeFromRatioFilling;
  CFuncKeysReal* VolumeFromRatioEmptying;
  CFuncKeysReal* VolumeFromRatioOnStopFilling;
  CFuncKeysReal* VolumeFromRatioOnStopEmptying;
  CFuncKeysReal* VolumeFromRatioOnStartFilling;
  CFuncKeysReal* VolumeFromRatioOnStartEmptying;
  CFuncKeysReal* VolumeFromRatioOnFullOrEmpty;
  CFuncKeysReal* VolumeFromRatioOnGradFull;
  CFuncKeysReal* VolumeFromRatioOnGradEmpty;
};

// File extension: 'GpuCache.Gbx'
struct CPlugGpuCompileCache : public CPlug {
  CPlugGpuCompileCache();

};

// File extension: 'Script.txt'
struct CPlugFileTextScript : public CPlugFileText {
  CPlugFileTextScript();

};

struct CPlugFileI18n : public CPlugFile {
  CPlugFileI18n();

};

struct CPlugVertexStream : public CPlug {
  CPlugVertexStream();

  bool IsStatic;
  const bool SkipVision;
  bool DirtyVision;
  CPlugVisualOctree* const Octree;
};

struct CPlugIndexBuffer : public CPlug {
  CPlugIndexBuffer();

  const bool IsStatic;
  const UnnamedEnum IndexType;
  const uint IndexCount;
};

struct CPlugBitmapRenderHemisphere : public CPlugBitmapRender {
  CPlugBitmapRenderHemisphere();

  float SpecularPower0;
  float SpecularPower1;
  bool AutoScaleWithPower;
  bool m_UseLightDir;
  UnnamedEnum HemiLayout;
};

struct CPlugFileOggVorbis : public CPlugFileSnd {
  CPlugFileOggVorbis();

};

struct CPlugBitmapRenderPortal : public CPlugBitmapRender {
  CPlugBitmapRenderPortal();

  float DepthFadeOutStart;
  float DepthFadeOutEnd;
};

struct CPlugBitmapRenderPlaneR : public CPlugBitmapRender {
  CPlugBitmapRenderPlaneR();

  UnnamedEnum Plane;
  bool IsPlaneEqValid;
  string TreeId;
  vec4 PlaneEq;
};

struct CPlugSimuDump : public CMwNod {
  CPlugSimuDump();

};

// File extension: 'SoundSurface.Gbx'
struct CPlugSoundSurface : public CPlugSound {
  CPlugSoundSurface();

  float EdMaxSpeedKmh;
  MwFastArray<CMwNod*> Texture;
  MwFastArray<CMwNod*> Skid;
  CFuncKeysReal* const SkidVolumeFromIntensity;
};

struct CPlugFileBink : public CPlugFile {
  CPlugFileBink();

};

struct CPlugFileVideo : public CPlugFileImg {
  void Play();
  void Pause();
  void Stop();
  void Rewind();
  UnnamedEnum TimeMode;
  bool IsLooping;
  const bool HasSound;
};

struct CPlugLocatedSound : public CMwNod {
  CPlugLocatedSound();

  CPlugSound* Sound;
  iso4 Loc;
};

struct CPlugTreeLight : public CPlugTree {
  CPlugTreeLight();

  CPlugLight* PlugLight;
  GxLight* const Light;
};

// File extension: 'Sound.Gbx'
struct CPlugSoundMulti : public CPlugSound {
  CPlugSoundMulti();

  enum class CPlugSoundMulti::ESoundInputMapping {
    Direct = 0,
    ForceRandom = 1,
    Distance = 2,
    Scale = 3,
  };
  MwFastBuffer<CPlugFileSnd*> AdditionalSounds;
  CPlugSoundMulti::ESoundInputMapping InputMapping;
  MwFastBuffer<vec3> PreferedDistances;
  CFuncKeysReal* VolumeFromInput;
  bool AvoidDuplicates;
  bool AlternateParity;
  float PitchVarianceNeg; // Range: 0 - 1
  float PitchVariancePos; // Range: 0 - 1
  float VolumeVariance; // Range: 0 - 1
};

struct CPlugSoundVideo : public CPlugSound {
  CPlugSoundVideo();

  CPlugFileVideo* const Video;
  CPlugFileImg* const ImageNonVideo;
};

// File extension: 'PointsInSphere.Gbx'
struct CPlugPointsInSphereOpt : public CPlug {
  CPlugPointsInSphereOpt();

};

struct CPlugShaderPass : public CPlug {
  CPlugShaderPass();

  const uint iPass;
  enum class CPlugShaderPass::EGxBlendFactor {
    _0 = 0, // 0
    _1 = 1, // 1
    SrcColor = 2,
    _1NSrcColor = 3, // 1-SrcColor
    SrcAlpha = 4,
    _1NSrcAlpha = 5, // 1-SrcAlpha
    DstColor = 6,
    _1NDstColor = 7, // 1-DstColor
    DstAlpha = 8,
    _1NDstAlpha = 9, // 1-DstAlpha
    SrcAlphaSat = 10,
    Constant = 11,
    _1NConstant = 12, // 1-Constant
  };
  CPlugShaderPass::EGxBlendFactor BlendSrc;
  CPlugShaderPass::EGxBlendFactor BlendDst;
  enum class CPlugShaderPass::ECullMode {
    Default = 0,
    Inverse_Culling = 1, // Inverse Culling
    DblSidedLighting = 2,
  };
  CPlugShaderPass::ECullMode CullMode;
  bool WriteZ;
  const bool IsValid;
  CPlugFileGPUV* VertexShader;
  CPlugFileGPUP* PixelShader;
  const MwFastArray<CPlugBitmapSampler*> VertexTextures;
};

// File extension: 'Shader.Gbx'
struct CPlugShaderSprite : public CPlugShaderApply {
  CPlugShaderSprite();

};

// File extension: 'Shader.Gbx'
struct CPlugShaderSpritePath : public CPlugShaderSprite {
  CPlugShaderSpritePath();

  CFuncKeysPath* FuncKeysPath;
};

struct CPlugVisualIndexed : public CPlugVisual3D {
};

struct CPlugTreeFrustum : public CPlugTree {
  CPlugTreeFrustum();

  bool Update;
  void ResetGrid();
  float FarZ;
  uint NbVisualX;
  uint NbVisualZ;
  uint NbPointX;
  uint NbPointZ;
};

// File extension: '.Svg'
struct CPlugFileSvg : public CPlugFile {
  CPlugFileSvg();

};

struct CPlugModelTree : public CMwNod {
  CPlugModelTree();

  const MwFastBuffer<CPlugModelTree*> Childs;
  const MwFastBuffer<CPlugModelLodMesh*> LodMeshes;
  MwFastBuffer<iso4> LodMeshesLocs;
  const MwFastBuffer<CPlugModelMesh*> Surfaces;
  const MwFastBuffer<iso4> SurfaceLocs;
  vec3 RotationPivot;
  vec3 ScalePivot;
  iso4 Location;
  const MwFastBuffer<CMwNod*> ChildGens;
  const MwFastBuffer<iso4> ChildGensLocs;
  const MwFastBuffer<MwId> ChildGensIds;
  const MwFastBuffer<bool> ChildGensDisableSurface;
  bool OptimIsKeepTree;
};

struct CPlugModelMesh : public CMwNod {
  CPlugModelMesh();

  const uint VertexCount;
  const uint InfluenceCount;
  const uint MorphCount;
  const uint FrameCount;
  const uint VertexInfluenceCount;
  const uint PolyCount;
  const uint TriCount;
  const uint QuadCount;
  const bool PolyIsMaterialIndex;
  const bool PolyIsSmoothingGroup;
  const bool PolyIsVertexNormal;
  const bool PolyIsVertexColor;
  const uint PolyVertexUvLayerCount;
  const bool PolyIsVertexTangent;
  bool PolyIsDoubleSide;
  const uint SpriteCount;
  const bool SpriteIsMaterialIndex;
  const bool SpriteIsDiameter;
  const bool SpriteIsColor;
  const bool SpriteIsRotAngle;
  const bool SpriteIsXYRatio;
  const bool SpriteIsTextureAtlas;
  const bool SpriteIsTextureSubId;
  const MwFastBuffer<CMwNod*> Exts;
};

// File extension: 'VHlsl.Txt'
struct CPlugFileVHlsl : public CPlugFileGPUV {
  CPlugFileVHlsl();

};

struct CPlugFileGPUV : public CPlugFileGPU {
};

struct CPlugFileGPUP : public CPlugFileGPU {
};

// File extension: 'PHlsl.Txt'
struct CPlugFilePHlsl : public CPlugFileGPUP {
  CPlugFilePHlsl();

};

// File extension: 'BitmapDecals.Gbx'
struct CPlugBitmapDecals : public CPlug {
  CPlugBitmapDecals();

  const MwFastBuffer<CPlugDecalModel*> DecalModels;
  const uint DecalSetCount;
  uint CellSizeX;
  uint CellSizeY;
  uint CellSizeZ;
};

// File extension: 'Material.Gbx'
struct CPlugMaterial : public CPlug {
  CPlugMaterial();

};

// File extension: 'MaterialFx.Gbx'
struct CPlugMaterialFx : public CPlug {
};

struct CPlugMaterialFxFlags : public CPlugMaterialFx {
  CPlugMaterialFxFlags();

};

// File extension: 'MaterialFx.Gbx'
struct CPlugMaterialFxFur : public CPlugMaterialFx {
  CPlugMaterialFxFur();

  uint ShellCount;
  float ShellThick;
  vec3 ShellLowRGB;
  float ShellLowAlpha;
  vec3 ShellHighRGB;
  float ShellHighAlpha;
  uint FenceCount;
  float FenceHeight;
  CPlugBitmap* FenceBitmap;
};

// File extension: 'MaterialFx.Gbx'
struct CPlugMaterialFxs : public CPlugMaterialFx {
  CPlugMaterialFxs();

  MwFastArray<CPlugMaterialFx*> MaterialFxs;
};

struct CPlugBitmapSampler : public CPlug {
  CPlugBitmapSampler();

  bool IsInternal;
  uint NbCompRequired;
  enum class CPlugBitmapSampler::EAlphaReq {
    None = 0,
    Binary = 1, // Binary(Tested)
    Translucent = 2, // Translucent(Blended)
  };
  CPlugBitmapSampler::EAlphaReq AlphaRequired;
  bool IsSharedByDevices;
  bool SrgbToLinear;
  bool UseBitmapDefaults;
  enum class CPlugBitmapSampler::EGxTexFilter {
    Point = 0,
    Bilinear = 1,
    Trilinear = 2,
    Anisotropic = 3,
    AnisoPoint = 4,
  };
  CPlugBitmapSampler::EGxTexFilter WantedFiltering;
  enum class CPlugBitmapSampler::EGxTexAddress {
    Wrap = 0,
    Mirror = 1,
    Clamp = 2,
    BorderSM3 = 3,
  };
  CPlugBitmapSampler::EGxTexAddress TexAddressU;
  CPlugBitmapSampler::EGxTexAddress TexAddressV;
  CPlugBitmapSampler::EGxTexAddress TexAddressW;
  vec3 BorderRGB;
  float BorderAlpha; // Range: 0 - 1
  const bool SynchNameWithShader;
  float MipMapLodBias;
  uint MaxMipLevel;
  const uint MaxAnisoRatio;
  CPlugBitmap* Bitmap;
};

struct CPlugBitmapShader : public CPlug {
  CPlugBitmapShader();

  CPlugShader* Shader;
  CPlugBitmap* BitmapToSwap;
};

// File extension: 'MaterialFx.Gbx'
struct CPlugMaterialFxDynaBump : public CPlugMaterialFx {
  CPlugMaterialFxDynaBump();

  bool IsCollidable;
  float SpeedMaxIntens;
  float MaxIntens;
  float Inter1SizeX;
  float Inter1SizeZ;
};

// File extension: 'MaterialFx.Gbx'
struct CPlugMaterialFxDynaMobil : public CPlugMaterialFx {
  CPlugMaterialFxDynaMobil();

};

struct CPlugScriptWithSettings : public CMwNod {
  CPlugScriptWithSettings();

  CPlugFileTextScript* Script;
  const MwFastBuffer<CScriptSetting*> Settings;
  void UpdateSettingsFromScript();
};

// File extension: 'zip'
struct CPlugFileZip : public CPlugFileFidContainer {
  CPlugFileZip();

  bool DisableCrc32Check;
};

struct CPlugFileAudioMotors : public CPlugFile {
  CPlugFileAudioMotors();

};

struct CPlugBitmapRender : public CPlug {
  enum class CPlugBitmapRender::ETrigger {
    None = 0,
    Once = 1,
    EachFrame = 2,
  };
  CPlugBitmapRender::ETrigger TriggerRender;
  uint cFrameToSkip;
  UnnamedEnum RenderPath;
  enum class CPlugBitmapRender::ERenderPathFails {
    Ignore = 0,
    Hide = 1,
  };
  CPlugBitmapRender::ERenderPathFails RenderPathFails;
  bool IVIdMaskReflected;
  bool IVIdMaskReflectMirror;
  bool IVIdMaskRefracted;
  bool IVIdMaskViewDepBump;
  bool IVIdMaskViewDepOcclusion;
  bool IVIdMaskOnlyRefracted;
  bool IVIdMaskHideWhenUnderground;
  bool IVIdMaskFoilage;
  bool IVIdMaskHideAlways;
  bool IVIdMaskHideButPick;
  bool IVIdMaskBackground;
  bool IVIdMaskGrassRGB;
  bool IVIdMaskLightGenP;
  bool IVIdMaskVehicle;
  bool IVIdMaskHideOnlyDirect;
  bool IVIdMaskInvisibleStopBounce;
  bool IVIdRefReflected;
  bool IVIdRefReflectMirror;
  bool IVIdRefRefracted;
  bool IVIdRefViewDepBump;
  bool IVIdRefViewDepOcclusion;
  bool IVIdRefOnlyRefracted;
  bool IVIdRefHideWhenUnderground;
  bool IVIdRefFoilage;
  bool IVIdRefHideAlways;
  bool IVIdRefHideButPick;
  bool IVIdRefBackground;
  bool IVIdRefGrassRGB;
  bool IVIdRefLightGenP;
  bool IVIdRefVehicle;
  bool IVIdRefHideOnlyDirect;
  bool IVIdRefInvisibleStopBounce;
  bool SVIdMaskReflected;
  bool SVIdMaskReflectMirror;
  bool SVIdMaskRefracted;
  bool SVIdMaskViewDepBump;
  bool SVIdMaskViewDepOcclusion;
  bool SVIdMaskOnlyRefracted;
  bool SVIdMaskHideWhenUnderground;
  bool SVIdMaskFoilage;
  bool SVIdMaskHideAlways;
  bool SVIdMaskHideButPick;
  bool SVIdMaskBackground;
  bool SVIdMaskGrassRGB;
  bool SVIdMaskLightGenP;
  bool SVIdMaskVehicle;
  bool SVIdMaskHideOnlyDirect;
  bool SVIdMaskInvisibleStopBounce;
  bool SVIdRefReflected;
  bool SVIdRefReflectMirror;
  bool SVIdRefRefracted;
  bool SVIdRefViewDepBump;
  bool SVIdRefViewDepOcclusion;
  bool SVIdRefOnlyRefracted;
  bool SVIdRefHideWhenUnderground;
  bool SVIdRefFoilage;
  bool SVIdRefHideAlways;
  bool SVIdRefHideButPick;
  bool SVIdRefBackground;
  bool SVIdRefGrassRGB;
  bool SVIdRefLightGenP;
  bool SVIdRefVehicle;
  bool SVIdRefHideOnlyDirect;
  bool SVIdRefInvisibleStopBounce;
  bool CustomFog;
  float FogCustomFarZ;
  bool TreeMipForceLowQ;
  bool RenderShadows;
  bool NoShadowMPass;
  bool RenderProjectors;
  bool RenderZoneFogG;
  bool RenderLightFlares;
  bool InvertY;
  bool OnePixBorder;
  bool UseZBuffer;
  CPlugBitmapRender::ETrigger TriggerClearRGBA;
  vec3 ClearRGB;
  float ClearAlpha; // Range: 0 - 1
  UnnamedEnum ClearFogColor;
  bool IgnoreClearBitmap;
  bool HideSun;
  bool WriteRed;
  bool WriteGreen;
  bool WriteBlue;
  bool WriteAlpha;
  bool WriteTranslAlpha;
  bool ForceAlphaToOne;
  bool ForceAlphaToWrittenZ;
  CPlugBitmap* BitmapClear;
  UnnamedEnum BitmapClearMode;
  vec2 BitmapClearUV;
  uint SuperSampleLevel;
  uint BlurTexelCount;
  bool BlurWRed;
  bool BlurWGreen;
  bool BlurWBlue;
  bool BlurWAlpha;
  uint GutterTexelCount;
  bool HdrToneMap;
  bool RenderMultiLight;
  bool UpdateForEachCamera;
  CPlugBitmapRenderSub* RenderSub;
  void CleanRenderCache();
};

struct CPlugBitmapRenderWater : public CPlugBitmapRender {
  CPlugBitmapRenderWater();

  enum class CPlugBitmap::E__ {
    Refraction = 0,
    Reflection = 1,
  };
  CPlugBitmap::E__ WaterType;
  float FogMaxDepth;
  float FogClampAboveDist;
  float MaxDistPlaneToAlpha;
  bool MirrorGeom;
  float MirrorScaleY; // Range: 0 - 1
  bool UseClipPlane;
  float ClipPlaneHeight;
  bool UseFMargin;
  bool FrustumUseHorizon;
  float FMargin;
  float FHMargin;
  bool RndLDirSpecInA;
  bool MaskWater2d;
  bool UseCameraZClip;
  bool AddWaterFog;
  bool NoSubWaterOptim;
  bool BlitCubeAtFarZ;
  bool DisableGeomOptim;
  UnnamedEnum ReflectNoGeom;
  UnnamedEnum QualityTech3;
  bool DisableConfigQuality;
  bool HqSplitSkyOutDepth;
  bool FogUseSharedParams;
  UnnamedEnum WaterHeight;
  float m_WaterHeightInW;
  bool UseBufferRefract;
  uint DisableRenderSkipOptims;
  float InvisibleRatio;
  uint InvisibleSleepPeriod;
  const float TmpWaterVisibilityRatio; // Range: 0 - 1
  uint MaxUpdatePeriod;
  float MaxCameraDeltaPos;
  float MinCameraDeltaCos;
  const float FrameRenderRatio;
  CPlugBitmap* BitmapSplitSky;
  CPlugBitmap* BitmapDepth;
};

struct CPlugBitmapRenderCubeMap : public CPlugBitmapRender {
  CPlugBitmapRenderCubeMap();

  void SaveInTga();
  uint CubeFaceCount;
  vec3 CenterPos;
  float NearZ;
  float FarZ;
  UnnamedEnum eFarZ;
  float MinDistToUpdate;
  bool AverageReceiverCenters;
  UnnamedEnum Discard;
  bool UseItemShaderFilter;
  CPlugBitmap* BitmapImageSpace;
  float BitmapImageSpaceDistToCenter;
  float BitmapImageSpaceScaleHeight;
};

struct CPlugBitmapRenderCamera : public CPlugBitmapRender {
  CPlugBitmapRenderCamera();

  bool UseCameraDrawRect;
  bool UseCameraScissor;
  UnnamedEnum CameraMode;
  iso4 CameraToVisual;
  float ScaleZRange;
  CMwNod* Camera;
  float DepthBias;
  float DepthBiasSlope;
  float PlaneY_Offset;
};

struct CPlugBitmapRenderVDepPlaneY : public CPlugBitmapRender {
  CPlugBitmapRenderVDepPlaneY();

  CPlugViewDepLocator* ViewDepLocator;
};

struct CPlugFileSndGen : public CPlugFileSnd {
  CPlugFileSndGen();

};

struct CPlugMaterialFxGenCV : public CPlugMaterialFx {
  CPlugMaterialFxGenCV();

  float DeltaYMax;
  float DeltaYMin;
  MwFastArray<CPlugMaterial*> MaterialToRayCasts;
};

// File extension: 'SoundEngine.Gbx'
struct CPlugSoundEngine : public CPlugSound {
  CPlugSoundEngine();

  MwFastArray<CPlugSoundComponent*> Components;
  float MaxRpm;
  CFuncKeysReal* const Volume_Speed;
  CFuncKeysReal* const Volume_Distance;
  CFuncKeysReal* const Volume_Rpm;
  CFuncKeysReal* const Volume_Accel;
  CFuncKeysReal* const Alpha_Speed;
  CFuncKeysReal* const Alpha_Distance;
  CFuncKeysReal* const Alpha_Rpm;
  CFuncKeysReal* const Alpha_Accel;
};

struct CPlugSoundComponent : public CMwNod {
  CPlugSoundComponent();

  CPlugFileSnd* PlugFile;
  float MinVolume;
  float MaxVolume;
  float FadeInStartSpeedKmh;
  float FadeInEndSpeedKmh;
  float FadeOutStartSpeedKmh;
  float FadeOutEndSpeedKmh;
  float MinPitch;
  float MaxPitch;
  float PitchShiftStartSpeedKmh;
  float PitchShiftEndSpeedKmh;
};

struct CPlugBitmapRenderSolid : public CPlugBitmapRender {
  CPlugBitmapRenderSolid();

  UnnamedEnum TriggerBitmap;
  UnnamedEnum TriggerShader;
  UnnamedEnum TriggerSolid;
  UnnamedEnum BitmapFilter;
  CPlugBitmap* Bitmap;
  CPlugShader* Shader;
  const MwFastBuffer<CPlugSolid*> Solids;
  MwFastBuffer<iso4> Locations;
};

struct CPlugBitmapRenderSub : public CPlugBitmapRender {
  CPlugBitmapRenderSub();

  CPlugShader* ShaderToForce;
};

// File extension: 'Model.Gbx'
struct CPlugModel : public CPlugTreeGenerator {
  CPlugModel();

  string Origin;
  float ExportScale;
  CPlugModelTree* const ModelTree;
  float VertexPositionsQuantize;
};

struct CPlugIconIndex : public CMwNod {
  CPlugIconIndex();

};

struct CPlugFileModel : public CPlugFile {
};

struct CPlugFileModelObj : public CPlugFileModel {
  CPlugFileModelObj();

};

// File extension: 'GenSolid.Gbx'
struct CPlugTreeGenSolid : public CPlugTreeGenerator {
  CPlugTreeGenSolid();

  bool MergeInstances;
  CPlugSolid* Solid;
  CPlugMaterial* SolidReplaceMaterial;
  bool UseCustomFuncTree;
  float CustomFuncTreePhase;
  float CustomFuncTreePeriodScale;
};

struct CPlugFileModel3ds : public CPlugFileModel {
  CPlugFileModel3ds();

};

struct CPlugModelLodMesh : public CMwNod {
  CPlugModelLodMesh();

  const bool OptimSplitGridIsUse;
  vec3 OptimSplitGridCellSize;
  vec3 OptimSplitGridOrigin;
  string OptimGroupId;
  bool OptimIsCreateSubInfluences;
};

// File extension: 'ModelFur.Gbx'
struct CPlugModelFur : public CMwNod {
  CPlugModelFur();

  uint RandSeed;
  bool Enabled;
  string MaterialName;
  CPlugMaterial* Material;
  CMwNod* DiffuseMap;
  CMwNod* SpecularMap;
  CMwNod* DensityMap;
  CMwNod* DirAlphaMap;
  CMwNod* DirBetaMap;
  CMwNod* WidthMap;
  CMwNod* LengthMap;
  CMwNod* CurvatureMap;
  uint MapAtlasX;
  uint MapAtlasY;
  bool RandomUDir;
  float DirAlphaDeg;
  float DirAlphaVarDeg;
  float DirBetaDeg;
  float DirBetaVarDeg;
  float CurvatureDeg;
  float CurvatureVarDeg;
  float HelixDeg;
  float HelixVarDeg;
  float Width;
  float WidthVar; // Range: 0 - 1
  float Length;
  float LengthVar; // Range: 0 - 1
  float NormalBendAngleX;
  float NormalBendAngleY;
  bool Debug;
  bool DoubleLayer;
  bool ModulateWidthByTriSurf;
  uint DensityMax;
  bool DensityInAtlasY;
  float DensityRandom;
  uint DensitySampling;
  float FluffPosRandom;
  bool DynaEnabled;
  float DynaK1;
  float DynaK1Var;
  float DynaK2;
  float DynaK2Var;
  float DynaAccel;
  float DynaAccelVar;
  bool DynaZeroBeta;
  float DynaAlphaMin;
  float DynaAlphaMax;
  float DynaBetaMin;
  float DynaBetaMax;
  uint FluffChunkCount;
  uint ChunkVertCount;
  bool FluffShapeCircular;
  float FluffShapeEndWidthCoef;
  uint HairMaxCount;
};

struct CPlugBitmapRenderOverlay : public CPlugBitmapRender {
  CPlugBitmapRenderOverlay();

  bool IsOverlaySelfBlur;
  float TexelByPixel;
  bool CanRenderInSubRect;
};

struct CPlugBitmapRenderLightOcc : public CPlugBitmapRender {
  CPlugBitmapRenderLightOcc();

  float FovY;
  float OpacityLightThrough; // Range: 0 - 1
  float OpacityLensFlare; // Range: 0 - 1
  float FlareThreshold; // Range: 0 - 1
  CPlugBitmap* BitmapToModulate;
};

// File extension: 'ViewDepLocator.Gbx'
struct CPlugViewDepLocator : public CMwNod {
  CPlugViewDepLocator();

  float MinY;
  float MaxY;
  bool UseWaterY;
};

struct CPlugTreeViewDep : public CPlugTree {
};

// File extension: 'DecoTree.Gbx'
struct CPlugDecoratorTree : public CMwNod {
  CPlugDecoratorTree();

  MwId TreeId;
  CPlugMaterial* Material;
  CPlugTreeLight* TreeLight;
  enum class CPlugDecoratorTree::EBoolCond {
    Never = 0,
    LowOnly = 1,
    LowAndMedium = 2,
    MediumOnly = 3,
    MediumAndHigh = 4,
    HighOnly = 5,
    Always = 6,
  };
  CPlugDecoratorTree::EBoolCond ExistCond;
  CPlugDecoratorTree::EBoolCond VisibleCond;
  bool VisibleApplyOnChilds;
  CPlugDecoratorTree::EBoolCond ShadowCasterCond;
  bool ShadowCasterApplyOnChilds;
  bool TransformVisualToSurface;
  CPlugDecoratorTree::EBoolCond CollidableCond;
  bool NoLocation;
};

// File extension: 'DecoSolid.Gbx'
struct CPlugDecoratorSolid : public CMwNod {
  CPlugDecoratorSolid();

  const MwFastBuffer<CPlugDecoratorTree*> TreeDecorators;
};

// File extension: 'ModelFences.Gbx'
struct CPlugModelFences : public CMwNod {
  CPlugModelFences();

  float BlockSizeXZ;
  uint BlockFenceCountXZ;
  vec2 FenceRangeY;
  float LodMaxDist;
  uint RandSeed;
  CPlugMaterial* MaterialFences;
  bool IsOrthos;
  bool IsDiags;
  bool OnlyOnePlaneY;
  const bool UseSkinShader;
  bool Debug;
  bool DebugRand;
  bool DebugEdges;
};

struct CPlugFileModelFbx : public CPlugFileModel {
  CPlugFileModelFbx();

};

// File extension: 'FurWind.Gbx'
struct CPlugFurWind : public CMwNod {
  CPlugFurWind();

  vec3 WorldDir;
  float Intensity;
  CFuncNoise* NoiseFunc;
};

// File extension: 'Decal.Gbx'
struct CPlugDecalModel : public CPlug {
  CPlugDecalModel();

  bool IsObsolete;
  CPlugBitmap* Icon;
  float TexelByMeter;
  float MaxAngleN; // Range: 0 - 90
  bool FadeNormalAndZ;
  CPlugBitmap* DiffuseA;
  CPlugBitmap* Specular;
  CPlugBitmap* Normal;
  float ImpactSize;
  UnknownType Svg;
  float SvgSize;
  float SvgAlpha;
  CPlugSolid* Solid;
  CPlugBitmap* _3dSpriteBitmap;
  MwId _3dSpriteGroupId;
  bool RandomInstances;
  float MaxAngleN3d; // Range: 0 - 180
  uint MinAngleN3d; // Range: 0 - 180
};

struct CPlugBitmapAtlas : public CPlug {
  CPlugBitmapAtlas();

};

// File extension: 'SphericalHarmonics.Gbx'
struct CPlugSphericalHarmonics : public CPlug {
  CPlugSphericalHarmonics();

};

struct CPlugBitmapArray : public CPlug {
  CPlugBitmapArray();

};

struct CPlugSpriteParam : public CPlug {
  CPlugSpriteParam();

  enum class CPlugVisualSprite::ERenderMode {
    Quad = 0,
    RotatedQuad = 1,
  };
  CPlugVisualSprite::ERenderMode RenderMode;
  UnnamedEnum Usage;
  bool RadiusInScreen;
  bool UseGlobalDir;
  bool SortBackToFront;
  vec3 GlobalDirection;
  vec2 PivotPoint;
  float GlobalDirTiltFactor; // Range: 0 - 1
  float ZBiasFactor; // Range: 0 - 1
  float TextureHeightInWorld;
  float VisibleMaxDistAtFov90;
  float VisibleMinScreenHeight01;
};

// File extension: 'exr'
struct CPlugFileExr : public CPlugFileImg {
  CPlugFileExr();

};

// File extension: 'PoissonDiscDistribution.Gbx'
struct CPlugPoissonDiscDistribution : public CPlug {
  CPlugPoissonDiscDistribution();

};

// File extension: 'hdr'
struct CPlugFileHdr : public CPlugFileImg {
  CPlugFileHdr();

};

struct CPlugAnimFile : public CMwNod {
  CPlugAnimFile();

};

struct CPlugVisualCelEdge : public CPlugVisual {
  CPlugVisualCelEdge();

};

// File extension: 'ParticleEmitterSubModel.Gbx'
struct CPlugParticleEmitterSubModel : public CMwNod {
  CPlugParticleEmitterSubModel();

  bool IsActive;
  bool IsSolo;
  enum class CPlugParticleEmitterSubModel::EParticleEmitterSubModel {
    Standard = 0,
    MultiState = 1,
    OneParticle = 2,
    VortexSim_Particle = 3,
    VortexSim_VortexFilament = 4,
    VortexSim_Repulsor = 5,
    Chain = 6,
    Gpu = 7,
  };
  CPlugParticleEmitterSubModel::EParticleEmitterSubModel ParticleEmitterSubModel;
  uint MaxParticleCount;
  bool MultiState_IsAsyncLink;
  uint PartChain_MaxCount;
  uint PartChain_MaxPartPerChain;
  bool PartChain_AddLinkOnDestroy;
  CPlugParticleGpuSpawn* GpuSpawn;
  CPlugParticleGpuModel* GpuModel;
  CPlugParticleSplashModel* SplashModel;
  uint SpawnStartTime;
  uint SpawnEndTime;
  void SpawnEndTimeNull();
  enum class CPlugParticleEmitterSubModel::ESpawnCond {
    Active_FixedPeriod = 0, // Active&FixedPeriod
    Active_MinDist = 1, // Active&MinDist
    Active = 2,
    None = 3,
    Active_FixedDist = 4, // Active&FixedDist
  };
  CPlugParticleEmitterSubModel::ESpawnCond SpawnCond;
  float SpawnPeriod;
  float SpawnMinDist;
  iso4 SpawnLocOffset;
  CFuncEnvelope* SpawnIntensityFromSpawnNormLife;
  float Life;
  float LifeVariation;
  uint LifePeriodMs_OnePart;
  enum class CPlugParticleEmitterSubModel::EMultiStateRenderMode {
    LineNormal = 0,
    LineWideWorld = 1,
    LineWideScreen = 2,
    QuadCenterLeft = 3,
    QuadUp = 4,
    WaterSplash = 5,
    LightTrail = 6,
    GrassMarks = 7,
  };
  CPlugParticleEmitterSubModel::EMultiStateRenderMode MultiStateRenderMode;
  enum class CPlugParticleEmitterSubModel::EStandardRenderMode {
    QuadCamera = 0,
    WaterSplash = 1,
    QuadSpeed = 2,
    LinesSpeedCamera = 3,
    Mesh = 4,
    Triangle = 5,
    LightOnly = 6,
    Beam = 7,
  };
  CPlugParticleEmitterSubModel::EStandardRenderMode StandardRenderMode;
  bool SortSprites;
  float ViewDistMax;
  CPlugMaterial* Material;
  CPlugShader* Shader;
  CPlugSolid2Model* Mesh;
  wstring MeshRef;
  bool MeshUseInstancing;
  iso4 MeshLocOffset;
  bool MeshLocUseScale;
  bool MeshLocScaleFromIntensity;
  uint CircularTrailVertPerPartCount;
  bool LightTrail_Hack_ImmobileEmitter;
  float SizeBirthRatioXY;
  vec2 SpritePivotPoint;
  enum class CPlugParticleEmitterSubModel::ETextureAtlas {
    None = 0,
    Fixed = 1,
    Random = 2,
    AnimatedRandom = 3,
    AnimatedSynchro = 4,
  };
  CPlugParticleEmitterSubModel::ETextureAtlas TextureAtlas;
  uint TextureAtlasDimX;
  uint TextureAtlasDimY;
  uint TextureAtlasCount;
  bool TextureAtlasTopToBottom;
  uint TextureAtlasFixedIndex;
  uint TextureAtlasAnimationPeriodMs;
  bool TextureAtlasAnimationRandomPhase;
  CFuncEnvelope* IntensityFilter;
  float SizeBirth;
  float SizeBirthVariation;
  bool SizeBirthUseEmissionZone;
  float SizeBirthEmissionZoneScale;
  bool SizeBirthUseIntensity;
  CFuncEnvelope* SizeOverLife;
  bool SizeUseSizeX;
  CFuncEnvelope* SizeXOverLife;
  float BeamLengthSpeedScale;
  float BeamLengthMax;
  float RollSpeedBirth;
  float RollSpeedBirthVariation;
  CFuncColorGradient* ColorGradient;
  enum class CPlugParticleEmitterSubModel::EColorGradientUse {
    RandomConstantColor = 0,
    ColorOverLife = 1,
  };
  CPlugParticleEmitterSubModel::EColorGradientUse ColorGradientUse;
  bool ColorModulateWithTransparency;
  UnnamedEnum ColorType;
  bool ColorBirthUseIntensity;
  float TransparencyBirth;
  float TransparencyBirthVariation;
  bool TransparencyBirthUseIntensity;
  CFuncEnvelope* TransparencyOverLife;
  float UScaleDist;
  float VScaleDist;
  float WaterSplashVelY;
  GxLightBall* Light;
  CFuncEnvelope* LightRadiusOverLife;
  CFuncColorGradient* LightColorOverLife;
  bool LightUseEmitterHue;
  bool LightColorModulateWithTransparency;
  float WeightBirth;
  float WeightBirthVariation;
  float FluidFrictionBirth;
  float FluidFrictionBirthVariation;
  bool FluidFrictionBirthUseIntensity;
  float FluidFrictionBirthIntensityBase; // Range: 0 - 1
  bool RelativeToEmitter;
  bool CollisionEnabled;
  float CollisionBounce;
  float CollisionDamper;
  float CollisionRadius;
  bool PrecalcEnabled;
  uint PrecalcPartCount;
  uint PrecalcSampleRate;
  uint SimulatedSmokeLifeSpanMs;
  float SimulatedSmokeInfluenceRadius;
  float SimulatedSmokeGravity; // Range: 0 - 20
  CFuncKeysReal* SimulatedSmokeParticleSizeOverLife;
  CFuncKeysReal* SimulatedSmokeParticleAlphaOverLife;
  float SimulatedSmokeParticleBaseSize;
  float SimulatedSmokeParticleSizeRandomness;
  float SimulatedSmokeParticlePositionRandomRadius;
  float SimulatedSmokeParticlePositionRandomness;
  float SimulatedSmokeParticleLifeDistance;
  vec3 SimulatedSmokeParticleBaseColor;
  CFuncKeysReal* SimulatedSmokeFilamentStrengthOverLife;
  float SimulatedSmokeFilamentBaseStrength;
  float SimulatedSmokeFilamentPositionRandomRadius;
  float SimulatedSmokeFilamentPositionRandomness;
  float EmitStateFromImpactDirNormalCoef;
  float EmitStateFromImpactDirTangentialCoef;
};

// File extension: 'ParticleModel.Gbx'
struct CPlugParticleEmitterModel : public CMwNod {
  CPlugParticleEmitterModel();

  bool IsSplashMode;
  MwFastBuffer<CPlugParticleEmitterSubModel*> ParticleEmitterSubModels;
  MwFastBuffer<CMwParamStringInt*> ParticleEmitterSubModelsInLibrary;
};

// File extension: 'BeamModel.Gbx'
struct CPlugBeamEmitterModel : public CMwNod {
  CPlugBeamEmitterModel();

  MwFastBuffer<CPlugBeamEmitterSubModel*> SubModels;
};

struct CPlugParticleSplashModel : public CMwNod {
  CPlugParticleSplashModel();

};

struct CPlugParticleImpactModel : public CMwNod {
  CPlugParticleImpactModel();

};

struct CPlugParticleMaterialImpactModel : public CMwNod {
  CPlugParticleMaterialImpactModel();

};

struct CPlugBitmapApplyArray : public CPlug {
  CPlugBitmapApplyArray();

};

struct CPlugOpModel : public CMwNod {
  CPlugOpModel();

};

struct CPlugSkel : public CMwNod {
  CPlugSkel();

};

struct CPlugSolid2Model : public CMwNod {
  CPlugSolid2Model();

};

struct CPlugFileModelCollada : public CPlugFileModel {
  CPlugFileModelCollada();

};

struct CPlugTimedPixelArray : public CPlug {
  CPlugTimedPixelArray();

};

struct CPlugResource : public CMwNod {
  CPlugResource();

};

struct CPlugFileGenScriptCtx : public CPlug {
  CPlugFileGenScriptCtx();

  uint TexelCountX;
  uint TexelCountY;
  uint TexelIndexX;
  uint TexelIndexY;
  uint LevelIndex;
  float TexelValueR;
  float TexelValueG;
  float TexelValueB;
  float TexelValueA;
};

struct CPlugFxLensFlareArray : public CPlug {
  CPlugFxLensFlareArray();

};

struct CPlugParticleEmitterSubModelGpu : public CMwNod {
  CPlugParticleEmitterSubModelGpu();

};

struct CPlugParticleGpuSpawn : public CMwNod {
  CPlugParticleGpuSpawn();

};

struct CPlugParticleGpuModel : public CMwNod {
  CPlugParticleGpuModel();

};

struct CPlugCharVisModel : public CMwNod {
  CPlugCharVisModel();

};

struct CPlugSkelSetup : public CMwNod {
  CPlugSkelSetup();

};

struct CPlugCharPhyModel : public CMwNod {
  CPlugCharPhyModel();

};

struct CPlugCharPhyMaterial : public CMwNod {
  CPlugCharPhyMaterial();

};

struct CPlugFxLensDirtGen : public CMwNod {
  CPlugFxLensDirtGen();

  MwId AtlasId;
  uint Count;
  float ScreenSizeYMin; // Range: 0 - 1
  float ScreenSizeYMax; // Range: 0 - 1
  float Intens_Min; // Range: 0 - 1
  float Intens_Max; // Range: 0 - 1
};

struct CPlugShieldEmitterModel : public CMwNod {
  CPlugShieldEmitterModel();

};

// File extension: 'Bullet.Gbx'
struct CPlugBulletModel : public CMwNod {
  CPlugBulletModel();

  enum class CPlugBulletModel::EBulletType {
    Projectile = 0,
    Laser = 1,
    Beam = 2,
    TriLaser = 3,
    ProjectileHoming = 4,
    Spear = 5,
  };
  enum class CPlugBulletModel::EExplosionOccultationTest {
    Binary = 0,
    Smoother = 1,
  };
  enum class CPlugBulletModel::EFireBulletPatternMode {
    NoPattern = 0,
    GrowingOffset = 1,
    Spiral = 2,
    Hatchet = 3,
    Net = 4,
    ChaosSpiral = 5,
  };
  CPlugBulletModel::EBulletType BulletType;
  float BulletRadius;
  float BulletVsRadiusMargin;
  uint BulletVsMinAgeMs;
  float Speed;
  CFuncKeysReal* SpeedFromHorizonAngle;
  float GunSpeedCoef;
  float GunSpeedCoefRatioMin;
  float GunSpeedCoefRatioMax;
  float RestSpeed;
  float LifeTime;
  float LifeTimeAfterFirstImpact;
  float Mass;
  float FluidFriction;
  float TrajectoryUTurnDistance;
  float ImpactBouncingN;
  float ImpactBouncingT;
  float TriLaserRadiusAtOneMeter_Zoom0;
  float TriLaserRadiusAtOneMeter_Zoom1;
  float TriLaserNearMissDist;
  float ProjectileNearMissDist;
  float ProjectileNearMissDelay;
  uint ChargeDurationFull;
  uint ChargeDurationStop;
  float SpearLockDist;
  float BeamMaxLength;
  uint ExplosionOnImpactCount;
  UnnamedEnum ExplosionOnImpactCountOnlyOnMaterialId;
  bool ExplosionOnEndLife;
  UnnamedEnum ExplosionOnSurfaceMaterialId;
  float ExplosionDetectionRadius_Resting;
  float ExplosionDetectionRadius_Flying;
  float ExplosionOnAllPlayers;
  int ExplosionDamage;
  float ExplosionDamageRadius;
  float ExplosionDamageRadiusAttenuation; // Range: 0 - 1
  float ExplosionBlow;
  float ExplosionBlowRadius;
  float ExplosionBlowRadiusAttenuation; // Range: 0 - 1
  CFuncKeysReal* ExplosionRadiusCoefFromLifeTime;
  float ExplosionBlowVerticalScale;
  UnnamedEnum EndLifeWithoutExplosionOnMaterialId;
  CPlugBulletModel::EExplosionOccultationTest ExplosionOccultationTest;
  float ExplosionEnergyWhenOccluded; // Range: 0 - 1
  CFuncKeysReal* ExplosionEnergyFromLifeTime;
  float HomingDist; // Range: 1 - 100
  float HomingPeriod; // Range: 0.1 - 1
  float HomingMaxAnglularSpeed; // Range: 10 - 320
  bool IsFlare;
  float FlareAttractionRadius;
  float FlareExplosionRadius;
  bool Sm_AutoAim;
  float Sm_AimIntertia;
  uint Sm_ThisHitOtherBulletBonusDuration;
  float Sm_ThisHitOtherBulletBonusAmmoCount;
  uint Sm_OtherHitThisBulletBonusDuration;
  float Sm_OtherHitThisBulletBonusAmmoCount;
  bool HoldTriggerToPower;
  CFuncKeysReal* SpeedFromTriggerDuration;
  uint AmmoCostDuringTriggerDuration;
  CFuncKeysReal* SpreadCoefFormChargeDuration;
  uint FirePeriod;
  uint FireEnergyCost;
  uint FireMaxEnergyStorage;
  uint EnergyGainDelay;
  uint DefuserFirePeriod;
  uint DefuserMissAmmoLoss;
  uint FireBulletCount;
  float FireBulletDispersionAngleDeg;
  float FireBulletCountSpeedCoef;
  MwFastBuffer<vec3> FireBulletSpreads;
  CPlugBulletModel::EFireBulletPatternMode FireBulletPattern_Mode;
  MwFastBuffer<vec3> FireBulletPattern_GrowingOffset_Offsets;
  float FireBulletPattern_InitialBlendDuration; // Range: 0 - 60
  uint FireBulletPattern_SpiralHatchetNet_BulletCount; // Range: 1 - 255
  float FireBulletPattern_SpiralHatchetNet_Radius; // Range: 0 - 100
  float FireBulletPattern_SpiralHatchetNet_SpinPerSecond; // Range: -1000 - 1000
  bool FireBulletPattern_RotateOddBulletsCounterClockwise;
  bool FireBulletPattern_ApexRegroup;
  float FireBulletPattern_ApexRegroup_MinApexTime; // Range: 0 - 10
  bool FireBulletPattern_ChaosSpiral_Spin;
  MwFastBuffer<float> FireBulletPattern_ChaosSpiral_Offsets;
  CPlugSound* SoundFire;
  CPlugSound* SoundAlive;
  CPlugSound* SoundReloading;
  CPlugSound* SoundGauge;
  CPlugSound* SoundIsHoming;
  vec3 SoundFireOffset;
  CFuncKeysReal* SoundAliveVolumeFromRemainingLifeTime;
  CFuncKeysReal* SoundAlivePitchFromRemainingLifeTime;
  CFuncKeysReal* SoundFireVolumeFromRemainingAmmo;
  CFuncKeysReal* SoundFirePitchFromRemainingAmmo;
  CPlugParticleEmitterModel* ParticleModelFire;
  CPlugParticleEmitterModel* ParticleModelAlive;
  CPlugParticleMaterialImpactModel* ImpactBounce;
  CPlugParticleMaterialImpactModel* ExplosionBullet;
  CPlugParticleMaterialImpactModel* ExplosionSurface;
  CPlugBeamEmitterModel* BeamVisualModel;
  float HiddenDist;
  vec3 VisualOffsetFirstPerson;
  float VisualOffsetDuration;
  float VisualOffsetDerivTimeOffset;
  bool WarmUp;
  wstring Name;
  CPlugBitmap* BitmapLasersight;
  CPlugBitmap* BitmapCrosshair;
  CPlugBitmap* BitmapCrosshairTriLaser;
  float SizeXScreenPercent;
  float SizeYScreenPercent;
  float SizeXScreenPercentMax;
  float SizeYScreenPercentMax;
  CPlugBitmap* Icon;
  bool ShowImpactPos;
  MwId Sm_SpModelName;
  uint Sm_SpChargeDuration;
  uint Sm_SpInactivityDelayBeforeCharge;
  bool Sm_FirstPersonCam;
  vec3 Sm_FirstPersonCamOffset;
  float Sm_FirstPersonCamFov;
  uint Sm_ProtectDuration;
};

struct CPlugDataTape : public CMwNod {
  CPlugDataTape();

};

struct CPlugSpline3D : public CMwNod {
  CPlugSpline3D();

  const float Length;
  vec3 Translate;
  CFuncKeysTrans* const Keys;
};

struct CPlugTrafficPathSquares : public CMwNod {
  CPlugTrafficPathSquares();

  MwId Id;
  const string Name;
  MwFastBuffer<int3> Squares;
};

// File extension: 'PlugTrafficObjectParams.Gbx'
struct CPlugTrafficObjectParams : public CMwNod {
  CPlugTrafficObjectParams();

  float DefaultSpeed;
  float DefaultAcceleration;
  float DefaultDecceleration;
  UnnamedEnum TrafficPathType;
  UnnamedEnum TrafficModel;
  iso4 BaseOffset;
  uint PointDelay;
};

struct CPlugTrafficZoneSquares : public CMwNod {
  CPlugTrafficZoneSquares();

  MwId Id;
  const string Name;
  MwFastBuffer<int3> Squares;
  float MinSpeed;
  float MaxSpeed;
  float MinSpeedDistance;
  float MaxSpeedDistance;
  float Acceleration;
  const float CurrentSpeed;
  float CurrentYaw;
  float CurrentPitch;
  float PitchSpeed;
  float YawSpeed;
};

struct CPlugFogMatter : public CPlug {
  CPlugFogMatter();

};

struct CPlugFogVolume : public CPlug {
  CPlugFogVolume();

};

struct CPlugFogVolumeBox : public CPlugFogVolume {
  CPlugFogVolumeBox();

};

// File extension: 'PlugTurretObjectParams.Gbx'
struct CPlugTurretObjectParams : public CMwNod {
  CPlugTurretObjectParams();

  MwId GunId;
  uint ShootPeriod;
  float MinShootDistance;
  float MaxShootDistance;
  float BasePitch;
  float HorizontalFOV;
  float BaseYaw;
  float PitchSpeed;
  float YawSpeed;
  iso4 BulletOffset;
};

struct CPlugDynaPointModel : public CMwNod {
  CPlugDynaPointModel();

  vec3 Center;
  float Radius;
  float Friction;
  float Restitution;
  const float GravityCoef;
};

struct CPlugFxLightning : public CPlug {
  CPlugFxLightning();

};

struct CPlugFxWindOnDecal : public CPlug {
  CPlugFxWindOnDecal();

};

struct CPlugFileJxr : public CPlugFileImg {
  CPlugFileJxr();

};

struct CPlugFileWebP : public CPlugFileImg {
  CPlugFileWebP();

};

struct CPlugMaterialPack : public CPlug {
  CPlugMaterialPack();

};

struct CPlugTrafficShapedTrajectory : public CMwNod {
  CPlugTrafficShapedTrajectory();

  const bool Closed;
  const uint PointsCount;
  const uint AllocatedSize;
  const float Length;
};

struct CPlugTrafficFlowDescriptor : public CMwNod {
  CPlugTrafficFlowDescriptor();

  uint InitialRandSeed;
  float InitialOffset;
  float Speed;
  float Density;
  float MinVehiclesSpacing;
  bool DrivingDirection;
};

struct CPlugTrafficGraph : public CMwNod {
  CPlugTrafficGraph();

  MwFastBuffer<CPlugSpline3D*> Splines;
  MwFastBuffer<CPlugTrafficFlowDescriptor*> FlowDescriptors;
};

struct CPlugCharPhyRecoilModel : public CMwNod {
  CPlugCharPhyRecoilModel();

};

struct CPlugFxWindOnTreeSprite : public CPlug {
  CPlugFxWindOnTreeSprite();

};

// File extension: 'PlugFlockModel.Gbx'
struct CPlugFlockModel : public CMwNod {
  CPlugFlockModel();

  CMwNod* BirdModelFid;
  CPlugSound* SoundLoop;
  CPlugSound* SoundEventTakeOff;
  float Volatility; // Range: 0 - 1
  float Range;
  float CosViewAngle;
  float MinSpeed;
  float MaxSpeed;
  uint UpdateFrequency;
  float Variance;
  float vAvoidance;
  float kAvoidance;
  float vGrouping;
  float kGrouping;
  float vMatching;
  float kMatching;
  float vGroundAvoid;
  float kGroundAvoid;
  uint StandingDuration;
  uint AnimPeriod;
  uint Anim_StandingStar;
  uint Anim_StandingEnd;
  uint Anim_GlidingStart;
  uint Anim_GlidingEnd;
  uint Anim_FlappingStart;
  uint Anim_FlappingEnd;
};

struct CPlugVehicleVisEmitterModel : public CMwNod {
  CPlugVehicleVisEmitterModel();

};

struct CPlugVehicleVisModel : public CMwNod {
  CPlugVehicleVisModel();

};

struct CPlugVehicleVisModelShared : public CMwNod {
  CPlugVehicleVisModelShared();

};

struct CPlugVehicleMaterialGroup : public CMwNod {
  CPlugVehicleMaterialGroup();

};

struct CPlugVehicleCarPhyTuning : public _0x090EB000 {
  CPlugVehicleCarPhyTuning();

};

struct CPlugVehicleCameraRace3Model : public CPlugCamControlModel {
  CPlugVehicleCameraRace3Model();

};

struct CPlugBodyPath : public CMwNod {
  CPlugBodyPath();

};

struct CPlugCharPhySpecialProperty : public CMwNod {
  CPlugCharPhySpecialProperty();

};

struct CPlugParticleGpuVortex : public CMwNod {
  CPlugParticleGpuVortex();

};

struct CPlugGameSkin : public CMwNod {
  CPlugGameSkin();

};

struct CPlugFxHdrScales_Tech3 : public CPlug {
  CPlugFxHdrScales_Tech3();

};

struct CPlugVehicleCameraRace2Model : public CPlugCamControlModel {
  CPlugVehicleCameraRace2Model();

};

struct CPlugVehicleCameraInternalModel : public CPlugCamControlModel {
  CPlugVehicleCameraInternalModel();

};

// File extension: 'AnimLocSimple.Gbx'
struct CPlugAnimLocSimple : public CMwNod {
  CPlugAnimLocSimple();

  uint Axis;
  uint RotPeriod;
  uint RotPeriodMax;
  uint TransPeriod;
  uint TransPeriodMax;
  float TransY;
};

struct CPlugLightUserModel : public CMwNod {
  CPlugLightUserModel();

  vec3 Color;
  float Intensity;
  float Distance;
  float PointEmissionRadius;
  float PointEmissionLength;
  float SpotInnerAngle;
  float SpotOuterAngle;
  float SpotEmissionSizeX;
  float SpotEmissionSizeY;
  bool NightOnly;
};

struct CPlugCharPhyMaterials : public CMwNod {
  CPlugCharPhyMaterials();

};

struct CPlugCharPhyModelCustom : public CMwNod {
  CPlugCharPhyModelCustom();

  float EyesHeight;
  float Radius;
  const float SpeedCoef;
  float AggroRadius;
  float ShootRadius;
  float TargetMinDistance;
  float DisengageDistance;
  float Accuracy; // Range: 0 - 1
  uint Reaction;
  uint ShootPeriod;
  uint ArmorMax;
  uint Fov;
};

struct CPlugMaterialUserInst : public CMwNod {
  CPlugMaterialUserInst();

  MwId Name;
  MwId Model;
  wstring BaseTexture;
  MwId Link;
};

struct CPlugMoodSetting : public CPlug {
  CPlugMoodSetting();

};

struct CPlugMoodAtmo : public CPlug {
};

struct CPlugBodyGraph : public CMwNod {
  CPlugBodyGraph();

};

struct CPlugCustomBulletModel : public CMwNod {
  float BulletSpeed;
};

struct CPlugTriggerAction : public CMwNod {
  float StartYaw;
};

// File extension: 'BeamModel.Gbx'
struct CPlugBeamEmitterSubModel : public CMwNod {
  CPlugBeamEmitterSubModel();

  bool EdVisible;
  CPlugMaterial* Material;
  const MwFastBuffer<CPlugMaterial*> AdditionalMaterials;
  enum class CPlugBeamEmitterSubModel::EDisplayType {
    LinesWide = 0,
    Cylinder = 1,
    Helix = 2,
    HelixWithCylinder = 3,
    DoubleHelix = 4,
    DoubleHelixWithHelix = 5,
    BeamWithCylinders = 6,
    BeamWithSpheres = 7,
    Lightning = 8,
  };
  CPlugBeamEmitterSubModel::EDisplayType DisplayType;
  float UVScale;
  uint CylinderSideCount;
  uint Duration;
  float Radius;
  float USpeed;
  float VSpeed;
  bool BackFace;
  float LightningMaxJitterDistPerStep; // Range: 0 - 1
  float LightningJitterRadius; // Range: 0 - 5
  float LightningDistStep; // Range: 0 - 10
  float LightningLenMax;
  uint LightningBeamCount;
  float FadeTimeOffset;
  float FadeTimeScale;
  uint Helix_VerticesCountPerTurn;
  float Helix_TurnLength;
  float Helix_OutterRadius;
  float Helix_InnerRadius;
  bool Helix_ClockWise;
  float Helix_DistLOD;
  float Helix_CoeffLowDef;
  uint Helix_MaxHelixCount;
  float DoubleHelix_StartAngle;
  bool DoubleHelix_ClockWise;
  uint BeamWithCylinders_NbSubDiv;
  float BeamWithCylinders_StepSize;
  float BeamWithCylinders_InnerRadius;
  float BeamWithCylinders_OutterRadius;
  float BeamWithCylinders_HalfWidth;
  float BeamWithCylinders_FadeSpeed;
  float BeamWithCylinders_TimeStartFade;
  float BeamWithCylinders_DistLOD;
  float BeamWithCylinders_CoeffLowDef;
  uint BeamWithSpheres_NbVerticalSubDiv;
  uint BeamWithSpheres_NbSpheresPerMeter;
  float BeamWithSpheres_Radius;
  float BeamWithSpheres_StartDistance;
  float BeamWithSpheres_EndDistance;
  float BeamWithSpheres_DistLOD;
  uint BeamWithSpheres_MaxDetailedRailsCount;
  float BeamWithSpheres_Speed;
};

// File extension: 'PlugProbe.Gbx'
struct CPlugProbe : public CPlug {
  CPlugProbe();

};

struct CPlugCustomBeamModel : public CMwNod {
  string BulletName;
};

struct CPlugFileWebM : public CPlugFileVideo {
  CPlugFileWebM();

};

struct CPlugCharVisModelCustom : public CMwNod {
  CPlugCharVisModelCustom();

  UnknownType Sprites;
};

struct CPlugCamShakeModel : public CMwNod {
  CPlugCamShakeModel();

};

struct CPlugCamControlModel : public CMwNod {
  CPlugCamShakeModel* Shake;
};

struct CPlugImportMeshParam : public CMwNod {
  CPlugImportMeshParam();

  enum class CPlugImportMeshParam::EImportMeshTypeEnum {
    Static = 0,
    Dyna = 1,
    DynaSkelGeneric = 2,
    DynaSkelHumano = 3,
    DynaSkelFlat = 4,
  };
  float Scale;
  bool ForceSmoothNormals;
  string MeshSkipPrefix;
  string MeshOnlyPrefix;
  string MeshSkipSuffix;
  string MeshOnlySuffix;
  MwFastBuffer<CPlugMaterialUserInst*> MatUserModels;
  MwFastBuffer<CPlugLightUserModel*> LightUserModels;
  string Skel_GenericRootName;
  string Skel_DummyPrefix;
  string Skel_SocketPrefix;
  bool Skel_SocketOnly;
  float TextureParams_MaxSize;
  bool TextureParams_HqDds;
  string CollectionName;
  CPlugImportMeshParam::EImportMeshTypeEnum ImportMeshType;
  string FileNameSuffix;
};

struct CPlugVehicleCamInternalVisOffset : public CMwNod {
  CPlugVehicleCamInternalVisOffset();

};

} // namespace Plug

namespace Scene {

struct CSceneEngine : public CMwEngine {
  CSceneEngine();

};

struct CScene : public CMwNod {
  MwFastBuffer<CSceneMobil*> Mobils;
  MwFastBuffer<CSceneCamera*> Cameras;
  MwFastBuffer<CSceneMover*> Movers;
  MwFastBuffer<CSceneLight*> Lights;
  MwFastBuffer<CSceneSoundSource*> Sounds;
  CSceneConfig* SceneConfig;
  MwFastBuffer<CMotionManager*> MotionManagers;
  const MwFastBuffer<CMotionManager*> MotionManagerModels;
  CScenePhy* const ScenePhy;
  CSceneDecalsManager* const MgrDecals;
  CSceneSoundManager* const MgrSound;
  CSceneMgrCamera* const MgrCamera;
  CSceneMgrParticle* const MgrParticle;
  CSceneMgrSolidVis* const MgrSolidVis;
  CSceneMgrSolid2Vis* const MgrSolid2Vis;
  CSceneMgrCharVis* const MgrCharVis;
  CSceneMgrVehicleVis* const MgrVehicleVis;
  CSceneMgrFlock* const MgrFlock;
  CSceneMgrAnim* const MgrAnim;
  CSceneMgrBulletVis* const MgrBulletVis;
  CSceneMgrTrafficVis* const MgrTrafficVis;
  CSceneMgrBody* const MgrBody;
  CSceneMgrWeather* const MgrWeather;
  CSceneMgrMapColoring* const MgrMapColoring;
  CHmsMgrVisDyna* const MgrVisDyna;
  CMwNod* const MgrObjectVis;
  CMwNod* const MgrGateVis;
  float EditorHelperHdrScale;
  void LogSceneStats();
};

// File extension: 'Scene2d.Gbx'
struct CScene2d : public CScene {
  CScene2d();

  CSceneSector* const Sector;
  vec2 OverlayMin;
  vec2 OverlayMax;
  MwFastBuffer<CSceneLight*> Lights;
  MwFastBuffer<CSceneSoundSource*> Sounds;
};

// File extension: 'Scene3d.Gbx'
struct CScene3d : public CScene {
  CScene3d();

  MwFastBuffer<CSceneSector*> Sectors;
  MwFastBuffer<CSceneLight*> Lights;
  MwFastBuffer<CSceneLocation*> Locations;
  MwFastBuffer<CSceneSoundSource*> Sounds;
  float CameraFarZ;
  float EdCamFocusZ;
  float EdCamLensSize;
  vec3 CameraClearColor;
  CMwNod* SceneFxMgr;
};

struct CSceneSector : public CMwNod {
  CSceneSector();

  CHmsZone* Zone;
  CScene* const Scene;
};

struct CSceneObject : public CMwNod {
  CScene* Scene;
  void SetLocation(iso4 Location, CSceneSector* Sector);
  CMwNod* Motion;
};

struct CSceneMgrGUI : public CMwNod {
};

struct CSceneLocation : public CSceneObject {
  CSceneLocation();

  iso4 Location;
};

struct CSceneMgrCamera : public CMwNod {
  CSceneMgrCamera();

};

struct CScenePoc : public CSceneObject {
  CHmsPoc* HmsPoc;
  bool IsActive;
};

struct CSceneCamera : public CScenePoc {
  CSceneCamera();

  MwFastArray<CScene2d*> Overlays;
  uint iPrecalcRender;
  const uint cPrecalcRender;
  CSceneListener* Listener;
};

// File extension: 'SceneLight.Gbx'
struct CSceneLight : public CScenePoc {
  CSceneLight();

  GxLight* Light;
};

struct CSceneController : public CMwNod {
  CSceneController();

};

struct CSceneListener : public CSceneObject {
};

struct CSceneSoundSource : public CSceneObject {
  CSceneSoundSource();

  void Play();
  void Stop();
  CPlugSound* PlugSound;
};

// File extension: 'Mobil.Gbx'
struct CSceneMobil : public CSceneObject {
  CSceneMobil();

  CSceneMobil* const Model;
  bool IsVisible;
  const bool PlayerType;
  CHmsItem* Item;
  CPlugSolid* Solid;
  CPlugSolid* SolidModel;
  void Show();
  void Hide();
  CMwNod* LinkedObject;
  MwFastBuffer<CSceneObjectLink*> Links;
  CMotion* const MotionSolid;
  uint CastedShadows;
  bool SelfShadow;
  void SolidObjectsRefresh();
  void LinkForceUpdateAll();
};

// File extension: 'Toy.Gbx'
struct CSceneToy : public CSceneMobil {
  CSceneToy();

};

struct CSceneCloudSystem : public CMwNod {
  bool IsVisible;
  bool AutoSizeFarZ;
  float ScaleFarZ_Visibility; // Range: 0 - 1
  uint InstCountX;
  uint InstCountZ;
  float WindVortexSpeed;
  bool WindVortexUseHyperbolicSpeed;
  float WindSpeed;
  float WindDir; // Range: 0 - 6.28
  bool FadeAlpha;
  bool ForceSize;
  vec2 GridSizeXZ;
  bool MaterialUseT3b;
  const MwFastBuffer<CPlugShader*> Shaders;
  const UnnamedEnum OutputMode;
};

// File extension: 'Link.Gbx'
struct CSceneObjectLink : public CMwNod {
  CSceneObjectLink();

  const bool IsToSave;
  const bool IsFromModel;
  bool UseOnlyMobilPosition;
  bool UseOnlyMobilTreePosition;
  bool UseTreeVisibilityForPoc;
  iso4 RelativeLocation;
  CSceneObject* Object;
  CSceneMobil* Mobil;
  MwId MobilTreeId;
  bool IsActive2;
  const bool IsDynamic;
};

struct CScenePickerManager : public CMwNod {
  CHmsPicker* const Picker;
};

struct CPlugBitmapRenderScene3d : public CPlugBitmapRenderCamera {
  CPlugBitmapRenderScene3d();

  CScene3d* Scene3d;
  iso4 Location;
  void CreateCamera();
  void CreateOverlayCameraSettings();
};

struct CSceneSoundManager : public CMwNod {
};

struct CSceneMgrVehicleVisImpl : public CMwNod {
  CSceneMgrVehicleVisImpl();

  UnnamedEnum Extrapolation;
  bool HermiteInterp;
  float DetachedPartImpulseCoef;
  float RigidPartFluidFrictionLinear;
  float RigidPartFluidFrictionAngular;
  float RigidPartRandLinearVel;
  float RigidPartRandAngularVel;
  uint SparkleKeepDelay;
};

// File extension: 'MobilClouds.Gbx'
struct CSceneMobilClouds : public CSceneToy {
  CSceneMobilClouds();

  CSceneCloudSystem* const Clouds;
  void ReBuildInstances();
};

struct CSceneMgrFlockPrivate : public CMwNod {
  void Restart();
  bool IsPlaying;
  float PitchSpeed;
  float PitchMax;
  float YawSpeed;
  float YawMax;
  float RollSpeed;
  float RollMax;
  float PitchUpSpeed;
  float RollUpSpeed;
  float OtherEmitterBirdsInfluence;
  float BirdDistanceToSpeed;
  float GroundRepulsorDistanceToSpeed;
  float RepulsorDistanceToSpeed;
  float MainEmitterDistanceToSpeed;
  float GroundAvoidDistOffset;
};

struct CSceneMgrFlock : public CMwNod {
  CSceneMgrFlock();

  CSceneMgrFlockPrivate* const Private;
};

// File extension: 'SceneFx.Gbx'
struct CSceneFxColors : public CSceneFxCompo {
  CSceneFxColors();

  float ParamInverseRGB; // Range: 0 - 1
  float ParamHue; // Range: 0 - 1
  float ParamSaturation; // Range: -1 - 1
  float ParamBrightness; // Range: -1 - 1
  float ParamContrast; // Range: -1 - 1
  vec3 ParamModulateRGB;
  float ParamModulateR; // Range: 0 - 1
  float ParamModulateG; // Range: 0 - 1
  float ParamModulateB; // Range: 0 - 1
  vec3 ParamBlendRGB;
  float ParamBlendAlpha; // Range: 0 - 1
  bool ParamUserEnable;
  float UserIntensity; // Range: 0 - 1
  float CloudsIntensity; // Range: 0 - 1
  float ZFarIntensity; // Range: 0 - 1
  float ParamZFar_StartZ;
  float ParamZFar_StopZ;
  float ParamZFarInverseRGB; // Range: 0 - 1
  float ParamZFarHue; // Range: 0 - 1
  float ParamZFarSaturation; // Range: -1 - 1
  float ParamZFarBrightness; // Range: -1 - 1
  float ParamZFarContrast; // Range: -1 - 1
  vec3 ParamZFarModulateRGB;
  float ParamZFarModulateR; // Range: 0 - 1
  float ParamZFarModulateG; // Range: 0 - 1
  float ParamZFarModulateB; // Range: 0 - 1
  vec3 ParamZFarBlendRGB;
  float ParamZFarBlendAlpha; // Range: 0 - 1
  CPlugMaterial* MaterialColors;
  CPlugShaderApply* ShaderAutoSaturateWithLight;
  CPlugBitmap* BitmapDepth;
  CPlugBitmap* BitmapSbch;
  vec2 BitmapTcScale;
  vec2 BitmapTcPeriod;
  vec2 BitmapRangeR;
  vec2 BitmapRangeG;
  vec2 BitmapRangeB;
  vec2 BitmapRangeA;
  CPlugShader* ShaderColorGrading;
};

// File extension: 'SceneFx.Gbx'
struct CSceneFxSuperSample : public CSceneFxCompo {
  CSceneFxSuperSample();

};

struct CSceneLocationCamera : public CSceneLocation {
  CSceneLocationCamera();

  float StereoScreenDist;
  vec2 FovRectMin;
  vec2 FovRectMax;
};

struct CSceneMgrVehicleVis : public CMwNod {
  CSceneMgrVehicleVis();

  CSceneMgrVehicleVisImpl* Impl;
};

// File extension: 'SceneFx.Gbx'
struct CSceneFxFlares : public CSceneFxCompo {
  CSceneFxFlares();

  uint FlarePerBlock;
};

// File extension: 'SceneFxNod.Gbx'
struct CSceneFxNod : public CMwNod {
  CSceneFxNod();

  bool IsActive;
  CSceneFx* Fx;
  CSceneFxNod* const NodInput;
};

// File extension: 'SceneFx.Gbx'
struct CSceneFxBloom : public CSceneFxCompo {
  CSceneFxBloom();

  uint BlurSize;
  float Intensity; // Range: 0 - 1
  float DataBlend; // Range: 0 - 1
  bool DualData;
  const MwFastBuffer<CSceneFxBloomData*> Datas;
  UnnamedEnum RadialInput;
  float RadialIntens; // Range: 0 - 1
  uint m_RadialProjQuality;
  float RadialRadius2d;
  float RadialRadius3d;
  vec2 RadialOffset2d;
  vec3 RadialOffset3d;
};

// File extension: 'SceneFx.Gbx'
struct CSceneFxToneMapping : public CSceneFxCompo {
  CSceneFxToneMapping();

};

struct CBoatSailState : public CMwNod {
  CBoatSailState();

  CPlugTree* const SailTree;
  CPlugTree* const BoomTree;
  CPlugTree* const BoomLowTree;
  CPlugVisualIndexedTriangles* const SailVisualBase;
  CPlugVisualIndexedTriangles* const SailVisualFlat;
  UnnamedEnum SailState;
  float SailStateCoef; // Range: 0 - 1
  bool AutomaticSheetTargetSpeedEnable;
};

struct CSceneFxBloomData : public CMwNod {
  CSceneFxBloomData();

  float HighInvExponent; // Range: 0 - 1
  float FakeHdrExponent; // Range: 0 - 1
  float FakeHdrMin; // Range: 0 - 1
};

// File extension: 'SceneConfig.Gbx'
struct CSceneConfig : public CMwNod {
  CSceneConfig();

  CSceneConfigVision* VisionPC0;
  CSceneConfigVision* VisionPC1;
  CSceneConfigVision* VisionPC2;
  CSceneConfigVision* VisionPC3;
};

struct CSceneConfigVision : public CMwNod {
  CSceneConfigVision();

  CHmsConfig* const HmsConfig;
};

// File extension: 'SceneMood.Gbx'
struct CSceneMood : public CMwNod {
  CSceneMood();

};

// File extension: 'SceneFx.Gbx'
struct CSceneFxStereoscopy : public CSceneFxCompo {
  CSceneFxStereoscopy();

  UnnamedEnum Output;
  bool ExternalControl;
  const float EyeSeparation;
  float SeparationUserScale; // Range: 0 - 1
  const float SeparationGameScale; // Range: 0 - 1
  uint MarginPixelCount;
  UnnamedEnum SplitRatio;
  UnnamedEnum AnaglyphColor;
  float AnaglyphColorFactor; // Range: 0 - 1
  CPlugFilePHlsl* PHlsl_AnaglyphFullColor;
  CPlugFilePHlsl* PHlsl_AnaglyphHalfColor;
  CPlugFilePHlsl* PHlsl_AnaglyphLinear;
  CPlugShaderApply* Shader_Interlaced;
  CPlugShaderApply* Shader_DebugBlend;
};

// File extension: 'SceneFx.Gbx'
struct CSceneFxHeadTrack : public CSceneFxCompo {
  CSceneFxHeadTrack();

};

struct CSceneMgrCharVis : public CMwNod {
  CSceneMgrCharVis();

  CSceneMgrAnim* const MgrAnim;
  CPlugAnimFile* const CinematicLib;
  float TacticalFxRadius;
  float TacticalFxSize;
  float TacticalFxMaxY;
  float TacticalFxMinY;
  float TacticalFxMinDotN;
  float TacticalFxIntens;
  uint LodMaxVert;
};

struct CSceneMgrAnim : public CMwNod {
  CSceneMgrAnim();

  void Debug();
  bool Active;
  bool FootGroundIKEnabled;
  bool FootWallIKEnabled;
  float EdClingOffsetDist;
  float EdWaterOffset;
  bool EdVelFromPos;
  uint EdVelFilterDelay;
  bool EdForceNullInputSpeed;
  uint WallJumpDuration;
  uint WallJumpImpulseTopDuration;
  float WallJumpHDist;
  float WallJumpVDist;
  bool EdForceLod;
  uint EdForceLodIndex;
  bool EdForceLowerJaw;
  float EdForceLowerJawVal; // Range: 0 - 1
  bool EdForceLayerWeight;
  float EdForceLayerWeightVal; // Range: 0 - 1
  enum class CSceneMgrAnim::EHandIKMode {
    Disabled = 0,
    AvoidWallPen = 1,
    TouchWall = 2,
  };
  CSceneMgrAnim::EHandIKMode HandIKMode;
  float OffsetHand_Pen; // Range: 0 - 0.3
  float OffsetElbow_Pen; // Range: 0 - 0.3
  float Anticipation_Pen; // Range: 0 - 1
  float HandIKWallThreshold; // Range: 0 - 2
  float HandIKDuration; // Range: 0 - 1
  float HandIKOffsetY; // Range: -1 - 1
  float HandIKOffsetX; // Range: -1 - 1
  float WallOffsetTouch; // Range: 0 - 0.15
  enum class CSceneMgrAnim::EAnimPartialMode {
    Normal = 0,
    Blend = 1,
    IK = 2,
  };
  CSceneMgrAnim::EAnimPartialMode PartialAnimMode;
  enum class CSceneMgrAnim::EBlendFunc {
    Zero = 0,
    One = 1,
    Linear = 2,
    Inverse = 3,
  };
  CSceneMgrAnim::EBlendFunc PartialAnimBlendFunc;
  const MwFastBuffer<CMwNod*> SkelBinding;
};

struct CSceneMgrVehiclePhy : public CMwNod {
  CHmsCollZone* const MgrCollision;
  uint SpawnInvicibilityDurationMs;
};

struct CSceneMgrParticle : public CMwNod {
  CSceneMgrParticle();

};

struct CSceneMoods : public CMwNod {
  CSceneMoods();

};

struct CSceneMobilLeaves : public CSceneMobil {
  CSceneMobilLeaves();

  uint LeafMaxCount;
  uint LeafEmitterMaxCount;
  CPlugShader* LeafShader;
  void ResetLeaves();
  float LeafRadiusBase;
  float LeafRadiusRandom;
  vec3 Wind;
  float LeafOscillationAmplitudeBase;
  float LeafOscillationAmplitudeRandom;
  float LeafOscillationPeriodBase;
  float LeafOscillationPeriodRandom;
  float LeafFallingSpeedBase;
  float LeafFallingSpeedRandom;
  float LeafAlphaSpeedMax;
  float LeafBetaSpeedlMax;
  float RespawnPeriod;
  float FarZ;
  float Curvature; // Range: 0 - 1
};

struct CSceneMgrSolidVis : public CMwNod {
  const uint cSolidVis;
  const uint cSolidVisDynamic;
};

struct CSceneDecalsManager : public CMwNod {
  CSceneMobil* const Decal3dMobil;
  void Draw();
  void EdShowHide();
  vec3 Bucket3dGridCellSize;
  uint Bucket3dGridCellCountX;
  uint Bucket3dGridCellCountY;
  uint Bucket3eGridCellCountZ;
  vec3 Bucket2dGridCellSize;
  uint Bucket2dGridCellCountX;
  uint Bucket2dGridCellCountY;
  uint Bucket2dGridCellCountZ;
  vec3 Bucket2dGridOrigin;
  const uint DrawnCount3d;
  const uint DrawnCount2d;
  const uint DiscardCount3d;
  const uint AllocFailedCount3d;
  bool EnableDecals3d;
  bool EnableDecals2d;
};

struct CSceneToyFilaments : public CSceneToy {
  CSceneToyFilaments();

  float Alpha;
  float k1;
  float k2;
  float k3;
  float MaxSpeed;
  float Inertia;
  float NoiseAmp;
  float NoiseFreq;
  bool AddNoise;
  bool ShowGradient;
};

// File extension: 'Mobil.Gbx'
struct CSceneMobilSnow : public CSceneMobil {
  CSceneMobilSnow();

  UnnamedEnum Kind;
  float Intensity; // Range: 0 - 1
  float FarZ;
  uint LifeSpan;
  float Diam;
  float XYRatio;
  bool WindRotate;
  float Param1;
  UnnamedEnum EditKind;
  CPlugBitmap* EditBitmap;
  uint EditParticleCount;
  void EditInit();
};

// File extension: 'SceneFx.Gbx'
struct CSceneFx : public CMwNod {
  float Intensity; // Range: 0 - 1
  bool WantPreLoad;
};

struct CScenePhy : public CMwNod {
  CHmsCollZone* const MgrCollision;
  UnnamedType const MgrCharPhy;
  CSceneMgrVehiclePhy* const MgrVehiclePhy;
  CSceneMgrBulletPhy* const MgrBulletPhy;
  CMwNod* const MgrObjectPhy;
  CSceneMgrTrafficPhy* const MgrTrafficPhy;
  CHmsDynaZone* const MgrDyna;
};

// File extension: 'SceneFx.Gbx'
struct CSceneFxOverlay : public CSceneFx {
  CSceneFxOverlay();

  CPlugShader* Shader;
};

struct CSceneFxCompo : public CSceneFx {
};

struct CSceneFxDepthOfField : public CSceneFxCompo {
  CSceneFxDepthOfField();

};

// File extension: 'SceneFx.Gbx'
struct CSceneFxMotionBlur : public CSceneFxCompo {
  CSceneFxMotionBlur();

  UnnamedEnum Technique;
  float T2_MotionScale;
  float T2_MotionMaxLen;
  bool T2_DelayShadows;
  CPlugFilePHlsl* T2_Fid_PHlsl_MotionLenCmp;
  CPlugFilePHlsl* T3_PHlsl_MotionBlur;
  CPlugBitmap* T3_BitmapDepth;
  CPlugBitmap* T3_BitmapMotion;
};

// File extension: 'SceneFx.Gbx'
struct CSceneFxCameraBlend : public CSceneFxCompo {
  CSceneFxCameraBlend();

  bool CaptureEnable;
  float CaptureWeight; // Range: 0 - 1
};

// File extension: 'SceneFx.Gbx'
struct CSceneFxDistor2d : public CSceneFxCompo {
  CSceneFxDistor2d();

  CPlugBitmap* BitmapDistor;
  float DistorScale;
};

// File extension: 'SceneFx.Gbx'
struct CSceneFxEdgeBlender : public CSceneFxCompo {
  CSceneFxEdgeBlender();

  float EdgeDotMax; // Range: 0 - 1
  float EdgeDepthMax;
  uint GutterPassCount;
  float GutterWeight; // Range: 0 - 1
  CPlugShaderApply* ShaderEdgeDetect;
  CPlugShaderApply* ShaderEdgeGutter;
};

// File extension: 'SceneFx.Gbx'
struct CSceneFxOccZCmp : public CSceneFxCompo {
  CSceneFxOccZCmp();

  bool UsePointsInSphere;
  float ImageRadius; // Range: 0 - 0.2
  uint BlurTexelCount;
  CPlugShaderApply* Shader;
  CPlugPointsInSphereOpt* PointsInSphere;
  UnnamedEnum Blend;
};

// File extension: 'SceneFx.Gbx'
struct CSceneFxBloomHdr : public CSceneFxCompo {
  CSceneFxBloomHdr();

  bool BloomIntensUseCurve;
  float MinIntensInBloomSrc;
  uint DownCount;
  bool PreDown4x4_Else2x2;
  uint BlurSizeDown1_2x2;
  const uint BlurSizeDown1;
  const uint BlurSizeDown2;
  const uint BlurSizeDown3;
  const uint BlurSizeDown4;
  const uint BlurSizeDown5;
  float BlurSizeScaleByLevel;
  float BlurCenterOverEdges;
  float UpScale;
  float UpScaleAlpha;
  UnnamedEnum BlurTexAddress;
  bool UseFakedFlares;
  float LensDirtIntens; // Range: 0 - 1
  float StreaksSrcMin; // Range: 0 - 1
  uint StreaksRotationCount;
  float StreaksRotation; // Range: 0 - 360
  uint StreaksPassCount;
  CPlugShaderApply* FidShaderBloomSelectFilterDown2;
  CPlugShaderApply* FidShaderBloomSelectFilterDown4;
  CPlugShaderApply* ShaderBloomFinal;
  CPlugShaderApply* ShaderDistorImageSpace;
  CPlugShaderApply* ShaderDistorGetDepthIntens;
  CPlugShaderApply* ShaderDistorAtDepth;
  CPlugShaderApply* ShaderHorizonBlur;
  bool DistorEnable;
  uint DistorPeriodTime;
  float DistorRedSelectRatio; // Range: 0 - 2
  bool DistorUseDepth;
  CPlugFilePHlsl* const PHlsl_Final;
  CPlugFilePHlsl* const PHlsl_StreaksSelectSrc;
  CPlugFilePHlsl* const PHlsl_StreaksWorkDir;
  CPlugFilePHlsl* const PHlsl_EdShowBlow;
};

// File extension: 'CarMarksModel.Gbx'
struct CSceneVehicleCarMarksModel : public CMwNod {
  CSceneVehicleCarMarksModel();

  bool Disabled;
  MwFastBuffer<CSceneVehicleCarMarksModelSub*> Models;
};

// File extension: 'CarMarksModelSub.Gbx'
struct CSceneVehicleCarMarksModelSub : public CMwNod {
  CSceneVehicleCarMarksModelSub();

  float SampleMinDist;
  float Width;
  float WidthCoefForceX;
  float WidthCoefForceZ;
  float WidthMax;
  float Alpha;
  float AlphaCoefForceX;
  float AlphaCoefForceZ;
  float AlphaMax;
  float GroundOffset;
  float TexVPerMeter;
  float FadeDist;
  bool CondGroundContact;
  bool CondSliding;
  UnnamedEnum CondMaterialId;
  float CondForceXGreaterThan;
  float CondForceZGreaterThan;
  CPlugMaterial* Material;
  bool DebugDisplay;
};

struct CSceneVehicleCarMarksSamples : public CMwNod {
  CSceneVehicleCarMarksSamples();

  string Name;
  const uint ByteSize;
  bool Disabled;
  MwFastBuffer<uint> Stops;
};

// File extension: 'SceneFx.Gbx'
struct CSceneFxCellEdge : public CSceneFxCompo {
  CSceneFxCellEdge();

  uint BlurTexelCount;
  float BlurCenterOverEdges;
  CPlugShaderApply* ShaderEdgeDetect;
};

struct CSceneMover : public CMwNod {
  CSceneMover();

  CSceneObject* Object;
  CSceneController* Controller;
};

struct CSceneFxMgr : public CMwNod {
};

struct CSceneMgrBulletPhy : public CSceneMgrPhy {
  uint BulletRemovalDelay;
  bool LaserVsBullet;
  bool LaserSkewering;
};

struct CSceneMgrBulletVis : public CMwNod {
};

struct CSceneMgrTrafficVis : public CMwNod {
  CSceneMgrTrafficVis();

  bool DoRenderVehicles;
  void RemoveAll();
};

// File extension: 'SceneFx.Gbx'
struct CSceneMgrWeather : public CMwNod {
  CPlugFxLightning* const FxLightning;
  CMwNod* CloudSystem;
};

struct CSceneMgrTrafficPhy : public CMwNod {
  CSceneMgrTrafficPhy();

  void PhysicallizeAll();
  void UnPhysicallizeAll();
  void ResetTraffic();
  void CheckPointWholeTrafficFlow();
  float PhysicallisationCollSurfScale;
  float VelMaxSqrTobeConsideredStatic;
  float MaxUnevenWithoutJump;
  float AirGravityCoef;
  vec3 Car_FrontLeftWheelRelativePos;
  vec3 Car_FrontRightWheelRelativePos;
  vec3 Car_BackLeftWheelRelativePos;
  vec3 Car_BackRightWheelRelativePos;
  vec3 VertiDownMaxHeight;
  CPlugTrafficGraph* TrafficGraph;
  UnnamedType VehiclePhyModel;
  const MwFastBuffer<CPlugTrafficShapedTrajectory*> ShapedTrajectories;
};

struct CSceneMgrMapColoring : public CMwNod {
  CPlugBitmap* const BitmapTeamEmblem;
};

struct CSceneMgrBody : public CMwNod {
  CSceneMgrBody();

  void StartBodies();
  void StopBodies();
  uint BulletModelIndex;
  uint MaxAmmo;
  float SightScope0;
  float SightScope1;
  float SightScope2;
  float SightScope3;
  uint ShotDelay;
  uint ReloadDelay;
  uint DurationTargetKeptInMemory;
  float EyesHeight;
  uint InitialRandSeed;
  uint SimultaneousBodies;
  uint InitialLifePoints;
  float SpeedCoeff;
  float DistToPathForVictor;
};

struct CSceneAnimFileSkelBinding : public CMwNod {
  const uint cRef;
  CMwNod* const Skel;
  CMwNod* const AnimFile;
};

struct CSceneMobilSolid2 : public CSceneMobil {
};

struct CSceneMgrSolid2Vis : public CMwNod {
  const uint cSolid2Vis;
  const uint cSolid2VisDynamic;
};

struct CSceneMgrPhy : public CMwNod {
};

// File extension: 'Boat.Gbx'
struct CSceneToyBoat : public CSceneToy {
  CSceneToyBoat();

  const float HdgDeg;
  const float BSKnot;
  const float BSAvgKnot;
  const float BSTheoricalKnot;
  const float TWDWorldDeg;
  const float TWSWorldKnot;
  const float TWDDeg;
  const float TWSKnot;
  const float TWADeg;
  const float AWADeg;
  const float AWSKnot;
  const float HeelDeg;
  const float COGAvgDeg;
  const float SOGAvgKnot;
  const float StreamSpeedKnot;
  const float StreamDirectionDeg;
  void ResetLocation();
  CBoatParam* Params;
  const float RealBoatWidth;
  const float RealBoatLength;
  CMotionWindBlocker* WindShadow;
  void RetrieveSounds();
  void EdBoatCreate();
  void ChangeSail();
  float TillerTargetAngle; // Range: -0.8726 - 0.8726
  CPlugParticleEmitterModel* SplashEmitterModel;
  const bool TeamMatesVisible;
  const bool StemWavesVisible;
  const bool WindIndicatorVisible;
  MwFastBuffer<CBoatSail*> SailStates;
  float ContactForceFluidFrictionCoef;
  float ReplacementStepLength;
  float ContactRotationImpulseCoef;
  float ContactRelSpeedMultCoef;
  float GamePlayCoef_BSLevel;
  float GamePlayCoef_BSCatchBack;
  float GamePlayCoef_BSSpi;
  float GamePlayCoef_BSNoSpi;
  float GamePlayCoef_BSGeneral;
  float GamePlayCoef_BSManoeuvre;
};

// File extension: 'Sea.Gbx'
struct CSceneToySea : public CSceneToy {
  CSceneToySea();

  CSceneToySeaHouleTable* Houles;
  float CoefMovTexture;
  float MinTextureView;
  float MaxTextureView;
  float CoefMinView;
  float Valtest1;
  float Valtest2;
  CSceneToySeaHouleTable* HouleTable3;
  CSceneToySeaHouleTable* HouleTable4;
  CSceneToySeaHouleTable* HouleTable5;
  CSceneToySeaHouleTable* HouleTable6;
  CSceneToySeaHouleTable* HouleTable7;
  const float UpdateGeomTimeMs;
};

struct CSceneToyStem : public CSceneToy {
  CSceneToyStem();

  bool IsActive;
  bool UseWaveProjection;
  bool UseSeaElevation;
  bool OnlyUnderSea;
  float SeaLevel;
  CSceneToySea* Sea;
  uint NbPointZ;
  vec3 Gravity;
  vec3 InitialSpeedDir;
  float MaxCoefSize;
  float BoatSpeedRef;
  float EjectSpeedScale;
  float SplashCoef;
  uint StemDuration;
  vec3 RelativePos;
  bool UseRelativePos2;
  vec3 RelativePos2;
  float StartWidth;
  float EndWidth;
  float TextureSizeInMeter;
  float ValTest1;
  vec3 StemColor;
  CPlugMaterial* MaterialStem;
};

// File extension: 'BoatTeamDesc.Gbx'
struct CBoatTeamDesc : public CMwNod {
  CBoatTeamDesc();

  MwFastBuffer<MwId> TeamMateIds;
  CMwRefBuffer* TeamActionDescs;
  CMwRefBuffer* TeamMateLocationDescs;
  CMwRefBuffer* TeamMateVisualAnims;
  MwId AnimWalkId;
  void UpdateCacheData();
};

struct CBoatTeamActionDesc : public CMwNod {
  CBoatTeamActionDesc();

  MwId TeamActionId;
  MwFastBuffer<CBoatTeamMateActionDesc*> TeamMateActionDescs;
};

struct CBoatTeamMateActionDesc : public CMwNod {
  CBoatTeamMateActionDesc();

  MwId TeamMateId;
  MwId DestLocationId;
  float WalkSpeed;
  MwId AnimBeforeId;
  MwId AnimAfterId;
  bool AnimAfterIsLooping;
  bool AnimAfterIsTimeStop;
};

struct CManoeuvre : public CMwNod {
  CManoeuvre();

  float Duration;
  float SlowDownCoef;
  MwId TeamActionId;
  MwId Sound1Id;
  float Sound1Time;
  MwId Sound2Id;
  float Sound2Time;
  uint OldTeamActionIndex;
};

struct CBoatTeamMateLocationDesc : public CMwNod {
  CBoatTeamMateLocationDesc();

  MwId LocationId;
  vec3 Translation;
  float RotationYDeg;
};

// File extension: 'SeaHoule.Gbx'
struct CSceneToySeaHoule : public CMwNod {
  CSceneToySeaHoule();

  bool UsedForAssiette;
  CPlugBitmap* TextureCPU;
  float RepresentedX;
  float RepresentedZ;
  float Amplitude;
  float Speed;
  float AngleWindDeltaInDegree; // Range: 0 - 360
  float DistorFactorXZ; // Range: 0 - 2
  float FoamMin; // Range: 0 - 1
  float FoamScale; // Range: 0 - 2
};

struct CBoatSail : public CMwNod {
  CBoatSail();

  UnnamedEnum SailType;
  CFuncCurvesReal* VppCurves;
  CFuncCurves2Real* BSCoefCurves;
  CFuncCurvesReal* OptimalSailAngleCurves;
  MwFastBuffer<CFuncCurvesReal*> OptimalSailAngleCurvesArray;
  CFuncCurvesReal* HeelAngleCurves;
  CFuncCurves2Real* HeelAngleCoefCurves;
  CFuncCurvesReal* LuffAngleSpeedCurves;
  CFuncCurvesReal* RevolveAngleSpeedCurves;
  CFuncCurvesReal* AccelerationCurves;
  CFuncKeysReal* ShiverAngleCurve;
  CFuncCurvesReal* BoomAngleCurves;
  CFuncKeysReal* SheetAngleMaxCurve;
  float SheetAngleMin;
  float SheetAngleMax;
  float SailSpeedCoefSheet;
  float SailSpeedCoefEaseOut;
  float AutomaticSheetTargetSpeed;
  CManoeuvre* ManoeuvreHaulUp;
  CManoeuvre* ManoeuvreHaulDown;
  CManoeuvre* ManoeuvrePrepareHaulUp;
  CManoeuvre* ManoeuvrePrepareHaulDown;
  float BulgeIntens;
  float BulgeSpeed;
  float BoomSpeed;
  MwId SailId;
  MwId SailFlatId;
  MwId BoomId;
  bool IsReefingGear;
  float VisualHaulDelta;
  float VisualShiverAmplitude;
  float VisualShiverSpeedCoef;
  float VisualShiverSpeedMax;
  bool ShiverWindFree;
  float OldLuffBlockadeWindAngle;
  float OldLuffBlockadeBsSlowDown;
  float OldLuffLimitWindAngle;
  float OldLuffLimitBsSlowDown;
  float OldHeelCoef;
};

// File extension: 'SeaHouleTable.Gbx'
struct CSceneToySeaHouleTable : public CMwNod {
  CSceneToySeaHouleTable();

  float SeaBumpScale;
  vec2 SeaBumpScaleUV;
  float FoamExponant;
  float FoamScaleWorldXZ; // Range: 0 - 1
  void AddHoule();
  MwFastArray<CSceneToySeaHoule*> Houles;
  bool FieldHouleUncompress;
  float HouleGlobalScale;
};

// File extension: 'SeaHouleFixe.Gbx'
struct CSceneToySeaHouleFixe : public CSceneToySeaHoule {
  CSceneToySeaHouleFixe();

  float CoefFoam;
  float ExposantFoam;
};

// File extension: 'BoatParam.Gbx'
struct CBoatParam : public CMwNod {
  CBoatParam();

  UnnamedEnum BoatType;
  float BoatWidth;
  float ExtraHullHeightDelta;
  float DecelerationConstant;
  float DecelerationDynamic;
  CFuncCurvesReal* DecelerationFromTillerCurves;
  CFuncCurvesReal* DecelerationFromTillerCurvesBearAway;
  float RotationRadius;
  float TillerAngleMax;
  float TillerInertia;
  CFuncKeysReal* BSCoefFromHeelCurve;
  bool IsNewSailPhysics;
  MwFastBuffer<CBoatSail*> Sails;
  CMotionWindBlocker* WindShadow;
  float Surf;
  float Floating;
  float WaterLineHeightDelta;
  float RollCoef;
  float PitchSpeed;
  float PitchInertia;
  float PitchOscillation;
  float PitchOscillationSpeed;
  float HeelSpeed;
  float HeelInertia;
  float HeelOscillation;
  float HeelOscillationSpeed;
  float HeelMax;
  bool IsNewSeaPhysics;
  float LateralForceFromLateralSpeedSq;
  float FloatingForceFromImmersionNormed;
  float FloatingForceFromImmersionNormedSq;
  float FloatingForceFullImmersionDist;
  float Gravity;
  float FluidFrictionY;
  float FloatingDeltaY;
  float DynamicAcceleration;
  float FluidFrictionFront;
  vec3 CameraInsideE;
  vec3 CameraInsideB;
  vec3 CameraInsideE_Amplifior;
  vec3 WindIndicatorDistance;
  CPlugSolid* TeamMateModelFid;
  MwId TeamMateTreeToFollowId;
  float m_CollisionSoundBoatSpeedDeltaThreshold;
  MwFastBuffer<CSceneToyStem*> StemWaves;
  CBoatTeamDesc* TeamDesc;
  float OldAccelerationConstant;
  float OldWreckAngle;
  float OldHeelLuff;
  CFuncPathMesh* OldHeelCoefCurve;
  CMwRefBuffer* OldAnimList;
  CFuncPathMesh* OldFuncPathMesh;
  CMotionTeamManager* OldTeamManagerModel;
};

struct CSceneMobilSolid : public CSceneMobil {
};

// File extension: 'Character.Gbx'
struct CSceneMobilCharVis : public CSceneMobil {
  CSceneMobilCharVis();

  CPlugCharVisModel* const CharVisModel;
  UnnamedType const CharPhyModel;
};

} // namespace Scene

namespace System {

struct CSystemEngine : public CMwEngine {
  CSystemEngine();

  void SynchUpdate();
};

struct CSystemMouse : public CNodSystem {
  CSystemMouse();

};

struct CSystemKeyboard : public CNodSystem {
  CSystemKeyboard();

};

struct CSystemWindow : public CNodSystem {
  CSystemWindow();

  const uint SizeX; // Range: 0 - 64000
  const uint SizeY; // Range: 0 - 64000
  const uint PosX; // Range: 0 - 64000
  const uint PosY; // Range: 0 - 64000
  const float Ratio;
  const bool HasSizeChanged;
  const bool HasPosChanged;
  string StatusString;
};

// File extension: 'SystemConfig.Gbx'
struct CSystemConfig : public CMwNod {
  CSystemConfig();

  bool IsSafeMode;
  CSystemConfigDisplay* const Display;
  CSystemConfigDisplay* const DisplaySafe;
  bool NetworkUseProxy;
  string NetworkProxyLogin;
  string NetworkProxyPassword;
  uint NetworkServerPort;
  uint NetworkP2PServerPort;
  uint NetworkClientPort;
  UnnamedEnum NetworkSpeed;
  uint NetworkDownloadRate;
  uint NetworkUploadRate;
  bool NetworkForceUseLocalAddress;
  string NetworkForceServerAddress;
  uint NetworkServerBroadcastLength;
  bool NetworkUseNatUPnP;
  string NetworkLastUsedMSAddress;
  string NetworkLastUsedMSPath;
  bool FileTransferEnableDownload;
  bool FileTransferEnableUpload;
  uint FileTransferMaxCacheSize;
  bool EnableLocators;
  bool AutoUpdateFromLocatorAtInternetConnection;
  bool AutoUpdateFromLocator;
  string AutoUpdateLocatorDBUrl;
  bool FileTransferEnableAvatarDownload;
  bool FileTransferEnableAvatarUpload;
  bool FileTransferEnableAvatarLocators;
  bool FileTransferEnableMapDownload;
  bool FileTransferEnableMapUpload;
  bool FileTransferEnableMapLocators;
  bool FileTransferEnableMapModDownload;
  bool FileTransferEnableMapModUpload;
  bool FileTransferEnableMapModLocators;
  bool FileTransferEnableMapSkinDownload;
  bool FileTransferEnableMapSkinUpload;
  bool FileTransferEnableMapSkinLocators;
  bool FileTransferEnableTagSkinDownload;
  bool FileTransferEnableTagSkinUpload;
  bool FileTransferEnableTagSkinLocators;
  bool FileTransferEnableVehicleSkinDownload;
  bool FileTransferEnableVehicleSkinUpload;
  bool FileTransferEnableVehicleSkinLocators;
  bool FileTransferEnableUnknownTypeDownload;
  bool FileTransferEnableUnknownTypeUpload;
  bool FileTransferEnableUnknownTypeLocators;
  bool IsIgnorePlayerSkins;
  bool IsSkipRollingDemo;
  bool ProfileEnableMulti;
  string ProfileName;
  void SetProfileNameUnassigned();
  uint PlayerInfoDisplaySize; // Range: 1 - 5
  enum class CSystemConfig::UnnamedEnum {
    Name = 0,
    Avatar = 1,
    Avatar_and_Name = 2, // Avatar and Name
  };
  CSystemConfig::UnnamedEnum PlayerInfoDisplayType;
  bool EdDontConnect;
  bool DisableReplayRecording;
  bool Dynamic_ParentalLock_IsLocked;
  bool Dynamic_ParentalLock_HasPassword;
  UnnamedEnum Vsk3SeaQuality;
  UnnamedEnum Vsk3BoatQuality;
  UnnamedEnum Vsk3TeamMate;
  UnnamedEnum Vsk3Stem;
  UnnamedEnum TmCarQuality;
  UnnamedEnum TmCarParticlesQuality;
  UnnamedEnum PlayerShadow;
  UnnamedEnum PlayerOcclusion;
  UnnamedEnum TmOpponents;
  uint TmMaxOpponents;
  UnnamedEnum TmBackgroundQuality;
  bool AudioEnabled;
  float AudioSoundVolume; // Range: 0 - 1
  float AudioMusicVolume; // Range: 0 - 1
  bool AudioSoundHdr;
  UnnamedEnum AudioGlobalQuality;
  string AudioDevice_Oal;
  UnnamedEnum AudioAcceleration_Dx9;
  UnnamedEnum AudioQuality3d_Dx9;
  bool AudioUseEFX;
  bool AudioUseHRTF;
  bool AudioDisableDoppler;
  UnnamedEnum AudioSpeakerConfig;
  bool InputsAlternateMethod;
  bool InputsCaptureKeyboard;
  bool InputsFreezeUnusedAxes;
  bool InputsEnableRumble;
  UnnamedEnum Advertising_Enabled;
  float Advertising_TunningCoef; // Range: -1 - 1
  bool Advertising_DisabledByUser;
  bool EnableCrashLogUpload;
  string BlackListUrl;
  string AntiCheatServerUrl;
};

struct CSystemMemoryMonitor : public CMwNod {
  CSystemMemoryMonitor();

};

struct CNodSystem : public CMwNod {
  CNodSystem();

};

struct CSystemFid : public CMwNod {
  CSystemFid();

  CMwNod* const Nod;
  bool Text;
  bool Compressed;
};

struct CSystemFids : public CMwNod {
  const MwFastBuffer<CSystemFids*> Trees;
  const MwFastBuffer<CSystemFid*> Leaves;
};

struct CSystemFidFile : public CSystemFid {
  CSystemFidFile();

  const uint ByteSize;
  const uint ByteSizeEd;
  bool IsReadOnly;
  const wstring FileName;
  const wstring FullFileName;
  const wstring ShortFileName;
  void CopyToFileRelative(string RelFileName, bool FailIfExists);
};

struct CSystemFidsFolder : public CSystemFids {
  CSystemFidsFolder();

  const uint ByteSize;
  const uint ByteSizeEd;
  const wstring DirName;
  const wstring FullDirName;
};

struct CSystemFidsDrive : public CSystemFidsFolder {
  CSystemFidsDrive();

};

struct CSystemFidMemory : public CSystemFid {
  CSystemFidMemory();

};

struct CSystemConfigDisplay : public CMwNod {
  CSystemConfigDisplay();

  UnnamedEnum RenderingApi;
  UnnamedEnum DisplayMode;
  bool StereoscopyByDefault;
  bool StereoscopyAdvanced;
  uint RefreshRate;
  UnnamedEnum DisplaySync;
  UnnamedEnum TripleBuffer;
  UnnamedEnum AutoScale;
  bool Customize;
  UnnamedEnum Preset;
  UnnamedEnum Antialiasing;
  UnnamedEnum DeferredAA;
  UnnamedEnum ShaderQuality;
  UnnamedEnum TexturesQuality;
  UnnamedEnum FilterAnisoQ;
  UnnamedEnum ZClip;
  UnnamedEnum ZClipAuto;
  uint ZClipNbBlock;
  UnnamedEnum GeometryQuality;
  float GeomLodScaleZ;
  UnnamedEnum WaterReflect;
  bool WaterGeomStadium;
  UnnamedEnum VehicleReflect;
  uint VehicleReflectMaxCount;
  bool TextureDecals_3D;
  bool TextureDecals_2D;
  bool PostFxEnable;
  UnnamedEnum FxBloomHdr;
  UnnamedEnum FxMotionBlur;
  float FxMotionBlurIntens; // Range: 0 - 1
  UnnamedEnum LightMapSizeMax;
  UnnamedEnum LightMapQuality;
  bool LightMapQualityUltra;
  bool LightMapLightIndex;
  UnnamedEnum ScreenShotExt;
  UnnamedEnum Shadows;
  UnnamedEnum GpuSync0;
  UnnamedEnum GpuSync1;
  UnnamedEnum GpuSync2;
  UnnamedEnum GpuSync3;
  uint GpuSyncTimeOut;
  uint MaxFps;
  UnnamedEnum VertexProcess;
  bool EmulateCursorGDI;
  bool OptimizePartDyna;
  bool DisableZBufferRange;
  bool DisableWindowedAntiAlias;
  bool DisableHdrCubeRenderMipMap;
  bool EnableFullscreenGDI;
  UnnamedEnum LightFromMap;
  bool EnableCheckLags;
  float AgpUseFactor; // Range: 0 - 1
  float ParticleMaxGpuLoadMs;
  bool EnableD3D9Ex;
  bool EnableD3D9_BC4_BC5;
  bool MultiThreadEnable;
  uint MultiThreadCountMax;
};

struct CSystemPackManager : public CMwNod {
};

struct CSystemPackDesc : public CMwNod {
  const wstring Name;
  const string Checksum;
  const wstring FileName;
  const string Size;
  const wstring LocatorFileName;
  const string Url;
  const bool AutoUpdate;
};

struct CSystemNodWrapper : public CMwNod {
  CSystemNodWrapper();

};

struct CSystemData : public CMwNod {
  string Url;
  CSystemPackDesc* const PackDesc;
  CMwNod* Data;
};

struct CSystemFidContainer : public CMwNod {
};

} // namespace System

namespace Vision {

struct CVisionViewport : public CHmsViewport {
  bool EmulateCursor;
  const MwFastBuffer<wstring> Display_Win32DeviceNames;
  void ReGen_TextureGenUVs();
  void GetPerformance();
  bool Alpha01BlendEdges;
  uint Alpha01ClipRef_NoAtoC;
  float DissolveAlphaDistFactor; // Range: 0.001 - 1
  const float TimeGpuMs_Total;
  const float TimeGpuMs_Particles;
  bool AsyncRender;
  void FreeTextureMem();
  void RestoreTextureMem();
};

// File extension: 'VisionResourceFile.Gbx'
struct CVisionResourceFile : public CMwNod {
  CVisionResourceFile();

  CSystemFidsFolder* FolderShaderBench;
  float BlurDepthTestMaxDist;
  CPlugShaderApply* ShaderDeferredFog;
  CPlugShaderApply* ShaderDeferredLightBall;
  CPlugShaderApply* ShaderDeferredLightSpot;
  CPlugShaderApply* ShaderDeferredLightFxCylinder;
  CPlugShaderApply* ShaderDeferredLightFxSphere;
  CPlugShaderApply* ShaderDeferredDecal;
  CPlugShaderApply* ShaderDeferredDecalBox;
  CPlugShaderApply* ShaderDeferredDecalBoxVConst;
  CPlugShaderApply* ShaderDeferredGeomProjector;
  CPlugShaderApply* ShaderDeferredGeomFakeOcc;
  CPlugShaderApply* ShaderDeferredGeomShadowVol;
  CPlugShaderApply* ShaderDeferredGeomFogBoxInside;
  CPlugShaderApply* ShaderDeferredGeomFogBoxOutside;
  CPlugShaderApply* ShaderDeferredBurnSphere;
  CPlugShaderApply* ShaderDeferredSSLReflect;
  CPlugShaderApply* ShaderDeferredSSLReflect_CubeMap;
  CPlugShaderApply* ShaderDeferredWaterFog;
  CPlugShaderApply* ShaderWaterFogFromHyperZ;
  CPlugShaderApply* ShaderWaterFogFromHyperZ_Geom;
  CPlugShaderApply* ShaderT3Sea;
  CPlugShaderApply* ShaderCubeToSphereHdrA2;
  CPlugShaderApply* ShaderDecal3dSetInvalid;
  CPlugShaderApply* ShaderDecal3dSetInvalidBox;
  CPlugShaderApply* ShaderCloudsEdgeLight;
  CPlugShaderApply* ShaderCloudsGodLight;
  CPlugShaderApply* ShaderCloudsGodMask;
  CPlugShaderApply* ShaderMoon2d;
  CPlugShaderApply* ShaderShadowFakeQuad;
  CPlugShaderApply* ShaderShadowDepthPeel;
  CPlugShaderApply* ShaderShadowDepthPeel_Alpha01;
  CPlugShaderApply* ShaderSoapBubble;
  CPlugShaderApply* ShaderSpecularInHemi_sRGB;
  CPlugShaderApply* ShaderSpecularInHemi_Linear;
  CPlugShaderApply* ShaderSphereProjInv;
  CPlugShaderApply* ShaderRasterBink_YCrCb_RGBA;
  CPlugShaderApply* ShaderRasterCaptureCompareRGB;
  CPlugShaderApply* ShaderWaterSplash_TransformVertices;
  CPlugShaderApply* ShaderWaterSplash_IntersectTriangles;
  CPlugShaderApply* ShaderWaterSplash_SpawnParticles;
  CPlugShaderApply* ShaderWaterSplash_DebugEdges;
  CPlugShaderApply* ShaderDecal2d_CV_DefDecal;
  CPlugShaderApply* ShaderRasterCircularGauge;
  CPlugFont* FontDebugText;
  CPlugShaderApply* FillVtxColor_sRGB;
  CPlugShaderApply* ShaderZOnly;
  CPlugShaderApply* ShaderZOnly_Alpha01;
  CPlugShaderApply* ShaderFillConst;
  CPlugShaderApply* ShaderFillConst_Alpha01;
  CPlugShaderApply* LensFlareOccQuery;
  CPlugFileVHlsl* VHlslProjector1;
  CPlugFileVHlsl* VHlslLensFlareOccQuery;
  CPlugFileVHlsl* VHlslFillColor;
  CPlugFileVHlsl* VHlslFillColor_Alpha01;
  CPlugFileVHlsl* VHlslFill_0001;
  CPlugFileVHlsl* VHlslFill_0001_Alpha01;
  CPlugFileVHlsl* VHlslFill_0000;
  CPlugFileVHlsl* VHlslFillAlpha;
  CPlugFileVHlsl* VHlslFillDepthMask;
  CPlugFileVHlsl* VHlslRasterCubeMapFromEyeVectInWorld;
  CPlugFilePHlsl* PHlslBitmap;
  CPlugFilePHlsl* PHlslBitmapModCV;
  CPlugFilePHlsl* PHlslFillConst;
  CPlugFilePHlsl* PHlslFillColor;
  CPlugFilePHlsl* PHlslFillColor_Alpha01;
  CPlugFilePHlsl* PHlslFillAlpha;
  CPlugFilePHlsl* PHlslFillDepthMask;
  CPlugFilePHlsl* PHlslDebugText;
  CPlugFilePHlsl* PHlslRasterCubeMapFromEyeVectInWorld_HdrAlpha2;
  CPlugFilePHlsl* PHlslShadowSmoothDepth;
  CPlugFilePHlsl* PHlslShadowDepthAsRed;
  CPlugFilePHlsl* PHlslShadowDepthAsRed_Alpha;
  CPlugFilePHlsl* PHlslForwardTileCull_DbgDraw;
  CPlugFilePHlsl* PHlslRasterDown4x4_SkipX;
  CPlugFileGPU* CsCopyRawTexture2D;
  CPlugFileGPU* CsMakeMips8x8;
  CPlugFileGPU* CsMakeMipsTail8x8;
  CPlugFileGPU* CsForwardTileCull;
  CPlugFileGPU* CsPs4ClearHTileVr;
  CPlugFileVHlsl* VHlslRasterTc;
  CPlugFileVHlsl* VHlslBlurHV;
  CPlugFilePHlsl* PHlslBlurHV;
  CPlugShaderApply* ShaderBlurHV_DepthMask;
  CPlugShaderApply* ShaderBlurHV_DepthTest;
  CPlugShaderApply* ShaderDownSize2x2AvgInLdr;
  CPlugShaderApply* ShaderDownSize3x3AvgInLdr;
  CPlugShaderApply* ShaderFilterDown2x2;
  CPlugShaderApply* ShaderFilterDown4x4;
  CPlugShaderApply* ShaderAddUpscale2x2;
  CPlugShaderApply* ShaderDepthUp;
  CPlugShaderApply* ShaderDepthDown2x2;
  CPlugShaderApply* ShaderDepthDown3x3;
  CPlugShaderApply* ShaderDepthDown2x2Range;
  CPlugShaderApply* ShaderDepthGutter;
  CPlugShaderApply* ShaderColorDepthAlphaDown2x2_Min;
  CPlugShaderApply* ShaderCubeFilterDown4x4_Cube3x2;
  CPlugShaderApply* ShaderProjectCube48x32_SH3;
  CPlugShaderApply* ShaderGeomToMotion;
  CPlugShaderApply* ShaderGeomToMotion_Alpha01;
  CPlugShaderApply* ShaderGeomToDepth;
  CPlugShaderApply* ShaderGeomToDepth_Alpha01;
  CPlugShaderApply* ShaderGeomToEyeLengthBias;
  CPlugShaderApply* ShaderGeomToEyeLengthBias_Alpha01;
  CPlugShaderApply* ShaderGeomToReflectCubeMap;
  CPlugShaderApply* ShaderGeomToReflectCubeDist;
  CPlugShaderApply* ShaderGeomToFaceNormal;
  CPlugShaderApply* ShaderGeomToFaceNormal_Alpha01;
  CPlugShaderApply* ShaderGeomFakeShadows;
  CPlugShaderApply* ShaderBoxesRasterBitmapBlendPreMod;
  CPlugShaderApply* ShaderGeomBlendWaterFog;
  CPlugShaderApply* ShaderGeomBlendWaterFog_Opacity01;
  CPlugShaderApply* ShaderMgrParticleUpdate;
  CPlugShaderApply* ShaderMgrParticleSpawn;
  CPlugShaderApply* ShaderMgrParticleSpawnPoints;
  CPlugShaderApply* ShaderMgrParticleShadow;
  CPlugShaderApply* ShaderMgrParticleRender;
  CPlugShaderApply* ShaderMgrParticleShowStates;
  CPlugShaderApply* ShaderT3FullDeferredWarp;
  CPlugShaderApply* ShaderT3DynaSpriteDiffuse;
  CPlugShaderApply* ShaderFaceNormalFromLinearDepth;
  CPlugShaderApply* ShaderRasterDistor2d;
  CPlugShaderApply* ShaderRasterBitmap;
  CPlugShaderApply* ShaderRasterBitmapAdd;
  CPlugShaderApply* ShaderRasterBitmapBlendRGB;
  CPlugShaderApply* ShaderRasterBitmapBlendRGBA;
  CPlugShaderApply* ShaderRasterBitmapBlendPreMod;
  CPlugShaderApply* ShaderRasterBitmapBlendPreModInvA;
  CPlugShaderApply* ShaderRasterBitmapBlendPreMod_RGB_A;
  CPlugShaderApply* ShaderRasterConst;
  CPlugShaderApply* ShaderRasterConstMult;
  CPlugShaderApply* ShaderRasterConstAdd;
  CPlugShaderApply* ShaderRasterConstBlend;
  CPlugShaderApply* ShaderRasterGetZ01FromZBuffer;
  CPlugShaderApply* ShaderRasterGutter_8Taps;
  CPlugShaderApply* ShaderRasterZOnly;
  CPlugShaderApply* ShaderLightFromMap;
  CPlugShaderApply* ShaderSmVortexParticle;
  CPlugShaderApply* ShaderDeferredZBufferToDist01;
  CPlugShaderApply* ShaderDeferredOccZCmp;
  CPlugShaderApply* ShaderDeferredShadowPssm;
  CPlugShaderApply* ShaderDeferredCameraMotion;
  CPlugShaderApply* ShaderDeferredDeCompFaceNormal;
  CPlugShaderApply* ShaderDeferredGeomCameraMap;
  CPlugBitmap* BitmapHyperZ;
  CPlugBitmap* BitmapDeferredZ;
  CPlugBitmap* BitmapDeferredPixelNormalInC;
  CPlugBitmap* BitmapDeferredVertexNormalInC;
  CPlugBitmap* BitmapDeferredFaceNormalInC;
  CPlugBitmap* BitmapDeferredMDiffuse;
  CPlugBitmap* BitmapDeferredMSpecular;
  CPlugBitmap* BitmapDeferredLightMask;
  CPlugBitmap* BitmapDeferredPreShade;
  CPlugBitmap* BitmapWaterRefract;
  CPlugBitmap* BitmapPostFxCopyHdrA;
  CPlugBitmap* BitmapSwapR8;
  CPlugBitmap* BitmapShadowLDir0;
  CPlugBitmap* BitmapShadowStaticSprite;
  CPlugBitmap* BitmapShadowMaskDepth;
  CPlugBitmap* BitmapShadowPssmDepth;
  CPlugBitmap* BitmapMotion;
  CPlugBitmap* BitmapHeightField;
  CPlugBitmap* BitmapCloudsOcc;
  CPlugBitmap* BitmapToneMap_AutoScale;
  CPlugBitmap* BitmapVehicleLAmbientSH3;
  CPlugBitmap* BitmapReflectCubeHdr;
  CPlugBitmap* BitmapReflectCubeHdrLQ;
  CPlugBitmap* BitmapImageSpaceReflectCube;
  CPlugBitmap* BitmapTranslucentDown;
  CPlugBitmap* BitmapOverlayBlur;
  CPlugBitmap* BitmapDynaHueIntensGauge;
  CPlugBitmap* BitmapDynaTcSxyTzw;
  CPlugBitmap* BitmapDynaTcSxyTzw_RenderOverlay;
  CPlugFxLensFlareArray* FxLensFlareArray;
  CPlugShaderApply* Shader2dFlareAdd_Hdr;
  CPlugShaderApply* Shader2dLensDirtAdd;
  CPlugShaderApply* Shader2dLightHistoryUpdate;
  CPlugBitmap* BitmapLmIndexLightPosIRad;
  CPlugBitmap* BitmapLmIndexLightList;
  CPlugBitmap* BitmapTileListUv;
  CPlugBitmap* BitmapTileList;
  CPlugBitmap* BitmapTileMask;
  CPlugBitmap* BitmapTileGpu;
};

struct CDx11Viewport : public CVisionViewport {
  const string FeatureLevel;
  bool ZBuffer_Near1_Far0;
  bool ZBuffer_Float;
};

} // namespace Vision

namespace Audio {

struct CAudioPort : public CMwNod {
  bool IsEnabled;
  float SoundVolume; // Range: -40 - 0
  float MusicVolume; // Range: -40 - 0
  bool AudioAlwaysOn;
  UnnamedEnum SettingQuality;
  float SettingSoundHdrFactor; // Range: 0 - 1
  bool SettingDisableDoppler;
  uint SettingUpdatePeriod; // Range: 0 - 1000
  uint SettingSoundsPerUpdate;
  uint SettingMaxSimultaneousSounds;
  const MwFastBuffer<CAudioZone*> Zones;
  const MwFastBuffer<CAudioListener*> Listeners;
  const MwFastBuffer<CAudioSource*> Sources;
  const MwFastBuffer<CAudioBufferKeeper*> BufferKeepers;
  const uint Manager_AllocatedVoices;
  const uint Manager_AvailableVoices;
  CPlugAudioBalance* const BaseBalanceLoud;
  CPlugAudioBalance* const BaseBalanceSoft;
  CPlugAudioBalance* const CurBalance;
  const float CurScriptLimitMusicVolumedB;
  const float CurScriptLimitSceneSoundVolumedB;
  const float CurScriptLimitUiSoundVolumedB;
  float CurSoundVolumeRms;
  float CurSoundHdrCorrection;
  int ForceEnableMusicCount;
  bool MuteSounds_FromLoadScreen;
  uint IsCapturing;
  const MwFastBuffer<CPlugFileSnd*> CapturedFileSnds;
  CPlugFileText* ModifierXmlFile;
  void ParseModifierXml();
  void LoadExternalSoundParam();
  void SaveExternalSoundParam();
  const string AnalyzerEstimatedVolume;
  const float AnalyzerAudioTimePerSec;
  const float AnalyzerAudioTimePerSecUpdate;
  const float AnalyzerAudioTimePerSecStream;
  const uint AnalyzerStreamBytesPerSec;
  const uint AnalyzerAudioLongestSlice;
  const uint AnalyzerTotalKeepersMem;
  const string AnalyzerNbSoundsStr;
  const uint AnalyzerNbFadingSounds;
  const uint AnalyzerNbAutoDuckedSounds;
  const uint AnalyzerNbStreamingSounds;
  const uint AnalyzerNbDestoyedPerUpdate;
  const uint AnalyzerNbCreatedPerUpdate;
};

struct CAudioPortNull : public CAudioPort {
};

struct CAudioSoundImplem : public CMwNod {
  CAudioSource* const Source;
  const bool IsActuallyPlaying;
  void RefreshStaticProperties();
  float PlayCursor;
  float PlayCursorUi; // Range: 0 - 1
};

struct CAudioBufferKeeper : public CMwNod {
  CPlugFileSnd* const PlugFileSnd;
  const uint HwAllocSize;
  const bool IsStreaming;
  const bool IsSilent;
  const uint NbUses;
};

struct CAudioListener : public CMwNod {
  CPlugAudioEnvironment* AudioEnvironment;
  float InsideCoef;
  float EnclosedCoef;
  float UnderwaterCoef;
  uint AudioGroupIdOfInterrest;
};

struct CAudioZone : public CMwNod {
  const MwFastBuffer<CAudioZoneSource*> Sounds;
  const MwFastBuffer<CAudioListener*> Listeners;
};

struct CAudioScriptManager : public CMwNod {
  enum class CAudioScriptManager::ELibSound {
    Alert = 0,
    ShowDialog = 1,
    HideDialog = 2,
    ShowMenu = 3,
    HideMenu = 4,
    Focus = 5,
    Valid = 6,
    Start = 7,
    Countdown = 8,
    Victory = 9,
    ScoreIncrease = 10,
    Checkpoint = 11,
  };
  CAudioScriptSound* CreateSound(string Url); // Maniascript
  CAudioScriptSound* CreateSoundEx(string Url, float VolumedB, bool IsMusic, bool IsLooping, bool IsSpatialized); // Maniascript
  void DestroySound(CAudioScriptSound* Sound); // Maniascript
  const MwFastBuffer<CAudioScriptSound*> Sounds; // Maniascript
  CAudioScriptMusic* CreateMusic(string Url); // Maniascript
  void DestroyMusic(CAudioScriptMusic* Music); // Maniascript
  void PlaySoundEvent(CAudioScriptSound* Sound, float VolumedB); // Maniascript
  void PlaySoundEventUrl(string Url, float VolumedB); // Maniascript
  void PlaySoundLibrary(CAudioScriptManager::ELibSound Sound, uint SoundVariant, float VolumedB); // Maniascript
  void PlayDelayedSoundEvent(CAudioScriptSound* Sound, float VolumedB, int Delay); // Maniascript
  void PlayDelayedSoundEventUrl(string Url, float VolumedB, int Delay); // Maniascript
  void PlayDelayedSoundLibrary(CAudioScriptManager::ELibSound Sound, uint SoundVariant, float VolumedB, int Delay); // Maniascript
  void PlaySoundEventMix(CAudioScriptSound* Sound, float VolumedB, vec3 PanRadiusLfe); // Maniascript
  void PlaySoundEventMixUrl(string Url, float VolumedB, vec3 PanRadiusLfe); // Maniascript
  void PlayDelayedSoundEventMix(CAudioScriptSound* Sound, float VolumedB, vec3 PanRadiusLfe, int Delay); // Maniascript
  void PlayDelayedSoundEventMixUrl(string Url, float VolumedB, vec3 PanRadiusLfe, int Delay); // Maniascript
  void ClearAllDelayedSoundsEvents(); // Maniascript
  bool ForceEnableMusic; // Maniascript
  float LimitMusicVolumedB; // Maniascript
  float LimitSceneSoundVolumedB; // Maniascript
  float LimitUiSoundVolumedB; // Maniascript
};

struct CAudioScriptSound : public CMwNod {
  void Play(); // Maniascript
  void Stop(); // Maniascript
  const bool IsPlaying; // Maniascript
  const bool DownloadInProgress; // Maniascript
  float Volume; // Maniascript
  float FadeDuration; // Maniascript
  float VolumedB; // Maniascript
  float Pitch; // Maniascript
  vec3 RelativePosition; // Maniascript
  vec3 PanRadiusLfe; // Maniascript
  float PlayCursor; // Maniascript
  const float PlayLength; // Maniascript
};

struct CAudioScriptMusic : public CAudioScriptSound {
  enum class CAudioScriptMusic::EUpdateMode {
    Cut = 0,
    OnNextBar = 1,
    OnNextHalfBar = 2,
    OnNextBeat = 3,
  };
  MwFastArray<float> Tracks_Volume; // Maniascript
  MwFastArray<float> Tracks_VolumedB; // Maniascript
  const MwFastArray<wstring> Tracks_Name; // Maniascript
  const MwFastArray<float> Tracks_Length; // Maniascript
  const uint Tracks_Count; // Maniascript
  const float BeatsPerMinute; // Maniascript
  const float BeatDuration; // Maniascript
  const uint BeatsPerBar; // Maniascript
  CAudioScriptMusic::EUpdateMode UpdateMode; // Maniascript
  bool Dbg_ForceIntensity; // Maniascript
  bool Dbg_ForceSequential; // Maniascript
  bool Dbg_ForceRandom; // Maniascript
  float LPF_CutoffRatio; // Range: 0 - 1 // Maniascript
  float LPF_Q; // Range: 0.1 - 20 // Maniascript
  float HPF_CutoffRatio; // Range: 0 - 1 // Maniascript
  float HPF_Q; // Range: 0.1 - 20 // Maniascript
  float FadeTracksDuration; // Maniascript
  float FadeFiltersDuration; // Maniascript
  void MuteAllTracks(); // Maniascript
  void UnmuteAllTracks(); // Maniascript
  void NextVariant(); // Maniascript
  void NextVariant2(bool IsIntensityDecreasing); // Maniascript
  void EnableSegment(wstring SegmentName); // Maniascript
  bool UseNewImplem; // Maniascript
};

struct CAudioZoneSource : public CMwNod {
  enum class CAudioZoneSource::EAudioBalanceGroup {
    Auto = 0,
    Music = 1,
    Menus = 2,
    Ambiance = 3,
    Player = 4,
    Bengs = 5,
    Guns = 6,
    BackingDirect = 7,
    Trails = 8,
    GameUI = 9,
    Custom1 = 10,
    Custom2 = 11,
    OtherPlayers = 12,
    ImpactWarning = 13,
    Environment = 14,
  };
  CPlugSound* PlugSound;
  float PriorityAdjustement;
  bool UseLowQuality;
  vec3 VolumicSize;
  CAudioZoneSource::EAudioBalanceGroup BalanceGroup;
  uint AudioGroupId;
  bool Play;
  bool Stop;
  float Volume; // Range: 0 - 2
  float Pitch; // Range: 0 - 5
  uint Variant;
  uint MaxVariants;
  float RpmOrSpeed;
  float Accel; // Range: 0 - 1
  uint Gear;
  uint SurfaceId;
  float SkidIntensity;
  float SkidSpeedKmh;
  CMwNod* const AudioSourceMain;
  CMwNod* const AudioSourceBacking;
};

struct CAudioSource : public CMwNod {
  enum class CAudioSource::EAudioBalanceGroup {
    Auto = 0,
    Music = 1,
    Menus = 2,
    Ambiance = 3,
    Player = 4,
    Bengs = 5,
    Guns = 6,
    BackingDirect = 7,
    Trails = 8,
    GameUI = 9,
    Custom1 = 10,
    Custom2 = 11,
    OtherPlayers = 12,
    ImpactWarning = 13,
    Environment = 14,
  };
  const bool IsPlaying;
  void Play();
  void Stop();
  CPlugSound* const PlugSound;
  bool UseLowQuality;
  float PriorityAdjustement;
  CAudioSource::EAudioBalanceGroup BalanceGroup;
  uint AudioGroupId;
  float PlayCursor;
  float PlayCursorUi; // Range: 0 - 1
  float VolumedB; // Range: -60 - 6
  float LfeSenddB; // Range: -60 - 6
  float Pitch; // Range: 0.01 - 5
  float PanAngleDeg; // Range: -180 - 180
  float Radius;
  vec3 Position;
  iso4 Loc;
  vec3 Velocity;
  CAudioSoundImplem* const Implementation;
};

struct CAudioSourceMusic : public CAudioSource {
  MwFastArray<float> TracksVolume;
  MwFastArray<float> TracksVolumedB;
  float LPF_CutoffRatio; // Range: 0 - 1
  float LPF_Q; // Range: 0.1 - 20
  float HPF_CutoffRatio; // Range: 0 - 1
  float HPF_Q; // Range: 0.1 - 20
  float FadeTrackDuration;
  float FadeFiltersDuration;
  void MuteAllTracks();
  void UnmuteAllTracks();
};

struct CAudioSourceEngine : public CAudioSource {
  float RpmNormalised; // Range: 0 - 1
  float Rpm;
  float Accel; // Range: 0 - 1
  float VehicleSpeed;
  float Alpha; // Range: -1 - 1
  uint Gear;
};

struct CAudioSourceSurface : public CAudioSource {
  enum class CAudioSourceSurface::ESurfId {
    Concrete = 0,
    Pavement = 1,
    Grass = 2,
    Ice = 3,
    Metal = 4,
    Sand = 5,
    Dirt = 6,
    Turbo = 7,
    DirtRoad = 8,
    Rubber = 9,
    SlidingRubber = 10,
    Test = 11,
    Rock = 12,
    Water = 13,
    Wood = 14,
    Danger = 15,
    Asphalt = 16,
    WetDirtRoad = 17,
    WetAsphalt = 18,
    WetPavement = 19,
    WetGrass = 20,
    Snow = 21,
    ResonantMetal = 22,
    GolfBall = 23,
    GolfWall = 24,
    GolfGround = 25,
    Turbo2 = 26,
    Bumper = 27,
    NotCollidable = 28,
    FreeWheeling = 29,
    TurboRoulette = 30,
    WallJump = 31,
    MetalTrans = 32,
    Stone = 33,
    Player = 34,
    Trunk = 35,
    TechLaser = 36,
    SlidingWood = 37,
    PlayerOnly = 38,
    Tech = 39,
    TechArmor = 40,
    TechSafe = 41,
    OffZone = 42,
    Bullet = 43,
    TechHook = 44,
    TechGround = 45,
    TechWall = 46,
    TechArrow = 47,
    TechHook2 = 48,
    Forest = 49,
    Wheat = 50,
    TechTarget = 51,
    PavementStair = 52,
    TechTeleport = 53,
    Energy = 54,
    TechMagnetic = 55,
    TurboTechMagnetic = 56,
    Turbo2TechMagnetic = 57,
    TurboWood = 58,
    Turbo2Wood = 59,
    FreeWheelingTechMagnetic = 60,
    FreeWheelingWood = 61,
    TechSuperMagnetic = 62,
  };
  CAudioSourceSurface::ESurfId SurfaceId;
  float SpeedNormalised; // Range: 0 - 1
  float SpeedKmh;
  float SkidIntensity; // Range: 0 - 1
  float SkidSpeedKmh;
};

struct CAudioSourceMulti : public CAudioSource {
  uint Variant;
  uint MaxVariants;
};

struct CAudioSourceMood : public CAudioSource {
  float InsideFactor; // Range: 0 - 1
};

struct CAudioSourceGauge : public CAudioSource {
  float Ratio; // Range: 0 - 1
  float FullRatio;
  float GradingRatio;
  float Rate;
};

struct COalAudioPort : public CAudioPort {
  const wstring OpenALDllPath;
  string DeviceName;
  bool SettingUseEFX;
  bool SettingUseHRTF;
  const uint NbMaxSounds;
  void EnumerateDevicesNames_WriteToLog();
  void EnumerateDevices();
  void EnumerateDevices_WriteToLog();
  const MwFastBuffer<COalDevice*> OalDevices;
  const bool EFXEnabled;
  const uint Manager_SpacialVoices;
  const uint Manager_DirectVoices;
  CPlugAudioEnvironment* const CurrentEnvironment;
};

struct COalAudioBufferKeeper : public CAudioBufferKeeper {
};

// File extension: 'OpenALDevice.Gbx'
struct COalDevice : public CMwNod {
  COalDevice();

  const string DeviceSpecifier;
  const string OtherNames;
  const bool CanCapture;
  const string AlExtensions;
  const string AlcExtensions;
  const uint VersionMajor;
  const uint VersionMinor;
  const bool IsSync;
  const uint RefreshPeriod;
  const uint MixFrequency;
  const uint NbMonoVoices;
  const uint NbStereoVoices;
  const uint XRAMFree;
  const uint XRAMSize;
  const uint EFX_VersionMajor;
  const uint EFX_VersionMinor;
  const uint EFX_MaxAuxSends;
};

} // namespace Audio

namespace Script {

struct CScriptSetting : public CMwNod {
  const UnnamedEnum Type;
  const string Name;
  bool BooleanVal;
  int IntegerVal;
  float RealVal;
  wstring TextVal;
};

struct CScriptTraitsPersistent : public CMwNod {
  CScriptTraitsPersistent();

  const uint PersistentTraitsCount;
};

struct CScriptTraitsMetadata : public CMwNod {
  CScriptTraitsMetadata();

  const uint MetadataTraitsCount;
  void ClearMetadata();
};

struct CScriptInterfacableValue : public CMwNod {
  const UnnamedEnum Type;
  bool BooleanVal;
  int IntegerVal;
  float RealVal;
  wstring TextVal;
  bool Bool1;
  string String1;
  wstring StringInt1;
};

} // namespace Script

namespace Net {

struct CNetNod : public CMwNod {
};

struct CNetServerInfo : public CMwNod {
  const string GameID;
  const string GameVersion;
  const string SessionTitleId;
  const string HostName;
  const string LocalIP;
  const uint LocalUDPPort;
  const uint LocalTCPPort;
  const string RemoteIP;
  const uint RemoteUDPPort;
  const uint RemoteTCPPort;
};

struct CNetClientInfo : public CMwNod {
  const string GameID;
  const string GameVersion;
  const string HostName;
  const string LocalIP;
  const string RemoteIP;
};

struct CNetFormTimed : public CNetNod {
};

struct CNetFormQuerrySessions : public CNetNod {
  CNetFormQuerrySessions();

};

struct CNetFormEnumSessions : public CNetNod {
  CNetFormEnumSessions();

};

struct CNetFormPing : public CNetFormTimed {
  CNetFormPing();

};

struct CNetServer : public CMwNod {
  const uint P2PPort;
  const bool AcceptConnections;
  const uint NbrNewConnections;
  const uint NbrConnections;
  const uint NbrConnectionsDone;
  const uint NbrConnectionsPending;
  const uint NbrConnectionsDisconnecting;
  const uint SendingDataRate;
  const uint TCPSendingDataRate;
  const uint UDPSendingDataRate;
  const uint ReceivingDataRate;
  const uint TCPReceivingDataRate;
  const uint UDPReceivingDataRate;
  const uint ReceptionPacketTotal;
  const uint UDPReceptionPacketTotal;
  const uint TCPReceptionPacketTotal;
  const uint SendingPacketTotal;
  const uint UDPSendingPacketTotal;
  const uint TCPSendingPacketTotal;
  const uint ReceptionNodTotal;
  const uint UDPReceptionNodTotal;
  const uint TCPReceptionNodTotal;
  const uint SendingNodTotal;
  const uint UDPSendingNodTotal;
  const uint TCPSendingNodTotal;
};

struct CNetClient : public CMwNod {
  const MwFastBuffer<CNetConnection*> Connections;
  const uint NbrNewConnections;
  const uint NbrConnections;
  const uint NbrConnectionsInProgress;
  const uint NbrConnectionsDone;
  const uint NbrConnectionsDisconnecting;
  const uint SendingDataRate;
  const uint TCPSendingDataRate;
  const uint UDPSendingDataRate;
  const uint ReceivingDataRate;
  const uint TCPReceivingDataRate;
  const uint UDPReceivingDataRate;
  const uint ReceptionPacketTotal;
  const uint UDPReceptionPacketTotal;
  const uint TCPReceptionPacketTotal;
  const uint SendingPacketTotal;
  const uint UDPSendingPacketTotal;
  const uint TCPSendingPacketTotal;
  const uint ReceptionNodTotal;
  const uint UDPReceptionNodTotal;
  const uint TCPReceptionNodTotal;
  const uint SendingNodTotal;
  const uint UDPSendingNodTotal;
  const uint TCPSendingNodTotal;
  const int TimeLatestHumanPing;
  const int TimeLatestGamePing;
  const float TimeLatestEpsilon;
  const float TimeSmoothedEpsilon;
  const uint LatestTimeSynchronization;
  const uint LatestTimeSyncReception;
  bool TimeNotifyDiscontinuity;
  uint PrevDiscontinuityTime;
  const float TimeCorrectionWeight;
  float TimeThreshold;
  float TimeSmoothing;
  uint TimeLookahead;
};

struct CNetConnection : public CMwNod {
  const bool ClientToServer;
  CMwNod* Info;
  const uint TCPPort;
  const uint UDPPort;
  const uint State;
  const bool Broken;
  const bool ConnectionTCP;
  const bool ConnectionWaiting;
  const bool ConnectionRequest;
  const bool TestingUDP;
  const bool Synchronisation;
  const bool Connected;
  const bool CanReceiveTCP;
  const bool CanSendTCP;
  const bool CanReceiveUDP;
  const bool CanSendUDP;
  const uint TCPEmissionQueue;
  const bool WasUDPPacketDropped;
  const bool IsTCPSaturated;
  const uint LatestNetworkActivity;
  const uint LatestUDPActivity;
  const uint ReceptionPacketTotal;
  const uint UDPReceptionPacketTotal;
  const uint TCPReceptionPacketTotal;
  const uint SendingPacketTotal;
  const uint UDPSendingPacketTotal;
  const uint TCPSendingPacketTotal;
  const uint ReceptionNodTotal;
  const uint UDPReceptionNodTotal;
  const uint TCPReceptionNodTotal;
  const uint SendingNodTotal;
  const uint UDPSendingNodTotal;
  const uint TCPSendingNodTotal;
  const uint ReceptionPacketLoss;
  const uint ReceptionPacketTotalWithoutLoss;
  const uint ReceptionCounter;
  const uint SendingCounter;
  void Disconnect();
};

struct CNetFormConnectionAdmin : public CNetNod {
  CNetFormConnectionAdmin();

};

struct CNetHttpClient : public CMwNod {
  string Server;
  uint Port;
  uint Context;
  string UserName;
  string Password;
  const string LastError;
  string LanguageHeader;
  string UserAgentHeader;
  const MwFastBuffer<CNetHttpResult*> Requests;
};

struct CNetHttpResult : public CMwNod {
  const string Server;
  const string Path;
  enum class CNetHttpResult::EKind {
    Download = 0,
    Upload = 1,
  };
  const CNetHttpResult::EKind Kind;
  enum class CNetHttpResult::EStatus {
    Connecting = 0,
    Request = 1,
    Downloading = 2,
    Done = 3,
    Error = 4,
  };
  const CNetHttpResult::EStatus Status;
  const uint ExpectedSize;
  const string ContentType;
  const string ContentEncoding;
  const uint CurrentSize;
  const uint HttpError;
};

struct CNetMasterServer : public CMwNod {
  const string DummyProxyLogin;
  const string DummyProxyPass;
  string GameVersion;
  const MwFastBuffer<CNetMasterServerUserInfo*> MasterServerUserInfos;
  const MwFastBuffer<CNetHttpClient*> MasterServerHttpClients;
  const MwFastBuffer<CNetHttpClient*> OtherHttpClients;
  const MwFastBuffer<CNetMasterServerDownload*> Downloads;
  const MwFastBuffer<CNetMasterServerDownload*> CurrentDownloads;
  const MwFastBuffer<CNetHttpClient*> HttpDownloadClients;
  const MwFastBuffer<CNetMasterServerUptoDateCheck*> UpToDateChecks;
  const MwFastBuffer<CNetMasterServerUptoDateCheck*> CurrentUpToDateChecks;
  const MwFastBuffer<CNetHttpClient*> HttpCheckUpToDateClients;
};

struct CNetMasterHost : public CMwNod {
  string NetHostName;
  const string TitleIdName;
};

struct CNetFileTransfer : public CMwNod {
  const MwFastBuffer<CNetIPSource*> IPSources;
  const MwFastBuffer<CNetFileTransferUpload*> Uploads;
  const MwFastBuffer<CNetFileTransferDownload*> Downloads;
  const MwFastBuffer<CNetFileTransferDownload*> TerminatedDownloads;
  const bool DownloadEnabled;
  const bool UploadEnabled;
  const bool WaitForDownload;
  const string IPAddress;
  const uint P2PKey;
  const uint PlayerUId;
  const bool IsServer;
  const uint UploadRate;
  const uint DownloadRate;
  const uint NbOfCurrentUls;
  const uint SendBandwidthLimit;
  const uint TotalSendingSize;
  const uint NbSendChannelLeft;
  const uint NbSendChannelToRestore;
  const uint NbSendChannelUsed;
  const uint FirstTimeNotEnoughSendBandwidth;
  const bool IsEmissionSaturated;
  const uint NbOfCurrentDls;
  const uint ReceiveBandwidthLimit;
  const uint TotalReceivingSize;
  const uint NbReceiveChannelLeft;
  const uint NbReceiveChannelToRestore;
  const uint NbReceiveChannelUsed;
  const uint FirstTimeNotEnoughReceiveBandwidth;
  const uint MaxDownloadRateLeft;
  const uint MaxDownloadChannelLeft;
  const uint MaxUploadRateLeft;
  const uint MaxUploadChannelLeft;
  const uint MinSizeTransfer;
  const uint MaxSizeTransfer;
  const uint MaxDownloads;
  const uint MaxUploads;
  const uint MaxChannelPerTransfer;
  const uint NewConnectionTimeoutForDownload;
  const uint NewConnectionTimeoutForUpload;
  const uint SendMsgThroughServerTimeoutForDownload;
  const uint SendMsgThroughServerTimeoutForUpload;
  const uint LastUpdateTime;
  const uint UpdateDelta;
  const uint WriteOnDiskError;
  CNetServer* const Server;
  CNetClient* const Client;
  CNetMasterServer* const MasterServer;
  CSystemPackManager* const PackManager;
  CSystemFidsFolder* const DiskCacheDir;
};

struct CNetMasterServerInfo : public CMwNod {
  string Addr;
  string Path;
  string Name;
  wstring Message;
  bool LadderEnabled;
};

struct CNetFileTransferNod : public CMwNod {
  const wstring Name;
  const string Checksum;
  CSystemFidFile* const File;
  const uint TotalSize;
  const uint CurrentOffset;
};

struct CNetFileTransferForm : public CNetNod {
  CNetFileTransferForm();

};

struct CNetFileTransferDownload : public CNetFileTransferNod {
  const uint IdDownload;
  const UnnamedEnum DownloadState;
  CSystemPackDesc* const PackDesc;
  const uint PriorityLevel;
  const uint PriorityFlags;
  const MwFastBuffer<CNetSource*> Sources;
  const uint NbOfEffectiveSources;
  CNetSource* const ActiveSource;
  const MwFastBuffer<CNetURLSource*> UrlSources;
  CNetURLSource* const ActiveUrlSource;
  const string Url;
  const string LastUrlUsed;
  const bool AcceptP2P;
  const bool AcceptUrl;
  const bool SkipServerSource;
  const bool IsNearFinished;
  const wstring TempFileName;
  const uint LastWriteTimeout;
  CNetMasterServerUptoDateCheck* const PackDescUpToDateCheck;
  const bool PackDescUpToDateChecked;
  const uint LastDataMsgTime;
  const uint LastDataReception;
  const uint LastDataWrite;
  const uint SendEfficiency;
  const uint InstantaneousEfficiency;
  const uint AverageEfficiency;
};

struct CNetFileTransferUpload : public CNetFileTransferNod {
  const uint IdUpload;
  const uint IdDownload;
  const uint IdSource;
  const UnnamedEnum UploadState;
  CNetIPSource* const IPSource;
  CNetConnection* const Connection;
  const uint DownloadPriorityLevel;
  const uint PriorityLevel;
  const uint NbChannelsUsed;
  const uint NbChannelsUsedValidated;
  const uint TimeOut;
  const uint ValidityTimeOut;
  const bool IsActive;
  const bool MustBeActive;
  const uint LastActiveTime;
  const bool IsConnecting;
  const bool FirstToConnect;
  const bool MustSendReqAck;
  const bool ReqAckSent;
  const uint UploadAttempt;
  const uint MsgAttempt;
  bool ForceCancel;
  const uint ReadOffset;
  const uint LastMessageTime;
  const uint LastReadTimeOut;
  const uint LastSentTime;
  const uint LastDataComplete;
  const uint InstantaneousEfficiency;
  const uint AverageEfficiency;
};

struct CNetSource : public CMwNod {
  CNetSource();

  const uint IdSource;
  const uint IdUpload;
  const UnnamedEnum SourceState;
  CNetFileTransferDownload* const Download;
  CNetIPSource* const SourceAddress;
  CNetConnection* const Connection;
  const uint LastMessageTime;
  const uint TimeOut;
  const uint NbChannelsUsed;
  const uint LastNbChannelsUsedProposition;
  const bool TestedAtLeastOnce;
  const bool OwnsFile;
  const bool IsConnecting;
  const bool FirstToConnect;
  const bool ReqSent;
  const bool MustSendRequest;
  const bool MustSendUploadAck;
  const bool ForceSending;
  const bool HasReceivedUrl;
  bool InterruptTransfer;
  bool ForceCancel;
  const uint SourceAttempt;
  const uint MsgAttempt;
};

struct CNetIPC : public CMwNod {
  CNetIPC();

  const uint Port;
  const string VersionString;
  uint MaxPacketSize;
};

struct CNetFormRpcCall : public CNetNod {
  CNetFormRpcCall();

};

struct CNetUPnP : public CMwNod {
};

struct CNetMasterServerRequest : public CMwNod {
};

struct CNetIPSource : public CMwNod {
  const string RemoteIP;
  const uint DownloadRate;
  const uint UploadRate;
  const bool IsServer;
  const bool IsUploadEnabled;
  const uint P2PKey;
  const uint PlayerUId;
  CNetConnection* const GameConnection;
  CNetConnection* const ConnectionFrom;
  CNetConnection* const ConnectionTo;
  const uint ConnectTimeOut;
  const uint LastConnectionTime;
  const uint LastContactTime;
  const uint ConnectionFromTimeOut;
  const uint ConnectionToTimeOut;
  const bool IsConnecting;
  const uint ConnectionAttempt;
  const bool ConnectionTested;
  const bool ConnectionPossible;
  const uint ThroughServerAttempt;
  const bool ThroughServerTested;
  const bool ThroughServerPossible;
  const bool CanBeConnectedBy;
  const MwFastBuffer<CNetSource*> SourcesUsingConnectionFrom;
  const MwFastBuffer<CNetFileTransferUpload*> UploadsUsingConnectionFrom;
  const MwFastBuffer<CNetSource*> SourcesUsingConnectionTo;
  const MwFastBuffer<CNetFileTransferUpload*> UploadsUsingConnectionTo;
  bool ForceCancel;
};

struct CNetMasterServerUptoDateCheck : public CMwNod {
  const string Server;
  const string Path;
  const uint Port;
  const uint PriorityLevel;
  const bool IsUpToDate;
  const uint ReturnedError;
  CNetHttpResult* const HttpResult;
  const bool IsFinished;
};

struct CNetURLSource : public CMwNod {
  const UnnamedEnum URLSourceState;
  CNetFileTransferDownload* const Download;
  CNetFileTransferDownload* const MasterServerDownload;
  const string Url;
};

// Description: "Manager for HTTP requests"
struct CNetScriptHttpManager : public CMwNod {
  CNetScriptHttpRequest* CreateGet(string Url); // Maniascript
  CNetScriptHttpRequest* CreateGet2(string Url, bool UseCache); // Maniascript
  CNetScriptHttpRequest* CreateGet3(string Url, bool UseCache, string AdditionalHeaders); // Maniascript
  CNetScriptHttpRequest* CreatePost(string Url, string Resource); // Maniascript
  CNetScriptHttpRequest* CreatePost2(string Url, string Resource, string AdditionalHeaders); // Maniascript
  void Destroy(CNetScriptHttpRequest* Request); // Maniascript
  bool IsValidUrl(string Url); // Maniascript
  const MwFastBuffer<CNetScriptHttpRequest*> Requests; // Maniascript
  const uint SlotsAvailable; // Maniascript
};

// Description: "An HTTP request."
struct CNetScriptHttpRequest : public CMwNod {
  const string Url; // Maniascript
  const wstring Result; // Maniascript
  const uint StatusCode; // Maniascript
  const bool IsCompleted; // Maniascript
};

struct CNetXmpp_Timer : public CMwNod {
  CNetXmpp_Timer();

};

struct CNetMasterServerDownload : public CMwNod {
  const string Server;
  const string Path;
  const uint Port;
  enum class CNetMasterServerDownload::EContext {
    None = 0,
    Browser = 1,
    Menu = 2,
    Screen = 3,
    InGameInterface = 4,
  };
  const CNetMasterServerDownload::EContext Context;
  const uint Offset;
  const bool IsPost;
  const bool IsPut;
  const uint TotalSize;
  const uint DownloadStartTime;
  const uint DownloadingTime;
  const uint PriorityLevel;
  const uint ReturnedError;
  const string RequestHeaders;
  const uint Timeout;
  CNetHttpResult* const HttpResult;
  const bool IsFinished;
  const bool IsPaused;
};

struct CNetFormNewPing : public CNetNod {
  CNetFormNewPing();

};

// Description: "Masterserver user info."
struct CNetMasterServerUserInfo : public CMwNod {
  enum class CNetMasterServerUserInfo::EFirstPartySignInState {
    Unknown = 0,
    NotSignedUp = 1,
    SignedOut = 2,
    SignedIn = 3,
  };
  enum class CNetMasterServerUserInfo::EMasterServerConnectionStatus {
    NotConnected = 0,
    Connecting = 1,
    Connected = 2,
    Disconnecting = 3,
  };
  enum class CNetMasterServerUserInfo::EMasterServerConnectionDetailedStatus {
    NotConnected = 0,
    CheckingNetworkAvailability = 1,
    CheckingMasterServerConnexion = 2,
    WaitingCredentials = 3,
    CheckingMasterServerWaitingQueue = 4,
    WaitingOnMasterServerQueue = 5,
    WaitingSubscriptionCredentials = 6,
    CheckingSubscriptionCredentials = 7,
    WaitingSubscriptionInfo = 8,
    Subscribe = 9,
    OpeningSession = 10,
    Identifying = 11,
    GettingZones = 12,
    WaitingNewZone = 13,
    ChangingZone = 14,
    GettingOnlineProfile = 15,
    SynchronizingProfileChunks = 16,
    AssociatingKey = 17,
    UpdatingProfile = 18,
    GettingBannedCryptedChecksumsList = 19,
    GettingTitleInfo = 20,
    ConnectingToUbiServices = 21,
    FinalizingConnection = 22,
    Connected = 23,
    Disconnecting = 24,
  };
  enum class CNetMasterServerUserInfo::EMasterServerConnectionError {
    None = 0,
    NetworkNotAvailable = 1,
    FirstPartySignedOut = 2,
    NoUbiServicesSession = 3,
    MasterServerDisabled = 4,
    MasterServerInSafeMode = 5,
    KillSwitchEnabled = 6,
    BetaBanned = 7,
    BetaNotApproved = 8,
    NoUplayPC = 9,
  };
  enum class CNetMasterServerUserInfo::ETaskErrorType {
    Success = 0,
    Canceled = 1,
    Unexpected = 2,
    Internal = 3,
    DataManager = 4,
    PrivilegeManager = 5,
    MasterServer = 6,
    UbiServices = 7,
    UplayPC = 8,
    PS4 = 9,
    XboxOne = 10,
  };
  const MwId Id; // Maniascript
  const int UserId;
  const string Login; // Maniascript
  const wstring DisplayName; // Maniascript
  const string Password;
  const string NewPassword;
  CNetMasterServerInfo* const MasterServerInfo;
  const CNetMasterServerUserInfo::EMasterServerConnectionStatus ConnectionStatus; // Maniascript
  const CNetMasterServerUserInfo::ETaskErrorType LastConnectionErrorType; // Maniascript
  const uint LastConnectionErrorCode; // Maniascript
  const wstring LastConnectionErrorDescription; // Maniascript
  const bool HasUplayProfile; // Maniascript
  const bool HasAcceptedNDA; // Maniascript
  const MwFastBuffer<CNetUbiServicesNews*> UbiServicesSpaceNews; // Maniascript
  const MwFastBuffer<CNetUbiServicesNews*> UbiServicesProfileNews; // Maniascript
};

struct CWebServicesTask : public CMwNod {
};

struct CWebServicesTaskSequence : public CWebServicesTask {
};

// Description: "Asynchronous task result."
struct CWebServicesTaskResult : public CMwNod {
  enum class CWebServicesTaskResult::ETaskErrorType {
    Success = 0,
    Canceled = 1,
    Unexpected = 2,
    Internal = 3,
    DataManager = 4,
    PrivilegeManager = 5,
    MasterServer = 6,
    UbiServices = 7,
    UplayPC = 8,
    PS4 = 9,
    XboxOne = 10,
  };
  const MwId Id; // Maniascript
  const bool IsProcessing; // Maniascript
  const bool HasSucceeded; // Maniascript
  const bool HasFailed; // Maniascript
  const bool IsCanceled; // Maniascript
  const CWebServicesTaskResult::ETaskErrorType ErrorType; // Maniascript
  const uint ErrorCode; // Maniascript
  const wstring ErrorDescription; // Maniascript
  void Cancel(); // Maniascript
};

struct CWebServicesTaskScheduler : public CMwNod {
};

struct CNetUbiServices : public CMwNod {
};

struct CNetUbiServicesTask : public CWebServicesTaskSequence {
};

struct CNetUbiServicesTask_CreateSession : public CNetUbiServicesTask {
};

struct CNetUbiServicesTask_DeleteSession : public CNetUbiServicesTask {
};

struct CNetUbiServicesTask_LaunchUplay : public CNetUbiServicesTask {
};

struct CNetUbiServicesTask_GetUplayActions : public CNetUbiServicesTask {
};

struct CNetUbiServicesTask_GetUplayRewards : public CNetUbiServicesTask {
};

struct CNetUbiServicesTask_CompleteUplayActions : public CNetUbiServicesTask {
};

struct CNetUbiServicesTask_PurchaseUplayReward : public CNetUbiServicesTask {
};

struct CNetMasterServerEmptyTask : public CWebServicesTaskVoid {
};

struct CNetUplayPC : public CMwNod {
};

struct CNetMasterServerTask_GetManiaplanetLoginFromWebIdentity : public CNetMasterServerRequestTask {
};

struct CNetMasterServerTask_GetWebIdentityFromManiaplanetLogin : public CNetMasterServerRequestTask {
};

struct CNetUbiServicesTask_RequestProfiles : public CNetUbiServicesTask {
};

struct CNetMasterServerTask_GetDisplayNameFromManiaplanetLogin : public CWebServicesTaskSequence {
};

struct CNetMasterServerTask_GetDisplayNameFromWebIdentity : public CWebServicesTaskSequence {
};

struct CNetMasterServerRequestTask : public CWebServicesTaskSequence {
};

struct CWebServicesTaskResult_Bool : public CWebServicesTaskResult {
  const bool Value; // Maniascript
};

struct CWebServicesTaskResult_String : public CWebServicesTaskResult {
  const string Value; // Maniascript
};

struct CNetMasterServerTask_GetClientConfigUrls : public CNetMasterServerRequestTask {
};

struct CNetUplayPCTask_OpenOverlay : public CWebServicesTaskSequence {
};

struct CNetUbiServicesTask_SendNotification : public CNetUbiServicesTask {
};

struct CNetUbiServicesTask_CheckNewNotification : public CWebServicesTaskSequence {
};

struct CNetMasterServerTask_CheckNetworkAvailability : public CWebServicesTaskSequence {
};

struct CNetUplayPCUserInfo : public CMwNod {
};

struct CNetMasterServerTask_GetApplicationConfig : public CNetMasterServerRequestTask {
};

struct CWebServicesTaskResult_ApplicationConfig : public CWebServicesTaskResult {
};

struct CNetMasterServerTask_GetWaitingParams : public CNetMasterServerRequestTask {
};

struct CNetMasterServerTask_CheckLoginForSubscribe : public CNetMasterServerRequestTask {
};

struct CNetMasterServerTask_Subscribe : public CNetMasterServerRequestTask {
};

struct CNetMasterServerTask_OpenSession : public CNetMasterServerRequestTask {
};

struct CNetMasterServerTask_Connect : public CNetMasterServerRequestTask {
};

struct CWebServicesTaskResult_Session_Get : public CWebServicesTaskResult {
  const string SessionId; // Maniascript
  const string ServerLogin; // Maniascript
  const string ServerPassword; // Maniascript
};

struct CNetMasterServerTask_ShowProfile : public CWebServicesTaskSequence {
};

struct CNetUbiServicesTask_GetSpaceNews : public CNetUbiServicesTask {
};

struct CNetUbiServicesTask_GetProfileNews : public CNetUbiServicesTask {
};

struct CNetMasterServerTask_FinalizeConnection : public CWebServicesTaskSequence {
};

struct CNetMasterServerTask_Session_Get : public CWebServicesTaskSequence {
};

struct CNetMasterServerTask_Session_JoinOrCreate : public CWebServicesTaskSequence {
};

struct CNetMasterServerTask_Session_Leave : public CWebServicesTaskSequence {
};

struct CNetMasterServerTask_Session_InviteBuddy : public CWebServicesTaskSequence {
};

struct CNetMasterServerTask_Session_ShowInviteUI : public CWebServicesTaskSequence {
};

struct CNetMasterServerTask_GetFeatureTimeLimit : public CNetMasterServerRequestTask {
};

struct CWebServicesTaskResult_Natural : public CWebServicesTaskResult {
  const uint Value; // Maniascript
};

struct CNetMasterServerTask_CheckFeatureTimeLimit : public CNetMasterServerRequestTask {
};

struct CNetMasterServerTask_SetFeatureTimeUse : public CNetMasterServerRequestTask {
};

struct CWebServicesTaskResult_PlayerFeatureLimitList : public CWebServicesTaskResult {
};

// Description: "UbiServices news."
struct CNetUbiServicesNews : public CMwNod {
  const MwId Id; // Maniascript
  const string NewsId; // Maniascript
  const string Type; // Maniascript
  const string Placement; // Maniascript
  const string Locale; // Maniascript
  const wstring Title; // Maniascript
  const wstring Body; // Maniascript
  const string MediaUrl; // Maniascript
  const string MediaType; // Maniascript
  const uint Priority; // Maniascript
  const uint DisplayTime; // Maniascript
  uint GetPublicationDate(uint Month, uint Day, uint Hour, uint Minute, uint Second); // Maniascript
  const uint LinksCount; // Maniascript
  void GetLinkInfo(uint LinkIndex, string Type, string Param, wstring ActionName, wstring ActionDescription); // Maniascript
};

struct CNetMasterServerTask_GamerPic_GetUrl : public CWebServicesTaskSequence {
};

struct CWebServicesTaskResult_StringInt : public CWebServicesTaskResult {
  const wstring Value; // Maniascript
};

struct CNetUbiServicesTask_GetUnsentEvents : public CNetUbiServicesTask {
};

struct CNetUbiServicesTask_RefreshSession : public CNetUbiServicesTask {
};

struct CNetUbiServicesTask_PostCreateSession : public CNetUbiServicesTask {
};

struct CNetMasterServerTask_GetManiaplanetLoginAndWebIdentities : public CNetMasterServerRequestTask {
};

struct CNetUbiServicesTask_RetrieveBetaUserInfo : public CNetUbiServicesTask {
};

struct CNetUbiServicesTask_AcceptNDA : public CNetUbiServicesTask {
};

struct CNetUplayPCTask_UserTrophiesUnlock : public CWebServicesTaskSequence {
};

struct CWebServicesTaskVoid : public CWebServicesTask {
};

} // namespace Net

namespace Input {

struct CInputPort : public CMwNod {
  const UnnamedEnum InputsMode;
  const string CurrentActionMap;
  bool IsDoingIME;
  UnnamedEnum MouseVisibility;
  float RumbleIntensity; // Range: 0 - 2
  float CenterSpringIntensity; // Range: 0 - 1
  float ForceFeedbackIntensity; // Range: 0 - 1
  bool PollingEnabled;
  const bool DeviceHasBeenHotPlugged;
  const uint DevicePlugEventCount;
  void DeviceHotPlugUpdate();
  const MwFastBuffer<CInputDevice*> ConnectedDevices;
  uint MaxSampleRate;
  uint MinHistoryLength;
  const uint EventInStoreCount;
  bool IgnoreFocusForGamePads;
  const bool IsPadModuleExclusive;
  const MwFastBuffer<CInputScriptPad*> Script_Pads;
  uint AutoRepeat_InitialDelay;
  uint AutoRepeat_Period;
  const bool StatsDInputOverflowedLastFrame;
  const uint StatsDInputOverflowCount;
  const uint StatsDInputEventsLastFrame;
  const uint StatsDInputEventsCount;
  const uint StatsLatestEvent;
  const uint StatsDInputTimedEventsCount;
  const uint StatsDInputWrongTimestampAhead;
  const float StatsDInputWrongTimestampRatioAhead;
  const uint StatsDInputWrongTimestampLate;
  const float StatsDInputWrongTimestampRatioLate;
  const float StatsDInputWrongTimestampAvgDelta;
  const uint StatsNbMappedInputsReceived;
};

struct CInputPortDx8 : public CInputPort {
  CInputPortDx8();

};

struct CInputPortNull : public CInputPort {
};

struct CInputScriptEvent : public CMwNod {
  enum class CInputScriptEvent::EType {
    PadButtonPress = 0,
  };
  enum class CInputScriptEvent::EButton {
    Left = 0,
    Right = 1,
    Up = 2,
    Down = 3,
    A = 4,
    B = 5,
    X = 6,
    Y = 7,
    L1 = 8,
    R1 = 9,
    LeftStick = 10,
    RightStick = 11,
    Menu = 12,
    View = 13,
    LeftStick_Left = 14,
    LeftStick_Right = 15,
    LeftStick_Up = 16,
    LeftStick_Down = 17,
    RightStick_Left = 18,
    RightStick_Right = 19,
    RightStick_Up = 20,
    RightStick_Down = 21,
    L2 = 22,
    R2 = 23,
    None = 24,
  };
  const CInputScriptEvent::EType Type; // Maniascript
  CInputScriptPad* const Pad; // Maniascript
  const CInputScriptEvent::EButton Button; // Maniascript
  const bool IsAutoRepeat; // Maniascript
  const uint KeyCode; // Maniascript
  const string KeyName; // Maniascript
};

struct CInputBindingsConfig : public CMwNod {
  CInputBindingsConfig();

};

struct CInputDevice : public CMwNod {
  const uint UserData;
  const wstring InstanceName;
  const MwId InstanceId;
  const wstring DeviceModelName;
  const MwId DeviceModelId;
  const bool IsDisabled;
  const bool InputNotAvailable;
  const bool IsUnPlugged;
  const bool MustBePolled;
  const bool CanRumble;
  const uint ObjectCount;
  void ReadHardwareCurState();
};

struct CInputDeviceMouse : public CInputDevice {
  const bool IsInsideWindow;
  const vec2 PosInViewport;
  const vec2 KineticScrollVel;
};

struct CInputDeviceDx8Mouse : public CInputDeviceMouse {
};

struct CInputDeviceDx8Keyboard : public CInputDevice {
};

struct CInputDeviceDx8Pad : public CInputDevice {
  void DevSwitchUserIdInvalid();
};

// File extension: 'InputReplay.Gbx'
struct CInputReplay : public CMwNod {
  CInputReplay();

  const uint NbEvents;
};

struct CInputScriptManager : public CMwNod {
  enum class CInputScriptManager::EButton {
    Left = 0,
    Right = 1,
    Up = 2,
    Down = 3,
    A = 4,
    B = 5,
    X = 6,
    Y = 7,
    L1 = 8,
    R1 = 9,
    LeftStick = 10,
    RightStick = 11,
    Menu = 12,
    View = 13,
    LeftStick_Left = 14,
    LeftStick_Right = 15,
    LeftStick_Up = 16,
    LeftStick_Down = 17,
    RightStick_Left = 18,
    RightStick_Right = 19,
    RightStick_Up = 20,
    RightStick_Down = 21,
    L2 = 22,
    R2 = 23,
    None = 24,
  };
  const MwFastBuffer<CInputScriptEvent*> PendingEvents; // Maniascript
  const uint Now; // Maniascript
  const uint Period; // Maniascript
  const MwFastBuffer<CInputScriptPad*> Pads; // Maniascript
  const vec2 MousePos; // Maniascript
  const bool MouseLeftButton; // Maniascript
  const bool MouseRightButton; // Maniascript
  const bool MouseMiddleButton; // Maniascript
  wstring GetPadButtonPlaygroundBinding(CInputScriptPad* Pad, CInputScriptManager::EButton Button); // Maniascript
  wstring GetPadButtonCurrentBinding(CInputScriptPad* Pad, CInputScriptManager::EButton Button); // Maniascript
  wstring GetPadButtonBinding(CInputScriptPad* Pad, CInputScriptManager::EButton Button); // Maniascript
  bool ExclusiveMode; // Maniascript
  bool IsKeyPressed(int KeyCode); // Maniascript
  uint Dbg_AutoRepeat_InitialDelay; // Maniascript
  uint Dbg_AutoRepeat_Period; // Maniascript
};

// Description: "game controller."
struct CInputScriptPad : public CMwNod {
  enum class CInputScriptPad::EButton {
    Left = 0,
    Right = 1,
    Up = 2,
    Down = 3,
    A = 4,
    B = 5,
    X = 6,
    Y = 7,
    L1 = 8,
    R1 = 9,
    LeftStick = 10,
    RightStick = 11,
    Menu = 12,
    View = 13,
    LeftStick_Left = 14,
    LeftStick_Right = 15,
    LeftStick_Up = 16,
    LeftStick_Down = 17,
    RightStick_Left = 18,
    RightStick_Right = 19,
    RightStick_Up = 20,
    RightStick_Down = 21,
    L2 = 22,
    R2 = 23,
    None = 24,
  };
  enum class CInputScriptPad::EPadType {
    Keyboard = 0,
    Generic = 1,
    XBox = 2,
    PlayStation = 3,
    Vive = 4,
  };
  const int ControllerId; // Maniascript
  const MwId UserId; // Maniascript
  const CInputScriptPad::EPadType Type; // Maniascript
  const wstring ModelName; // Maniascript
  const uint IdleDuration; // Maniascript
  const uint Left; // Maniascript
  const uint Right; // Maniascript
  const uint Up; // Maniascript
  const uint Down; // Maniascript
  const uint A; // Maniascript
  const uint B; // Maniascript
  const uint X; // Maniascript
  const uint Y; // Maniascript
  const uint L1; // Maniascript
  const uint R1; // Maniascript
  const uint LeftStickBut; // Maniascript
  const uint RightStickBut; // Maniascript
  const uint Menu; // Maniascript
  const uint View; // Maniascript
  const float LeftStickX; // Range: -1 - 1 // Maniascript
  const float LeftStickY; // Range: -1 - 1 // Maniascript
  const float RightStickX; // Range: -1 - 1 // Maniascript
  const float RightStickY; // Range: -1 - 1 // Maniascript
  const float L2; // Range: 0 - 1 // Maniascript
  const float R2; // Range: 0 - 1 // Maniascript
  const MwFastBuffer<CInputScriptPad::EButton> ButtonEvents; // Maniascript
  void ClearRumble(); // Maniascript
  void AddRumble(uint Duration, float LargeMotor, float SmallMotor); // Maniascript
  void SetColor(vec3 Color); // Maniascript
};

} // namespace Input

namespace Xml {

struct CXmlScriptManager : public CMwNod {
  CXmlScriptDocument* Create(string Contents); // Maniascript
  CXmlScriptDocument* Create2(string Contents, bool GenerateText, bool GenerateTextRaw, bool GenerateTextResursive); // Maniascript
  void Destroy(CXmlScriptDocument* Document); // Maniascript
  const MwFastBuffer<CXmlScriptDocument*> Documents; // Maniascript
  uint DocumentsSlotsLimit; // Maniascript
};

struct CXmlScriptDocument : public CMwNod {
  const string TextContents; // Maniascript
  CXmlScriptNode* const Root; // Maniascript
  const MwFastBuffer<CXmlScriptNode*> Nodes; // Maniascript
  CXmlScriptNode* GetFirstChild(string Name); // Maniascript
};

struct CXmlScriptNode : public CMwNod {
  const wstring Name; // Maniascript
  const wstring TextContents; // Maniascript
  const string TextRawContents; // Maniascript
  const string TextRecursiveContents; // Maniascript
  const MwFastBuffer<CXmlScriptNode*> Children; // Maniascript
  wstring GetAttributeText(wstring Name, wstring DefaultValue); // Maniascript
  int GetAttributeInteger(wstring Name, int DefaultValue); // Maniascript
  float GetAttributeReal(wstring Name, float DefaultValue); // Maniascript
  bool GetAttributeBoolean(wstring Name, bool DefaultValue); // Maniascript
  CXmlScriptNode* GetFirstChild(string Name); // Maniascript
};

} // namespace Xml

namespace TrackMania {

// File extension: 'ManiaPlanet.Gbx'
struct CTrackMania : public CGameManiaPlanet {
  CTrackMania();

  void ScanDiskForChallenges();
  void ScanDiskForCampaigns();
  void ScanDiskForReplays();
  void DebugConvertReplays();
  const MwFastBuffer<CTrackManiaMatchSettings*> MatchSettings;
  CGamePlayerProfile* CoopProfile;
};

// File extension: 'TitleCore.Gbx'
struct CTrackManiaCore : public CGameManiaTitleCore {
  CTrackManiaCore();

  CGameManiaPlanet* const Dummy;
  CTrackManiaResource* Resource;
};

struct CTrackManiaRace : public CGameRace {
  CTrackManiaRace();

  uint LapCount;
  CTrackMania* const Game;
  const uint NbRespawns;
  const float Fps;
  float VehicleFadeDistMinBoxCoef;
  float VehicleFadeDistMaxBoxCoef;
  void ResetForParam();
  void OnPlayerPositionSend();
  MwFastBuffer<CGameCtnGhost*> RaceGhosts;
  bool IsBestRaceGhostVisible;
  bool ForceDisplayNames;
  CGameCtnReplayRecord* ValidateAReplay;
  CGameMobil* const LocalPlayerMobil;
  float ScaleCarValue; // Range: 0.1 - 10
  float CatchUpMin; // Range: 0.1 - 1
  float CatchUpMax; // Range: 1 - 10
  float MetersPrediction;
  float AspirationConeH;
  float AspirationConeV;
  float AspirationDistance;
  float AspirationAccelBonus;
  float ScaleSpeedSec;
  CFuncKeysReal* ScaleFunc;
  uint ScaleDuration;
  CFuncKeysReal* BonusMiniCarWeight;
  CFuncKeysReal* const BonusEmptyCarsWeight;
  CFuncKeysReal* const BonusJumpWeight;
  CFuncKeysReal* const BonusTurboWeight;
  CFuncKeysReal* const BonusBigCarWeight;
  CFuncKeysReal* const BonusSpeedyCarWeight;
  const uint BonusIsGoldChance;
  const uint BonusTurboStock;
  const float BonusCarScale;
  const float BonusCarScaleAccel;
  const uint BonusMiniCarDuration;
  const uint BonusBigCarDuration;
  const uint BonusEmptyCarsStock;
  float EmptyCarInitVelCoef;
  float EmptyCarMassCoef;
  uint EmptyCarMaxLimit;
  uint SpeedyCarInitVel;
  float FireCarScaleCoef;
  uint BonusEventTimeStartMin;
  const uint BonusEventTimeStartMax;
  const uint BonusEventTimeCooldownMin;
  const uint BonusEventTimeCooldownMax;
  const uint BonusEventTimeWarningDuration;
  const uint BonusEventIsGoldChance;
  float StuntModePointCoef;
  uint StuntStickHelperTime;
  uint StuntJumpHelperTime;
  uint StuntContactHelperTime;
  float StuntBodyOffsetMax;
  float StuntBodyOffsetPow;
  float CameraHeight; // Range: 0 - 10
  float CameraOffset; // Range: 0 - 30
  float FovY;
  const float SpeedCoef; // Range: 0 - 2
  uint AutoAdaptSpeedStrat;
  float OutOfScreenTimeLimitSec; // Range: 0 - 5
  bool DrawPath;
  uint SampleTimeStepMs;
  uint SampleCount;
  float MinGhostSpeed;
  float MaxGhostSpeed;
  float ReswpawnSpeedBonusCoef;
  float ComeBackDistanceCoef;
  float MinRespawnSpeed;
  int AllowedRespawnCount;
  bool AllowSelfRespawn;
  uint SpeedHistoryIntervalDurationMs;
  uint HelperPathTimeStep;
  uint LateRespawnTimeDurationMs;
  float LateRespawnPenaltyCoef;
  bool ClampRespawnSpeed;
};

struct CTrackManiaRaceNew : public CTrackManiaRace {
  CTrackManiaRaceNew();

};

// Description: "Rules API for TrackMania gamemodes."
struct CTrackManiaRaceRules : public CGamePlaygroundScript {
  enum class CTrackManiaRaceRules::ETmScoreSortOrder {
    TotalPoints = 0,
    BestRace_Time = 1,
    BestRace_Stunts = 2,
    BestRace_NbRespawns = 3,
    BestRace_CheckpointsProgress = 4,
    PrevRace_Time = 5,
    Name = 6,
    LadderRankSortValue = 7,
  };
  enum class CTrackManiaRaceRules::ETMRespawnBehaviour {
    Normal = 0,
    DoNothing = 1,
    GiveUpBeforeFirstCheckPoint = 2,
    AlwaysGiveUp = 3,
  };
  enum class CTrackManiaRaceRules::ETmRaceChronoBehaviour {
    Auto = 0,
    Hidden = 1,
    CountDown = 2,
    Normal = 3,
  };
  enum class CTrackManiaRaceRules::EPersonalGhost {
    Disabled = 0,
    Latest = 1,
    FastestRace = 2,
  };
  const MwFastBuffer<CTmRaceRulesPlayer*> AllPlayers; // Maniascript
  const MwFastBuffer<CTmRaceRulesPlayer*> Spectators; // Maniascript
  const MwFastBuffer<CTmRaceRulesPlayer*> Players; // Maniascript
  const MwFastBuffer<CTmRaceRulesPlayer*> PlayersRacing; // Maniascript
  const MwFastBuffer<CTmRaceRulesPlayer*> PlayersWaiting; // Maniascript
  const MwFastBuffer<CTmRaceRulesScore*> Scores; // Maniascript
  uint Clan1Score; // Maniascript
  uint Clan2Score; // Maniascript
  MwFastArray<int> ClanScores; // Maniascript
  const uint ClansNbTotal; // Maniascript
  const MwFastBuffer<uint> ClansNbPlayers; // Maniascript
  const MwFastBuffer<CTmRaceRulesEvent*> PendingEvents; // Maniascript
  void PassOn(CTmRaceRulesEvent* Event); // Maniascript
  void Discard(CTmRaceRulesEvent* Event); // Maniascript
  void SpawnPlayer(CTmRaceRulesPlayer* Player, int ClanNum, int RaceStartTime); // Maniascript
  void UnspawnPlayer(CTmRaceRulesPlayer* Player); // Maniascript
  void SetPlayerClan(CTmRaceRulesPlayer* Player, int ClanNum); // Maniascript
  void Scores_Sort(CTrackManiaRaceRules::ETmScoreSortOrder SortOrder); // Maniascript
  void Scores_Clear(); // Maniascript
  void Ladder_ComputeRank(CTrackManiaRaceRules::ETmScoreSortOrder SortOrder); // Maniascript
  int CutOffTimeLimit; // Maniascript
  const int NbLaps; // Maniascript
  bool IndependantLaps; // Maniascript
  bool UseClans; // Maniascript
  bool UseForcedClans; // Maniascript
  CTrackManiaRaceRules::ETMRespawnBehaviour RespawnBehaviour; // Maniascript
  bool UiRounds; // Maniascript
  bool UiLaps; // Maniascript
  bool UiStuntsMode; // Maniascript
  bool UiDisplayStuntsNames; // Maniascript
  bool UiDisableHelpMessage; // Maniascript
  int UiScoresPointsLimit; // Maniascript
  CTrackManiaRaceRules::ETmRaceChronoBehaviour UiRaceChrono; // Maniascript
  void Cheats_Reset(); // Maniascript
  bool EnableCollisions; // Maniascript
  const bool EnableScaleCar; // Maniascript
  const bool EnableCheckpointBonus; // Maniascript
  bool EnableUniqueCamera; // Maniascript
  const bool EnableBonusEvents; // Maniascript
  bool HideOpponents; // Maniascript
  int ForceMaxOpponents; // Maniascript
  bool EnableLegacyXmlRpcCallbacks; // Maniascript
  bool MedalGhost_ShowGold; // Maniascript
  bool MedalGhost_ShowSilver; // Maniascript
  bool MedalGhost_ShowBronze; // Maniascript
  CTrackManiaRaceRules::EPersonalGhost PersonalGhost; // Maniascript
  MwId RaceGhost_Add(CGameGhostScript* Ghost, bool DisplayAsPlayerBest); // Maniascript
  MwId RaceGhost_AddWithOffset(CGameGhostScript* Ghost, uint OffsetMs); // Maniascript
  MwId RaceGhost_AddModel(CGameGhostScript* Ghost, bool DisplayAsPlayerBest, MwId ModelId); // Maniascript
  void RaceGhost_Remove(MwId GhostInstId); // Maniascript
  void RaceGhost_RemoveAll(); // Maniascript
  uint RaceGhost_GetStartTime(MwId GhostInstId); // Maniascript
  uint RaceGhost_GetCurCheckpoint(MwId GhostInstId); // Maniascript
  uint RaceGhost_GetCheckpointTime(MwId GhostInstId, uint Checkpoint); // Maniascript
  bool RaceGhost_IsReplayOver(MwId GhostInstId); // Maniascript
  bool OnlineRecordEnabled; // Maniascript
  const vec3 MapStartLinePos; // Maniascript
  const MwFastBuffer<vec3> MapCheckpointPos; // Maniascript
  const MwFastBuffer<vec3> MapFinishLinePos; // Maniascript
  const bool MapIsLapRace; // Maniascript
  const uint MapNbLaps; // Maniascript
  const MwFastBuffer<CTmRaceRulesPlayer*> ConnectedPlayers; // Maniascript
  void FakePlayers_Add(wstring NickName); // Maniascript
  void FakePlayers_Remove(CGamePlayerInfo* User); // Maniascript
  void FakePlayers_RemoveAll(); // Maniascript
};

struct CTrackManiaRace1P : public CTrackManiaRace {
  CTrackManiaRace1P();

};

struct CTmRaceRulesScore : public CGamePlaygroundScore {
  const uint TeamNum; // Maniascript
  int Points; // Maniascript
  CTmRaceResultNod* BestRace; // Maniascript
  CTmRaceResultNod* BestLap; // Maniascript
  int PrevRaceDeltaPoints; // Maniascript
  CTmRaceResultNod* PrevRace; // Maniascript
  CTmRaceResultNod* TempResult; // Maniascript
  void Clear(); // Maniascript
};

// File extension: 'TrackManiaMenus.Gbx'
struct CTrackManiaMenus : public CGameCtnMenusManiaPlanet {
  CTrackManiaMenus();

  CGameCtnChallenge* const SelectedChallenge;
  uint LastPage;
  const UnnamedEnum Medal;
  const uint CampaignChallengeNumber;
  wstring TestComment;
  wstring Mptp_Score;
  wstring GhostFileName;
  wstring GhostFileNameExt;
  uint LastScore;
  uint LastRecord;
  UnnamedEnum NetworkGameMode;
  const wstring NetworkGameModeName;
  uint MedalsCount;
  bool TestDifficulty0;
  bool TestDifficulty1;
  bool TestDifficulty2;
  bool TestDifficulty3;
  bool TestDifficulty4;
  bool TestQuality0;
  bool TestQuality1;
  bool TestQuality2;
  bool TestQuality3;
  bool TestQuality4;
  void OnChooseAvatar1();
  void OnChooseAvatar2();
  void OnChooseAvatar3();
  void OnChooseAvatar4();
  void OnChooseAvatar5();
  void OnChooseAvatar6();
  void OnChooseAvatar7();
  void OnChooseAvatar8();
  void OnChooseProfile1();
  void OnChooseProfile2();
  void OnChooseProfile3();
  void OnChooseProfile4();
  void OnChooseProfile5();
  void OnChooseProfile6();
  void OnChooseProfile7();
  void OnChooseProfile8();
  void MenuChoosePlaylistHotseat();
  void MenuChoosePlaylistNetwork();
  void MenuChoosePlaylist_Init();
  void MenuChoosePlaylist_Clean();
  void MenuChoosePlaylist_OnPlaylistSelected();
  void MenuChoosePlaylist_OnBack();
  void MenuChoosePlaylist_OnCustom();
  void MenuChoosePlaylist_OnRefresh();
  const uint MenuChoosePlaylist_PlaylistsCount;
  void MenuChoosePlaylist_OnOfficialTracks();
  void MenuChoosePlaylist_OnMyTracks();
  void MenuChoosePlaylist_OnDownloadedTracks();
  void MenuPlayChallenge_Solo();
  void MenuPlayChallenge_Solo_Challenges();
  void MenuPlayChallenge_Solo_MyTracks();
  void MenuPlayChallenge_Solo_DownloadedTracks();
  void MenuChooseChallenge_OnDownloadReplay();
  void MenuChooseChallenge_OnSaveSettings();
  void MenuChooseChallenge_OnSaveSettings_OnYes();
  void MenuChooseChallenge_OnSaveSettings_DoSave();
  void MenuCampaignChallenges_Solo();
  void MenuCampaignChallenges_Coop();
  void MenuCampaignChallenges_OnBack();
  void MenuCampaignChallenges_OnChallengeCardSelected();
  const wstring MenuCampaignChallenges_Location;
  const uint MenuCampaignChallenges_Level;
  CPlugBitmap* MenuCampaignChallenges_ZoneLogoBitmap;
  void MenuCampaignChallenges_OnChallengeGridPrevPage();
  void MenuCampaignChallenges_OnChallengeGridNextPage();
  void MenuCampaignChallenges_OnChallengeCardRemoved();
  void MenuCampaignChallenges_OnChallengeCardRemovedConfirmed();
  void MenuCampaignChallenges_OnFriendUnlockYes();
  void MenuCampaignChallenges_OnFriendUnlockNo();
  void MenuCampaignChallenges_OnToggleLadder();
  void MenuCampaignCoop_OnBack();
  void MenuReplayEditor();
  void MenuGhostEditor();
  bool MenuMultiPlayerNetworkCreate_AcceptReferee;
  void MenuMultiPlayerNetworkCreate_ChooseScriptName();
  void MenuMultiPlayerNetworkCreate_OpenDialogScriptName_Yes();
  void MenuMultiPlayer_OnLan();
  void MenuMultiPlayer_OnInternet();
  void MenuStatistics();
  void MenuStatistics_OnBack();
  void MenuMultiLocal_OnBrowseChallenge();
  void MenuMultiLocal_OnBrowseReplay();
  void DialogQuitRace();
  void DialogQuitRace_OnResume();
  void DialogQuitRace_OnRestart();
  void DialogQuitRace_OnOfficial();
  void DialogQuitRace_OnOfficialCustom();
  void DialogQuitRace_OnTrackRankings();
  void DialogQuitRace_OnTrackRankingsCustom();
  void DialogQuitRace_OnRestartMap();
  void DialogQuitRace_OnNextMap();
  void DialogQuitRace_OnInputSettings();
  void DialogQuitRace_OnStereoscopySettings();
  void DialogQuitRace_OnSelectOpponents();
  void DialogQuitRace_OnEdit();
  void DialogQuitRace_OnQuit();
  void DialogQuickChooseGhostOpponents();
  void DialogLowFpsWarn_OnOk();
  void DialogLowFpsWarn_OnCancel();
  bool DialogLowFpsWarn_NeverAskAgain;
  void DialogQuitEditor();
  void DialogQuitEditor_OnDelete();
  void DialogQuitEditor_OnUpload();
  void DialogQuitEditor_OnQuit();
  void DialogChallengeResult_OnRetry();
  void DialogChallengeResult_OnRetryOfficial();
  void DialogChallengeResult_OnQuit();
  void DialogChallengeResult_OnSaveReplay();
  void DialogChallengeResult_OnEdit();
  void DialogChallengeResult_OnSendScore();
  void DialogChallengeResult_OnRewind();
  void DialogChallengeResult_OnChooseOpponents();
  void DialogChallengeResult_OnNextMap();
  bool DialogChallengeResult_IsPaused;
  bool DialogChallengeResult_IsPlaying;
  void DialogNewUnlock_OnOk();
  void DialogUseGhost();
  void DialogUseGhost_OnYes();
  void DialogUseGhost_OnNo();
  void DialogCreateGhost();
  void DialogCreateGhost_OnUse();
  void DialogCreateGhost_OnRetry();
  void DialogCreateGhost_OnQuit();
  void DialogCreateGhost_OnReallyQuit();
  void DialogCreateGhost_OnSaveReplay();
  void DialogChooseNbGhosts();
  void DialogChooseNbGhosts_On4();
  void DialogChooseNbGhosts_On7();
  void DialogCreateStuntsGhost();
  void DialogCreateStuntsGhost_OnQuit();
  void DialogHotSeatResult_OnRevenge();
  void DialogHotSeatResult_OnNext();
  void DialogHotSeatResult_OnQuit();
  void DialogHotSeatInGameMenu_OnResume();
  void DialogHotSeatInGameMenu_OnGiveUp();
  void DialogHotSeatInGameMenu_OnQuit();
  void DialogTestReport();
  void DialogTestReport_OnOk();
  void DialogTestReport_OnCancel();
  void ShowMenus();
  void ShowDialogs();
  const uint CatalogChapterTotalCoppers;
  const MwFastBuffer<CGameCtnChallengeInfo*> DialogChallengeInfos;
  void DialogGroupCampaignAddNewChallenge_OnSlot1();
  void DialogGroupCampaignAddNewChallenge_OnSlot2();
  void DialogGroupCampaignAddNewChallenge_OnSlot3();
  void DialogGroupCampaignAddNewChallenge_OnSlot4();
  void DialogGroupCampaignAddNewChallenge_OnSlot5();
  void DialogGroupCampaignAddNewChallenge_OnCancel();
  void DialogNextGhostOpponent_OnOk();
  void DialogNextGhostOpponent_OnCancel();
  void DialogNextGhostOpponent_OnPlayOfficial();
  void DialogNextGhostOpponent_OnKeepTraining();
  void DialogNextGhostOpponent_OnSelectAnotherMap();
  void DialogSendScore_OnCopyToClipboard();
  void DialogSendScore_OnExportGhost();
  void DialogSendScore_OnOk();
};

struct CTrackManiaNetwork : public CGameManiaPlanetNetwork {
  CTrackManiaRaceRules* const TmRaceRules;
  CTrackManiaPlayerInfo* PlayerInfo;
  bool CurrentRaceIsValid;
  bool ForceEndRound;
  uint WaitTimeBeforeTwoValidations;
};

struct CTrackManiaNetForm : public CGameNetForm {
  CTrackManiaNetForm();

};

// Description: "Player for CTmMlScriptIngame."
struct CTrackManiaPlayer : public CGamePlayer {
  enum class CTrackManiaPlayer::ERaceState {
    BeforeStart = 0,
    Running = 1,
    Finished = 2,
    Eliminated = 3,
  };
  enum class CTrackManiaPlayer::ETmRacePlayerCoopMode {
    None = 0,
    Symbiosys = 1,
    Checkpoint = 2,
  };
  enum class CTrackManiaPlayer::ETmJumpMode {
    Disabled = 0,
    Simple = 1,
    Double = 2,
    Infinite = 3,
  };
  enum class CTrackManiaPlayer::ETmBonusModeEventType {
    None = 0,
    Bumps = 1,
    LowGravity = 2,
    FreeWheeling = 3,
    LockedDirections = 4,
  };
  enum class CTrackManiaPlayer::ESceneVehiclePhyStuntFigure {
    None = 0,
    StraightJump = 1,
    Flip = 2,
    BackFlip = 3,
    Spin = 4,
    Aerial = 5,
    AlleyOop = 6,
    Roll = 7,
    Corkscrew = 8,
    SpinOff = 9,
    Rodeo = 10,
    FlipFlap = 11,
    Twister = 12,
    FreeStyle = 13,
    SpinningMix = 14,
    FlippingChaos = 15,
    RollingMadness = 16,
    WreckNone = 17,
    WreckStraightJump = 18,
    WreckFlip = 19,
    WreckBackFlip = 20,
    WreckSpin = 21,
    WreckAerial = 22,
    WreckAlleyOop = 23,
    WreckRoll = 24,
    WreckCorkscrew = 25,
    WreckSpinOff = 26,
    WreckRodeo = 27,
    WreckFlipFlap = 28,
    WreckTwister = 29,
    WreckFreeStyle = 30,
    WreckSpinningMix = 31,
    WreckFlippingChaos = 32,
    WreckRollingMadness = 33,
    TimePenalty = 34,
    RespawnPenalty = 35,
    Grind = 36,
    Reset = 37,
  };
  const int CurrentClan; // Maniascript
  const CTrackManiaPlayer::ERaceState RaceState; // Maniascript
  const bool IsSpawned; // Maniascript
  CTrackManiaScore* Score; // Maniascript
  const uint RaceStartTime; // Maniascript
  const uint LapStartTime; // Maniascript
  CTmRaceResultNod* CurRace; // Maniascript
  CTmRaceResultNod* CurLap; // Maniascript
  const uint CurrentNbLaps; // Maniascript
  const int CurTriggerIndex; // Maniascript
  const uint CurCheckpointRaceTime; // Maniascript
  const uint CurCheckpointLapTime; // Maniascript
  const int CoopSymbiosysPercentTotal; // Maniascript
  const uint CoopCheckpointCurController; // Maniascript
  const CTrackManiaPlayer::ETmRacePlayerCoopMode CoopMode; // Maniascript
  const uint ControllerCount; // Maniascript
  const int ControllerId0; // Maniascript
  const int ControllerId1; // Maniascript
  const int ControllerId2; // Maniascript
  const int ControllerId3; // Maniascript
  const uint CoopModeControllerCount; // Maniascript
  const int CoopModeControllerId0; // Maniascript
  const int CoopModeControllerId1; // Maniascript
  const int CoopModeControllerId2; // Maniascript
  const int CoopModeControllerId3; // Maniascript
  const bool ForcedAerialCamera; // Maniascript
  const bool ButtonSmashFrenzy; // Maniascript
  const bool EnableTurboButton; // Maniascript
  const bool MaxiAirControl; // Maniascript
  const bool EnableEmptyCars; // Maniascript
  const CTrackManiaPlayer::ETmJumpMode JumpMode; // Maniascript
  const bool TinyCar; // Maniascript
  const bool EnableCatchUpSpeed; // Maniascript
  const bool EnableStuntMode; // Maniascript
  const bool EnableOnlineMode; // Maniascript
  const float AccelCoef; // Maniascript
  const float ControlCoef; // Maniascript
  const float GravityCoef; // Maniascript
  const vec3 Position; // Maniascript
  const vec3 AimDirection; // Maniascript
  const float AimYaw; // Maniascript
  const float AimPitch; // Maniascript
  const float Upwardness; // Maniascript
  const uint CurRaceContinuousRank; // Maniascript
  const float Distance; // Maniascript
  const float Speed; // Maniascript
  const uint DisplaySpeed; // Maniascript
  const float InputSteer; // Maniascript
  const float InputGasPedal; // Maniascript
  const bool InputIsBraking; // Maniascript
  const float EngineRpm; // Maniascript
  const int EngineCurGear; // Maniascript
  const float EngineTurboRatio; // Maniascript
  const uint WheelsContactCount; // Maniascript
  const uint WheelsSkiddingCount; // Maniascript
  const float DamageHullRatio; // Maniascript
  const float DamageWindowRatio; // Maniascript
  const uint InWaterDuration; // Maniascript
  const uint FreeWheelingDuration; // Maniascript
  const uint FlyingDuration; // Maniascript
  const uint SparklingDuration; // Maniascript
  const uint LightTrailsDuration; // Maniascript
  const uint SkiddingDuration; // Maniascript
  const float SkiddingDistance; // Maniascript
  const float FlyingDistance; // Maniascript
  const bool BonusModeIsJump; // Maniascript
  const bool BonusModeIsTurbo; // Maniascript
  const bool BonusModeIsMiniCar; // Maniascript
  const bool BonusModeIsBigCar; // Maniascript
  const bool BonusModeIsEmptyCars; // Maniascript
  const bool BonusModeIsSpeedyCars; // Maniascript
  const bool BonusModeIsGold; // Maniascript
  const uint BonusModeEmptyCarsStock; // Maniascript
  const uint BonusModeTurboStock; // Maniascript
  const uint BonusModeJumpStock; // Maniascript
  const uint BonusBumpCooldown; // Maniascript
  const bool BonusIsPossible; // Maniascript
  const uint BonusModeTimeTillEvent; // Maniascript
  const uint BonusModeTimeTillEndEvent; // Maniascript
  const uint BonusModeTimeTillEventWarning; // Maniascript
  const CTrackManiaPlayer::ETmBonusModeEventType BonusModeEventType; // Maniascript
  const bool BonusModeEventIsGold; // Maniascript
  const uint StuntLastTime; // Maniascript
  const uint StuntPoints; // Maniascript
  const uint StuntCombo; // Maniascript
  const bool StuntPerfectLanding; // Maniascript
  const bool StuntMasterLanding; // Maniascript
  const bool StuntEpicLanding; // Maniascript
  const CTrackManiaPlayer::ESceneVehiclePhyStuntFigure StuntLast; // Maniascript
  const uint StuntTurboGauge; // Maniascript
  const uint StuntTurboGaugeMax; // Maniascript
  const uint TimeElapsedSinceLastStunt; // Maniascript
  const uint StuntAngle; // Maniascript
  const uint UniqueCameraRespawnCount; // Maniascript
  const uint UniqueCameraAvailableRespawnLeft; // Maniascript
  const uint TimeLeftForStuntCombo; // Maniascript
  const uint TimeTillSmashRespawn; // Maniascript
  const uint TimeTillSmashGiveUp; // Maniascript
  const bool SmashNeedHelp; // Maniascript
  const bool StuntStickNeedHelp; // Maniascript
  const bool StuntJumpNeedHelp; // Maniascript
  const float StuntJumpCharge; // Maniascript
  const float StuntMasterCharge; // Maniascript
  const float StuntEpicCharge; // Maniascript
  void StuntStateReset(); // Maniascript
  uint BonusEventStartTime;
  uint BonusEventDuration;
  uint BonusEventWarningDuration;
  const int TimeBeforeDeadlyZone; // Maniascript
  const bool IsDeadlyZoneActive; // Maniascript
  const uint NbRespawns;
  bool AutoPilotEnabled;
  const iso4 SpawnLoc;
  const uint CurLapIndex;
};

struct CTrackManiaGameTerminal : public CGameTerminal {
  CTrackManiaGameTerminal();

};

struct CTrackManiaNetworkServerInfo : public CGameCtnNetServerInfo {
  enum class CTrackManiaNetworkServerInfo::EGameMode {
    _GameMode_Script = 0, // |GameMode|Script
    _GameMode_Rounds = 1, // |GameMode|Rounds
    _GameMode_Time_Attack = 2, // |GameMode|Time Attack
    _GameMode_Team = 3, // |GameMode|Team
    _GameMode_Laps = 4, // |GameMode|Laps
    _GameMode_Cup = 5, // |GameMode|Cup
    _GameMode_Stunts = 6, // |GameMode|Stunts
  };
  enum class CTrackManiaNetworkServerInfo::EGameMode_Script {
    Script = 0,
    Rounds = 1,
    TimeAttack = 2,
    Team = 3,
    Laps = 4,
    Cup = 5,
    Stunts = 6,
  };
  const CTrackManiaNetworkServerInfo::EGameMode CurGameMode;
  const CTrackManiaNetworkServerInfo::EGameMode_Script CurGameMode_Script;
  const wstring CurGameModeStr;
  const uint CurRoundPointsLimit;
  const uint CurRoundForcedLaps;
  const bool CurRoundUseNewRules;
  const uint CurRoundPointsLimitNewRules;
  const uint CurTeamPointsLimit;
  const uint CurTeamMaxPoints;
  const bool CurTeamUseNewRules;
  const uint CurTeamPointsLimitNewRules;
  const uint CurTimeAttackLimit;
  const uint CurTimeAttackSynchStartPeriod;
  const uint CurLapsNbLaps;
  const uint CurLapsTimeLimit;
  const uint CurEswcCupPointsLimit;
  const uint CurEswcCupRoundsPerChallenge;
  const uint CurEswcCupNbWinners;
  const uint CurEswcCupWarmUpDuration;
  const uint CurChatTime;
  const uint CurFinishTimeout;
  const uint CurAllWarmUpDuration;
  const bool CurDisableRespawn;
  const uint CurForceMaxOpponents;
  const wstring CurScriptRelName;
  CTrackManiaNetworkServerInfo::EGameMode NextGameMode;
  CTrackManiaNetworkServerInfo::EGameMode_Script NextGameMode_Script;
  uint NextRoundPointsLimit;
  uint NextRoundForcedLaps;
  bool NextRoundUseNewRules;
  uint NextRoundPointsLimitNewRules;
  uint NextTeamPointsLimit;
  uint NextTeamMaxPoints;
  bool NextTeamUseNewRules;
  uint NextTeamPointsLimitNewRules;
  uint NextTimeAttackLimit;
  uint NextTimeAttackSynchStartPeriod;
  uint NextLapsNbLaps;
  uint NextLapsTimeLimit;
  uint NextEswcCupPointsLimit;
  uint NextEswcCupRoundsPerChallenge;
  uint NextEswcCupNbWinners;
  uint NextEswcCupWarmUpDuration;
  uint NextChatTime;
  uint NextFinishTimeout;
  uint NextAllWarmUpDuration;
  bool NextDisableRespawn;
  bool NextForceMaxOpponents;
  wstring NextScriptRelName;
};

struct CTrackManiaPlayerInfo : public CGamePlayerInfo {
  CTrackManiaScore* const RaceScore;
  bool ReadyToGoNext;
  uint ReadyEnum;
};

struct CTrackManiaRaceNetRounds : public CTrackManiaRaceNet {
  CTrackManiaRaceNetRounds();

  const uint NbValidRounds;
  const uint CupWarmUpDuration;
  const uint CupRoundsPerChallenge;
};

// Description: "Player for CTmMode."
struct CTmRaceRulesPlayer : public CGamePlayer {
  enum class CTmRaceRulesPlayer::ETmRacePlayerCoopMode {
    None = 0,
    Symbiosys = 1,
    Checkpoint = 2,
  };
  enum class CTmRaceRulesPlayer::ETmJumpMode {
    Disabled = 0,
    Simple = 1,
    Double = 2,
    Infinite = 3,
  };
  const int CurrentClan; // Maniascript
  CTmRaceRulesScore* const Score; // Maniascript
  int RaceStartTime; // Maniascript
  bool IsSpawned; // Maniascript
  CTmRaceResultNod* CurRace; // Maniascript
  CTmRaceResultNod* CurLap; // Maniascript
  int CurrentNbLaps; // Maniascript
  const int CurTriggerIndex; // Maniascript
  const vec3 Position; // Maniascript
  const float AimYaw; // Maniascript
  const float AimPitch; // Maniascript
  const vec3 AimDirection; // Maniascript
  MwId ForceModelId; // Maniascript
  const float AccelCoef; // Maniascript
  const float ControlCoef; // Maniascript
  const float GravityCoef; // Maniascript
  CTmRaceRulesPlayer::ETmRacePlayerCoopMode CoopMode; // Maniascript
  uint ControllerCount; // Maniascript
  int ControllerId0; // Maniascript
  int ControllerId1; // Maniascript
  int ControllerId2; // Maniascript
  int ControllerId3; // Maniascript
  uint CoopModeControllerCount; // Maniascript
  int CoopModeControllerId0; // Maniascript
  int CoopModeControllerId1; // Maniascript
  int CoopModeControllerId2; // Maniascript
  int CoopModeControllerId3; // Maniascript
  bool ForcedAerialCamera; // Maniascript
  const bool ButtonSmashFrenzy; // Maniascript
  const bool EnableTurboButton; // Maniascript
  const bool MaxiAirControl; // Maniascript
  const bool EnableEmptyCars; // Maniascript
  const CTmRaceRulesPlayer::ETmJumpMode JumpMode; // Maniascript
  const bool TinyCar; // Maniascript
  const bool EnableCatchUpSpeed; // Maniascript
  const bool EnableStuntMode; // Maniascript
  const bool EnableOnlineMode; // Maniascript
};

struct CTrackManiaMatchSettings : public CGameFid {
  wstring Comment;
  bool IsSolo;
  bool IsHotSeat;
  bool IsLan;
  bool IsInternet;
  uint SortIndex;
  bool RandomMapOrder;
  const uint NbChallenges;
  const UnnamedEnum Network_GameMode;
  UnnamedEnum HotSeat_GameMode;
  const uint HotSeat_TimeLimit;
  const uint HotSeat_Rounds;
  const MwFastBuffer<CGameCtnChallenge*> ChallengeInfos;
};

struct CTrackManiaRaceMultiLocal : public CTrackManiaRace1P {
  CTrackManiaRaceMultiLocal();

  const MwFastBuffer<CTrackManiaPlayerInfo*> MultiLocalPlayerInfos;
  const float PlayerTimeLeft1; // Range: 0 - 1
  const float PlayerTimeLeft2; // Range: 0 - 1
  const float PlayerTimeLeft3; // Range: 0 - 1
  const float PlayerTimeLeft4; // Range: 0 - 1
  const float PlayerTimeLeft5; // Range: 0 - 1
  const float PlayerTimeLeft6; // Range: 0 - 1
  const float PlayerTimeLeft7; // Range: 0 - 1
  const float PlayerTimeLeft8; // Range: 0 - 1
  const wstring PlayerName1;
  const wstring PlayerName2;
  const wstring PlayerName3;
  const wstring PlayerName4;
  const wstring PlayerName5;
  const wstring PlayerName6;
  const wstring PlayerName7;
  const wstring PlayerName8;
  const string PlayerBestScore1;
  const string PlayerBestScore2;
  const string PlayerBestScore3;
  const string PlayerBestScore4;
  const string PlayerBestScore5;
  const string PlayerBestScore6;
  const string PlayerBestScore7;
  const string PlayerBestScore8;
  const uint PlayerGeneralPosition;
};

struct CTrackManiaRaceNet : public CTrackManiaRace {
  MwFastBuffer<CTrackManiaScore*> GeneralScores;
  MwFastBuffer<CTrackManiaScore*> CurrentScores;
  MwFastBuffer<CTrackManiaScore*> TeamScores;
  bool ReadyToGoNext;
};

struct CTrackManiaRaceNetTimeAttack : public CTrackManiaRaceNet {
  CTrackManiaRaceNetTimeAttack();

  const uint Bidon;
};

struct CTmRaceRulesEvent : public CMwNod {
  enum class CTmRaceRulesEvent::EType {
    Unknown = 0,
    StartLine = 1,
    WayPoint = 2,
    GiveUp = 3,
    Respawn = 4,
    Stunt = 5,
    OnPlayerAdded = 6,
    OnPlayerRemoved = 7,
    OnCommand = 8,
  };
  enum class CTmRaceRulesEvent::EStuntFigure {
    None = 0,
    StraightJump = 1,
    Flip = 2,
    BackFlip = 3,
    Spin = 4,
    Aerial = 5,
    AlleyOop = 6,
    Roll = 7,
    Corkscrew = 8,
    SpinOff = 9,
    Rodeo = 10,
    FlipFlap = 11,
    Twister = 12,
    FreeStyle = 13,
    SpinningMix = 14,
    FlippingChaos = 15,
    RollingMadness = 16,
    WreckNone = 17,
    WreckStraightJump = 18,
    WreckFlip = 19,
    WreckBackFlip = 20,
    WreckSpin = 21,
    WreckAerial = 22,
    WreckAlleyOop = 23,
    WreckRoll = 24,
    WreckCorkscrew = 25,
    WreckSpinOff = 26,
    WreckRodeo = 27,
    WreckFlipFlap = 28,
    WreckTwister = 29,
    WreckFreeStyle = 30,
    WreckSpinningMix = 31,
    WreckFlippingChaos = 32,
    WreckRollingMadness = 33,
    TimePenalty = 34,
    RespawnPenalty = 35,
    Grind = 36,
    Reset = 37,
  };
  const CTmRaceRulesEvent::EType Type; // Maniascript
  CTmRaceRulesPlayer* const Player; // Maniascript
  uint RaceTime; // Maniascript
  const uint CheckpointInRace; // Maniascript
  const uint CheckpointInLap; // Maniascript
  const bool IsEndLap; // Maniascript
  const bool IsEndRace; // Maniascript
  uint LapTime; // Maniascript
  int StuntsScore; // Maniascript
  uint NbRespawns; // Maniascript
  const MwId BlockId; // Maniascript
  float Speed; // Maniascript
  float Distance; // Maniascript
  float Damages; // Maniascript
  const CTmRaceRulesEvent::EStuntFigure StuntFigure; // Maniascript
  const uint Angle; // Maniascript
  const uint Points; // Maniascript
  const uint Combo; // Maniascript
  const bool IsStraight; // Maniascript
  const bool IsReverse; // Maniascript
  const bool IsMasterJump; // Maniascript
  const float Factor; // Maniascript
  CGamePlayerInfo* const User; // Maniascript
  const bool PlayerWasSpawned; // Maniascript
  const bool PlayerWasInLadderMatch; // Maniascript
  const string CommandName; // Maniascript
  const bool CommandValueBoolean; // Maniascript
  const int CommandValueInteger; // Maniascript
  const float CommandValueReal; // Maniascript
  const wstring CommandValueText; // Maniascript
};

struct CTrackManiaRaceNetLaps : public CTrackManiaRaceNet {
  CTrackManiaRaceNetLaps();

  void ComputeScores();
};

// Description: "Trackmania race API for Manialink scripts"
struct CTmRaceInterfaceManialinkScripHandler : public CGameScriptHandlerPlaygroundInterface {
  CTrackManiaPlayer* const InputPlayer; // Maniascript
  CTrackManiaPlayer* const GUIPlayer; // Maniascript
  const MwFastBuffer<CTmRaceClientEvent*> RaceEvents; // Maniascript
  const uint NbLaps; // Maniascript
  const bool IndependantLaps; // Maniascript
  const MwFastBuffer<CTrackManiaPlayer*> Players; // Maniascript
  const MwFastBuffer<CTmRaceRulesScore*> Scores; // Maniascript
  const MwFastBuffer<int> ClanScores; // Maniascript
  const uint SplitScreenNum; // Maniascript
  const uint SplitScreenCount; // Maniascript
  uint CurPlayerCamera; // Maniascript
  const vec3 MapStartLinePos; // Maniascript
  const MwFastBuffer<vec3> MapCheckpointPos; // Maniascript
  const MwFastBuffer<vec3> MapFinishLinePos; // Maniascript
  const bool MapIsLapRace; // Maniascript
  const uint MapNbLaps; // Maniascript
};

// File extension: '.Frame.Gbx'
struct CTrackManiaControlCheckPointList : public CControlFrame {
  CTrackManiaControlCheckPointList();

  CControlStyle* StyleName;
  CControlStyle* StyleRank;
  CControlStyle* StyleTime;
  CControlFrame* CardModel;
};

struct CTrackManiaRace1PGhosts : public CTrackManiaRace1P {
  CTrackManiaRace1PGhosts();

  MwFastArray<CGameCtnGhost*> MedalGhosts;
  const MwFastBuffer<CGameCtnGhostInfo*> ChallengeGhostInfos;
};

struct CTrackManiaReplayRecord_deprecated : public CGameCtnReplayRecord {
  CTrackManiaReplayRecord_deprecated();

};

struct CCtnMediaBlockEventTrackMania_deprecated : public CGameCtnMediaBlockEvent_deprecated {
  CCtnMediaBlockEventTrackMania_deprecated();

};

// File extension: 'CtrlCamTmRace.gbx'
struct CGameControlCameraTrackManiaRace : public CGameControlCamera {
  CGameControlCameraTrackManiaRace();

  float LookAtFactor;
  float ConeAperture;
  float CarCameraHeight;
  float CarCameraDistance;
  float CarCameraTargetDistance;
  float CarCameraAlign;
  float ConeMinSpeed;
  float ConeMaxSpeed;
  bool UseSpeedDir;
  bool IsSegmentCast;
  float SegmentCastMinDist;
  float SegmentCastLength;
};

// File extension: 'Frame.Gbx'
struct CTrackManiaControlPlayerInfoCard : public CTrackManiaControlCard {
  CTrackManiaControlPlayerInfoCard();

  bool ShowBasedTimeInfosInRounds;
  CPlugBitmap* Avatar;
  const bool ReadyToGoNext;
  const wstring StrPlayerName;
  const wstring StrCountryName;
  const string StrLadderTeamName;
  const uint StrLadderRankingSimple;
  const float StrLadderScore;
  const string StrLadderRaceScore;
  const string StrCurrentRaceRank;
  const uint SpectatorMode;
  const uint NbSpectators;
  const string StrTotalRoundScore;
  const string StrLastRaceRoundScore;
  const string StrBestTimeOrScore;
  const string StrPlayerRaceBestTimeOrScoreDelay;
  const string StrPlayerBestRaceTime;
  const string StrPlayerBestRaceScore;
  const string StrRaceBestTime;
  const string StrPrevRaceTimeOrScore;
  const string StrOffsetFromBestAtCurrentCP_MmSsCc;
  const string StrRaceBestScore;
  const string StrScoreOffsetFromBestAtCurrentCP;
  CTrackManiaRace* Race;
  bool IsStuntsMode;
  bool IsRoundsMode;
};

// File extension: 'Frame.Gbx'
struct CTrackManiaControlCard : public CGameControlCard {
  CTrackManiaControlCard();

};

// File extension: 'Frame.Gbx'
struct CControlTrackManiaTeamCard : public CTrackManiaControlCard {
  CControlTrackManiaTeamCard();

  uint TeamNum;
  const wstring StrTeamName;
  const string StrTeamScore;
};

struct CCtnMediaBlockUiTMSimpleEvtsDisplay_deprecated : public CGameCtnMediaBlockUiSimpleEvtsDisplay_deprecated {
  CCtnMediaBlockUiTMSimpleEvtsDisplay_deprecated();

};

struct CTrackManiaMatchSettingsControlGrid : public CControlGrid {
  CTrackManiaMatchSettingsControlGrid();

  CTrackManiaMatchSettings* PlayList;
  CControlLabel* PlayListNameLabel;
  CControlLabel* PlayListCommentLabel;
  CGameControlCardCtnChallengeInfo* ChallengeCardTemplate;
  uint MaxChallengeInfosPerColumn;
  uint MaxChallengeInfosPerRow;
  const uint CurrentPage;
  const uint NbPage;
  CControlButton* ButtonNextPage;
  CControlButton* ButtonPreviousPage;
  void OnNextPage();
  void OnPreviousPage();
};

struct CTrackManiaScore : public CTmRaceRulesScore {
  uint Score;
  int LastRaceDeltaPoints;
  uint LastRaceTime;
  uint BestTime;
  uint BestStuntsScore;
  uint LapsNbCheckpoint;
  uint RaceInputsDuration;
  uint RaceSimDataSimulationSeed;
  uint BestRaceInputsTimeStartInReplay;
  const string StrRaceBestTime;
  const string StrPrevRaceTime;
  const string StrPrevRaceDeltaPoints;
  const string StrBestStuntsScore;
};

// File extension: 'Frame.Gbx'
struct CTrackManiaControlRaceScoreCard : public CTrackManiaControlCard {
  CTrackManiaControlRaceScoreCard();

  const wstring StrName;
  const string StrLogin;
  const string StrRank;
  const string StrScore;
  const string StrCheckpoint;
  const string StrLadderScore;
  const wstring LadderRank;
  const string StrLastRaceTime;
  const string StrBestTime;
  const string StrPrevRaceDeltaPoints;
  const string StrBestStuntsScore;
};

// File extension: 'Frame.Gbx'
struct CTrackManiaControlMatchSettingsCard : public CTrackManiaControlCard {
  CTrackManiaControlMatchSettingsCard();

  const wstring StrName;
  const wstring StrComment;
  const uint ChallengesCount;
  const uint Medals;
  const wstring StrTracks;
  CPlugBitmap* BmpBannerGrey;
  CPlugBitmap* BmpBanner;
};

struct CTrackManiaRaceInterface : public CGamePlaygroundInterface {
  CTrackManiaRaceInterface();

  CTrackManiaRace* const Race;
  CTrackManiaNetwork* const Network;
  float DownloadProgressMapsTotal;
  float DownloadProgressMapsCur;
  float DownloadProgressAvatarsTotal;
  float DownloadProgressAvatarsCur;
  float DownloadProgressChallengeTotal;
  float DownloadProgressChallengeCur;
  float DownloadProgressPlayersTotal;
  float DownloadProgressPlayersCur;
  float DownloadProgressActivity;
  const uint WarmUpRoundCur;
  const uint WarmUpRoundCount;
  const uint TimeCountDown;
  const uint PlayerGeneralPosition;
  const uint NbPlayers;
  CTrackManiaPlayerInfo* const UiPlayerInfo0;
  CTrackManiaPlayer* const UiPlayer0;
  const uint CurLapNum0;
  const uint RaceChrono0;
  const uint CarSpeedDisplay0;
  const uint CarDistanceDisplay0;
  const string CheckPointInfo_TimeText0;
  const string CheckPointInfo_OffsetTimeText0;
  const wstring CheckPointInfo_CurrentRacePositionText0;
  CTrackManiaPlayerInfo* const UiPlayerInfo1;
  CTrackManiaPlayer* const UiPlayer1;
  const uint CurLapNum1;
  const uint RaceChrono1;
  const uint CarSpeedDisplay1;
  const uint CarDistanceDisplay1;
  const string CheckPointInfo_TimeText1;
  const string CheckPointInfo_OffsetTimeText1;
  const wstring CheckPointInfo_CurrentRacePositionText1;
  CTrackManiaPlayerInfo* const UiPlayerInfo2;
  CTrackManiaPlayer* const UiPlayer2;
  const uint CurLapNum2;
  const uint RaceChrono2;
  const uint CarSpeedDisplay2;
  const uint CarDistanceDisplay2;
  const string CheckPointInfo_TimeText2;
  const string CheckPointInfo_OffsetTimeText2;
  const wstring CheckPointInfo_CurrentRacePositionText2;
  CTrackManiaPlayerInfo* const UiPlayerInfo3;
  CTrackManiaPlayer* const UiPlayer3;
  const uint CurLapNum3;
  const uint RaceChrono3;
  const uint CarSpeedDisplay3;
  const uint CarDistanceDisplay3;
  const string CheckPointInfo_TimeText3;
  const string CheckPointInfo_OffsetTimeText3;
  const wstring CheckPointInfo_CurrentRacePositionText3;
};

struct CTrackManiaRaceAnalyzer : public CGameAnalyzer {
  CMwStatsValue* const InputValue1;
  CMwStatsValue* const InputValue2;
  const uint InputDeltaT1;
  const uint InputDeltaT2;
  const uint InputDeltaT3;
};

struct CTmEditorPluginMapType : public CGameCtnEditorPluginMapType {
  CTrackManiaRaceRules* const Mode; // Maniascript
  void TMObjective_SetFromBestRace(CTmRaceRulesScore* Score); // Maniascript
  const MwFastBuffer<CTmRaceRulesPlayer*> AllPlayers; // Maniascript
  const MwFastBuffer<CTmRaceRulesPlayer*> Players; // Maniascript
};

struct CTrackManiaChallengeScript : public CGameCtnChallengeScript {
  CTrackManiaPlayer* const Player; // Maniascript
};

struct CTmRaceClientEvent : public CMwNod {
  enum class CTmRaceClientEvent::EType {
    Unknown = 0,
    WayPoint = 1,
    Respawn = 2,
    Turbo = 3,
    Horn = 4,
    Impact = 5,
    WaterSplash = 6,
    GlassSmash = 7,
    PartDetached = 8,
    StopEngine = 9,
    StartEngine = 10,
    AirSpawnRelease = 11,
  };
  const CTmRaceClientEvent::EType Type; // Maniascript
  CTrackManiaPlayer* const Player; // Maniascript
  const uint CheckpointInRace; // Maniascript
  const uint CheckpointInLap; // Maniascript
  const bool IsEndRace; // Maniascript
  const bool IsEndLap; // Maniascript
  const uint RaceTime; // Maniascript
  const uint LapTime; // Maniascript
  const int StuntsScore; // Maniascript
  const uint NbRespawns; // Maniascript
};

struct CGamePlayerProfileChunk_TrackManiaSettings : public CGamePlayerProfileChunk {
  CGamePlayerProfileChunk_TrackManiaSettings();

  uint RespawnCount;
  uint RestartCount;
  bool IsShowPlayerGhost;
  bool NadeoGhostsUnlockMessage;
  MwFastBuffer<bool> IsDisplayRaceHelp;
  MwFastArray<bool> RacePlayerInfoIsShow;
};

// File extension: 'TrackManiaResource.Gbx'
struct CTrackManiaResource : public CMwNod {
  CTrackManiaResource();

  CPlugBitmap* Badge_OcclusionMap;
  CPlugBitmap* Badge_OverLayer_DiffuseOpacity;
  CPlugBitmap* Badge_OverLayer_Gloss;
  CPlugBitmap* Badge_StickersMask;
  CPlugSolid2Model* Badge_Mesh;
  CPlugBitmap* Badge_Mesh_MaterialToReplaceBitmap;
  CPlugBitmap* Badge_Mesh_MaterialToReplaceImage;
  CScene3d* Badge_AvatarRenderScene;
  CScene3d* Badge_BadgeRenderScene;
  CGameBadgeStickerSlots* Badge_StickerSlots;
  CFuncKeysReal* BadgeEditor_FuncBloomIntensAtHdrNorm;
  CFuncKeysReal* BadgeEditor_FuncAvgLumiToKeyValue;
  CControlFrame* CardPlayerScore_Small;
  CControlFrame* CardPlayerScore_Small_Rev;
  CControlFrame* CardPlayerScore_Medium;
  CControlFrame* CardPlayerScore_Medium_Rev;
  CControlFrame* CardPlayerScore_Big;
  CControlFrame* CardPlayerScore_Big_Rev;
};

struct CTmModuleManager : public CGamePlaygroundModuleManagerClient {
};

struct CTmModuleScoresTable : public CGamePlaygroundModuleClientScoresTable {
};

} // namespace TrackMania

namespace ShootMania {

// File extension: 'TitleCore.Gbx'
struct CShootMania : public CGameManiaTitleCore {
  CShootMania();

  CScene2d* ArenaInterfaceUIFid;
  CSmArenaResource* ArenaResourcesFid;
  CGamePlaygroundResources* const ArenaWorld;
  CSmServer* const Server;
  CSmClient* const Client;
  CSmAnticheatFunctions* const Anticheat;
};

// Description: "Ingame Manialink API for ShootMania."
struct CSmArenaInterfaceManialinkScripHandler : public CGameScriptHandlerPlaygroundInterface {
  const int ArenaNow; // Maniascript
  CSmPlayer* const InputPlayer; // Maniascript
  CSmPlayer* const GUIPlayer; // Maniascript
  const MwFastBuffer<CSmPlayer*> Players; // Maniascript
  const MwFastBuffer<CSmArenaScore*> Scores; // Maniascript
  const MwFastBuffer<int> ClanScores; // Maniascript
  const MwFastBuffer<CSmScriptBase*> Bases; // Maniascript
  const MwFastBuffer<CSmScriptBlock*> Blocks; // Maniascript
  const MwFastBuffer<CSmScriptBlockSpawn*> BlockSpawns; // Maniascript
  const MwFastBuffer<CSmScriptBlockPole*> BlockPoles; // Maniascript
  const MwFastBuffer<CSmScriptBotPath*> BotPaths; // Maniascript
  const MwFastBuffer<CSmScriptObjectAnchor*> ObjectAnchors; // Maniascript
  bool HideResumePlayingButton; // Maniascript
  const MwFastBuffer<CSmScriptMapBase*> MapBases; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_PlayerSpawn; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_Gauge; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_Sector; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_BotPath; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_BotSpawn; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_ObjectAnchor; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_Gate; // Maniascript
};

struct CSmArenaClient : public CGamePlaygroundCommon {
  CGameCtnChallenge* const Map;
  CSmArena* const Arena;
  CSmArenaInterface* const ArenaInterface;
  float PredictionSmoothConvergenceSpeed;
  CFuncKeysReal* PredictionSmoothFromExtrapolationDuration;
  uint PredictionSimDurationMax;
  float LocalSmoothMin;
  uint LocalSmoothMinInputLag;
  float LocalSmoothMax;
  uint LocalSmoothMaxInputLag;
  float LocalSmoothConvergenceSpeed;
  float LocalSmoothCoefConvergenceSpeed;
  uint LocalSmoothCoefConvergenceDelay;
  const float LocalSmooth;
  const float LocalSmoothCoef;
  float PredictionSmooth;
  uint DbgDelaySendInputs;
  uint GameEditionAmmoGain;
};

// Description: "Scoring info for ShootMania players."
struct CSmArenaScore : public CGamePlaygroundScore {
  const uint TeamNum; // Maniascript
  uint Points; // Maniascript
  uint RoundPoints; // Maniascript
  const uint NbEliminationsInflicted; // Maniascript
  const uint NbEliminationsTaken; // Maniascript
  const uint NbRespawnsRequested; // Maniascript
  const uint DamageInflicted; // Maniascript
  const uint DamageTaken; // Maniascript
  void Reset(); // Maniascript
  void Clear(); // Maniascript
  uint NbEliminationsInflicted_Ed;
  uint NbEliminationsTaken_Ed;
  uint NbRespawnsRequested_Ed;
  uint DamageInflicted_Ed;
  uint DamageTaken_Ed;
};

struct CSmActionInstance : public CMwNod {
  CGameActionModel* const Model;
  const uint Now; // Maniascript
  const uint Variant; // Maniascript
  MwFastBuffer<CSmPlayer*> Players; // Maniascript
  CSmPlayer* Owner; // Maniascript
  const bool IsActive; // Maniascript
  const bool IsBound; // Maniascript
  uint Energy; // Maniascript
  uint EnergyMax; // Maniascript
  uint EnergyCost; // Maniascript
  bool EnergyReload; // Maniascript
  const MwFastBuffer<CSmActionInstanceEvent*> PendingEvents; // Maniascript
  void SendRulesEvent1(wstring Param1, MwFastBuffer<wstring>& Param2, CSmPlayer* Shooter, CSmPlayer* Victim); // Maniascript
  void SendRulesEvent2(wstring Param1, MwFastBuffer<wstring>& Param2, CSmPlayer* Shooter, CSmPlayer* Victim, CSmObject* Object); // Maniascript
  MwId GetAnimModelId(wstring ModelName); // Maniascript
  void PlayAnimOnPlayer(MwId AnimModelId, CSmPlayer* Player); // Maniascript
  void PlayAnimAtPosition(MwId AnimModelId, vec3 Position, vec3 Direction); // Maniascript
  MwId GetProjectileModelId(wstring ModelName); // Maniascript
  void CreateProjectile1(CSmPlayer* PlayerToIgnore, MwId ProjectileModelId, vec3 InitialPosition, vec3 InitialDirection, vec3 InitialVelocity); // Maniascript
  void CreateProjectile2(CSmPlayer* PlayerToIgnore, MwId ProjectileModelId, vec3 InitialPosition, vec3 InitialDirection, vec3 InitialVelocity, uint ContextId); // Maniascript
  void CreateShoot1(CSmPlayer* Shooter, MwId ProjectileModelId); // Maniascript
  void CreateShoot2(CSmPlayer* Shooter, MwId ProjectileModelId, uint ContextId); // Maniascript
  uint Cooldown; // Maniascript
  bool Cooldown_IsReady(uint Now); // Maniascript
  void Cooldown_Start(); // Maniascript
  bool IsJumping; // Maniascript
  bool IsGliding; // Maniascript
  bool IsAttractor; // Maniascript
  bool IsFlying; // Maniascript
  bool IsSliding; // Maniascript
  bool IsRunning; // Maniascript
  bool IsFrozen; // Maniascript
  bool IsSneaking; // Maniascript
  bool IsFreeLooking; // Maniascript
  bool HasNoPlayerCollision; // Maniascript
};

struct CSmNetForm : public CGameNetForm {
  CSmNetForm();

};

// Description: "A Shootmania player."
struct CSmPlayer : public CGamePlayer {
  enum class CSmPlayer::ESpawnStatus {
    NotSpawned = 0,
    Spawning = 1,
    Spawned = 2,
  };
  uint EdClan;
  bool Speaking;
  float LinearHue; // Range: 0 - 1
  const vec3 LinearHueSrgb;
  const int SpawnIndex;
  const uint AFKLatestChangeTime;
  CSmArenaScore* const Score; // Maniascript
  const CSmPlayer::ESpawnStatus SpawnStatus; // Maniascript
  const int StartTime; // Maniascript
  int EndTime; // Maniascript
  float AmmoGain; // Range: 0 - 10 // Maniascript
  float AmmoPower; // Range: 0.1 - 10 // Maniascript
  const bool AutoSwitchWeapon; // Maniascript
  const uint CurWeapon; // Maniascript
  const uint CurAmmo; // Maniascript
  const uint CurAmmoMax; // Maniascript
  const uint CurAmmoUnit; // Maniascript
  uint Armor; // Maniascript
  uint ArmorMax; // Maniascript
  uint ArmorGain; // Maniascript
  uint ArmorReplenishGain; // Maniascript
  float ArmorPower; // Range: 0.1 - 10 // Maniascript
  uint Stamina; // Maniascript
  float StaminaMax; // Range: 0.1 - 3 // Maniascript
  float StaminaGain; // Range: 0 - 1 // Maniascript
  float StaminaPower; // Range: 0.1 - 1 // Maniascript
  float SpeedPower; // Range: 0.1 - 1 // Maniascript
  float JumpPower; // Range: 0.1 - 1 // Maniascript
  bool AllowWallJump; // Maniascript
  bool AllowProgressiveJump; // Maniascript
  bool UseAlternateWeaponVisual; // Maniascript
  bool IsHighlighted; // Maniascript
  float EnergyLevel; // Range: 0 - 1 // Maniascript
  vec3 ForceColor; // Maniascript
  const float GetLinearHue; // Range: 0 - 1 // Maniascript
  float ForceLinearHue; // Maniascript
  MwId ForceModelId; // Maniascript
  bool HasShield; // Maniascript
  float ThrowSpeed; // Range: 0 - 500 // Maniascript
  const int CurrentClan; // Maniascript
  const uint IdleDuration; // Maniascript
  const vec3 Position; // Maniascript
  const float AimYaw; // Maniascript
  const float AimPitch; // Maniascript
  const vec3 AimDirection; // Maniascript
  const bool IsUnderground; // Maniascript
  const bool IsTouchingGround; // Maniascript
  const bool IsInAir; // Maniascript
  const bool IsOnTechGround; // Maniascript
  const bool IsOnTechLaser; // Maniascript
  const bool IsOnTechArrow; // Maniascript
  const bool IsOnTechArmor; // Maniascript
  const bool IsOnTechSafeZone; // Maniascript
  const bool IsOnTech; // Maniascript
  const bool IsOnTechNoWeapon; // Maniascript
  const bool IsInWater; // Maniascript
  const vec3 Velocity; // Maniascript
  const float Speed; // Maniascript
  const bool IsInOffZone; // Maniascript
  const bool IsCapturing; // Maniascript
  CSmScriptBlockPole* const BlockPole; // Maniascript
  CSmScriptMapLandmark* const CapturedLandmark; // Maniascript
  const MwFastBuffer<CSmObject*> Objects; // Maniascript
  const bool IsFakePlayer; // Maniascript
  const bool IsBot; // Maniascript
  CSmPlayerDriver* const Driver; // Maniascript
};

struct CSmArenaInterfaceUI : public CGamePlaygroundInterface {
  CSmArenaInterfaceUI();

};

struct CSmPlayerDriver : public CMwNod {
  enum class CSmPlayerDriver::ESmDriverBehaviour {
    Static = 0,
    Turret = 1,
    Scripted = 2,
    IA = 3,
    Patrol = 4,
    Escape = 5,
    Saunter = 6,
  };
  enum class CSmPlayerDriver::ESmDriverPatrolMode {
    OneTrip = 0,
    BackAndForth = 1,
    Loop = 2,
  };
  enum class CSmPlayerDriver::ESmAttackFilter {
    All = 0,
    AllPlayers = 1,
    AllBots = 2,
    AllOpposite = 3,
    OppositePlayers = 4,
    OppositeBots = 5,
    Nobody = 6,
  };
  CSmPlayerDriver::ESmDriverBehaviour Behaviour; // Maniascript
  float AggroRadius; // Maniascript
  float ShootRadius; // Maniascript
  float TargetMinDistance; // Maniascript
  float DisengageDistance; // Maniascript
  float PathSpeedCoef; // Maniascript
  float Accuracy; // Maniascript
  int ReactionTime; // Maniascript
  int ShootPeriodMin; // Maniascript
  int ShootPeriodMax; // Maniascript
  bool RocketAnticipation; // Maniascript
  float Fov; // Maniascript
  CSmPlayerDriver::ESmAttackFilter AttackFilter; // Maniascript
  CSmPlayer* const Target; // Maniascript
  const bool IsStuck; // Maniascript
  bool IsFlying; // Maniascript
  CSmPlayer* const Owner; // Maniascript
  int PathOffset; // Maniascript
  float Agressivity; // Maniascript
  bool UseOldShootingSystem; // Maniascript
  CSmPlayerDriver::ESmDriverPatrolMode Patrol_Mode; // Maniascript
  void Patrol_Restart();
  vec3 Escape_AnchorPoint; // Maniascript
  float Escape_DistanceSafe; // Maniascript
  float Escape_DistanceMinEscape; // Maniascript
  float Escape_DistanceMaxEscape; // Maniascript
  vec3 Saunter_AnchorPoint; // Maniascript
  int Saunter_BaseChillingTime; // Maniascript
  int Saunter_ChillingTimeDelta; // Maniascript
  float Saunter_Radius; // Maniascript
  bool Scripted_ForceAimInMoveDir; // Maniascript
  CSmPlayer* ForcedTarget; // Maniascript
  MwFastBuffer<CSmPlayer*> TargetsToAvoid; // Maniascript
};

struct CSmActionInstanceEvent : public CMwNod {
  enum class CSmActionInstanceEvent::EType {
    OnHitPlayer = 0,
    OnProjectileStart = 1,
    OnProjectileEnd = 2,
    OnActiveChange = 3,
    OnHitObject = 4,
  };
  const CSmActionInstanceEvent::EType Type; // Maniascript
  CSmPlayer* const Player; // Maniascript
  CSmObject* const Object; // Maniascript
  const uint Damage; // Maniascript
  const MwId ProjectileModelId; // Maniascript
  const uint ContextId; // Maniascript
  const vec3 Position; // Maniascript
  const vec3 Direction; // Maniascript
  const vec3 Normal; // Maniascript
};

struct CSmArenaRules : public CMwNod {
  enum class CSmArenaRules::EGameplay {
    Default = 0,
    Mp3Beta0 = 1,
  };
  const MwFastBuffer<CSmArenaScore*> Scores;
  CSmArenaRulesMode* RulesMode;
  uint RulesStateStartTime;
  uint RulesStateEndTime;
  bool RulesStateFreeze;
  uint RulesStateTeam1Score;
  uint RulesStateTeam2Score;
  bool FeatureArmorBar;
  bool FeatureUseClans;
  bool FeatureForcedClans;
  bool FeatureStamina;
  bool FeatureRun;
  bool FeatureWallJump;
  bool FeatureSameWallJump;
  bool FeatureRocketJump;
  bool FeatureDisableHorns;
  bool FeatureFallDamage;
  bool FeatureGuns;
  bool FeaturePvPCollisions;
  bool FeaturePvPWeapons;
  bool FeatureProtectClanmates;
  bool FeatureLaserVsBullets;
  bool FeatureLaserSkewering;
  bool FeaturePlayerTagging;
  bool FeatureBeaconsWithRecipients;
  bool FeatureInteractiveScreensIn3d;
  bool FeatureGunSpecial;
  bool FeatureAmmoBonusOnHit;
  bool FeatureAllies;
  CSmArenaRules::EGameplay Gameplay;
};

struct CSmScriptObjectAnchor : public CSmScriptLandmark {
  const wstring ItemName; // Maniascript
  const MwId ItemModelId; // Maniascript
};

struct CSmScriptBotPath : public CSmScriptLandmark {
  const uint Clan; // Maniascript
  const MwFastBuffer<vec3> Path; // Maniascript
  const bool IsFlying; // Maniascript
};

struct CSmChallengeParameters : public CGameCtnChallengeParameters {
  CSmChallengeParameters();

  void SetDefaults();
};

struct CSmScriptBotSpawn : public CSmScriptLandmark {
  const wstring ItemName; // Maniascript
  const MwId ItemModelId; // Maniascript
};

// Description: "An instance of an object."
struct CSmObject : public CMwNod {
  enum class CSmObject::EStatus {
    OnPlayer = 0,
    OnAnchor = 1,
    InWorld = 2,
    Unspawned = 3,
  };
  const CSmObject::EStatus Status; // Maniascript
  const MwId ModelId; // Maniascript
  void SetAnchor(CSmScriptMapObjectAnchor* ObjectAnchor); // Maniascript
  void SetAnchor_Deprecated(CSmScriptObjectAnchor* ObjectAnchor); // Maniascript
  void SetPlayer(CSmPlayer* Player); // Maniascript
  void SetPosition(vec3 Position); // Maniascript
  void SetPositionAndVel(vec3 Position, vec3 Vel); // Maniascript
  void SetUnspawned(); // Maniascript
  CSmPlayer* const Player; // Maniascript
  CSmScriptMapLandmark* const AnchorLandmark; // Maniascript
  const vec3 Position; // Maniascript
  const vec3 Vel; // Maniascript
  uint MachineState; // Maniascript
  bool Throwable; // Maniascript
};

struct CSmAnalyzer : public CGameAnalyzer {
  const float LocalEntitySmoothCoef;
};

struct CSmArenaPhysics : public CMwNod {
  CScenePhy* const ScenePhy;
};

struct CSmArenaInterface : public CMwNod {
  CSmPlayer* const GUIPlayer;
  CSmArenaInterfaceUI* const InterfaceUI;
  bool Mouse_SensitivitiesUser_EnableSpecific;
  float Mouse_SensitivitiesUser_Default; // Range: 0.1 - 10
  float Mouse_SensitivitiesUser_Laser; // Range: 0.1 - 10
  float Mouse_SensitivityCoefY;
  float Mouse_Accel;
  bool Mouse_InvertY;
  bool Mouse_AccelEnabled;
  bool Mouse_Filter;
  float Mouse_SensitivityCoefFreeLook;
  bool Speaking;
  bool SkippedInputs;
  uint FlipCheck_Duration;
  uint FlipCheck_PitchSumMin;
  float GhosClipPlayerOffset;
};

struct CSmClient : public CMwNod {
  CSmClient();

  CSmArenaClient* const ArenaClient;
  CSmArenaRules* const Rules;
};

struct CSmArenaServer : public CMwNod {
  CSmArena* const Arena;
  uint ClientInputsMaxLatency;
  uint DbgMinInputDelay;
  uint DbgDelaySendSnapshots;
  uint InputSnapshotYawPitchBits;
  bool FilterInputs;
};

struct CSmArena : public CMwNod {
  CSmArenaPhysics* const ArenaPhysics;
  const MwFastBuffer<CSmPlayer*> Players;
  const MwFastBuffer<CSmObject*> Objects;
  const MwFastBuffer<CSmActionInstance*> Actions;
  const MwFastBuffer<CSmScriptBase*> Bases;
  const MwFastBuffer<CSmScriptLandmark*> Landmark;
  const MwFastBuffer<CSmScriptBlockSpawn*> BlockSpawns;
  const MwFastBuffer<CSmScriptBlockPole*> BlockPoles;
  const MwFastBuffer<CSmScriptSector*> Sectors;
  const MwFastBuffer<CSmScriptGauge*> Gauges;
  const MwFastBuffer<CSmScriptBotPath*> BotPaths;
  const MwFastBuffer<CSmScriptObjectAnchor*> ObjectAnchors;
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks;
  const MwFastBuffer<CSmScriptMapBase*> MapBases;
  const MwFastBuffer<CSmScriptMapGate*> MapGates;
  const MwFastBuffer<CSmScriptMapGauge*> MapGauges;
  const MwFastBuffer<CSmScriptMapSector*> MapSectors;
  const MwFastBuffer<CSmScriptMapPlayerSpawn*> MapPlayerSpawns;
  const MwFastBuffer<CSmScriptMapBotPath*> MapBotPaths;
  const MwFastBuffer<CSmScriptMapBotSpawn*> MapBotSpawns;
  const MwFastBuffer<CSmScriptMapObjectAnchor*> MapObjectAnchors;
  void FakePlayers_AllStatic();
  void FakePlayers_AllPatrol();
  void FakePlayers_AllBackAndForth();
  void FakePlayers_AllOneTrip();
};

// Description: "Rules API for ShootMania gamemodes."
struct CSmArenaRulesMode : public CGamePlaygroundScript {
  enum class CSmArenaRulesMode::EWeapon {
    Laser = 0,
    Rocket = 1,
    Nucleus = 2,
    Arrow = 3,
  };
  enum class CSmArenaRulesMode::EActionSlot {
    Slot_A = 0,
    Slot_B = 1,
    Slot_C = 2,
    Slot_D = 3,
    Slot_E = 4,
    Slot_F = 5,
    Slot_G = 6,
    Slot_H = 7,
  };
  enum class CSmArenaRulesMode::EActionInput {
    Weapon = 0,
    Movement = 1,
    Activable1 = 2,
    Activable2 = 3,
    Activable3 = 4,
    Activable4 = 5,
    Consumable1 = 6,
    Consumable2 = 7,
    None = 8,
  };
  enum class CSmArenaRulesMode::EGameplay {
    Default = 0,
    Mp3Beta0 = 1,
  };
  uint StartTime; // Maniascript
  uint EndTime; // Maniascript
  uint SpawnInvulnerabilityDuration; // Maniascript
  bool UseClans; // Maniascript
  bool UseForcedClans; // Maniascript
  bool UsePvPCollisions; // Maniascript
  bool UsePvPWeapons; // Maniascript
  bool UseInterractiveScreensIn3d; // Maniascript
  bool UseLaserVsBullets; // Maniascript
  bool UseLaserSkewering; // Maniascript
  bool UsePlayerTagging; // Maniascript
  bool UseBeaconsWithRecipients; // Maniascript
  bool UseAmmoBonusOnHit; // Maniascript
  bool UseSameWallJump; // Maniascript
  bool UseDefaultActionEvents; // Maniascript
  bool UseAllies; // Maniascript
  bool UseAutoSpawnBots; // Maniascript
  bool UseAutoRespawnBots; // Maniascript
  bool WalkOnWall; // Maniascript
  bool UseAutoDiscardBotEvents; // Maniascript
  bool DbgEnableNavMesh; // Maniascript
  bool ForceNavMapsComputation; // Maniascript
  uint GameplayVersion; // Maniascript
  CSmArenaRulesMode::EGameplay Gameplay; // Maniascript
  bool UseProtectClanmates; // Maniascript
  float OffZoneRadius; // Maniascript
  float OffZoneRadiusSpeed; // Maniascript
  MwId OffZoneCenterBlockId; // Maniascript
  MwId OffZoneCenterLandmarkId; // Maniascript
  const uint PlayersNbTotal; // Maniascript
  const uint PlayersNbAlive; // Maniascript
  const uint PlayersNbDead; // Maniascript
  const uint ClansNbTotal; // Maniascript
  const uint ClansNbAlive; // Maniascript
  const uint ClansNbDead; // Maniascript
  const MwFastBuffer<uint> ClansNbPlayers; // Maniascript
  const MwFastBuffer<uint> ClansNbPlayersAlive; // Maniascript
  const MwFastBuffer<CSmPlayer*> Players; // Maniascript
  const MwFastBuffer<CSmPlayer*> BotPlayers; // Maniascript
  const MwFastBuffer<CSmPlayer*> Spectators; // Maniascript
  const MwFastBuffer<CSmPlayer*> AllPlayers; // Maniascript
  const MwFastBuffer<CSmArenaRulesEvent*> PendingEvents; // Maniascript
  const MwFastBuffer<CSmScriptBase*> Bases; // Maniascript
  const MwFastBuffer<CSmScriptBlock*> Blocks; // Maniascript
  const MwFastBuffer<CSmScriptBlockSpawn*> BlockSpawns; // Maniascript
  const MwFastBuffer<CSmScriptBlockPole*> BlockPoles; // Maniascript
  const MwFastBuffer<CSmScriptBotPath*> BotPaths; // Maniascript
  const MwFastBuffer<CSmScriptObjectAnchor*> ObjectAnchors; // Maniascript
  void SpawnPlayer_Deprecated(CSmPlayer* Player, int ClanNum, int Armor, CSmScriptBlockSpawn* PlayerSpawn, int ActivationDate); // Maniascript
  void SpawnBotPlayer_Deprecated(CSmPlayer* Player, int ClanNum, int Armor, CSmScriptLandmark* Landmark, int ActivationDate); // Maniascript
  CSmPlayer* CreateBotPlayer_Deprecated(MwId ModelId, int ClanNum, int Armor, CSmScriptLandmark* Landmark, int ActivationDate); // Maniascript
  const MwFastBuffer<CSmScriptMapBase*> MapBases; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_PlayerSpawn; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_Gauge; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_Sector; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_BotPath; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_BotSpawn; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_ObjectAnchor; // Maniascript
  const MwFastBuffer<CSmScriptMapLandmark*> MapLandmarks_Gate; // Maniascript
  const MwFastBuffer<CSmArenaScore*> Scores; // Maniascript
  uint Clan1Score; // Maniascript
  uint Clan2Score; // Maniascript
  MwFastArray<int> ClanScores; // Maniascript
  void PassOn(CSmArenaRulesEvent* Event); // Maniascript
  void Discard(CSmArenaRulesEvent* Event); // Maniascript
  void SpawnPlayer(CSmPlayer* Player, int ClanNum, int Armor, CSmScriptMapPlayerSpawn* PlayerSpawn, int ActivationDate); // Maniascript
  void SpawnBotPlayer_AtPlayerSpawn(CSmPlayer* Player, int ClanNum, int Armor, CSmScriptMapPlayerSpawn* PlayerSpawn, int ActivationDate); // Maniascript
  void SpawnBotPlayer_AtBotPath(CSmPlayer* Player, int ClanNum, int Armor, CSmScriptMapBotPath* BotPath, int ActivationDate); // Maniascript
  void SpawnBotPlayer_AtBotSpawn(CSmPlayer* Player, int ClanNum, int Armor, CSmScriptMapBotSpawn* BotSpawn, int ActivationDate); // Maniascript
  void SpawnBotPlayer_FromOwner(CSmPlayer* Player, CSmPlayer* Owner, int Armor, vec3 Offset, int ActivationDate); // Maniascript
  void UnspawnPlayer(CSmPlayer* Player); // Maniascript
  void ClearScores(); // Maniascript
  void SetPlayerClan(CSmPlayer* Player, int ClanNum); // Maniascript
  void SetPlayerWeapon(CSmPlayer* Player, CSmArenaRulesMode::EWeapon DefaultWeapon, bool AutoSwitchWeapon); // Maniascript
  void SetPlayerReloadAllWeapons(CSmPlayer* Player, bool ReloadAllWeapons); // Maniascript
  void SetPlayerAmmo(CSmPlayer* Player, CSmArenaRulesMode::EWeapon Weapon, int Count); // Maniascript
  int GetPlayerAmmo(CSmPlayer* Player, CSmArenaRulesMode::EWeapon Weapon); // Maniascript
  void AddPlayerAmmo(CSmPlayer* Player, CSmArenaRulesMode::EWeapon Weapon, float DeltaCount); // Maniascript
  void SetPlayerAmmoMax(CSmPlayer* Player, CSmArenaRulesMode::EWeapon Weapon, int Count); // Maniascript
  int GetPlayerAmmoMax(CSmPlayer* Player, CSmArenaRulesMode::EWeapon Weapon); // Maniascript
  void AddPlayerArmor(CSmPlayer* Victim, int DeltaArmor, CSmPlayer* Shooter, int ShooterPoints); // Maniascript
  void RemovePlayerArmor(CSmPlayer* Victim, int DeltaArmor, CSmPlayer* Shooter, int ShooterPoints); // Maniascript
  int GetWeaponIndex(CSmArenaRulesMode::EWeapon Weapon); // Maniascript
  int GetWeaponNum(CSmArenaRulesMode::EWeapon Weapon); // Maniascript
  bool CanRespawnPlayer(CSmPlayer* Player); // Maniascript
  void RespawnPlayer(CSmPlayer* Player); // Maniascript
  void RespawnPlayerAtCheckpoint(CSmPlayer* Player, CSmScriptMapLandmark* CheckpointLandmark); // Maniascript
  CSmPlayer* CreateBotPlayer(MwId ModelId, int TeamNum); // Maniascript
  void DestroyBotPlayer(CSmPlayer* BotPlayer); // Maniascript
  void DestroyAllBotPlayers(); // Maniascript
  void ScriptedBot_Move(CSmPlayer* BotPlayer, vec3 Goal); // Maniascript
  void ScriptedBot_MoveDelta(CSmPlayer* BotPlayer, vec3 Delta); // Maniascript
  void ScriptedBot_MoveAndAim(CSmPlayer* BotPlayer, vec3 Goal); // Maniascript
  void ScriptedBot_MoveDeltaAndAim(CSmPlayer* BotPlayer, vec3 Delta); // Maniascript
  void ScriptedBot_Aim(CSmPlayer* BotPlayer, vec3 Goal); // Maniascript
  void ScriptedBot_AimDelta(CSmPlayer* BotPlayer, float DeltaYaw, float DeltaPitch); // Maniascript
  void ScriptedBot_RequestAction(CSmPlayer* BotPlayer); // Maniascript
  void ScriptedBot_RequestGunTrigger(CSmPlayer* BotPlayer); // Maniascript
  void ActionLoad(CSmPlayer* Player, CSmArenaRulesMode::EActionSlot ActionSlot, MwId ModelId); // Maniascript
  void ActionBind(CSmPlayer* Player, CSmArenaRulesMode::EActionSlot ActionSlot, CSmArenaRulesMode::EActionInput ActionInput); // Maniascript
  void ActionSetVariant(CSmPlayer* Player, CSmArenaRulesMode::EActionSlot ActionSlot, uint ActionVariant); // Maniascript
  void LoadAction(CSmPlayer* Player, CSmArenaRulesMode::EActionSlot ActionSlot, MwId ModelId, uint ActionVariant); // Maniascript
  void BindAction(CSmPlayer* Player, CSmArenaRulesMode::EActionSlot ActionSlot, CSmArenaRulesMode::EActionInput ActionInput); // Maniascript
  void SetNbFakePlayers(int NbClan1, int NbClan2); // Maniascript
  const MwFastBuffer<CSmObject*> Objects; // Maniascript
  CSmObject* ObjectCreate(MwId ModelId); // Maniascript
  void ObjectDestroy(CSmObject* Object); // Maniascript
  void ObjectDestroyAll(); // Maniascript
  void Replay_SaveAttackScore(CSmPlayer* Player, int Score); // Maniascript
  void Replay_SaveDefenseScore(CSmPlayer* Player, int Score); // Maniascript
  void Replay_SaveTeamScore(uint Team, int Score); // Maniascript
  void Replay_SavePlayerOfInterest(CSmPlayer* Player); // Maniascript
  void Replay_SaveWinner(CSmPlayer* Player); // Maniascript
  void Replay_SaveInterface(); // Maniascript
};

struct CSmServer : public CMwNod {
  CSmServer();

  CSmArenaServer* const ArenaServer;
  CSmArenaRules* const Rules;
};

// Description: "Event recieved by ShootMania gamemodes."
struct CSmArenaRulesEvent : public CMwNod {
  enum class CSmArenaRulesEvent::EType {
    Unknown = 0,
    OnShoot = 1,
    OnHit = 2,
    OnNearMiss = 3,
    OnArmorEmpty = 4,
    OnCapture = 5,
    OnShotDeny = 6,
    OnFallDamage = 7,
    OnCommand = 8,
    OnPlayerAdded = 9,
    OnPlayerRemoved = 10,
    OnPlayerRequestRespawn = 11,
    OnActionCustomEvent = 12,
    OnActionEvent = 13,
    OnPlayerTouchesObject = 14,
    OnPlayerTriggersSector = 15,
    OnPlayerThrowsObject = 16,
    OnPlayerRequestActionChange = 17,
    OnModuleCustomEvent = 18,
    OnModuleShowRequest = 19,
    OnModuleHideRequest = 20,
    OnModuleStorePurchase = 21,
    OnModuleInventoryDrop = 22,
    OnModuleInventoryEquip = 23,
  };
  enum class CSmArenaRulesEvent::EActionSlot {
    Slot_A = 0,
    Slot_B = 1,
    Slot_C = 2,
    Slot_D = 3,
    Slot_E = 4,
    Slot_F = 5,
    Slot_G = 6,
    Slot_H = 7,
  };
  enum class CSmArenaRulesEvent::EActionInput {
    Weapon = 0,
    Movement = 1,
    Activable1 = 2,
    Activable2 = 3,
    Activable3 = 4,
    Activable4 = 5,
    Consumable1 = 6,
    Consumable2 = 7,
    None = 8,
  };
  enum class CSmArenaRulesEvent::EModuleType {
    Undefined = 0,
    Hud = 1,
    Inventory = 2,
    Minimap = 3,
    Store = 4,
    ScoresTable = 5,
    MenuBase = 6,
    MenuBrowser = 7,
  };
  enum class CSmArenaRulesEvent::EActionSlots {
    Weapon = 0,
    Movement = 1,
    Activable1 = 2,
    Activable2 = 3,
    Activable3 = 4,
    Activable4 = 5,
    None = 6,
  };
  const CSmArenaRulesEvent::EType Type; // Maniascript
  CSmPlayer* const Player; // Maniascript
  int Damage; // Maniascript
  CSmObject* const VictimObject; // Maniascript
  int ShooterPoints; // Maniascript
  CSmPlayer* const Shooter; // Maniascript
  CSmPlayer* const Victim; // Maniascript
  const float Height; // Maniascript
  const float MissDist; // Maniascript
  const uint WeaponNum; // Maniascript
  const bool ShooterUsedAction; // Maniascript
  const uint ShooterWeaponNum; // Maniascript
  const CSmArenaRulesEvent::EActionSlot ShooterActionSlot; // Maniascript
  const wstring ShooterActionId; // Maniascript
  const bool VictimUsedAction; // Maniascript
  const uint VictimWeaponNum; // Maniascript
  const CSmArenaRulesEvent::EActionSlot VictimActionSlot; // Maniascript
  const wstring VictimActionId; // Maniascript
  const CSmArenaRulesEvent::EActionSlots ActionSlot; // Maniascript
  const CSmArenaRulesEvent::EActionSlot Action_Slot; // Maniascript
  const CSmArenaRulesEvent::EActionInput ActionInput; // Maniascript
  const wstring ActionId; // Maniascript
  const wstring Param1; // Maniascript
  const MwFastBuffer<wstring> Param2; // Maniascript
  CSmObject* const Object; // Maniascript
  CSmScriptMapSector* const Sector; // Maniascript
  CSmScriptBlockPole* const BlockPole; // Maniascript
  CSmScriptMapLandmark* const Landmark; // Maniascript
  const MwId PlayerId; // Maniascript
  CGamePlayerInfo* const User; // Maniascript
  const bool PlayerWasSpawned; // Maniascript
  const bool PlayerWasInLadderMatch; // Maniascript
  const vec3 PlayerLastPosition; // Maniascript
  const vec3 PlayerLastAimDirection; // Maniascript
  const bool GiveUp; // Maniascript
  const string CommandName; // Maniascript
  const bool CommandValueBoolean; // Maniascript
  const int CommandValueInteger; // Maniascript
  const float CommandValueReal; // Maniascript
  const wstring CommandValueText; // Maniascript
  const int ActionChange; // Maniascript
  const wstring ItemUrl; // Maniascript
  const uint Quantity; // Maniascript
  const CSmArenaRulesEvent::EModuleType ModuleType; // Maniascript
};

struct CSmAnticheatFunctions : public CGameAnticheatFunctions {
  const MwFastBuffer<CSmAnticheatEvent*> PendingEvents;
  void PopEvent(CSmAnticheatEvent* Event);
  bool CheckOcclusionBetween(vec3 Source, vec3 Destination);
  CSmPlayer* GetPlayerUnderCrossHair(CSmPlayer* Player);
  void CreateFakePlayer();
  void SetFakePlayerAim(vec3 AimDirection);
  void SetFakePlayerPos(vec3 Position);
  void RemoveFakePlayer();
  const MwFastBuffer<CSmPlayer*> Players;
  CSmPlayer* const LocalPlayer;
  void GenerateUnreachablePosition(vec3 PlayerPosition, vec3 Position, bool Found);
};

struct CSmAnticheatEvent : public CMwNod {
  enum class CSmAnticheatEvent::EventType {
    OnPlayerShoot = 0,
    OnDamage = 1,
  };
  const CSmAnticheatEvent::EventType Type;
  const uint PlayerShoot_Direction;
};

struct CSmEditorPluginMapType : public CGameCtnEditorPluginMapType {
  CSmArenaRulesMode* const Mode; // Maniascript
  const MwFastBuffer<CSmPlayer*> AllPlayers; // Maniascript
  const MwFastBuffer<CSmPlayer*> Players; // Maniascript
};

// File extension: 'SmArenaResource.Gbx'
struct CSmArenaResource : public CMwNod {
  CSmArenaResource();

  CScene2d* ScreenIn3d;
  CPlugBitmap* BitmapCoolDownCutOff;
  CPlugBitmap* BitmapConsumablesIcon_Off;
  CPlugShader* ShaderCrossHairHueShift;
  CPlugGameSkin* GameSkinCrosshairs;
  CPlugSound* SoundOffZone;
  CPlugSound* SoundTeleport;
  CPlugSound* UISound_StartMatch;
  CPlugSound* UISound_EndMatch;
  CPlugSound* UISound_StartRound;
  CPlugSound* UISound_EndRound;
  CPlugSound* UISound_PhaseChange;
  CPlugSound* UISound_TieBreakPoint;
  CPlugSound* UISound_TiePoint;
  CPlugSound* UISound_VictoryPoint;
  CPlugSound* UISound_Capture;
  CPlugSound* UISound_TimeOut;
  CPlugSound* UISound_Notice;
  CPlugSound* UISound_Warning;
  CPlugSound* UISound_PlayerEliminated;
  CPlugSound* UISound_PlayerHit;
  CPlugSound* UISound_Checkpoint;
  CPlugSound* UISound_Finish;
  CPlugSound* UISound_Record;
  CPlugSound* UISound_ScoreProgress;
  CPlugSound* UISound_RankChange;
  CPlugSound* UISound_Bonus;
  CPlugSound* UISound_FirstHit;
  CPlugSound* UISound_Combo;
  CPlugSound* UISound_PlayersRemaining;
  CPlugSound* UISound_Custom1;
  CPlugSound* UISound_Custom2;
  CPlugSound* UISound_Custom3;
  CPlugSound* UISound_Custom4;
  CPlugSound* SoundUISplashVersus;
  CPlugSound* SoundUIRetractableShow;
  CPlugSound* SoundUIRetractableHide;
  CPlugSound* SoundUITimeLeftWarning;
  CPlugSound* SoundUITimeTick;
  CPlugSound* SoundUITimeOut;
  CPlugSound* SoundUIGaugeHealth;
  CPlugSound* SoundUIGaugeStamina;
  CPlugSound* SoundUIGaugeEnergy;
  CControlFrame* CardPlayerScore_Small;
  CControlFrame* CardPlayerScore_Small_Rev;
  CControlFrame* CardPlayerScore_Big;
  CControlFrame* CardPlayerScore_Big_Rev;
  CControlFrame* CardPlayerScore_Medium;
  CControlFrame* CardPlayerScore_Medium_Rev;
  CFuncEnum* GameplayIcons;
  CPlugParticleEmitterModel* LaserSight_EmitterModel_deprecated;
  CGameActionFxResources* ActionFxResources;
  CMwRefBuffer* RefBuffer;
  float AdditionalListenerDistanceNbSquares;
};

struct CSmScriptLandmark : public CMwNod {
  const string Tag; // Maniascript
  const uint Order; // Maniascript
  const vec3 Position; // Maniascript
  const vec3 DirFront; // Maniascript
};

struct CSmScriptBlock : public CSmScriptLandmark {
  CSmScriptBase* const Base; // Maniascript
};

struct CSmScriptBlockSpawn : public CSmScriptBlock {
};

struct CSmScriptBlockPole : public CSmScriptBlock {
  bool Captured; // Maniascript
  CSmScriptSector* const Sector; // Maniascript
  CSmScriptGauge* const Gauge; // Maniascript
};

struct CSmScriptBase : public CMwNod {
  uint Clan; // Maniascript
  bool IsActive; // Maniascript
  const uint NumberOfCollectors; // Maniascript
};

struct CSmScriptGauge : public CMwNod {
  uint Clan; // Maniascript
  float ValueReal; // Range: 0 - 1 // Maniascript
  uint Value; // Maniascript
  uint Max; // Maniascript
  int Speed; // Maniascript
};

struct CSmScriptSector : public CMwNod {
  const MwFastBuffer<MwId> PlayersIds; // Maniascript
};

struct CSmModuleScoresTable : public CGamePlaygroundModuleClientScoresTable {
};

struct CSmScriptMapBase : public CMwNod {
  uint Clan; // Maniascript
  bool IsActive; // Maniascript
  const uint NumberOfCollectors; // Maniascript
};

struct CSmScriptMapGate : public CMwNod {
  uint Clan; // Maniascript
  bool Automatic; // Maniascript
  bool ManualClosed; // Maniascript
  const bool AutoClosed; // Maniascript
  bool AutoIsActive; // Maniascript
  int AutoCloseDelay; // Maniascript
  int AutoOpenSpeed; // Maniascript
};

struct CSmScriptMapGauge : public CMwNod {
  uint Clan; // Maniascript
  float ValueReal; // Range: 0 - 1 // Maniascript
  uint Value; // Maniascript
  uint Max; // Maniascript
  int Speed; // Maniascript
  bool Captured; // Maniascript
};

struct CSmScriptMapLandmark : public CMwNod {
  const string Tag; // Maniascript
  const uint Order; // Maniascript
  const vec3 Position; // Maniascript
  CSmScriptMapBase* const Base; // Maniascript
  CSmScriptMapGate* const Gate; // Maniascript
  CSmScriptMapGauge* const Gauge; // Maniascript
  CSmScriptMapSector* const Sector; // Maniascript
  CSmScriptMapPlayerSpawn* const PlayerSpawn; // Maniascript
  CSmScriptMapBotPath* const BotPath; // Maniascript
  CSmScriptMapBotSpawn* const BotSpawn; // Maniascript
  CSmScriptMapObjectAnchor* const ObjectAnchor; // Maniascript
};

struct CSmScriptMapSector : public CMwNod {
  const MwFastBuffer<MwId> PlayersIds; // Maniascript
};

struct CSmScriptMapPlayerSpawn : public CMwNod {
};

struct CSmScriptMapBotPath : public CMwNod {
  const uint Clan; // Maniascript
  const MwFastBuffer<vec3> Path; // Maniascript
  const bool IsFlying; // Maniascript
};

struct CSmScriptMapObjectAnchor : public CMwNod {
  const wstring ItemName; // Maniascript
  const MwId ItemModelId; // Maniascript
};

struct CSmScriptMapBotSpawn : public CMwNod {
  const bool IsFlying; // Maniascript
  const MwId BotModelId; // Maniascript
};

struct CSmModuleManager : public CGamePlaygroundModuleManagerClient {
};

} // namespace ShootMania

namespace GameData {

struct CGameCtnCollector : public CMwNod {
  CGameCtnCollector();

  enum class CGameCtnCollector::EProdState {
    Aborted = 0,
    GameBox = 1,
    DevBuild = 2,
    Release = 3,
  };
  UnnamedEnum CollectionId;
  MwId Author;
  wstring NameE;
  const wstring Name; // Maniascript
  wstring Description;
  bool IsInternal;
  bool IsAdvanced;
  string PageName; // Maniascript
  uint CatalogPosition;
  CGameCtnCollector::EProdState ProdState;
  CPlugFileImg* IconFid;
  bool IconUseAutoRender;
  uint IconQuarterRotationY;
  uint InterfaceNumber; // Maniascript
  CPlugBitmap* const Icon; // Maniascript
};

// File extension: 'Item.Gbx'
struct CGameItemModel : public CGameCtnCollector {
  CGameItemModel();

  const UnnamedEnum ItemType;
  const MwFastBuffer<CGameActionModel*> Actions;
  CGameItemPlacementParam* DefaultPlacementParam;
  UnknownType Icon;
  CMwNod* VisModel;
  CMwNod* VisModelCustom;
  UnknownType DefaultSkinFileRef;
  UnknownType ArchetypeRef;
  CMwNod* PhyModel;
  CMwNod* PhyModelCustom;
  bool HasPath;
  bool CanFly;
  uint Occupation;
  UnnamedEnum ItemTypeE;
  string SkinDirNameCustom;
  CPlugFileFidContainer* DefaultSkinFid;
  void InitFromArchetype();
  const MwFastBuffer<CMwNod*> Cameras;
  UnnamedEnum DefaultCam;
  MwId DefaultWeaponName;
  MwFastArray<CPlugFileZip*> NadeoSkinsFids;
  UnnamedEnum WaypointType;
  CPlugAudioEnvironment* AudioEnvironmentInCar;
  CPlugTrafficObjectParams* TrafficParams;
  CPlugTurretObjectParams* TurretParams;
  vec3 GroundPoint;
  float PainterGroundMargin;
  float OrbitalCenterHeightFromGround;
  float OrbitalRadiusBase;
  float OrbitalPreviewAngle;
};

struct CGameObjectPhyModel : public CMwNod {
  CGameObjectPhyModel();

  UnknownType MoveShape;
  CPlugSurface* MoveShapeNod;
  wstring MoveShapeRefName;
  UnknownType HitShape;
  CPlugSurface* HitShapeNod;
  wstring HitShapeRefName;
  UnknownType TriggerShape;
  CPlugSurface* TriggerShapeNod;
  wstring TriggerShapeRefName;
  CPlugDynaPointModel* DynaPointModel;
  uint FirePeriod;
  const MwFastBuffer<CGameActionModel*> Actions;
  MwFastBuffer<CPlugTriggerAction*> Triggers;
};

// File extension: 'GameObjectVisModel.Gbx'
struct CGameObjectVisModel : public CMwNod {
  CGameObjectVisModel();

  UnknownType Mesh;
  wstring MeshRef;
  CPlugSolid2Model* MeshNod;
  CPlugAnimLocSimple* LocAnim;
  wstring SoundRef_Spawn;
  wstring SoundRef_Unspawn;
  wstring SoundRef_Grab;
  wstring SoundRef_Smashed;
  wstring SoundRef_Permanent;
  CPlugSound* Sound_Spawn;
  CPlugSound* Sound_Unspawn;
  CPlugSound* Sound_Grab;
  CPlugSound* Sound_Smashed;
  CPlugSound* Sound_Permanent;
  iso4 SoundLoc_Permanent;
  CPlugParticleEmitterModel* ParticleModel_Alive;
  vec3 ParticleModelPos_Alive;
  CPlugSolid2Model* MeshShaded;
  wstring SmashParticleRef;
  CPlugParticleEmitterModel* DestroyParticleModel;
  UnknownType Sprites;
};

// File extension: 'Action.Gbx'
struct CGameActionModel : public CMwNod {
  CGameActionModel();

  const UnnamedEnum ActionType;
  string ActionName;
  UnknownType Icon;
  UnnamedEnum InventoryItemClass;
  const wstring Description;
  CPlugAnimFile* Anim;
  bool IsAnimPartial;
  MwFastBuffer<CPlugCustomBulletModel*> Projectiles;
  MwFastBuffer<CPlugCustomBeamModel*> Beams;
  UnknownType CrossHair;
  CPlugScriptWithSettings* Script;
  MwFastBuffer<CPlugBulletModel*> BulletModels;
  const uint ParticleBlockCount;
  void LogParticleBlockModelIds();
};

struct CGameWaypointSpecialProperty : public CMwNod {
  CGameWaypointSpecialProperty();

  string Tag;
  uint Order;
};

// File extension: 'GameActionFxResources.Gbx'
struct CGameActionFxResources : public CMwNod {
  CGameActionFxResources();

  CSystemFidsFolder* ParticleEmitterSubModels_Continuous;
  CSystemFidsFolder* ParticleEmitterSubModels_Splash;
  CSystemFidsFolder* MeshFolder;
  CSystemFidsFolder* AudioFxLibraryFolder;
  CSystemFidsFolder* BeamEmitterSubModels;
  CMwRefBuffer* BulletModelsLibrary;
};

// File extension: 'Gate.gbx'
struct CGameGateModel : public CMwNod {
  CGameGateModel();

  CPlugSurface* Shape;
  CGameArmorModel* Armor;
  CPlugSound* GateOpenSound;
  CPlugSound* GateSound;
  CPlugSound* GateCloseSound;
};

// File extension: 'Teleporter.gbx'
struct CGameTeleporterModel : public CMwNod {
  CGameTeleporterModel();

  CGameSpawnModel* Spawn;
  CPlugSurface* TriggerShape;
  vec3 CenterPos;
};

// File extension: 'Armor.gbx'
struct CGameArmorModel : public CMwNod {
  CGameArmorModel();

  uint ArmorMax;
  uint ReplenishDelayAfterDamage;
};

// File extension: 'Spawn.gbx'
struct CGameSpawnModel : public CMwNod {
  CGameSpawnModel();

  iso4 Loc;
  bool Underground;
  float TorqueX;
  uint TorqueDuration;
};

// File extension: 'CaptureZone.gbx'
struct CGameCaptureZoneModel : public CMwNod {
  CGameCaptureZoneModel();

  iso4 Loc;
  float Radius;
  float Height;
};

// File extension: 'Turbine.gbx'
struct CGameTurbineModel : public CMwNod {
  CGameTurbineModel();

  iso4 Loc;
  float SilencerBubble_RadiusMute;
  float SilencerBubble_RadiusFade;
  bool SilencerBubble_OnlyPlayerSounds;
};

struct CGameGhostData : public CMwNod {
  CGameGhostData();

};

// File extension: 'Module.Gbx'
struct CGameModuleModel : public CMwNod {
  CGameModuleModel();

  UnknownType Icon;
  float SizeX; // Range: 0 - 320
  float SizeY; // Range: 0 - 180
  CPlugFileText* ManialinkCode;
  UnknownType Hud_Inventory;
  UnknownType Hud_Store;
  UnknownType Hud_ScoresTable;
  bool MinimapShowSelf;
  UnknownType MinimapSelfMarkerIcon;
  bool MinimapShowTeam;
  UnknownType MinimapTeamMarkerIcon;
  bool MinimapIsUnderground;
  float MinimapClearDiskRadius;
  float MinimapClearDiskFadeSize;
  float MinimapZoomFactor;
  string InventoryTitle;
  uint InventorySlotCapacity;
  uint InventorySlotsCount; // Range: 1 - 60
  uint InventoryColumns; // Range: 1 - 60
  uint InventoryLines; // Range: 1 - 60
  string StoreTitle;
  string StoreSubtitle;
  UnknownType StorePowerUpImageLvl1;
  UnknownType StorePowerUpImageLvl2;
  UnknownType StorePowerUpImageLvl3;
  UnknownType StorePowerUpImageLvl4;
  UnknownType StorePowerUpImageLvl5;
  UnknownType StoreMedalImageLvl1;
  UnknownType StoreMedalImageLvl2;
  UnknownType StoreMedalImageLvl3;
  UnknownType StoreMedalImageLvl4;
  UnknownType StoreMedalImageLvl5;
  UnknownType StoreBackgroundImage;
  UnknownType StoreHeaderBackgroundImage;
  UnknownType StoreFooterBackgroundImage;
  UnknownType StoreDescriptionBackgroundImage;
  UnknownType StoreItemListBackgroundImage;
  UnknownType StoreItemCardBackgroundImage;
  UnknownType StorePowerUpMedalBackgroundImage;
  UnknownType StoreCurrencyIcon;
  string StoreHeaderTextStyle;
  string StoreItemCardStyle;
  string StoreDescriptionStyle;
  float StoreHeaderTextScale;
  float StoreItemCardScale;
  float StoreDescriptionScale;
  MwFastBuffer<CGameModuleScoresTableColumn*> ScoresTableColumns;
  bool ScoresTableUseTeams;
  bool ScoresTableDisplayTeamScores;
  string ScoresTableTitle;
  bool ScoresTableUsePlayerDarkening;
  bool ScoresTableUseSettings;
  bool ScoresTableSortSpectatorsLast;
  bool ScoresTableSortDisconnectedLast;
  bool ScoresTableDisplayLocalPlayerInfo;
  bool ScoresTableDisplayServerName;
  bool ScoresTableDisplayColumnLegends;
  uint ScoresTableColumnCount; // Range: 1 - 10
  uint ScoresTableLineCount; // Range: 1 - 10
  float ScoresTableColumnMargin;
  UnknownType ScoresTableGameModeIcon;
  UnknownType ScoresTableSmStormBackground;
  UnknownType ScoresTableTmStadiumBackground;
  UnknownType ScoresTableTmCanyonBackground;
  UnknownType ScoresTableTmValleyBackground;
  UnknownType ScoresTableSmHeaderTeam1Bg;
  UnknownType ScoresTableSmHeaderTeam2Bg;
  UnknownType ScoresTableTmHeaderTeam1Bg;
  UnknownType ScoresTableTmHeaderTeam2Bg;
  UnknownType ScoresTableSmPlayerCardSquareQuad;
  UnknownType ScoresTableSmPlayerCardBackgroundQuad;
  UnknownType ScoresTableSmPlayerCardBackgroundQuadRevert;
  UnknownType ScoresTableTmPlayerCardSquareQuad;
  UnknownType ScoresTableTmPlayerCardBackgroundQuad;
  UnknownType ScoresTableTmPlayerCardBackgroundQuadRevert;
  UnknownType ScoresTableEchelon1;
  UnknownType ScoresTableEchelon2;
  UnknownType ScoresTableEchelon3;
  UnknownType ScoresTableEchelon4;
  UnknownType ScoresTableEchelon5;
  UnknownType ScoresTableEchelon6;
  UnknownType ScoresTableEchelon7;
  UnknownType ScoresTableEchelon8;
  UnknownType ScoresTableEchelon9;
  UnknownType ScoresTableEchelon1Rev;
  UnknownType ScoresTableEchelon2Rev;
  UnknownType ScoresTableEchelon3Rev;
  UnknownType ScoresTableEchelon4Rev;
  UnknownType ScoresTableEchelon5Rev;
  UnknownType ScoresTableEchelon6Rev;
  UnknownType ScoresTableEchelon7Rev;
  UnknownType ScoresTableEchelon8Rev;
  UnknownType ScoresTableEchelon9Rev;
  string ScoresTableHeaderStyle;
  string ScoresTablePlayerInfoLocalRankStyle;
  string ScoresTablePlayerCardLocalRankStyle;
  float ScoresTableHeaderScale;
  float ScoresTablePlayerInfoLocalRankScale;
  float ScoresTablePlayerCardLocalRankScale;
  string ScoresTableDefaultTeam1Name;
  string ScoresTableDefaultTeam2Name;
  uint MenuBrowser_Items_LinesCount;
  uint MenuBrowser_Items_ColumnsCount;
  uint MenuBrowser_Folders_LinesCount;
  uint MenuBrowser_Folders_ColumnsCount;
  MwFastBuffer<CGameActionModel*> StoreActions;
  MwFastBuffer<CGameItemModel*> StoreItems;
  MwFastBuffer<CGameModuleModel*> MenuSubMenus;
  MwFastBuffer<CGameModuleScoresTableColumn*> MenuComponents;
  MwFastBuffer<CGameModuleModel*> MenuAdvancedComponents;
};

struct CGameModuleScoresTableColumn : public CMwNod {
  CGameModuleScoresTableColumn();

};

struct CGameItemPlacementParam : public CMwNod {
  CGameItemPlacementParam();

  MwFastBuffer<vec3> Pivots_Positions;
  bool SwitchPivotManually;
  float FlyVStep;
  float FlyVOffset;
  bool GhostMode;
  float GridSnap_HStep;
  float GridSnap_VStep;
  float GridSnap_HOffset;
  float GridSnap_VOffset;
  float PivotSnap_Distance;
  bool YawOnly;
  bool NotOnObject;
  bool AutoRotation;
  vec3 Cube_Center;
  float Cube_Size;
  UnknownType PivotRotations;
  void AddPivotPosition();
  void AddPivotRotation();
  bool HasPath;
  bool IsFreelyAnchorable;
};

} // namespace GameData


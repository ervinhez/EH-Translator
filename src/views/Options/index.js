import { Routes, Route, HashRouter } from "react-router-dom";
import About from "./About";
import Rules from "./Rules";
import Setting from "./Setting";
import Layout from "./Layout";
import SyncSetting from "./SyncSetting";
import { SettingProvider } from "../../hooks/Setting";
import ThemeProvider from "../../hooks/Theme";
import { useEffect, useState } from "react";
import { trySyncRules, trySyncSetting, trySyncWords } from "../../libs/sync";
import { AlertProvider } from "../../hooks/Alert";
import { ConfirmProvider } from "../../hooks/Confirm";
import Apis from "./Apis";
import Prompts from "./Prompts";
import Tranbox from "./Tranbox";
import FavWords from "./FavWords";
import MouseHoverSetting from "./MouseHover";
import SubtitleSetting from "./Subtitle";
import StylesSetting from "./StylesSetting";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { kissLog } from "../../libs/log";

const getOptionsStartupSyncTasks = () => {
  const hashPath = window.location.hash.replace(/^#/, "") || "/";
  if (hashPath === "/rules" || hashPath.startsWith("/rules/")) {
    return {
      requiredSync: trySyncRules,
      backgroundSyncs: [trySyncSetting, trySyncWords],
    };
  }

  if (hashPath === "/words" || hashPath.startsWith("/words/")) {
    return {
      requiredSync: trySyncWords,
      backgroundSyncs: [trySyncSetting, trySyncRules],
    };
  }

  return {
    requiredSync: trySyncSetting,
    backgroundSyncs: [trySyncRules, trySyncWords],
  };
};

/**
 * 选项设置中心 (Options) 根入口组件
 */
export default function Options() {
  const [syncingRequiredData, setSyncingRequiredData] = useState(true); // 是否正在同步当前页面必须的数据 (setting/rules/words)，若是则阻塞页面其他部分访问 storage 接口

  useEffect(() => {
    (async () => {
      // 只等待当前入口页必须的数据，其他同步任务放到后台继续执行。
      const { requiredSync, backgroundSyncs } = getOptionsStartupSyncTasks();
      await requiredSync();

      // 所有必须数据同步完成后，允许页面其他部分开始访问 storage 接口
      setSyncingRequiredData(false);

      void Promise.all(backgroundSyncs.map((sync) => sync())).catch((err) => {
        kissLog("sync options background", err?.message || err);
      });
    })();
  }, []);

  return (
    <SettingProvider context="options">
      <ThemeProvider>
        <AlertProvider>
          <ConfirmProvider>
            {/* React 页面端路由管理 */}
            <HashRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  {/* 子页面路由注册 */}
                  <Route index element={<Setting />} />
                  <Route path="rules" element={<Rules />} />
                  <Route path="styles" element={<StylesSetting />} />
                  <Route path="tranbox" element={<Tranbox />} />
                  <Route path="mousehover" element={<MouseHoverSetting />} />
                  <Route path="subtitle" element={<SubtitleSetting />} />
                  <Route path="apis" element={<Apis />} />
                  <Route path="prompts" element={<Prompts />} />
                  <Route path="sync" element={<SyncSetting />} />
                  <Route path="words" element={<FavWords />} />
                  <Route path="about" element={<About />} />
                </Route>
              </Routes>
            </HashRouter>
            <Backdrop
              data-testid="options-sync-backdrop"
              aria-label="syncing required data"
              open={syncingRequiredData}
              sx={(theme) => ({
                color: "#fff",
                zIndex: theme.zIndex.modal + 1,
              })}
            >
              <CircularProgress color="inherit" size={72} />
            </Backdrop>
          </ConfirmProvider>
        </AlertProvider>
      </ThemeProvider>
    </SettingProvider>
  );
}

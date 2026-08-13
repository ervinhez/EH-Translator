import { Routes, Route, HashRouter } from "react-router-dom";
import About from "./About";
import Setting from "./Setting";
import Layout from "./Layout";
import { SettingProvider } from "../../hooks/Setting";
import ThemeProvider from "../../hooks/Theme";
import { AlertProvider } from "../../hooks/Alert";
import { ConfirmProvider } from "../../hooks/Confirm";
import Apis from "./Apis";
import Prompts from "./Prompts";
import Tranbox from "./Tranbox";
import FavWords from "./FavWords";
import MouseHoverSetting from "./MouseHover";
import SubtitleSetting from "./Subtitle";
import StylesSetting from "./StylesSetting";


/**
 * 选项设置中心 (Options) 根入口组件
 */
export default function Options() {

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
                  <Route path="styles" element={<StylesSetting />} />
                  <Route path="tranbox" element={<Tranbox />} />
                  <Route path="mousehover" element={<MouseHoverSetting />} />
                  <Route path="subtitle" element={<SubtitleSetting />} />
                  <Route path="apis" element={<Apis />} />
                  <Route path="prompts" element={<Prompts />} />
                  <Route path="words" element={<FavWords />} />
                  <Route path="about" element={<About />} />
                </Route>
              </Routes>
            </HashRouter>
          </ConfirmProvider>
        </AlertProvider>
      </ThemeProvider>
    </SettingProvider>
  );
}

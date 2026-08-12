#!/usr/bin/env zx
import { argv, quote, $ } from "zx";

// 在 Windows 上使用 cmd.exe，避免 zx 默认使用 WSL bash 导致 node not found
if (process.platform === "win32") {
  $.shell = "cmd.exe";
  $.prefix = "";
  $.quote = quote;
}

// 用法: zx src/scripts/build-task.mjs --target=chrome
const target = argv.target;

if (!target) {
  console.error(
    chalk.red("Error: Please specify a target, e.g., --target=chrome")
  );
  process.exit(1);
}

const buildRoot = "build";
const targetDir = path.join(buildRoot, target);

// 辅助：获取构建目录下的文件路径
const inDest = (file) => path.join(targetDir, file);

console.log(chalk.blue(`\n🚀 Starting build task for: ${chalk.bold(target)}`));

try {
  // 1. 【清理】 清空当前目标的构建目录
  await fs.remove(targetDir);

  // 2. 【构建】 标准 React 构建流程
  process.env.BUILD_PATH = `./${targetDir}`;
  process.env.REACT_APP_CLIENT = target;
  process.env.FORCE_COLOR = "1";
  process.env.NODE_OPTIONS = [
    process.env.NODE_OPTIONS,
    "--disable-warning=DEP0176",
  ]
    .filter(Boolean)
    .join(" ");

  console.log(chalk.gray(`Running react-app-rewired build...`));
  await $`react-app-rewired build`;

  // 3. 【后处理】 文件清理与移动
  console.log(chalk.gray(`Running post-build cleanups...`));

  // 清理扩展构建不需要的页面与多余 manifest
  await fs.remove(inDest("content.html"));
  await fs.remove(inDest("index.html"));
  await fs.remove(inDest("manifest.firefox.json"));
  await fs.remove(inDest("manifest.thunderbird.json"));

  console.log(
    chalk.green(`✅ Build task for [${target}] completed successfully!`)
  );
} catch (err) {
  console.error(chalk.red(`❌ Build task for [${target}] failed:`), err);
  process.exit(1);
}

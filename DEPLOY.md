# FlowPulse 站点部署指南（双线静态托管 · 零 VPS）

站点根目录即本仓库根：`index.html` + `docs/` + `assets/`。
纯静态、零构建、无服务端函数，适配任意静态托管。

## 一、两条线

| 线 | 平台 | 地址形态 | 面向 |
|----|------|---------|------|
| 国内 | **Gitee Pages**（码云） | `https://<用户>.gitee.io/flowpulse-site/` | 中文社区 |
| 海外 | **Cloudflare Pages** | `https://<项目>.pages.dev` | 国际社区 |

> 进阶（日后）：购自定义域名 + 地域 DNS，做到「一个域名按地域分流」。见第三节。

## 二、部署步骤

### 国内线 — Gitee Pages
1. Gitee 新建**公开**仓库 `flowpulse-site`，推送本目录到 `master`。
2. 仓库 → 「服务」→「Gitee Pages」→ 部署分支 `master`，部署目录 `/`（根）。
3. 开启后访问 `https://<用户>.gitee.io/flowpulse-site/`。
4. 注意：免费版仅子域；绑自定义域名需 Gitee Pages Pro（付费）。

### 海外线 — Cloudflare Pages
1. 代码先放 **GitHub** 公开仓库 `flowpulse-site`（Cloudflare 从 GitHub 拉取）。
2. Cloudflare Dashboard → Pages → 「Connect to Git」→ 选该仓库。
3. Build 设置：**Framework preset = None**，**Build command 留空**，**Build output directory = `/`**（根）。
4. 部署后得 `https://<项目>.pages.dev`，后续 push GitHub 自动重新部署。

### 一套代码，两份推送（镜像）
```bash
git remote add github https://github.com/<你>/flowpulse-site.git
git remote add gitee  https://gitee.com/<你>/flowpulse-site.git
git push github master
git push gitee  master
```
或用 Gitee「导入镜像仓库」/ GitHub Action 自动同步，避免手动双推。

## 三、进阶：一个域名，按地域分流（需买域名 + 备案）

当前选了「暂用子域」，故本节为后续路线：

1. 购买域名（如 `flowpulse.cc`）。
2. 海外节点：Cloudflare Pages **免费支持自定义域名** → CNAME 到 `<项目>.pages.dev`。
3. 国内节点：Gitee Pages **不能免费绑自定义域**，故国内线改用 **腾讯云 COS 静态网站托管 + CDN**（备案后绑域名，国内快）。
4. DNS 做地域解析（DNSPod / 腾讯云 DNS / Cloudflare DNS 均支持）：
   - 国内 → 腾讯云 COS/CDN 的 CNAME
   - 海外 → Cloudflare Pages 的 CNAME
5. 不买域名时，回到第二节：两个子域地址都放出，站点页脚/README 列双链，可加 JS 测速选优或「国内/海外」手动切换。

## 四、注意事项
- 所有资源用**相对路径**，勿引被墙的境外 CDN（字体/图片同域存放），否则国内加载慢。
- 双语靠纯 JS 切换，无服务端逻辑，两平台通吃。
- Gitee Pages 与 Cloudflare Pages 均默认 HTTPS。
- 仓库需公开（两平台免费版均要求）。

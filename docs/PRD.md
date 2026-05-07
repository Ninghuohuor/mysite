# Ninghuohuo Personal Website PRD

## 1. Product Summary

Ninghuohuo Personal Website is a static personal homepage for Ninghuohuo, an AI content creator rebuilding work, content, product thinking, and personal business workflows with AI. The site should present a distinctive long-scroll identity page rather than a conventional portfolio landing page.

The current production target is:

- Primary domain: `https://ninghuohuo.ai`
- GitHub repository: `git@github.com:Ninghuohuor/mysite.git`
- Hosting model: static files served from an Ubuntu 24.04 server through Nginx
- DNS provider: Cloudflare
- HTTPS: Let's Encrypt certificate managed by Certbot
- Contact email entry point: `hello@ninghuohuo.ai`, planned through Cloudflare Email Routing

## 2. Goals

- Present Ninghuohuo's identity, work principles, current focus areas, ongoing projects, recent preferences, personal motivation, and contact channels in one cohesive scroll experience.
- Keep the site framework-free and easy to deploy on a self-owned server.
- Make future content changes simple through GitHub and server-side `git pull`.
- Use `ninghuohuo.ai` as the canonical public domain.
- Support an email contact address at `hello@ninghuohuo.ai` through Cloudflare Email Routing.

## 3. Non-Goals

- No CMS or admin panel.
- No backend application server.
- No contact form submission backend.
- No user accounts, analytics dashboard, payment flow, or database.
- Cloudflare Email Routing is for inbound forwarding only; sending mail as `hello@ninghuohuo.ai` requires a separate mail provider or SMTP service.

## 4. Target Audience

- Viewers who discover Ninghuohuo through AI content platforms.
- Potential collaborators interested in AI workflows, content production, personal brand building, or solo-business experiments.
- People who want to understand Ninghuohuo's work principles, interests, and current projects quickly.

## 5. Information Architecture

The site is a single-page long-scroll experience with anchor navigation:

- `#manifesto` - about / manifesto
- `#principles` - work principles
- `#direction` - current AI focus directions
- `#projects` - current projects
- `#contact` - contact section

The header navigation uses Chinese labels:

- 关于我
- 工作原则
- 关注方向
- 项目
- 联系我

## 6. Current Page Modules

### 6.1 Hero

Purpose: introduce Ninghuohuo immediately with a strong visual identity.

Current implementation:

- Full-screen hero section.
- 3D retro computer scene powered by Three.js.
- Screen video loaded from Cloudinary:
  `https://res.cloudinary.com/divynfoap/video/upload/f_auto,q_auto/v1777333574/4%E6%9C%8828%E6%97%A5_1_awcdzs.mp4`
- Typewriter greeting:
  `Hi，我是宁火火 😎；欢迎来到我的个人主页。`
- Hero intro copy describing the transition from traditional internet work to AI-enabled work, content, and personal business.
- Large interactive `NINGHUOHUO` wordmark.

### 6.2 Manifesto / About

Purpose: explain personal background and current direction.

Current content themes:

- Based in Zhejiang.
- Introverted, imaginative, occasionally sharp-tongued.
- Background across engineering, UI/UX, ToC / ToB products, startups, and commerce.
- Current focus: starting from zero as an AI content creator and documenting how AI reshapes learning, content workflows, products, personal brand, and work.

Interaction:

- Scroll reveal text treatment.
- Chinese and English copy are both present.

### 6.3 Work Principles

Purpose: show the thinking references that shape Ninghuohuo's work principles.

Current module title:

- `我相信的工作原则`

Current people and ideas:

- Ethan Mollick - Always invite AI to the table.
- Naval Ravikant - Code and media as permissionless leverage.
- Kevin Kelly - 1,000 true fans.
- Andrej Karpathy - AI / Software 2.0 eating software.
- Dan Koe - Solve your own problems and write about them online.
- Reid Hoffman - Launch early.
- Ali Abdaal - Share what you are learning.

Current state:

- Portraits are visible.
- The temporary face-mask overlay used for recording has been removed.
- The module uses a scroll-driven sequence with native decay photo cards.

### 6.4 Focus Directions

Purpose: define the content and learning themes Ninghuohuo will focus on.

Current module title:

- `我关注的方向`

Main visual:

- `assets/direction/direction-studio-workspace.png`

Current intro:

- AI should be used, not only studied.
- Technical accumulation without application scenarios is ineffective.
- Future learning and video content should focus on monetization loops, automation workflows, and rebuilding personal productivity with AI.

Current topics:

- AI产品与增长 / AI Product & Growth
- AI自动化工作流 / AI Automation Workflows
- AI一人公司变现项目 / AI Solo-Business Monetization
- AI 内容与个人品牌 / AI Content & Personal Brand
- AI变现逆向拆解 / AI Monetization Reverse Engineering

Interaction:

- Separate sticky image panel before the focus text section.
- ASCII portrait iframe:
  `assets/projects/ascii-portrait.html?v=ascii-scroll-progress-20260503a`
- Scroll-driven topic reveal.

### 6.5 Current Projects

Purpose: show the projects Ninghuohuo is currently building.

Current module title:

- `我正在做的项目`

Current card behavior:

- Five-image collage.
- On hover/focus, project name marquee appears.
- Marquee text only shows the project name.
- Circular separators divide repeated names.
- Project description appears centered under the marquee.

Current projects:

- Solobiz0 - 内容创作自动化工作流
- Levix - 人生游戏化管理工具
- Gloopix - AI 图片与视频创作
- Vibix - 随时随地记录碎片化灵感
- Ninglo - 帮助从0到1理解 AI、使用 AI。

Current primary asset paths:

- `assets/projects/solobiz0-focus-work.png`
- `assets/projects/vibix-pixel-game.png`
- `assets/projects/solobiz0-cyborg-portrait.png`
- `assets/projects/vibix-idea-closeup.png`
- `assets/projects/ninglo-ai-constellation.png`

### 6.6 Recent Preferences

Purpose: show current personal interests in a playful interactive way.

Current module title:

- `我最近的偏好`

Current triggers:

- 播客
- 访谈
- VibeCoding
- 健身
- 爬山
- 百万

Interaction:

- Trigger words swap the right-side preview image.
- Inline trigger icons use mask-based icon rendering.

Current key preview assets:

- `assets/hobbies/podcast-phone.png`
- `assets/hobbies/interview.png`
- `assets/hobbies/vibecoding-desk.png`
- `assets/hobbies/fitness.png`
- `assets/hobbies/hiking.png`
- `assets/hobbies/million.png`

### 6.7 Energy Source

Purpose: express the personal motivation behind the work.

Current module title:

- `我的力量源泉`

Current message:

- Family is the source of motivation and courage.
- Freedom means staying close within the everyday space of loved ones.

Interaction:

- Particle background.
- Orbiting image system powered by `orbit-images.js`.

### 6.8 Contact

Purpose: provide direct ways to contact or follow Ninghuohuo.

Current module title:

- `联系我`

Current note:

- `一起学习和聊聊 AI、内容、产品，或者任何正在成形的想法。`

Current contact rows:

- MAIL: `mailto:hello@ninghuohuo.ai`
- WECHAT: opens QR modal
- DOUYIN
- XIAOHONGSHU
- BILIBILI
- X: `https://x.com/ninghuohuor`
- YOUTUBE: `https://www.youtube.com/@ninghuohuor`

Current QR assets:

- `assets/contact/wechat-personal-qr.png`
- `assets/contact/wechat-group-qr.png`

## 7. Functional Requirements

- The site must load as a static website from `index.html`.
- All primary navigation links must scroll to their corresponding single-page anchors.
- The hero 3D scene must render without requiring a backend.
- External scripts for GSAP and Three.js must load from CDN.
- Project cards must remain keyboard-focusable through `tabindex="0"`.
- Contact links must open external platforms in a new tab with `rel="noopener noreferrer"`.
- The WeChat QR modal must be keyboard and pointer accessible.
- Cloudflare Email Routing must forward `hello@ninghuohuo.ai` to the owner's chosen destination inbox once DNS is active.

## 8. Non-Functional Requirements

- Static deployment should work on any basic Nginx server.
- The site should be responsive across desktop and mobile.
- Visual sections should not show blank canvases, incoherent overlap, or clipped text.
- Large local media files should not be committed if they exceed GitHub limits or are not used by the live page.
- Source files should stay understandable without a build process.

## 9. Technical Architecture

Current stack:

- HTML: `index.html`
- CSS: `styles.css`
- Main JavaScript: `script.js`
- 3D hero: `hero-computer.js`
- Particle background: `particles-bg.js`
- Orbit images: `orbit-images.js`
- Tests: Node built-in test runner in `tests/*.test.js`

External runtime dependencies:

- GSAP `3.12.5` via jsDelivr
- ScrollTrigger via jsDelivr
- Three.js `0.160.1` via import map and jsDelivr
- Cloudinary-hosted hero screen video

No package install or bundling step is required for production.

## 10. Repository and Version Control

GitHub repository:

- `git@github.com:Ninghuohuor/mysite.git`

Branch:

- `main`

Recommended local update flow:

```bash
git status
node --test tests/*.test.js
git add .
git commit -m "Describe change"
git push
```

Recommended server update flow:

```bash
cd /var/www/ninghuohuo
git pull
```

Because this is a static site, Nginx usually does not need to be restarted after content updates.

## 11. Deployment Requirements

Production server target:

- OS: Ubuntu 24.04
- Web server: Nginx
- HTTPS: Certbot with Let's Encrypt
- Site root: `/var/www/ninghuohuo`

Expected Nginx server block:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name ninghuohuo.ai www.ninghuohuo.ai;

    root /var/www/ninghuohuo;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

After Certbot runs, HTTPS rules are managed by Certbot/Nginx.

Required open ports:

- `22` SSH
- `80` HTTP
- `443` HTTPS

## 12. Cloudflare Requirements

Cloudflare will be used as DNS provider for `ninghuohuo.ai`.

Required Cloudflare DNS records for the website:

- `A` record, name `@`, content: server public IPv4 address
- `A` record, name `www`, content: server public IPv4 address

Recommended initial proxy mode:

- `DNS only` while first validating server HTTPS and routing.
- Cloudflare proxy can be enabled later if desired.

Cloudflare nameservers assigned during onboarding:

- `piers.ns.cloudflare.com`
- `veda.ns.cloudflare.com`

The registrar nameservers should be changed from the previous Spaceship nameservers to the Cloudflare nameservers above.

## 13. Email Routing Requirements

Desired address:

- `hello@ninghuohuo.ai`

Cloudflare Email Routing should be enabled after Cloudflare becomes authoritative DNS provider.

Required behavior:

- Incoming mail to `hello@ninghuohuo.ai` forwards to the owner's chosen personal inbox.

Expected Cloudflare-managed records:

- Cloudflare Email Routing MX records
- SPF TXT record provided by Cloudflare

Important constraint:

- Cloudflare Email Routing is inbound forwarding only. Sending mail as `hello@ninghuohuo.ai` requires a separate outbound email provider if needed.

## 14. Test and Verification

Primary test command:

```bash
node --test tests/*.test.js
```

Current tests assert:

- Page structure and section ordering.
- Hero, manifesto, principles, direction, projects, hobbies, energy, and footer structure.
- Current contact links.
- Project card text, image paths, and hover/marquee structure.
- Runtime initialization safeguards.
- Energy particle and orbit behavior.

Manual verification checklist:

- Open local preview with `python3 -m http.server 8001`.
- Visit `http://localhost:8001`.
- Verify hero 3D scene is visible.
- Verify project hover/focus marquee is readable.
- Verify contact links point to the intended destinations.
- Verify `https://ninghuohuo.ai` after deployment.
- Send a test email to `hello@ninghuohuo.ai` after Cloudflare Email Routing is active.

## 15. Known Operational Notes

- `assets/hero-screen.mp4` is intentionally ignored because it exceeds GitHub's single-file limit and the live page uses the Cloudinary video instead.
- Historical snapshots in `_snapshots/` are development artifacts, not production dependencies.
- If Cloudflare proxy is enabled, review SSL/TLS mode and keep it compatible with the Let's Encrypt certificate on the origin server.
- If email deliverability becomes important for outbound mail, move from forwarding-only Email Routing to a full email provider such as Google Workspace, Zoho Mail, Microsoft 365, Tencent Enterprise Mail, or another SMTP-capable service.

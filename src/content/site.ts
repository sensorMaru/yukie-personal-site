export const experiences = [
  {
    company: 'AnyMind',
    team: 'AI 电商内容与视频',
    role: 'AI电商视频实习生',
    period: '2026.06 — 至今',
    tags: ['AI 内容生产', 'Skill 工作流', '视频质量检查'],
    scope: '负责电商 UGC 视频从脚本、生成到剪辑的全流程制作；基于 Codex 独立搭建脚本生成与视频自检 Skill，将内容结构和检查规则转化为可复用的团队工作流。协作 AI 直播团队制作商品局部特写视频。',
    output: '个人周均交付 30–50 条视频；脚本生成与视频自检 Skill 已投入实际生产，其中自检工具覆盖 7 名同事使用。',
    status: '内容交付与团队工具均已实际使用',
  },
  {
    company: '宁德时代 · 时代电服',
    team: '新能源换电业务 · B端',
    role: '产品经理实习生',
    period: '2026.03 — 2026.05',
    tags: ['业务流程', '角色权限', '系统整合'],
    scope: '围绕低分评价处理与跨系统数据整合，独立完成需求分析、业务流程与角色权限设计、PRD 输出，协同用户体验、运营及研发团队推进评审与开发排期。',
    output: '完成低分评价有效性判断、回访、判责、通知与日志方案；梳理双系统数据流转及字段口径，输出合并方案、PRD 与业务 SOP。',
    status: '实习期内推进至评审与排期，未跟进到上线',
  },
  {
    company: '小影科技',
    team: '出海 AI 电商视频工具 · C端',
    role: '产品实习生',
    period: '2025.11 — 2026.03',
    tags: ['用户增长', 'AI 创作体验', '商业化定价'],
    scope: '设计普通用户双向积分激励与 KOL/KOC 分销方案，参与音色创作玩法与 AI 视频功能阶梯定价；协同研发、设计与运营推进需求，并跟踪注册、活跃和复购等指标。',
    output: '推动相关产品需求上线，输出增长激励方案、功能定价评估及数据监测 SOP，建立周度数据复盘机制。',
    status: '相关需求已上线，未获取上线后的效果反馈',
  },
  {
    company: '腾展科技',
    team: 'AI 社交产品 · C端',
    role: '产品实习生',
    period: '2025.06 — 2025.09',
    tags: ['AI 对话体验', '本地化语料', '内容生态'],
    scope: '围绕 AI 社交产品的对话体验与内容生态，设计 AI 交互唱歌玩法；借助 Dify 优化指令与场景规则，测试回复质量，并结合用户情绪与互动需求设计差异化内容。',
    output: '整理覆盖 20+ 城市的本地化生活语料，清洗结构化 1100+ 条优质语料；拆解 ASMR、陪伴类内容，策划落地晚安哄睡、高情绪价值互动等系列剧本。',
    status: '产出聚焦交互方案、语料建设与内容策划',
  },
] as const;

export const site = {
  brand: 'Yukie',
  name: '宋雨嘉',
  englishName: 'yukie',
  title: 'Yukie / 宋雨嘉',
  description: 'Yukie 的个人网站，展示 AI 产品经理相关经历、项目与方法。',
  portrait: {
    src: '/profile/yukie.jpg',
    alt: '宋雨嘉的个人照片'
  },
  avatar: {
    src: '/profile/yukie-avatar-cutout.png',
    alt: '宋雨嘉的数字人形象'
  },
  contact: {
    qrSrc: '/contact/wechat-qr.jpg',
    title: 'upup!🚩',
    location: '湖南 长沙',
    caption: '扫描二维码，添加我为朋友。'
  },
  hero: {
    title: 'AI产品经理 / 产品经理',
    body: '关注生成式AI与智能工作流在真实业务场景中的落地，善于从用户需求与业务流程出发，将复杂问题转化为可验证、可复用的产品方案。'
  },
  navItems: [
    { href: '#top', label: '首页' },
    { href: '#experience', label: '实习经历' },
    { href: '#projects', label: '项目与产出' },
    { href: '#skills', label: '能力与方法' },
    { href: '#about', label: '关于我' },
    { href: '#resume', label: '简历' }
  ],
  sections: [
    { id: 'experience', title: '实习经历' },
    { id: 'projects', title: '项目与产出' },
    { id: 'skills', title: '能力与方法' },
    { id: 'about', title: '关于我' },
    { id: 'resume', title: '简历' }
  ]
} as const;

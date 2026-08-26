export const site = {
  brand: 'YUKIE',
  name: '宋雨嘉',
  englishName: 'yukie',
  title: '宋雨嘉 / yukie',
  description: '宋雨嘉的个人网站，记录实习经历、项目与产出、能力与方法和简历。',
  portrait: {
    src: '/profile/yukie.jpg',
    alt: '宋雨嘉的个人照片'
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

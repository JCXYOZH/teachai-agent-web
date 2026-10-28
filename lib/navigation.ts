import {
  BookOpenText,
  LibraryBig,
  Settings2,
  SquarePen,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  caption: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/library', label: '课程档案', caption: 'Library', icon: LibraryBig },
  { href: '/create', label: '准备新课程', caption: 'Compose', icon: SquarePen },
  { href: '/knowledge', label: '素材书架', caption: 'Sources', icon: BookOpenText },
  { href: '/settings', label: '设置', caption: 'Settings', icon: Settings2 },
];

export const PAGE_META: Record<string, { eyebrow: string; title: string }> = {
  '/library': { eyebrow: 'Library / 课程档案', title: '备课桌' },
  '/create': { eyebrow: 'Compose / 新课程', title: '准备新课程' },
  '/knowledge': { eyebrow: 'Sources / 素材书架', title: '素材与知识' },
  '/settings': { eyebrow: 'Settings / 设置', title: '账户与工作台' },
};

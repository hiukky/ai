import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import type { MDXComponents } from 'mdx/types';
import { LayoutGrid, ListChecks, PackagePlus, Zap } from 'lucide-react';
import { InstallCommand } from './install-command';
import {
  InvokeBadge,
  PluginCards,
  PluginHeader,
  PluginResources,
  PluginSkills,
  SkillTable,
} from './catalog';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Tabs,
    Tab,
    Files,
    File,
    Folder,
    InstallCommand,
    // Card icons. Add one here before using it in a page.
    LayoutGrid,
    ListChecks,
    PackagePlus,
    Zap,
    // Catalog components: these read the repository at build time, so an MDX
    // page never restates a skill list it would then have to keep in step.
    PluginCards,
    PluginHeader,
    PluginSkills,
    PluginResources,
    SkillTable,
    InvokeBadge,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}

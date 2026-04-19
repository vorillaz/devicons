import { useCallback } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { Badge } from '../ui/badge';
import { InstallTabs } from '../ui/install-tabs';
import {
  IconPreviewGrid,
  PreviewControls,
  useIconPreviewState,
} from '../icons/icon-preview-grid';
import type { IconEntry } from '@/hooks/search';

function DrawerBody({ icon }: { icon: IconEntry }) {
  const { variant, setVariant, bg, setBg } = useIconPreviewState();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="type-h2 truncate">{icon.name}</h2>
          <a
            href={`/icons/${icon.id}`}
            data-astro-prefetch="viewport"
            className="font-mono text-xs font-semibold uppercase tracking-[0.18em] leading-none text-accent hover:text-accent-hover transition-colors shrink-0">
            Full page
          </a>
        </div>
        {icon.description && (
          <p className="type-body-sm mt-1">{icon.description}</p>
        )}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {icon.deprecated && <Badge variant="destructive">Dead</Badge>}
          {icon.version && <Badge variant="neutral">{icon.version}</Badge>}
          {icon.tags?.map((tag: string) => (
            <Badge key={tag} variant="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <PreviewControls
        variant={variant}
        onVariantChange={setVariant}
        bg={bg}
        onBgChange={setBg}
      />

      <div className="mb-6 sm:mb-8">
        <IconPreviewGrid
          icons={icon.icons ?? []}
          name={icon.name}
          variant={variant}
          bg={bg}
          badInDark={icon.badInDark}
          badInLight={icon.badInLight}
          gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
          tilePaddingClassName="p-4 sm:p-6"
          iconMaxClassName=""
        />
      </div>

      <InstallTabs
        icons={icon.icons?.length ? icon.icons : [icon.id]}
        mono={variant === 'font'}
      />
    </div>
  );
}

interface SearchDrawerProps {
  allIcons: IconEntry[];
}

export function SearchDrawer({ allIcons }: SearchDrawerProps) {
  const [iconParam, setIcon] = useQueryState('icon', parseAsString);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setIcon(null);
    },
    [setIcon],
  );

  const icon = iconParam
    ? (allIcons.find(i => i.id === iconParam) ?? null)
    : null;

  return (
    <Drawer
      open={!!iconParam}
      onOpenChange={handleOpenChange}
      shouldScaleBackground={false}
      noBodyStyles
      disablePreventScroll={false}>
      <DrawerContent className="bg-bg border-t border-border max-h-[95vh] sm:max-h-[85vh]">
        <div className="sr-only">
          <DrawerHeader>
            <DrawerTitle>Icon Preview</DrawerTitle>
            <DrawerDescription>
              Preview and usage for the selected icon
            </DrawerDescription>
          </DrawerHeader>
        </div>
        <div className="overflow-y-auto">
          {icon && <DrawerBody icon={icon} />}
        </div>
        <DrawerFooter />
      </DrawerContent>
    </Drawer>
  );
}

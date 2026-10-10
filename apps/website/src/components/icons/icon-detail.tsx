import {
  IconPreviewGrid,
  PreviewControls,
  useIconPreviewState,
} from './icon-preview-grid';
import { InstallTabs } from '../ui/install-tabs';

interface IconDetailProps {
  name: string;
  icons: string[];
  slug: string;
  badInDark?: boolean;
  badInLight?: boolean;
}

export function IconDetail({
  name,
  icons,
  slug,
  badInDark,
  badInLight,
}: IconDetailProps) {
  const previewState = useIconPreviewState();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <section aria-label="Preview">
        <div className="icon-preview__bar">
          <span className="icon-preview__eyebrow">Preview</span>
          <PreviewControls
            variant={previewState.variant}
            onVariantChange={previewState.setVariant}
            bg={previewState.bg}
            onBgChange={previewState.setBg}
          />
        </div>
        <IconPreviewGrid
          icons={icons}
          name={name}
          variant={previewState.variant}
          bg={previewState.bg}
          badInDark={badInDark}
          badInLight={badInLight}
          gridClassName="icon-preview__grid"
          tilePaddingClassName="p-6 sm:p-8"
          iconMaxClassName="icon-preview__logo"
        />
      </section>
      <div className="icon-preview__usage">
        <InstallTabs
          icons={icons.length > 0 ? icons : [slug]}
          mono={previewState.variant === 'font'}
        />
      </div>
    </div>
  );
}

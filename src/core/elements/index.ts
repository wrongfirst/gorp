import { layoutElements } from './layout';
import { controlElements } from './controls';
import { brandingElements } from './branding';
import { settingsElements } from './settings';
import { chatElements } from './chat';
import { speedrunElements } from './speedrun';
import { shortcutElements } from './shortcuts';
import { resetProgressElements } from './resetProgress';
import { commandPaletteElements } from './commandPalette';

export type ElementsType = typeof layoutElements &
    typeof controlElements &
    typeof brandingElements &
    typeof settingsElements &
    typeof chatElements &
    typeof speedrunElements &
    typeof shortcutElements &
    typeof resetProgressElements &
    typeof commandPaletteElements;

export const elements: ElementsType = Object.defineProperties(
    {} as ElementsType,
    {
        ...Object.getOwnPropertyDescriptors(layoutElements),
        ...Object.getOwnPropertyDescriptors(controlElements),
        ...Object.getOwnPropertyDescriptors(brandingElements),
        ...Object.getOwnPropertyDescriptors(settingsElements),
        ...Object.getOwnPropertyDescriptors(chatElements),
        ...Object.getOwnPropertyDescriptors(speedrunElements),
        ...Object.getOwnPropertyDescriptors(shortcutElements),
        ...Object.getOwnPropertyDescriptors(resetProgressElements),
        ...Object.getOwnPropertyDescriptors(commandPaletteElements),
    }
);

export default elements;
export { byId } from './helpers';


import type { FamilyExamples } from '../example';
import { buttons } from './buttons';
import { calendar } from './calendar';
import { charts } from './charts';
import { iconButtons } from './icon-buttons';
import { input } from './input';
import { lists } from './lists';
import { navigation } from './navigation';
import { progress } from './progress';
import { sliders } from './sliders';
import { values } from './values';
import { views } from './views';

export const EXAMPLES: FamilyExamples = { ...buttons, ...iconButtons, ...input, ...sliders, ...progress, ...values, ...lists, ...charts, ...calendar, ...views, ...navigation };

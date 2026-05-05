import { globalThresholds } from '../config/global_thresholds.js';
import { hropsFoodScenario } from '../applications/hrops_food.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: globalThresholds,
};

export default function () {
  hropsFoodScenario();
}

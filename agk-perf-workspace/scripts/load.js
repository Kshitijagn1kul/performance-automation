import { globalThresholds } from '../config/global_thresholds.js';
import { hropsFoodScenario } from '../applications/hrops_food.js';

export const options = {
  scenarios: {
    hrops_food_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 10 },
        { duration: '3m', target: 10 },
        { duration: '1m', target: 25 },
        { duration: '5m', target: 25 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: globalThresholds,
};

export default function () {
  hropsFoodScenario();
}

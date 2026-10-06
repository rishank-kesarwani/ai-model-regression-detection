import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('should return healthy status object', () => {
    const health = controller.checkHealth();
    expect(health.status).toBe('ok');
    expect(health.service).toBe('ai-model-regression-detection');
    expect(health.timestamp).toBeDefined();
    expect(health.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should return api health object', () => {
    const health = controller.checkApiHealth();
    expect(health.status).toBe('ok');
  });
});

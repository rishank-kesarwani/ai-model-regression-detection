import { ConfigService } from '@nestjs/config';
import { ServiceApiKeyRegistry } from './service-api-key.registry';

describe('ServiceApiKeyRegistry', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function createRegistry(nodeEnv: string = 'development') {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'nodeEnv') return nodeEnv;
        return undefined;
      }),
    } as unknown as ConfigService;
    return new ServiceApiKeyRegistry(configService);
  }

  it('should dynamically discover and register MODEL_REGRESSION_CLIENT_*_API_KEY', () => {
    process.env.MODEL_REGRESSION_CLIENT_PR_REVIEW_API_KEY = 'secret-pr-review-key-12345';
    process.env.MODEL_REGRESSION_CLIENT_PIPELINE_OBSERVABILITY_API_KEY = 'secret-pipeline-obs-key-67890';

    const registry = createRegistry();
    registry.reloadKeys();

    const services = registry.getRegisteredServices();
    expect(services).toHaveLength(2);
    expect(services.map((s) => s.serviceName)).toContain('pr-review');
    expect(services.map((s) => s.serviceName)).toContain('pipeline-observability');

    const prReviewAuth = registry.validateKey('secret-pr-review-key-12345');
    expect(prReviewAuth.isValid).toBe(true);
    expect(prReviewAuth.serviceName).toBe('pr-review');

    const pipelineAuth = registry.validateKey('secret-pipeline-obs-key-67890');
    expect(pipelineAuth.isValid).toBe(true);
    expect(pipelineAuth.serviceName).toBe('pipeline-observability');
  });

  it('should ignore empty and whitespace-only keys', () => {
    process.env.MODEL_REGRESSION_CLIENT_EMPTY_API_KEY = '   ';
    process.env.MODEL_REGRESSION_CLIENT_VALID_API_KEY = 'valid-unique-key-abc';

    const registry = createRegistry();
    registry.reloadKeys();

    const services = registry.getRegisteredServices();
    expect(services).toHaveLength(1);
    expect(services[0].serviceName).toBe('valid');
  });

  it('should reject invalid, missing, or mismatched keys', () => {
    process.env.MODEL_REGRESSION_CLIENT_PR_REVIEW_API_KEY = 'super-secret-pr-key';

    const registry = createRegistry();
    registry.reloadKeys();

    expect(registry.validateKey(undefined).isValid).toBe(false);
    expect(registry.validateKey('').isValid).toBe(false);
    expect(registry.validateKey('wrong-key').isValid).toBe(false);
    expect(registry.validateKey('super-secret-pr-key-extra').isValid).toBe(false);
    expect(registry.validateKey('super-secret-pr-ke').isValid).toBe(false);
  });

  it('should reject duplicate API keys configured across distinct services', () => {
    process.env.MODEL_REGRESSION_CLIENT_SERVICE_A_API_KEY = 'shared-secret-key-999';
    process.env.MODEL_REGRESSION_CLIENT_SERVICE_B_API_KEY = 'shared-secret-key-999';

    const registry = createRegistry();
    expect(() => registry.reloadKeys()).toThrow(/Duplicate API key detected/);
  });

  it('should reject placeholder keys in production environment', () => {
    process.env.NODE_ENV = 'production';
    process.env.MODEL_REGRESSION_CLIENT_TEST_API_KEY = 'your-api-key-here';

    const registry = createRegistry('production');
    expect(() => registry.reloadKeys()).toThrow(/Insecure configuration.*placeholder/);
  });

  it('should fail startup in production if service auth enabled but 0 valid keys configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.SERVICE_AUTH_ENABLED = 'true';
    delete process.env.MODEL_REGRESSION_API_KEY;

    // Remove any client keys
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('MODEL_REGRESSION_CLIENT_')) {
        delete process.env[key];
      }
    }

    const registry = createRegistry('production');
    expect(() => registry.reloadKeys()).toThrow(/Fatal configuration error.*no valid MODEL_REGRESSION_CLIENT_/);
  });

  it('should enforce project/tenant scoping correctly', () => {
    process.env.MODEL_REGRESSION_CLIENT_PR_REVIEW_API_KEY = 'pr-review-secret-key';
    process.env.MODEL_REGRESSION_CLIENT_PIPELINE_OBSERVABILITY_API_KEY = 'pipe-secret-key';
    process.env.MODEL_REGRESSION_CLIENT_CUSTOM_API_KEY = 'custom-key';
    process.env.MODEL_REGRESSION_CLIENT_CUSTOM_PROJECTS = 'project-alpha,project-beta';

    const registry = createRegistry();
    registry.reloadKeys();

    expect(registry.isProjectAllowed('pr-review', 'ai-pr-review-platform')).toBe(true);
    expect(registry.isProjectAllowed('pr-review', 'unauthorized-project')).toBe(false);

    expect(registry.isProjectAllowed('pipeline-observability', 'ai-pipeline-observability')).toBe(true);
    expect(registry.isProjectAllowed('pipeline-observability', 'other-pipeline')).toBe(false);

    expect(registry.isProjectAllowed('custom', 'project-alpha')).toBe(true);
    expect(registry.isProjectAllowed('custom', 'project-beta')).toBe(true);
    expect(registry.isProjectAllowed('custom', 'project-gamma')).toBe(false);
  });

  it('should support legacy MODEL_REGRESSION_API_KEY during migration', () => {
    process.env.MODEL_REGRESSION_API_KEY = 'legacy-fallback-key-secret-123';

    const registry = createRegistry();
    registry.reloadKeys();

    const validation = registry.validateKey('legacy-fallback-key-secret-123');
    expect(validation.isValid).toBe(true);
    expect(validation.serviceName).toBe('legacy-client');
  });

  it('should never treat outgoing service credentials as incoming client keys', () => {
    process.env.AI_PLATFORM_MODEL_REGRESSION_API_KEY = 'outgoing-ai-platform-secret';
    process.env.NOTIFICATION_MODEL_REGRESSION_API_KEY = 'outgoing-notification-secret';

    const registry = createRegistry();
    registry.reloadKeys();

    expect(registry.validateKey('outgoing-ai-platform-secret').isValid).toBe(false);
    expect(registry.validateKey('outgoing-notification-secret').isValid).toBe(false);
  });
});

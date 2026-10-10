import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface RegisteredService {
  serviceName: string;
  envVar: string;
  isLegacy: boolean;
  allowedProjects: string[];
}

export interface KeyValidationResult {
  isValid: boolean;
  serviceName?: string;
  roles?: string[];
  allowedProjects?: string[];
}

interface StoredKeyEntry {
  serviceName: string;
  envVar: string;
  keyHash: Buffer; // SHA-256 digest
  isLegacy: boolean;
  allowedProjects: string[];
  roles: string[];
}

@Injectable()
export class ServiceApiKeyRegistry implements OnModuleInit {
  private readonly logger = new Logger(ServiceApiKeyRegistry.name);
  private readonly entries: StoredKeyEntry[] = [];
  private readonly serviceMetadata: RegisteredService[] = [];

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.reloadKeys();
  }

  /**
   * Dynamically discovers and loads all MODEL_REGRESSION_CLIENT_<SERVICE>_API_KEY
   * and supported legacy client credentials from process.env.
   */
  public reloadKeys(): void {
    this.entries.length = 0;
    this.serviceMetadata.length = 0;

    const registeredHashes = new Map<string, string>(); // hashHex -> envVar
    const isProd = (this.configService.get<string>('nodeEnv') || process.env.NODE_ENV) === 'production';
    const isServiceAuthEnabled = process.env.SERVICE_AUTH_ENABLED !== 'false';

    // 1. Dynamic Discovery: MODEL_REGRESSION_CLIENT_<SERVICE>_API_KEY
    for (const [envVar, rawVal] of Object.entries(process.env)) {
      if (!envVar || !rawVal) continue;

      // Exclude outgoing credentials explicitly
      if (
        envVar.startsWith('AI_PLATFORM_') ||
        envVar.startsWith('NOTIFICATION_') ||
        envVar.startsWith('GITHUB_')
      ) {
        continue;
      }

      const match = envVar.match(/^MODEL_REGRESSION_CLIENT_([A-Z0-9_]+)_API_KEY(?:_PREVIOUS)?$/i);
      if (!match) continue;

      const trimmedVal = rawVal.trim();
      if (!trimmedVal) {
        this.logger.warn(`Ignoring empty/whitespace service API key in variable ${envVar}`);
        continue;
      }

      // Check placeholder in production
      if (isProd && this.isPlaceholderKey(trimmedVal)) {
        throw new Error(
          `[ServiceApiKeyRegistry] Insecure configuration: Variable ${envVar} contains a placeholder value in production. You must set a strong, unique secret.`,
        );
      }

      const rawServiceName = match[1];
      const serviceName = this.normalizeServiceName(rawServiceName);
      const allowedProjects = this.resolveAllowedProjects(rawServiceName, serviceName);
      const roles = this.resolveRoles(serviceName);

      const hash = crypto.createHash('sha256').update(trimmedVal).digest();
      const hashHex = hash.toString('hex');

      // Duplicate check across distinct services
      if (registeredHashes.has(hashHex)) {
        const existingVar = registeredHashes.get(hashHex);
        throw new Error(
          `[ServiceApiKeyRegistry] Duplicate API key detected between ${envVar} and ${existingVar}. Each service must have a distinct secret.`,
        );
      }

      registeredHashes.set(hashHex, envVar);

      this.entries.push({
        serviceName,
        envVar,
        keyHash: hash,
        isLegacy: false,
        allowedProjects,
        roles,
      });

      this.serviceMetadata.push({
        serviceName,
        envVar,
        isLegacy: false,
        allowedProjects,
      });

      this.logger.log(
        `Registered internal service client "${serviceName}" from ${envVar} (scoping: ${allowedProjects.join(', ')})`,
      );
    }

    // 2. Backward Compatibility: Support legacy MODEL_REGRESSION_API_KEY if present
    const legacyKey = process.env.MODEL_REGRESSION_API_KEY?.trim();
    if (legacyKey && !this.isPlaceholderKey(legacyKey)) {
      const hash = crypto.createHash('sha256').update(legacyKey).digest();
      const hashHex = hash.toString('hex');

      if (!registeredHashes.has(hashHex)) {
        registeredHashes.set(hashHex, 'MODEL_REGRESSION_API_KEY');
        this.entries.push({
          serviceName: 'legacy-client',
          envVar: 'MODEL_REGRESSION_API_KEY',
          keyHash: hash,
          isLegacy: true,
          allowedProjects: ['*'],
          roles: ['service'],
        });

        this.serviceMetadata.push({
          serviceName: 'legacy-client',
          envVar: 'MODEL_REGRESSION_API_KEY',
          isLegacy: true,
          allowedProjects: ['*'],
        });

        this.logger.warn(
          'Registered legacy fallback service key from MODEL_REGRESSION_API_KEY. ' +
          'Please migrate clients to service-specific MODEL_REGRESSION_CLIENT_<SERVICE>_API_KEY.',
        );
      }
    }

    // 3. Production validation: Enforce that at least one valid key is configured if service auth is enabled
    if (isProd && isServiceAuthEnabled && this.entries.length === 0) {
      throw new Error(
        '[ServiceApiKeyRegistry] Fatal configuration error: Service-to-service authentication is enabled in production, ' +
        'but no valid MODEL_REGRESSION_CLIENT_*_API_KEY environment variables were found. ' +
        'Configure client credentials before starting the application.',
      );
    }
  }

  /**
   * Validates a candidate API key using constant-time comparison against all registered keys.
   * Never exposes or logs the candidate key.
   */
  public validateKey(candidateKey: string | undefined): KeyValidationResult {
    if (!candidateKey || typeof candidateKey !== 'string') {
      return { isValid: false };
    }

    const trimmed = candidateKey.trim();
    if (!trimmed) {
      return { isValid: false };
    }

    const candidateHash = crypto.createHash('sha256').update(trimmed).digest();

    for (const entry of this.entries) {
      if (crypto.timingSafeEqual(candidateHash, entry.keyHash)) {
        return {
          isValid: true,
          serviceName: entry.serviceName,
          roles: entry.roles,
          allowedProjects: entry.allowedProjects,
        };
      }
    }

    return { isValid: false };
  }

  /**
   * Validates whether a service is authorized to operate on the given project name.
   */
  public isProjectAllowed(serviceName: string, targetProject: string | undefined): boolean {
    if (!targetProject) return true; // Global / unspecified project

    const entry = this.entries.find((e) => e.serviceName === serviceName);
    if (!entry) return false;

    if (entry.allowedProjects.includes('*')) {
      return true;
    }

    const normalizedTarget = targetProject.toLowerCase().trim();
    return entry.allowedProjects.some(
      (p) => p.toLowerCase() === normalizedTarget || p.toLowerCase().replace(/_/g, '-') === normalizedTarget.replace(/_/g, '-'),
    );
  }

  /**
   * Returns sanitized metadata for all registered services (no secret keys).
   */
  public getRegisteredServices(): RegisteredService[] {
    return this.serviceMetadata.map((m) => ({ ...m }));
  }

  /**
   * Normalizes raw environment variable token to canonical service name.
   * e.g. PR_REVIEW -> pr-review, PIPELINE_OBSERVABILITY -> pipeline-observability
   */
  private normalizeServiceName(rawToken: string): string {
    const lower = rawToken.toLowerCase().replace(/_/g, '-');
    if (lower === 'pr-review' || lower === 'ai-pr-review' || lower === 'ai-pr-review-platform') {
      return 'pr-review';
    }
    if (lower === 'pipeline-observability' || lower === 'ai-pipeline-observability') {
      return 'pipeline-observability';
    }
    if (lower === 'ci' || lower === 'ci-pipeline') {
      return 'ci';
    }
    return lower;
  }

  /**
   * Resolves default allowed projects for the service.
   * Can be overridden via MODEL_REGRESSION_CLIENT_<NAME>_PROJECTS.
   */
  private resolveAllowedProjects(rawToken: string, normalizedName: string): string[] {
    const customProjectsVar = `MODEL_REGRESSION_CLIENT_${rawToken.toUpperCase()}_PROJECTS`;
    const customAllowedVar = `MODEL_REGRESSION_CLIENT_${rawToken.toUpperCase()}_ALLOWED_PROJECTS`;
    const customProjects = process.env[customProjectsVar]?.trim() || process.env[customAllowedVar]?.trim();

    if (customProjects) {
      return customProjects.split(',').map((p) => p.trim()).filter(Boolean);
    }

    if (normalizedName === 'pr-review') {
      return ['ai-pr-review-platform', 'pr-review', 'default'];
    }
    if (normalizedName === 'pipeline-observability') {
      return ['ai-pipeline-observability', 'pipeline-observability', 'default'];
    }
    if (normalizedName === 'ci' || normalizedName === 'admin') {
      return ['*'];
    }

    return [normalizedName, 'default'];
  }

  /**
   * Resolves roles granted to this service.
   */
  private resolveRoles(normalizedName: string): string[] {
    if (normalizedName === 'ci' || normalizedName === 'admin') {
      return ['service', 'operator', 'admin'];
    }
    return ['service'];
  }

  /**
   * Checks whether a string matches common placeholder patterns.
   */
  private isPlaceholderKey(val: string): boolean {
    const lower = val.toLowerCase();
    return (
      lower.includes('your-') ||
      lower.includes('placeholder') ||
      lower.includes('change-me') ||
      lower.includes('replace-') ||
      lower.includes('todo') ||
      lower.includes('dev-model-regression') ||
      lower === 'test-key' ||
      lower === 'secret' ||
      (val.startsWith('<') && val.endsWith('>'))
    );
  }
}

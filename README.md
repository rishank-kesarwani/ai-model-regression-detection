# AI Model Regression Detection and Evaluation Platform

[![CI](https://github.com/rishank-kesarwani/ai-model-regression-detection/actions/workflows/ci.yml/badge.svg)](https://github.com/rishank-kesarwani/ai-model-regression-detection/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](https://opensource.org/licenses/MIT)
[![Node: >=20](https://img.shields.io/badge/Node-%3E%3D20.0.0-blue.svg)](https://nodejs.org/)
[![TypeScript: 5.7](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![NestJS: 11](https://img.shields.io/badge/NestJS-11-red.svg)](https://nestjs.com/)
[![Next.js: 15](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

Production-grade automated evaluation and regression detection platform for LLMs, prompt versions, and AI applications. Tracks quality, accuracy, latency, cost, structured output schema validity, and safety policies against configurable baselines before production deployment.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement & Motivation](#2-problem-statement--motivation)
3. [System Architecture & High-Level Design (HLD)](#3-system-architecture--high-level-design-hld)
4. [Component Responsibilities](#4-component-responsibilities)
5. [Evaluation Lifecycle](#5-evaluation-lifecycle)
6. [Dataset & Benchmark Architecture](#6-dataset--benchmark-architecture)
7. [Pluggable Evaluation Engine](#7-pluggable-evaluation-engine)
8. [Metrics Architecture & Categories](#8-metrics-architecture--categories)
9. [Baseline Management](#9-baseline-management)
10. [Regression Engine & Decision Policies](#10-regression-engine--decision-policies)
11. [Structured AI Judge](#11-structured-ai-judge)
12. [Statistical Significance & Confidence Intervals](#12-statistical-significance--confidence-intervals)
13. [Dynamic Cost & Token Calculation](#13-dynamic-cost--token-calculation)
14. [Queue & Worker Architecture (Redis & BullMQ)](#14-queue--worker-architecture-redis--bullmq)
15. [Database Schema (MongoDB)](#15-database-schema-mongodb)
16. [Authentication & Access Control](#16-authentication--access-control)
17. [Downstream PR Review Platform Contract](#17-downstream-pr-review-platform-contract)
18. [GitHub PR & CI Integration](#18-github-pr--ci-integration)
19. [Shared AI Platform Integration](#19-shared-ai-platform-integration)
20. [Notification Service Integration](#20-notification-service-integration)
21. [API Reference & Swagger Documentation](#21-api-reference--swagger-documentation)
22. [Frontend Dashboard & UI Architecture](#22-frontend-dashboard--ui-architecture)
23. [Error Handling & API Resilience](#23-error-handling--api-resilience)
24. [Security & Data Retention](#24-security--data-retention)
25. [Deployment Guide (Render & Vercel)](#25-deployment-guide-render--vercel)
26. [Environment Variables](#26-environment-variables)
27. [Local Development Guide](#27-local-development-guide)
28. [Testing Strategy](#28-testing-strategy)
29. [CI/CD Pipeline](#29-cicd-pipeline)
30. [Known Limitations & Future Roadmap](#30-known-limitations--future-roadmap)

---

## 1. Project Overview

The **AI Model Regression Detection and Evaluation Platform** is a specialized LLMOps system designed to prevent unintended quality degradation, latency spikes, cost inflations, schema violations, and safety regressions in AI-powered systems.

Whenever a prompt is modified, a model is upgraded (e.g. GPT-4o-mini to GPT-4o, Claude 3.5 Sonnet to Gemini 1.5 Pro), or application code is updated, this platform executes benchmark test suites against an immutable baseline, conducts statistical hypothesis tests, applies policy threshold rules (`PASS`, `WARN`, `FAIL`), and notifies downstream systems or CI/CD pipelines.

---

## 2. Problem Statement & Motivation

Upgrading LLMs and tweaking system prompts in production applications introduces severe non-deterministic risks:
- **Silent Semantic Regressions**: A prompt change that improves one edge case may inadvertently break 10 other common scenarios.
- **Latency Spikes**: A newer model version may double response latency, exceeding SLA limits.
- **Cost Blowouts**: Unchecked token inflation can 5x the operating cost of high-volume endpoints.
- **Schema & Structured Output Breakage**: Small prompt changes often cause JSON output to fail schema validation.
- **Random Noise Fluctuation**: Declaring a regression based on a tiny random variation on a small sample size leads to noisy alerts.

This platform provides an automated, statistically grounded safeguard that catches regressions before they hit production users.

---

## 3. System Architecture & High-Level Design (HLD)

```mermaid
flowchart TD
    subgraph Clients["Clients & Upstream Integrations"]
        UI["Next.js Web Dashboard"]
        PRReview["ai-pr-review-platform"]
        GitHubAction["GitHub Actions / CI Webhooks"]
    end

    subgraph BackendGateway["NestJS API Gateway (:4000)"]
        Router["API Router (/api/v1)"]
        AuthGuard["Optional JWT Guard"]
        ValPipe["DTO Validation & Sanitization"]
        Swagger["Swagger Docs (/api/docs)"]
    end

    subgraph Modules["Core Platform Modules"]
        DatasetsMod["Datasets & Benchmark Versions"]
        PromptsMod["Prompt Version Registry"]
        BaselinesMod["Baseline Management"]
        EvalMod["Evaluation Orchestrator"]
        RegMod["Regression Policy Engine"]
        ExpMod["A/B Experiments Service"]
    end

    subgraph QueueWorker["Async Execution Layer"]
        RedisQueue[("Redis + BullMQ Queue")]
        WorkerPool["Evaluation Workers"]
    end

    subgraph EvaluatorLib["@ai-model-regression/evaluator"]
        ExactMatch["ExactMatch Evaluator"]
        JSONSchema["JSONSchema Evaluator"]
        Similarity["String Similarity Evaluator"]
        LatencyEval["Latency Evaluator"]
        CostEval["Cost & Pricing Calculator"]
        JudgeEval["LLM AI Judge (Structured)"]
        SafetyEval["Safety & Policy Evaluator"]
        StatsEngine["Statistical Significance Engine"]
    end

    subgraph ExternalServices["External Microservices"]
        AIPlatform["Shared AI Platform (Gateway)"]
        NotifService["Notification Service"]
    end

    subgraph Storage["Persistence Layer"]
        MongoDB[("MongoDB Database")]
    end

    UI --> Router
    PRReview --> Router
    GitHubAction --> Router

    Router --> AuthGuard --> ValPipe
    ValPipe --> DatasetsMod & PromptsMod & BaselinesMod & EvalMod & RegMod & ExpMod

    EvalMod --> RedisQueue
    RedisQueue --> WorkerPool

    WorkerPool --> AIPlatform
    WorkerPool --> EvaluatorLib
    EvaluatorLib --> StatsEngine

    WorkerPool --> Storage
    WorkerPool --> NotifService
    DatasetsMod & BaselinesMod & PromptsMod --> MongoDB
```

---

## 4. Component Responsibilities

| Component | Technology | Primary Responsibilities |
| :--- | :--- | :--- |
| **`evaluator/`** | TypeScript, AJV, Jest | Pure functional evaluators, statistical analysis (Welch t-test, confidence intervals), pricing calculator, baseline comparison, and regression policy engine. |
| **`backend/`** | NestJS, Mongoose, BullMQ, Redis, Passport, Swagger | REST API, async evaluation orchestration, dataset versioning, baseline tracking, PR review contract endpoint, and webhook handling. |
| **`frontend/`** | Next.js 15, React 19, TailwindCSS, Lucide | Interactive dashboards, evaluation reports, baseline promotion visualizer, A/B experiment diffs, and prompt registry. |
| **`AI Platform`** | External Microservice | Centralized model gateway providing completion inferences and AI Judge evaluations via API key authentication. |
| **`Notification Service`** | External Microservice | Centralized alert dispatching (Slack, Email, Webhooks) on regression detection and evaluation failures. |

---

## 5. Evaluation Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Developer
    participant CI as CI / PR Review Platform
    participant API as Backend API
    participant Queue as Redis / BullMQ
    participant Worker as Evaluation Worker
    participant AIP as Shared AI Platform
    participant Engine as Regression Engine
    participant DB as MongoDB
    participant Notif as Notification Service

    CI->>API: POST /api/v1/regression/check
    API->>DB: Fetch Dataset (Version) & Active Baseline
    API->>DB: Create EvaluationRun (Status: QUEUED)
    API->>Queue: Enqueue Evaluation Cases
    Queue->>Worker: Dispatch Case Processing
    loop Each Evaluation Case
        Worker->>AIP: Generate Model Completion
        AIP-->>Worker: Completion, Latency, Token Usage
        Worker->>Engine: Run Evaluators (Exact, Schema, Similarity, Cost, Judge, Safety)
        Worker->>DB: Save EvaluationResult
    end
    Worker->>Engine: Calculate Descriptive Stats (Mean, Median, p95)
    Worker->>Engine: Compare Candidate Metrics vs Baseline
    Engine-->>Worker: Decision (PASS / WARN / FAIL), Delta %, Regressions
    Worker->>DB: Update EvaluationRun (Status: COMPLETED)
    alt Regression Detected (WARN or FAIL)
        Worker->>Notif: Dispatch Alert Event
    end
    Worker-->>API: Return Regression Summary
    API-->>CI: Respond with RegressionCheckResponseDto
```

---

## 6. Dataset & Benchmark Architecture

Datasets represent collections of evaluation test cases with input prompts, reference outputs, expected JSON schemas, categories, and difficulty levels.

### Immutability & Content Hashing
To guarantee absolute reproducibility, every published dataset version is **immutable**:
- A cryptographic **SHA-256 content hash** is computed across all test cases.
- Any modification to test cases requires publishing a new version (e.g., `1.0.0` → `1.1.0`).
- Evaluation runs snapshot the exact dataset version and content hash.

---

## 7. Pluggable Evaluation Engine

The evaluation engine uses an extensible `MetricEvaluator` interface:

```typescript
export interface MetricEvaluator {
  readonly metricName: string;
  readonly category: MetricCategory;
  readonly direction: MetricDirection;
  readonly unit: string;
  readonly isAiJudgeBased: boolean;

  evaluate(context: EvaluatorContext): Promise<SingleMetricResult> | SingleMetricResult;
}
```

### Supported Evaluators
1. **ExactMatchEvaluator**: Strict and normalized string matching.
2. **JSONSchemaEvaluator**: AJV-powered JSON schema validator and structure verification.
3. **StringSimilarityEvaluator**: Composite Levenshtein distance and Jaccard token overlap.
4. **LatencyEvaluator**: Response time tracking per test case.
5. **TokenUsageEvaluator**: Prompt, completion, and total token count calculation.
6. **CostEvaluator**: Estimated cost in USD based on configurable provider pricing metadata.
7. **LLMJudgeEvaluator**: Structured AI evaluation assessing correctness, relevance, and completeness.
8. **SafetyEvaluator**: Harmful pattern detection and safety refusal alignment.
9. **CustomMetricEvaluator**: User-defined regex patterns, length boundaries, and custom scripts.

---

## 8. Metrics Architecture & Categories

| Category | Standard Metric | Direction | Unit | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Quality** | `exact_match` | Higher is Better | `ratio` (0.0 - 1.0) | Strict or normalized output equality |
| **Quality** | `string_similarity` | Higher is Better | `ratio` (0.0 - 1.0) | Composite token and character overlap |
| **Quality** | `ai_judge_score` | Higher is Better | `score` (0.0 - 1.0) | Structured AI judge evaluation |
| **Structured Output**| `json_schema_validity` | Higher is Better | `ratio` (0.0 - 1.0) | Valid JSON adhering to target schema |
| **Performance** | `latency_ms` | Lower is Better | `ms` | Roundtrip response latency |
| **Cost** | `total_tokens` | Lower is Better | `tokens` | Aggregate prompt and completion tokens |
| **Cost** | `estimated_cost_usd` | Lower is Better | `USD` | Real dollar cost computed from pricing |
| **Safety** | `safety_policy_violation`| Lower is Better | `ratio` (0.0 - 1.0) | Unsafe pattern or policy infraction |
| **Reliability** | `error_rate` | Lower is Better | `ratio` (0.0 - 1.0) | Exception or timeout frequency |

---

## 9. Baseline Management

A **Baseline** is an accepted reference evaluation run for a dataset and project.
- **Direction-Aware Comparison**: Evaluates candidate runs against the active baseline metric by metric.
- **Historical Lineage**: Tracks when baselines are promoted, who accepted them, and what prompt/model configurations were locked.
- **Zero-Guessing Auto Resolution**: Candidate runs without an explicit baseline automatically compare against the dataset's active baseline.

---

## 10. Regression Engine & Decision Policies

The regression engine calculates:
- $\text{Delta} = \text{Candidate} - \text{Baseline}$
- $\text{Relative Delta \%} = \frac{\text{Candidate} - \text{Baseline}}{|\text{Baseline}|} \times 100$

### Directional Decision Thresholds

#### 1. Higher is Better (e.g. Accuracy, Exact Match, Schema Validity)
- If Relative Delta $\le \text{Fail Threshold}$ (e.g. $-5.0\%$) $\rightarrow$ `FAIL`
- Else if Relative Delta $\le \text{Warn Threshold}$ (e.g. $-2.0\%$) $\rightarrow$ `WARN`
- Else $\rightarrow$ `PASS`

#### 2. Lower is Better (e.g. Latency, Cost, Token Count, Error Rate)
- If Relative Delta $\ge \text{Fail Threshold}$ (e.g. $+30.0\%$) $\rightarrow$ `FAIL`
- Else if Relative Delta $\ge \text{Warn Threshold}$ (e.g. $+15.0\%$) $\rightarrow$ `WARN`
- Else $\rightarrow$ `PASS`

### Overall Evaluation Decision
$$\text{Overall Decision} = \begin{cases} \text{FAIL} & \text{if any metric triggers FAIL} \\ \text{WARN} & \text{else if any metric triggers WARN} \\ \text{PASS} & \text{otherwise} \end{cases}$$

---

## 11. Structured AI Judge

For subjective semantic evaluations, the AI Judge prompt returns strictly structured JSON:

```json
{
  "score": 0.94,
  "reason": "The candidate answer accurately addresses the question and includes all required technical details.",
  "criteria": {
    "correctness": 0.95,
    "relevance": 0.93,
    "completeness": 0.94
  },
  "confidence": 0.95
}
```

The output is validated by schema guards, with robust heuristic fallbacks in offline or simulated testing environments.

---

## 12. Statistical Significance & Confidence Intervals

To avoid false alarms from random LLM temperature fluctuations:
- **Welch's Two-Sample t-Test**: Computes $t$-statistic, degrees of freedom, and two-tailed $p$-values.
- **Confidence Intervals**: Computes 95% confidence intervals for sample means.
- **Sample Size Validation**: Requires minimum sample sizes before promoting statistical deviations to critical regressions.

---

## 13. Dynamic Cost & Token Calculation

Model pricing is dynamically configurable via the `ModelPricing` catalog:

| Provider | Model | Input / 1M Tokens | Output / 1M Tokens | Currency |
| :--- | :--- | :--- | :--- | :--- |
| `openai` | `gpt-4o` | $2.50 | $10.00 | USD |
| `openai` | `gpt-4o-mini` | $0.15 | $0.60 | USD |
| `anthropic` | `claude-3-5-sonnet` | $3.00 | $15.00 | USD |
| `anthropic` | `claude-3-5-haiku` | $0.80 | $4.00 | USD |
| `google` | `gemini-1.5-pro` | $1.25 | $5.00 | USD |
| `google` | `gemini-1.5-flash` | $0.075 | $0.30 | USD |
| `meta` | `llama-3.3-70b` | $0.59 | $0.79 | USD |
| `deepseek` | `deepseek-v3` | $0.14 | $0.28 | USD |

---

## 14. Queue & Worker Architecture (Redis & BullMQ)

- **Production**: Uses `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` with TLS support.
- **Resilient Fallback**: If Redis is offline during local test runs or small evaluations, the platform seamlessly executes via an asynchronous direct worker runner.
- **Concurrency & Rate Limits**: Configurable concurrency (`EVAL_WORKER_CONCURRENCY=5`) and case timeouts (`EVAL_CASE_TIMEOUT_MS=30000`).

---

## 15. Database Schema (MongoDB)

| Collection | Key Indexed Fields | Purpose |
| :--- | :--- | :--- |
| `datasets` | `project`, `slug` (unique), `createdAt` | Benchmarks and immutable version snapshots |
| `evaluationruns` | `project`, `datasetId`, `status`, `commitSha`, `createdAt` | Executed evaluation runs and reproducibility snapshots |
| `evaluationresults` | `runId`, `caseId` (unique), `isSuccess` | Case-by-case model outputs and metric scores |
| `baselines` | `project`, `datasetId`, `active`, `evaluationRunId` | Active production reference baselines |
| `regressionpolicies`| `project`, `isDefault` | Configurable WARN/FAIL thresholds per metric |
| `prompts` | `project`, `slug` (unique), `createdAt` | Prompts, templates, and SHA-256 hashes |
| `modelpricings` | `provider`, `model` (unique) | Dynamic token pricing metadata |
| `experiments` | `project`, `createdAt` | A/B model/prompt comparison experiments |
| `webhookevents` | `source`, `createdAt` | External GitHub/CI webhook audit logs |

---

## 16. Authentication & Access Control

The platform adheres to portfolio engineering standards:
- **`PUBLIC_ACCESS_ENABLED=true`**:
  - Anonymous / guest users can view public dashboards, run demo evaluations, and inspect metrics.
  - Authenticated users (via JWT access and refresh tokens) can create datasets, promote baselines, update policies, and manage settings.
- **Safe Cookie Storage**: Supports `httpOnly` `access_token` and `refresh_token` cookies with single-refresh auto-retry.

---

## 17. Downstream PR Review Platform Contract

The platform exposes a stable contract consumed by **`ai-pr-review-platform`**:

### Endpoint: `POST /api/v1/regression/check`

#### Request Payload:
```json
{
  "project": "ai-pr-review-platform",
  "version": "2.4.1",
  "datasetId": "customer-support-v1",
  "datasetVersion": "1.0.0",
  "model": "gpt-4o",
  "provider": "openai",
  "promptVersion": "1.2.0",
  "baselineId": "prod-v2-baseline",
  "metrics": ["exact_match", "string_similarity", "latency_ms", "estimated_cost_usd", "ai_judge_score"]
}
```

#### Response:
```json
{
  "success": true,
  "data": {
    "status": "PASS",
    "runId": "67a1b2c3d4e5f67890123456",
    "summary": {
      "passed": 8,
      "warnings": 1,
      "failed": 0
    },
    "regressions": [
      {
        "metricName": "exact_match",
        "category": "QUALITY",
        "direction": "HIGHER_IS_BETTER",
        "baselineValue": 0.95,
        "candidateValue": 0.94,
        "delta": -0.01,
        "relativeDeltaPercent": -1.05,
        "warnThresholdPercent": -2.0,
        "failThresholdPercent": -5.0,
        "decision": "PASS",
        "severity": "INFO",
        "unit": "ratio",
        "explanation": "exact_match passed: Candidate (0.94 ratio) vs Baseline (0.95 ratio), delta: -0.01 (-1.05%). Within safe thresholds."
      }
    ]
  }
}
```

---

## 18. GitHub PR & CI Integration

### Endpoint: `POST /api/v1/github/evaluations`
Receives GitHub PR events (`repository`, `pullRequest`, `commitSha`, evaluation configuration) to trigger PR checks and report status back to GitHub checks.

---

## 19. Shared AI Platform Integration

- Utilizes the portfolio shared AI Platform for model abstraction.
- Authenticates using `AI_PLATFORM_MODEL_REGRESSION_API_KEY`.
- Includes high-fidelity fallback generation for sandbox/offline execution.

---

## 20. Notification Service Integration

- Dispatches real-time alerts using `NOTIFICATION_MODEL_REGRESSION_API_KEY`.
- Events:
  - `EVALUATION_COMPLETED`
  - `REGRESSION_DETECTED` (Warning thresholds breached)
  - `SEVERE_REGRESSION_DETECTED` (Critical metric failures)
  - `EVALUATION_FAILED`
  - `SCHEDULED_EVALUATION_SUMMARY`

---

## 21. API Reference & Swagger Documentation

Interactive Swagger API docs are available at:
```
http://localhost:4000/api/docs
```

### Core Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check endpoint for Render/orchestration |
| `POST`| `/api/v1/auth/login` | Authenticate and receive JWT tokens |
| `POST`| `/api/v1/datasets` | Create evaluation dataset |
| `GET` | `/api/v1/datasets` | List all datasets |
| `GET` | `/api/v1/datasets/:id` | Get dataset details and cases |
| `POST`| `/api/v1/evaluations` | Trigger evaluation run |
| `GET` | `/api/v1/evaluations` | List recent evaluation runs |
| `GET` | `/api/v1/evaluations/:id` | Get evaluation run summary & regressions |
| `POST`| `/api/v1/evaluations/:id/cancel` | Cancel active evaluation run |
| `POST`| `/api/v1/baselines` | Promote run to baseline |
| `GET` | `/api/v1/baselines` | List all baselines |
| `POST`| `/api/v1/regression/check`| PR review regression check contract |
| `GET` | `/api/v1/regression/history`| Historical regression incidents |
| `POST`| `/api/v1/experiments` | Run A/B model/prompt comparison |
| `GET` | `/api/v1/models/pricing` | Get model pricing catalog |
| `GET` | `/api/v1/metrics` | List all registered evaluators & metrics |

---

## 22. Frontend Dashboard & UI Architecture

Built with **Next.js 15 App Router**, **React 19**, and **TailwindCSS**:
- **Dashboard (`/`)**: High-level regression summary, PASS/WARN/FAIL badge, latency/quality/cost trend charts, baseline comparison.
- **Datasets (`/datasets`, `/datasets/[id]`)**: Benchmark management, test cases viewer, JSON schema inspector, SHA-256 hashes.
- **Evaluations (`/evaluations`, `/evaluations/[id]`)**: Evaluation triggers, real-time status, case-by-case outputs, token/latency breakdown.
- **Baselines (`/baselines`)**: Active production baseline switcher and promotion modal.
- **Regressions (`/regressions`)**: Dedicated incident triage with filtering by severity (`CRITICAL`, `HIGH`, `MEDIUM`).
- **Experiments (`/experiments`)**: Side-by-side A/B model & prompt comparison diffs.
- **Prompts (`/prompts`)**: System and user prompt version registry.
- **Models (`/models`)**: Configurable provider token pricing catalog.
- **Policies (`/policies`)**: Threshold policy rules and WARN/FAIL definitions.
- **Settings (`/settings`)**: Downstream contract specs, service keys, and retention policies.

### API URL Normalization
The frontend API client automatically normalizes `NEXT_PUBLIC_API_URL`:
- Handles `https://backend.example.com`
- Handles `https://backend.example.com/api/v1`
- Strips trailing slashes without ever generating duplicated `/api/v1/api/v1`.

---

## 23. Error Handling & API Resilience

- **Global Exception Filter**: Standardized JSON error structure with error codes and sanitized messages.
- **Timeout Interceptor**: Cancels requests exceeding 60 seconds with `RequestTimeoutException`.
- **Safe Logging**: Never logs API keys, JWT secrets, Redis credentials, or raw sensitive customer prompts.
- **Single Refresh Retry**: Automatically attempts token refresh on 401 Unauthorized responses before failing.

---

## 24. Security & Data Retention

- **Helmet**: Secures HTTP response headers.
- **CORS**: Explicit origins, methods, and credential handling.
- **Data Retention**: Configurable result retention (`DATA_RETENTION_DAYS=90`) with endpoints for result, run, and dataset deletion.

---

## 25. Deployment Guide (Render & Vercel)

### Backend Deployment on Render
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`
- **Environment**:
  - `PORT`: Handled automatically via `process.env.PORT`
  - Host binding: `0.0.0.0`
  - Health Check Path: `/health`

### Frontend Deployment on Vercel
- **Root Directory**: `frontend`
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Environment Variable**: `NEXT_PUBLIC_API_URL=https://<backend-app>.onrender.com/api/v1`

---

## 26. Environment Variables

See [.env.example](file:///.env.example) for a complete reference:

```env
PORT=4000
HOST=0.0.0.0
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://default:...
JWT_SECRET=super-secret-jwt-key...
PUBLIC_ACCESS_ENABLED=true
AI_PLATFORM_BASE_URL=https://ai-platform.example.com/api/v1
AI_PLATFORM_MODEL_REGRESSION_API_KEY=mr_aip_live_secret_key_...
NOTIFICATION_SERVICE_BASE_URL=https://notifications.example.com/api/v1
NOTIFICATION_MODEL_REGRESSION_API_KEY=mr_notif_live_secret_key_...
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## 27. Local Development Guide

### Prerequisites
- Node.js $\ge 20.0.0$
- npm $\ge 10.0.0$
- MongoDB & Redis (optional, local fallbacks provided)

### Setup & Run
```bash
# Clone the repository
git clone https://github.com/rishank-kesarwani/ai-model-regression-detection.git
cd ai-model-regression-detection

# Install all workspace dependencies
npm install

# Build all packages (evaluator, backend, frontend)
npm run build

# Run all unit and integration tests
npm test

# Start the backend server (:4000)
npm run dev:backend

# Start the frontend UI (:3000)
npm run dev:frontend
```

---

## 28. Testing Strategy

The repository includes comprehensive Jest test suites covering:
- ExactMatch, JSONSchema, StringSimilarity, Latency, TokenUsage, Cost, LLMJudge, Safety, and Custom evaluators
- Descriptive statistics, confidence intervals, and Welch t-test statistical significance
- Baseline comparison and threshold policies (higher-is-better drops, lower-is-better spikes, PASS/WARN/FAIL)
- Health endpoints, authentication, dataset creation, evaluation lifecycle, and PR regression check contract

```bash
# Run all tests
npm test
```

---

## 29. CI/CD Pipeline

Automated via GitHub Actions in [.github/workflows/ci.yml](file:///.github/workflows/ci.yml):
- Matrix testing on Node 20.x and 22.x
- Builds `evaluator`, `backend`, and `frontend`
- Runs all unit and integration tests
- Validates production bundle generation without requiring external production secrets

---

## 30. Known Limitations & Future Roadmap

1. **Synthetic Data Augmentation**: Future support for auto-generating perturbation test cases (typos, adversarial prompts, edge-case perturbations).
2. **Distributed Multi-GPU Judges**: Integration with local self-hosted open-weight judge models (e.g. Prometheus 2, Llama-3-70B-Instruct).
3. **Automated Rollbacks**: Direct integration with feature flag providers (LaunchDarkly / Unleash) to automatically disable regressed prompt versions.

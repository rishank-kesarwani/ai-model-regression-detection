import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { BaseMetricEvaluator, EvaluatorContext } from './base.evaluator';
import { MetricCategory, MetricDirection, StandardMetricName, SingleMetricResult } from '../types/metric.types';

export class JSONSchemaEvaluator extends BaseMetricEvaluator {
  readonly metricName = StandardMetricName.JSON_SCHEMA_VALIDITY;
  readonly category = MetricCategory.STRUCTURED_OUTPUT;
  readonly direction = MetricDirection.HIGHER_IS_BETTER;
  readonly unit = 'ratio';

  private ajv: Ajv;

  constructor() {
    super();
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  evaluate(context: EvaluatorContext): SingleMetricResult {
    const rawOutput = context.modelOutput;
    const schema = context.evaluationCase.expectedJsonSchema;

    if (!schema) {
      // If no schema specified, test if the output is valid JSON
      try {
        JSON.parse(this.extractJson(rawOutput));
        return this.createResult(1.0, 'Valid JSON without custom schema', { parsed: true });
      } catch (err: any) {
        return this.createResult(0.0, `Failed to parse JSON: ${err.message}`, {
          parsed: false,
          error: err.message,
        });
      }
    }

    let parsedJson: any;
    try {
      const extracted = this.extractJson(rawOutput);
      parsedJson = JSON.parse(extracted);
    } catch (err: any) {
      return this.createResult(0.0, `Malformed JSON: ${err.message}`, {
        parsed: false,
        schemaValid: false,
        error: err.message,
      });
    }

    try {
      const validate = this.ajv.compile(schema);
      const valid = validate(parsedJson);

      if (valid) {
        return this.createResult(1.0, 'Complies with JSON schema', {
          parsed: true,
          schemaValid: true,
          errors: [],
        });
      } else {
        const errorDetails = validate.errors?.map(e => `${e.instancePath} ${e.message}`) || [];
        return this.createResult(0.0, `Schema validation errors: ${errorDetails.join('; ')}`, {
          parsed: true,
          schemaValid: false,
          errors: errorDetails,
        });
      }
    } catch (compileErr: any) {
      return this.createResult(0.0, `Schema compilation error: ${compileErr.message}`, {
        parsed: true,
        schemaValid: false,
        error: compileErr.message,
      });
    }
  }

  private extractJson(text: string): string {
    if (!text) return '';
    const trimmed = text.trim();
    // Check markdown code blocks
    const jsonBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      return jsonBlockMatch[1].trim();
    }
    // Check first { or [ to last } or ]
    const firstBrace = trimmed.indexOf('{');
    const firstBracket = trimmed.indexOf('[');
    const start = firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);

    const lastBrace = trimmed.lastIndexOf('}');
    const lastBracket = trimmed.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);

    if (start !== -1 && end !== -1 && end > start) {
      return trimmed.substring(start, end + 1);
    }
    return trimmed;
  }
}

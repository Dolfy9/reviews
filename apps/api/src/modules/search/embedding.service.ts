import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FlagEmbedding, EmbeddingModel } from "fastembed";
import { Env } from "../../config/env.schema";

@Injectable()
export class EmbeddingService implements OnModuleDestroy {
  private readonly logger = new Logger(EmbeddingService.name);
  private model: FlagEmbedding | null = null;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService<Env>) {
    this.enabled = this.config.get("SEMANTIC_SEARCH_ENABLED") ?? false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async embedQuery(text: string): Promise<number[] | null> {
    if (!this.enabled) {
      return null;
    }
    try {
      const model = await this.getModel();
      return await model.queryEmbed(text);
    } catch (error) {
      this.logger.warn(`Failed to embed query: ${String(error)}`);
      return null;
    }
  }

  async embedPassage(text: string): Promise<number[] | null> {
    if (!this.enabled) {
      return null;
    }
    try {
      const model = await this.getModel();
      const generator = model.passageEmbed([text]);
      for await (const batch of generator) {
        return batch[0] ?? null;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Failed to embed passage: ${String(error)}`);
      return null;
    }
  }

  async embedPassages(texts: string[]): Promise<number[][] | null> {
    if (!this.enabled || texts.length === 0) {
      return null;
    }
    try {
      const model = await this.getModel();
      const embeddings: number[][] = [];
      const generator = model.passageEmbed(texts);
      for await (const batch of generator) {
        embeddings.push(...batch);
      }
      return embeddings;
    } catch (error) {
      this.logger.warn(`Failed to embed passages: ${String(error)}`);
      return null;
    }
  }

  async onModuleDestroy() {
    this.model = null;
  }

  private async getModel(): Promise<FlagEmbedding> {
    if (this.model) {
      return this.model;
    }
    this.logger.log("Loading local ONNX embedding model...");
    this.model = await FlagEmbedding.init({
      model: EmbeddingModel.BGESmallENV15,
      executionProviders: [],
      maxLength: 512,
    });
    this.logger.log("Embedding model loaded");
    return this.model;
  }
}

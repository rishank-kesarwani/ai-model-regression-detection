import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromptsService } from './prompts.service';
import { PromptsController } from './prompts.controller';
import { Prompt, PromptSchema } from '../schemas/prompt.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Prompt.name, schema: PromptSchema }]),
  ],
  controllers: [PromptsController],
  providers: [PromptsService],
  exports: [PromptsService],
})
export class PromptsModule {}

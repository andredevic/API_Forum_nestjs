import type { Answer } from "../Entities/answer.js";

export interface AnswersRepository{
  create(answer: Answer): Promise<void>
}
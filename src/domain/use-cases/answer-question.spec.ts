import { expect, test } from 'vitest'
import { AnswerQuestionUseCase } from './answer-question.js'
import type { AnswersRepository } from '../repositories/answers-repository.js'
import type { Answer } from '../Entities/answer.js'

const fakAnswerRepository: AnswersRepository = {
  create: async (answer: Answer) => {
    return;
  }
}

test('create an answer', async () =>{
  const answerQuestion = new AnswerQuestionUseCase(fakAnswerRepository)
  const answer = await answerQuestion.execute({
    questionId: '1',
    instructorId: '1',
    content: 'Nova resposta'
  })

  expect(answer.content).toEqual('Nova resposta')
})
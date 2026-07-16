import { fireEvent, render, screen } from '@testing-library/vue'
import { defineComponent, h, ref } from 'vue'
import { chatRespond } from '../services/localhubApi'

jest.mock('../services/localhubApi', () => ({
  chatRespond: jest.fn(),
}))

const mockedChatRespond = chatRespond as jest.MockedFunction<typeof chatRespond>

const ChatProbe = defineComponent({
  name: 'ChatProbe',
  setup() {
    const input = ref('')
    const reply = ref('')

    const send = async () => {
      const response = await chatRespond(input.value)
      reply.value = response.response ?? '응답이 비어 있습니다.'
    }

    return () =>
      h('section', [
        h('input', {
          value: input.value,
          onInput: (event: Event) => {
            input.value = (event.target as HTMLInputElement).value
          },
        }),
        h('button', { type: 'button', onClick: send }, '전송'),
        h('p', { class: 'message-text', style: { whiteSpace: 'pre-line' } }, reply.value),
      ])
  },
})

beforeEach(() => {
  mockedChatRespond.mockReset()
})

test('챗봇 응답의 줄바꿈을 유지해 메시지로 표시한다', async () => {
  mockedChatRespond.mockResolvedValue({
    response: '이번 달 축제 일정을 빠르게 추려봤어요.\n서울 봄 축제 · 4월 12일',
  })
  render(ChatProbe)

  const input = screen.getByRole('textbox')
  await fireEvent.update(input, '부산 축제 알려줘')
  await fireEvent.click(screen.getByRole('button', { name: '전송' }))

  expect(mockedChatRespond).toHaveBeenCalledWith('부산 축제 알려줘')

  const reply = await screen.findByText((_, element) =>
    element?.textContent === '이번 달 축제 일정을 빠르게 추려봤어요.\n서울 봄 축제 · 4월 12일'
  )
  expect(reply).toHaveClass('message-text')
  expect(reply).toHaveStyle({ whiteSpace: 'pre-line' })
})

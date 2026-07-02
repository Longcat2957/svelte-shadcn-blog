import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { assertSameOrigin, readJson } from '../../_utils';
import { requireAdmin } from '../../admin/_utils';
import {
    getLLMRouter,
    type CompletionOptions,
    type StreamCompletionOptions
} from '$lib/server/openai-wrapper';
import { llmInputSchema, type LLMInput } from '$lib/server/ai-input';

// ============================================
// 타입 정의
// ============================================

/**
 * 모델 정보 응답 타입
 */
interface ModelInfo {
    id: string;
    name: string;
    description?: string;
    context_length: number | null;
}

/**
 * 모델 목록 응답 타입
 */
interface ModelsResponse {
    models: ModelInfo[];
}

/**
 * LLM 완료 응답 타입
 */
interface LLMCompletionResponse {
    content: string;
    model: string;
}

// ============================================
// API 핸들러
// ============================================

/**
 * GET /api/ai/llm
 *
 * 사용 가능한 모델 목록을 반환합니다.
 */
export const GET = async (event: RequestEvent) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    // 1. Same-origin 검증
    const originError = assertSameOrigin(event);
    if (originError) return originError;

    try {
        // 2. 모델 목록 조회
        const llmRouter = getLLMRouter();
        const models = await llmRouter.listModels();

        const response: ModelsResponse = {
            models: models.map((m) => ({
                id: m.id,
                name: m.name,
                description: m.description,
                context_length: m.context_length
            }))
        };

        return json(response);
    } catch (error) {
        console.error('LLM Models Error:', error);
        return json({ message: 'Failed to fetch models list.' }, { status: 500 });
    }
};

/**
 * POST /api/ai/llm
 *
 * LLM에 채팅 완료 요청을 보냅니다.
 * stream: true인 경우 스트리밍 응답을 반환합니다.
 *
 * Request Body:
 * - userPrompt: string (필수) - 사용자의 요청
 * - systemPrompt?: string - AI의 동작 방식 정의
 * - model?: string - 사용할 모델 (기본값: openai/gpt-4o-mini)
 * - temperature?: number - 생성 다양성 (0-2)
 * - max_tokens?: number - 최대 토큰 수
 * - stream?: boolean - 스트리밍 여부
 */
export const POST = async (event: RequestEvent) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    // 1. Same-origin 검증
    const originError = assertSameOrigin(event);
    if (originError) return originError;

    // 2. JSON 바디 파싱
    const body = await readJson(event);
    if (body instanceof Response) return body;

    const parsed = llmInputSchema.safeParse(body);
    if (!parsed.success) {
        return json(
            { message: parsed.error.issues[0]?.message ?? 'Invalid LLM request body.' },
            { status: 400 }
        );
    }
    const input = parsed.data;

    // 4. 메시지 배열 구성 (비즈니스 로직)
    const messages = buildMessages(input.systemPrompt, input.userPrompt);

    // 5. 스트리밍 요청 처리
    if (input.stream) {
        return handleStreamingRequest(messages, input);
    }

    // 6. 일반 요청 처리
    return handleCompletionRequest(messages, input);
};

/**
 * 시스템 프롬프트와 사용자 프롬프트를 메시지 배열로 변환
 */
function buildMessages(systemPrompt: string | undefined, userPrompt: string) {
    const messages: { role: 'system' | 'user'; content: string }[] = [];

    if (systemPrompt?.trim()) {
        messages.push({ role: 'system', content: systemPrompt.trim() });
    }

    messages.push({ role: 'user', content: userPrompt.trim() });

    return messages;
}

/**
 * 일반(Non-streaming) 완료 요청 처리
 */
async function handleCompletionRequest(messages: ReturnType<typeof buildMessages>, body: LLMInput) {
    try {
        const llmRouter = getLLMRouter();
        const options: CompletionOptions = {
            messages,
            model: body.model,
            temperature: body.temperature,
            max_tokens: body.max_tokens
        };

        const message = await llmRouter.completion(options);

        const response: LLMCompletionResponse = {
            content: message.content ?? '',
            model: body.model ?? 'openai/gpt-4o-mini'
        };

        return json(response);
    } catch (error) {
        console.error('LLM Completion Error:', error);
        return json({ message: 'Failed to generate completion.' }, { status: 500 });
    }
}

/**
 * 스트리밍 완료 요청 처리
 */
async function handleStreamingRequest(messages: ReturnType<typeof buildMessages>, body: LLMInput) {
    try {
        const llmRouter = getLLMRouter();
        const options: StreamCompletionOptions = {
            messages,
            model: body.model,
            temperature: body.temperature,
            max_tokens: body.max_tokens,
            stream: true
        };

        const stream = await llmRouter.stream(options);

        // ReadableStream으로 변환
        const readableStream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            // SSE 형식으로 데이터 전송
                            const data = `data: ${JSON.stringify({ content })}\n\n`;
                            controller.enqueue(encoder.encode(data));
                        }
                    }
                    // 스트림 종료 신호
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    console.error('Streaming Error:', error);
                    controller.error(error);
                }
            }
        });

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive'
            }
        });
    } catch (error) {
        console.error('LLM Stream Error:', error);
        return json({ message: 'Failed to initiate stream.' }, { status: 500 });
    }
}

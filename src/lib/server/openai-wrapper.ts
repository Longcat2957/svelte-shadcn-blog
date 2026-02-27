import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import type { 
    ChatCompletionMessageParam, 
    ChatCompletionCreateParamsNonStreaming, 
    ChatCompletionCreateParamsStreaming 
} from 'openai/resources/chat/completions';

/**
 * ChatCompletionMessageParam 타입 설명
 * 
 * OpenAI Chat Completions API에 전달할 메시지의 형식을 정의하는 유니온 타입입니다.
 * 역할(role)에 따라 다음과 같은 메시지 타입을 사용할 수 있습니다:
 * 
 * @example
 * // 1. System 메시지 - AI의 동작 방식 정의
 * const systemMessage: ChatCompletionMessageParam = {
 *   role: 'system',
 *   content: '당신은 블로그 글을 작성하는 전문 작가입니다.'
 * };
 * 
 * @example
 * // 2. User 메시지 - 사용자의 질문/요청
 * const userMessage: ChatCompletionMessageParam = {
 *   role: 'user',
 *   content: 'SvelteKit의 장점에 대해 설명해주세요.'
 * };
 * 
 * @example
 * // 3. Assistant 메시지 - AI의 이전 응답 (대화 맥락 유지용)
 * const assistantMessage: ChatCompletionMessageParam = {
 *   role: 'assistant',
 *   content: 'SvelteKit의 주요 장점은 다음과 같습니다...'
 * };
 * 
 * @example
 * // 4. User 메시지 with 이미지 (멀티모달)
 * const userMessageWithImage: ChatCompletionMessageParam = {
 *   role: 'user',
 *   content: [
 *     { type: 'text', text: '이 이미지에 대해 설명해주세요.' },
 *     { 
 *       type: 'image_url', 
 *       image_url: { url: 'https://example.com/image.png' } 
 *     }
 *   ]
 * };
 * 
 * @example
 * // 5. Tool 메시지 - 함수 호출 결과
 * const toolMessage: ChatCompletionMessageParam = {
 *   role: 'tool',
 *   tool_call_id: 'call_123',
 *   content: JSON.stringify({ temperature: 25, unit: 'celsius' })
 * };
 * 
 * @example
 * // 6. Assistant 메시지 with tool_calls (함수 호출 요청)
 * const assistantWithToolCalls: ChatCompletionMessageParam = {
 *   role: 'assistant',
 *   content: null,
 *   tool_calls: [{
 *     id: 'call_123',
 *     type: 'function',
 *     function: {
 *       name: 'get_weather',
 *       arguments: '{"location": "Seoul"}'
 *     }
 *   }]
 * };
 * 
 * @example
 * // 실제 사용 예시 - 메시지 배열 구성
 * const messages: ChatCompletionMessageParam[] = [
 *   { role: 'system', content: '당신은 도움이 되는 어시스턴트입니다.' },
 *   { role: 'user', content: '안녕하세요!' },
 *   { role: 'assistant', content: '안녕하세요! 무엇을 도와드릴까요?' },
 *   { role: 'user', content: 'Svelte에 대해 설명해주세요.' }
 * ];
 * 
 * const router = new LLMRouter();
 * const response = await router.completion({ messages });
 */

// OpenRouter Models API 응답 타입
interface OpenRouterModel {
    id: string;
    name: string;
    description?: string;
    context_length: number | null;
    pricing: {
        prompt: number;
        completion: number;
    };
}

interface OpenRouterModelsResponse {
    data: OpenRouterModel[];
}

// OpenAI의 기본 파라미터를 모두 허용하되, model은 선택(optional)으로 변경
export type CompletionOptions = Omit<ChatCompletionCreateParamsNonStreaming, 'model'> & {
    model?: string;
    messages: ChatCompletionMessageParam[];
};

export type StreamCompletionOptions = Omit<ChatCompletionCreateParamsStreaming, 'model'> & {
    model?: string;
    messages: ChatCompletionMessageParam[];
};

export class LLMRouter {
    private client: OpenAI;
    private defaultModel: string;
    private static modelsCache: Map<string, OpenRouterModel> | null = null;
    private static cacheTimestamp: number = 0;
    private static readonly CACHE_TTL = 1000 * 60 * 60; // 1시간
    private static instance: LLMRouter | null = null;

    constructor(defaultModel: string = 'openai/gpt-4o-mini') {
        const apiKey = env.OPENAI_API_KEY ?? env.OPENAI_API;
        
        if (!apiKey) {
            throw new Error('API Key for LLM Router is required in the environment variables.');
        }

        this.defaultModel = defaultModel;

        this.client = new OpenAI({
            baseURL: env.OPENAI_BASE_URL ?? 'https://openrouter.ai/api/v1',
            apiKey: apiKey,
            defaultHeaders: {
                'HTTP-Referer': env.ORIGIN || '',
                'X-OpenRouter-Title': 'SvelteKit App'
            }
        });
    }

    /**
     * OpenRouter에서 사용 가능한 모델 목록을 가져와 캐싱합니다.
     * 캐시가 유효하면 캐시된 데이터를 반환합니다.
     */
    private async fetchAvailableModels(): Promise<Map<string, OpenRouterModel>> {
        const now = Date.now();
        
        // 캐시가 유효하면 반환
        if (LLMRouter.modelsCache && (now - LLMRouter.cacheTimestamp) < LLMRouter.CACHE_TTL) {
            return LLMRouter.modelsCache;
        }

        try {
            const baseURL = env.OPENAI_BASE_URL ?? 'https://openrouter.ai/api/v1';
            const apiKey = env.OPENAI_API_KEY ?? env.OPENAI_API;
            
            const response = await fetch(`${baseURL}/models`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                console.warn('Failed to fetch models list, skipping validation');
                return new Map();
            }

            const data: OpenRouterModelsResponse = await response.json();
            
            const modelsMap = new Map<string, OpenRouterModel>();
            for (const model of data.data) {
                modelsMap.set(model.id, model);
            }

            LLMRouter.modelsCache = modelsMap;
            LLMRouter.cacheTimestamp = now;

            return modelsMap;
        } catch (error) {
            console.warn('Error fetching models list:', error);
            return new Map();
        }
    }

    /**
     * 지정된 모델 ID가 OpenRouter에서 유효한지 확인합니다.
     * @param modelId 확인할 모델 ID (예: 'openai/gpt-4o-mini')
     * @returns 모델이 유효하면 모델 정보, 아니면 null
     * 
     * @example
     * const router = new LLMRouter();
     * const isValid = await router.validateModel('openai/gpt-4o');
     * if (!isValid) {
     *   console.warn('Invalid model specified');
     * }
     */
    async validateModel(modelId: string): Promise<OpenRouterModel | null> {
        const models = await this.fetchAvailableModels();
        return models.get(modelId) ?? null;
    }

    /**
     * 사용 가능한 모든 모델 목록을 반환합니다.
     */
    async listModels(): Promise<OpenRouterModel[]> {
        const models = await this.fetchAvailableModels();
        return Array.from(models.values());
    }

    /**
     * 모델 ID를 검증하고, 유효하지 않으면 defaultModel로 fallback합니다.
     * @returns 검증된 모델 ID
     */
    private async resolveModelId(requestedModel?: string): Promise<string> {
        const modelId = requestedModel || this.defaultModel;
        
        const modelInfo = await this.validateModel(modelId);
        if (modelInfo) {
            return modelId;
        }

        // 요청한 모델이 유효하지 않으면 defaultModel로 fallback
        if (modelId !== this.defaultModel) {
            console.warn(`Model '${modelId}' not found. Falling back to '${this.defaultModel}'`);
            const defaultInfo = await this.validateModel(this.defaultModel);
            if (defaultInfo) {
                return this.defaultModel;
            }
        }

        // defaultModel도 유효하지 않으면 그냥 진행 (API가 처리할 것)
        console.warn(`Default model '${this.defaultModel}' also not found. Proceeding anyway...`);
        return this.defaultModel;
    }

    /**
     * 일반적인(Non-streaming) LLM 응답을 요청합니다.
     * 요청 전 모델 유효성을 검사하고, 유효하지 않으면 defaultModel로 fallback합니다.
     */
    async completion(options: CompletionOptions) {
        const modelId = await this.resolveModelId(options.model);

        try {
            const response = await this.client.chat.completions.create({
                ...options,
                model: modelId,
            });

            return response.choices[0].message;
        } catch (error) {
            console.error('LLM Completion Error:', error);
            throw new Error('Failed to generate completion from LLM service.');
        }
    }

    /**
     * 스트리밍(Streaming) LLM 응답을 요청합니다. 
     * 요청 전 모델 유효성을 검사하고, 유효하지 않으면 defaultModel로 fallback합니다.
     * SvelteKit API Route에서 Response 스트림으로 반환할 때 유용합니다.
     */
    async stream(options: StreamCompletionOptions) {
        const modelId = await this.resolveModelId(options.model);

        try {
            const stream = await this.client.chat.completions.create({
                ...options,
                model: modelId,
                stream: true,
            });

            return stream;
        } catch (error) {
            console.error('❌ LLM Stream Error:', error);
            throw new Error('Failed to initiate stream from LLM service.');
        }
    }

    /**
     * 싱글톤 인스턴스를 반환합니다.
     * 서버 사이드에서 단일 인스턴스를 재사용하여 효율성을 높입니다.
     */
    static getInstance(): LLMRouter {
        if (!LLMRouter.instance) {
            LLMRouter.instance = new LLMRouter();
        }
        return LLMRouter.instance;
    }
}

// 싱글톤 인스턴스 export
export const llmRouter = LLMRouter.getInstance();

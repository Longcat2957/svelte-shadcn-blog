import { env } from '$env/dynamic/private';
import { fal } from '@fal-ai/client';

// ============================================
// 타입 정의
// ============================================

/**
 * fal.ai 큐 상태 타입
 */
export type FalQueueStatus = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

/**
 * fal.ai 이미지 생성 결과의 이미지 항목
 */
export interface FalImage {
    url: string;
    width: number;
    height: number;
    content_type?: string;
}

/**
 * fal.ai 이미지 생성 결과
 */
export interface FalImageResult {
    images: FalImage[];
    timings?: Record<string, number>;
    seed?: number;
    has_nsfw_concepts?: boolean[];
    prompt?: string;
}

/**
 * fal.ai 큐 상태 응답
 */
export interface FalQueueStatusResponse {
    status: FalQueueStatus;
    logs?: Array<{ message: string }>;
    request_id?: string;
}

/**
 * fal.ai 큐 결과 응답
 */
export interface FalQueueResultResponse<T = FalImageResult> {
    data: T;
    requestId: string;
}

/**
 * fal.ai 요청 제출 응답
 */
export interface FalSubmitResponse {
    request_id: string;
    status?: FalQueueStatus;
}

/**
 * fal.ai 입력 옵션 기본 타입
 */
export interface FalInputBase {
    [key: string]: unknown;
}

/**
 * fal.subscribe() 옵션 타입
 */
export interface FalSubscribeOptions<TInput = FalInputBase> {
    input: TInput;
    logs?: boolean;
    webhookUrl?: string;
    onQueueUpdate?: (update: FalQueueStatusResponse) => void;
}

/**
 * fal.queue.submit() 옵션 타입
 */
export interface FalQueueSubmitOptions<TInput = FalInputBase> {
    input: TInput;
    webhookUrl?: string;
}

/**
 * fal.queue.status() 옵션 타입
 */
export interface FalQueueStatusOptions {
    requestId: string;
    logs?: boolean;
}

/**
 * fal.queue.result() 옵션 타입
 */
export interface FalQueueResultOptions {
    requestId: string;
}

/**
 * fal.storage.upload() 결과 타입
 */
export interface FalUploadResult {
    url: string;
}

// ============================================
// FalWrapper 클래스
// ============================================

/**
 * fal.ai API 클라이언트 래퍼
 * 
 * fal.ai의 기본 메서드들을 래핑하여 타입 안전하게 사용할 수 있습니다.
 * 환경 변수 FAL_KEY에서 API 키를 자동으로 로드합니다.
 * 
 * @example
 * // 이미지 생성 (결과까지 대기)
 * const wrapper = new FalWrapper();
 * const result = await wrapper.subscribe<FalImageResult>('fal-ai/flux/schnell', {
 *   input: { prompt: 'A beautiful sunset over the ocean' }
 * });
 * console.log(result.images[0].url);
 * 
 * @example
 * // 큐 사용 (비동기 처리)
 * const { request_id } = await wrapper.queueSubmit('fal-ai/flux/schnell', {
 *   input: { prompt: 'A beautiful sunset over the ocean' }
 * });
 * 
 * // 상태 확인
 * const status = await wrapper.queueStatus('fal-ai/flux/schnell', { requestId: request_id });
 * 
 * // 결과 가져오기
 * if (status.status === 'COMPLETED') {
 *   const result = await wrapper.queueResult<FalImageResult>('fal-ai/flux/schnell', { requestId: request_id });
 *   console.log(result.data.images[0].url);
 * }
 */
export class FalWrapper {
    /**
     * fal.ai 클라이언트 설정 (요청 시점에 lazily 실행)
     * 환경 변수 FAL_KEY에서 API 키를 로드합니다.
     */
    private ensureConfigured(): void {
        const apiKey = env.FAL_API;

        if (!apiKey) {
            throw new Error('fal.ai client is not configured. Set FAL_KEY environment variable.');
        }

        fal.config({
            credentials: apiKey
        });
    }

    /**
     * fal.subscribe() - 요청을 제출하고 결과가 완료될 때까지 대기
     * 
     * 가장 간단한 방법으로, 요청을 제출하고 완료되면 결과를 반환합니다.
     * 진행 상황을 모니터링하려면 onQueueUpdate 콜백을 사용하세요.
     * 
     * @param endpoint - fal.ai 엔드포인트 (예: 'fal-ai/flux/schnell')
     * @param options - 요청 옵션
     * @returns 결과 데이터와 requestId
     * 
     * @example
     * const result = await wrapper.subscribe<FalImageResult>('fal-ai/flux/schnell', {
     *   input: { prompt: 'A cat sitting on a fence' },
     *   logs: true,
     *   onQueueUpdate: (update) => {
     *     if (update.status === 'IN_PROGRESS') {
     *       console.log('Processing...');
     *     }
     *   }
     * });
     */
    async subscribe<TResult = unknown>(
        endpoint: string,
        options: FalSubscribeOptions
    ): Promise<FalQueueResultResponse<TResult>> {
        this.ensureConfigured();

        try {
            const result = await fal.subscribe(endpoint, {
                input: options.input,
                logs: options.logs,
                webhookUrl: options.webhookUrl,
                onQueueUpdate: options.onQueueUpdate
            });

            return {
                data: result.data as TResult,
                requestId: result.requestId
            };
        } catch (error) {
            console.error('fal.subscribe() Error:', error);
            throw new Error(`Failed to subscribe to fal.ai endpoint: ${endpoint}`);
        }
    }

    /**
     * fal.queue.submit() - 큐에 요청을 제출
     * 
     * 장기 실행 요청의 경우 큐에 요청을 제출하고 request_id를 반환받습니다.
     * 결과를 가져오려면 queueStatus()로 상태를 확인한 후 queueResult()를 호출하세요.
     * 
     * @param endpoint - fal.ai 엔드포인트 (예: 'fal-ai/flux/schnell')
     * @param options - 요청 옵션
     * @returns 요청 ID
     * 
     * @example
     * const { request_id } = await wrapper.queueSubmit('fal-ai/flux/dev', {
     *   input: { prompt: 'A dog running in a park' }
     * });
     * console.log('Request submitted:', request_id);
     */
    async queueSubmit<TInput = FalInputBase>(
        endpoint: string,
        options: FalQueueSubmitOptions<TInput>
    ): Promise<FalSubmitResponse> {
        this.ensureConfigured();

        try {
            const result = await fal.queue.submit(endpoint, {
                input: options.input as Record<string, unknown>,
                webhookUrl: options.webhookUrl
            });

            return {
                request_id: result.request_id
            };
        } catch (error) {
            console.error('fal.queue.submit() Error:', error);
            throw new Error(`Failed to submit request to fal.ai endpoint: ${endpoint}`);
        }
    }

    /**
     * fal.queue.status() - 요청 상태 확인
     * 
     * 큐에 제출된 요청의 현재 상태를 확인합니다.
     * 
     * @param endpoint - fal.ai 엔드포인트
     * @param options - 상태 확인 옵션
     * @returns 큐 상태 정보
     * 
     * @example
     * const status = await wrapper.queueStatus('fal-ai/flux/dev', {
     *   requestId: '764cabcf-b745-4b3e-ae38-1200304cf45b',
     *   logs: true
     * });
     * 
     * if (status.status === 'IN_PROGRESS') {
     *   console.log('Still processing...');
     * } else if (status.status === 'COMPLETED') {
     *   console.log('Ready to fetch result');
     * }
     */
    async queueStatus(
        endpoint: string,
        options: FalQueueStatusOptions
    ): Promise<FalQueueStatusResponse> {
        this.ensureConfigured();

        try {
            const status = await fal.queue.status(endpoint, {
                requestId: options.requestId,
                logs: options.logs
            });

            return status as FalQueueStatusResponse;
        } catch (error) {
            console.error('fal.queue.status() Error:', error);
            throw new Error(`Failed to get status for request: ${options.requestId}`);
        }
    }

    /**
     * fal.queue.result() - 요청 결과 가져오기
     * 
     * 완료된 요청의 결과를 가져옵니다. 요청이 완료되지 않은 경우 오류가 발생할 수 있습니다.
     * 
     * @param endpoint - fal.ai 엔드포인트
     * @param options - 결과 요청 옵션
     * @returns 결과 데이터와 requestId
     * 
     * @example
     * const result = await wrapper.queueResult<FalImageResult>('fal-ai/flux/dev', {
     *   requestId: '764cabcf-b745-4b3e-ae38-1200304cf45b'
     * });
     * console.log('Generated image:', result.data.images[0].url);
     */
    async queueResult<TResult = unknown>(
        endpoint: string,
        options: FalQueueResultOptions
    ): Promise<FalQueueResultResponse<TResult>> {
        this.ensureConfigured();

        try {
            const result = await fal.queue.result(endpoint, {
                requestId: options.requestId
            });

            return {
                data: result.data as TResult,
                requestId: result.requestId
            };
        } catch (error) {
            console.error('fal.queue.result() Error:', error);
            throw new Error(`Failed to get result for request: ${options.requestId}`);
        }
    }

    /**
     * fal.storage.upload() - 파일 업로드
     * 
     * 파일을 fal.ai 스토리지에 업로드하고 URL을 반환받습니다.
     * 업로드된 파일 URL은 fal.ai API 요청에서 사용할 수 있습니다.
     * 
     * @param file - 업로드할 파일 (File 객체)
     * @returns 업로드된 파일의 URL
     * 
     * @example
     * const file = new File(['Hello, World!'], 'hello.txt', { type: 'text/plain' });
     * const url = await wrapper.upload(file);
     * console.log('Uploaded file URL:', url);
     */
    async upload(file: File): Promise<FalUploadResult> {
        this.ensureConfigured();

        try {
            const url = await fal.storage.upload(file);
            return { url };
        } catch (error) {
            console.error('fal.storage.upload() Error:', error);
            throw new Error('Failed to upload file to fal.ai storage.');
        }
    }
}

/**
 * FalWrapper 인스턴스를 반환하는 헬퍼 함수
 * 빌드 시점이 아닌 런타임에 인스턴스를 생성합니다.
 */
export function getFalWrapper(): FalWrapper {
    return new FalWrapper();
}

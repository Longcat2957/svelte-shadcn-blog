import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { assertSameOrigin, readJson } from '../../_utils';
import { requireAdmin } from '../../admin/_utils';
import { getFalWrapper, type FalImageResult, type FalQueueStatus } from '$lib/server/fal-wrapper';
import { falRequestIdSchema, t2iInputSchema } from '$lib/server/ai-input';

// ============================================
// 상수
// ============================================

const FAL_ENDPOINT = 'fal-ai/nano-banana-2';

// ============================================
// 타입 정의
// ============================================

/**
 * fal-ai/nano-banana-2 입력 타입
 */
/**
 * fal-ai/nano-banana-2 출력 이미지 타입
 */
interface T2IImage {
    url: string;
    content_type?: string;
    file_name?: string;
    file_size?: number;
    width?: number;
    height?: number;
}

/**
 * fal-ai/nano-banana-2 출력 타입
 */
interface T2IOutput {
    images: T2IImage[];
    description?: string;
}

/**
 * 큐 제출 응답 타입
 */
interface T2ISubmitResponse {
    requestId: string;
    message: string;
}

/**
 * 큐 상태 응답 타입
 */
interface T2IStatusResponse {
    status: FalQueueStatus;
    requestId: string;
}

/**
 * 완료된 결과 응답 타입
 */
interface T2IResultResponse extends T2IOutput {
    status: 'COMPLETED';
    requestId: string;
}

// ============================================
// API 핸들러
// ============================================

/**
 * POST /api/ai/t2i
 *
 * 이미지 생성 요청을 큐에 제출하고 request_id를 반환합니다.
 *
 * Request Body:
 * - prompt: string (필수) - 이미지 생성 프롬프트
 * - num_images?: number - 생성할 이미지 수 (기본값: 1)
 * - 기타 옵션들...
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

    const parsed = t2iInputSchema.safeParse(body);
    if (!parsed.success) {
        return json(
            { message: parsed.error.issues[0]?.message ?? 'Invalid image generation body.' },
            { status: 400 }
        );
    }
    const input = parsed.data;

    // 4. 큐에 요청 제출
    try {
        const falWrapper = getFalWrapper();
        const result = await falWrapper.queueSubmit(FAL_ENDPOINT, {
            input
        });

        const response: T2ISubmitResponse = {
            requestId: result.request_id,
            message: 'Request submitted successfully'
        };

        return json(response);
    } catch (error) {
        console.error('T2I Submit Error:', error);
        return json({ message: 'Failed to submit image generation request.' }, { status: 500 });
    }
};

/**
 * GET /api/ai/t2i?requestId=xxx
 *
 * 큐에 제출된 요청의 상태를 확인하고, 완료된 경우 결과를 반환합니다.
 *
 * Query Parameters:
 * - requestId: string (필수) - POST 요청으로 받은 request_id
 */
export const GET = async (event: RequestEvent) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    // 1. Same-origin 검증
    const originError = assertSameOrigin(event);
    if (originError) return originError;

    // 2. requestId 파라미터 확인
    const parsedRequestId = falRequestIdSchema.safeParse(event.url.searchParams.get('requestId'));
    if (!parsedRequestId.success) {
        return json(
            { message: parsedRequestId.error.issues[0]?.message ?? 'Invalid requestId.' },
            { status: 400 }
        );
    }
    const requestId = parsedRequestId.data;

    try {
        const falWrapper = getFalWrapper();
        // 3. 상태 확인
        const status = await falWrapper.queueStatus(FAL_ENDPOINT, {
            requestId
        });

        // 4. 아직 완료되지 않은 경우 상태만 반환
        if (status.status !== 'COMPLETED') {
            const response: T2IStatusResponse = {
                status: status.status,
                requestId
            };
            return json(response);
        }

        // 5. 완료된 경우 결과 가져오기
        const result = await falWrapper.queueResult<FalImageResult>(FAL_ENDPOINT, {
            requestId
        });

        const response: T2IResultResponse = {
            status: 'COMPLETED',
            requestId,
            images: result.data.images,
            description: result.data.prompt
        };
        return json(response);
    } catch (error) {
        console.error('T2I Status/Result Error:', error);
        return json({ message: 'Failed to get request status or result.' }, { status: 500 });
    }
};

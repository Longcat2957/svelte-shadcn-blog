import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { assertSameOrigin, readJson } from '../../_utils';
import { getFalWrapper, type FalImageResult, type FalQueueStatus } from '$lib/server/fal-wrapper';

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
interface T2IInput {
	prompt: string;
	num_images?: number;
	seed?: number;
	aspect_ratio?: 'auto' | '21:9' | '16:9' | '3:2' | '4:3' | '5:4' | '1:1' | '4:5' | '3:4' | '2:3' | '9:16';
	output_format?: 'jpeg' | 'png' | 'webp';
	safety_tolerance?: '1' | '2' | '3' | '4' | '5' | '6';
	sync_mode?: boolean;
	resolution?: '0.5K' | '1K' | '2K' | '4K';
	limit_generations?: boolean;
	enable_web_search?: boolean;
	[key: string]: unknown;
}

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
	// 1. Same-origin 검증
	const originError = assertSameOrigin(event);
	if (originError) return originError;

	// 2. JSON 바디 파싱
	const body = await readJson<T2IInput>(event);
	if (body instanceof Response) return body;

	// 3. prompt 필수 검증
	if (!body.prompt) {
		return json({ message: 'prompt is required.' }, { status: 400 });
	}

	// 4. 큐에 요청 제출
	try {
		const falWrapper = getFalWrapper();
		const result = await falWrapper.queueSubmit(FAL_ENDPOINT, {
			input: body
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
	// 1. Same-origin 검증
	const originError = assertSameOrigin(event);
	if (originError) return originError;

	// 2. requestId 파라미터 확인
	const requestId = event.url.searchParams.get('requestId');
	if (!requestId) {
		return json({ message: 'requestId is required.' }, { status: 400 });
	}

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

import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { assertSameOrigin } from '../../_utils';
import { requireAdmin } from '../../admin/_utils';
import { getFalWrapper } from '$lib/server/fal-wrapper';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// ============================================
// 타입 정의
// ============================================

/**
 * 업로드 성공 응답 타입
 */
interface UploadSuccessResponse {
    url: string;
    message: string;
}

/**
 * 업로드 실패 응답 타입
 */
interface UploadErrorResponse {
    message: string;
}

// ============================================
// API 핸들러
// ============================================

/**
 * POST /api/ai/upload
 *
 * 파일을 fal.ai 스토리지에 업로드하고 URL을 반환합니다.
 *
 * Request: multipart/form-data
 * - file: File (필수) - 업로드할 파일
 *
 * Response:
 * - url: string - 업로드된 파일의 URL
 * - message: string - 성공 메시지
 */
export const POST = async (event: RequestEvent) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    // 1. Same-origin 검증
    const originError = assertSameOrigin(event);
    if (originError) return originError;

    // 2. FormData 파싱
    let formData: FormData;
    try {
        formData = await event.request.formData();
    } catch {
        const response: UploadErrorResponse = {
            message: 'Invalid form data.'
        };
        return json(response, { status: 400 });
    }
    const file = formData.get('file');

    // 3. file 필수 검증
    if (!file) {
        const response: UploadErrorResponse = {
            message: 'file is required.'
        };
        return json(response, { status: 400 });
    }

    // 4. File 타입 검증
    if (!(file instanceof File)) {
        const response: UploadErrorResponse = {
            message: 'file must be a File object.'
        };
        return json(response, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
        const response: UploadErrorResponse = {
            message: 'Only image files are allowed.'
        };
        return json(response, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
        const response: UploadErrorResponse = {
            message: 'File is too large.'
        };
        return json(response, { status: 400 });
    }

    // 5. 파일 업로드
    try {
        const falWrapper = getFalWrapper();
        const result = await falWrapper.upload(file);

        const response: UploadSuccessResponse = {
            url: result.url,
            message: 'File uploaded successfully'
        };

        return json(response);
    } catch (error) {
        console.error('Upload Error:', error);
        const response: UploadErrorResponse = {
            message: 'Failed to upload file.'
        };
        return json(response, { status: 500 });
    }
};

/**
 * 목 서버가 내주는 업로드 URL 자리. fittingApi.uploadToAzure가 이 값이면
 * PUT을 건너뛴다.
 *
 * mockServer.js와 따로 둔 이유: fittingApi가 이 값 하나 때문에 목 서버
 * 전체를 메인 번들로 끌어오지 않게 하려는 것이다.
 */
export const MOCK_UPLOAD_URL = 'mock://upload'

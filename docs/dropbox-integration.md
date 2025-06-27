# Dropbox 통합 가이드

## 개요
Figma 플러그인에서 AI와 이미지 기반 대화를 위해서는 이미지를 공개적으로 접근 가능한 URL로 변환해야 합니다. Dropbox API를 활용하면 사용자 자신의 계정에 이미지를 저장하고 공유 링크를 생성할 수 있어, 높은 개인정보 보호 수준을 유지하면서 이미지를 AI 모델과 공유할 수 있습니다. 이 접근법은 사용자가 자신의 클라우드 계정을 활용하므로 데이터 소유권을 유지할 수 있다는 장점이 있습니다.

## 기술적 요구사항

### 1. Dropbox API 연동 설정
- Settings 탭에 Dropbox 섹션 추가
  - Dropbox OAuth 인증 버튼
  - 연결 상태 표시 UI
  - 연결 해제 버튼
- OAuth 2.0 인증 흐름 구현
- 토큰 저장 및 갱신 메커니즘

### 2. 이미지 업로드 프로세스
1. Figma 플러그인에서 `exportNodeAsImage`를 통해 이미지 데이터 추출
2. Base64 형식으로 변환된 이미지 데이터를 UI로 전달
3. Dropbox API를 통해 사용자 계정에 이미지 업로드
4. 이미지의 공유 링크 생성 (단축 URL 형태)
5. URL을 플러그인과 소켓 서버로 전달하여 AI에 전송

### 3. 보안 및 프라이버시 관리
- 최소 권한 원칙 적용 (앱 폴더 접근만 요청)
- 이미지 업로드 전 사용자 승인 요청
- 자동 정리 옵션 (선택적 기능)
- 읽기 전용 공유 링크 생성

## Dropbox API 설정 가이드

### 개발자 앱 등록 방법
1. [Dropbox 개발자 콘솔](https://www.dropbox.com/developers/apps) 방문
2. "Create app" 버튼 클릭
3. 앱 설정:
   - API: "Dropbox API" 선택
   - 액세스 유형: "App folder" 선택 (제한된 권한)
   - 앱 이름: 고유한 이름 입력 (예: "FigmaAIConnector")
4. 생성된 앱 설정 페이지에서:
   - "Permissions" 탭에서 필요한 권한 설정:
     - `files.content.write`: 파일 업로드 권한
     - `sharing.write`: 공유 링크 생성 권한
   - "Settings" 탭에서 OAuth 리다이렉트 URL 설정:
     - `https://figma-plugin-redirect.com` 또는 커스텀 URL
   - App key와 App secret 확인

### 주요 API 제한사항
- 기본 계정 저장 용량: 사용자의 Dropbox 계획에 따름
- API 요청 제한: 시간당 앱별 요청 수 (개발자 계정에 따라 다름)
- 파일 크기 제한: 최대 150MB (기본 계정 기준)
- 공유 링크 트래픽: 사용자 계정 티어에 따라 제한될 수 있음

## 구현 단계

### Phase 1: Dropbox API 초기 설정
1. Dropbox JavaScript SDK 추가
   ```html
   <script src="https://unpkg.com/dropbox@10.34.0/dist/Dropbox-sdk.min.js"></script>
   ```

2. 인증 초기화 및 OAuth 흐름 구현
   ```javascript
   // Dropbox 클라이언트 초기화
   function initDropboxClient(appKey) {
     return new Dropbox.Dropbox({
       clientId: appKey,
       // 인증 완료 후 돌아올 URL (Figma 플러그인에서 처리 가능한 URL)
       redirectUri: 'https://figma-plugin-redirect.com'
     });
   }
   
   // OAuth 인증 시작
   function startDropboxAuth() {
     const dbx = initDropboxClient(DROPBOX_APP_KEY);
     // 인증 URL 생성 (state 파라미터를 통해 CSRF 방지)
     const authUrl = dbx.auth.getAuthenticationUrl(
       window.location.href, 
       null, 
       'code', 
       'offline', 
       null, 
       'none', 
       true
     );
     
     // 새 창에서 인증 페이지 열기
     const authWindow = window.open(authUrl, '_blank', 'width=600,height=700');
     
     // 인증 완료 리스너 (postMessage를 통해 받음)
     window.addEventListener('message', (event) => {
       if (event.data.type === 'dropbox-auth') {
         const authCode = event.data.code;
         // 인증 코드로 토큰 교환
         dbx.auth.getAccessTokenFromCode(
           'https://figma-plugin-redirect.com', 
           authCode
         ).then(response => {
           // 토큰 저장
           localStorage.setItem('dropboxAccessToken', response.result.access_token);
           localStorage.setItem('dropboxRefreshToken', response.result.refresh_token);
           
           // 인증 상태 업데이트
           updateAuthStatus(true);
           
           // Figma 코드에 알림
           parent.postMessage({
             pluginMessage: {
               type: 'dropbox-auth-success'
             }
           }, '*');
         }).catch(error => {
           console.error('Dropbox token error:', error);
           updateAuthStatus(false, error.message);
         });
       }
     });
   }
   ```

3. OAuth 리다이렉트 페이지 구현 (별도 호스팅)
   ```html
   <!-- dropbox-redirect.html -->
   <!DOCTYPE html>
   <html>
   <head>
     <title>Dropbox Auth Redirect</title>
   </head>
   <body>
     <script>
       // URL에서 인증 코드 추출
       const urlParams = new URLSearchParams(window.location.search);
       const authCode = urlParams.get('code');
       
       if (authCode) {
         // 부모 창에 메시지 전송
         window.opener.postMessage({
           type: 'dropbox-auth',
           code: authCode
         }, '*');
         // 창 닫기
         window.close();
       } else {
         document.write('인증에 실패했습니다. 창을 닫고 다시 시도해주세요.');
       }
     </script>
   </body>
   </html>
   ```

### Phase 2: 이미지 업로드 구현
1. Dropbox에 이미지 업로드 함수
   ```javascript
   async function uploadToDropbox(imageBytes, fileName) {
     try {
       // 접근 토큰 가져오기
       const accessToken = localStorage.getItem('dropboxAccessToken');
       if (!accessToken) {
         throw new Error('Dropbox 인증이 필요합니다');
       }
       
       // Dropbox 클라이언트 초기화 (토큰 사용)
       const dbx = new Dropbox.Dropbox({
         accessToken: accessToken
       });
       
       // 업로드 경로 설정
       const path = `/${fileName}`;
       
       // 파일 업로드
       const uploadResult = await dbx.filesUpload({
         path: path,
         contents: imageBytes,
         mode: 'overwrite'
       });
       
       // 공유 링크 생성
       const shareResult = await dbx.sharingCreateSharedLinkWithSettings({
         path: uploadResult.result.path_display,
         settings: {
           requested_visibility: 'public'
         }
       });
       
       // 공유 링크 URL 변환 (dl=0을 dl=1로 변경하여 직접 다운로드 URL로 변환)
       const directUrl = shareResult.result.url.replace('dl=0', 'dl=1');
       
       return {
         url: directUrl,
         path: uploadResult.result.path_display
       };
     } catch (error) {
       // 액세스 토큰이 만료된 경우 토큰 갱신 시도
       if (error.status === 401) {
         try {
           await refreshDropboxToken();
           // 갱신 후 재시도
           return uploadToDropbox(imageBytes, fileName);
         } catch (refreshError) {
           throw new Error('Dropbox 토큰 갱신에 실패했습니다: ' + refreshError.message);
         }
       }
       
       console.error('Dropbox upload error:', error);
       throw new Error('Dropbox 업로드 실패: ' + error.message);
     }
   }
   
   // 토큰 갱신 함수
   async function refreshDropboxToken() {
     const refreshToken = localStorage.getItem('dropboxRefreshToken');
     if (!refreshToken) {
       throw new Error('Refresh 토큰이 없습니다. 다시 인증해주세요.');
     }
     
     const dbx = initDropboxClient(DROPBOX_APP_KEY);
     
     const response = await dbx.auth.refreshAccessToken(refreshToken);
     
     // 새 토큰 저장
     localStorage.setItem('dropboxAccessToken', response.result.access_token);
     
     // 새 refresh 토큰이 있으면 저장
     if (response.result.refresh_token) {
       localStorage.setItem('dropboxRefreshToken', response.result.refresh_token);
     }
     
     return response.result.access_token;
   }
   ```

2. Figma 노드 이미지 추출 및 업로드
   ```javascript
   async function exportAndUploadNode(node) {
     try {
       // 노드를 이미지로 추출
       const bytes = await node.exportAsync({
         format: 'PNG',
         constraint: { type: 'SCALE', value: 2 }
       });
       
       // 파일 이름 생성 (고유한 이름 보장)
       const fileName = `figma_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
       
       // UI로 전송
       figma.ui.postMessage({
         type: 'export-complete',
         bytes: Array.from(bytes),
         fileName: fileName,
         nodeName: node.name,
         nodeId: node.id
       });
       
       // 응답 대기
       return new Promise((resolve, reject) => {
         const handler = msg => {
           if (msg.type === 'upload-complete' && msg.nodeId === node.id) {
             figma.ui.off('message', handler);
             resolve(msg.imageUrl);
           } else if (msg.type === 'upload-error' && msg.nodeId === node.id) {
             figma.ui.off('message', handler);
             reject(new Error(msg.error));
           }
         };
         
         figma.ui.on('message', handler);
       });
     } catch (error) {
       console.error('Export and upload error:', error);
       figma.notify('이미지 업로드 오류: ' + error.message, {error: true});
       throw error;
     }
   }
   ```

3. UI에서 업로드 처리
   ```javascript
   // UI에서 이미지 업로드 처리
   async function handleExportedImage(msg) {
     try {
       const bytes = new Uint8Array(msg.bytes);
       
       // 사용자 확인 (옵션)
       if (await confirmUpload(msg.nodeName)) {
         // Dropbox에 업로드
         const result = await uploadToDropbox(bytes, msg.fileName);
         
         // 성공 응답
         parent.postMessage({
           pluginMessage: {
             type: 'upload-complete',
             nodeId: msg.nodeId,
             imageUrl: result.url,
             imagePath: result.path
           }
         }, '*');
       } else {
         parent.postMessage({
           pluginMessage: {
             type: 'upload-cancelled',
             nodeId: msg.nodeId
           }
         }, '*');
       }
     } catch (error) {
       parent.postMessage({
         pluginMessage: {
           type: 'upload-error',
           nodeId: msg.nodeId,
           error: error.message
         }
       }, '*');
     }
   }
   ```

### Phase 3: 인증 상태 및 사용자 인터페이스
1. 인증 상태 관리
   ```javascript
   // 인증 상태 표시 업데이트
   function updateAuthStatus(isAuthenticated, errorMsg = null) {
     const statusElement = document.getElementById('dropbox-auth-status');
     const authButton = document.getElementById('btn-dropbox-auth');
     const logoutButton = document.getElementById('btn-dropbox-logout');
     
     if (isAuthenticated) {
       statusElement.textContent = 'Dropbox에 연결되었습니다';
       statusElement.className = 'status connected';
       authButton.style.display = 'none';
       logoutButton.style.display = 'block';
     } else {
       statusElement.textContent = errorMsg || 'Dropbox 계정 연결이 필요합니다';
       statusElement.className = 'status disconnected';
       authButton.style.display = 'block';
       logoutButton.style.display = 'none';
     }
   }
   
   // 초기 상태 확인
   function checkInitialAuthStatus() {
     const accessToken = localStorage.getItem('dropboxAccessToken');
     updateAuthStatus(!!accessToken);
   }
   
   // 로그아웃 (연결 해제)
   function logoutDropbox() {
     localStorage.removeItem('dropboxAccessToken');
     localStorage.removeItem('dropboxRefreshToken');
     updateAuthStatus(false);
     
     // Figma 코드에 알림
     parent.postMessage({
       pluginMessage: {
         type: 'dropbox-auth-logout'
       }
     }, '*');
   }
   ```

2. 설정 UI 구현
   ```html
   <div class="section">
     <h3>Dropbox 연결</h3>
     <p>이미지를 여러분의 Dropbox 계정에 업로드하고 공유 링크를 생성합니다.</p>
     
     <div id="dropbox-auth-status" class="status disconnected">
       Dropbox 계정 연결이 필요합니다
     </div>
     
     <button id="btn-dropbox-auth" class="primary">Dropbox 계정 연결</button>
     <button id="btn-dropbox-logout" class="secondary" style="display: none;">연결 해제</button>
     
     <div class="help-text">
       <p>연결하면 Figma 플러그인은 Dropbox 앱 폴더 내의 파일만 관리합니다.</p>
     </div>
   </div>
   ```

### Phase 4: MCP 서버 통합
1. 이미지 URL과 함께 AI에 메시지 전송
   ```javascript
   // 이미지 URL과 함께 메시지 전송
   async function sendMessageWithImage(text, node) {
     try {
       // 이미지 업로드
       const imageUrl = await exportAndUploadNode(node);
       
       // MCP 서버에 메시지 전송
       const message = {
         text: text,
         imageUrl: imageUrl,
         context: {
           nodeId: node.id,
           nodeName: node.name,
           nodeType: node.type
         }
       };
       
       // WebSocket으로 메시지 전송
       sendCommand('send-message', message);
       
       figma.notify('이미지와 함께 메시지가 전송되었습니다');
     } catch (error) {
       console.error('Message with image error:', error);
       figma.notify('이미지 메시지 전송 실패: ' + error.message, {error: true});
     }
   }
   ```

## 에러 처리 전략

### 1. 인증 관련 오류
- 인증 실패: "Dropbox 인증에 실패했습니다. 다시 시도해주세요." 메시지 표시
- 토큰 만료: 자동으로 토큰 갱신 시도, 실패 시 "인증이 만료되었습니다. 다시 로그인해주세요." 메시지 표시
- 권한 부족: "Dropbox 앱에 필요한 권한이 없습니다. 연결을 해제하고 다시 인증해주세요." 메시지 표시

### 2. 이미지 업로드 오류
- 네트워크 오류: 최대 3회 자동 재시도 후 실패 시 "네트워크 연결을 확인한 후 다시 시도해주세요." 메시지 표시
- 용량 제한: "이미지 크기가 Dropbox 제한을 초과했습니다. 더 작은 영역을 선택해주세요." 메시지 표시
- 동일 파일명 충돌: 타임스탬프를 파일명에 포함하여 자동으로 해결

### 3. 공유 링크 관련 오류
- 공유 링크 생성 실패: "공유 링크를 생성할 수 없습니다. Dropbox 설정을 확인해주세요." 메시지 표시
- 링크 권한 오류: "공유 링크에 필요한 권한이 없습니다. 앱 권한을 확인해주세요." 메시지 표시

## 테스트 절차

### 1. 인증 및 연결 테스트
- Dropbox 계정 연결 버튼 작동 확인
- OAuth 인증 흐름 정상 작동 확인
- 토큰 갱신 기능 테스트 (만료된 토큰 시뮬레이션)
- 연결 해제 기능 테스트

### 2. 이미지 업로드 테스트
- 소형, 중형, 대형 이미지 업로드 테스트
- 다양한 Figma 노드 유형 업로드 테스트
- 한계 조건 테스트 (매우 큰 이미지, 복잡한 노드)
- 네트워크 지연 및 끊김 상황에서의 동작 테스트

### 3. 통합 테스트
- 전체 흐름 테스트: 인증 → 이미지 추출 → 업로드 → 공유 링크 생성 → AI에 전송
- 여러 이미지 연속 업로드 테스트
- 인증 해제 후 재인증 테스트

## 기대 효과
1. 높은 개인정보 보호: 사용자 자신의 Dropbox 계정에만 데이터 저장
2. 신뢰성: 안정적인 클라우드 서비스 활용으로 데이터 보존 보장
3. 사용자 제어: 사용자가 자신의 계정에서 이미지 관리 가능
4. 대용량 지원: Dropbox의 높은 파일 크기 제한으로 대형 디자인 지원

## 제한사항 및 고려사항
1. 초기 설정 복잡성: OAuth 인증 단계가 추가되어 초기 설정이 다소 복잡함
2. Dropbox 계정 필요: 사용자가 Dropbox 계정을 보유해야 함
3. API 제한: Dropbox API 사용량 제한에 따른 대량 요청 시 제약 가능성
4. 토큰 관리: 사용자 토큰을 안전하게 저장하고 관리해야 함

## 향후 확장 가능성
1. 다른 클라우드 서비스 통합 (Google Drive, OneDrive 등)
2. 업로드된 이미지 관리 인터페이스 제공
3. 이미지 자동 정리 기능 (오래된 이미지 자동 삭제)
4. 팀 공유 기능 (Dropbox Business 계정과 통합)
5. 이미지 최적화 및 압축 옵션 
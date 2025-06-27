# Imgur 통합 가이드

## 개요
Figma 플러그인에서 AI와 이미지 기반 대화를 하기 위해 이미지를 공유 가능한 URL로 변환해야 합니다. Imgur API를 활용하면 사용자 인증 없이도 임시 이미지 호스팅을 구현할 수 있어, 간단하고 효과적인 이미지 공유 솔루션을 제공합니다. 이 접근법은 구현이 단순하며 사용자 경험이 원활하다는 장점이 있습니다.

## 기술적 요구사항

### 1. Imgur API 키 설정
- Settings 탭에 Imgur 섹션 추가
  - Imgur Client ID 입력 필드
  - 설정 저장 및 테스트 버튼
- 클라이언트 저장소를 통한 API 키 저장
- API 키 유효성 검증 로직

### 2. 이미지 업로드 프로세스
1. Figma 플러그인에서 `exportNodeAsImage`를 통해 이미지 데이터 추출
2. Base64 형식으로 변환된 이미지 데이터를 UI로 전달
3. UI에서 Imgur API를 통해 이미지 업로드
4. 업로드된 이미지의 퍼블릭 URL 획득
5. 이미지 삭제를 위한 deleteHash 저장
6. URL을 플러그인과 소켓 서버로 전달하여 AI에 전송

### 3. 프라이버시 및 데이터 관리
- 이미지 업로드 전 사용자 승인 요청
- 업로드된 이미지의 자동 삭제 기능 (7일 후)
- 민감한 정보에 대한 경고 및 가이드라인
- 사용자 데이터 최소화 (필요한 정보만 수집)

## Imgur API 설정 가이드

### API 키 획득 방법
1. [Imgur API 애플리케이션 페이지](https://api.imgur.com/oauth2/addclient) 방문
2. 계정 생성 또는 로그인
3. 새 애플리케이션 등록:
   - OAuth2 없이 "Anonymous usage without user authorization" 선택
   - 애플리케이션 이름 및 간단한 설명 입력
   - 이메일 주소 확인
4. 생성된 Client ID 복사 (Secret은 필요 없음)

### 주요 API 제한사항
- 익명 사용 시간당 요청 제한: 1,250 요청
- 업로드 크기 제한: 10MB
- 지원 포맷: PNG, JPEG, GIF 등 대부분의 이미지 형식
- 이미지 보존 기간: 영구적 (API를 통해 수동 삭제 가능)

## 구현 단계

### Phase 1: Imgur API 통합 준비
1. Settings 탭 UI 확장
   ```html
   <div class="form-group">
     <label for="imgur-client-id">Imgur Client ID</label>
     <input type="text" id="imgur-client-id" placeholder="Enter your Imgur client ID" />
     <button id="btn-test-imgur" class="secondary">Test Connection</button>
     <button id="btn-save-imgur" class="primary">Save Settings</button>
   </div>
   ```

2. API 키 관리 로직 구현
   ```javascript
   // 설정 저장
   async function saveImgurSettings() {
     const clientId = document.getElementById('imgur-client-id').value;
     if (!clientId) {
       showStatus('Imgur Client ID를 입력해주세요', 'error');
       return;
     }
     
     parent.postMessage({
       pluginMessage: {
         type: 'save-imgur-settings',
         clientId: clientId
       }
     }, '*');
   }
   
   // Figma 컨텍스트에서 설정 저장
   if (msg.type === 'save-imgur-settings') {
     await figma.clientStorage.setAsync('imgurClientId', msg.clientId);
     figma.notify('Imgur 설정이 저장되었습니다');
   }
   ```

3. 이미지 업로드 테스트
   ```javascript
   async function testImgurConnection() {
     const clientId = document.getElementById('imgur-client-id').value;
     if (!clientId) {
       showStatus('Imgur Client ID를 입력해주세요', 'error');
       return;
     }
     
     try {
       // 테스트 이미지 (1x1 픽셀)
       const testImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEtAI8T3XfpQAAAABJRU5ErkJggg==";
       
       const result = await uploadToImgur(testImage, clientId);
       
       showStatus(`테스트 성공! <a href="${result.url}" target="_blank">${result.url}</a>`, 'success');
       
       // 테스트 이미지 표시
       const imgPreview = document.createElement('img');
       imgPreview.src = result.url;
       imgPreview.style.maxWidth = '100%';
       imgPreview.style.marginTop = '10px';
       document.getElementById('imgur-status').appendChild(imgPreview);
       
     } catch (error) {
       showStatus(`테스트 실패: ${error.message}`, 'error');
     }
   }
   ```

### Phase 2: 이미지 업로드 파이프라인
1. 이미지 업로드 기능 구현
   ```javascript
   async function uploadToImgur(imageBase64, clientId) {
     // base64 데이터에서 헤더 제거
     const base64Data = imageBase64.split(',')[1];
     
     const response = await fetch('https://api.imgur.com/3/image', {
       method: 'POST',
       headers: {
         'Authorization': `Client-ID ${clientId}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         image: base64Data,
         type: 'base64',
         name: `figma_export_${Date.now()}.png`,
         description: 'Exported from Figma via Cursor AI plugin'
       })
     });
     
     const result = await response.json();
     
     if (!result.success) {
       throw new Error(result.data?.error || '알 수 없는 오류가 발생했습니다');
     }
     
     return {
       url: result.data.link,
       deleteHash: result.data.deletehash
     };
   }
   ```

2. Figma 노드 이미지 추출 및 업로드
   ```javascript
   async function exportAndUploadNode(node) {
     try {
       // 클라이언트 ID 가져오기
       const imgurClientId = await figma.clientStorage.getAsync('imgurClientId');
       if (!imgurClientId) {
         throw new Error('Imgur 클라이언트 ID가 설정되지 않았습니다');
       }
       
       // 노드를 이미지로 추출
       const bytes = await node.exportAsync({
         format: 'PNG',
         constraint: { type: 'SCALE', value: 2 }
       });
       
       // UI로 전송
       figma.ui.postMessage({
         type: 'export-complete',
         bytes: Array.from(bytes),
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
       const blob = new Blob([bytes], { type: 'image/png' });
       
       // base64로 변환
       const base64 = await new Promise((resolve) => {
         const reader = new FileReader();
         reader.onload = () => resolve(reader.result);
         reader.readAsDataURL(blob);
       });
       
       // 사용자 확인 (옵션)
       if (await confirmUpload(msg.nodeName)) {
         // Imgur에 업로드
         const clientId = document.getElementById('imgur-client-id').value;
         const result = await uploadToImgur(base64, clientId);
         
         // 삭제 큐에 추가
         addToDeleteQueue(result.deleteHash);
         
         // 성공 응답
         parent.postMessage({
           pluginMessage: {
             type: 'upload-complete',
             nodeId: msg.nodeId,
             imageUrl: result.url
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

### Phase 3: 이미지 관리 기능
1. 이미지 자동 삭제 기능
   ```javascript
   // 삭제 큐에 추가
   function addToDeleteQueue(deleteHash) {
     const queue = JSON.parse(localStorage.getItem('imgurDeletionQueue') || '[]');
     queue.push({
       deleteHash,
       scheduledTime: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7일 후
     });
     localStorage.setItem('imgurDeletionQueue', JSON.stringify(queue));
   }
   
   // 정기적으로 큐 확인 및 이미지 삭제
   function checkDeletionQueue() {
     const queue = JSON.parse(localStorage.getItem('imgurDeletionQueue') || '[]');
     const now = Date.now();
     let updated = false;
     
     const remaining = queue.filter(item => {
       if (item.scheduledTime <= now) {
         deleteImgurImage(item.deleteHash).catch(console.error);
         updated = true;
         return false;
       }
       return true;
     });
     
     if (updated) {
       localStorage.setItem('imgurDeletionQueue', JSON.stringify(remaining));
     }
   }
   
   // Imgur 이미지 삭제
   async function deleteImgurImage(deleteHash) {
     const clientId = document.getElementById('imgur-client-id').value;
     
     await fetch(`https://api.imgur.com/3/image/${deleteHash}`, {
       method: 'DELETE',
       headers: {
         'Authorization': `Client-ID ${clientId}`
       }
     });
   }
   
   // 삭제 큐 주기적 확인 설정
   setInterval(checkDeletionQueue, 60 * 60 * 1000); // 1시간마다 확인
   ```

2. 이미지 업로드 전 사용자 확인
   ```javascript
   // 업로드 전 사용자 확인
   function confirmUpload(nodeName) {
     return new Promise((resolve) => {
       const dialog = document.createElement('div');
       dialog.className = 'upload-confirm-dialog';
       dialog.innerHTML = `
         <h3>이미지 업로드 확인</h3>
         <p>"${nodeName}" 노드를 Imgur에 업로드하시겠습니까?</p>
         <p class="warning">주의: 민감한 정보가 포함된 이미지는 업로드하지 마세요.</p>
         <div class="buttons">
           <button id="btn-cancel" class="secondary">취소</button>
           <button id="btn-confirm" class="primary">업로드</button>
         </div>
       `;
       
       document.body.appendChild(dialog);
       
       document.getElementById('btn-confirm').addEventListener('click', () => {
         document.body.removeChild(dialog);
         resolve(true);
       });
       
       document.getElementById('btn-cancel').addEventListener('click', () => {
         document.body.removeChild(dialog);
         resolve(false);
       });
     });
   }
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

### 1. API 키 관련 오류
- 누락된 API 키: "Imgur Client ID를 입력해주세요" 메시지 표시
- 잘못된 API 키: "유효하지 않은 Client ID입니다" 메시지 및 API 키 획득 가이드 제공
- API 제한 초과: "API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요" 메시지 표시

### 2. 이미지 업로드 오류
- 네트워크 오류: 최대 3회 자동 재시도 후 실패 시 사용자에게 알림
- 크기 제한 초과: "이미지 크기가 너무 큽니다. 10MB 이하로 조정해주세요" 메시지 표시
- 포맷 오류: "지원되지 않는 이미지 형식입니다. PNG, JPG, GIF 형식만 지원합니다" 메시지 표시

### 3. 이미지 관리 관련 오류
- 삭제 실패: 백그라운드에서 처리하고 사용자에게 표시하지 않음
- 로컬 저장소 오류: 삭제 큐 저장 실패 시 콘솔에 로그 기록

## 테스트 절차

### 1. API 키 검증 테스트
- 유효한 API 키로 테스트 이미지 업로드 시도
- 잘못된 API 키로 테스트 시 적절한 오류 메시지 확인
- API 키 저장 및 로드 기능 검증

### 2. 이미지 업로드 테스트
- 다양한 크기 및 유형의 Figma 노드 업로드 테스트
- 대용량 이미지 처리 테스트 (경계값 테스트)
- 네트워크 상태 변화에 따른 동작 테스트
- 업로드 취소 기능 테스트

### 3. 통합 테스트
- Figma 노드 선택 → 이미지 추출 → 업로드 → URL 획득 → AI에 전송
- 여러 이미지 연속 업로드 테스트
- 이미지 삭제 큐 기능 테스트

## 기대 효과
1. 간편한 설정: 최소한의 설정으로 빠르게 시작 가능
2. 사용자 경험 향상: 복잡한 인증 과정 없이 간편한 이미지 공유
3. 자동 관리: 업로드된 이미지 자동 삭제로 프라이버시 보호
4. 성능: 글로벌 CDN을 활용한 빠른 이미지 로딩

## 제한사항 및 고려사항
1. 서드파티 서비스 의존성: Imgur 서비스 상태에 영향을 받음
2. API 사용량 제한: 대량 사용 시 API 한도 고려 필요
3. 이미지 공개 노출: 업로드된 이미지는 URL로 접근 가능 (민감 정보 주의)
4. 삭제 신뢰성: 이미지 삭제는 클라이언트 측 로직에 의존

## 향후 확장 가능성
1. 다른 이미지 호스팅 서비스 지원 (ImgBB, Cloudinary 등)
2. 이미지 관리 인터페이스 (업로드 이력, 수동 삭제 기능)
3. 이미지 최적화 및 압축 옵션
4. 업로드 전 이미지 편집 기능 (크롭, 리사이즈, 마스킹 등)
5. OCR 통합으로 이미지 내 텍스트 추출 기능 
# Firebase Storage 통합 가이드

## 개요
Figma 플러그인에서 AI와 이미지 기반 대화를 하기 위해서는 이미지를 Claude나 OpenAI가 접근 가능한 형태로 전달해야 합니다. 사용자 개인의 Firebase Storage를 활용하여 이미지를 업로드하고, 퍼블릭 URL을 통해 AI 모델과 소통하는 방식을 구현합니다. 이 방식은 사용자의 이미지 데이터가 자신의 저장소에만 저장되어 보안과 개인정보 보호에 효과적입니다.

## 기술적 요구사항

### 1. Firebase 계정 및 설정 관리
- UI에서 Firebase 설정 입력 UI 구현
  - Settings 탭에 Firebase 섹션 추가
  - 필수 설정값 입력 필드 (apiKey, authDomain, projectId, storageBucket)
  - 설정 저장 및 연결 테스트 버튼
- Google 로그인 인증 흐름 구현
- 로그인 상태 및 연결 상태 표시 UI

### 2. 이미지 업로드 프로세스
1. 사용자 Firebase 계정으로 인증 (Google 계정)
2. Figma 플러그인에서 `exportNodeAsImage`를 통해 이미지 데이터 추출
3. Base64 형식으로 변환된 이미지 데이터를 UI로 전달
4. Firebase Storage에 이미지 직접 업로드
5. 업로드된 이미지의 다운로드 URL 획득 (임시 URL 또는 공개 URL)
6. URL을 플러그인과 소켓 서버로 전달하여 AI에 전송

### 3. 보안 강화 전략
- 사용자별 격리된 저장소 경로 (`/users/{userId}/figma-images/`)
- Firebase Security Rules 가이드 제공
- 선택적 URL 만료 시간 설정 (임시 URL)
- 민감한 정보에 대한 사용자 경고 및 승인 프로세스

## Firebase 설정 가이드

### 프로젝트 설정 방법
1. Firebase 콘솔 (https://console.firebase.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 웹 앱 등록 (⚙️ > 프로젝트 설정 > 앱 추가)
4. Firebase SDK 설정 정보 복사 (플러그인에 입력 필요)
5. Authentication에서 Google 로그인 활성화
6. Storage 서비스 활성화

### 보안 규칙 설정
Storage 규칙을 다음과 같이 설정하여 사용자별 접근 제한:

```javascript
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allImages=**} {
      // 인증된 사용자만 자신의 폴더에 접근 가능
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 주요 설정 옵션
- 스토리지 위치: 사용자 지역에 가까운 리전 선택 (성능 향상)
- CORS 설정: 필요한 도메인 허용 (Figma와 통신 허용)
- 이미지 저장 경로: `/users/{userId}/figma-images/{timestamp}_{nodeName}.png`
- 만료 URL 설정: 기본 1시간, 최대 7일 (보안 수준에 따라 조정)

## 구현 단계

### Phase 1: Firebase SDK 및 인증 통합
1. Firebase JavaScript SDK 통합 (Auth, Storage)
   ```html
   <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-auth.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-storage.js"></script>
   ```

2. 인증 UI 및 로직 구현
   - 로그인/로그아웃 버튼
   - 인증 상태 표시
   - 인증 정보 저장

3. 설정 저장 및 로드 기능 구현
   - 플러그인 내 지속적 저장 (client storage)
   - 설정 검증 로직

### Phase 2: 이미지 업로드 파이프라인
1. 이미지 추출 및 Base64 변환 기능 연결
   ```javascript
   async function exportNodeAsImage(node, scale = 2) {
     const bytes = await node.exportAsync({
       format: 'PNG',
       constraint: { type: 'SCALE', value: scale }
     });
     return bytes;
   }
   ```

2. Firebase Storage 업로드 구현
   ```javascript
   async function uploadToFirebase(imageBytes, fileName) {
     // 로그인 확인
     const user = firebase.auth().currentUser;
     if (!user) throw new Error('Firebase 인증이 필요합니다');
     
     // 이미지 업로드
     const storageRef = firebase.storage().ref();
     const imageRef = storageRef.child(`users/${user.uid}/figma-images/${fileName}`);
     
     // 업로드 및 URL 획득
     await imageRef.put(imageBytes);
     const url = await imageRef.getDownloadURL();
     
     return url;
   }
   ```

3. 업로드 상태 관리 및 UI 피드백
   - 진행 상태 표시
   - 성공/실패 알림
   - 생성된 URL 표시

### Phase 3: MCP 서버 통합
1. 이미지 URL을 MCP 서버로 전달하는 소켓 통신 구현
2. AI 모델과의 통신 프로토콜 수정 (이미지 URL 포함)
3. 업로드된 이미지 관리 기능 추가 (선택 사항)

## 에러 처리 전략

### 1. Firebase 설정 오류
- 누락된 설정 항목: 필수 필드 검사 및 안내 메시지
- 잘못된 API 키: 연결 테스트 실패 시 명확한 오류 메시지
- 권한 문제: Firebase 콘솔에서 필요한 설정 변경 가이드

### 2. 인증 관련 오류
- 인증 실패: 구체적인 오류 메시지와 재시도 옵션
- 세션 만료: 자동 재인증 요청
- 인증 취소: 우아한 오류 처리 및 재시도 옵션

### 3. 이미지 업로드 실패
- 네트워크 오류: 최대 3회 자동 재시도
- 스토리지 할당량 초과: 사용자에게 Storage 계획 업그레이드 안내
- 용량 초과: 이미지 크기 조정 제안 (스케일 다운)
- 타임아웃: 적절한 오류 메시지와 함께 재시도 옵션

## 테스트 절차

### 1. 연결 테스트
- Firebase 설정 정보 검증
- 인증 흐름 테스트
- 간단한 테스트 이미지 업로드

### 2. 통합 테스트
- Figma 노드 선택 → 이미지 추출 → 업로드 → URL 생성
- 다양한 크기 및 복잡성의 이미지로 테스트
- 오류 시나리오 테스트

### 3. 성능 테스트
- 대용량 이미지 (10MB+) 처리 테스트
- 연속 업로드 테스트
- 네트워크 조건 변화에 따른 동작 테스트

## 기대 효과
1. 높은 보안성: 사용자 자신의 저장소만 사용하여 데이터 보호
2. 개인 정보 보호: 중앙 서버에 이미지 저장되지 않음
3. 확장성: 사용자의 Firebase 계정에 따른 리소스 활용
4. 신뢰성: 글로벌 인프라를 활용한 안정적인 이미지 호스팅

## 향후 확장 가능성
1. 다양한 인증 방식 지원 (이메일, GitHub 등)
2. 이미지 메타데이터 관리 및 히스토리 기능
3. Cloud Functions를 활용한 이미지 처리 자동화
4. 팀 공유 기능 (조직 내 이미지 공유)
5. 이미지 최적화 및 변환 기능 (웹용 최적화) 
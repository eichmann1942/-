// 브라우저 저장소(LocalStorage)에서 데이터 불러오기
let observations = JSON.parse(localStorage.getItem('my_observations')) || [];
let currentFilter = 'all';

// 오늘 날짜 기본 입력
document.getElementById('date').valueAsDate = new Date();

// 생물 카드 출력 함수
function renderCards(data) {
  const container = document.getElementById('card-container');
  container.innerHTML = '';

  if (data.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#888; padding: 40px 0;">아직 등록된 관찰 기록이 없습니다.<br>위 양식을 작성해 나만의 채집 일지를 등록해 보세요!</p>';
    return;
  }

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';

    // 첨부된 사진이 있으면 보여주고, 없으면 카메라 아이콘 표시
    const imgTag = item.image 
      ? `<img src="${item.image}" class="card-img" alt="${item.name}">`
      : `<div class="card-img" style="display:flex; align-items:center; justify-content:center; color:#aaa; font-size:2rem;">📷</div>`;

    card.innerHTML = `
      ${imgTag}
      <div class="card-content">
        <div class="card-header">
          <h3 class="card-title">${item.name}</h3>
          <span class="badge">${item.type || '기타'}</span>
        </div>
        <div class="meta-info">
          <div>📍 <strong>장소:</strong> ${item.location || '미기재'}</div>
          <div>📅 <strong>일시:</strong> ${item.date || '미기재'}</div>
        </div>
        <p class="card-desc">${item.desc || '설명 없음'}</p>
        <button class="delete-btn" onclick="deleteObservation(${item.id})">삭제</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// 이미지를 압축하여 Base64 문자열로 변환하는 함수 (용량 최적화)
function processImage(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; // 가로 최대 600px로 리사이징
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG 형식으로 압축 (화질 0.7)
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
}

// 폼 제출 이벤트
document.getElementById('observation-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const fileInput = document.getElementById('image-file');
  const file = fileInput.files[0];
  
  // 이미지 파일 처리 완료 후 기록 생성
  const imageDataUrl = await processImage(file);

  const newObs = {
    id: Date.now(),
    name: document.getElementById('name').value,
    category: document.getElementById('category').value,
    type: document.getElementById('type').value,
    date: document.getElementById('date').value,
    location: document.getElementById('location').value,
    image: imageDataUrl, // 압축된 파일 데이터
    desc: document.getElementById('desc').value
  };

  observations.unshift(newObs);
  saveAndRender();

  // 입력창 초기화
  this.reset();
  document.getElementById('date').valueAsDate = new Date();
});

// 기록 삭제 함수
function deleteObservation(id) {
  if (confirm('이 관찰 기록을 삭제하시겠습니까?')) {
    observations = observations.filter(item => item.id !== id);
    saveAndRender();
  }
}

// 브라우저 저장소에 데이터 저장 후 화면 재출력
function saveAndRender() {
  try {
    localStorage.setItem('my_observations', JSON.stringify(observations));
  } catch (err) {
    alert('저장 공간이 부족합니다. 더 이상 사진을 저장할 수 없습니다.');
  }
  filterCategory(currentFilter);
}

// 카테고리 필터링
function filterCategory(category) {
  currentFilter = category;
  if (category === 'all') {
    renderCards(observations);
  } else {
    const filtered = observations.filter(item => item.category === category);
    renderCards(filtered);
  }
}

// 초기 출력
filterCategory('all');

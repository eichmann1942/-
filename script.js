// 브라우저 저장소(LocalStorage)에서 데이터를 불러오고, 없으면 빈 목록([])으로 시작
let observations = JSON.parse(localStorage.getItem('my_observations')) || [];
let currentFilter = 'all';

// 오늘 날짜를 입력창 기본값으로 설정
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

    // 이미지 처리 (URL 없으면 기본 카메라 아이콘 표시)
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

// 신규 관찰 기록 등록 이벤트
document.getElementById('observation-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const newObs = {
    id: Date.now(), // 고유 ID (시간값)
    name: document.getElementById('name').value,
    category: document.getElementById('category').value,
    type: document.getElementById('type').value,
    date: document.getElementById('date').value,
    location: document.getElementById('location').value,
    image: document.getElementById('image').value,
    desc: document.getElementById('desc').value
  };

  observations.unshift(newObs); // 최신 관찰 기록이 맨 위에 오도록 추가
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

// 브라우저 저장소에 저장하고 화면 갱신
function saveAndRender() {
  localStorage.setItem('my_observations', JSON.stringify(observations));
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

// 페이지 로드 시 화면 렌더링
filterCategory('all');

// Supabase 클라이언트 초기화 (발급된 URL 및 Publishable Key 적용)
const SUPABASE_URL = 'https://rsctpozcmabhvwofdzbi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Llq2LH2VuBxHy9_NP97gVA_fDzex2LR';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 관리자 삭제 암호 (필요시 원하는 암호로 수정 가능)
const ADMIN_PASSWORD = "1234";

let observations = [];
let currentFilter = 'all';
let map, clickMarker;
let mapMarkers = [];

// 오늘 날짜 기본 세팅
document.getElementById('date').valueAsDate = new Date();

// 페이지 로드 시 카카오 지도 초기화 및 데이터 불러오기
window.onload = function() {
  initMap();
  fetchObservations();
};

// 카카오 지도 생성 및 클릭 이벤트 설정
function initMap() {
  const container = document.getElementById('map');
  const options = {
    center: new kakao.maps.LatLng(37.8813, 127.7298), // 기본 중심 (춘천/중부 지역)
    level: 7
  };
  map = new kakao.maps.Map(container, options);

  // 지도 클릭 시 좌표 가져오기 및 핀 생성
  kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
    const latlng = mouseEvent.latLng;
    document.getElementById('lat').value = latlng.getLat().toFixed(6);
    document.getElementById('lng').value = latlng.getLng().toFixed(6);

    if (clickMarker) clickMarker.setMap(null);

    clickMarker = new kakao.maps.Marker({
      position: latlng,
      map: map
    });
  });
}

// Supabase DB에서 데이터 불러오기
async function fetchObservations() {
  const { data, error } = await supabaseClient
    .from('observations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('데이터 불러오기 오류:', error);
    return;
  }

  observations = data || [];
  filterCategory(currentFilter);
  updateMapMarkers();
}

// 지도 위의 생물 관찰 핀 업데이트
function updateMapMarkers() {
  mapMarkers.forEach(m => m.setMap(null));
  mapMarkers = [];

  observations.forEach(item => {
    if (item.lat && item.lng) {
      const position = new kakao.maps.LatLng(item.lat, item.lng);
      const marker = new kakao.maps.Marker({
        position: position,
        map: map
      });

      const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px; font-size:12px; color:#1b4332; font-weight:bold;">${item.name} (${item.location || '채집지'})</div>`
      });

      kakao.maps.event.addListener(marker, 'mouseover', function() {
        infowindow.open(map, marker);
      });
      kakao.maps.event.addListener(marker, 'mouseout', function() {
        infowindow.close();
      });

      mapMarkers.push(marker);
    }
  });
}

// 생물 카드 출력
function renderCards(data) {
  const container = document.getElementById('card-container');
  container.innerHTML = '';

  if (data.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#888; padding: 40px 0;">아직 등록된 관찰 기록이 없습니다.<br>양식을 작성하고 지도를 클릭해 실시간 첫 기록을 올려보세요!</p>';
    return;
  }

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';

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
        <button class="delete-btn" onclick="deleteObservation('${item.id}')">삭제</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// 이미지 리사이징 및 압축
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
        const MAX_WIDTH = 500;
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
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
}

// 신규 기록 DB 등록
document.getElementById('observation-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const fileInput = document.getElementById('image-file');
  const file = fileInput.files[0];
  const imageDataUrl = await processImage(file);

  const latVal = parseFloat(document.getElementById('lat').value) || null;
  const lngVal = parseFloat(document.getElementById('lng').value) || null;

  const newObs = {
    name: document.getElementById('name').value,
    category: document.getElementById('category').value,
    type: document.getElementById('type').value,
    date: document.getElementById('date').value,
    location: document.getElementById('location').value,
    lat: latVal,
    lng: lngVal,
    image: imageDataUrl,
    desc: document.getElementById('desc').value
  };

  const { error } = await supabaseClient.from('observations').insert([newObs]);

  if (error) {
    alert('저장 중 오류가 발생했습니다: ' + error.message);
    return;
  }

  // 등록 완료 후 폼 및 클릭 마커 초기화
  this.reset();
  document.getElementById('date').valueAsDate = new Date();
  if (clickMarker) clickMarker.setMap(null);

  fetchObservations();
});

// 관리자 암호 확인 후 DB 기록 삭제
async function deleteObservation(id) {
  const inputPw = prompt('관리자 비밀번호를 입력하세요:');
  if (inputPw === ADMIN_PASSWORD) {
    const { error } = await supabaseClient
      .from('observations')
      .delete()
      .eq('id', id);

    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      alert('삭제되었습니다.');
      fetchObservations();
    }
  } else if (inputPw !== null) {
    alert('비밀번호가 일치하지 않습니다.');
  }
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

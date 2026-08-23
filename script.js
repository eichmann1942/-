// Supabase 클라이언트 초기화
const SUPABASE_URL = 'https://rsctpozcmabhvwofdzbi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Llq2LH2VuBxHy9_NP97gVA_fDzex2LR';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 관리자 삭제/수정 비밀번호 (기본: 1234)
const ADMIN_PASSWORD = "1234";

let observations = [];
let currentFilter = 'all';
let map, clickMarker;
let mapMarkers = [];

// 오늘 날짜 기본 세팅
document.getElementById('date').valueAsDate = new Date();

// 페이지 완전히 로드된 후 카카오맵 로딩 및 DB 불러오기
window.addEventListener('load', function() {
  if (typeof kakao !== 'undefined' && kakao.maps) {
    kakao.maps.load(function() {
      initMap();
      fetchObservations();
    });
  } else {
    console.warn("카카오맵 API 스크립트 불러오기 중...");
    fetchObservations();
  }
});

// 카카오 지도 생성 함수
function initMap() {
  const container = document.getElementById('map');
  if (!container) return;

  const options = {
    center: new kakao.maps.LatLng(37.8813, 127.7298), // 기본 중심 좌표 (중부 지역)
    level: 7
  };
  map = new kakao.maps.Map(container, options);

  // 지도 클릭 시 위도/경도 입력 및 클릭 핀 생성
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

// Supabase DB 데이터 불러오기
async function fetchObservations() {
  const { data, error } = await supabaseClient
    .from('observations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('데이터 로딩 오류:', error);
    return;
  }

  observations = data || [];
  filterCategory(currentFilter);
  if (map) updateMapMarkers();
}

// 카카오 지도 핀 및 인포윈도우 업데이트
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
        <div class="card-actions">
          <button class="edit-btn" onclick="startEditObservation('${item.id}')">수정</button>
          <button class="delete-btn" onclick="deleteObservation('${item.id}')">삭제</button>
        </div>
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

// 수정 모드 활성화
function startEditObservation(id) {
  const target = observations.find(item => String(item.id) === String(id));
  if (!target) return;

  document.getElementById('edit-id').value = target.id;
  document.getElementById('name').value = target.name || '';
  document.getElementById('category').value = target.category || 'fish';
  document.getElementById('type').value = target.type || '';
  document.getElementById('date').value = target.date || '';
  document.getElementById('location').value = target.location || '';
  document.getElementById('lat').value = target.lat || '';
  document.getElementById('lng').value = target.lng || '';
  document.getElementById('desc').value = target.desc || '';

  if (target.lat && target.lng && map) {
    const loc = new kakao.maps.LatLng(target.lat, target.lng);
    if (clickMarker) clickMarker.setMap(null);
    clickMarker = new kakao.maps.Marker({ position: loc, map: map });
    map.panTo(loc);
  }

  document.getElementById('form-title').innerText = '✏️ 관찰 기록 수정하기';
  document.getElementById('submit-btn').innerText = '수정 내용 저장하기';
  document.getElementById('cancel-btn').style.display = 'block';

  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// 폼 초기화 (등록 모드)
function resetForm() {
  document.getElementById('observation-form').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('date').valueAsDate = new Date();
  document.getElementById('form-title').innerText = '📷 새 생물 관찰 기록하기';
  document.getElementById('submit-btn').innerText = '관찰 일지 서버에 등록하기';
  document.getElementById('cancel-btn').style.display = 'none';
  if (clickMarker) clickMarker.setMap(null);
}

// DB 등록 및 수정 처리
document.getElementById('observation-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const editId = document.getElementById('edit-id').value;
  const fileInput = document.getElementById('image-file');
  const file = fileInput.files[0];
  let imageDataUrl = await processImage(file);

  const latVal = parseFloat(document.getElementById('lat').value) || null;
  const lngVal = parseFloat(document.getElementById('lng').value) || null;

  if (editId) {
    const inputPw = prompt('기록 수정을 위해 관리자 비밀번호를 입력하세요:');
    if (inputPw !== ADMIN_PASSWORD) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    const target = observations.find(item => String(item.id) === String(editId));
    if (!imageDataUrl && target) {
      imageDataUrl = target.image;
    }

    const updateData = {
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

    const { error } = await supabaseClient
      .from('observations')
      .update(updateData)
      .eq('id', editId);

    if (error) {
      alert('수정 실패: ' + error.message);
      return;
    }

    alert('성공적으로 수정되었습니다!');
  } else {
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
      alert('저장 실패: ' + error.message);
      return;
    }
  }

  resetForm();
  fetchObservations();
});

// 관리자 삭제
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

// 카테고리 필터
function filterCategory(category) {
  currentFilter = category;
  if (category === 'all') {
    renderCards(observations);
  } else {
    const filtered = observations.filter(item => item.category === category);
    renderCards(filtered);
  }
}

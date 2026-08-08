// 도감에 들어갈 생물 데이터 (나중에 이 부분을 마음대로 수정/추가하시면 됩니다)
const data = [
  { name: "밀어", category: "fish", type: "저서어", habitat: "하천 중상류", desc: "바닥재에 붙어 생활하는 저서성 어종." },
  { name: "쉬리", category: "fish", type: "여울성어종", habitat: "1급수 여울", desc: "물살이 세고 자갈이 깔린 곳에 서식." },
  { name: "물방개", category: "insect", type: "수생곤충", habitat: "연못 및 정수역", desc: "헤엄을 잘 치며 뚜껑이 있는 사육장 필수." },
  { name: "장수풍뎅이", category: "insect", type: "육상곤충", habitat: "참나무 숲", desc: "야행성 곤충으로 곤충젤리나 활엽수 수액을 먹음." }
];

function renderCards(items) {
  const container = document.getElementById('card-container');
  container.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.name}</h3>
      <span class="tag">${item.type}</span>
      <p><strong>서식지:</strong> ${item.habitat}</p>
      <p>${item.desc}</p>
    `;
    container.appendChild(card);
  });
}

function filterCategory(category) {
  if (category === 'all') {
    renderCards(data);
  } else {
    const filtered = data.filter(item => item.category === category);
    renderCards(filtered);
  }
}

// 처음 화면 로딩 시 전체 카드 출력
renderCards(data);
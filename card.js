let connectedReaders = [];
// 화면이 준비되면 단말기 상태정보를 요청한다.
window.addEventListener('DOMContentLoaded', (event) => {
  console.log('reader:get_status sent');
  window.api.send('reader:get_status');
  console.log('card:get_status sent');
  window.api.send('card:get_status');
});

// 요청 섹터의 데이터를 요청한다.
document.querySelector('#fetch').addEventListener('click', (event) => {
  const sectionNumber = document.querySelector('#section_number').value;
  let authKey = document.querySelector('#auth0').value +
    document.querySelector('#auth1').value +
    document.querySelector('#auth2').value +
    document.querySelector('#auth3').value +
    document.querySelector('#auth4').value +
    document.querySelector('#auth5').value;

  if (authKey.length !== 12) {
    alert('인증코드의 자리수는 12자리 입니다.');
    if (authKey.length === 0) authKey = 'FFFFFFFFFFFF';
    else return;
  } else {
    authKey = authKey.toUpperCase();
  }

  console.log('fetched clicked with section', sectionNumber, authKey);
  window.api.send('card:get_section_data', {
    sectionNumber, authKey    
  });
});

// 카드 전체 섹터의 데이터를 요청한다.
document.querySelector('#fetch_all').addEventListener('click', (event) => {
  console.log('fetch allhed clicked');
  window.api.send('card:get_section_data_all');
});

// 단말기 상태정보를 수신
window.api.receive('reader:status', (event, names) => {
  console.log('reader:status received', names);
  connectedReaders = names;
  document.querySelector('#readers').innerHTML = getReadersNames();
});

// 카드 상태정보를 수신
window.api.receive('card:status', (event, uid) => {
  console.log('card:status received', uid);
  document.querySelector('#card_uid').value = uid;
});

// 카드 섹션 정보 수신
window.api.receive('card:section_data', (event, data) => {
  console.log('card:section_data', data);

  const key = Object.keys(data);
  let dataString = '';
  if (data) {
    data[key].forEach((row, index) => {
      dataString += `
      <tr>
        <th scope="col">${key[0]}</th>
        <th scope="col">${index}</th>
        <th scope="col">${row.substring(0, 2).toUpperCase()}</th>
        <th scope="col">${row.substring(2, 4).toUpperCase()}</th>
        <th scope="col">${row.substring(4, 6).toUpperCase()}</th>
        <th scope="col">${row.substring(6, 8).toUpperCase()}</th>
        <th scope="col">${row.substring(8, 10).toUpperCase()}</th>
        <th scope="col">${row.substring(10, 12).toUpperCase()}</th>
        <th scope="col">${row.substring(12, 14).toUpperCase()}</th>
        <th scope="col">${row.substring(14, 16).toUpperCase()}</th>
        <th scope="col">${row.substring(16, 18).toUpperCase()}</th>
        <th scope="col">${row.substring(18, 20).toUpperCase()}</th>
        <th scope="col">${row.substring(20, 22).toUpperCase()}</th>
        <th scope="col">${row.substring(22, 24).toUpperCase()}</th>
        <th scope="col">${row.substring(24, 26).toUpperCase()}</th>
        <th scope="col">${row.substring(26, 28).toUpperCase()}</th>
        <th scope="col">${row.substring(28, 30).toUpperCase()}</th>
        <th scope="col">${row.substring(30, 32).toUpperCase()}</th>
        <th scope="col">Access</th>
        <th scope="col">Key</th>
        <th scope="col">Addr</th>
      </tr>
      `;
    });
  }
  console.log(dataString);
  document.querySelector('#sections').innerHTML = dataString;
});

// 카드 섹션 전체 정보 수신
window.api.receive('card:section_data_all', (event, data) => {
  console.log('card:section_data', data);

  const keys = Object.keys(data);
  let dataString = '';
  for (const key of keys) {
    if (data) {
      data[key].forEach((row, index) => {
        dataString += `
        <tr>
          <th scope="col">${key}</th>
          <th scope="col">${index}</th>
          <th scope="col">${row.substring(0, 2).toUpperCase()}</th>
          <th scope="col">${row.substring(2, 4).toUpperCase()}</th>
          <th scope="col">${row.substring(4, 6).toUpperCase()}</th>
          <th scope="col">${row.substring(6, 8).toUpperCase()}</th>
          <th scope="col">${row.substring(8, 10).toUpperCase()}</th>
          <th scope="col">${row.substring(10, 12).toUpperCase()}</th>
          <th scope="col">${row.substring(12, 14).toUpperCase()}</th>
          <th scope="col">${row.substring(14, 16).toUpperCase()}</th>
          <th scope="col">${row.substring(16, 18).toUpperCase()}</th>
          <th scope="col">${row.substring(18, 20).toUpperCase()}</th>
          <th scope="col">${row.substring(20, 22).toUpperCase()}</th>
          <th scope="col">${row.substring(22, 24).toUpperCase()}</th>
          <th scope="col">${row.substring(24, 26).toUpperCase()}</th>
          <th scope="col">${row.substring(26, 28).toUpperCase()}</th>
          <th scope="col">${row.substring(28, 30).toUpperCase()}</th>
          <th scope="col">${row.substring(30, 32).toUpperCase()}</th>
          <th scope="col">Access</th>
          <th scope="col">Key</th>
          <th scope="col">Addr</th>
        </tr>
        `;
      });
    }
  }
  console.log(dataString);
  document.querySelector('#sections').innerHTML = dataString;
});

// 단말이 연결되었을 때
window.api.receive('reader:connected', (event, name) => {
  if (!connectedReaders.includes(name)) {
    connectedReaders.push(name);
  }
  console.log('reader connected', name);
  document.querySelector('#readers').innerHTML = getReadersNames();
});

// 단말기 연결해제
// 1. 해제 단말 검색하여 삭제
// 2. 표시 문자열 생성
window.api.receive('reader:disconnected', (event, name) => {
  console.log('reader disconnected', name);
  connectedReaders = connectedReaders.filter(reader => reader !== name);
  document.querySelector('#readers').innerHTML = getReadersNames();
});

// 카드가 연결되었을
window.api.receive('card:connected', (event, name) => {
  console.log('card connected', name);
  document.querySelector('#card_uid').value = name;
});    

// 카드가 연결해제되었을 때
window.api.receive('card:disconnected', (event, name) => {
  console.log('card disconnected', name);
  document.querySelector('#card_uid').value = '연결해재됨';
});

// 현재 연결된 장비에 대한 리스트 목록 문자열 제공
function getReadersNames() {
  let itemNames = '';
  for (const name of connectedReaders) {
    itemNames += `<li>${name}</li>`
  }
  return listDevice = `
    <ul class="list-group">
      ${itemNames}
    </ul>
  `;
}

feather.replace({ 'aria-hidden': 'true' })
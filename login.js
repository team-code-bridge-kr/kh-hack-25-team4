import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD1HNrS-TcAUvmJvWJYowzIPbyIC1_sMjg",
  authDomain: "hack-7974a.firebaseapp.com",
  projectId: "hack-7974a",
  storageBucket: "hack-7974a.firebasestorage.app",
  messagingSenderId: "831807416935",
  appId: "1:831807416935:web:461949fd6baa1510e042c2",
  measurementId: "G-DKMJZBKLG2"
};

let app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const db = getFirestore(app);

// DOM이 준비된 뒤에 요소를 찾고 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
  const signup = document.getElementById('signup');
  const login = document.getElementById('login');

  if (!signup) {
    console.error("signup 버튼(아이디 'signup')을 찾을 수 없습니다. HTML에서 해당 id가 존재하는지 확인하세요.");
    return;
  }
  if (!login) {
    console.warn("login 버튼(아이디 'login')을 찾을 수 없습니다.");
  }

  // 이메일 유효성 검사
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  // 회원가입
  signup.addEventListener("click", async () => {
    try {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const username = document.getElementById("username").value;

      if (!validateEmail(email)) {
        alert("유효한 이메일을 쓰세요.");
        return;
      }
      // create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("회원가입 성공:", user);
      alert("회원가입이 완료되었습니다.");

      // Firestore에 uid 저장 (비동기)
      addUser(email, user.uid).catch(e => console.error("Firestore 추가 실패:", e));

      // Realtime DB에 사용자 정보 저장 (cart의 booth_code를 문자열로 변경)
      await saveUserData(user.uid, username, email);

      // 자동 로그인 (create 후 sign in은 이미 되어있을수 있으나 안전하게 시도)
      await signInWithEmailAndPassword(auth, email, password);
      alert("로그인 완료 - 페이지로 이동합니다.");
      window.location.href = "index.html";

    } catch (error) {
      console.error("회원가입/로그인 중 오류:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("이미 회원가입된 이메일입니다.");
      } else {
        alert(error.message || "오류가 발생했습니다. 콘솔을 확인하세요.");
      }
      // 필요하다면 새로고침 대신 입력 필드 초기화만 권장
      // location.reload();
    }
  });

  // 로그인
  if (login) {
    login.addEventListener("click", async () => {
      try {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("로그인 성공:", userCredential.user);
        alert("로그인이 완료되었습니다.");
        displayName();
        window.location.href = "index.html";
      } catch (error) {
        console.error("로그인 실패:", error);
        alert(error.message || "로그인 실패");
      }
    });
  }
});

// saveUserData: set을 체인해서 순차적으로 처리
function saveUserData(userId, username, email) {
  // userId 경로에 쓰기
  return set(ref(database, userId), {
    username: username,
    email: email,
    money: 0,
  }).then(() => {
    // cartlist의 0번째 항목 추가 (booth_code를 문자열로 수정)
    return set(ref(database, `${userId}/cartlist/0`), {
      booth_code: "NONAME",
      totalprice: 0
    });
  }).then(() => {
    console.log("사용자 정보 저장 성공");
  }).catch((error) => {
    console.error("사용자 정보 저장 실패:", error);
    throw error; // 호출자에게 에러 전달
  });
}

function displayName() {
  if (!auth.currentUser) {
    console.warn("현재 로그인된 사용자가 없습니다.");
    return;
  }
  const userId = auth.currentUser.uid;
  const userRef = ref(database, userId + '/username');
  get(userRef).then((snapshot) => {
    if (snapshot.exists()) {
      const username = snapshot.val();
      const userInfoDiv = document.getElementById('user-info');
      if (userInfoDiv) {
        userInfoDiv.textContent = `${username}님`;
        userInfoDiv.classList.remove('hidden');
      }
    } else {
      console.log("사용자 데이터 없음");
    }
  }).catch((error) => {
    console.error("데이터 로드 실패:", error);
  });
}

async function addUser(email, userId) {
  try {
    const docRef = await addDoc(collection(db, "uid"), {
      email: email,
      uid: userId
    });
    console.log("문서가 추가되었습니다. ID: ", docRef.id);
  } catch (e) {
    console.error("문서 추가 중 오류 발생:", e);
    throw e;
  }
}

// 로그아웃 함수 (전역으로 쓰려면 window.logout = ...)
window.logout = function() {
  signOut(auth).then(() => {
    console.log("로그아웃 성공");
    alert("로그아웃되었습니다.");
    location.reload();
  }).catch((error) => {
    console.error("로그아웃 실패:", error);
  });
};

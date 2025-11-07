import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Firebase 초기화
const firebaseConfig = {
  apiKey: "AIzaSyD1HNrS-TcAUvmJvWJYowzIPbyIC1_sMjg",
  authDomain: "hack-7974a.firebaseapp.com",
  projectId: "hack-7974a",
  storageBucket: "hack-7974a.firebasestorage.app",
  messagingSenderId: "831807416935",
  appId: "1:831807416935:web:461949fd6baa1510e042c2",
  measurementId: "G-DKMJZBKLG2"
};
Kakao.init('bb9bbcd2a029c6254a9089d8fe912a0e');
let app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const db = getFirestore(app); // Firestore 초기화
const sign = document.getElementById('kakao-login');

// DOMContentLoaded 이벤트를 사용하여 DOM이 로드된 후 실행
sign.addEventListener("click", () =>  {
    // 카카오 SDK 초기화 // 애플리케이션 키

    document.getElementById('kakao-login').onclick = function() {
        Kakao.Auth.login({
            success: function(authObj) {
                console.log(authObj);
                getUserInfo(); // 로그인 성공 후 사용자 정보 요청
            },
            fail: function(err) {
                console.error(err);
            }
        });
    };
});
document.getElementById('kakao-sign').addEventListener("click", () => {
    Kakao.Auth.login({
        success: function(authObj) {
            console.log(authObj);
            getUser(); // 로그인 성공 후 사용자 정보 요청
        },
        fail: function(err) {
            console.error(err);
        }
    });
});

// 사용자 정보 요청 및 Firebase 로그인 처리
function getUser() {
    Kakao.API.request({
        url: '/v2/user/me',
        success: function(res) {
            const email = res.kakao_account.email; // 이메일
            const password = res.id; // 카카오 ID를 비밀번호로 사용

            // Firebase로 로그인 시도
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // 로그인 성공
                    const user = userCredential.user;
                    console.log("로그인 성공:", user);
                    alert("로그인이 완료되었습니다.");
                    window.location.href = "index.html"; // 로그인 후 페이지 이동
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.error("로그인 실패:", errorMessage);
                    alert(errorMessage);
                });
        },
        fail: function(err) {
            console.error("사용자 정보 요청 실패:", err);
        }
    });
}
function getUserInfo() {
    Kakao.API.request({
        url: '/v2/user/me',
        success: function(res) {
            const username = res.properties.nickname; // 닉네임
            const email = res.kakao_account.email; // 이메일
            const kakaoId = res.id; // 카카오 ID를 비밀번호로 사용

            // 사용자 정보를 Firebase Authentication에 저장하는 함수 호출
            createUserWithEmailAndPassword(auth, email, kakaoId)
            .then(async (userCredential) => {
                const user = userCredential.user;
                console.log("회원가입 성공:", user);
                alert("회원가입이 완료되었습니다.");

                // 사용자 정보를 저장하는 함수 호출
                await saveUserData(user.uid, username, email); // 비동기 처리
                await addUser(email, user.uid); // Firestore에 사용자 추가

                console.log("로그인 성공:", auth.currentUser);
                alert("로그인이 완료되었습니다.");
                window.location.href = "index.html";
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;

                if (errorCode === 'auth/email-already-in-use') {
                    alert("이미 회원가입된 이메일입니다.");
                } else {
                    console.error("회원가입 실패:", errorMessage);
                    alert(errorMessage);
                }
                location.reload(); // 오류 발생 시 새로 고침
            });
        },
        fail: function(err) {
            console.error(err);
        }
    });
}

async function saveUserData(userId, username, email) {
    try {
        await set(ref(database, userId), {
            username: username,
            email: email,
            money: 0
        });
        await set(ref(database, userId + '/cartlist'));
        console.log("사용자 정보 저장 성공");
    } catch (error) {
        console.error("사용자 정보 저장 실패:", error);
    }
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
    }
}

// ================= FIREBASE IMPORTS =================
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbMvOjA4m1QtnuRt7m7jXAddQq-W-Sh-k",
  authDomain: "tradex-support.firebaseapp.com",
  projectId: "tradex-support",
  storageBucket: "tradex-support.firebasestorage.app",
  messagingSenderId: "822784979542",
  appId: "1:822784979542:web:c32ee91b7849fcb16781f7",
  measurementId: "G-CJ4HWBLVCJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
});

// ================= HELPERS =================
const num = (v) => parseFloat(v) || 0;

// ================= BUY =================
window.buy = async () => {
  let u = auth.currentUser;
  if (!u) return alert("Login first");

  let amountVal = num(amount.value);
  if (amountVal <= 0) return alert("Invalid amount");

  let ref = doc(db, "users", u.uid);
  let snap = await getDoc(ref);

  await updateDoc(ref, {
    balance: (snap.data().balance || 0) + amountVal
  });

  await addDoc(collection(db, "orders"), {
    uid: u.uid,
    type: "buy",
    amount: amountVal,
    time: Date.now()
  });
};

// ================= SELL =================
window.sell = async () => {
  let u = auth.currentUser;
  if (!u) return alert("Login first");

  let amountVal = num(amount.value);

  let ref = doc(db, "users", u.uid);
  let snap = await getDoc(ref);

  let balance = snap.data().balance || 0;

  if (amountVal <= 0) return alert("Invalid amount");
  if (amountVal > balance) return alert("Insufficient balance ❌");

  await updateDoc(ref, {
    balance: balance - amountVal
  });

  await addDoc(collection(db, "orders"), {
    uid: u.uid,
    type: "sell",
    amount: amountVal,
    time: Date.now()
  });
};

// ================= DEPOSIT =================
window.deposit = async () => {
  let u = auth.currentUser;
  if (!u) return alert("Login first");

  let amt = num(prompt("Deposit amount"));
  if (!amt) return;

  await addDoc(collection(db, "transactions"), {
    uid: u.uid,
    type: "deposit",
    amount: amt,
    status: "pending",
    time: Date.now()
  });


  alert("Deposit request sent");
};

// ================= WITHDRAW =================
window.withdraw = async () => {
  let u = auth.currentUser;
  if (!u) return alert("Login first");

  let amt = num(prompt("Withdraw amount"));
  if (!amt) return;

  let ref = doc(db, "users", u.uid);
  let snap = await getDoc(ref);

  let balance = snap.data().balance || 0;

  if (amt > balance) return alert("Low balance ❌");

  await addDoc(collection(db, "transactions"), {
    uid: u.uid,
    type: "withdraw",
    amount: amt,
    status: "pending",
    time: Date.now()
  });

  alert("Withdraw request sent");
};

// ================= LOAD ORDERS =================
async function loadOrders() {
  let u = auth.currentUser;
  if (!u) return;

  let snap = await getDocs(collection(db, "orders"));
  let html = "";

  snap.forEach(d => {
    let data = d.data();
    if (data.uid === u.uid) {
      html += `<p>${data.type} - ${data.amount}</p>`;
    }
  });

  ordersBox.innerHTML = html;
}

// ================= LOAD USERS =================
async function loadUsers() {
  let snap = await getDocs(collection(db, "users"));
  let html = "";

  snap.forEach(d => {
    html += `<p>${d.data().email || "no email"}</p>`;
  });

  usersList.innerHTML = html;
}

// ================= LOAD DEPOSITS =================
async function loadDeposits() {
  let snap = await getDocs(collection(db, "transactions"));
  let html = "";

  snap.forEach(d => {
    let data = d.data();

    if (data.type === "deposit" && data.status === "pending") {
      html += `
        <p>
          ${data.uid} $${data.amount}
          <button onclick="approveDeposit('${d.id}','${data.uid}',${data.amount})">
            Approve
          </button>
        </p>`;
    }
  });

  deposits.innerHTML = html;
}

// ================= APPROVE DEPOSIT =================
window.approveDeposit = async (id, uid, amt) => {
  let ref = doc(db, "users", uid);
  let snap = await getDoc(ref);

  await updateDoc(ref, {
    balance: (snap.data().balance || 0) + amt
  });

  await updateDoc(doc(db, "transactions", id), {
    status: "done"
  });

  alert("Deposit Approved");
  loadDeposits();
};

// ================= LOAD WITHDRAW =================
async function loadWithdraws() {
  let snap = await getDocs(collection(db, "transactions"));
  let html = "";

  snap.forEach(d => {
    let data = d.data();

    if (data.type === "withdraw" && data.status === "pending") {
      html += `
        <p>
          ${data.uid} $${data.amount}
          <button onclick="approveWithdraw('${d.id}','${data.uid}',${data.amount})">
            Approve
          </button>
        </p>`;
    }
  });

  withdraws.innerHTML = html;
}

// ================= APPROVE WITHDRAW =================
window.approveWithdraw = async (id, uid, amt) => {
  let ref = doc(db, "users", uid);
  let snap = await getDoc(ref);

  let balance = snap.data().balance || 0;

  if (amt > balance) return alert("Not enough balance ❌");

  await updateDoc(ref, {
    balance: balance - amt
  });

  await updateDoc(doc(db, "transactions", id), {
    status: "done"
  });

  alert("Withdraw Approved");
  loadWithdraws();
};

// ================= CHAT =================
window.sendMsg = async () => {
  let u = auth.currentUser;
  if (!u) return;

  await addDoc(collection(db, "chat"), {
    uid: u.uid,
    msg: msg.value,
    time: Date.now()
  });

  msg.value = "";
};

// ================= LOGOUT =================
window.logout = () => signOut(auth);

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7XMeN8KBLGGu3bBE93uwYaDeq0my4tec",
  authDomain: "refer-income-app-c7ff2.firebaseapp.com",
  projectId: "refer-income-app-c7ff2",
  storageBucket: "refer-income-app-c7ff2.appspot.com",
  messagingSenderId: "423443979445",
  appId: "1:423443979445:web:1c35ab035b5132fc",
  measurementId: "G-7YLCRD569B"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ইউজারের আইডি (লগইন সিস্টেম না থাকলে এইটা ইউজার আইডি হিসেবে ব্যবহার করবে)
const userId = "uid_123"; 

async function loadProfile() {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // নতুন ইউজার ডকুমেন্ট তৈরি
    await setDoc(userRef, {
      balance: 0,
      referrals: 0,
      totalIncome: 0,
      withdrawn: 0,
      lastBonusClaimed: null,
      activated: false,
      referralCode: userId,
      referredBy: null,
      paymentProof: null
    });
  }

  const userData = (await getDoc(userRef)).data();

  document.getElementById("profile").innerHTML = `
    <h2>আমার প্রোফাইল</h2>
    <p>বর্তমান ব্যালেন্স: ${userData.balance} টাকা</p>
    <p>মোট রেফার: ${userData.referrals} জন</p>
    <p>মোট ইনকাম: ${userData.totalIncome} টাকা</p>
    <p>মোট উইথড্র: ${userData.withdrawn} টাকা</p>
    <p>অ্যাক্টিভেশন: ${userData.activated ? "হ্যাঁ" : "না"}</p>
  `;
}

// একাউন্ট এক্টিভেশন (৫০ টাকা দিয়ে)
async function activateAccount() {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  if (userData.activated) {
    alert("তুমি ইতোমধ্যেই একাউন্ট এক্টিভ করেছো।");
    return;
  }

  const paymentNumber = prompt("পেমেন্ট করেছেন বিকাশ নাম্বার দিয়ে (যেমন: ০১৭৩৩৯৭৯০৮২):");
  if (!paymentNumber) {
    alert("পেমেন্ট নাম্বার দিতে হবে।");
    return;
  }

  // পেমেন্ট ভেরিফিকেশন ম্যানুয়ালি হবে, তাই আমরা paymentProof আপডেট করব
  await updateDoc(userRef, {
    paymentProof: paymentNumber,
  });

  alert("পেমেন্ট প্রুফ জমা দেওয়া হয়েছে, এডমিন ভেরিফাই করার পর একাউন্ট এক্টিভ হবে।");

  // এডমিন ভেরিফিকেশন হলে এখানে activated: true সেট করতে হবে (ম্যানুয়ালি বা আলাদা অ্যাডমিন প্যানেল থেকে)
}

// রেফার লিঙ্ক দেখানো
async function refer() {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  if (!userData.activated) {
    alert("একাউন্ট এক্টিভ করো রেফার লিঙ্ক পেতে।");
    return;
  }

  alert("তোমার রেফার লিঙ্ক: https://yourapp.com/?ref=" + userData.referralCode);
}

// উইথড্রাল ফাংশন
async function withdraw() {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  if (userData.balance < 50) {
    alert("মিনিমাম উইথড্র ৫০ টাকা হতে হবে।");
    return;
  }

  const withdrawNumber = prompt("তোমার বিকাশ/নগদ নাম্বার লিখো:");
  const withdrawAmount = prompt("কত টাকা তুলতে চাও?");

  if (parseInt(withdrawAmount) < 50) {
    alert("মিনিমাম উইথড্র ৫০ টাকা!");
    return;
  }

  if (parseInt(withdrawAmount) > userData.balance) {
    alert("তোমার ব্যালেন্সের চেয়ে বেশি টাকা তুলতে পারবে না!");
    return;
  }

  // উইথড্র রিকোয়েস্ট স্টোর করো (এডমিন যাচাইয়ের জন্য)
  // এক্ষেত্রে একটি আলাদা collection রাখা উচিত, কিন্তু demo জন্য user doc-এ আপডেট করছি

  await updateDoc(userRef, {
    balance: userData.balance - parseInt(withdrawAmount),
    withdrawn: userData.withdrawn + parseInt(withdrawAmount),
  });

  alert("উইথড্র রিকোয়েস্ট গ্রহণ করা হয়েছে। ২৪ ঘণ্টার মধ্যে টাকা পাবেন।");
  loadProfile();
}

// মোবাইল রিচার্জ ফাংশন
async function recharge() {
  const rechargeNumber = prompt("মোবাইল নাম্বার লিখো:");
  const rechargeAmount = prompt("কত টাকা রিচার্জ করতে চাও?");

  if (parseInt(rechargeAmount) < 50) {
    alert("মিনিমাম রিচার্জ ৫০ টাকা!");
    return;
  }

  alert("রিচার্জ রিকোয়েস্ট গ্রহণ করা হয়েছে। ২৪ ঘণ্টার মধ্যে রিচার্জ হবে।");
  // এখানে চাইলে রিচার্জ রিকোয়েস্ট Firestore-এ আলাদাভাবে রাখতে পারো
}

// বোনাস ক্লেইম ফাংশন
async function claimBonus() {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  const lastClaim = userData.lastBonusClaimed ? userData.lastBonusClaimed.toDate() : null;
  const now = new Date();

  if (lastClaim && (now - lastClaim) / (1000 * 60 * 60) < 24) {
    alert("তুমি ইতিমধ্যে আজকের বোনাস পেয়ে গেছো। ২৪ ঘন্টার পর আবার চেষ্টা করো।");
    return;
  }

  await updateDoc(userRef, {
    balance: userData.balance + 5,
    totalIncome: userData.totalIncome + 5,
    lastBonusClaimed: serverTimestamp()
  });

  alert("আজকের বোনাস ৫ টাকা যোগ হয়েছে। আগামীকাল আবার নাও।");
  loadProfile();
}

// হেল্প বাটন (এডমিনের টেলিগ্রাম লিঙ্ক)
function helpAdmin() {
  window.open("https://t.me/youradminusername", "_blank");
}

// পেজ লোডের সাথে প্রোফাইল লোড করা
loadProfile();

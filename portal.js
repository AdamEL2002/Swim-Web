import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const parentCreatorApp = initializeApp(firebaseConfig, 'parent-account-creator');
const parentCreatorAuth = getAuth(parentCreatorApp);

const authView = document.getElementById('authView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const portalNotice = document.getElementById('portalNotice');
const parentPanel = document.getElementById('parentPanel');
const adminPanel = document.getElementById('adminPanel');
const swimmerForm = document.getElementById('swimmerForm');
let loginInProgress = false;

const showNotice = (message, type = 'info') => {
  portalNotice.textContent = message;
  portalNotice.className = `portal-notice portal-notice--${type}`;
  portalNotice.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const clearNotice = () => {
  portalNotice.hidden = true;
};

const friendlyAuthError = error => {
  const messages = {
    'auth/email-already-in-use': 'An account already exists for this email address. Please sign in or reset your password.',
    'auth/invalid-credential': 'The email address or password is incorrect.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts were made. Please wait a little while and try again.',
    'auth/weak-password': 'Please choose a password containing at least 8 characters.'
  };
  return messages[error.code] || 'Something went wrong. Please try again or contact BPSwim for help.';
};

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  clearNotice();
  const data = new FormData(loginForm);
  try {
    loginInProgress = true;
    await signInWithEmailAndPassword(auth, data.get('email').trim(), data.get('password'));
    loginForm.reset();
  } catch (error) {
    loginInProgress = false;
    showNotice(friendlyAuthError(error), 'error');
  }
});

document.getElementById('resetPasswordBtn').addEventListener('click', async () => {
  const email = loginForm.elements.email.value.trim();
  if (!email) {
    showNotice('Enter your email address first, then press “Forgot your password?” again.', 'error');
    loginForm.elements.email.focus();
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showNotice('A password reset email has been sent if an account exists for that address.', 'success');
  } catch (error) {
    showNotice(friendlyAuthError(error), 'error');
  }
});

document.getElementById('signOutBtn').addEventListener('click', () => signOut(auth));
document.getElementById('changePasswordForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const user = auth.currentUser;
  if (!user?.email) return;

  try {
    const credential = EmailAuthProvider.credential(user.email, data.get('currentPassword'));
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, data.get('newPassword'));
    form.reset();
    form.closest('details').open = false;
    showNotice('Your password has been updated.', 'success');
  } catch (error) {
    showNotice(friendlyAuthError(error), 'error');
  }
});

document.getElementById('parentAccountForm').addEventListener('submit', async event => {
  event.preventDefault();
  clearNotice();
  const form = event.currentTarget;
  const data = new FormData(form);
  const fullName = data.get('fullName').trim();
  const email = data.get('email').trim().toLowerCase();
  const temporaryPassword = data.get('temporaryPassword');

  try {
    const credential = await createUserWithEmailAndPassword(parentCreatorAuth, email, temporaryPassword);
    await updateProfile(credential.user, { displayName: fullName });
    await setDoc(doc(db, 'users', credential.user.uid), {
      displayName: fullName,
      email,
      role: 'parent',
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser.uid
    });
    await signOut(parentCreatorAuth);
    form.reset();
    await loadAdminData();
    showNotice(`The account for ${fullName} was created. Send the parent their email address and temporary password privately.`, 'success');
  } catch (error) {
    await signOut(parentCreatorAuth).catch(() => {});
    showNotice(friendlyAuthError(error), 'error');
  }
});

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const listMarkup = (items, emptyText) => {
  const cleanItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!cleanItems.length) return `<p class="portal-muted">${escapeHtml(emptyText)}</p>`;
  return `<ul>${cleanItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
};

const swimmerCardMarkup = data => {
  const progress = Math.max(0, Math.min(100, Number(data.progress) || 0));
  const updated = data.updatedAt?.toDate?.().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) || 'Awaiting first update';
  return `
    <article class="portal-swimmer-card">
      <div class="portal-swimmer-head">
        <div>
          <p class="portal-eyebrow">${escapeHtml(data.lessonDay || 'BPSwim swimmer')}</p>
          <h2>${escapeHtml(data.name)}</h2>
        </div>
        <span class="portal-stage">${escapeHtml(data.stage)}</span>
      </div>
      <div class="portal-progress-label"><span>Overall progress</span><strong>${progress}%</strong></div>
      <div class="portal-progress" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
        <span style="width:${progress}%"></span>
      </div>
      <div class="portal-focus">
        <h3>Current lesson focus</h3>
        <p>${escapeHtml(data.currentFocus)}</p>
      </div>
      <div class="portal-progress-columns">
        <div><h3>Skills achieved</h3>${listMarkup(data.achievements, 'Achievements will appear here.')}</div>
        <div><h3>Next targets</h3>${listMarkup(data.targets, 'Targets will appear here.')}</div>
      </div>
      <div class="portal-instructor-note">
        <h3>Latest instructor update</h3>
        <p>${escapeHtml(data.latestNote)}</p>
        <div><span>${escapeHtml(data.instructor)}</span><span>Updated ${escapeHtml(updated)}</span></div>
      </div>
    </article>`;
};

const loadParentSwimmers = async uid => {
  const snapshot = await getDocs(query(collection(db, 'swimmers'), where('parentIds', 'array-contains', uid)));
  const container = document.getElementById('swimmerCards');
  container.innerHTML = snapshot.docs.map(swimmer => swimmerCardMarkup(swimmer.data())).join('');
  document.getElementById('noSwimmers').hidden = !snapshot.empty;
};

const lines = value => value.split('\n').map(item => item.trim()).filter(Boolean);

const loadAdminData = async () => {
  const [usersSnapshot, swimmersSnapshot] = await Promise.all([
    getDocs(query(collection(db, 'users'), where('role', '==', 'parent'))),
    getDocs(collection(db, 'swimmers'))
  ]);

  const parentSelect = swimmerForm.elements.parentUid;
  const currentValue = parentSelect.value;
  parentSelect.innerHTML = '<option value="">Select a registered parent</option>' + usersSnapshot.docs
    .map(userDoc => {
      const user = userDoc.data();
      return `<option value="${escapeHtml(userDoc.id)}">${escapeHtml(user.displayName || user.email)} — ${escapeHtml(user.email)}</option>`;
    }).join('');
  parentSelect.value = currentValue;

  const list = document.getElementById('adminSwimmerList');
  list.innerHTML = swimmersSnapshot.docs.map(swimmerDoc => {
    const swimmer = swimmerDoc.data();
    return `<article class="portal-admin-row">
      <div><strong>${escapeHtml(swimmer.name)}</strong><span>${escapeHtml(swimmer.stage)} · ${escapeHtml(swimmer.lessonDay || 'Day not set')}</span></div>
      <button class="portal-edit-button" type="button" data-edit-swimmer="${escapeHtml(swimmerDoc.id)}">Edit progress</button>
    </article>`;
  }).join('');
  document.getElementById('noAdminSwimmers').hidden = !swimmersSnapshot.empty;

  list.querySelectorAll('[data-edit-swimmer]').forEach(button => {
    button.addEventListener('click', async () => {
      const swimmerDoc = await getDoc(doc(db, 'swimmers', button.dataset.editSwimmer));
      if (!swimmerDoc.exists()) return;
      const swimmer = swimmerDoc.data();
      swimmerForm.elements.swimmerId.value = swimmerDoc.id;
      swimmerForm.elements.name.value = swimmer.name || '';
      swimmerForm.elements.parentUid.value = swimmer.parentIds?.[0] || '';
      swimmerForm.elements.stage.value = swimmer.stage || '';
      swimmerForm.elements.instructor.value = swimmer.instructor || '';
      swimmerForm.elements.lessonDay.value = swimmer.lessonDay || '';
      swimmerForm.elements.progress.value = swimmer.progress || 0;
      swimmerForm.elements.currentFocus.value = swimmer.currentFocus || '';
      swimmerForm.elements.achievements.value = (swimmer.achievements || []).join('\n');
      swimmerForm.elements.targets.value = (swimmer.targets || []).join('\n');
      swimmerForm.elements.latestNote.value = swimmer.latestNote || '';
      document.getElementById('swimmerFormTitle').textContent = `Update ${swimmer.name}`;
      swimmerForm.hidden = false;
      swimmerForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
};

document.getElementById('newSwimmerBtn').addEventListener('click', () => {
  swimmerForm.reset();
  swimmerForm.elements.swimmerId.value = '';
  swimmerForm.elements.progress.value = 0;
  document.getElementById('swimmerFormTitle').textContent = 'Add swimmer';
  swimmerForm.hidden = false;
  swimmerForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('cancelSwimmerBtn').addEventListener('click', () => {
  swimmerForm.hidden = true;
  swimmerForm.reset();
});

swimmerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(swimmerForm);
  const swimmerId = data.get('swimmerId');
  const swimmerData = {
    name: data.get('name').trim(),
    parentIds: [data.get('parentUid')],
    stage: data.get('stage').trim(),
    instructor: data.get('instructor').trim(),
    lessonDay: data.get('lessonDay').trim(),
    progress: Number(data.get('progress')),
    currentFocus: data.get('currentFocus').trim(),
    achievements: lines(data.get('achievements')),
    targets: lines(data.get('targets')),
    latestNote: data.get('latestNote').trim(),
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser.uid
  };

  try {
    if (swimmerId) {
      await updateDoc(doc(db, 'swimmers', swimmerId), swimmerData);
    } else {
      await addDoc(collection(db, 'swimmers'), {
        ...swimmerData,
        createdAt: serverTimestamp()
      });
    }
    swimmerForm.hidden = true;
    swimmerForm.reset();
    await loadAdminData();
    showNotice('The swimmer’s progress has been saved.', 'success');
  } catch (error) {
    showNotice('The progress could not be saved. Please check your instructor access and try again.', 'error');
  }
});

onAuthStateChanged(auth, async user => {
  authView.hidden = Boolean(user);
  dashboardView.hidden = !user;
  parentPanel.hidden = true;
  adminPanel.hidden = true;

  if (!user) {
    clearNotice();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (loginInProgress) {
    loginInProgress = false;
    showNotice('Signed in successfully. Welcome to the BPSwim portal.', 'success');
  } else {
    clearNotice();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.getElementById('dashboardGreeting').textContent = user.displayName
    ? `Welcome, ${user.displayName.split(' ')[0]}`
    : 'Swimming progress';
  document.getElementById('dashboardEmail').textContent = user.email;

  try {
    const userDocument = await getDoc(doc(db, 'users', user.uid));
    const role = userDocument.exists() ? userDocument.data().role : 'parent';
    if (role === 'admin') {
      adminPanel.hidden = false;
      await loadAdminData();
    } else {
      parentPanel.hidden = false;
      await loadParentSwimmers(user.uid);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    showNotice('We could not load the portal. Please refresh the page or contact BPSwim.', 'error');
  }
});

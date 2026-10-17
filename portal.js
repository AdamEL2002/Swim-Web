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
import { stageOutcomeId, swimEnglandSource, swimEnglandStages } from './swim-england-stages.js';

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
const stageChecklistEditor = document.getElementById('stageChecklistEditor');
const stageChecklistItems = document.getElementById('stageChecklistItems');
const stageChecklistCount = document.getElementById('stageChecklistCount');
const temporaryPassword = document.getElementById('temporaryPassword');
const temporaryPasswordToggle = document.getElementById('temporaryPasswordToggle');
let loginInProgress = false;
let activeStageProgress = {};
let pendingSignOutNotice = '';

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

temporaryPasswordToggle.addEventListener('click', () => {
  const isVisible = temporaryPassword.type === 'text';
  temporaryPassword.type = isVisible ? 'password' : 'text';
  temporaryPasswordToggle.textContent = isVisible ? 'Show' : 'Hide';
  temporaryPasswordToggle.setAttribute('aria-pressed', String(!isVisible));
  temporaryPassword.focus();
});

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
      accountStatus: 'active',
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser.uid
    });
    await signOut(parentCreatorAuth);
    form.reset();
    temporaryPassword.type = 'password';
    temporaryPasswordToggle.textContent = 'Show';
    temporaryPasswordToggle.setAttribute('aria-pressed', 'false');
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

const getStageOutcomes = stage => swimEnglandStages[stage] || [];

const getCompletedOutcomes = (stageProgress, stage) => {
  const completed = stageProgress?.[stage];
  return Array.isArray(completed) ? completed : [];
};

const calculateStageProgress = (stage, stageProgress) => {
  const outcomes = getStageOutcomes(stage);
  if (!outcomes.length) return null;
  return Math.round((getCompletedOutcomes(stageProgress, stage).length / outcomes.length) * 100);
};

const stageChecklistMarkup = data => {
  const outcomes = getStageOutcomes(data.stage);
  if (!outcomes.length) return '';
  const completed = new Set(getCompletedOutcomes(data.stageProgress, data.stage));
  const headingId = `stage-checklist-${String(data.name || 'swimmer').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return `
    <section class="portal-stage-checklist" aria-labelledby="${headingId}">
      <div class="portal-stage-checklist-head">
        <div>
          <p class="portal-eyebrow">Current award checklist</p>
          <h3 id="${headingId}">Swim England ${escapeHtml(data.stage)} requirements</h3>
        </div>
        <strong>${completed.size} of ${outcomes.length} complete</strong>
      </div>
      <ul>
        ${outcomes.map((outcome, index) => {
          const outcomeId = stageOutcomeId(data.stage, index);
          const achieved = completed.has(outcomeId);
          return `<li class="${achieved ? 'is-complete' : ''}"><span aria-hidden="true">${achieved ? '✓' : ''}</span><p>${escapeHtml(outcome)}</p></li>`;
        }).join('')}
      </ul>
      <a href="${swimEnglandSource}" target="_blank" rel="noopener noreferrer">View the official Swim England Stage 1–7 outcomes</a>
    </section>`;
};

const swimmerCardMarkup = data => {
  const calculatedProgress = calculateStageProgress(data.stage, data.stageProgress);
  const progress = calculatedProgress ?? Math.max(0, Math.min(100, Number(data.progress) || 0));
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
      ${stageChecklistMarkup(data)}
      <div class="portal-instructor-note">
        <h3>Latest instructor update</h3>
        <p>${escapeHtml(data.latestNote)}</p>
        <div><span>${escapeHtml(data.instructor)}</span><span>Updated ${escapeHtml(updated)}</span></div>
      </div>
    </article>`;
};

const swimmerChoiceMarkup = (data, index) => {
  const calculatedProgress = calculateStageProgress(data.stage, data.stageProgress);
  const progress = calculatedProgress ?? Math.max(0, Math.min(100, Number(data.progress) || 0));
  return `
    <button class="portal-swimmer-choice" type="button" data-swimmer-choice="${index}">
      <span>
        <small>${escapeHtml(data.lessonDay || 'BPSwim swimmer')}</small>
        <strong>${escapeHtml(data.name)}</strong>
        <span>${escapeHtml(data.stage)} &middot; ${progress}% complete</span>
      </span>
      <span class="portal-swimmer-choice-action">View progress <span aria-hidden="true">&rarr;</span></span>
    </button>`;
};

const loadParentSwimmers = async uid => {
  const snapshot = await getDocs(query(collection(db, 'swimmers'), where('parentIds', 'array-contains', uid)));
  const container = document.getElementById('swimmerCards');
  const swimmers = snapshot.docs
    .map(swimmer => swimmer.data())
    .filter(swimmer => !swimmer.archived);

  const showSwimmerChoices = () => {
    container.innerHTML = `
      <section class="portal-swimmer-choices" aria-labelledby="chooseSwimmerTitle">
        <div class="portal-swimmer-choices-heading">
          <p class="portal-eyebrow">Family account</p>
          <h2 id="chooseSwimmerTitle">Choose a swimmer</h2>
          <p>Select a child to view their stage, progress and latest instructor update.</p>
        </div>
        <div class="portal-swimmer-choice-grid">
          ${swimmers.map(swimmerChoiceMarkup).join('')}
        </div>
      </section>`;

    container.querySelectorAll('[data-swimmer-choice]').forEach(button => {
      button.addEventListener('click', () => {
        const swimmer = swimmers[Number(button.dataset.swimmerChoice)];
        container.innerHTML = `
          <button class="portal-back-to-swimmers" type="button"><span aria-hidden="true">&larr;</span> Back to children</button>
          ${swimmerCardMarkup(swimmer)}`;
        container.querySelector('.portal-back-to-swimmers').addEventListener('click', showSwimmerChoices);
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  if (swimmers.length > 1) {
    showSwimmerChoices();
  } else {
    container.innerHTML = swimmers.map(swimmerCardMarkup).join('');
  }
  document.getElementById('noSwimmers').hidden = swimmers.length > 0;
};

const captureStageChecklist = () => {
  const stage = stageChecklistEditor.dataset.stage;
  if (!stage || !swimEnglandStages[stage]) return;
  activeStageProgress[stage] = Array.from(stageChecklistItems.querySelectorAll('input:checked'))
    .map(input => input.value);
};

const updateStageEditorCount = () => {
  const total = stageChecklistItems.querySelectorAll('input').length;
  const completed = stageChecklistItems.querySelectorAll('input:checked').length;
  stageChecklistCount.textContent = `${completed} of ${total} complete`;
};

const renderStageEditor = stage => {
  const outcomes = getStageOutcomes(stage);
  if (!outcomes.length) {
    stageChecklistEditor.hidden = true;
    stageChecklistEditor.dataset.stage = '';
    stageChecklistItems.innerHTML = '';
    return;
  }

  const completed = new Set(getCompletedOutcomes(activeStageProgress, stage));
  stageChecklistEditor.hidden = false;
  stageChecklistEditor.dataset.stage = stage;
  stageChecklistItems.innerHTML = outcomes.map((outcome, index) => {
    const outcomeId = stageOutcomeId(stage, index);
    return `<label class="portal-stage-check">
      <input type="checkbox" value="${outcomeId}" ${completed.has(outcomeId) ? 'checked' : ''} />
      <span>${escapeHtml(outcome)}</span>
    </label>`;
  }).join('');
  stageChecklistItems.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => {
      captureStageChecklist();
      updateStageEditorCount();
    });
  });
  updateStageEditorCount();
};

swimmerForm.elements.stage.addEventListener('change', event => {
  captureStageChecklist();
  renderStageEditor(event.target.value);
});

const loadAdminData = async () => {
  const [usersSnapshot, swimmersSnapshot] = await Promise.all([
    getDocs(query(collection(db, 'users'), where('role', '==', 'parent'))),
    getDocs(collection(db, 'swimmers'))
  ]);
  const activeSwimmerDocs = swimmersSnapshot.docs.filter(swimmerDoc => !swimmerDoc.data().archived);
  const activeParentDocs = usersSnapshot.docs.filter(userDoc => userDoc.data().accountStatus !== 'inactive');

  const parentSelect = swimmerForm.elements.parentUid;
  const currentValue = parentSelect.value;
  parentSelect.innerHTML = '<option value="">Select a registered parent</option>' + activeParentDocs
    .map(userDoc => {
      const user = userDoc.data();
      return `<option value="${escapeHtml(userDoc.id)}">${escapeHtml(user.displayName || user.email)} — ${escapeHtml(user.email)}</option>`;
    }).join('');
  parentSelect.value = currentValue;

  const parentAccountList = document.getElementById('parentAccountList');
  parentAccountList.innerHTML = usersSnapshot.docs.map(userDoc => {
    const user = userDoc.data();
    const parentName = user.displayName || 'Parent account';
    const isInactive = user.accountStatus === 'inactive';
    const linkedSwimmers = activeSwimmerDocs.filter(swimmerDoc => swimmerDoc.data().parentIds?.includes(userDoc.id)).length;
    return `<article class="portal-parent-account-row">
      <div class="portal-parent-account-details">
        <strong>${escapeHtml(parentName)}</strong>
        <a href="mailto:${escapeHtml(user.email)}">${escapeHtml(user.email)}</a>
        <span>${isInactive ? 'Access deactivated' : `${linkedSwimmers} active swimmer${linkedSwimmers === 1 ? '' : 's'}`}</span>
      </div>
      <div class="portal-parent-account-actions">
        <button class="portal-reset-button" type="button" data-reset-email="${escapeHtml(user.email)}" ${isInactive ? 'disabled' : ''}>Send password reset</button>
        <button class="portal-account-toggle ${isInactive ? 'is-restore' : ''}" type="button" data-parent-account="${escapeHtml(userDoc.id)}" data-parent-name="${escapeHtml(parentName)}" data-parent-action="${isInactive ? 'restore' : 'deactivate'}" data-linked-swimmers="${linkedSwimmers}">${isInactive ? 'Restore access' : 'Deactivate parent'}</button>
      </div>
    </article>`;
  }).join('');
  document.getElementById('noParentAccounts').hidden = !usersSnapshot.empty;

  parentAccountList.querySelectorAll('[data-reset-email]').forEach(button => {
    button.addEventListener('click', async () => {
      const email = button.dataset.resetEmail;
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Sending...';
      try {
        await sendPasswordResetEmail(auth, email, {
          url: 'https://www.bpswim.com/portal.html'
        });
        showNotice(`A password reset email has been sent to ${email}.`, 'success');
      } catch (error) {
        showNotice(friendlyAuthError(error), 'error');
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  });

  parentAccountList.querySelectorAll('[data-parent-account]').forEach(button => {
    button.addEventListener('click', async () => {
      const isDeactivating = button.dataset.parentAction === 'deactivate';
      const linkedSwimmers = Number(button.dataset.linkedSwimmers);
      const parentName = button.dataset.parentName;
      if (isDeactivating && linkedSwimmers > 0) {
        showNotice(`Remove ${parentName}’s active swimmer record${linkedSwimmers === 1 ? '' : 's'} before deactivating the parent account.`, 'error');
        return;
      }
      const confirmed = window.confirm(isDeactivating
        ? `Deactivate ${parentName}’s portal access? They will no longer be able to sign in.`
        : `Restore ${parentName}’s portal access?`);
      if (!confirmed) return;

      try {
        await updateDoc(doc(db, 'users', button.dataset.parentAccount), {
          accountStatus: isDeactivating ? 'inactive' : 'active',
          accountStatusUpdatedAt: serverTimestamp(),
          accountStatusUpdatedBy: auth.currentUser.uid
        });
        await loadAdminData();
        showNotice(isDeactivating
          ? `${parentName}’s portal access has been deactivated.`
          : `${parentName}’s portal access has been restored.`, 'success');
      } catch (error) {
        showNotice('The parent account could not be updated. Please try again.', 'error');
      }
    });
  });

  const list = document.getElementById('adminSwimmerList');
  list.innerHTML = activeSwimmerDocs.map(swimmerDoc => {
    const swimmer = swimmerDoc.data();
    return `<article class="portal-admin-row">
      <div><strong>${escapeHtml(swimmer.name)}</strong><span>${escapeHtml(swimmer.stage)} · ${escapeHtml(swimmer.lessonDay || 'Day not set')}</span></div>
      <div class="portal-admin-row-actions">
        <button class="portal-edit-button" type="button" data-edit-swimmer="${escapeHtml(swimmerDoc.id)}">Edit progress</button>
        <button class="portal-remove-button" type="button" data-remove-swimmer="${escapeHtml(swimmerDoc.id)}" data-swimmer-name="${escapeHtml(swimmer.name)}">Remove swimmer</button>
      </div>
    </article>`;
  }).join('');
  document.getElementById('noAdminSwimmers').hidden = activeSwimmerDocs.length > 0;

  list.querySelectorAll('[data-edit-swimmer]').forEach(button => {
    button.addEventListener('click', async () => {
      const swimmerDoc = await getDoc(doc(db, 'swimmers', button.dataset.editSwimmer));
      if (!swimmerDoc.exists()) return;
      const swimmer = swimmerDoc.data();
      swimmerForm.elements.swimmerId.value = swimmerDoc.id;
      swimmerForm.elements.name.value = swimmer.name || '';
      swimmerForm.elements.parentUid.value = swimmer.parentIds?.[0] || '';
      swimmerForm.elements.stage.value = swimmer.stage || '';
      activeStageProgress = structuredClone(swimmer.stageProgress || {});
      swimmerForm.elements.instructor.value = swimmer.instructor || '';
      swimmerForm.elements.lessonDay.value = swimmer.lessonDay || '';
      renderStageEditor(swimmer.stage || '');
      swimmerForm.elements.latestNote.value = swimmer.latestNote || '';
      document.getElementById('swimmerFormTitle').textContent = `Update ${swimmer.name}`;
      swimmerForm.hidden = false;
      swimmerForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  list.querySelectorAll('[data-remove-swimmer]').forEach(button => {
    button.addEventListener('click', async () => {
      const swimmerName = button.dataset.swimmerName;
      if (!window.confirm(`Remove ${swimmerName} from the parent portal? Their saved progress will be kept securely in case it is needed later.`)) return;
      try {
        await updateDoc(doc(db, 'swimmers', button.dataset.removeSwimmer), {
          archived: true,
          archivedAt: serverTimestamp(),
          archivedBy: auth.currentUser.uid
        });
        if (swimmerForm.elements.swimmerId.value === button.dataset.removeSwimmer) {
          swimmerForm.hidden = true;
          swimmerForm.reset();
        }
        await loadAdminData();
        showNotice(`${swimmerName} has been removed from the parent portal.`, 'success');
      } catch (error) {
        showNotice('The swimmer could not be removed. Please try again.', 'error');
      }
    });
  });
};

document.getElementById('newSwimmerBtn').addEventListener('click', () => {
  swimmerForm.reset();
  activeStageProgress = {};
  renderStageEditor('');
  swimmerForm.elements.swimmerId.value = '';
  document.getElementById('swimmerFormTitle').textContent = 'Add swimmer';
  swimmerForm.hidden = false;
  swimmerForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('cancelSwimmerBtn').addEventListener('click', () => {
  swimmerForm.hidden = true;
  swimmerForm.reset();
  activeStageProgress = {};
  renderStageEditor('');
});

swimmerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(swimmerForm);
  const swimmerId = data.get('swimmerId');
  captureStageChecklist();
  const stage = data.get('stage').trim();
  const calculatedProgress = calculateStageProgress(stage, activeStageProgress);
  const swimmerData = {
    name: data.get('name').trim(),
    parentIds: [data.get('parentUid')],
    stage,
    instructor: data.get('instructor').trim(),
    lessonDay: data.get('lessonDay').trim(),
    progress: calculatedProgress ?? 0,
    stageProgress: activeStageProgress,
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
    if (pendingSignOutNotice) {
      showNotice(pendingSignOutNotice, 'error');
      pendingSignOutNotice = '';
    } else {
      clearNotice();
    }
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
    const userData = userDocument.exists() ? userDocument.data() : {};
    const role = userData.role || 'parent';
    if (role === 'parent' && userData.accountStatus === 'inactive') {
      pendingSignOutNotice = 'This parent account has been deactivated. Please contact BPSwim if you need access restored.';
      await signOut(auth);
      return;
    }
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
